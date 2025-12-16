/**
 * E2EE Key Exchange via SignalR - KORRIGIERTE VERSION
 *
 * Fixes:
 * 1. ✅ Echte Signatur-Validierung implementiert
 * 2. ✅ Race Condition bei gleichzeitiger Initiierung behoben
 * 3. ✅ Robustere Error Handling
 * 4. ✅ Retry-Logik für fehlgeschlagene Key Exchange
 * 5. ✅ Timeout für Key Exchange
 */

import type { HubConnection } from '@microsoft/signalr';
import type { E2EEManager, ECDHKeyPair } from './e2eeVideoEncryption';

// ERHÖHT: 15s statt 30s - aber mit smarterem Start-Timing (erst bei Peer-Anwesenheit)
const KEY_EXCHANGE_TIMEOUT = 15000;
const MAX_RETRY_ATTEMPTS = 5; // Mehr Retries für robusteres Verhalten
const NONCE_MAX_AGE = 5 * 60 * 1000; // 5 Minuten - Nonces älter als das werden gelöscht
const NONCE_CLEANUP_INTERVAL = 60000; // Cleanup alle 60 Sekunden

/**
 * Key exchange message types
 */
export interface KeyExchangeMessage {
  type: 'keyOffer' | 'keyAnswer' | 'keyRotation';
  publicKey: string;
  fingerprint: string;
  signature: string;
  generation: number;
  timestamp: number;
  nonce: string;
}

/**
 * Key exchange events
 */
export interface KeyExchangeEvents {
  onKeyExchangeComplete: (
    fingerprint: string,
    generation: number,
    peerSigningPublicKey?: string, // NEU: Für Chat E2EE
    peerSigningFingerprint?: string // NEU: Für Chat E2EE
  ) => void;
  onKeyRotation: (generation: number) => void;
  onKeyExchangeError: (error: string) => void;
  onVerificationRequired?: (localFp: string, remoteFp: string) => void;
}

/**
 * Signatur-Manager für Key Exchange
 */
class SignatureManager {
  private signingKey: CryptoKey | null = null;
  private verifyingKey: CryptoKey | null = null;
  private peerVerifyingKey: CryptoKey | null = null;

