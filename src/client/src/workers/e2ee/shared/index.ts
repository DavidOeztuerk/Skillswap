/**
 * Shared E2EE Worker Module
 * Re-exports für einfachen Import
 *
 * BROWSER-KOMPATIBILITÄT (verifiziert 2024-12):
 * - Alle Funktionen sind browser-agnostisch
 * - AES-GCM tagLength funktioniert in allen modernen Browsern
 * - Worker Message Transfer bis 10MB+ ohne Probleme
 */

// Message Types
export type {
  WorkerInitMessage,
  WorkerUpdateKeyMessage,
  WorkerEncryptMessage,
  WorkerDecryptMessage,
  WorkerEnableEncryptionMessage,
  WorkerDisableEncryptionMessage,
  WorkerGetStatsMessage,
  WorkerCleanupMessage,
  WorkerInboundMessage,
  WorkerReadyMessage,
  WorkerKeyUpdatedMessage,
  WorkerEncryptSuccessMessage,
  WorkerDecryptSuccessMessage,
  WorkerErrorMessage,
  WorkerCleanupCompleteMessage,
  WorkerStatsMessage,
  WorkerOutboundMessage,
  WorkerStats,
} from './message-types';

export {
  createInitialStats,
  isWorkerInboundMessage,
  isEncryptMessage,
  isDecryptMessage,
  isUpdateKeyMessage,
  isInitMessage,
  isErrorMessage,
  isStatsMessage,
} from './message-types';

// Crypto Operations
export type { WorkerCryptoState, DecryptionResult, KeyEntry } from './crypto-operations';

export {
  createInitialState,
  updateKeyInState,
  importEncryptionKey,
  encryptFrameData,
  decryptFrameData,
  decryptFrameDataWithState,
  updateEncryptionStats,
  updateDecryptionStats,
  incrementEncryptionError,
  incrementDecryptionError,
  setKeyGeneration,
  setEncryptionEnabled,
} from './crypto-operations';
