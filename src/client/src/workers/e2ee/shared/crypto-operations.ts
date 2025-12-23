/**
 * Shared Crypto Operations for E2EE Workers
 *
 * Diese Funktionen sind identisch für Chrome und Safari Workers.
 * Sie werden in beide Worker-Dateien eingebunden.
 *
 * WICHTIG: Workers können nicht direkt aus dem Hauptbundle importieren,
 * daher sind die Konstanten hier dupliziert.
 */

import type { WorkerStats } from './message-types';
import { createInitialStats } from './message-types';

// ============================================================================
// Constants (duplicated for Worker isolation)
// Workers können nicht aus dem Hauptbundle importieren!
// ============================================================================

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 128;
const MIN_ENCRYPTED_FRAME_SIZE = IV_LENGTH + 16 + 1; // IV + AuthTag (16 bytes) + 1 byte payload

// ============================================================================
// Worker State
// ============================================================================

/**
 * Interner State des Workers
 */
export interface WorkerCryptoState {
  encryptionKey: CryptoKey | null;
  generation: number;
  encryptionEnabled: boolean;
  stats: WorkerStats;
}

/**
 * Erstellt den initialen Worker-State
 */
export function createInitialState(): WorkerCryptoState {
  return {
    encryptionKey: null,
    generation: 0,
    encryptionEnabled: false,
    stats: createInitialStats(),
  };
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Importiert einen Encryption Key aus JWK Format
 *
 * @param jwk - JSON Web Key
 * @returns CryptoKey für AES-GCM Operationen
 */
export async function importEncryptionKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    false, // nicht extractable im Worker
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// Encryption Configuration
// ============================================================================

/**
 * Encryption Konfiguration
 * KRITISCH: Safari akzeptiert tagLength NICHT!
 */
export interface EncryptionConfig {
  /** true für Safari - kein tagLength Parameter */
  readonly useSafariMode: boolean;
}

/** Chrome/Firefox Konfiguration - MIT tagLength */
export const CHROME_CONFIG: EncryptionConfig = {
  useSafariMode: false,
} as const;

/** Safari Konfiguration - OHNE tagLength */
export const SAFARI_CONFIG: EncryptionConfig = {
  useSafariMode: true,
} as const;

// ============================================================================
// Encryption
// ============================================================================

/**
 * Verschlüsselt Frame-Daten mit AES-256-GCM
 *
 * @param key - AES CryptoKey
 * @param frameData - Zu verschlüsselnde Frame-Daten
 * @param config - Browser-spezifische Konfiguration
 * @returns Kombinierter Buffer: [IV (12 bytes)][Ciphertext + AuthTag]
 */
export async function encryptFrameData(
  key: CryptoKey,
  frameData: ArrayBuffer,
  config: EncryptionConfig
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // KRITISCH: Safari akzeptiert tagLength NICHT!
  const params: AesGcmParams = {
    name: 'AES-GCM',
    iv,
  };

  // Nur für Chrome/Firefox tagLength hinzufügen
  if (!config.useSafariMode) {
    params.tagLength = AUTH_TAG_LENGTH;
  }

  const encryptedData = await crypto.subtle.encrypt(params, key, frameData);

  // Kombiniere IV + Ciphertext
  const combined = new Uint8Array(IV_LENGTH + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), IV_LENGTH);

  return combined.buffer;
}

// ============================================================================
// Decryption
// ============================================================================

/**
 * Ergebnis einer Decryption-Operation
 */
export interface DecryptionResult {
  /** Entschlüsselte oder Original-Daten */
  readonly data: ArrayBuffer;
  /** true wenn erfolgreich entschlüsselt, false wenn Passthrough */
  readonly wasEncrypted: boolean;
}

/**
 * Entschlüsselt Frame-Daten mit AES-256-GCM
 * Fallback auf Passthrough wenn Decryption fehlschlägt
 *
 * @param key - AES CryptoKey (null für Passthrough)
 * @param encryptedData - Möglicherweise verschlüsselte Frame-Daten
 * @param config - Browser-spezifische Konfiguration
 * @returns Decryption-Ergebnis
 */
export async function decryptFrameData(
  key: CryptoKey | null,
  encryptedData: ArrayBuffer,
  config: EncryptionConfig
): Promise<DecryptionResult> {
  // Kein Key -> Passthrough
  if (key === null) {
    return { data: encryptedData, wasEncrypted: false };
  }

  // Frame zu klein -> wahrscheinlich unverschlüsselt
  if (encryptedData.byteLength < MIN_ENCRYPTED_FRAME_SIZE) {
    return { data: encryptedData, wasEncrypted: false };
  }

  const data = new Uint8Array(encryptedData);
  const iv = data.slice(0, IV_LENGTH);
  const ciphertext = data.slice(IV_LENGTH);

  const params: AesGcmParams = {
    name: 'AES-GCM',
    iv,
  };

  if (!config.useSafariMode) {
    params.tagLength = AUTH_TAG_LENGTH;
  }

  try {
    const decrypted = await crypto.subtle.decrypt(params, key, ciphertext);
    return { data: decrypted, wasEncrypted: true };
  } catch {
    // Decryption fehlgeschlagen -> Frame war wahrscheinlich unverschlüsselt
    // oder mit anderem Key verschlüsselt (während Key Rotation)
    return { data: encryptedData, wasEncrypted: false };
  }
}

// ============================================================================
// Stats Helpers
// ============================================================================

/**
 * Aktualisiert Encryption-Statistiken
 */
export function updateEncryptionStats(stats: WorkerStats, encryptionTimeMs: number): WorkerStats {
  const n = stats.encryptedFrames;
  const newAvg = (stats.averageEncryptionTimeMs * n + encryptionTimeMs) / (n + 1);

  return {
    ...stats,
    totalFrames: stats.totalFrames + 1,
    encryptedFrames: n + 1,
    averageEncryptionTimeMs: newAvg,
  };
}

/**
 * Aktualisiert Decryption-Statistiken
 */
export function updateDecryptionStats(
  stats: WorkerStats,
  decryptionTimeMs: number,
  wasEncrypted: boolean
): WorkerStats {
  if (!wasEncrypted) {
    return {
      ...stats,
      totalFrames: stats.totalFrames + 1,
      passthroughFrames: stats.passthroughFrames + 1,
    };
  }

  const n = stats.decryptedFrames;
  const newAvg = (stats.averageDecryptionTimeMs * n + decryptionTimeMs) / (n + 1);

  return {
    ...stats,
    totalFrames: stats.totalFrames + 1,
    decryptedFrames: n + 1,
    averageDecryptionTimeMs: newAvg,
  };
}

/**
 * Inkrementiert Encryption-Fehler Counter
 */
export function incrementEncryptionError(stats: WorkerStats): WorkerStats {
  return {
    ...stats,
    totalFrames: stats.totalFrames + 1,
    encryptionErrors: stats.encryptionErrors + 1,
  };
}

/**
 * Inkrementiert Decryption-Fehler Counter
 */
export function incrementDecryptionError(stats: WorkerStats): WorkerStats {
  return {
    ...stats,
    totalFrames: stats.totalFrames + 1,
    decryptionErrors: stats.decryptionErrors + 1,
  };
}

/**
 * Setzt den Key Generation Counter
 */
export function setKeyGeneration(stats: WorkerStats, generation: number): WorkerStats {
  return {
    ...stats,
    keyGeneration: generation,
  };
}

/**
 * Setzt den Encryption Enabled Status
 */
export function setEncryptionEnabled(stats: WorkerStats, enabled: boolean): WorkerStats {
  return {
    ...stats,
    encryptionEnabled: enabled,
  };
}
