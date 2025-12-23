/**
 * ECDSA (Elliptic Curve Digital Signature Algorithm)
 *
 * Verwendet für Message Signing und Verification.
 * Ermöglicht die Verifikation dass Key Exchange Messages
 * wirklich vom behaupteten Sender stammen (MITM-Schutz).
 */

import { ECDSA_ALGORITHM, ECDH_CURVE, ECDSA_HASH } from './constants';
import { arrayBufferToBase64, arrayBufferToHex, base64ToArrayBuffer } from './encoding';
import type { ECDSAKeyPair, KeyFingerprint, Base64String } from './types';

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Generiert ein ECDSA Key Pair für Signing
 *
 * @returns ECDSAKeyPair mit Signing Key, Verification Key und Fingerprint
 */
export async function generateECDSAKeyPair(): Promise<ECDSAKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: ECDSA_ALGORITHM,
      namedCurve: ECDH_CURVE,
    },
    true, // extractable - need to export public key for sharing
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);

  const fingerprintBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer);
  const fingerprint = arrayBufferToHex(fingerprintBuffer) as KeyFingerprint;

  return {
    signingKey: keyPair.privateKey,
    verificationKey: keyPair.publicKey,
    publicKeyBase64,
    fingerprint,
  };
}

// ============================================================================
// Signing
// ============================================================================

/**
 * Signiert Daten mit ECDSA
 *
 * @param signingKey - ECDSA Private Key
 * @param data - Zu signierende Daten (String oder ArrayBuffer)
 * @returns Base64-encoded Signatur
 */
export async function signData(
  signingKey: CryptoKey,
  data: string | ArrayBuffer
): Promise<Base64String> {
  const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  const signature = await crypto.subtle.sign(
    {
      name: ECDSA_ALGORITHM,
      hash: ECDSA_HASH,
    },
    signingKey,
    dataBuffer
  );

  return arrayBufferToBase64(signature);
}

/**
 * Signiert ein Objekt (serialisiert es zuerst zu JSON)
 *
 * @param signingKey - ECDSA Private Key
 * @param obj - Zu signierendes Objekt
 * @returns Base64-encoded Signatur
 */
export async function signObject(
  signingKey: CryptoKey,
  obj: Record<string, unknown>
): Promise<Base64String> {
  // Sortiere Keys für deterministische Serialisierung
  const sortedJson = JSON.stringify(obj, Object.keys(obj).sort());
  return signData(signingKey, sortedJson);
}

// ============================================================================
// Verification
// ============================================================================

/**
 * Verifiziert eine ECDSA Signatur
 *
 * @param verificationKey - ECDSA Public Key
 * @param data - Original-Daten (String oder ArrayBuffer)
 * @param signatureBase64 - Base64-encoded Signatur
 * @returns true wenn Signatur gültig, false sonst
 */
export async function verifySignature(
  verificationKey: CryptoKey,
  data: string | ArrayBuffer,
  signatureBase64: Base64String | string
): Promise<boolean> {
  const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  const signatureBuffer = base64ToArrayBuffer(signatureBase64);

  try {
    return await crypto.subtle.verify(
      {
        name: ECDSA_ALGORITHM,
        hash: ECDSA_HASH,
      },
      verificationKey,
      signatureBuffer,
      dataBuffer
    );
  } catch {
    return false;
  }
}

/**
 * Verifiziert die Signatur eines Objekts
 *
 * @param verificationKey - ECDSA Public Key
 * @param obj - Original-Objekt
 * @param signatureBase64 - Base64-encoded Signatur
 * @returns true wenn Signatur gültig, false sonst
 */
export async function verifyObjectSignature(
  verificationKey: CryptoKey,
  obj: Record<string, unknown>,
  signatureBase64: Base64String | string
): Promise<boolean> {
  const sortedJson = JSON.stringify(obj, Object.keys(obj).sort());
  return verifySignature(verificationKey, sortedJson, signatureBase64);
}

// ============================================================================
// Key Import/Export
// ============================================================================

/**
 * Importiert einen ECDSA Verification Key aus Base64
 *
 * @param publicKeyBase64 - Base64-encoded Public Key
 * @returns CryptoKey für Signatur-Verifikation
 */
