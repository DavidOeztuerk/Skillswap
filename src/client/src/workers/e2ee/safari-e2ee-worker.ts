/**
 * Safari E2EE Worker mit RTCRtpScriptTransform
 *
 * Event-basierte Frame-Verarbeitung via onrtctransform.
 * Safari verwendet eine komplett andere API als Chrome/Firefox!
 *
 * KRITISCHE UNTERSCHIEDE:
 * 1. Safari nutzt `onrtctransform` Event statt `postMessage` für Frames
 * 2. Safari akzeptiert KEINEN `tagLength` Parameter bei AES-GCM
 * 3. Keys müssen VOR dem RTCRtpScriptTransform Event gesetzt sein!
 * 4. Frame-Verarbeitung erfolgt über TransformStream Pipeline
 */

/// <reference path="./worker-types.d.ts" />

import {
  type WorkerInboundMessage,
  type WorkerOutboundMessage,
  type WorkerCryptoState,
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
  SAFARI_CONFIG,
} from './shared';

// ============================================================================
// Worker State
// ============================================================================

let state: WorkerCryptoState = createInitialState();

// Stats Reporting Interval
let statsReportInterval: ReturnType<typeof setInterval> | null = null;

// ============================================================================
// Safari RTCRtpScriptTransform Handler
// KRITISCH: Die Keys müssen zu diesem Zeitpunkt bereits gesetzt sein!
// ============================================================================

(
  self as unknown as WorkerGlobalScope & {
    onrtctransform?: (event: RTCTransformEvent) => void;
  }
).onrtctransform = (event: RTCTransformEvent): void => {
  const { transformer } = event;
  const operation = transformer.options?.operation ?? 'encrypt';
  const kind = transformer.options?.kind ?? 'unknown';

  console.debug(
    `[Safari E2EE Worker] onrtctransform: operation=${operation}, kind=${kind}, ` +
      `encryptionEnabled=${state.encryptionEnabled}, hasKey=${state.encryptionKey !== null}`
  );

  const transformStream = new TransformStream<
    RTCEncodedVideoFrame | RTCEncodedAudioFrame,
    RTCEncodedVideoFrame | RTCEncodedAudioFrame
  >({
    transform: async (encodedFrame, controller): Promise<void> => {
      const startTime = performance.now();

      try {
        if (operation === 'encrypt') {
          await handleStreamEncrypt(encodedFrame, controller, startTime);
        } else {
          await handleStreamDecrypt(encodedFrame, controller, startTime);
        }
      } catch (error) {
        console.error('[Safari E2EE Worker] Transform error:', error);
        // Bei Fehler: Frame unverändert durchlassen
        controller.enqueue(encodedFrame);
      }
    },
  });

  // Pipeline verbinden
  void transformer.readable
    .pipeThrough(transformStream)
    .pipeTo(transformer.writable)
    .catch((error) => {
      console.error('[Safari E2EE Worker] Pipeline error:', error);
    });
};

// ============================================================================
// Stream Transform Handlers
// ============================================================================

/**
 * Verschlüsselt einen Frame im Stream
 */
async function handleStreamEncrypt(
  frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame,
  controller: TransformStreamDefaultController<RTCEncodedVideoFrame | RTCEncodedAudioFrame>,
  startTime: number
): Promise<void> {
  // Passthrough wenn nicht aktiviert oder kein Key
  if (!state.encryptionEnabled || state.encryptionKey === null) {
    controller.enqueue(frame);
    return;
  }

  try {
    const encryptedData = await encryptFrameData(state.encryptionKey, frame.data, SAFARI_CONFIG);

    // Frame-Daten ersetzen (mutabel!)
    frame.data = encryptedData;

    const encryptionTime = performance.now() - startTime;
    state.stats = updateEncryptionStats(state.stats, encryptionTime);

    controller.enqueue(frame);
  } catch (error) {
    state.stats = incrementEncryptionError(state.stats);
    console.error('[Safari E2EE Worker] Encryption error:', error);
    // Bei Fehler: Original-Frame durchlassen
    controller.enqueue(frame);
  }
}

