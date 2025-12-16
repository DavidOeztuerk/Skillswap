/**
 * Standard E2EE Worker für Chrome/Firefox/Edge
 */

let encryptionKey: CryptoKey | null = null;
let generation = 1;
const IV_LENGTH = 12;
// WICHTIG: AUTH_TAG_LENGTH wird NICHT an Safari WebCrypto übergeben!
// Safari akzeptiert tagLength nicht - verwendet automatisch 128-bit (Standard)
// Wir verwenden es nur für Chrome/Firefox, aber mit gleichem Wert für Kompatibilität
const AUTH_TAG_LENGTH = 128;

// Flag um zu steuern ob Encryption aktiv ist
// Wenn false: Frames werden unverändert durchgeleitet (Passthrough)
let encryptionEnabled = false;

// NEU: Minimum Frame-Größe für verschlüsselte Frames
// IV (12 bytes) + Auth Tag (16 bytes) + mindestens 1 byte Payload = 29 bytes
const MIN_ENCRYPTED_FRAME_SIZE = IV_LENGTH + 16 + 1;

// Type definitions for E2EE worker
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
  | { encryptedData: ArrayBuffer; encryptionTime?: number }
  | { decryptedData: ArrayBuffer; decryptionTime?: number }
  | { error: string }
  | undefined;

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
    | 'disableEncryption';
  payload?: WorkerPayload;
  operationId?: number;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, operationId } = event.data;

  switch (type) {
    case 'init':
      await initWorker(payload as InitPayload | undefined).then(() => {
        self.postMessage({ type: 'ready', operationId });
      });
      break;

    case 'updateKey':
      await updateKey(payload as KeyPayload).then(() => {
        console.debug('🔑 E2EE Worker: Sending keyUpdated confirmation');
        self.postMessage({ type: 'keyUpdated', operationId });
      });
      break;

    case 'encrypt': {
      const framePayload = payload as FramePayload | undefined;
      if (framePayload?.frameData) {
        await encryptFrame(framePayload.frameData, operationId);
      }
      break;
    }

    case 'decrypt': {
      const framePayload = payload as FramePayload | undefined;
      if (framePayload?.frameData) {
        await decryptFrame(framePayload.frameData, operationId);
      }
      break;
    }

    case 'cleanup':
      cleanup();
      self.postMessage({ type: 'cleanupComplete', operationId });
      break;

    case 'enableEncryption':
      encryptionEnabled = true;
      console.debug('🔐 E2EE Worker: Encryption enabled');
      self.postMessage({ type: 'ready', operationId });
      break;

    case 'disableEncryption':
      encryptionEnabled = false;
      console.debug('🔓 E2EE Worker: Encryption disabled (passthrough mode)');
      self.postMessage({ type: 'ready', operationId });
      break;

    default:
      console.debug(`E2EE Worker: Unknown message type: ${type}`);
      break;
  }
};

async function initWorker(payload: InitPayload | undefined): Promise<void> {
  console.debug('🔧 E2EE Worker: Initializing');
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
    console.debug(`🔄 E2EE Worker: Key updated to generation ${String(generation)}`);
  } catch (error) {
    console.error('E2EE Worker: Failed to update key:', error);
  }
}

async function encryptFrame(frameData: ArrayBuffer, operationId?: number): Promise<void> {
  const startTime = performance.now();

  try {
    // NEU: Wenn Encryption nicht aktiviert ist, Daten unverändert zurückgeben (Passthrough)
    if (!encryptionEnabled || !encryptionKey) {
      const encryptionTime = performance.now() - startTime;
      const response: WorkerMessage = {
        type: 'encryptSuccess',
        operationId,
        payload: {
          encryptedData: frameData,
          encryptionTime,
        },
      };
      self.postMessage(response, { transfer: [frameData] });
      return;
    }

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: AUTH_TAG_LENGTH,
      },
      encryptionKey,
      frameData
    );

    const combined = new Uint8Array(IV_LENGTH + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), IV_LENGTH);

    const encryptionTime = performance.now() - startTime;

    const response: WorkerMessage = {
      type: 'encryptSuccess',
      operationId,
      payload: {
        encryptedData: combined.buffer,
        encryptionTime,
      },
    };

    // Korrektes postMessage mit Transfer
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
  const startTime = performance.now();

  try {
    // KRITISCH: Decryption sollte IMMER versucht werden wenn Key vorhanden!
    // encryptionEnabled wird NICHT geprüft - der andere Peer könnte bereits
    // verschlüsselt senden bevor wir unsere Encryption aktiviert haben.
    if (!encryptionKey) {
      // Kein Key → Passthrough
      const decryptionTime = performance.now() - startTime;
      const response: WorkerMessage = {
        type: 'decryptSuccess',
        operationId,
        payload: {
          decryptedData: encryptedData,
          decryptionTime,
        },
      };
      self.postMessage(response, { transfer: [encryptedData] });
      return;
    }

    const data = new Uint8Array(encryptedData);

    // NEU: Prüfe ob Frame wahrscheinlich verschlüsselt ist
    if (data.byteLength < MIN_ENCRYPTED_FRAME_SIZE) {
      // Frame ist zu klein um verschlüsselt zu sein - unverändert zurückgeben
      const decryptionTime = performance.now() - startTime;
      const response: WorkerMessage = {
        type: 'decryptSuccess',
        operationId,
        payload: {
          decryptedData: encryptedData,
          decryptionTime,
        },
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
          tagLength: AUTH_TAG_LENGTH,
        },
        encryptionKey,
        ciphertext
      );
    } catch (_decryptError) {
      // NEU: Decryption fehlgeschlagen - Frame ist wahrscheinlich unverschlüsselt
      // (Peer sendet noch im Passthrough-Modus)
      // Gib Original-Daten zurück statt Error zu werfen
      const decryptionTime = performance.now() - startTime;
      const response: WorkerMessage = {
        type: 'decryptSuccess',
        operationId,
        payload: {
          decryptedData: encryptedData,
          decryptionTime,
        },
      };
      self.postMessage(response, { transfer: [encryptedData] });
      return;
    }

    const decryptionTime = performance.now() - startTime;

    const response: WorkerMessage = {
      type: 'decryptSuccess',
      operationId,
      payload: {
        decryptedData,
        decryptionTime,
      },
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
}

// Signal Worker ist bereit
self.postMessage({ type: 'ready' });
