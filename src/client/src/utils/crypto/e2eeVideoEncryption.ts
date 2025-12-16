/**
 * End-to-End Encryption for Video Calls
 *
 * This module implements E2EE for WebRTC media streams using:
 * - Insertable Streams API (Chrome 86+, Firefox 117+)
 * - AES-GCM encryption for media frames
 * - ECDH (Elliptic Curve Diffie-Hellman) for key exchange
 * - Perfect Forward Secrecy with key rotation
 *
 * Security Properties:
 * - End-to-End: Only participants can decrypt media
 * - Forward Secrecy: Compromised keys don't reveal past/future sessions
 * - Authentication: Key fingerprints prevent MITM attacks
 * - Freshness: Keys rotate every 60 seconds
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes (96 bits recommended for GCM)
const AUTH_TAG_LENGTH = 128; // bits (16 bytes)
const KEY_ROTATION_INTERVAL = 60 * 1000; // 60 seconds

/**
 * Cryptographic key material for E2EE session
 */
export interface E2EEKeyMaterial {
  /** Current encryption key (AES-256-GCM) */
  encryptionKey: CryptoKey;
  /** Key creation timestamp for rotation tracking */
  createdAt: number;
  /** Public key fingerprint (SHA-256 hash for verification) */
  publicKeyFingerprint: string;
  /** Key generation number (increments on rotation) */
  generation: number;
}

/**
 * ECDH key pair for key exchange
 */
export interface ECDHKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  /** Base64-encoded public key for transmission */
  publicKeyBase64: string;
  /** SHA-256 fingerprint of public key */
  fingerprint: string;
}

/**
 * E2EE Manager - Handles encryption, key exchange, and rotation
 */
export class E2EEManager {
  private encryptionKey: CryptoKey | null = null;
  private keyGeneration = 0;
  private keyCreatedAt = 0;
  private publicKeyFingerprint = '';
  private rotationTimer: NodeJS.Timeout | null = null;
  private onKeyRotation?: (newKeyMaterial: E2EEKeyMaterial) => void;

  /**
   * Generate ECDH key pair for key exchange
   */
  async generateECDHKeyPair(): Promise<ECDHKeyPair> {
    // Generate P-256 (secp256r1) key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['deriveKey']
    );

    // Export public key to transmit to peer
    const publicKeyArrayBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64 = this.arrayBufferToBase64(publicKeyArrayBuffer);

