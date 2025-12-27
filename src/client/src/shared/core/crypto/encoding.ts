/**
 * Encoding Utilities
 * Zentrale Funktionen für ArrayBuffer <-> Base64/Hex Konvertierungen
 *
 * WICHTIG: Diese Funktionen ersetzen alle duplizierten Implementierungen
 * in der Codebase (bisher in 6+ Dateien vorhanden).
 */

import { IV_LENGTH } from './constants';
import type { Base64String, HexString } from './types';

// ============================================================================
// ArrayBuffer <-> Base64
// ============================================================================

/**
 * Konvertiert ArrayBuffer zu Base64 String
 *
 * @param buffer - Der zu konvertierende ArrayBuffer
 * @returns Base64-encoded string (branded type)
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): Base64String {
  const bytes = new Uint8Array(buffer);
  const binaryChunks: string[] = [];

  // Process in chunks to avoid stack overflow for large buffers
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binaryChunks.push(String.fromCharCode(...chunk));
  }

  return btoa(binaryChunks.join('')) as Base64String;
}

/**
 * Konvertiert Base64 String zu ArrayBuffer
 *
 * @param base64 - Base64-encoded string
 * @returns ArrayBuffer mit den dekodierten Bytes
 * @throws Error wenn der Base64 String ungültig ist
 */
export function base64ToArrayBuffer(base64: Base64String | string): ArrayBuffer {
  const binaryString = atob(base64);
  const { length } = binaryString;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

// ============================================================================
// ArrayBuffer <-> Hex
// ============================================================================

/**
 * Konvertiert ArrayBuffer zu Hex String
 *
 * @param buffer - Der zu konvertierende ArrayBuffer
 * @returns Hex-encoded string (branded type)
 */
export function arrayBufferToHex(buffer: ArrayBuffer): HexString {
  const bytes = new Uint8Array(buffer);
  const hexParts: string[] = [];

  for (const byte of bytes) {
    hexParts.push(byte.toString(16).padStart(2, '0'));
  }

  return hexParts.join('') as HexString;
}

/**
 * Konvertiert Hex String zu ArrayBuffer
 *
 * @param hex - Hex-encoded string
 * @returns ArrayBuffer mit den dekodierten Bytes
 */
export function hexToArrayBuffer(hex: HexString | string): ArrayBuffer {
  const length = hex.length / 2;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes.buffer;
}

// ============================================================================
// Random Bytes & Nonce Generation
// ============================================================================

/**
 * Generiert kryptographisch sichere zufällige Bytes
 *
 * @param length - Anzahl der zu generierenden Bytes
 * @returns Uint8Array mit zufälligen Bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generiert einen sicheren Nonce für Replay Protection
 *
 * @returns 32-character hex string (16 bytes)
 */
export function generateNonce(): HexString {
  return arrayBufferToHex(generateRandomBytes(16).buffer as ArrayBuffer);
}

/**
 * Generiert eine Initialization Vector für AES-GCM
 *
 * @returns 12-byte Uint8Array (96 bits)
 */
export function generateIV(): Uint8Array {
  return generateRandomBytes(IV_LENGTH);
}

// ============================================================================
// Buffer Operations
// ============================================================================

/**
 * Kopiert einen ArrayBuffer (für Transfer-sichere Operationen)
 *
 * @param buffer - Der zu kopierende ArrayBuffer
 * @returns Neue Kopie des ArrayBuffers
 */
export function copyArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const copy = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(copy).set(new Uint8Array(buffer));
  return copy;
}

/**
 * Kombiniert IV und verschlüsselte Daten in einen Buffer
 * Format: [IV (12 bytes)] [Encrypted Data + Auth Tag]
 *
 * @param iv - Initialization Vector (12 bytes)
 * @param encryptedData - Verschlüsselte Daten mit Auth Tag
 * @returns Kombinierter ArrayBuffer
 */
export function combineIvAndData(iv: Uint8Array, encryptedData: ArrayBuffer): ArrayBuffer {
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  return combined.buffer;
}

/**
 * Extrahiert IV und verschlüsselte Daten aus kombiniertem Buffer
 *
 * @param combined - Kombinierter Buffer [IV][Ciphertext+AuthTag]
 * @param ivLength - Länge des IV (default: 12 bytes)
 * @returns Objekt mit iv und ciphertext
 */
export function extractIvAndData(
  combined: ArrayBuffer,
  ivLength: number = IV_LENGTH
): { iv: Uint8Array; ciphertext: Uint8Array } {
  const data = new Uint8Array(combined);
  return {
    iv: data.slice(0, ivLength),
    ciphertext: data.slice(ivLength),
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type Guard: Prüft ob ein Wert ein ArrayBuffer ist
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

/**
 * Type Guard: Prüft ob ein Wert ein Uint8Array ist
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

/**
 * Type Guard: Prüft ob ein String ein gültiger Base64 String ist
 */
export function isValidBase64(value: string): boolean {
  try {
    atob(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type Guard: Prüft ob ein String ein gültiger Hex String ist
 */
export function isValidHex(value: string): boolean {
  return /^[0-9a-fA-F]*$/.test(value) && value.length % 2 === 0;
}

// ============================================================================
// Text Encoding
// ============================================================================

/**
 * Konvertiert einen String zu ArrayBuffer (UTF-8)
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

/**
 * Konvertiert ArrayBuffer zu String (UTF-8)
 */
export function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}
