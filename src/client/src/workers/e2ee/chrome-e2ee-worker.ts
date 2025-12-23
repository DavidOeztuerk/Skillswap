/**
 * E2EE Worker für Chrome, Edge, Firefox
 *
 * Message-basierte Frame-Verarbeitung via postMessage.
 * Dieser Worker wird für Browser verwendet, die createEncodedStreams()
 * oder RTCRtpSender.transform unterstützen.
 *
 * Für Safari wird der separate safari-e2ee-worker.ts verwendet,
 * der RTCRtpScriptTransform mit event-basierter Verarbeitung nutzt.
 */

import {
  type WorkerInboundMessage,
  type WorkerOutboundMessage,
  type WorkerCryptoState,
  isEncryptMessage,
  isDecryptMessage,
  isUpdateKeyMessage,
  isInitMessage,
  createInitialState,
  importEncryptionKey,
  encryptFrameData,
  decryptFrameData,
  updateEncryptionStats,
  updateDecryptionStats,
  incrementEncryptionError,
  incrementDecryptionError,
  setKeyGeneration,
  setEncryptionEnabled,
  CHROME_CONFIG,
} from './shared';

// ============================================================================
// Worker State
// ============================================================================

let state: WorkerCryptoState = createInitialState();

// ============================================================================
// Message Handler
// ============================================================================

self.onmessage = async (event: MessageEvent<WorkerInboundMessage>): Promise<void> => {
  const message = event.data;

  try {
    switch (message.type) {
      case 'init':
        if (isInitMessage(message)) {
          await handleInit(message.payload, message.operationId);
        }
        break;

      case 'updateKey':
        if (isUpdateKeyMessage(message)) {
          await handleUpdateKey(message.payload, message.operationId);
        }
        break;

      case 'encrypt':
        if (isEncryptMessage(message)) {
          await handleEncrypt(message.payload.frameData, message.operationId);
        }
        break;

      case 'decrypt':
        if (isDecryptMessage(message)) {
          await handleDecrypt(message.payload.frameData, message.operationId);
        }
        break;

      case 'enableEncryption':
        state.encryptionEnabled = true;
        state.stats = setEncryptionEnabled(state.stats, true);
        postResponse({ type: 'ready', operationId: message.operationId });
        break;

      case 'disableEncryption':
        state.encryptionEnabled = false;
        state.stats = setEncryptionEnabled(state.stats, false);
        postResponse({ type: 'ready', operationId: message.operationId });
        break;

      case 'getStats':
        postResponse({
          type: 'stats',
          operationId: message.operationId,
          payload: state.stats,
        });
        break;

      case 'cleanup':
        handleCleanup(message.operationId);
        break;

      default:
        postResponse({
          type: 'error',
          operationId: (message as { operationId?: number }).operationId,
          payload: { error: `Unknown message type: ${(message as { type: string }).type}` },
        });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    postResponse({
      type: 'error',
      operationId: (message as { operationId?: number }).operationId,
      payload: { error: errorMessage },
    });
  }
};

// ============================================================================
// Handlers
// ============================================================================

/**
 * Initialisiert den Worker
 */
async function handleInit(
  payload: { encryptionKey?: JsonWebKey; generation?: number } | undefined,
  operationId?: number
): Promise<void> {
  if (payload?.encryptionKey) {
    state.encryptionKey = await importEncryptionKey(payload.encryptionKey);
    state.generation = payload.generation ?? 1;
    state.stats = setKeyGeneration(state.stats, state.generation);
  }
  postResponse({ type: 'ready', operationId });
}

/**
 * Aktualisiert den Encryption Key
 */
async function handleUpdateKey(
  payload: { encryptionKey: JsonWebKey; generation: number },
  operationId?: number
): Promise<void> {
  state.encryptionKey = await importEncryptionKey(payload.encryptionKey);
  state.generation = payload.generation;
  state.stats = setKeyGeneration(state.stats, state.generation);

  postResponse({ type: 'keyUpdated', operationId });
}

/**
 * Verschlüsselt Frame-Daten
 */
async function handleEncrypt(frameData: ArrayBuffer, operationId: number): Promise<void> {
  const startTime = performance.now();

  // Passthrough wenn Encryption nicht aktiviert oder kein Key
  if (!state.encryptionEnabled || state.encryptionKey === null) {
    postResponse(
      {
        type: 'encryptSuccess',
        operationId,
        payload: {
          encryptedData: frameData,
          encryptionTime: performance.now() - startTime,
        },
      },
      [frameData]
    );
    return;
  }

  try {
    const encryptedData = await encryptFrameData(state.encryptionKey, frameData, CHROME_CONFIG);

    const encryptionTime = performance.now() - startTime;
    state.stats = updateEncryptionStats(state.stats, encryptionTime);

    postResponse(
      {
        type: 'encryptSuccess',
        operationId,
        payload: { encryptedData, encryptionTime },
      },
      [encryptedData]
    );
  } catch (error) {
    state.stats = incrementEncryptionError(state.stats);
    const errorMessage = error instanceof Error ? error.message : 'Encryption failed';
    postResponse({
      type: 'error',
      operationId,
      payload: { error: errorMessage, code: 'ENCRYPTION_FAILED' },
    });
  }
}

/**
 * Entschlüsselt Frame-Daten
 *
 * KRITISCH: Decryption IMMER versuchen wenn Key vorhanden!
 * encryptionEnabled wird NICHT geprüft - der andere Peer könnte bereits
 * verschlüsselt senden bevor wir unsere Encryption aktiviert haben.
 */
async function handleDecrypt(frameData: ArrayBuffer, operationId: number): Promise<void> {
  const startTime = performance.now();

  try {
    const result = await decryptFrameData(state.encryptionKey, frameData, CHROME_CONFIG);

    const decryptionTime = performance.now() - startTime;
    state.stats = updateDecryptionStats(state.stats, decryptionTime, result.wasEncrypted);

    postResponse(
      {
        type: 'decryptSuccess',
        operationId,
        payload: {
          decryptedData: result.data,
          decryptionTime,
          wasEncrypted: result.wasEncrypted,
        },
      },
      [result.data]
    );
  } catch (error) {
    state.stats = incrementDecryptionError(state.stats);
    // Bei Fehler: Original-Frame durchlassen (graceful degradation)
    postResponse(
      {
        type: 'decryptSuccess',
        operationId,
        payload: {
          decryptedData: frameData,
          decryptionTime: performance.now() - startTime,
          wasEncrypted: false,
        },
      },
      [frameData]
    );
  }
}

/**
 * Bereinigt den Worker-State
 */
function handleCleanup(operationId?: number): void {
  state = createInitialState();
  postResponse({ type: 'cleanupComplete', operationId });
}

// ============================================================================
// Response Helper
// ============================================================================

/**
 * Sendet eine Response an den Main Thread
 * Verwendet Transferable für ArrayBuffers (Zero-Copy)
 */
function postResponse(message: WorkerOutboundMessage, transfer?: Transferable[]): void {
  if (transfer && transfer.length > 0) {
    self.postMessage(message, { transfer });
  } else {
    self.postMessage(message);
  }
}

// ============================================================================
// Worker Ready Signal
// ============================================================================

// Signal dass Worker bereit ist
postResponse({ type: 'ready' });
