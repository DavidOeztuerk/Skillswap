/**
 * Crypto Module - Public API
 *
 * Zentrale Exports für alle kryptographischen Operationen.
 * Browser-agnostisch - alle modernen Browser unterstützen die gleichen APIs.
 *
 * @example
 * ```typescript
 * import {
 *   arrayBufferToBase64,
 *   encryptAesGcm,
 *   generateECDHKeyPair,
 *   signData,
 *   getCryptoFactory
 * } from '@/shared/core/crypto';
 * ```
 */

// ============================================================================
// Constants
// ============================================================================

export {
  AES_GCM_ALGORITHM,
  AES_KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  MIN_ENCRYPTED_FRAME_SIZE,
  ECDH_CURVE,
  ECDSA_ALGORITHM,
  ECDSA_HASH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  KEY_ROTATION_INTERVAL_MS,
  KEY_EXCHANGE_TIMEOUT_MS,
  MAX_KEY_EXCHANGE_RETRIES,
  NONCE_MAX_AGE_MS,
  NONCE_CLEANUP_INTERVAL_MS,
} from './constants';

// ============================================================================
// Types
// ============================================================================

export type {
  Base64String,
  HexString,
  KeyFingerprint,
  KeyGeneration,
  E2EEMethod,
  ECDHKeyPair,
  ECDSAKeyPair,
  E2EEKeyMaterial,
  EncryptedFrame,
  KeyExchangeType,
  KeyExchangeMessage,
  WorkerCryptoResult,
} from './types';

export { isE2EEMethod, isKeyExchangeMessage } from './types';

// ============================================================================
// Encoding
// ============================================================================

export {
  // ArrayBuffer <-> Base64
  arrayBufferToBase64,
  base64ToArrayBuffer,
  // ArrayBuffer <-> Hex
  arrayBufferToHex,
  hexToArrayBuffer,
  // Random Generation
  generateRandomBytes,
  generateNonce,
  generateIV,
  // Buffer Operations
  copyArrayBuffer,
  combineIvAndData,
  extractIvAndData,
  // Type Guards
  isArrayBuffer,
  isUint8Array,
  isValidBase64,
  isValidHex,
  // Text Encoding
  stringToArrayBuffer,
  arrayBufferToString,
} from './encoding';

// ============================================================================
// AES-GCM
// ============================================================================

export {
  // Encryption
  encryptAesGcm,
  encryptAesGcmWithIv,
  // Decryption
  decryptAesGcm,
  tryDecryptAesGcm,
  // Key Management
  generateAesKey,
  importAesKeyFromRaw,
  importAesKeyFromJwk,
  exportAesKeyToJwk,
  exportAesKeyToRaw,
  // Utilities
  isValidEncryptedData,
  calculateEncryptedSize,
} from './aesGcm';

// ============================================================================
// ECDH
// ============================================================================

export {
  // Key Generation
  generateECDHKeyPair,
  // Key Import/Export
  importECDHPublicKey,
  exportECDHPublicKey,
  importECDHPrivateKeyFromJwk,
  exportECDHKeyPairToJwk,
  // Key Derivation
  deriveSharedKey,
  deriveRawKeyMaterial,
  // Fingerprint
  calculateKeyFingerprint,
  calculateFingerprintFromBase64,
  formatFingerprintForDisplay,
  generateShortVerificationCode,
  // Validation
  fingerprintsMatch,
} from './ecdh';

// ============================================================================
// ECDSA
// ============================================================================

export {
  // Key Generation
  generateECDSAKeyPair,
  // Signing
  signData,
  signObject,
  // Verification
  verifySignature,
  verifyObjectSignature,
  // Key Import/Export
  importECDSAVerificationKey,
  exportECDSAVerificationKey,
  importECDSASigningKeyFromJwk,
  exportECDSAKeyPairToJwk,
  // Key Exchange Signing
  signKeyExchangeMessage,
  verifyKeyExchangeMessage,
  // Fingerprint
  calculateECDSAFingerprint,
} from './ecdsa';

// ============================================================================
// Crypto Factory
// ============================================================================

export {
  CryptoFactory,
  getCryptoFactory,
  initializeCryptoFactory,
  resetCryptoFactory,
} from './adaptiveCryptoFactory';

// ============================================================================
// Storage Manager (für Private Mode Fallback)
// ============================================================================

export {
  SafariStorageManager,
  getSafariStorage,
  initializeSafariStorage,
  resetSafariStorage,
} from './safariStorageManager';

// ============================================================================
// WebRTC Adapter (für RTCRtpScriptTransform vs createEncodedStreams)
// ============================================================================

export {
  SafariWebRTCAdapter,
  createWebRTCAdapter,
  isWebRTCE2EESupported,
  getWebRTCE2EEMethod,
} from './safariWebRtcAdapter';
