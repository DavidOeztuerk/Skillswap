/**
 * ECDH (Elliptic Curve Diffie-Hellman) Key Exchange
 *
 * Verwendet für den sicheren Schlüsselaustausch zwischen Peers.
 * Der abgeleitete Shared Key wird dann für AES-GCM Verschlüsselung verwendet.
 */

import { ECDH_CURVE, AES_GCM_ALGORITHM, AES_KEY_LENGTH } from './constants';
import { arrayBufferToBase64, arrayBufferToHex, base64ToArrayBuffer } from './encoding';
import type { ECDHKeyPair, KeyFingerprint, Base64String } from './types';

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Generiert ein ECDH Key Pair für Key Exchange
 *
 * @returns ECDHKeyPair mit Public Key, Private Key, Base64-encoded Public Key und Fingerprint
 */
export async function generateECDHKeyPair(): Promise<ECDHKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: ECDH_CURVE,
    },
    true, // extractable - required for key export
    ['deriveKey']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);

  const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
  const hexString = arrayBufferToHex(fingerprintBuffer);
  const fingerprint = hexString as unknown as KeyFingerprint;

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyBase64,
    fingerprint,
  };
}

// ============================================================================
// Key Import/Export
// ============================================================================

/**
 * Importiert einen ECDH Public Key aus Base64
 *
 * @param publicKeyBase64 - Base64-encoded Public Key (65 bytes raw format)
 * @param extractable - Safari benötigt extractable=true für Fingerprint-Berechnung!
 * @returns CryptoKey für ECDH deriveKey
 */
export async function importECDHPublicKey(
  publicKeyBase64: Base64String | string,
  extractable = true // Safari requires this for fingerprint calculation
): Promise<CryptoKey> {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);

  return crypto.subtle.importKey(
    'raw',
    publicKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: ECDH_CURVE,
    },
    extractable,
    []
  );
}

/**
 * Exportiert einen ECDH Public Key zu Base64
 *
 * @param publicKey - CryptoKey (muss extractable sein)
 * @returns Base64-encoded Public Key
 */
export async function exportECDHPublicKey(publicKey: CryptoKey): Promise<Base64String> {
  const buffer = await crypto.subtle.exportKey('raw', publicKey);
  return arrayBufferToBase64(buffer);
}

/**
 * Importiert einen ECDH Private Key aus JWK Format
 *
 * @param jwk - JSON Web Key mit private key component (d)
 * @returns CryptoKey für ECDH deriveKey
 */
export async function importECDHPrivateKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: ECDH_CURVE,
    },
    false, // private keys should not be extractable
    ['deriveKey']
  );
}

/**
 * Exportiert einen ECDH Key Pair zu JWK Format
 *
 * @param keyPair - ECDH CryptoKeyPair
 * @returns Objekt mit publicKeyJwk und privateKeyJwk
 */
export async function exportECDHKeyPairToJwk(keyPair: {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}): Promise<{ publicKeyJwk: JsonWebKey; privateKeyJwk: JsonWebKey }> {
  const [publicKeyJwk, privateKeyJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', keyPair.publicKey),
    crypto.subtle.exportKey('jwk', keyPair.privateKey),
  ]);

  return { publicKeyJwk, privateKeyJwk };
}

// ============================================================================
// Key Derivation
// ============================================================================

/**
 * Leitet einen shared AES Key via ECDH ab
 *
 * @param localPrivateKey - Lokaler ECDH Private Key
 * @param remotePeerPublicKey - Remote Peer's Public Key
 * @param extractable - true für Worker-Transfer (Safari!)
 * @returns AES-256-GCM CryptoKey
 */
export async function deriveSharedKey(
  localPrivateKey: CryptoKey,
  remotePeerPublicKey: CryptoKey,
  extractable = true // Required for Safari Worker key transfer
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: remotePeerPublicKey,
    },
    localPrivateKey,
    {
      name: AES_GCM_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    extractable,
    ['encrypt', 'decrypt']
  );
}

