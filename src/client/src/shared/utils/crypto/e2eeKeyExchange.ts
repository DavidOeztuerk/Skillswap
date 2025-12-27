/**
 * E2EE Key Exchange Manager
 *
 * Orchestriert das SignalR Key Exchange Protocol mit ECDSA Signaturen.
 * Nutzt die core/crypto Primitives für alle kryptographischen Operationen.
 */

import {
  // Types
  type ECDHKeyPair,
  type ECDSAKeyPair,
  type KeyExchangeMessage,
  type KeyGeneration,
  // ECDH Functions
  generateECDHKeyPair,
  // ECDSA Functions
  generateECDSAKeyPair,
  signKeyExchangeMessage,
  verifyKeyExchangeMessage,
  importECDSAVerificationKey,
  // Encoding
  generateNonce,
  arrayBufferToHex,
  // Constants
  KEY_EXCHANGE_TIMEOUT_MS,
  MAX_KEY_EXCHANGE_RETRIES,
  KEY_EXCHANGE_DEBOUNCE_MS,
  NONCE_MAX_AGE_MS,
  NONCE_CLEANUP_INTERVAL_MS,
} from '../../core/crypto';
import type { E2EEManager } from './e2eeVideoEncryption';
import type { HubConnection } from '@microsoft/signalr';

// ============================================================================
// Types
// ============================================================================

export interface KeyExchangeEvents {
  /**
   * Called when key exchange is complete and encryption can be enabled.
   * IMPORTANT: This callback can be async - the caller WILL await it.
   * All encryption setup should complete before this returns.
   */
  onKeyExchangeComplete: (
    fingerprint: string,
    generation: number,
    peerSigningPublicKey?: string,
    peerSigningFingerprint?: string
  ) => void | Promise<void>;
  /**
   * Called when keys are rotated (both initiator and responder).
   * IMPORTANT: This callback can be async - the caller WILL await it.
   * Worker key updates should complete before this returns.
   */
  onKeyRotation: (generation: number) => void | Promise<void>;
  onKeyExchangeError: (error: string) => void;
  onVerificationRequired?: (localFp: string, remoteFp: string) => void;
}

type KeyExchangeState = 'idle' | 'sending-offer' | 'waiting-answer' | 'complete' | 'error';

// ============================================================================
// Manager Class
// ============================================================================

export class E2EEKeyExchangeManager {
  private e2eeManager: E2EEManager;
  private hubConnection: HubConnection | null = null;
  private roomId = '';
  private targetUserId = '';
  private isInitiator = false;

  // Key Pairs
  private localECDHKeyPair: ECDHKeyPair | null = null;
  private localECDSAKeyPair: ECDSAKeyPair | null = null;
  private peerECDSAVerificationKey: CryptoKey | null = null;
  private peerSigningPublicKeyBase64: string | null = null;
  private peerSigningFingerprint: string | null = null;
  // Remote ECDH Public Key - needed for key rotation!
  private remotePeerPublicKeyBase64: string | null = null;

  // State
  private state: KeyExchangeState = 'idle';
  private keyGeneration = 0;
  private retryCount = 0;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastKeyExchangeCompleteTime = 0; // Debounce: track last successful exchange

  // Nonce Replay Protection - LRU Map mit Timestamps
  // Max 100 Einträge für Memory-Effizienz (statt 1000)
  private static readonly MAX_NONCE_CACHE_SIZE = 100;
  private usedNonces = new Map<string, number>(); // nonce -> timestamp
  private nonceCleanupInterval: ReturnType<typeof setInterval> | null = null;

  // Events
  private events: KeyExchangeEvents;

