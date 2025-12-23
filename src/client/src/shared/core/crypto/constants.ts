/**
 * Cryptographic Constants
 * Zentrale Definition aller Crypto-Konstanten für Konsistenz
 */

/** AES-GCM Algorithmus Name */
export const AES_GCM_ALGORITHM = 'AES-GCM' as const;

/** AES Key Länge in Bits */
export const AES_KEY_LENGTH = 256 as const;

/** Initialization Vector Länge in Bytes (96 bits für GCM) */
export const IV_LENGTH = 12 as const;

/** Authentication Tag Länge in Bits */
export const AUTH_TAG_LENGTH = 128 as const;

/** Minimum verschlüsselte Frame-Größe: IV + Auth Tag + 1 byte Payload */
export const MIN_ENCRYPTED_FRAME_SIZE = (IV_LENGTH + 16 + 1) as const;

/** ECDH Kurve */
export const ECDH_CURVE = 'P-256' as const;

/** ECDSA Algorithmus */
export const ECDSA_ALGORITHM = 'ECDSA' as const;

/** ECDSA Hash */
export const ECDSA_HASH = 'SHA-256' as const;

/** PBKDF2 Iterationen für Key Derivation */
export const PBKDF2_ITERATIONS = 100_000 as const;

/** Salt Länge für PBKDF2 */
export const SALT_LENGTH = 16 as const;

/** Key Rotation Interval in Millisekunden (60 Sekunden) */
export const KEY_ROTATION_INTERVAL_MS = 60_000 as const;

/** Key Exchange Timeout in Millisekunden */
export const KEY_EXCHANGE_TIMEOUT_MS = 15_000 as const;

/** Maximum Key Exchange Retry Attempts */
export const MAX_KEY_EXCHANGE_RETRIES = 5 as const;

/** Nonce Maximum Age für Replay Protection (5 Minuten) */
export const NONCE_MAX_AGE_MS = (5 * 60 * 1000) as const;

/** Nonce Cleanup Interval */
export const NONCE_CLEANUP_INTERVAL_MS = 60_000 as const;