/**
 * Leitet Raw Key Material via ECDH ab (für HKDF oder andere KDFs)
 *
 * @param localPrivateKey - Lokaler ECDH Private Key
 * @param remotePeerPublicKey - Remote Peer's Public Key
 * @param lengthBits - Gewünschte Länge in Bits (default: 256)
 * @returns ArrayBuffer mit abgeleitetem Key Material
 */
export async function deriveRawKeyMaterial(
  localPrivateKey: CryptoKey,
  remotePeerPublicKey: CryptoKey,
  lengthBits = 256
): Promise<ArrayBuffer> {
  return crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: remotePeerPublicKey,
    },
    localPrivateKey,
    lengthBits
  );
}

// ============================================================================
// Fingerprint Utilities
// ============================================================================

/**
 * Berechnet den Fingerprint eines Public Keys
 *
 * @param publicKey - ECDH Public Key (CryptoKey)
 * @returns 64-character hex string (SHA-256 hash)
 */
export async function calculateKeyFingerprint(publicKey: CryptoKey): Promise<KeyFingerprint> {
  const exportedKey = await crypto.subtle.exportKey('raw', publicKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', exportedKey);
  return arrayBufferToHex(hashBuffer) as unknown as KeyFingerprint;
}

/**
 * Berechnet den Fingerprint aus Base64-encoded Public Key
 *
 * @param publicKeyBase64 - Base64-encoded Public Key
 * @returns 64-character hex string (SHA-256 hash)
 */
export async function calculateFingerprintFromBase64(
  publicKeyBase64: Base64String | string
): Promise<KeyFingerprint> {
  const keyBuffer = base64ToArrayBuffer(publicKeyBase64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
  return arrayBufferToHex(hashBuffer) as unknown as KeyFingerprint;
}

/**
 * Formatiert einen Fingerprint für User-Display
 * z.B. "a1b2c3d4e5f6..." -> "A1B2 C3D4 E5F6 ..."
 *
 * @param fingerprint - 64-character hex fingerprint
 * @param chunkSize - Zeichen pro Gruppe (default: 4)
 * @returns Formatierter String für Anzeige
 */
export function formatFingerprintForDisplay(
  fingerprint: KeyFingerprint | string,
  chunkSize = 4
): string {
  const fp = fingerprint;
  const chunks: string[] = [];
  for (let i = 0; i < fp.length; i += chunkSize) {
    chunks.push(fp.slice(i, i + chunkSize));
  }
  return chunks.length > 0 ? chunks.join(' ').toUpperCase() : fp.toUpperCase();
}

/**
 * Generiert einen kurzen Verification Code aus dem Fingerprint
 * Für schnelle manuelle Verifikation zwischen Teilnehmern
 *
 * @param fingerprint - 64-character hex fingerprint
 * @returns 12-character code wie "123-456-789"
 */
export function generateShortVerificationCode(fingerprint: KeyFingerprint): string {
  // Nimm die ersten 12 hex chars und konvertiere zu Dezimal
  const hexPart = String(fingerprint).slice(0, 12);
  const num = Number.parseInt(hexPart, 16);

  // Formatiere als 3 Gruppen von 3 Ziffern
  const str = (num % 1000000000).toString().padStart(9, '0');
  return `${str.slice(0, 3)}-${str.slice(3, 6)}-${str.slice(6, 9)}`;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Prüft ob zwei Fingerprints übereinstimmen
 * Verwendet constant-time comparison für Security
 */
export function fingerprintsMatch(
  fingerprint1: KeyFingerprint | string,
  fingerprint2: KeyFingerprint | string
): boolean {
  if (fingerprint1.length !== fingerprint2.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < fingerprint1.length; i++) {
    result |= fingerprint1.charCodeAt(i) ^ fingerprint2.charCodeAt(i);
  }

  return result === 0;
}