  constructor(e2eeManager: E2EEManager, events: KeyExchangeEvents) {
    this.e2eeManager = e2eeManager;
    this.events = events;

    // Start nonce cleanup
    this.nonceCleanupInterval = setInterval(() => {
      this.cleanupOldNonces();
    }, NONCE_CLEANUP_INTERVAL_MS);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getState(): KeyExchangeState {
    return this.state;
  }

  getLocalFingerprint(): string | null {
    return this.localECDHKeyPair?.fingerprint ?? null;
  }

  getLocalSigningPublicKey(): string | null {
    return this.localECDSAKeyPair?.publicKeyBase64 ?? null;
  }

  getLocalSigningFingerprint(): string | null {
    return this.localECDSAKeyPair?.fingerprint ?? null;
  }

  getPeerSigningPublicKey(): string | null {
    return this.peerSigningPublicKeyBase64;
  }

  getPeerSigningFingerprint(): string | null {
    return this.peerSigningFingerprint;
  }

  /**
   * Initialisiert den Key Exchange Manager
   */
  async initialize(
    hubConnection: HubConnection,
    roomId: string,
    targetUserId: string,
    isInitiator: boolean,
    _localUserId?: string
  ): Promise<void> {
    this.hubConnection = hubConnection;
    this.roomId = roomId;
    this.targetUserId = targetUserId;
    this.isInitiator = isInitiator;

    // Generate key pairs
    this.localECDHKeyPair = await generateECDHKeyPair();
    this.localECDSAKeyPair = await generateECDSAKeyPair();

    console.debug('🔐 KeyExchange: Initialized', {
      isInitiator,
      localFingerprint: `${String(this.localECDHKeyPair.fingerprint).slice(0, 16)}...`,
    });

    // Setup SignalR handlers
    this.setupSignalRHandlers();

    // If initiator, start key exchange
    if (isInitiator) {
      await this.sendKeyOffer();
    }
  }

  /**
   * Startet den Key Exchange neu (z.B. nach Reconnect)
   */
  async retriggerKeyExchange(): Promise<void> {
    if (this.state === 'complete') {
      console.debug('🔐 KeyExchange: Already complete, skipping retrigger');
      return;
    }

    if (this.isInitiator) {
      console.debug('🔐 KeyExchange: Retriggering as initiator');
      await this.sendKeyOffer();
    }
  }

  /**
   * Verarbeitet eine eingehende Key Exchange Message
   */
  async handleIncomingMessage(message: KeyExchangeMessage): Promise<void> {
    // Validate nonce (replay protection)
    if (this.usedNonces.has(message.nonce)) {
      console.warn('⚠️ KeyExchange: Replay attack detected - nonce already used');
      return;
    }

    // Check nonce age
    const nonceAge = Date.now() - message.timestamp;
    if (nonceAge > NONCE_MAX_AGE_MS) {
      console.warn('⚠️ KeyExchange: Message too old, ignoring');
      return;
    }

    this.addNonce(message.nonce);

    switch (message.type) {
      case 'keyOffer':
        await this.handleKeyOffer(message);
        break;
      case 'keyAnswer':
        await this.handleKeyAnswer(message);
        break;
      case 'keyRotation':
        await this.handleKeyRotation(message);
        break;
      default:
        console.warn('⚠️ KeyExchange: Unknown message type:', message.type);
        break;
    }
  }

  /**
   * Rotiert die Keys (nur Initiator)
   *
   * KRITISCH: Der Initiator muss AUCH einen neuen Shared Key ableiten!
   * Local_New_Private + Remote_Old_Public = New_Shared_Key
   *
   * WICHTIG FÜR RACE CONDITION FIX:
   * 1. Generiere neuen Key
   * 2. Leite neuen Shared Key ab
   * 3. SOFORT Worker aktualisieren (onKeyRotation)
   * 4. DANN Message senden
   *
   * Dies verhindert, dass Frames mit dem neuen Key verschlüsselt werden,
   * bevor der Worker den neuen Key hat.
   */
  async rotateKeys(): Promise<void> {
    if (!this.isInitiator) {
      console.warn('⚠️ KeyExchange: Only initiator can rotate keys');
      return;
    }

    if (!this.remotePeerPublicKeyBase64 || !this.localECDHKeyPair) {
      console.error('❌ KeyExchange: Cannot rotate - missing keys');
      return;
    }

    // Generate new ECDH key pair
    this.localECDHKeyPair = await generateECDHKeyPair();
    this.keyGeneration++;

    console.debug(`🔄 KeyExchange: Rotating keys to generation ${this.keyGeneration}`);

    // KRITISCH: Initiator muss auch neuen Shared Key ableiten!
    // Direkt e2eeManager.deriveSharedKey() aufrufen (OHNE onKeyExchangeComplete)
    // Das updatet E2EEManager.encryptionKey und E2EEManager.keyGeneration
    await this.e2eeManager.deriveSharedKey(
      this.localECDHKeyPair.privateKey,
      this.remotePeerPublicKeyBase64
    );

    // RACE CONDITION FIX: Worker SOFORT aktualisieren BEVOR Message gesendet wird
    // Dies stellt sicher, dass der Worker den neuen Key hat, bevor neue Frames
    // mit diesem Key verschlüsselt werden
    console.debug(`🔄 KeyExchange: Updating worker with new key BEFORE sending rotation message`);
    await this.events.onKeyRotation(this.keyGeneration);

    // DANN an andere Seite senden (Worker ist jetzt bereits aktualisiert)
    await this.sendKeyRotationMessage();
  }

  /**
   * Sendet die Key Rotation Message (intern, ohne Worker-Update)
   */
  private async sendKeyRotationMessage(): Promise<void> {
    if (!this.hubConnection || !this.localECDHKeyPair || !this.localECDSAKeyPair) return;

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();

      // Sign first, then create the immutable message
      const signature = await signKeyExchangeMessage(
        this.localECDSAKeyPair.signingKey,
        this.localECDHKeyPair.publicKeyBase64,
        timestamp,
        nonce
      );

      const message: KeyExchangeMessage = {
        type: 'keyRotation',
        publicKey: this.localECDHKeyPair.publicKeyBase64,
        fingerprint: this.localECDHKeyPair.fingerprint,
        signature,
        generation: this.keyGeneration as KeyGeneration,
        timestamp,
        nonce,
      };

      // Use unified ForwardE2EEMessage with audit logging
      const result = await this.hubConnection.invoke<{ success: boolean; errorMessage?: string }>(
        'ForwardE2EEMessage',
        {
          type: 3, // KeyRotation
          targetUserId: this.targetUserId,
          roomId: this.roomId,
          encryptedPayload: JSON.stringify(message),
          keyFingerprint: String(this.localECDHKeyPair.fingerprint).slice(0, 16),
          keyGeneration: this.keyGeneration,
          clientTimestamp: new Date().toISOString(),
        }
      );

      if (!result.success) {
        throw new Error(result.errorMessage ?? 'Failed to send key rotation');
      }

      console.debug('🔄 KeyExchange: Sent key rotation message');
    } catch (e) {
      console.error('❌ KeyExchange: Failed to send key rotation:', e);
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.nonceCleanupInterval) {
      clearInterval(this.nonceCleanupInterval);
      this.nonceCleanupInterval = null;
    }

    this.usedNonces.clear();
    this.localECDHKeyPair = null;
    this.localECDSAKeyPair = null;
    this.peerECDSAVerificationKey = null;
    this.peerSigningPublicKeyBase64 = null;
    this.peerSigningFingerprint = null;
    this.remotePeerPublicKeyBase64 = null;
    this.state = 'idle';
    this.keyGeneration = 0;
    this.retryCount = 0;

    console.debug('🧹 KeyExchange: Cleanup complete');
  }

