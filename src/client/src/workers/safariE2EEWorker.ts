/**
 * Safari RTCRtpScriptTransform Worker
 * Für E2EE auf Safari 15.4+ und iOS Safari
 */

let encryptionKey: CryptoKey | null = null;
let generation = 1;
const IV_LENGTH = 12;
// AUTH_TAG_LENGTH entfernt - Safari WebCrypto akzeptiert diesen Parameter nicht
// AES-GCM verwendet standardmäßig 128-bit Auth Tag

// Flag um zu steuern ob Encryption aktiv ist (wie Chrome-Handler)
// Wenn false: Frames werden unverändert durchgeleitet (Passthrough)
let encryptionEnabled = false;

// Minimum Frame-Größe für verschlüsselte Frames
// IV (12 bytes) + Auth Tag (16 bytes) + mindestens 1 byte Payload = 29 bytes
const MIN_ENCRYPTED_FRAME_SIZE = IV_LENGTH + 16 + 1;

// Stats Tracking für Safari onrtctransform (sonst zeigt UI 0 Frames!)
let stats = {
  totalFrames: 0,
  encryptedFrames: 0,
  decryptedFrames: 0,
  encryptionErrors: 0,
  decryptionErrors: 0,
  totalEncryptionTime: 0,
  totalDecryptionTime: 0,
};

// Type definitions for E2EE worker
interface StatsPayload {
  totalFrames: number;
  encryptedFrames: number;
  decryptedFrames: number;
  encryptionErrors: number;
  decryptionErrors: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
}

interface InitPayload {
  encryptionKey?: JsonWebKey;
  generation?: number;
}

interface KeyPayload {
  encryptionKey: JsonWebKey;
  generation: number;
}

interface FramePayload {
  frameData: ArrayBuffer;
}

type WorkerPayload =
  | InitPayload
  | KeyPayload
  | FramePayload
  | { encryptedData: ArrayBuffer }
  | { decryptedData: ArrayBuffer }
  | { error: string }
  | StatsPayload
  | undefined;

// RTCTransformEvent type for Safari's onrtctransform
interface RTCTransformEvent extends Event {
  transformer: {
    readable: ReadableStream<RTCEncodedVideoFrame | RTCEncodedAudioFrame>;
    writable: WritableStream<RTCEncodedVideoFrame | RTCEncodedAudioFrame>;
    options?: {
      operation?: string;
      kind?: string;
    };
  };
}

// Periodisches Stats-Reporting zum Main Thread
let statsReportInterval: ReturnType<typeof setInterval> | null = null;

function startStatsReporting(): void {
  if (statsReportInterval) {
    return;
  }

  statsReportInterval = setInterval(() => {
    // Nur senden wenn es Stats gibt
    if (stats.totalFrames > 0) {
      self.postMessage({
        type: 'stats',
        payload: {
          totalFrames: stats.totalFrames,
          encryptedFrames: stats.encryptedFrames,
          decryptedFrames: stats.decryptedFrames,
          encryptionErrors: stats.encryptionErrors,
          decryptionErrors: stats.decryptionErrors,
          averageEncryptionTime:
            stats.encryptedFrames > 0 ? stats.totalEncryptionTime / stats.encryptedFrames : 0,
          averageDecryptionTime:
            stats.decryptedFrames > 0 ? stats.totalDecryptionTime / stats.decryptedFrames : 0,
        },
      });
    }
  }, 1000); // Alle 1 Sekunde
}

function stopStatsReporting(): void {
  if (statsReportInterval) {
    clearInterval(statsReportInterval);
    statsReportInterval = null;
  }
}

interface WorkerMessage {
  type:
    | 'init'
    | 'updateKey'
    | 'encrypt'
    | 'decrypt'
    | 'cleanup'
    | 'ready'
    | 'keyUpdated'
    | 'encryptSuccess'
    | 'decryptSuccess'
    | 'error'
    | 'cleanupComplete'
    | 'enableEncryption'
    | 'disableEncryption'
    | 'stats'
    | 'getStats';
  payload?: WorkerPayload;
  operationId?: number;
}

