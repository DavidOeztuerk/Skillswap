/**
 * Crypto Factory
 *
 * Zentrale Factory für alle kryptographischen Operationen.
 * Browser-agnostisch - alle modernen Browser (Safari 17+, Chrome, Firefox, Edge)
 * unterstützen die gleichen Web Crypto APIs.
 *
 * Features:
 * - E2EE Readiness Checks
 * - Centralisierte Crypto Operations
 * - Key Management
 */

import {
  getCryptoCapabilities,
  getWorkerCapabilities,
  getE2EECapabilities,
  type CryptoCapabilities,
  type E2EEReadinessResult,
} from '../../detection';
import {
  encryptAesGcm,
  decryptAesGcm,
  tryDecryptAesGcm,
  generateAesKey,
  exportAesKeyToRaw,
  importAesKeyFromRaw,
} from './aesGcm';
import { generateECDHKeyPair, deriveSharedKey, importECDHPublicKey } from './ecdh';
import { generateECDSAKeyPair, signData, verifySignature } from './ecdsa';
import type { ECDHKeyPair, ECDSAKeyPair, Base64String } from './types';

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: CryptoFactory | null = null;

// ============================================================================
// Factory Class
// ============================================================================

/**
 * Crypto Factory - Singleton
 *
 * Verwendung:
 * ```typescript
 * const crypto = getCryptoFactory();
 * const encrypted = await crypto.encrypt(key, data);
 * ```
 */
export class CryptoFactory {
  private _cryptoCapabilities: CryptoCapabilities | null = null;
  private _isInitialized = false;

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialisiert die Factory und prüft Browser-Capabilities
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    this._cryptoCapabilities = await getCryptoCapabilities();
    this._isInitialized = true;

    console.debug('[CryptoFactory] Initialized:', {
      capabilities: this._cryptoCapabilities,
    });
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  /** Worker-Capabilities */
  get workerCapabilities(): ReturnType<typeof getWorkerCapabilities> {
    return getWorkerCapabilities();
  }

  // ==========================================================================
  // E2EE Readiness Check
  // ==========================================================================

  /**
   * Prüft ob E2EE bereit ist und gibt detaillierte Informationen zurück
   */
  async checkE2EEReadiness(): Promise<E2EEReadinessResult> {
    const caps = await getCryptoCapabilities();
    const e2ee = getE2EECapabilities();
    const workers = getWorkerCapabilities();

    const blockers: string[] = [];
    const warnings: string[] = [];

    // Blocker: Crypto nicht verfügbar
    if (!caps.hasWebCrypto || !caps.hasSubtleCrypto) {
      blockers.push('WebCrypto API not available');
    }

    // Blocker: Kein Secure Context
    if (!caps.isSecureContext) {
      blockers.push('Not running in secure context (HTTPS required)');
    }

    // Blocker: ECDH nicht unterstützt
    if (!caps.supportsECDH) {
      blockers.push('ECDH key exchange not supported');
    }

    // Blocker: AES-GCM nicht unterstützt
    if (!caps.supportsAesGcm) {
      blockers.push('AES-GCM encryption not supported');
    }

    // Blocker: E2EE Methode nicht verfügbar
    if (!e2ee.supported) {
      blockers.push(`Browser does not support any E2EE method (${e2ee.method})`);
    }

    // Blocker: Workers nicht unterstützt
    if (!workers.supportsWorkers) {
      blockers.push('Web Workers not supported');
    }

    // Warnung: Private Browsing
    if (caps.isPrivateBrowsing) {
      warnings.push('Private browsing mode detected - keys will not persist');
    }

    // Warnung: SharedArrayBuffer nicht verfügbar
    if (!workers.supportsSharedArrayBuffer) {
      warnings.push('SharedArrayBuffer not available - may impact performance');
    }

    return {
      ready: blockers.length === 0,
      method: e2ee.method,
      blockers,
      warnings,
    };
  }

  // ==========================================================================
  // AES-GCM Operations
  // ==========================================================================