  // ============================================================================
  // Private Methods - SignalR
  // ============================================================================

  private setupSignalRHandlers(): void {
    if (!this.hubConnection) return;

    // Handle key offer
    this.hubConnection.on('ReceiveKeyOffer', async (fromUserId: string, data: string) => {
      if (fromUserId !== this.targetUserId) return;

      try {
        const message = JSON.parse(data) as KeyExchangeMessage;
        await this.handleKeyOffer(message);
      } catch (e) {
        console.error('❌ KeyExchange: Failed to parse key offer:', e);
      }
    });

    // Handle key answer
    this.hubConnection.on('ReceiveKeyAnswer', async (fromUserId: string, data: string) => {
      if (fromUserId !== this.targetUserId) return;

      try {
        const message = JSON.parse(data) as KeyExchangeMessage;
        await this.handleKeyAnswer(message);
      } catch (e) {
        console.error('❌ KeyExchange: Failed to parse key answer:', e);
      }
    });

    // Handle key rotation
    this.hubConnection.on('ReceiveKeyRotation', async (fromUserId: string, data: string) => {
      if (fromUserId !== this.targetUserId) return;

      try {
        const message = JSON.parse(data) as KeyExchangeMessage;
        await this.handleKeyRotation(message);
      } catch (e) {
        console.error('❌ KeyExchange: Failed to parse key rotation:', e);
      }
    });
  }

  // ============================================================================
  // Private Methods - Sending Messages
  // ============================================================================

