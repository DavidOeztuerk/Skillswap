/**
 * E2EE Video Encryption Manager
 *
 * Orchestriert ECDH Key Exchange und Shared Key Derivation für Video E2EE.
 * Nutzt die core/crypto Primitives für alle kryptographischen Operationen.
 */

import {
  // Types
  type ECDHKeyPair,
  type E2EEKeyMaterial,
  type KeyFingerprint,
  type KeyGeneration,
  // ECDH Functions
  generateECDHKeyPair,
  deriveSharedKey,
  calculateKeyFingerprint,
  // AES-GCM Functions
  encryptAesGcm,
  decryptAesGcm,
  // Encoding
  base64ToArrayBuffer,
  // Constants
  KEY_ROTATION_INTERVAL_MS,
} from '../../core/crypto';
import { getE2EECapabilities } from '../../detection';

/**
 * E2EE Manager - Orchestriert Key Exchange und Frame Encryption
 */
export class E2EEManager {
  private encryptionKey: CryptoKey | null = null;
  private keyGeneration = 0;
  private keyCreatedAt = 0;
  private publicKeyFingerprint = '';
  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private onKeyRotation?: (newKeyMaterial: E2EEKeyMaterial) => void;

  /**
   * Generiert ein neues ECDH Key Pair
   */
  async generateECDHKeyPair(): Promise<ECDHKeyPair> {
    return generateECDHKeyPair();
  }

  /**
   * Leitet einen Shared Key aus dem lokalen Private Key und dem Remote Public Key ab
   */
  async deriveSharedKey(
    localPrivateKey: CryptoKey,
    remotePeerPublicKeyBase64: string
  ): Promise<E2EEKeyMaterial> {
    // Import remote public key
    const remotePeerPublicKeyBuffer = base64ToArrayBuffer(remotePeerPublicKeyBase64);
    const remotePeerPublicKey = await crypto.subtle.importKey(
      'raw',
      remotePeerPublicKeyBuffer,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );

    // Derive shared key
    const sharedSecret = await deriveSharedKey(localPrivateKey, remotePeerPublicKey);

    // Calculate fingerprint
    const publicKeyFingerprint = await calculateKeyFingerprint(remotePeerPublicKey);

    // Update internal state
    this.encryptionKey = sharedSecret;
    this.keyCreatedAt = Date.now();
    this.publicKeyFingerprint = publicKeyFingerprint;
    this.keyGeneration++;

    console.debug(`🔐 E2EE: Derived shared key (generation ${this.keyGeneration})`);

    return {
      encryptionKey: sharedSecret,
      createdAt: this.keyCreatedAt,
      publicKeyFingerprint,
      generation: this.keyGeneration as KeyGeneration,
    };
  }

  /**
   * Startet die automatische Key Rotation
   */
  startKeyRotation(onRotation: (newKeyMaterial: E2EEKeyMaterial) => void): void {
    this.onKeyRotation = onRotation;

    this.rotationTimer = setInterval(() => {
      console.debug('🔄 E2EE: Key rotation triggered');

      if (this.onKeyRotation && this.encryptionKey) {
        this.onKeyRotation({
          encryptionKey: this.encryptionKey,
          createdAt: this.keyCreatedAt,
          publicKeyFingerprint: this.publicKeyFingerprint as KeyFingerprint,
          generation: this.keyGeneration as KeyGeneration,
        });
      }
    }, KEY_ROTATION_INTERVAL_MS);

    console.debug(`🔄 E2EE: Key rotation enabled (every ${KEY_ROTATION_INTERVAL_MS / 1000}s)`);
  }

  /**
   * Stoppt die automatische Key Rotation
   */
  stopKeyRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.debug('🛑 E2EE: Key rotation stopped');
    }
  }

  /**
   * Verschlüsselt einen Frame (für direkte Verwendung, nicht Worker)
   */
  async encryptFrame(frameData: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      throw new Error('E2EE: Encryption key not initialized');
    }

    // encryptAesGcm returns combined [IV][Ciphertext+AuthTag] buffer
    return encryptAesGcm(this.encryptionKey, frameData);
  }

  /**
   * Entschlüsselt einen Frame (für direkte Verwendung, nicht Worker)
   */
  async decryptFrame(encryptedFrameData: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      throw new Error('E2EE: Decryption key not initialized');
    }

    return decryptAesGcm(this.encryptionKey, encryptedFrameData);
  }

  /**
   * Gibt das aktuelle Key Material zurück
   */
  getCurrentKeyMaterial(): E2EEKeyMaterial | null {
    if (!this.encryptionKey) return null;

    return {
      encryptionKey: this.encryptionKey,
      createdAt: this.keyCreatedAt,
      publicKeyFingerprint: this.publicKeyFingerprint as KeyFingerprint,
      generation: this.keyGeneration as KeyGeneration,
    };
  }

  /**
   * Prüft ob der Key rotiert werden sollte
   */
  shouldRotateKey(): boolean {
    if (!this.keyCreatedAt) return false;

    const keyAge = Date.now() - this.keyCreatedAt;
    return keyAge >= KEY_ROTATION_INTERVAL_MS;
  }

  /**
   * Gibt den aktuellen Encryption Key zurück (für Worker)
   */
  getEncryptionKey(): CryptoKey | null {
    return this.encryptionKey;
  }

  /**
   * Gibt die aktuelle Key Generation zurück
   */
  getKeyGeneration(): number {
    return this.keyGeneration;
  }

  /**
   * Cleanup - Gibt alle Ressourcen frei
   */
  cleanup(): void {
    this.stopKeyRotation();
    this.encryptionKey = null;
    this.keyGeneration = 0;
    this.keyCreatedAt = 0;
    this.publicKeyFingerprint = '';
    console.debug('🧹 E2EE: Cleanup complete');
  }
}

/**
 * Prüft ob Insertable Streams unterstützt werden
 */
export function isInsertableStreamsSupported(): boolean {
  const caps = getE2EECapabilities();
  return caps.supported;
}

/**
 * Gibt E2EE Kompatibilitäts-Info zurück
 */
export function getE2EECompatibility(): {
  supported: boolean;
  browser: string;
  message: string;
} {
  const caps = getE2EECapabilities();
  return {
    supported: caps.supported,
    browser: caps.method,
    message: caps.supported
      ? `✅ E2EE supported (${caps.method})`
      : '❌ E2EE not supported. Please use Chrome 86+, Edge 86+, Firefox 117+, or Safari 15.4+',
  };
}