  /**
   * Generiere ECDSA Signing Key Pair
   */
  async generateSigningKeys(): Promise<{
    publicKeyBase64: string;
    fingerprint: string;
  }> {
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
      'sign',
      'verify',
    ]);

    this.signingKey = keyPair.privateKey;
    this.verifyingKey = keyPair.publicKey;

    const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBuffer);

    const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
    const fingerprint = this.arrayBufferToHex(fingerprintBuffer);

    return { publicKeyBase64, fingerprint };
  }

  /**
   * Signiere Daten
   */
  async sign(data: string): Promise<string> {
    if (!this.signingKey) {
      throw new Error('Signing key not initialized');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      this.signingKey,
      dataBuffer
    );

    return this.arrayBufferToBase64(signature);
  }

  /**
   * Importiere Peer's Public Key für Verifikation
   */
  async importPeerVerifyingKey(publicKeyBase64: string): Promise<void> {
    const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64);

    this.peerVerifyingKey = await crypto.subtle.importKey(
      'raw',
      publicKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
  }

  /**
   * Verifiziere Signatur
   */
  async verify(data: string, signatureBase64: string): Promise<boolean> {
    if (!this.peerVerifyingKey) {
      console.warn('⚠️ Peer verifying key not set, cannot verify signature');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const signatureBuffer = this.base64ToArrayBuffer(signatureBase64);

      return await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        this.peerVerifyingKey,
        signatureBuffer,
        dataBuffer
      );
    } catch (error) {
      console.error('❌ Signature verification error:', error);
      return false;
    }
  }

  /**
   * Exportiere Public Key für Übertragung
   */
  async exportVerifyingKey(): Promise<string> {
    if (!this.verifyingKey) {
      throw new Error('Verifying key not initialized');
    }

    const buffer = await crypto.subtle.exportKey('raw', this.verifyingKey);
    return this.arrayBufferToBase64(buffer);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * E2EE Key Exchange Manager - KORRIGIERTE VERSION
 */
export class E2EEKeyExchangeManager {
  private e2eeManager: E2EEManager;
  private signatureManager: SignatureManager;
  private signalRConnection: HubConnection | null = null;
  private localKeyPair: ECDHKeyPair | null = null;
  private remotePeerPublicKey: string | null = null;
  private remotePeerFingerprint: string | null = null;
  private isInitiator = false;
  private roomId: string | null = null;
  private peerId: string | null = null;
  private localUserId: string | null = null;
  private events: KeyExchangeEvents;

  // NEU: Peer's Signing Key für Chat E2EE
  private peerSigningPublicKey: string | null = null;
  private peerSigningFingerprint: string | null = null;

  // State Management für Race Conditions
  private exchangeState: 'idle' | 'initiating' | 'responding' | 'complete' | 'error' = 'idle';
  private keyExchangeTimeout: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private usedNonces = new Map<string, number>(); // Replay-Schutz mit Timestamp für Cleanup
  private nonceCleanupInterval: NodeJS.Timeout | null = null;

  // NEU: Key Rotation Loop Prevention
  private lastInitiatedRotationGeneration = 0; // Generation die wir selbst initiiert haben
  private processedRotationGenerations = new Set<number>(); // Bereits verarbeitete Generationen
  private pendingRotationResponse: number | null = null; // Generation auf die wir eine Response erwarten

  constructor(e2eeManager: E2EEManager, events: KeyExchangeEvents) {
    this.e2eeManager = e2eeManager;
    this.events = events;
    this.signatureManager = new SignatureManager();
  }

  /**
   * Cleanup alte Nonces um Memory Leaks zu verhindern
   * Entfernt alle Nonces die älter als NONCE_MAX_AGE sind
   */
  private cleanupOldNonces(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.usedNonces.forEach((timestamp, nonce) => {
      if (now - timestamp > NONCE_MAX_AGE) {
        this.usedNonces.delete(nonce);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.debug(
        `🧹 E2EE: Cleaned up ${cleanedCount.toString()} expired nonces, ${this.usedNonces.size.toString()} remaining`
      );
    }
  }

  /**
   * Starte periodischen Nonce-Cleanup
   */
  private startNonceCleanup(): void {
    // Stoppe vorherigen Interval falls vorhanden
    if (this.nonceCleanupInterval) {
      clearInterval(this.nonceCleanupInterval);
    }

    this.nonceCleanupInterval = setInterval(() => {
      this.cleanupOldNonces();
    }, NONCE_CLEANUP_INTERVAL);

    console.debug('🔄 E2EE: Started nonce cleanup interval');
  }

  /**
   * Initialize key exchange with SignalR connection
   * @param signalRConnection - The SignalR connection
   * @param roomId - The room ID
   * @param peerId - The remote peer's user ID
   * @param isInitiator - Whether this user is the initiator (based on backend config)
   * @param localUserId - The local user's ID (for deterministic initiator resolution)
   */
  async initialize(
    signalRConnection: HubConnection,
    roomId: string,
    peerId: string,
    isInitiator: boolean,
    localUserId?: string
  ): Promise<void> {
    console.debug(`🔐 E2EE: ========== KEY EXCHANGE INIT ==========`);
    console.debug(`🔐 E2EE: Role: ${isInitiator ? 'INITIATOR' : 'PARTICIPANT'}`);
    console.debug(`🔐 E2EE: RoomId: ${roomId}`);
    console.debug(`🔐 E2EE: LocalUserId: ${localUserId?.toString() ?? 'N/A'}`);
    console.debug(`🔐 E2EE: PeerId: ${peerId}`);
    console.debug(`🔐 E2EE: SignalR State: ${signalRConnection.state}`);
    console.debug(`🔐 E2EE: ===========================================`);

    this.signalRConnection = signalRConnection;
    this.roomId = roomId;
    this.peerId = peerId;
    this.localUserId = localUserId ?? null;
    this.isInitiator = isInitiator;
    this.exchangeState = 'idle';
    this.retryCount = 0;

    // Starte Nonce-Cleanup um Memory Leaks zu verhindern
    this.startNonceCleanup();

    // KRITISCH: Handler ZUERST registrieren BEVOR Keys generiert werden!
    // Sonst können KeyOffers ankommen bevor die Handler bereit sind.
    // Dies behebt das "No client method with the name 'receivekeyoffer' found" Problem auf Safari.
    this.registerSignalRHandlers();

    // Generate local ECDH key pair (async - dauert Zeit)
    this.localKeyPair = await this.e2eeManager.generateECDHKeyPair();

    // Generiere Signing Keys (async - dauert Zeit)
    const signingInfo = await this.signatureManager.generateSigningKeys();
    console.debug(
      `🔑 E2EE: Generated signing key, fingerprint: ${signingInfo.fingerprint.substring(0, 16)}...`
    );

    console.debug(
      `🔑 E2EE: Generated local ECDH key pair, fingerprint: ${this.localKeyPair.fingerprint.substring(0, 16)}...`
    );

    // Race Condition Prevention
    // Resolve initiator conflict using deterministic user ID comparison
    await this.resolveInitiatorConflict();
  }

  /**
   * Initiator-Rolle validieren
   *
   * WICHTIG: Die Initiator-Rolle wird vom Backend basierend auf dem Match festgelegt:
   * - initiatorUserId = Der User der die ursprüngliche Matchanfrage gestellt hat
   * - participantUserId = Der Skill-Besitzer
   *
   * Diese Rollen sind KONSTANT durch die gesamte Kette Match → Appointment → VideoCall
   * und werden NICHT mehr lokal überschrieben!
   *
   * Die alte Hash-basierte "resolveInitiatorConflict" Logik wurde entfernt, da sie
   * die korrekten Backend-Rollen überschreiben konnte.
   */
  private async resolveInitiatorConflict(): Promise<void> {
    // Vertraue der Backend-Entscheidung - keine lokale Überschreibung mehr!
    // Die Initiator-Rolle basiert auf dem Match (wer die Matchanfrage gestellt hat)
    // und ist unabhängig davon, wer den Call startet oder zuerst joined.
    console.debug(
      `🔐 E2EE: Using backend-provided initiator role: ${this.isInitiator ? 'INITIATOR' : 'PARTICIPANT'}`
    );
    console.debug(
      `🔐 E2EE: LocalUserId: ${this.localUserId?.toString() ?? 'N/A'}, PeerId: ${this.peerId?.toString() ?? 'N/A'}`
    );

    console.debug(
      `🔐 E2EE: Final initiator role: ${this.isInitiator ? 'INITIATOR' : 'PARTICIPANT'}`
    );

    if (this.isInitiator) {
      // Kurze Verzögerung um Race Condition zu vermeiden
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.sendKeyOffer();
      // Timeout NUR für Initiator starten - er erwartet eine Antwort
      this.startKeyExchangeTimeout();
    }
    // WICHTIG: Participant startet KEINEN Timeout hier!
    // Der Participant bekommt irgendwann ein KeyOffer und antwortet sofort.
    // Wenn kein Offer kommt (z.B. Initiator noch nicht connected), ist das OK -
    // der Initiator wird retry'en sobald er connected ist.
  }

  /**
   * Starte den Key Exchange Timeout
   * Nur aufrufen wenn wir aktiv auf eine Response warten!
   */
  private startKeyExchangeTimeout(): void {
    // Clear existing timeout
    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
    }

    this.keyExchangeTimeout = setTimeout(() => {
      if (this.exchangeState !== 'complete') {
        console.warn('⏰ E2EE: Key exchange timeout');
        void this.handleKeyExchangeTimeout();
      }
    }, KEY_EXCHANGE_TIMEOUT);
  }

  /**
   * Berechne Timeout mit Exponential Backoff
   * Retry 1: 60s, Retry 2: 90s, Retry 3: 135s
   */
  private getRetryTimeout(): number {
    const backoffMultiplier = Math.pow(1.5, this.retryCount);
    return Math.min(KEY_EXCHANGE_TIMEOUT * backoffMultiplier, 180000); // Max 3 Minuten
  }

  /**
   * Timeout Handler mit Exponential Backoff Retry
   */
  private async handleKeyExchangeTimeout(): Promise<void> {
    if (this.retryCount < MAX_RETRY_ATTEMPTS) {
      this.retryCount++;
      const nextTimeout = this.getRetryTimeout();
      console.debug(
        `🔄 E2EE: Retrying key exchange (attempt ${this.retryCount.toString()}/${MAX_RETRY_ATTEMPTS.toString()}, next timeout: ${(nextTimeout / 1000).toString()}s)`
      );
      this.exchangeState = 'idle';

      if (this.isInitiator) {
        // Kurze Verzögerung vor Retry mit Jitter (0-2s) um Kollisionen zu vermeiden
        const jitter = Math.random() * 2000;
        await new Promise((resolve) => setTimeout(resolve, jitter));
        await this.sendKeyOffer();

        // Neuer Timeout mit Exponential Backoff - NUR für Initiator
        if (this.keyExchangeTimeout) {
          clearTimeout(this.keyExchangeTimeout);
        }
        this.keyExchangeTimeout = setTimeout(() => {
          if (this.exchangeState !== 'complete') {
            void this.handleKeyExchangeTimeout();
          }
        }, nextTimeout);
      }
      // Participant braucht keinen Retry - er wartet einfach auf das nächste Offer
    } else {
      console.error('❌ E2EE: Key exchange failed after max retries');
      this.exchangeState = 'error';
      this.events.onKeyExchangeError('Key exchange failed after maximum retry attempts');
    }
  }

  /**
   * Register SignalR event handlers for key exchange
   */
  private registerSignalRHandlers(): void {
    if (!this.signalRConnection) return;

    console.debug(`🔐 E2EE: Registering SignalR handlers for key exchange...`);
    console.debug(`🔐 E2EE: SignalR connection state: ${this.signalRConnection.state}`);
    console.debug(
      `🔐 E2EE: LocalUserId: ${this.localUserId?.toString() ?? 'N/A'}, PeerId: ${this.peerId?.toString() ?? 'N/A'}`
    );

    this.signalRConnection.on(
      'ReceiveKeyOffer',
      async (fromUserId: string, message: KeyExchangeMessage) => {
        console.debug(`📨 E2EE: ========== RECEIVED KEY OFFER ==========`);
        console.debug(`📨 E2EE: From: ${fromUserId}`);
        console.debug(`📨 E2EE: My ID: ${this.localUserId?.toString() ?? 'N/A'}`);
        console.debug(`📨 E2EE: Expected Peer: ${this.peerId?.toString() ?? 'N/A'}`);
        console.debug(`📨 E2EE: Current state: ${this.exchangeState}`);
        console.debug(`📨 E2EE: Is Initiator: ${this.isInitiator.toString()}`);
        console.debug(
          `📨 E2EE: Message type: ${typeof message === 'string' ? 'string' : 'object'}`
        );

        // Parse wenn nötig
        const parsedMessage: KeyExchangeMessage =
          typeof message === 'string' ? (JSON.parse(message) as KeyExchangeMessage) : message;

        if (this.usedNonces.has(parsedMessage.nonce)) {
          console.warn('⚠️ E2EE: Duplicate nonce detected, ignoring (replay attack?)');
          return;
        }
        this.usedNonces.set(parsedMessage.nonce, Date.now());

        // Erlaube neuen Key Exchange wenn:
        // 1. Wir noch nicht complete sind
        // 2. Wir complete sind aber eine neue Generation kommt (key rotation)
        // 3. Wir complete sind aber von einem reconnected peer
        if (this.exchangeState === 'complete') {
          const currentGen = this.e2eeManager.getCurrentKeyMaterial()?.generation ?? 0;
          if (parsedMessage.generation <= currentGen) {
            console.debug(
              `✅ E2EE: Already complete with gen ${String(currentGen)}, ignoring offer gen ${String(parsedMessage.generation)}`
            );
            return;
          }
          console.debug(
            `🔄 E2EE: Accepting new generation offer (${String(parsedMessage.generation)} > ${String(currentGen)})`
          );
          // Reset state für neuen Exchange
          this.exchangeState = 'idle';
        }

        await this.handleKeyOffer(parsedMessage);
      }
    );

    this.signalRConnection.on(
      'ReceiveKeyAnswer',
      async (fromUserId: string, message: KeyExchangeMessage) => {
        console.debug(`📨 E2EE: ========== RECEIVED KEY ANSWER ==========`);
        console.debug(`📨 E2EE: From: ${fromUserId}`);
        console.debug(`📨 E2EE: My ID: ${this.localUserId?.toString() ?? 'N/A'}`);
        console.debug(`📨 E2EE: Expected Peer: ${this.peerId?.toString() ?? 'N/A'}`);
        console.debug(`📨 E2EE: Current state: ${this.exchangeState}`);
        console.debug(`📨 E2EE: Is Initiator: ${this.isInitiator.toString()}`);
        console.debug(
          `📨 E2EE: Message type: ${typeof message === 'string' ? 'string' : 'object'}`
        );

        // Parse wenn nötig
        const parsedMessage: KeyExchangeMessage =
          typeof message === 'string' ? (JSON.parse(message) as KeyExchangeMessage) : message;

        if (this.usedNonces.has(parsedMessage.nonce)) {
          console.warn('⚠️ E2EE: Duplicate nonce detected, ignoring');
          return;
        }
        this.usedNonces.set(parsedMessage.nonce, Date.now());

        await this.handleKeyAnswer(parsedMessage);
      }
    );

    this.signalRConnection.on(
      'ReceiveKeyRotation',
      async (fromUserId: string, message: KeyExchangeMessage) => {
        console.debug(`🔄 E2EE: ========== RECEIVED KEY ROTATION ==========`);
        console.debug(`🔄 E2EE: From: ${fromUserId}`);
        console.debug(`🔄 E2EE: My ID: ${this.localUserId?.toString() ?? 'N/A'}`);
        console.debug(`🔄 E2EE: Current state: ${this.exchangeState}`);
        await this.handleKeyRotation(message);
      }
    );

    console.debug(`✅ E2EE: SignalR handlers registered successfully`);
  }

  /**
   * Generate unique nonce for replay protection
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Send key offer (initiator only) - KORRIGIERT
   */
  private async sendKeyOffer(): Promise<void> {
    if (!this.signalRConnection || !this.localKeyPair || !this.roomId || !this.peerId) {
      throw new Error('Key exchange not initialized');
    }

    if (this.exchangeState !== 'idle') {
      console.debug(`⚠️ E2EE: Cannot send offer, state is ${this.exchangeState}`);
      return;
    }

    this.exchangeState = 'initiating';

    const nonce = this.generateNonce();

    // Signiere die Nachricht
    const dataToSign = `${this.localKeyPair.publicKeyBase64}:${this.localKeyPair.fingerprint}:${nonce}`;
    const signature = await this.signatureManager.sign(dataToSign);
    const signingPublicKey = await this.signatureManager.exportVerifyingKey();

    const message: KeyExchangeMessage = {
      type: 'keyOffer',
      publicKey: this.localKeyPair.publicKeyBase64,
      fingerprint: this.localKeyPair.fingerprint,
      signature,
      generation: 1,
      timestamp: Date.now(),
      nonce,
    };

    console.debug(`📤 E2EE: Sending signed key offer to room ${this.roomId}`);

    try {
      await this.signalRConnection.invoke(
        'SendKeyOffer',
        this.roomId,
        this.peerId,
        JSON.stringify({ ...message, signingPublicKey })
      );
    } catch (error) {
      console.error('❌ E2EE: Failed to send key offer:', error);
      this.exchangeState = 'error';
      this.events.onKeyExchangeError(
        `Failed to send key offer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle received key offer (participant only) - KORRIGIERT
   */
  private async handleKeyOffer(rawMessage: KeyExchangeMessage | string): Promise<void> {
    try {
      // Parse message if string
      const message: KeyExchangeMessage & { signingPublicKey?: string } =
        typeof rawMessage === 'string'
          ? (JSON.parse(rawMessage) as KeyExchangeMessage & { signingPublicKey?: string })
          : rawMessage;

      // Importiere Peer's Signing Key und verifiziere
      if (message.signingPublicKey) {
        await this.signatureManager.importPeerVerifyingKey(message.signingPublicKey);

        const dataToVerify = `${message.publicKey}:${message.fingerprint}:${message.nonce}`;
        const isValid = await this.signatureManager.verify(dataToVerify, message.signature);

        if (!isValid) {
          console.error('❌ E2EE: Key offer signature verification failed!');
          this.events.onKeyExchangeError(
            'Key offer signature verification failed - possible MITM attack'
          );
          return;
        }

        console.debug('✅ E2EE: Key offer signature verified');

        // NEU: Speichere Peer's Signing Key für Chat E2EE
        this.peerSigningPublicKey = message.signingPublicKey;
        // Berechne Fingerprint aus dem öffentlichen Schlüssel
        const keyBuffer = this.base64ToArrayBuffer(message.signingPublicKey);
        const fingerprintBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
        this.peerSigningFingerprint = this.arrayBufferToHex(fingerprintBuffer);
        console.debug(
          `🔑 E2EE: Stored peer signing key, fingerprint: ${this.peerSigningFingerprint.substring(0, 16)}...`
        );
      }

      this.exchangeState = 'responding';

      // Store remote peer's public key
      this.remotePeerPublicKey = message.publicKey;
      this.remotePeerFingerprint = message.fingerprint;

      console.debug(
        `🔑 E2EE: Remote peer fingerprint: ${this.remotePeerFingerprint.substring(0, 16)}...`
      );

      // Derive shared key
      await this.deriveSharedKey();

      // Send key answer back
      await this.sendKeyAnswer();

      // Clear timeout
      if (this.keyExchangeTimeout) {
        clearTimeout(this.keyExchangeTimeout);
        this.keyExchangeTimeout = null;
      }

      this.exchangeState = 'complete';

      // Trigger Verification UI
      if (this.events.onVerificationRequired && this.localKeyPair && this.remotePeerFingerprint) {
        this.events.onVerificationRequired(
          this.localKeyPair.fingerprint,
          this.remotePeerFingerprint
        );
      }

      // Notify completion - inkl. Peer Signing Key für Chat E2EE
      this.events.onKeyExchangeComplete(
        this.remotePeerFingerprint,
        message.generation,
        this.peerSigningPublicKey ?? undefined,
        this.peerSigningFingerprint ?? undefined
      );
    } catch (error) {
      console.error('❌ E2EE: Error handling key offer:', error);
      this.exchangeState = 'error';
      this.events.onKeyExchangeError(
        `Failed to handle key offer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send key answer (participant only) - KORRIGIERT
   */
  private async sendKeyAnswer(): Promise<void> {
    if (!this.signalRConnection || !this.localKeyPair || !this.roomId || !this.peerId) {
      throw new Error('Key exchange not initialized');
    }

    const nonce = this.generateNonce();

    const dataToSign = `${this.localKeyPair.publicKeyBase64}:${this.localKeyPair.fingerprint}:${nonce}`;
    const signature = await this.signatureManager.sign(dataToSign);
    const signingPublicKey = await this.signatureManager.exportVerifyingKey();

    const message: KeyExchangeMessage = {
      type: 'keyAnswer',
      publicKey: this.localKeyPair.publicKeyBase64,
      fingerprint: this.localKeyPair.fingerprint,
      signature,
      generation: 1,
      timestamp: Date.now(),
      nonce,
    };

    console.debug(
      `📤 E2EE: Sending signed key answer to room ${this.roomId}, peerId: ${this.peerId}`
    );
    console.debug(
      `📤 E2EE: Answer fingerprint: ${this.localKeyPair.fingerprint.substring(0, 16)}...`
    );

    try {
      await this.signalRConnection.invoke(
        'SendKeyAnswer',
        this.roomId,
        this.peerId,
        JSON.stringify({ ...message, signingPublicKey })
      );
      console.debug(`✅ E2EE: Key answer sent successfully to ${this.peerId}`);
    } catch (error) {
      console.error('❌ E2EE: Failed to send key answer:', error);
      this.events.onKeyExchangeError(
        `Failed to send key answer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle received key answer (initiator only) - KORRIGIERT
   */
  private async handleKeyAnswer(rawMessage: KeyExchangeMessage | string): Promise<void> {
    console.debug(
      `🔐 E2EE: handleKeyAnswer called, isInitiator: ${String(this.isInitiator)}, state: ${this.exchangeState}`
    );

    if (!this.isInitiator) {
      console.warn('⚠️ E2EE: Ignoring key answer (I am not the initiator)');
      // Wenn wir nicht der Initiator sind aber trotzdem eine Answer bekommen,
      // könnte es ein Timing-Problem sein. Logge zusätzliche Infos.
      console.warn(
        `⚠️ E2EE: localUserId: ${this.localUserId ?? 'N/A'}, peerId: ${this.peerId ?? 'N/A'}`
      );
      return;
    }

    // Wenn wir bereits complete sind, ignoriere (außer bei höherer Generation)
    if (this.exchangeState === 'complete') {
      console.debug('⚠️ E2EE: Already complete, ignoring answer (use key rotation instead)');
      return;
    }

    try {
      const message: KeyExchangeMessage & { signingPublicKey?: string } =
        typeof rawMessage === 'string'
          ? (JSON.parse(rawMessage) as KeyExchangeMessage & { signingPublicKey?: string })
          : rawMessage;

      if (message.signingPublicKey) {
        await this.signatureManager.importPeerVerifyingKey(message.signingPublicKey);

        const dataToVerify = `${message.publicKey}:${message.fingerprint}:${message.nonce}`;
        const isValid = await this.signatureManager.verify(dataToVerify, message.signature);

        if (!isValid) {
          console.error('❌ E2EE: Key answer signature verification failed!');
          this.events.onKeyExchangeError(
            'Key answer signature verification failed - possible MITM attack'
          );
          return;
        }

        console.debug('✅ E2EE: Key answer signature verified');

        // NEU: Speichere Peer's Signing Key für Chat E2EE
        this.peerSigningPublicKey = message.signingPublicKey;
        const keyBuffer = this.base64ToArrayBuffer(message.signingPublicKey);
        const fingerprintBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
        this.peerSigningFingerprint = this.arrayBufferToHex(fingerprintBuffer);
        console.debug(
          `🔑 E2EE: Stored peer signing key, fingerprint: ${this.peerSigningFingerprint.substring(0, 16)}...`
        );
      }

      // Store remote peer's public key
      this.remotePeerPublicKey = message.publicKey;
      this.remotePeerFingerprint = message.fingerprint;

      console.debug(
        `🔑 E2EE: Remote peer fingerprint: ${this.remotePeerFingerprint.substring(0, 16)}...`
      );

      // Derive shared key
      await this.deriveSharedKey();

      // Clear timeout
      if (this.keyExchangeTimeout) {
        clearTimeout(this.keyExchangeTimeout);
        this.keyExchangeTimeout = null;
      }

      this.exchangeState = 'complete';

      // Trigger Verification UI
      if (this.events.onVerificationRequired && this.localKeyPair && this.remotePeerFingerprint) {
        this.events.onVerificationRequired(
          this.localKeyPair.fingerprint,
          this.remotePeerFingerprint
        );
      }

      // Notify completion - inkl. Peer Signing Key für Chat E2EE
      this.events.onKeyExchangeComplete(
        this.remotePeerFingerprint,
        message.generation,
        this.peerSigningPublicKey ?? undefined,
        this.peerSigningFingerprint ?? undefined
      );
    } catch (error) {
      console.error('❌ E2EE: Error handling key answer:', error);
      this.exchangeState = 'error';
      this.events.onKeyExchangeError(
        `Failed to handle key answer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Derive shared AES-GCM key from ECDH exchange
   */
  private async deriveSharedKey(): Promise<void> {
    if (!this.localKeyPair || !this.remotePeerPublicKey) {
      throw new Error('Missing key material for key derivation');
    }

    console.debug('🔐 E2EE: Deriving shared encryption key...');

    const keyMaterial = await this.e2eeManager.deriveSharedKey(
      this.localKeyPair.privateKey,
      this.remotePeerPublicKey
    );

    console.debug(`✅ E2EE: Shared key derived (generation ${keyMaterial.generation.toString()})`);
  }

  /**
   * Initiate key rotation - KORRIGIERT mit Loop Prevention
   */
  async rotateKeys(): Promise<void> {
    if (this.exchangeState !== 'complete') {
      console.warn('⚠️ E2EE: Cannot rotate keys - exchange not complete');
      return;
    }

    const currentKeyMaterial = this.e2eeManager.getCurrentKeyMaterial();
    const newGeneration = currentKeyMaterial ? currentKeyMaterial.generation + 1 : 1;

    // NEU: Loop Prevention - Prüfe ob wir bereits auf eine Rotation warten
    if (this.pendingRotationResponse !== null) {
      console.debug(
        `⚠️ E2EE: Already waiting for rotation response (gen ${this.pendingRotationResponse.toString()}), skipping`
      );
      return;
    }

    console.debug('🔄 E2EE: Initiating key rotation...');

    try {
      // Generate new key pair
      this.localKeyPair = await this.e2eeManager.generateECDHKeyPair();

      const nonce = this.generateNonce();
      const dataToSign = `${this.localKeyPair.publicKeyBase64}:${this.localKeyPair.fingerprint}:${nonce}:${newGeneration.toString()}`;
      const signature = await this.signatureManager.sign(dataToSign);

      // Include signing public key for reconnect scenarios
      const signingPublicKey = await this.signatureManager.exportVerifyingKey();

      const message: KeyExchangeMessage & { signingPublicKey?: string; isResponse?: boolean } = {
        type: 'keyRotation',
        publicKey: this.localKeyPair.publicKeyBase64,
        fingerprint: this.localKeyPair.fingerprint,
        signature,
        generation: newGeneration,
        timestamp: Date.now(),
        nonce,
        signingPublicKey, // Include for peer to import
      };

      // NEU: Markiere diese Generation als selbst-initiiert
      this.lastInitiatedRotationGeneration = newGeneration;
      this.pendingRotationResponse = newGeneration;

      if (this.signalRConnection && this.roomId && this.peerId) {
        await this.signalRConnection.invoke(
          'SendKeyRotation',
          this.roomId,
          this.peerId,
          JSON.stringify(message)
        );
        console.debug(
          `✅ E2EE: Key rotation message sent (generation ${newGeneration.toString()})`
        );
      }

      // NEU: Timeout für Response - nach 10s ist pendingRotationResponse wieder frei
      setTimeout(() => {
        if (this.pendingRotationResponse === newGeneration) {
          console.debug(`⚠️ E2EE: Rotation response timeout for gen ${newGeneration.toString()}`);
          this.pendingRotationResponse = null;
        }
      }, 10000);
    } catch (error) {
      this.pendingRotationResponse = null;
      console.error('❌ E2EE: Key rotation failed:', error);
      this.events.onKeyExchangeError(
        `Key rotation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle key rotation from peer - KORRIGIERT mit Loop Prevention
   */
  private async handleKeyRotation(rawMessage: KeyExchangeMessage | string): Promise<void> {
    try {
      const message: KeyExchangeMessage & { signingPublicKey?: string; isResponse?: boolean } =
        typeof rawMessage === 'string'
          ? (JSON.parse(rawMessage) as KeyExchangeMessage & {
              signingPublicKey?: string;
              isResponse?: boolean;
            })
          : rawMessage;

      console.debug(
        `🔄 E2EE: Processing key rotation (generation ${message.generation.toString()})`
      );
      console.debug(
        `🔄 E2EE: Has signing public key in message: ${String(!!message.signingPublicKey)}`
      );
      console.debug(
        `🔄 E2EE: Last initiated rotation: ${this.lastInitiatedRotationGeneration.toString()}`
      );
      console.debug(
        `🔄 E2EE: Pending rotation response: ${this.pendingRotationResponse?.toString() ?? 'null'}`
      );

      // NEU: Loop Prevention - Prüfe ob wir diese Generation bereits verarbeitet haben
      if (this.processedRotationGenerations.has(message.generation)) {
        console.debug(
          `⚠️ E2EE: Already processed generation ${message.generation.toString()}, ignoring (loop prevention)`
        );
        return;
      }

      // NEU: Prüfe ob dies eine Response auf unsere initiierte Rotation ist
      const isResponseToOurRotation = this.pendingRotationResponse === message.generation;

      if (isResponseToOurRotation) {
        console.debug(
          `✅ E2EE: This is a response to our initiated rotation (gen ${message.generation.toString()})`
        );
        this.pendingRotationResponse = null; // Clear pending
      }

      // Falls Peer Signing Key in der Nachricht enthalten ist, importieren
      // Dies ist wichtig für Reconnect-Szenarien wo der Key verloren ging
      if (message.signingPublicKey) {
        console.debug(`🔑 E2EE: Importing peer signing key from rotation message`);
        await this.signatureManager.importPeerVerifyingKey(message.signingPublicKey);

        // Update stored peer signing info
        this.peerSigningPublicKey = message.signingPublicKey;
        const keyBuffer = this.base64ToArrayBuffer(message.signingPublicKey);
        const fingerprintBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
        this.peerSigningFingerprint = this.arrayBufferToHex(fingerprintBuffer);
        console.debug(
          `🔑 E2EE: Updated peer signing key, fingerprint: ${this.peerSigningFingerprint.substring(0, 16)}...`
        );
      }

      // Verify signature
      const dataToVerify = `${message.publicKey}:${message.fingerprint}:${message.nonce}:${message.generation.toString()}`;
      const isValid = await this.signatureManager.verify(dataToVerify, message.signature);

      if (!isValid) {
        console.error('❌ E2EE: Key rotation signature verification failed!');
        console.error(
          '❌ E2EE: This may happen if the peer signing key was not set. Consider re-initializing E2EE.'
        );
        return;
      }

      console.debug(`✅ E2EE: Key rotation signature verified`);

      // Update remote peer's public key
      this.remotePeerPublicKey = message.publicKey;
      this.remotePeerFingerprint = message.fingerprint;

      // NEU: Nur neuen Key generieren wenn dies KEINE Response auf unsere Rotation ist
      // Bei einer Response haben wir unseren Key bereits beim Initiieren generiert
      if (!isResponseToOurRotation) {
        // Generate new local key pair
        this.localKeyPair = await this.e2eeManager.generateECDHKeyPair();
      }

      // Derive new shared key
      await this.deriveSharedKey();

      // NEU: Markiere diese Generation als verarbeitet
      this.processedRotationGenerations.add(message.generation);

      // Cleanup alte Generationen (behalte nur die letzten 10)
      if (this.processedRotationGenerations.size > 10) {
        const generations = Array.from(this.processedRotationGenerations).sort((a, b) => a - b);
        for (let i = 0; i < generations.length - 10; i++) {
          this.processedRotationGenerations.delete(generations[i]);
        }
      }

      // NEU: Sende Response NUR wenn dies KEINE Response auf unsere Rotation ist
      // UND wenn wir nicht selbst diese Rotation initiiert haben
      if (
        !isResponseToOurRotation &&
        this.lastInitiatedRotationGeneration !== message.generation &&
        this.localKeyPair
      ) {
        // Send our new public key back (include signing key for reconnect scenarios)
        const nonce = this.generateNonce();
        const dataToSign = `${this.localKeyPair.publicKeyBase64}:${this.localKeyPair.fingerprint}:${nonce}:${message.generation.toString()}`;
        const signature = await this.signatureManager.sign(dataToSign);
        const signingPublicKey = await this.signatureManager.exportVerifyingKey();

        const responseMessage: KeyExchangeMessage & {
          signingPublicKey?: string;
          isResponse?: boolean;
        } = {
          type: 'keyRotation',
          publicKey: this.localKeyPair.publicKeyBase64,
          fingerprint: this.localKeyPair.fingerprint,
          signature,
          generation: message.generation,
          timestamp: Date.now(),
          nonce,
          signingPublicKey, // Include for reconnect scenarios
        };

        if (this.signalRConnection && this.roomId && this.peerId) {
          await this.signalRConnection.invoke(
            'SendKeyRotation',
            this.roomId,
            this.peerId,
            JSON.stringify(responseMessage)
          );
          console.debug(
            `📤 E2EE: Sent key rotation response for gen ${message.generation.toString()}`
          );
        }
      } else {
        console.debug(
          `🔒 E2EE: Not sending response (isResponseToOurRotation=${isResponseToOurRotation.toString()}, lastInitiated=${this.lastInitiatedRotationGeneration.toString()})`
        );
      }

      // Notify key rotation complete
      this.events.onKeyRotation(message.generation);

      console.debug(`✅ E2EE: Key rotation complete (generation ${message.generation.toString()})`);
    } catch (error) {
      console.error('❌ E2EE: Error handling key rotation:', error);
      this.events.onKeyExchangeError(
        `Key rotation handling failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get remote peer's public key fingerprint
   */
  getRemotePeerFingerprint(): string | null {
    return this.remotePeerFingerprint;
  }

  /**
   * Get local public key fingerprint
   */
  getLocalFingerprint(): string | null {
    return this.localKeyPair?.fingerprint ?? null;
  }

  /**
   * Get current exchange state
   */
  getState(): string {
    return this.exchangeState;
  }

  /**
   * Re-trigger key exchange when peer joins
   * Called when UserJoined event is received and key exchange is not complete
   */
  async retriggerKeyExchange(): Promise<void> {
    console.debug('🔄 E2EE: Re-triggering key exchange because peer joined');
    console.debug('🔄 E2EE: Current state:', this.exchangeState);
    console.debug('🔄 E2EE: Is initiator:', this.isInitiator);

    // Clear any existing timeout
    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
      this.keyExchangeTimeout = null;
    }

    // Reset retry count since peer just joined
    this.retryCount = 0;

    // Only initiator should send offers
    if (this.isInitiator) {
      // Reset state to allow new offer
      this.exchangeState = 'idle';

      // Small delay to ensure peer's handlers are ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.debug('🔐 E2EE: Sending fresh key offer to newly joined peer');
      await this.sendKeyOffer();

      // Set timeout for response
      this.keyExchangeTimeout = setTimeout(() => {
        if (this.exchangeState !== 'complete') {
          console.warn('⏰ E2EE: Key exchange timeout after peer joined');
          void this.handleKeyExchangeTimeout();
        }
      }, KEY_EXCHANGE_TIMEOUT);
    }
  }

  /**
   * Format fingerprint for display
   */
  static formatFingerprintForDisplay(fingerprint: string): string {
    return (
      fingerprint
        .match(/.{1,4}/g)
        ?.join(' ')
        .toUpperCase() ?? fingerprint
    );
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.debug('🧹 E2EE: Cleaning up key exchange manager');

    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
      this.keyExchangeTimeout = null;
    }

    // Stoppe Nonce-Cleanup Interval
    if (this.nonceCleanupInterval) {
      clearInterval(this.nonceCleanupInterval);
      this.nonceCleanupInterval = null;
    }

    this.localKeyPair = null;
    this.remotePeerPublicKey = null;
    this.remotePeerFingerprint = null;
    this.peerSigningPublicKey = null;
    this.peerSigningFingerprint = null;
    this.signalRConnection = null;
    this.roomId = null;
    this.peerId = null;
    this.localUserId = null;
    this.exchangeState = 'idle';
    this.usedNonces.clear();
    this.retryCount = 0;

    // NEU: Reset Key Rotation Loop Prevention State
    this.lastInitiatedRotationGeneration = 0;
    this.processedRotationGenerations.clear();
    this.pendingRotationResponse = null;

    console.debug('✅ E2EE: Cleanup complete, all resources released');
  }

  // === Helper Methods ===

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get peer's signing public key (for Chat E2EE)
   */
  getPeerSigningPublicKey(): string | null {
    return this.peerSigningPublicKey;
  }

  /**
   * Get peer's signing fingerprint
   */
  getPeerSigningFingerprint(): string | null {
    return this.peerSigningFingerprint;
  }
}
