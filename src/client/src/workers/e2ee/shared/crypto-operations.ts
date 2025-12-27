/**
 * Shared Crypto Operations for E2EE Workers
 *
 * Diese Funktionen sind identisch für alle Browser (Chrome, Safari, Firefox).
 * Sie werden in beide Worker-Dateien eingebunden.
 *
 * WICHTIG: Workers können nicht direkt aus dem Hauptbundle importieren,
 * daher sind die Konstanten hier dupliziert.
 *
 * BROWSER-KOMPATIBILITÄT (verifiziert 2024-12):
 * - AES-GCM tagLength: Funktioniert in ALLEN modernen Browsern (Safari 17+, Chrome, Firefox)
 * - Worker Message Transfer: 10MB+ ohne Probleme in allen Browsern
 * - CryptoKey Transfer: Direkter Transfer funktioniert überall
 */

import type { WorkerStats } from './message-types';
import { createInitialStats } from './message-types';

// ============================================================================
// Constants (duplicated for Worker isolation)
// Workers können nicht aus dem Hauptbundle importieren!
// ============================================================================

const IV_LENGTH = 12;
const GENERATION_BYTE_LENGTH = 1;
// Frame format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag (16 bytes min)]
const MIN_ENCRYPTED_FRAME_SIZE = GENERATION_BYTE_LENGTH + IV_LENGTH + 16 + 1;

// ============================================================================
// Worker State with Multi-Key Support
// ============================================================================

/**
 * Key Entry mit Generation
 */
export interface KeyEntry {
  key: CryptoKey;
  generation: number;
}

/**
 * Interner State des Workers mit Multi-Key Support für Key Rotation
 *
 * Wir speichern bis zu 2 Keys: den aktuellen und den vorherigen.
 * Dadurch können Frames, die während einer Key Rotation noch unterwegs sind,
 * trotzdem entschlüsselt werden.
 */
export interface WorkerCryptoState {
  /** Aktueller Encryption Key */
  encryptionKey: CryptoKey | null;
  /** Aktuelle Key Generation */
  generation: number;
  /** Vorheriger Key für Fallback bei Decryption */
  previousKey: CryptoKey | null;
  /** Vorherige Generation */
  previousGeneration: number;
  /** Encryption aktiviert? */
  encryptionEnabled: boolean;
  /** Statistiken */
  stats: WorkerStats;
}

/**
 * Erstellt den initialen Worker-State
 */
export function createInitialState(): WorkerCryptoState {
  return {
    encryptionKey: null,
    generation: 0,
    previousKey: null,
    previousGeneration: 0,
    encryptionEnabled: false,
    stats: createInitialStats(),
  };
}

/**
 * Aktualisiert den Key im State (mit Rotation Support)
 * Der vorherige Key wird gespeichert für Frames die noch unterwegs sind.
 */