self.onmessage = (event: MessageEvent<WorkerMessage>): void => {
  const { type, payload, operationId } = event.data;

  switch (type) {
    case 'init':
      void initWorker(payload as InitPayload | undefined).then(() => {
        self.postMessage({ type: 'ready', operationId });
      });
      break;

    case 'updateKey':
      void updateKey(payload as KeyPayload).then(() => {
        console.debug('🔑 Safari E2EE Worker: Sending keyUpdated confirmation');
        self.postMessage({ type: 'keyUpdated', operationId });
      });
      break;

    case 'encrypt': {
      const framePayload = payload as FramePayload | undefined;
      if (framePayload?.frameData) {
        void encryptFrame(framePayload.frameData, operationId);
      }
      break;
    }

    case 'decrypt': {
      const framePayload = payload as FramePayload | undefined;
      if (framePayload?.frameData) {
        void decryptFrame(framePayload.frameData, operationId);
      }
      break;
    }

    case 'cleanup':
      cleanup();
      self.postMessage({ type: 'cleanupComplete', operationId });
      break;

    case 'enableEncryption':
      encryptionEnabled = true;
      startStatsReporting();
      console.debug('🔐 Safari E2EE Worker: Encryption enabled');
      self.postMessage({ type: 'ready', operationId });
      break;

    case 'disableEncryption':
      encryptionEnabled = false;
      console.debug('🔓 Safari E2EE Worker: Encryption disabled (passthrough mode)');
      self.postMessage({ type: 'ready', operationId });
      break;

    case 'getStats':
      // Sofortige Stats-Abfrage
      self.postMessage({
        type: 'stats',
        operationId,
        payload: {
          totalFrames: stats.totalFrames,
          encryptedFrames: stats.encryptedFrames,
          decryptedFrames: stats.decryptedFrames,
          encryptionErrors: stats.encryptionErrors,
          decryptionErrors: stats.decryptionErrors,
          averageEncryptionTime:
            stats.encryptedFrames > 0 ? stats.totalEncryptionTime / stats.encryptedFrames : 0,
          averageDecryptionTime:
            stats.decryptedFrames > 0 ? stats.totalDecryptionTime / stats.decryptedFrames : 0,
        },
      });
      break;

    default:
      console.debug(`Safari E2EE Worker: Unknown message type: ${type}`);
      break;
  }
};

// RTCTransform Handler für Safari
// WICHTIG: Dieser Handler wird aufgerufen wenn ein RTCRtpScriptTransform angewendet wird.
// Die Keys müssen zu diesem Zeitpunkt bereits gesetzt sein, sonst passieren Frames durch!
(
  self as unknown as WorkerGlobalScope & { onrtctransform?: (event: RTCTransformEvent) => void }
).onrtctransform = (event: RTCTransformEvent): void => {
  const { transformer } = event;
  const operation = transformer.options?.operation ?? 'encrypt';
  const kind = transformer.options?.kind ?? 'unknown';

  console.debug(`🍎 Safari E2EE: onrtctransform called for ${operation} (${kind})`);
  console.debug(
    `🍎 Safari E2EE: encryptionEnabled=${String(encryptionEnabled)}, hasKey=${String(!!encryptionKey)}`
  );

  void transformer.readable
    .pipeThrough(
      new TransformStream({
        async transform(
          encodedFrame: RTCEncodedVideoFrame | RTCEncodedAudioFrame,
          controller: TransformStreamDefaultController<RTCEncodedVideoFrame | RTCEncodedAudioFrame>
        ): Promise<void> {
          const startTime = performance.now();
          stats.totalFrames++;

          try {
            const frameData = encodedFrame.data;
            let processedData: ArrayBuffer;

            if (operation === 'encrypt') {
              // ENCRYPTION: Nur wenn encryptionEnabled UND key vorhanden
              if (!encryptionEnabled || !encryptionKey) {
                controller.enqueue(encodedFrame);
                return;
              }
              // Verschlüsselung - Gleiche AES-GCM Parameter wie Chrome!
              const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
              const encryptedData = await crypto.subtle.encrypt(
                {
                  name: 'AES-GCM',
                  iv,
                  // WICHTIG: Kein tagLength - Safari WebCrypto verwendet automatisch 128-bit
                  // Dies ist kompatibel mit Chrome's AUTH_TAG_LENGTH = 128
                },
                encryptionKey,
                frameData
              );

              // IV + Ciphertext kombinieren - gleiches Format wie Chrome!
              const combined = new Uint8Array(IV_LENGTH + encryptedData.byteLength);
              combined.set(iv, 0);
              combined.set(new Uint8Array(encryptedData), IV_LENGTH);
              processedData = combined.buffer;

              // Stats für Encryption
              stats.encryptedFrames++;
              stats.totalEncryptionTime += performance.now() - startTime;
            } else {
              // DECRYPTION: Immer versuchen wenn Key vorhanden!
              // KRITISCH: encryptionEnabled wird NICHT geprüft für Decryption!
              // Der andere Peer könnte bereits verschlüsselt senden, bevor wir
              // unsere Encryption aktiviert haben.
              if (!encryptionKey) {
                // Kein Key → Passthrough
                controller.enqueue(encodedFrame);
                return;
              }

              const data = new Uint8Array(frameData);

              // Prüfe ob Frame wahrscheinlich verschlüsselt ist
              // Unverschlüsselte Frames: zu klein oder kein gültiges AES-GCM Format
              if (data.byteLength < MIN_ENCRYPTED_FRAME_SIZE) {
                // Frame ist zu klein um verschlüsselt zu sein - durchlassen
                controller.enqueue(encodedFrame);
                return;
              }

              const iv = data.slice(0, IV_LENGTH);
              const ciphertext = data.slice(IV_LENGTH);

              try {
                processedData = await crypto.subtle.decrypt(
                  {
                    name: 'AES-GCM',
                    iv,
                    // WICHTIG: Kein tagLength - Safari WebCrypto verwendet automatisch 128-bit
                  },
                  encryptionKey,
                  ciphertext
                );

                // Stats für erfolgreiche Decryption
                stats.decryptedFrames++;
                stats.totalDecryptionTime += performance.now() - startTime;
              } catch (_decryptError) {
                // Decryption fehlgeschlagen - Frame ist wahrscheinlich unverschlüsselt
                // (Peer sendet noch im Passthrough-Modus vor Key Exchange)
                // Statt Error werfen: Frame unverändert durchlassen
                stats.decryptionErrors++;
                controller.enqueue(encodedFrame);
                return;
              }
            }

            encodedFrame.data = processedData;
            controller.enqueue(encodedFrame);
          } catch (_error) {
            // Bei anderen Fehlern Original-Frame durchlassen
            controller.enqueue(encodedFrame);
          }
        },
      })
    )
    .pipeTo(transformer.writable);
};

