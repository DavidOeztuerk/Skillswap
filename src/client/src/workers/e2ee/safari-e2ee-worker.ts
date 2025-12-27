/**
 * Safari/Firefox E2EE Worker mit RTCRtpScriptTransform
 *
 * Event-basierte Frame-Verarbeitung via onrtctransform.
 * Safari und Firefox nutzen RTCRtpScriptTransform statt Chrome's createEncodedStreams.
 *
 * UNTERSCHIEDE ZU CHROME:
 * 1. Nutzt `onrtctransform` Event statt `postMessage` für Frames
 * 2. Keys müssen VOR dem RTCRtpScriptTransform Event gesetzt sein!
 * 3. Frame-Verarbeitung erfolgt über TransformStream Pipeline
 *
 * BROWSER-KOMPATIBILITÄT (verifiziert 2024-12):
 * - AES-GCM tagLength: Funktioniert in ALLEN modernen Browsern
 * - Worker Message Transfer: 10MB+ ohne Probleme
 */

/// <reference path="./worker-types.d.ts" />

import {
  type WorkerInboundMessage,
  type WorkerOutboundMessage,
  type WorkerCryptoState,
  isUpdateKeyMessage,
  isInitMessage,
  createInitialState,
  updateKeyInState,
  importEncryptionKey,
  encryptFrameData,
  decryptFrameDataWithState,
  updateEncryptionStats,
  updateDecryptionStats,
  incrementEncryptionError,
  incrementDecryptionError,
  setKeyGeneration,
  setEncryptionEnabled,
} from './shared';

// ============================================================================
// Worker State
// ============================================================================

let state: WorkerCryptoState = createInitialState();

// Stats Reporting Interval
let statsReportInterval: ReturnType<typeof setInterval> | null = null;

// Store video receiver transformers for keyframe requests
// Wir speichern den Transformer um nach Key-Update einen Keyframe anzufordern
const videoReceiverTransformers: RTCTransformer[] = [];

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

  // Store video receiver transformer for keyframe requests
  // WICHTIG: Nach Key-Update fordern wir einen Keyframe an damit Video sofort startet!
  if (operation === 'decrypt' && kind === 'video') {
    videoReceiverTransformers.push(transformer);
    console.debug(
      `[Safari E2EE Worker] Stored video receiver transformer (total: ${videoReceiverTransformers.length})`
    );
  }

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
 *
 * Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
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
    // Pass generation to encryption so frames can be decrypted with the right key
    const encryptedData = await encryptFrameData(
      state.encryptionKey,
      frame.data,
      undefined, // Legacy config parameter, ignored
      state.generation // Generation Byte für Multi-Key Support
    );

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
 * Prüft ob ein Frame verschlüsselt aussieht
 * Frame Format: [Generation (1)][IV (12)][Ciphertext + AuthTag (16+)]
 * Minimale Größe: 1 + 12 + 16 + 1 = 30 bytes
 */
function looksEncrypted(frameData: ArrayBuffer): boolean {
  const MIN_ENCRYPTED_SIZE = 30; // Generation (1) + IV (12) + AuthTag (16) + 1
  return frameData.byteLength >= MIN_ENCRYPTED_SIZE;
}

// Debug counter for periodic logging
let decryptFrameCount = 0;
const DEBUG_LOG_INTERVAL = 100; // Log every 100 frames

/**
 * Entschlüsselt einen Frame im Stream mit Multi-Key Support
 *
 * Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
 *
 * KRITISCH: Wenn kein Key vorhanden ist, aber Frame verschlüsselt aussieht,
 * muss der Frame VERWORFEN werden (nicht passthrough!), da sonst korrupte
 * Daten angezeigt werden (schwarzes Video).
 */