export function updateKeyInState(
  state: WorkerCryptoState,
  newKey: CryptoKey,
  newGeneration: number
): WorkerCryptoState {
  return {
    ...state,
    // Vorherigen Key speichern
    previousKey: state.encryptionKey,
    previousGeneration: state.generation,
    // Neuen Key setzen
    encryptionKey: newKey,
    generation: newGeneration,
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
// Encryption
// ============================================================================

/**
 * Verschlüsselt Frame-Daten mit AES-256-GCM
 *
 * Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
 *
 * HINWEIS: Wir setzen tagLength NICHT explizit, weil:
 * - AES-GCM default ist 128-bit (was wir wollen)
 * - Weniger Code = weniger Fehlerquellen
 * - Alle Browser unterstützen tagLength, aber default funktioniert überall
 *
 * @param key - AES CryptoKey
 * @param frameData - Zu verschlüsselnde Frame-Daten
 * @param generation - Key Generation (0-255, wird als 1 Byte gespeichert)
 * @returns Kombinierter Buffer: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
 */
export async function encryptFrameData(
  key: CryptoKey,
  frameData: ArrayBuffer,
  _config?: unknown, // Legacy parameter, ignored
  generation = 1
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const params: AesGcmParams = {
    name: 'AES-GCM',
    iv,
    // tagLength nicht gesetzt = default 128-bit (korrekt für alle Browser)
  };

  const encryptedData = await crypto.subtle.encrypt(params, key, frameData);

  // Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
  const combined = new Uint8Array(GENERATION_BYTE_LENGTH + IV_LENGTH + encryptedData.byteLength);
  combined[0] = generation & 0xff; // Generation als 1 Byte (mod 256)
  combined.set(iv, GENERATION_BYTE_LENGTH);
  combined.set(new Uint8Array(encryptedData), GENERATION_BYTE_LENGTH + IV_LENGTH);

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
  /** Generation des Keys der zum Entschlüsseln verwendet wurde */
  readonly usedGeneration?: number;
}

/**
 * Entschlüsselt Frame-Daten mit Multi-Key Support für Key Rotation
 *
 * Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
 *
 * Diese Funktion liest das Generation Byte und wählt den passenden Key:
 * - Wenn frameGeneration == currentGeneration: currentKey verwenden
 * - Wenn frameGeneration == previousGeneration: previousKey verwenden
 * - Sonst: Decryption fehlgeschlagen (Frame zu alt oder Key nicht bekannt)
 *
 * @param state - Worker State mit current und previous Key
 * @param encryptedData - Verschlüsselte Frame-Daten mit Generation Prefix
 * @returns Decryption-Ergebnis
 */
export async function decryptFrameDataWithState(
  state: WorkerCryptoState,
  encryptedData: ArrayBuffer,
  _config?: unknown // Legacy parameter, ignored
): Promise<DecryptionResult> {
  // Keine Keys -> Passthrough nicht möglich, Frame muss gedroppt werden
  if (state.encryptionKey === null) {
    return { data: encryptedData, wasEncrypted: false };
  }

  // Frame zu klein -> wahrscheinlich unverschlüsselt
  if (encryptedData.byteLength < MIN_ENCRYPTED_FRAME_SIZE) {
    return { data: encryptedData, wasEncrypted: false };
  }

  const data = new Uint8Array(encryptedData);

  // Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
  const frameGeneration = data[0];
  const iv = data.slice(GENERATION_BYTE_LENGTH, GENERATION_BYTE_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(GENERATION_BYTE_LENGTH + IV_LENGTH);

  // Wähle den richtigen Key basierend auf Frame Generation
  // HINWEIS: Generation ist 1 Byte (0-255), wraps bei 256 → 0
  let keyToUse: CryptoKey | null = null;

  if (frameGeneration === (state.generation & 0xff)) {
    // Frame mit aktueller Generation -> aktuellen Key verwenden
    keyToUse = state.encryptionKey;
  } else if (state.previousKey !== null && frameGeneration === (state.previousGeneration & 0xff)) {
    // Frame mit vorheriger Generation -> vorherigen Key verwenden (Key Rotation!)
    keyToUse = state.previousKey;
  }

  if (keyToUse === null) {
    // Generation doesn't match any known key.
    //
    // WICHTIG: Unterscheide zwischen:
    // 1. RAW/unverschlüsselter Frame (erstes Byte ist zufällige Audio/Video-Daten)
    // 2. Wirklich verschlüsselter Frame mit unbekannter Generation
    //
    // Heuristik: Wenn die Generation WEIT von current/previous entfernt ist,
    // ist es wahrscheinlich ein RAW Frame (z.B. Generation 120 bei current=1).
    //
    // Bei Key Rotation liegt die Generation nur 1-2 Schritte entfernt.
    // Alles was >10 entfernt ist, ist fast sicher ein unverschlüsselter Frame.
    const currentGenByte = state.generation & 0xff;
    const prevGenByte = state.previousGeneration & 0xff;

    // Berechne minimale Distanz (mit 256-Wrap-Around)
    const diffToCurrent = Math.min(
      Math.abs(frameGeneration - currentGenByte),
      256 - Math.abs(frameGeneration - currentGenByte)
    );
    const diffToPrev = Math.min(
      Math.abs(frameGeneration - prevGenByte),
      256 - Math.abs(frameGeneration - prevGenByte)
    );
    const minDiff = Math.min(diffToCurrent, diffToPrev);

    // Toleranz: Bis zu 5 Generationen Unterschied erlauben
    // (für Race Conditions bei schneller Key Rotation)
    const MAX_GENERATION_TOLERANCE = 5;

    if (minDiff > MAX_GENERATION_TOLERANCE) {
      // Generation ist WEIT entfernt (z.B. 120 vs 1)
      // → Dies ist fast sicher ein RAW/unverschlüsselter Frame!
      // → Passthrough statt Error, damit der Decoder ihn verarbeiten kann
      return { data: encryptedData, wasEncrypted: false };
    }

    // Generation ist nah (z.B. 3 vs 1) - könnte ein verpasster Key Update sein
    // In diesem Fall besser droppen, da Decryption fehlschlagen würde
    throw new Error(
      `No matching key for frame generation ${frameGeneration} ` +
        `(current=${state.generation}, previous=${state.previousGeneration})`
    );
  }

  const params: AesGcmParams = {
    name: 'AES-GCM',
    iv,
  };

  try {
    const decrypted = await crypto.subtle.decrypt(params, keyToUse, ciphertext);
    return {
      data: decrypted,
      wasEncrypted: true,
      usedGeneration: frameGeneration,
    };
  } catch (error) {
    throw new Error(
      `Decryption failed (frameGen=${frameGeneration}, usedGen=${frameGeneration === (state.generation & 0xff) ? state.generation : state.previousGeneration}): ` +
        `${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Legacy function - use decryptFrameDataWithState instead
 * @deprecated Use decryptFrameDataWithState for new code
 */
export async function decryptFrameData(
  key: CryptoKey | null,
  encryptedData: ArrayBuffer,
  _config?: unknown
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

  // Neues Format mit Generation Byte: [Gen (1)][IV (12)][Ciphertext]
  const frameGeneration = data[0];
  const iv = data.slice(GENERATION_BYTE_LENGTH, GENERATION_BYTE_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(GENERATION_BYTE_LENGTH + IV_LENGTH);

  const params: AesGcmParams = {
    name: 'AES-GCM',
    iv,
  };

  try {
    const decrypted = await crypto.subtle.decrypt(params, key, ciphertext);
    return { data: decrypted, wasEncrypted: true, usedGeneration: frameGeneration };
  } catch (error) {
    throw new Error(
      `Decryption failed (gen=${frameGeneration}): ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
