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

// Stats Reporting Interval (consistent with Safari worker)
let statsReportInterval: ReturnType<typeof setInterval> | null = null;

// ============================================================================
// Stats Reporting (unified with Safari worker)
// ============================================================================

/**
 * Startet periodisches Stats-Reporting
 * Einheitlich mit Safari Worker für konsistente UI-Updates
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
  }, 5000); // Alle 5 Sekunden (wie Safari)
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
        startStatsReporting(); // Start periodic stats reporting
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
 * Aktualisiert den Encryption Key mit Multi-Key Support
 *
 * Der vorherige Key wird gespeichert für Frames die noch unterwegs sind (Key Rotation).
 */
async function handleUpdateKey(
  payload: { encryptionKey: JsonWebKey; generation: number },
  operationId?: number
): Promise<void> {
  if (payload.generation === state.generation && state.encryptionKey !== null) {
    console.debug(
      `[Chrome E2EE Worker] Ignoring duplicate key update for gen=${payload.generation} (already at gen=${state.generation})`
    );
    postResponse({ type: 'keyUpdated', operationId });
    return;
  }

  const newKey = await importEncryptionKey(payload.encryptionKey);

  // Use updateKeyInState to preserve previous key for in-transit frames!
  state = updateKeyInState(state, newKey, payload.generation);
  state.stats = setKeyGeneration(state.stats, state.generation);

  console.debug(
    `[Chrome E2EE Worker] Key updated: gen=${state.generation}, prevGen=${state.previousGeneration}`
  );

  postResponse({ type: 'keyUpdated', operationId });
}

/**
 * Verschlüsselt Frame-Daten
 *
 * Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
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
    // Pass generation to encryption so frames can be decrypted with the right key
    const encryptedData = await encryptFrameData(
      state.encryptionKey,
      frameData,
      undefined, // Legacy config parameter, ignored
      state.generation // Generation Byte für Multi-Key Support
    );

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

// Minimale Größe für verschlüsselte Daten: Generation (1) + IV (12) + AuthTag (16) + 1 byte payload
const MIN_ENCRYPTED_SIZE = 30;

/**
 * Prüft ob ein Frame verschlüsselt aussieht (hat IV + AuthTag + Payload)
 *
 * KRITISCH: Wir müssen auch prüfen ob die Generation gültig ist!
 * Unverschlüsselte VP8/VP9 Frames haben andere Header-Bytes:
 * - VP8 keyframes: 0x9D 0x01 0x2A (157, 1, 42)
 * - VP9 frames: verschiedene Patterns
 * Unsere Generationen sind 1-10, also ist jeder andere Wert unverschlüsselt.
 */
function looksEncrypted(frameData: ArrayBuffer): boolean {
  if (frameData.byteLength < MIN_ENCRYPTED_SIZE) {
    return false;
  }

  // Check if first byte is a valid generation (1-10)
  // Any other value (like 0x78=120 for VP8/VP9 or 0x9D=157 for keyframes) means unencrypted
  const firstByte = new Uint8Array(frameData)[0];
  const MAX_VALID_GENERATION = 10;
  return firstByte >= 1 && firstByte <= MAX_VALID_GENERATION;
}

/**
 * Entschlüsselt Frame-Daten mit Multi-Key Support
 *
 * Frame Format: [Generation (1 byte)][IV (12 bytes)][Ciphertext + AuthTag]
 *
 * KRITISCH: Wenn kein Key vorhanden ist, aber Frame verschlüsselt aussieht,
 * muss der Frame VERWORFEN werden (nicht passthrough!), da sonst korrupte
 * Daten angezeigt werden (schwarzes Video).
 */
// Frame counter for debug logging (like Safari worker)
let decryptFrameCount = 0;

async function handleDecrypt(frameData: ArrayBuffer, operationId: number): Promise<void> {
  const startTime = performance.now();
  decryptFrameCount++;

  // Debug log every 100 frames (same as Safari worker)
  if (decryptFrameCount % 100 === 1) {
    console.debug(
      `[Chrome E2EE Worker] Decrypt frame #${decryptFrameCount}: ` +
        `hasKey=${state.encryptionKey !== null}, gen=${state.generation}, ` +
        `prevGen=${state.previousGeneration}, frameSize=${frameData.byteLength}, ` +
        `stats: dec=${state.stats.decryptedFrames}, drop=${state.stats.droppedFrames ?? 0}`
    );
  }

  // Kein Key -> Frame verwerfen wenn er verschlüsselt aussieht
  if (state.encryptionKey === null) {
    if (looksEncrypted(frameData)) {
      state.stats.droppedFrames = (state.stats.droppedFrames ?? 0) + 1;
      postResponse({
        type: 'decryptSuccess',
        operationId,
        payload: {
          decryptedData: new ArrayBuffer(0), // Empty buffer = drop
          decryptionTime: performance.now() - startTime,
          wasEncrypted: false,
          dropped: true,
        },
      });
      return;
    }
    // Kleine Frames passthrough - wahrscheinlich nicht verschlüsselt
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
    return;
  }

  try {
    // Use multi-key decryption with generation support!
    const result = await decryptFrameDataWithState(state, frameData);

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
    state.stats.droppedFrames = (state.stats.droppedFrames ?? 0) + 1;
    console.warn('[Chrome E2EE Worker] Decryption failed, dropping frame:', error);
    postResponse({
      type: 'decryptSuccess',
      operationId,
      payload: {
        decryptedData: new ArrayBuffer(0), // Empty buffer = drop
        decryptionTime: performance.now() - startTime,
        wasEncrypted: false,
        dropped: true,
      },
    });
  }
}

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
