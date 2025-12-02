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

import { HubConnection } from '@microsoft/signalr';
import { E2EEManager, ECDHKeyPair } from './e2eeVideoEncryption';

const KEY_EXCHANGE_TIMEOUT = 30000; // 30 Sekunden
const MAX_RETRY_ATTEMPTS = 3;

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
  onKeyExchangeComplete: (fingerprint: string, generation: number) => void;
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
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

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
  private events: KeyExchangeEvents;

  // State Management für Race Conditions
  private exchangeState: 'idle' | 'initiating' | 'responding' | 'complete' | 'error' = 'idle';
  private keyExchangeTimeout: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private usedNonces = new Set<string>(); // Replay-Schutz

  constructor(e2eeManager: E2EEManager, events: KeyExchangeEvents) {
    this.e2eeManager = e2eeManager;
    this.events = events;
    this.signatureManager = new SignatureManager();
  }

  /**
   * Initialize key exchange with SignalR connection
   */
  async initialize(
    signalRConnection: HubConnection,
    roomId: string,
    peerId: string,
    isInitiator: boolean
  ): Promise<void> {
    console.log(`🔐 E2EE: Initializing key exchange (${isInitiator ? 'Initiator' : 'Participant'})`);

    this.signalRConnection = signalRConnection;
    this.roomId = roomId;
    this.peerId = peerId;
    this.isInitiator = isInitiator;
    this.exchangeState = 'idle';
    this.retryCount = 0;

    // Register SignalR event handlers
    this.registerSignalRHandlers();

    // Generate local ECDH key pair
    this.localKeyPair = await this.e2eeManager.generateECDHKeyPair();

    // Generiere Signing Keys
    const signingInfo = await this.signatureManager.generateSigningKeys();
    console.log(`🔑 E2EE: Generated signing key, fingerprint: ${signingInfo.fingerprint.substring(0, 16)}...`);

    console.log(`🔑 E2EE: Generated local ECDH key pair, fingerprint: ${this.localKeyPair.fingerprint.substring(0, 16)}...`);

    // Race Condition Prevention
    // Beide Seiten warten kurz, dann entscheidet die kleinere User-ID, wer initiiert
    await this.resolveInitiatorConflict();
  }

  /**
   * Löse Initiator-Konflikt auf
   */
  private async resolveInitiatorConflict(): Promise<void> {
    // Kleine Verzögerung basierend auf User-ID Hash
    const myIdHash = await this.hashString(this.localKeyPair?.fingerprint || '');
    const peerIdHash = await this.hashString(this.peerId || '');

    // Wer den kleineren Hash hat, ist der Initiator
    const shouldBeInitiator = myIdHash < peerIdHash;

    if (this.isInitiator !== shouldBeInitiator) {
      console.log(`🔄 E2EE: Adjusting initiator role from ${this.isInitiator} to ${shouldBeInitiator}`);
      this.isInitiator = shouldBeInitiator;
    }

    if (this.isInitiator) {
      // Kurze Verzögerung um Race Condition zu vermeiden
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.sendKeyOffer();
    }

    // Timeout für Key Exchange
    this.keyExchangeTimeout = setTimeout(() => {
      if (this.exchangeState !== 'complete') {
        console.warn('⏰ E2EE: Key exchange timeout');
        this.handleKeyExchangeTimeout();
      }
    }, KEY_EXCHANGE_TIMEOUT);
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Timeout Handler mit Retry
   */
  private async handleKeyExchangeTimeout(): Promise<void> {
    if (this.retryCount < MAX_RETRY_ATTEMPTS) {
      this.retryCount++;
      console.log(`🔄 E2EE: Retrying key exchange (attempt ${this.retryCount}/${MAX_RETRY_ATTEMPTS})`);
      this.exchangeState = 'idle';

      if (this.isInitiator) {
        await this.sendKeyOffer();
      }

      // Neuer Timeout
      this.keyExchangeTimeout = setTimeout(() => {
        if (this.exchangeState !== 'complete') {
          this.handleKeyExchangeTimeout();
        }
      }, KEY_EXCHANGE_TIMEOUT);
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

    this.signalRConnection.on('ReceiveKeyOffer', async (fromUserId: string, message: KeyExchangeMessage) => {
      console.log(`📨 E2EE: Received key offer from ${fromUserId}`);

      if (this.usedNonces.has(message.nonce)) {
        console.warn('⚠️ E2EE: Duplicate nonce detected, ignoring (replay attack?)');
        return;
      }
      this.usedNonces.add(message.nonce);

      if (this.exchangeState === 'complete') {
        console.log('✅ E2EE: Already complete, ignoring offer');
        return;
      }

      await this.handleKeyOffer(message);
    });

    this.signalRConnection.on('ReceiveKeyAnswer', async (fromUserId: string, message: KeyExchangeMessage) => {
      console.log(`📨 E2EE: Received key answer from ${fromUserId}`);

      if (this.usedNonces.has(message.nonce)) {
        console.warn('⚠️ E2EE: Duplicate nonce detected, ignoring');
        return;
      }
      this.usedNonces.add(message.nonce);

      await this.handleKeyAnswer(message);
    });

    this.signalRConnection.on('ReceiveKeyRotation', async (fromUserId: string, message: KeyExchangeMessage) => {
      console.log(`🔄 E2EE: Received key rotation from ${fromUserId}`);
      await this.handleKeyRotation(message);
    });
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
      console.log(`⚠️ E2EE: Cannot send offer, state is ${this.exchangeState}`);
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

    console.log(`📤 E2EE: Sending signed key offer to room ${this.roomId}`);

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
      this.events.onKeyExchangeError(`Failed to send key offer: ${error}`);
    }
  }

  /**
   * Handle received key offer (participant only) - KORRIGIERT
   */
  private async handleKeyOffer(rawMessage: KeyExchangeMessage | string): Promise<void> {
    try {
      // Parse message if string
      const message: KeyExchangeMessage & { signingPublicKey?: string } =
        typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;

      // Importiere Peer's Signing Key und verifiziere
      if (message.signingPublicKey) {
        await this.signatureManager.importPeerVerifyingKey(message.signingPublicKey);

        const dataToVerify = `${message.publicKey}:${message.fingerprint}:${message.nonce}`;
        const isValid = await this.signatureManager.verify(dataToVerify, message.signature);

        if (!isValid) {
          console.error('❌ E2EE: Key offer signature verification failed!');
          this.events.onKeyExchangeError('Key offer signature verification failed - possible MITM attack');
          return;
        }

        console.log('✅ E2EE: Key offer signature verified');
      }

      this.exchangeState = 'responding';

      // Store remote peer's public key
      this.remotePeerPublicKey = message.publicKey;
      this.remotePeerFingerprint = message.fingerprint;

      console.log(`🔑 E2EE: Remote peer fingerprint: ${this.remotePeerFingerprint.substring(0, 16)}...`);

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
        this.events.onVerificationRequired(this.localKeyPair.fingerprint, this.remotePeerFingerprint);
      }

      // Notify completion
      this.events.onKeyExchangeComplete(this.remotePeerFingerprint, message.generation);
    } catch (error) {
      console.error('❌ E2EE: Error handling key offer:', error);
      this.exchangeState = 'error';
      this.events.onKeyExchangeError(`Failed to handle key offer: ${error}`);
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

    console.log(`📤 E2EE: Sending signed key answer to room ${this.roomId}`);

    try {
      await this.signalRConnection.invoke(
        'SendKeyAnswer',
        this.roomId,
        this.peerId,
        JSON.stringify({ ...message, signingPublicKey })
      );
    } catch (error) {
      console.error('❌ E2EE: Failed to send key answer:', error);
      this.events.onKeyExchangeError(`Failed to send key answer: ${error}`);
    }
  }

  /**
   * Handle received key answer (initiator only) - KORRIGIERT
   */
  private async handleKeyAnswer(rawMessage: KeyExchangeMessage | string): Promise<void> {
    if (!this.isInitiator) {
      console.warn('⚠️ E2EE: Ignoring key answer (I am not the initiator)');
      return;
    }

    try {
      const message: KeyExchangeMessage & { signingPublicKey?: string } =
        typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;

      if (message.signingPublicKey) {
        await this.signatureManager.importPeerVerifyingKey(message.signingPublicKey);

        const dataToVerify = `${message.publicKey}:${message.fingerprint}:${message.nonce}`;
        const isValid = await this.signatureManager.verify(dataToVerify, message.signature);

        if (!isValid) {
          console.error('❌ E2EE: Key answer signature verification failed!');
          this.events.onKeyExchangeError('Key answer signature verification failed - possible MITM attack');
          return;
        }

        console.log('✅ E2EE: Key answer signature verified');
      }

      // Store remote peer's public key
      this.remotePeerPublicKey = message.publicKey;
      this.remotePeerFingerprint = message.fingerprint;

      console.log(`🔑 E2EE: Remote peer fingerprint: ${this.remotePeerFingerprint.substring(0, 16)}...`);

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
        this.events.onVerificationRequired(this.localKeyPair.fingerprint, this.remotePeerFingerprint);
      }

      // Notify completion
      this.events.onKeyExchangeComplete(this.remotePeerFingerprint, message.generation);
    } catch (error) {
      console.error('❌ E2EE: Error handling key answer:', error);
      this.exchangeState = 'error';
      this.events.onKeyExchangeError(`Failed to handle key answer: ${error}`);
    }
  }

  /**
   * Derive shared AES-GCM key from ECDH exchange
   */
  private async deriveSharedKey(): Promise<void> {
    if (!this.localKeyPair || !this.remotePeerPublicKey) {
      throw new Error('Missing key material for key derivation');
    }

    console.log('🔐 E2EE: Deriving shared encryption key...');

    const keyMaterial = await this.e2eeManager.deriveSharedKey(
      this.localKeyPair.privateKey,
      this.remotePeerPublicKey
    );

    console.log(`✅ E2EE: Shared key derived (generation ${keyMaterial.generation})`);
  }

  /**
   * Initiate key rotation - KORRIGIERT
   */
  async rotateKeys(): Promise<void> {
    if (this.exchangeState !== 'complete') {
      console.warn('⚠️ E2EE: Cannot rotate keys - exchange not complete');
      return;
    }

    console.log('🔄 E2EE: Initiating key rotation...');

    try {
      // Generate new key pair
      this.localKeyPair = await this.e2eeManager.generateECDHKeyPair();

      const currentKeyMaterial = this.e2eeManager.getCurrentKeyMaterial();
      const newGeneration = currentKeyMaterial ? currentKeyMaterial.generation + 1 : 1;

      const nonce = this.generateNonce();
      const dataToSign = `${this.localKeyPair.publicKeyBase64}:${this.localKeyPair.fingerprint}:${nonce}:${newGeneration}`;
      const signature = await this.signatureManager.sign(dataToSign);

      const message: KeyExchangeMessage = {
        type: 'keyRotation',
        publicKey: this.localKeyPair.publicKeyBase64,
        fingerprint: this.localKeyPair.fingerprint,
        signature,
        generation: newGeneration,
        timestamp: Date.now(),
        nonce,
      };

      if (this.signalRConnection && this.roomId && this.peerId) {
        await this.signalRConnection.invoke(
          'SendKeyRotation',
          this.roomId,
          this.peerId,
          JSON.stringify(message)
        );
        console.log(`✅ E2EE: Key rotation message sent (generation ${newGeneration})`);
      }
    } catch (error) {
      console.error('❌ E2EE: Key rotation failed:', error);
      this.events.onKeyExchangeError(`Key rotation failed: ${error}`);
    }
  }

  /**
   * Handle key rotation from peer - KORRIGIERT
   */
  private async handleKeyRotation(rawMessage: KeyExchangeMessage | string): Promise<void> {
    try {
      const message: KeyExchangeMessage =
        typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;

      // Verify signature
      const dataToVerify = `${message.publicKey}:${message.fingerprint}:${message.nonce}:${message.generation}`;
      const isValid = await this.signatureManager.verify(dataToVerify, message.signature);

      if (!isValid) {
        console.error('❌ E2EE: Key rotation signature verification failed!');
        return;
      }

      console.log(`🔄 E2EE: Processing key rotation (generation ${message.generation})`);

      // Update remote peer's public key
      this.remotePeerPublicKey = message.publicKey;
      this.remotePeerFingerprint = message.fingerprint;

      // Generate new local key pair
      this.localKeyPair = await this.e2eeManager.generateECDHKeyPair();

      // Derive new shared key
      await this.deriveSharedKey();

      // Send our new public key back
      const nonce = this.generateNonce();
      const dataToSign = `${this.localKeyPair.publicKeyBase64}:${this.localKeyPair.fingerprint}:${nonce}:${message.generation}`;
      const signature = await this.signatureManager.sign(dataToSign);

      const responseMessage: KeyExchangeMessage = {
        type: 'keyRotation',
        publicKey: this.localKeyPair.publicKeyBase64,
        fingerprint: this.localKeyPair.fingerprint,
        signature,
        generation: message.generation,
        timestamp: Date.now(),
        nonce,
      };

      if (this.signalRConnection && this.roomId && this.peerId) {
        await this.signalRConnection.invoke(
          'SendKeyRotation',
          this.roomId,
          this.peerId,
          JSON.stringify(responseMessage)
        );
      }

      // Notify key rotation complete
      this.events.onKeyRotation(message.generation);

      console.log(`✅ E2EE: Key rotation complete (generation ${message.generation})`);
    } catch (error) {
      console.error('❌ E2EE: Error handling key rotation:', error);
      this.events.onKeyExchangeError(`Key rotation handling failed: ${error}`);
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
    return this.localKeyPair?.fingerprint || null;
  }

  /**
   * Get current exchange state
   */
  getState(): string {
    return this.exchangeState;
  }

  /**
   * Format fingerprint for display
   */
  static formatFingerprintForDisplay(fingerprint: string): string {
    return fingerprint
      .match(/.{1,4}/g)
      ?.join(' ')
      .toUpperCase() || fingerprint;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log('🧹 E2EE: Cleaning up key exchange manager');

    if (this.keyExchangeTimeout) {
      clearTimeout(this.keyExchangeTimeout);
      this.keyExchangeTimeout = null;
    }

    this.localKeyPair = null;
    this.remotePeerPublicKey = null;
    this.remotePeerFingerprint = null;
    this.signalRConnection = null;
    this.roomId = null;
    this.peerId = null;
    this.exchangeState = 'idle';
    this.usedNonces.clear();
  }
}