  /**
   * Verschlüsselt Daten mit AES-256-GCM
   */
  async encrypt(key: CryptoKey, plaintext: ArrayBuffer): Promise<ArrayBuffer> {
    return encryptAesGcm(key, plaintext);
  }

  /**
   * Entschlüsselt Daten mit AES-256-GCM
   */
  async decrypt(key: CryptoKey, ciphertext: ArrayBuffer): Promise<ArrayBuffer> {
    return decryptAesGcm(key, ciphertext);
  }

  /**
   * Versucht Entschlüsselung mit Fallback auf Passthrough
   */
  async tryDecrypt(
    key: CryptoKey | null,
    data: ArrayBuffer
  ): Promise<{ decrypted: ArrayBuffer; wasEncrypted: boolean }> {
    return tryDecryptAesGcm(key, data);
  }

  // ==========================================================================
  // Key Generation
  // ==========================================================================

  /**
   * Generiert AES Key
   */
  async generateAesKey(): Promise<CryptoKey> {
    return generateAesKey(true);
  }

  /**
   * Generiert ECDH Key Pair
   */
  async generateECDHKeyPair(): Promise<ECDHKeyPair> {
    return generateECDHKeyPair();
  }

  /**
   * Generiert ECDSA Key Pair für Signaturen
   */
  async generateECDSAKeyPair(): Promise<ECDSAKeyPair> {
    return generateECDSAKeyPair();
  }

  // ==========================================================================
  // Key Exchange
  // ==========================================================================

  /**
   * Leitet Shared Key ab
   */
  async deriveSharedKey(
    localPrivateKey: CryptoKey,
    remotePeerPublicKey: CryptoKey
  ): Promise<CryptoKey> {
    return deriveSharedKey(localPrivateKey, remotePeerPublicKey, true);
  }

  /**
   * Importiert Remote Public Key
   */
  async importPublicKey(publicKeyBase64: Base64String | string): Promise<CryptoKey> {
    return importECDHPublicKey(publicKeyBase64, true);
  }

  // ==========================================================================
  // Signing
  // ==========================================================================

  /**
   * Signiert Daten
   * @returns Base64-encoded Signatur
   */
  async sign(privateKey: CryptoKey, data: string | ArrayBuffer): Promise<Base64String> {
    return signData(privateKey, data);
  }

  /**
   * Verifiziert Signatur
   */
  async verify(
    publicKey: CryptoKey,
    data: string | ArrayBuffer,
    signatureBase64: Base64String | string
  ): Promise<boolean> {
    return verifySignature(publicKey, data, signatureBase64);
  }

  // ==========================================================================
  // Key Serialization (für Worker-Transfer)
  // ==========================================================================

  /**
   * Exportiert Key für Worker-Transfer
   */
  async exportKeyForWorker(key: CryptoKey): Promise<ArrayBuffer> {
    return exportAesKeyToRaw(key);
  }

  /**
   * Importiert Key nach Worker-Transfer
   */
  async importKeyFromWorker(keyData: ArrayBuffer): Promise<CryptoKey> {
    return importAesKeyFromRaw(keyData, true);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Gibt Debug-Informationen zurück
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      workerCapabilities: this.workerCapabilities,
      cryptoCapabilities: this._cryptoCapabilities,
      isInitialized: this._isInitialized,
    };
  }
}

// ============================================================================
// Singleton Access
// ============================================================================

/**
 * Gibt die Singleton-Instanz der CryptoFactory zurück
 */
export function getCryptoFactory(): CryptoFactory {
  instance ??= new CryptoFactory();
  return instance;
}

/**
 * Initialisiert die CryptoFactory (sollte beim App-Start aufgerufen werden)
 */
export async function initializeCryptoFactory(): Promise<CryptoFactory> {
  const crypto = getCryptoFactory();
  await crypto.initialize();
  return crypto;
}

/**
 * Reset für Tests
 */
export function resetCryptoFactory(): void {
  instance = null;
}
