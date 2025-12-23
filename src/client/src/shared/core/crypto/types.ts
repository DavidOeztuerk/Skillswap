/**
 * Crypto Type Definitions
 * Strikte Typisierung für alle kryptographischen Operationen
 */

// ============================================================================
// Branded Types für Compile-Time Sicherheit
// ============================================================================

/** Branded type für Base64 encoded strings */
export type Base64String = string & { readonly __brand: 'Base64' };

/** Branded type für Hex encoded strings */
export type HexString = string & { readonly __brand: 'Hex' };

/** Branded type für Key Fingerprints */
export type KeyFingerprint = HexString & { readonly __brand: 'KeyFingerprint' };

/** Key Generation Number */
export type KeyGeneration = number & { readonly __brand: 'KeyGeneration' };

// ============================================================================
// E2EE Method Types
// ============================================================================

/** Supported E2EE Methods */
export type E2EEMethod = 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Browser-specific AES-GCM Configuration
 * KRITISCH: Safari akzeptiert tagLength NICHT!
 */
export interface AesGcmConfig {
  /** Whether to include tagLength (Safari doesn't support it) */
  readonly includeTagLength: boolean;
}

// ============================================================================
// Key Pair Types
// ============================================================================

/** ECDH Key Pair */
export interface ECDHKeyPair {
  readonly publicKey: CryptoKey;
  readonly privateKey: CryptoKey;
  readonly publicKeyBase64: Base64String;
  readonly fingerprint: KeyFingerprint;
}

/** ECDSA Signing Key Pair */
export interface ECDSAKeyPair {
  readonly signingKey: CryptoKey;
  readonly verificationKey: CryptoKey;
  readonly publicKeyBase64: Base64String;
  readonly fingerprint: KeyFingerprint;
}

// ============================================================================
// E2EE Key Material Types
// ============================================================================

/** E2EE Key Material */
export interface E2EEKeyMaterial {
  readonly encryptionKey: CryptoKey;
  readonly createdAt: number;
  readonly publicKeyFingerprint: KeyFingerprint;
  readonly generation: KeyGeneration;
}

/** Encrypted Frame Result */
export interface EncryptedFrame {
  readonly data: ArrayBuffer;
  readonly iv: Uint8Array;
}

// ============================================================================
// Key Exchange Types
// ============================================================================

/** Key Exchange Message Types */
export type KeyExchangeType = 'keyOffer' | 'keyAnswer' | 'keyRotation';

/** Key Exchange Message */
export interface KeyExchangeMessage {
  readonly type: KeyExchangeType;
  readonly publicKey: Base64String;
  readonly fingerprint: KeyFingerprint;
  readonly signature: Base64String;
  readonly generation: KeyGeneration;
  readonly timestamp: number;
  readonly nonce: HexString;
  readonly signingPublicKey?: Base64String;
}

// ============================================================================
// Worker Types
// ============================================================================

/** Worker Encryption/Decryption Result */
export interface WorkerCryptoResult {
  readonly success: boolean;
  readonly data?: ArrayBuffer;
  readonly error?: string;
  readonly processingTimeMs?: number;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type Guard: Prüft ob ein Wert ein gültiger E2EE Method string ist
 */
export function isE2EEMethod(value: unknown): value is E2EEMethod {
  return (
    typeof value === 'string' &&
    ['encodedStreams', 'rtpTransform', 'scriptTransform', 'none'].includes(value)
  );
}

/**
 * Type Guard: Prüft ob ein Wert ein KeyExchangeMessage ist
 */
export function isKeyExchangeMessage(value: unknown): value is KeyExchangeMessage {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as Record<string, unknown>;
  return (
    typeof msg.type === 'string' &&
    ['keyOffer', 'keyAnswer', 'keyRotation'].includes(msg.type) &&
    typeof msg.publicKey === 'string' &&
    typeof msg.fingerprint === 'string' &&
    typeof msg.signature === 'string' &&
    typeof msg.generation === 'number' &&
    typeof msg.timestamp === 'number' &&
    typeof msg.nonce === 'string'
  );
}