export async function importECDSAVerificationKey(
  publicKeyBase64: Base64String | string
): Promise<CryptoKey> {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);

  return crypto.subtle.importKey(
    'raw',
    publicKeyBuffer,
    {
      name: ECDSA_ALGORITHM,
      namedCurve: ECDH_CURVE,
    },
    true, // extractable for fingerprint calculation
    ['verify']
  );
}

/**
 * Exportiert einen ECDSA Verification Key zu Base64
 *
 * @param verificationKey - ECDSA Public Key
 * @returns Base64-encoded Public Key
 */
export async function exportECDSAVerificationKey(
  verificationKey: CryptoKey
): Promise<Base64String> {
  const buffer = await crypto.subtle.exportKey('raw', verificationKey);
  return arrayBufferToBase64(buffer);
}

/**
 * Importiert einen ECDSA Signing Key aus JWK Format
 *
 * @param jwk - JSON Web Key mit private key component (d)
 * @returns CryptoKey für Signing
 */
export async function importECDSASigningKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: ECDSA_ALGORITHM,
      namedCurve: ECDH_CURVE,
    },
    false, // private keys should not be extractable
    ['sign']
  );
}

/**
 * Exportiert ein ECDSA Key Pair zu JWK Format
 *
 * @param keyPair - ECDSA Signing und Verification Keys
 * @returns Objekt mit publicKeyJwk und privateKeyJwk
 */
export async function exportECDSAKeyPairToJwk(keyPair: {
  signingKey: CryptoKey;
  verificationKey: CryptoKey;
}): Promise<{ publicKeyJwk: JsonWebKey; privateKeyJwk: JsonWebKey }> {
  const [publicKeyJwk, privateKeyJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', keyPair.verificationKey),
    crypto.subtle.exportKey('jwk', keyPair.signingKey),
  ]);

  return { publicKeyJwk, privateKeyJwk };
}

// ============================================================================
// Key Exchange Message Signing
// ============================================================================

/**
 * Signiert eine Key Exchange Message
 * Verwendet für MITM-Schutz bei ECDH Key Exchange
 *
 * @param signingKey - ECDSA Private Key
 * @param publicKeyBase64 - Der zu signierende ECDH Public Key
 * @param timestamp - Unix timestamp in ms
 * @param nonce - Zufälliger Nonce für Replay-Schutz
 * @returns Base64-encoded Signatur
 */
export async function signKeyExchangeMessage(
  signingKey: CryptoKey,
  publicKeyBase64: Base64String | string,
  timestamp: number,
  nonce: string
): Promise<Base64String> {
  // Erstelle kanonische Nachricht für Signatur
  const message = `${publicKeyBase64}|${timestamp}|${nonce}`;
  return signData(signingKey, message);
}

/**
 * Verifiziert die Signatur einer Key Exchange Message
 *
 * @param verificationKey - ECDSA Public Key des Senders
 * @param publicKeyBase64 - Der signierte ECDH Public Key
 * @param timestamp - Unix timestamp in ms
 * @param nonce - Nonce aus der Nachricht
 * @param signatureBase64 - Die zu verifizierende Signatur
 * @returns true wenn Signatur gültig
 */
export async function verifyKeyExchangeMessage(
  verificationKey: CryptoKey,
  publicKeyBase64: Base64String | string,
  timestamp: number,
  nonce: string,
  signatureBase64: Base64String | string
): Promise<boolean> {
  const message = `${publicKeyBase64}|${timestamp}|${nonce}`;
  return verifySignature(verificationKey, message, signatureBase64);
}

// ============================================================================
// Fingerprint Utilities
// ============================================================================

/**
 * Berechnet den Fingerprint eines ECDSA Verification Keys
 *
 * @param verificationKey - ECDSA Public Key
 * @returns 64-character hex string (SHA-256 hash)
 */
export async function calculateECDSAFingerprint(
  verificationKey: CryptoKey
): Promise<KeyFingerprint> {
  const exportedKey = await crypto.subtle.exportKey('raw', verificationKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', exportedKey);
  return arrayBufferToHex(hashBuffer) as KeyFingerprint;
}
