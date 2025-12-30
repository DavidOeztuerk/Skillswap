/**
 * AES-256-GCM Encryption/Decryption
 * Browser-agnostic implementation using Web Crypto API
 *
 * All modern browsers (Safari 17+, Chrome, Firefox, Edge) fully support
 * AES-GCM with tagLength parameter.
 */

import {
  AES_GCM_ALGORITHM,
  AES_KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  MIN_ENCRYPTED_FRAME_SIZE,
} from './constants';
import { generateRandomBytes, combineIvAndData, extractIvAndData } from './encoding';

// ============================================================================
// Encryption
// ============================================================================

/**
 * Verschlüsselt Daten mit AES-256-GCM
 *
 * @param key - AES CryptoKey
 * @param plaintext - Zu verschlüsselnde Daten
 * @returns Kombinierter Buffer: [IV][Ciphertext+AuthTag]
 */
export async function encryptAesGcm(key: CryptoKey, plaintext: ArrayBuffer): Promise<ArrayBuffer> {
  const iv = generateRandomBytes(IV_LENGTH);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv: iv as BufferSource,
      tagLength: AUTH_TAG_LENGTH,
    },
    key,
    plaintext
  );

  return combineIvAndData(iv, ciphertext);
}

/**
 * Verschlüsselt Daten mit spezifischem IV (für deterministische Tests)
 *
 * @param key - AES CryptoKey
 * @param plaintext - Zu verschlüsselnde Daten
 * @param iv - Initialization Vector (12 bytes)
 * @returns Kombinierter Buffer: [IV][Ciphertext+AuthTag]
 */
export async function encryptAesGcmWithIv(
  key: CryptoKey,
  plaintext: ArrayBuffer,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  if (iv.length !== IV_LENGTH) {
    throw new Error(`IV must be ${IV_LENGTH} bytes, got ${iv.length}`);
  }

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv: iv as BufferSource,
      tagLength: AUTH_TAG_LENGTH,
    },
    key,
    plaintext
  );

  return combineIvAndData(iv, ciphertext);
}

// ============================================================================
// Decryption
// ============================================================================

/**
 * Entschlüsselt AES-256-GCM verschlüsselte Daten
 *
 * @param key - AES CryptoKey
 * @param encryptedData - Kombinierter Buffer: [IV][Ciphertext+AuthTag]
 * @returns Entschlüsselte Daten
 * @throws Error wenn Entschlüsselung fehlschlägt (z.B. falscher Key, Manipulation)
 */
export async function decryptAesGcm(
  key: CryptoKey,
  encryptedData: ArrayBuffer
): Promise<ArrayBuffer> {
  const { iv, ciphertext } = extractIvAndData(encryptedData, IV_LENGTH);

  return crypto.subtle.decrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv: iv as BufferSource,
      tagLength: AUTH_TAG_LENGTH,
    },
    key,
    ciphertext as BufferSource
  );
}

/**
 * Versucht Entschlüsselung mit Fallback auf Passthrough
 * Nützlich für Übergangsphase wenn Peer noch nicht verschlüsselt
 *
 * @param key - AES CryptoKey (null für Passthrough)
 * @param data - Möglicherweise verschlüsselte Daten
 * @returns Objekt mit entschlüsselten Daten und Flag ob verschlüsselt war
 */
export async function tryDecryptAesGcm(
  key: CryptoKey | null,
  data: ArrayBuffer
): Promise<{ decrypted: ArrayBuffer; wasEncrypted: boolean }> {
  // Kein Key -> Passthrough
  if (key === null) {
    return { decrypted: data, wasEncrypted: false };
  }

  // Frame zu klein für verschlüsselte Daten -> Passthrough
  if (data.byteLength < MIN_ENCRYPTED_FRAME_SIZE) {
    return { decrypted: data, wasEncrypted: false };
  }

  try {
    const decrypted = await decryptAesGcm(key, data);
    return { decrypted, wasEncrypted: true };
  } catch {
    // Entschlüsselung fehlgeschlagen -> wahrscheinlich unverschlüsselt
    return { decrypted: data, wasEncrypted: false };
  }
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Generiert einen neuen AES-256-GCM Key
 *
 * @param extractable - Ob der Key exportierbar sein soll (default: true für Worker-Transfer)
 * @returns CryptoKey für AES-GCM Operationen
 */
export async function generateAesKey(extractable = true): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: AES_GCM_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    extractable,
    ['encrypt', 'decrypt']
  );
}

/**
 * Importiert einen AES Key aus Raw-Bytes
 *
 * @param keyData - 32 bytes (256 bits) Key Material
 * @param extractable - Ob der Key exportierbar sein soll
 * @returns CryptoKey für AES-GCM Operationen
 */
export async function importAesKeyFromRaw(
  keyData: ArrayBuffer,
  extractable = false
): Promise<CryptoKey> {
  if (keyData.byteLength !== 32) {
    throw new Error(`AES key must be 32 bytes, got ${keyData.byteLength}`);
  }

  return crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: AES_GCM_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    extractable,
    ['encrypt', 'decrypt']
  );
}

/**
 * Importiert einen AES Key aus JWK Format
 *
 * @param jwk - JSON Web Key
 * @param extractable - Ob der Key exportierbar sein soll
 * @returns CryptoKey für AES-GCM Operationen
 */
export async function importAesKeyFromJwk(
  jwk: JsonWebKey,
  extractable = false
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: AES_GCM_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    extractable,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exportiert einen AES Key zu JWK Format
 *
 * @param key - CryptoKey (muss extractable sein)
 * @returns JSON Web Key
 */
export async function exportAesKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/**
 * Exportiert einen AES Key zu Raw-Bytes
 *
 * @param key - CryptoKey (muss extractable sein)
 * @returns 32 bytes Key Material
 */
export async function exportAesKeyToRaw(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Prüft ob verschlüsselte Daten valide erscheinen
 * (Mindestgröße: IV + Auth Tag + 1 byte Payload)
 */
export function isValidEncryptedData(data: ArrayBuffer): boolean {
  return data.byteLength >= MIN_ENCRYPTED_FRAME_SIZE;
}

/**
 * Berechnet die erwartete Größe nach Verschlüsselung
 * (Original + IV + Auth Tag)
 */
export function calculateEncryptedSize(plaintextSize: number): number {
  return plaintextSize + IV_LENGTH + 16; // 16 bytes = 128 bit auth tag
}