async function handleStreamDecrypt(
  frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame,
  controller: TransformStreamDefaultController<RTCEncodedVideoFrame | RTCEncodedAudioFrame>,
  startTime: number
): Promise<void> {
  decryptFrameCount++;

  // Periodic debug logging
  if (decryptFrameCount % DEBUG_LOG_INTERVAL === 1) {
    const frameGen = frame.data.byteLength > 0 ? new Uint8Array(frame.data)[0] : -1;
    console.debug(
      `[Safari E2EE Worker] Decrypt frame #${decryptFrameCount}: ` +
        `hasKey=${state.encryptionKey !== null}, ` +
        `gen=${state.generation}, prevGen=${state.previousGeneration}, ` +
        `frameGen=${frameGen}, frameSize=${frame.data.byteLength}, ` +
        `stats: dec=${state.stats.decryptedFrames}, drop=${state.stats.droppedFrames ?? 0}`
    );
  }

  // Kein Key -> Frame verwerfen wenn er verschlüsselt aussieht
  if (state.encryptionKey === null) {
    if (looksEncrypted(frame.data)) {
      state.stats.droppedFrames = (state.stats.droppedFrames ?? 0) + 1;
      return; // Frame nicht enqueueen = verwerfen
    }
    // Kleine Frames passthrough - wahrscheinlich nicht verschlüsselt
    controller.enqueue(frame);
    return;
  }

  try {
    // Use multi-key decryption with generation support!
    const result = await decryptFrameDataWithState(state, frame.data);

    // Frame-Daten ersetzen
    frame.data = result.data;

    const decryptionTime = performance.now() - startTime;
    state.stats = updateDecryptionStats(state.stats, decryptionTime, result.wasEncrypted);

    controller.enqueue(frame);
  } catch (error) {
    state.stats = incrementDecryptionError(state.stats);
    state.stats.droppedFrames = (state.stats.droppedFrames ?? 0) + 1;
    // Log with frame generation info for debugging
    if (decryptFrameCount % DEBUG_LOG_INTERVAL === 1) {
      console.warn('[Safari E2EE Worker] Decryption failed, dropping frame:', error);
    }
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

    // Auto-enable encryption when key is provided during init
    if (!state.encryptionEnabled) {
      state.encryptionEnabled = true;
      state.stats = setEncryptionEnabled(state.stats, true);
      startStatsReporting();
      console.debug(`[Safari E2EE Worker] Auto-enabled encryption during init`);
    }

    console.debug(`[Safari E2EE Worker] Key initialized, generation=${state.generation}`);
  }
  postResponse({ type: 'ready', operationId });
}

/**
 * Aktualisiert den Encryption Key mit Multi-Key Support
 *
 * KRITISCH für Safari: Encryption wird automatisch aktiviert wenn Key gesetzt wird!
 * Das ist notwendig weil onrtctransform SOFORT nach RTCRtpScriptTransform feuert,
 * oft BEVOR der Main Thread enableEncryption() aufrufen kann.
 *
 * Der vorherige Key wird gespeichert für Frames die noch unterwegs sind (Key Rotation).
 */
async function handleUpdateKey(
  payload: { encryptionKey: JsonWebKey; generation: number },
  operationId?: number
): Promise<void> {
  const newKey = await importEncryptionKey(payload.encryptionKey);

  // Use updateKeyInState to preserve previous key for in-transit frames!
  state = updateKeyInState(state, newKey, payload.generation);
  state.stats = setKeyGeneration(state.stats, state.generation);

  // KRITISCH: Encryption automatisch aktivieren wenn Key gesetzt wird!
  if (!state.encryptionEnabled) {
    state.encryptionEnabled = true;
    state.stats = setEncryptionEnabled(state.stats, true);
    startStatsReporting();
    console.debug(`[Safari E2EE Worker] Auto-enabled encryption with key update`);
  }

  console.debug(
    `[Safari E2EE Worker] Key updated: gen=${state.generation}, prevGen=${state.previousGeneration}`
  );

  // KRITISCH: Keyframe anfordern damit Video sofort startet!
  // Ohne das muss der Decoder auf den nächsten I-Frame warten (2-10 Sekunden)
  requestKeyFrames();

  postResponse({ type: 'keyUpdated', operationId });
}

/**
 * Fordert Keyframes von allen Video-Receivern an
 *
 * WICHTIG: Nach Key-Exchange oder Key-Rotation müssen wir einen Keyframe anfordern,
 * sonst muss der Video-Decoder auf den nächsten I-Frame warten (kann 2-10 Sekunden dauern!)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpScriptTransformer/sendKeyFrameRequest
 */
function requestKeyFrames(): void {
  if (videoReceiverTransformers.length === 0) {
    console.debug('[Safari E2EE Worker] No video receiver transformers to request keyframes from');
    return;
  }

  console.debug(
    `[Safari E2EE Worker] Requesting keyframes from ${videoReceiverTransformers.length} video receivers`
  );

  for (const transformer of videoReceiverTransformers) {
    try {
      // sendKeyFrameRequest() ist asynchron aber wir warten nicht darauf
      // Der Browser entscheidet selbst ob ein Keyframe wirklich benötigt wird
      if (typeof transformer.sendKeyFrameRequest === 'function') {
        void transformer
          .sendKeyFrameRequest()
          .then(() => {
            console.debug('[Safari E2EE Worker] Keyframe request sent successfully');
          })
          .catch((error: unknown) => {
            // Nicht kritisch - Browser kann die Anfrage ablehnen
            console.debug('[Safari E2EE Worker] Keyframe request failed (not critical):', error);
          });
      }
    } catch (error) {
      console.debug('[Safari E2EE Worker] sendKeyFrameRequest not supported:', error);
    }
  }
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
  // Clear stored transformers
  videoReceiverTransformers.length = 0;
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