  private async sendKeyOffer(): Promise<void> {
    if (!this.hubConnection || !this.localECDHKeyPair || !this.localECDSAKeyPair) {
      console.error('❌ KeyExchange: Cannot send offer - not initialized');
      return;
    }

    // Debounce: Don't send new offers too quickly after a successful exchange
    const timeSinceLastExchange = Date.now() - this.lastKeyExchangeCompleteTime;
    if (this.lastKeyExchangeCompleteTime > 0 && timeSinceLastExchange < KEY_EXCHANGE_DEBOUNCE_MS) {
      console.debug(
        `⏳ KeyExchange: Debouncing - last exchange was ${timeSinceLastExchange}ms ago, waiting...`
      );
      return;
    }

    this.state = 'sending-offer';

    try {
      const nonce = generateNonce();
      const timestamp = Date.now();

      // Sign first, then create the immutable message
      const signature = await signKeyExchangeMessage(
        this.localECDSAKeyPair.signingKey,
        this.localECDHKeyPair.publicKeyBase64,
        timestamp,
        nonce
      );

      const message: KeyExchangeMessage = {
        type: 'keyOffer',
        publicKey: this.localECDHKeyPair.publicKeyBase64,
        fingerprint: this.localECDHKeyPair.fingerprint,
        signature,
        generation: this.keyGeneration as KeyGeneration,
        timestamp,
        nonce,
        signingPublicKey: this.localECDSAKeyPair.publicKeyBase64,
      };

      // Use unified ForwardE2EEMessage with audit logging
      const result = await this.hubConnection.invoke<{ success: boolean; errorMessage?: string }>(
        'ForwardE2EEMessage',
        {
          type: 1, // KeyOffer
          targetUserId: this.targetUserId,
          roomId: this.roomId,
          encryptedPayload: JSON.stringify(message),
          keyFingerprint: String(this.localECDHKeyPair.fingerprint).slice(0, 16),
          keyGeneration: this.keyGeneration,
          clientTimestamp: new Date().toISOString(),
        }
      );

      if (!result.success) {
        throw new Error(result.errorMessage ?? 'Failed to send key offer');
      }

      this.state = 'waiting-answer';
      console.debug('📤 KeyExchange: Sent key offer');

      // Set retry timeout
      this.scheduleRetry();
    } catch (e) {
      console.error('❌ KeyExchange: Failed to send key offer:', e);
      this.state = 'error';
      this.events.onKeyExchangeError('Failed to send key offer');
    }
  }

  private async sendKeyAnswer(peerPublicKeyBase64: string): Promise<void> {
    if (!this.hubConnection || !this.localECDHKeyPair || !this.localECDSAKeyPair) {
      console.error('❌ KeyExchange: Cannot send answer - not initialized');
      return;
    }

    try {
      const nonce = generateNonce();

      const timestamp = Date.now();

      // Sign first, then create the immutable message
      const signature = await signKeyExchangeMessage(
        this.localECDSAKeyPair.signingKey,
        this.localECDHKeyPair.publicKeyBase64,
        timestamp,
        nonce
      );

      const message: KeyExchangeMessage = {
        type: 'keyAnswer',
        publicKey: this.localECDHKeyPair.publicKeyBase64,
        fingerprint: this.localECDHKeyPair.fingerprint,
        signature,
        generation: this.keyGeneration as KeyGeneration,
        timestamp,
        nonce,
        signingPublicKey: this.localECDSAKeyPair.publicKeyBase64,
      };

      // Use unified ForwardE2EEMessage with audit logging
      const result = await this.hubConnection.invoke<{ success: boolean; errorMessage?: string }>(
        'ForwardE2EEMessage',
        {
          type: 2, // KeyAnswer
          targetUserId: this.targetUserId,
          roomId: this.roomId,
          encryptedPayload: JSON.stringify(message),
          keyFingerprint: String(this.localECDHKeyPair.fingerprint).slice(0, 16),
          keyGeneration: this.keyGeneration,
          clientTimestamp: new Date().toISOString(),
        }
      );

      if (!result.success) {
        throw new Error(result.errorMessage ?? 'Failed to send key answer');
      }

      console.debug('📤 KeyExchange: Sent key answer');

      // Derive shared key
      await this.deriveAndSetSharedKey(peerPublicKeyBase64);
    } catch (e) {
      console.error('❌ KeyExchange: Failed to send key answer:', e);
      this.state = 'error';
      this.events.onKeyExchangeError('Failed to send key answer');
    }
  }

  // ============================================================================
  // Private Methods - Handling Messages
  // ============================================================================