async function initWorker(payload: InitPayload | undefined): Promise<void> {
  console.debug('🔧 Safari E2EE Worker: Initializing');
  if (payload?.encryptionKey) {
    await updateKey(payload as KeyPayload);
  }
}

async function updateKey(payload: {
  encryptionKey: JsonWebKey;
  generation: number;
}): Promise<void> {
  try {
    encryptionKey = await crypto.subtle.importKey(
      'jwk',
      payload.encryptionKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    generation = payload.generation;
    console.debug(`🔄 Safari E2EE Worker: Key updated to generation ${String(generation)}`);
  } catch (error) {
    console.error('Safari E2EE Worker: Failed to update key:', error);
  }
}

async function encryptFrame(frameData: ArrayBuffer, operationId?: number): Promise<void> {
  try {
    if (!encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        // tagLength entfernt - Safari WebCrypto kompatibel (128-bit ist Default)
      },
      encryptionKey,
      frameData
    );

    const combined = new Uint8Array(IV_LENGTH + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), IV_LENGTH);

    const response: WorkerMessage = {
      type: 'encryptSuccess',
      operationId,
      payload: { encryptedData: combined.buffer },
    };

    self.postMessage(response, { transfer: [combined.buffer] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({
      type: 'error',
      operationId,
      payload: { error: errorMessage },
    });
  }
}

async function decryptFrame(encryptedData: ArrayBuffer, operationId?: number): Promise<void> {
  try {
    // NEU: Wenn Encryption nicht aktiviert ist, Daten unverändert zurückgeben
    if (!encryptionEnabled || !encryptionKey) {
      const response: WorkerMessage = {
        type: 'decryptSuccess',
        operationId,
        payload: { decryptedData: encryptedData },
      };
      self.postMessage(response, { transfer: [encryptedData] });
      return;
    }

    const data = new Uint8Array(encryptedData);

    // Prüfe ob Frame wahrscheinlich verschlüsselt ist
    if (data.byteLength < MIN_ENCRYPTED_FRAME_SIZE) {
      // Frame ist zu klein um verschlüsselt zu sein - unverändert zurückgeben
      const response: WorkerMessage = {
        type: 'decryptSuccess',
        operationId,
        payload: { decryptedData: encryptedData },
      };
      self.postMessage(response, { transfer: [encryptedData] });
      return;
    }

    const iv = data.slice(0, IV_LENGTH);
    const ciphertext = data.slice(IV_LENGTH);

    let decryptedData: ArrayBuffer;
    try {
      decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        encryptionKey,
        ciphertext
      );
    } catch (_decryptError) {
      // NEU: Decryption fehlgeschlagen - Frame ist wahrscheinlich unverschlüsselt
      // Gib Original-Daten zurück statt Error zu werfen
      const response: WorkerMessage = {
        type: 'decryptSuccess',
        operationId,
        payload: { decryptedData: encryptedData },
      };
      self.postMessage(response, { transfer: [encryptedData] });
      return;
    }

    const response: WorkerMessage = {
      type: 'decryptSuccess',
      operationId,
      payload: { decryptedData },
    };

    self.postMessage(response, { transfer: [decryptedData] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({
      type: 'error',
      operationId,
      payload: { error: errorMessage },
    });
  }
}

function cleanup(): void {
  encryptionKey = null;
  generation = 1;
  encryptionEnabled = false;

  // Stats Reporting stoppen und zurücksetzen
  stopStatsReporting();
  stats = {
    totalFrames: 0,
    encryptedFrames: 0,
    decryptedFrames: 0,
    encryptionErrors: 0,
    decryptionErrors: 0,
    totalEncryptionTime: 0,
    totalDecryptionTime: 0,
  };
}

// Signal that the worker is ready (same as Chrome worker)
self.postMessage({ type: 'ready' });
