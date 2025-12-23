/**
 * E2EE Worker Message Types
 * Strikte Typisierung für Worker-Kommunikation
 *
 * Diese Types werden sowohl im Main Thread als auch in den Workers verwendet.
 * Sie definieren das Protokoll für die Kommunikation zwischen beiden.
 */

// ============================================================================
// Inbound Messages (Main Thread -> Worker)
// ============================================================================

/**
 * Initialisiert den Worker
 * Kann optional einen Key für sofortige Verschlüsselung enthalten
 */
export interface WorkerInitMessage {
  readonly type: 'init';
  readonly payload?: {
    readonly encryptionKey?: JsonWebKey;
    readonly generation?: number;
  };
  readonly operationId?: number;
}

/**
 * Aktualisiert den Encryption Key (z.B. bei Key Rotation)
 */
export interface WorkerUpdateKeyMessage {
  readonly type: 'updateKey';
  readonly payload: {
    readonly encryptionKey: JsonWebKey;
    readonly generation: number;
  };
  readonly operationId?: number;
}

/**
 * Verschlüsselt einen Frame (für Chrome Worker)
 * Safari verwendet stattdessen RTCRtpScriptTransform Streams
 */
export interface WorkerEncryptMessage {
  readonly type: 'encrypt';
  readonly payload: {
    readonly frameData: ArrayBuffer;
  };
  readonly operationId: number;
}

/**
 * Entschlüsselt einen Frame (für Chrome Worker)
 */
export interface WorkerDecryptMessage {
  readonly type: 'decrypt';
  readonly payload: {
    readonly frameData: ArrayBuffer;
  };
  readonly operationId: number;
}

/**
 * Aktiviert die Verschlüsselung
 * (Key muss vorher via init oder updateKey gesetzt sein)
 */
export interface WorkerEnableEncryptionMessage {
  readonly type: 'enableEncryption';
  readonly operationId?: number;
}

/**
 * Deaktiviert die Verschlüsselung (Passthrough-Modus)
 */
export interface WorkerDisableEncryptionMessage {
  readonly type: 'disableEncryption';
  readonly operationId?: number;
}

/**
 * Fordert aktuelle Statistiken an
 */
export interface WorkerGetStatsMessage {
  readonly type: 'getStats';
  readonly operationId?: number;
}

/**
 * Bereinigt den Worker-State und gibt Ressourcen frei
 */
export interface WorkerCleanupMessage {
  readonly type: 'cleanup';
  readonly operationId?: number;
}

/**
 * Union Type aller möglichen Inbound Messages
 */
export type WorkerInboundMessage =
  | WorkerInitMessage
  | WorkerUpdateKeyMessage
  | WorkerEncryptMessage
  | WorkerDecryptMessage
  | WorkerEnableEncryptionMessage
  | WorkerDisableEncryptionMessage
  | WorkerGetStatsMessage
  | WorkerCleanupMessage;

// ============================================================================
// Outbound Messages (Worker -> Main Thread)
// ============================================================================

/**
 * Worker ist bereit für Operationen
 */
export interface WorkerReadyMessage {
  readonly type: 'ready';
  readonly operationId?: number;
}

/**
 * Key wurde erfolgreich aktualisiert
 */
export interface WorkerKeyUpdatedMessage {
  readonly type: 'keyUpdated';
  readonly operationId?: number;
}

/**
 * Verschlüsselung erfolgreich
 */
export interface WorkerEncryptSuccessMessage {
  readonly type: 'encryptSuccess';
  readonly operationId: number;
  readonly payload: {
    readonly encryptedData: ArrayBuffer;
    readonly encryptionTime?: number;
  };
}

/**
 * Entschlüsselung erfolgreich
 */
export interface WorkerDecryptSuccessMessage {
  readonly type: 'decryptSuccess';
  readonly operationId: number;
  readonly payload: {
    readonly decryptedData: ArrayBuffer;
    readonly decryptionTime?: number;
    readonly wasEncrypted?: boolean;
  };
}

/**
 * Fehler bei einer Operation
 */
export interface WorkerErrorMessage {
  readonly type: 'error';
  readonly operationId?: number;
  readonly payload: {
    readonly error: string;
    readonly code?: string;
  };
}

/**
 * Cleanup abgeschlossen
 */
export interface WorkerCleanupCompleteMessage {
  readonly type: 'cleanupComplete';
  readonly operationId?: number;
}

/**
 * Aktuelle Worker-Statistiken
 */
export interface WorkerStatsMessage {
  readonly type: 'stats';
  readonly operationId?: number;
  readonly payload: WorkerStats;
}

/**
 * Union Type aller möglichen Outbound Messages
 */
export type WorkerOutboundMessage =
  | WorkerReadyMessage
  | WorkerKeyUpdatedMessage
  | WorkerEncryptSuccessMessage
  | WorkerDecryptSuccessMessage
  | WorkerErrorMessage
  | WorkerCleanupCompleteMessage
  | WorkerStatsMessage;

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Worker Performance Statistiken
 */
export interface WorkerStats {
  readonly totalFrames: number;
  readonly encryptedFrames: number;
  readonly decryptedFrames: number;
  readonly passthroughFrames: number;
  readonly encryptionErrors: number;
  readonly decryptionErrors: number;
  readonly averageEncryptionTimeMs: number;
  readonly averageDecryptionTimeMs: number;
  readonly keyGeneration: number;
  readonly encryptionEnabled: boolean;
}

/**
 * Erstellt initiale Worker-Statistiken
 */
export function createInitialStats(): WorkerStats {
  return {
    totalFrames: 0,
    encryptedFrames: 0,
    decryptedFrames: 0,
    passthroughFrames: 0,
    encryptionErrors: 0,
    decryptionErrors: 0,
    averageEncryptionTimeMs: 0,
    averageDecryptionTimeMs: 0,
    keyGeneration: 0,
    encryptionEnabled: false,
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Prüft ob ein Wert eine gültige Worker Inbound Message ist
 */
export function isWorkerInboundMessage(value: unknown): value is WorkerInboundMessage {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as { type?: unknown };

  if (typeof msg.type !== 'string') return false;

  const validTypes = [
    'init',
    'updateKey',
    'encrypt',
    'decrypt',
    'enableEncryption',
    'disableEncryption',
    'getStats',
    'cleanup',
  ];

  return validTypes.includes(msg.type);
}

/**
 * Type Guard für Encrypt Message
 */
export function isEncryptMessage(msg: WorkerInboundMessage): msg is WorkerEncryptMessage {
  return msg.type === 'encrypt';
}

/**
 * Type Guard für Decrypt Message
 */
export function isDecryptMessage(msg: WorkerInboundMessage): msg is WorkerDecryptMessage {
  return msg.type === 'decrypt';
}

/**
 * Type Guard für UpdateKey Message
 */
export function isUpdateKeyMessage(msg: WorkerInboundMessage): msg is WorkerUpdateKeyMessage {
  return msg.type === 'updateKey';
}

/**
 * Type Guard für Init Message
 */
export function isInitMessage(msg: WorkerInboundMessage): msg is WorkerInitMessage {
  return msg.type === 'init';
}

/**
 * Prüft ob eine Outbound Message ein Fehler ist
 */
export function isErrorMessage(msg: WorkerOutboundMessage): msg is WorkerErrorMessage {
  return msg.type === 'error';
}

/**
 * Prüft ob eine Outbound Message eine Stats Message ist
 */
export function isStatsMessage(msg: WorkerOutboundMessage): msg is WorkerStatsMessage {
  return msg.type === 'stats';
}