  private async handleKeyOffer(message: KeyExchangeMessage): Promise<void> {
    console.debug('📥 KeyExchange: Received key offer');

    try {
      // Import and store peer's signing key for future verification
      if (message.signingPublicKey) {
        this.peerECDSAVerificationKey = await importECDSAVerificationKey(message.signingPublicKey);
        this.peerSigningPublicKeyBase64 = message.signingPublicKey;

        // Calculate peer's signing fingerprint
        const fingerprintBuffer = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(message.signingPublicKey)
        );
        this.peerSigningFingerprint = arrayBufferToHex(fingerprintBuffer);
      }

      // Verify signature
      if (this.peerECDSAVerificationKey) {
        const isValid = await verifyKeyExchangeMessage(
          this.peerECDSAVerificationKey,
          message.publicKey,
          message.timestamp,
          message.nonce,
          message.signature
        );
        if (!isValid) {
          console.error('❌ KeyExchange: Invalid signature on key offer');
          this.events.onKeyExchangeError('Invalid signature');
          return;
        }
      }

      // Update key generation
      this.keyGeneration = message.generation;

      // Store remote peer's public key for future key rotations
      this.remotePeerPublicKeyBase64 = message.publicKey;

      // Send answer
      await this.sendKeyAnswer(message.publicKey);
    } catch (e) {
      console.error('❌ KeyExchange: Failed to handle key offer:', e);
      this.events.onKeyExchangeError('Failed to process key offer');
    }
  }

  private async handleKeyAnswer(message: KeyExchangeMessage): Promise<void> {
    // RACE CONDITION FIX: Accept answers in BOTH 'waiting-answer' AND 'sending-offer' states.
    // During retries, state temporarily becomes 'sending-offer', but an answer from the peer
    // is still valid and should be processed. Only ignore if we're 'idle', 'complete', or 'error'.
    if (this.state !== 'waiting-answer' && this.state !== 'sending-offer') {
      console.debug(`📥 KeyExchange: Received answer but state is '${this.state}', ignoring`);
      return;
    }

    console.debug(`📥 KeyExchange: Received key answer (state was '${this.state}')`);

    // Cancel retry
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    try {
      // Import peer's signing key
      if (message.signingPublicKey) {
        this.peerECDSAVerificationKey = await importECDSAVerificationKey(message.signingPublicKey);
        this.peerSigningPublicKeyBase64 = message.signingPublicKey;

        const fingerprintBuffer = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(message.signingPublicKey)
        );
        this.peerSigningFingerprint = arrayBufferToHex(fingerprintBuffer);
      }

      // Verify signature
      if (this.peerECDSAVerificationKey) {
        const isValid = await verifyKeyExchangeMessage(
          this.peerECDSAVerificationKey,
          message.publicKey,
          message.timestamp,
          message.nonce,
          message.signature
        );
        if (!isValid) {
          console.error('❌ KeyExchange: Invalid signature on key answer');
          this.events.onKeyExchangeError('Invalid signature');
          return;
        }
      }

      // Store remote peer's public key for future key rotations
      this.remotePeerPublicKeyBase64 = message.publicKey;

      // Derive shared key
      await this.deriveAndSetSharedKey(message.publicKey);
    } catch (e) {
      console.error('❌ KeyExchange: Failed to handle key answer:', e);
      this.events.onKeyExchangeError('Failed to process key answer');
    }
  }

  private async handleKeyRotation(message: KeyExchangeMessage): Promise<void> {
    console.debug('📥 KeyExchange: Received key rotation');

    try {
      // Verify signature
      if (this.peerECDSAVerificationKey) {
        const isValid = await verifyKeyExchangeMessage(
          this.peerECDSAVerificationKey,
          message.publicKey,
          message.timestamp,
          message.nonce,
          message.signature
        );
        if (!isValid) {
          console.error('❌ KeyExchange: Invalid signature on key rotation');
          return;
        }
      }

      // Update generation
      this.keyGeneration = message.generation;

      // Derive new shared key
      await this.deriveAndSetSharedKey(message.publicKey);

      // CRITICAL: Await the callback to ensure worker keys are updated
      await this.events.onKeyRotation(this.keyGeneration);
    } catch (e) {
      console.error('❌ KeyExchange: Failed to handle key rotation:', e);
    }
  }

  // ============================================================================
  // Private Methods - Key Derivation
  // ============================================================================

  private async deriveAndSetSharedKey(peerPublicKeyBase64: string): Promise<void> {
    if (!this.localECDHKeyPair) {
      throw new Error('Local ECDH key pair not initialized');
    }

    // Derive shared key using E2EEManager
    const keyMaterial = await this.e2eeManager.deriveSharedKey(
      this.localECDHKeyPair.privateKey,
      peerPublicKeyBase64
    );

    this.state = 'complete';
    this.lastKeyExchangeCompleteTime = Date.now(); // Mark completion time for debounce
    this.retryCount = 0; // Reset retry count on success

    // Trigger verification if needed
    if (this.events.onVerificationRequired && this.peerSigningFingerprint) {
      this.events.onVerificationRequired(
        (this.localECDSAKeyPair?.fingerprint ?? '') as string,
        this.peerSigningFingerprint
      );
    }

    // CRITICAL: Await the callback to ensure encryption is fully set up
    // before we consider the key exchange complete
    await this.events.onKeyExchangeComplete(
      keyMaterial.publicKeyFingerprint,
      keyMaterial.generation,
      this.peerSigningPublicKeyBase64 ?? undefined,
      this.peerSigningFingerprint ?? undefined
    );

    console.debug('✅ KeyExchange: Complete', {
      generation: keyMaterial.generation,
      fingerprint: `${String(keyMaterial.publicKeyFingerprint).slice(0, 16)}...`,
    });
  }

  // ============================================================================
  // Private Methods - Retry & Cleanup
  // ============================================================================

  private scheduleRetry(): void {
    if (this.retryCount >= MAX_KEY_EXCHANGE_RETRIES) {
      console.error('❌ KeyExchange: Max retries exceeded');
      this.state = 'error';
      this.events.onKeyExchangeError('Key exchange failed after max retries');
      return;
    }

    this.retryTimeout = setTimeout(() => {
      // Only retry if still waiting and not complete
      if (this.state === 'waiting-answer' || this.state === 'sending-offer') {
        // Double-check we haven't completed in the meantime
        if (this.lastKeyExchangeCompleteTime > 0) {
          const timeSinceComplete = Date.now() - this.lastKeyExchangeCompleteTime;
          if (timeSinceComplete < KEY_EXCHANGE_DEBOUNCE_MS) {
            console.debug('🔄 KeyExchange: Skipping retry - exchange completed recently');
            return;
          }
        }
        console.debug(
          `🔄 KeyExchange: Retrying (attempt ${this.retryCount + 1}/${MAX_KEY_EXCHANGE_RETRIES})...`
        );
        this.retryCount++;
        void this.sendKeyOffer();
      }
    }, KEY_EXCHANGE_TIMEOUT_MS);
  }

  /**
   * Fügt eine Nonce zur LRU-Map hinzu
   * Entfernt die älteste Nonce wenn die Map voll ist
   */
  private addNonce(nonce: string): void {
    // Wenn die Map voll ist, entferne die älteste Nonce (LRU)
    if (this.usedNonces.size >= E2EEKeyExchangeManager.MAX_NONCE_CACHE_SIZE) {
      // Finde die älteste Nonce (kleinster Timestamp)
      let oldestNonce: string | null = null;
      let oldestTime = Infinity;

      for (const [n, timestamp] of this.usedNonces) {
        if (timestamp < oldestTime) {
          oldestTime = timestamp;
          oldestNonce = n;
        }
      }

      if (oldestNonce) {
        this.usedNonces.delete(oldestNonce);
      }
    }

    // Füge die neue Nonce hinzu
    this.usedNonces.set(nonce, Date.now());
  }

  private cleanupOldNonces(): void {
    // Entferne Nonces die älter als NONCE_MAX_AGE_MS sind
    const now = Date.now();
    const expiredNonces: string[] = [];

    for (const [nonce, timestamp] of this.usedNonces) {
      if (now - timestamp > NONCE_MAX_AGE_MS) {
        expiredNonces.push(nonce);
      }
    }

    for (const nonce of expiredNonces) {
      this.usedNonces.delete(nonce);
    }

    // Falls die Map immer noch zu groß ist (sollte nicht passieren mit LRU),
    // entferne die ältesten Einträge
    while (this.usedNonces.size > E2EEKeyExchangeManager.MAX_NONCE_CACHE_SIZE) {
      let oldestNonce: string | null = null;
      let oldestTime = Infinity;

      for (const [n, timestamp] of this.usedNonces) {
        if (timestamp < oldestTime) {
          oldestTime = timestamp;
          oldestNonce = n;
        }
      }

      if (oldestNonce) {
        this.usedNonces.delete(oldestNonce);
      } else {
        break; // Sicherheitsabbruch
      }
    }
  }
}