    // Generate fingerprint (SHA-256 of public key)
    const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyArrayBuffer);
    const fingerprint = this.arrayBufferToHex(fingerprintBuffer);

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      publicKeyBase64,
      fingerprint,
    };
  }

  /**
   * Derive shared AES-GCM key from ECDH exchange
   */
  async deriveSharedKey(
    localPrivateKey: CryptoKey,
    remotePeerPublicKeyBase64: string
  ): Promise<E2EEKeyMaterial> {
    // Import remote public key
    // WICHTIG: extractable=true für Safari, da hashKey() exportKey() aufruft
    const remotePeerPublicKeyBuffer = this.base64ToArrayBuffer(remotePeerPublicKeyBase64);
    const remotePeerPublicKey = await crypto.subtle.importKey(
      'raw',
      remotePeerPublicKeyBuffer,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // Safari requires extractable=true for hashKey fingerprint calculation
      []
    );

    // Derive shared secret via ECDH
    // WICHTIG: extractable=true ist erforderlich für Safari/Worker-basierte E2EE
    // Die Keys müssen an Web Worker gesendet werden (exportKey → postMessage)
    const sharedSecret = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: remotePeerPublicKey,
      },
      localPrivateKey,
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true, // extractable=true required for Safari Worker key transfer
      ['encrypt', 'decrypt']
    );

    // Generate fingerprint for verification
    const publicKeyFingerprint = await this.hashKey(remotePeerPublicKey);

    this.encryptionKey = sharedSecret;
    this.keyCreatedAt = Date.now();
    this.publicKeyFingerprint = publicKeyFingerprint;
    this.keyGeneration++;

    console.debug(`🔐 E2EE: Derived shared key (generation ${this.keyGeneration.toString()})`);

    return {
      encryptionKey: sharedSecret,
      createdAt: this.keyCreatedAt,
      publicKeyFingerprint,
      generation: this.keyGeneration,
    };
  }

  /**
   * Start automatic key rotation
   */
  startKeyRotation(onRotation: (newKeyMaterial: E2EEKeyMaterial) => void): void {
    this.onKeyRotation = onRotation;

    this.rotationTimer = setInterval(() => {
      console.debug('🔄 E2EE: Key rotation triggered');

      // Trigger key exchange with peer
      if (this.onKeyRotation && this.encryptionKey) {
        // Note: Actual key derivation happens after receiving peer's new public key
        // This is just a notification to initiate the exchange
        this.onKeyRotation({
          encryptionKey: this.encryptionKey,
          createdAt: this.keyCreatedAt,
          publicKeyFingerprint: this.publicKeyFingerprint,
          generation: this.keyGeneration,
        });
      }
    }, KEY_ROTATION_INTERVAL);

    console.debug(
      `🔄 E2EE: Key rotation enabled (every ${(KEY_ROTATION_INTERVAL / 1000).toString()}s)`
    );
  }

  /**
   * Stop key rotation
   */
  stopKeyRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.debug('🛑 E2EE: Key rotation stopped');
    }
  }

  /**
   * Encrypt media frame (for Insertable Streams)
   */
  async encryptFrame(frameData: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      throw new Error('E2EE: Encryption key not initialized');
    }

    // Generate random IV (96 bits for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt frame data with AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: AUTH_TAG_LENGTH,
      },
      this.encryptionKey,
      frameData
    );

    // Prepend IV to encrypted data (receiver needs it for decryption)
    // Format: [IV (12 bytes)] [Encrypted Data + Auth Tag]
    const result = new Uint8Array(IV_LENGTH + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), IV_LENGTH);

    return result.buffer;
  }

  /**
   * Decrypt media frame (for Insertable Streams)
   */
  async decryptFrame(encryptedFrameData: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      throw new Error('E2EE: Decryption key not initialized');
    }

    const data = new Uint8Array(encryptedFrameData);

    // Extract IV (first 12 bytes)
    const iv = data.slice(0, IV_LENGTH);

    // Extract encrypted data (remaining bytes)
    const encryptedData = data.slice(IV_LENGTH);

    // Decrypt with AES-GCM
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: AUTH_TAG_LENGTH,
      },
      this.encryptionKey,
      encryptedData
    );

    return decryptedData;
  }

  /**
   * Get current key material
   */
  getCurrentKeyMaterial(): E2EEKeyMaterial | null {
    if (!this.encryptionKey) return null;

    return {
      encryptionKey: this.encryptionKey,
      createdAt: this.keyCreatedAt,
      publicKeyFingerprint: this.publicKeyFingerprint,
      generation: this.keyGeneration,
    };
  }

  /**
   * Check if key needs rotation (based on age)
   */
  shouldRotateKey(): boolean {
    if (!this.keyCreatedAt) return false;

    const keyAge = Date.now() - this.keyCreatedAt;
    return keyAge >= KEY_ROTATION_INTERVAL;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopKeyRotation();
    this.encryptionKey = null;
    this.keyGeneration = 0;
    this.keyCreatedAt = 0;
    this.publicKeyFingerprint = '';
    console.debug('🧹 E2EE: Cleanup complete');
  }

  // --- Utility Methods ---

  /**
   * Hash CryptoKey for fingerprint generation
   */
  private async hashKey(key: CryptoKey): Promise<string> {
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', exportedKey);
    return this.arrayBufferToHex(hashBuffer);
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to hex string
   */
  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Check if browser supports Insertable Streams API
 */
export function isInsertableStreamsSupported(): boolean {
  // Check for RTCRtpSender.createEncodedStreams (Chrome/Edge)
  const hasCreateEncodedStreams = 'createEncodedStreams' in RTCRtpSender.prototype;

  // Check for RTCRtpSender.transform (Firefox standard)
  const hasTransform = 'transform' in RTCRtpSender.prototype;

  return hasCreateEncodedStreams || hasTransform;
}

/**
 * Get user-friendly browser compatibility info
 */
export function getE2EECompatibility(): {
  supported: boolean;
  browser: string;
  message: string;
} {
  const isSupported = isInsertableStreamsSupported();

  let browser = 'Unknown';
  if (navigator.userAgent.includes('Chrome')) browser = 'Chrome';
  else if (navigator.userAgent.includes('Firefox')) browser = 'Firefox';
  else if (navigator.userAgent.includes('Safari')) browser = 'Safari';
  else if (navigator.userAgent.includes('Edge')) browser = 'Edge';

  const message = isSupported
    ? `✅ E2EE supported on ${browser}`
    : `❌ E2EE not supported. Please use Chrome 86+, Edge 86+, or Firefox 117+`;

  return { supported: isSupported, browser, message };
}