/**
 * Entschlüsselt einen Frame im Stream
 *
 * KRITISCH: Decryption IMMER versuchen wenn Key vorhanden!
 * Der andere Peer könnte bereits verschlüsselt senden.
 */
async function handleStreamDecrypt(
  frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame,
  controller: TransformStreamDefaultController<RTCEncodedVideoFrame | RTCEncodedAudioFrame>,
  startTime: number
): Promise<void> {
  // Kein Key -> Passthrough
  if (state.encryptionKey === null) {
    controller.enqueue(frame);
    return;
  }

  try {
    const result = await decryptFrameData(state.encryptionKey, frame.data, SAFARI_CONFIG);

    // Frame-Daten ersetzen
    frame.data = result.data;

    const decryptionTime = performance.now() - startTime;
    state.stats = updateDecryptionStats(state.stats, decryptionTime, result.wasEncrypted);

    controller.enqueue(frame);
  } catch (error) {
    state.stats = incrementDecryptionError(state.stats);
    console.error('[Safari E2EE Worker] Decryption error:', error);
    // Bei Fehler: Original-Frame durchlassen
    controller.enqueue(frame);
  }
}

// ============================================================================
// Message Handler (für Key Updates und Control Messages)
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

      case 'enableEncryption':
        state.encryptionEnabled = true;
        state.stats = setEncryptionEnabled(state.stats, true);
        startStatsReporting();
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

      // Safari Worker unterstützt KEINE message-basierte Encryption/Decryption
      // Das passiert alles im Stream via onrtctransform
      case 'encrypt':
      case 'decrypt':
        postResponse({
          type: 'error',
          operationId: (message as { operationId?: number }).operationId,
          payload: {
            error: 'Safari worker uses stream-based transform, not message-based',
            code: 'UNSUPPORTED_OPERATION',
          },
        });
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
// Init & Key Update Handlers
// ============================================================================

/**
 * Initialisiert den Worker
 * KRITISCH für Safari: Key muss VOR RTCRtpScriptTransform gesetzt sein!
 */
async function handleInit(
  payload: { encryptionKey?: JsonWebKey; generation?: number } | undefined,
  operationId?: number
): Promise<void> {
  if (payload?.encryptionKey) {
    state.encryptionKey = await importEncryptionKey(payload.encryptionKey);
    state.generation = payload.generation ?? 1;
    state.stats = setKeyGeneration(state.stats, state.generation);
    console.debug(`[Safari E2EE Worker] Key initialized, generation=${state.generation}`);
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

  console.debug(`[Safari E2EE Worker] Key updated, generation=${state.generation}`);

  postResponse({ type: 'keyUpdated', operationId });
}

// ============================================================================
// Stats Reporting (Safari braucht periodisches Reporting)
// ============================================================================

/**
 * Startet periodisches Stats-Reporting
 * Nützlich für Safari da keine message-basierte Frame-Verarbeitung
 */
function startStatsReporting(): void {
  if (statsReportInterval !== null) return;

  statsReportInterval = setInterval(() => {
    if (state.stats.totalFrames > 0) {
      postResponse({
        type: 'stats',
        payload: state.stats,
      });
    }
  }, 5000); // Alle 5 Sekunden
}

/**
 * Stoppt das Stats-Reporting
 */
function stopStatsReporting(): void {
  if (statsReportInterval !== null) {
    clearInterval(statsReportInterval);
    statsReportInterval = null;
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Bereinigt den Worker-State
 */
function handleCleanup(operationId?: number): void {
  stopStatsReporting();
  state = createInitialState();
  postResponse({ type: 'cleanupComplete', operationId });
}

// ============================================================================
// Response Helper
// ============================================================================

/**
 * Sendet eine Response an den Main Thread
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

console.debug('[Safari E2EE Worker] Worker loaded and ready');
postResponse({ type: 'ready' });
