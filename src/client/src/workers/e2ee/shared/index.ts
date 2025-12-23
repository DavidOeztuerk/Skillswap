/**
 * Shared E2EE Worker Module
 * Re-exports für einfachen Import
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
export type { WorkerCryptoState, EncryptionConfig, DecryptionResult } from './crypto-operations';

export {
  createInitialState,
  importEncryptionKey,
  CHROME_CONFIG,
  SAFARI_CONFIG,
  encryptFrameData,
  decryptFrameData,
  updateEncryptionStats,
  updateDecryptionStats,
  incrementEncryptionError,
  incrementDecryptionError,
  setKeyGeneration,
  setEncryptionEnabled,
} from './crypto-operations';
