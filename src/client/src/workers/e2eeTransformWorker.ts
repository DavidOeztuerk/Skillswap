/**
 * E2EE Transform Worker for Insertable Streams
 *
 * This Web Worker processes WebRTC encoded frames in real-time:
 * - Encrypts outgoing media frames (video/audio)
 * - Decrypts incoming media frames from peer
 *
 * Runs in separate thread to avoid blocking main thread during crypto operations.
 * Performance: AES-GCM encryption adds ~1-2ms latency per frame (acceptable for real-time)
 */

// Worker runs in its own context, so crypto is available as global
declare const crypto: Crypto;

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // bytes
const AUTH_TAG_LENGTH = 128; // bits

interface WorkerMessage {
  type: 'init' | 'encrypt' | 'decrypt' | 'updateKey' | 'cleanup';
  payload?: any;
}

interface InitPayload {
  encryptionKey: JsonWebKey;
  generation: number;
}

interface FramePayload {
  frameData: ArrayBuffer;
  frameMetadata?: any;
}

class E2EETransformWorker {
  private encryptionKey: CryptoKey | null = null;
  private keyGeneration = 0;

  /**
   * Initialize worker with encryption key
   */
  async init(payload: InitPayload): Promise<void> {
    try {
      // Import encryption key from main thread
      this.encryptionKey = await crypto.subtle.importKey(
        'jwk',
        payload.encryptionKey,
        {
          name: ALGORITHM,
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );

      this.keyGeneration = payload.generation;

      console.log(`[E2EE Worker] Initialized with key generation ${this.keyGeneration}`);

      self.postMessage({
        type: 'initSuccess',
        payload: { generation: this.keyGeneration },
      });
    } catch (error) {
      console.error('[E2EE Worker] Init error:', error);
      self.postMessage({
        type: 'error',
        payload: { error: String(error), operation: 'init' },
      });
    }
  }

  /**
   * Update encryption key (for key rotation)
   */
  async updateKey(payload: InitPayload): Promise<void> {
    console.log(`[E2EE Worker] Updating key to generation ${payload.generation}`);
    await this.init(payload); // Reuse init logic
  }

  /**
   * Encrypt outgoing frame
   */
  async encrypt(payload: FramePayload): Promise<void> {
    if (!this.encryptionKey) {
      self.postMessage({
        type: 'error',
        payload: { error: 'Encryption key not initialized', operation: 'encrypt' },
      });
      return;
    }

    try {
      const startTime = performance.now();

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // Encrypt frame
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv,
          tagLength: AUTH_TAG_LENGTH,
        },
        this.encryptionKey,
        payload.frameData
      );

      // Prepend IV to encrypted data
      const result = new Uint8Array(IV_LENGTH + encryptedData.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encryptedData), IV_LENGTH);

      const encryptionTime = performance.now() - startTime;

      self.postMessage(
        {
          type: 'encryptSuccess',
          payload: {
            encryptedData: result.buffer,
            metadata: payload.frameMetadata,
            encryptionTime,
          },
        },
        { transfer: [result.buffer] } // Transfer ownership for zero-copy
      );
    } catch (error) {
      console.error('[E2EE Worker] Encryption error:', error);
      self.postMessage({
        type: 'error',
        payload: { error: String(error), operation: 'encrypt' },
      });
    }
  }

  /**
   * Decrypt incoming frame
   */
  async decrypt(payload: FramePayload): Promise<void> {
    if (!this.encryptionKey) {
      self.postMessage({
        type: 'error',
        payload: { error: 'Decryption key not initialized', operation: 'decrypt' },
      });
      return;
    }

    try {
      const startTime = performance.now();

      const data = new Uint8Array(payload.frameData);

      // Extract IV
      const iv = data.slice(0, IV_LENGTH);

      // Extract encrypted data
      const encryptedData = data.slice(IV_LENGTH);

      // Decrypt frame
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv,
          tagLength: AUTH_TAG_LENGTH,
        },
        this.encryptionKey,
        encryptedData
      );

      const decryptionTime = performance.now() - startTime;

      self.postMessage(
        {
          type: 'decryptSuccess',
          payload: {
            decryptedData,
            metadata: payload.frameMetadata,
            decryptionTime,
          },
        },
        { transfer: [decryptedData] } // Transfer ownership
      );
    } catch (error) {
      console.error('[E2EE Worker] Decryption error:', error);
      self.postMessage({
        type: 'error',
        payload: { error: String(error), operation: 'decrypt' },
      });
    }
  }

  /**
   * Cleanup worker resources
   */
  cleanup(): void {
    this.encryptionKey = null;
    this.keyGeneration = 0;
    console.log('[E2EE Worker] Cleanup complete');
    self.postMessage({ type: 'cleanupSuccess' });
  }
}

// Initialize worker instance
const worker = new E2EETransformWorker();

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      await worker.init(payload as InitPayload);
      break;

    case 'updateKey':
      await worker.updateKey(payload as InitPayload);
      break;

    case 'encrypt':
      await worker.encrypt(payload as FramePayload);
      break;

    case 'decrypt':
      await worker.decrypt(payload as FramePayload);
      break;

    case 'cleanup':
      worker.cleanup();
      break;

    default:
      console.warn('[E2EE Worker] Unknown message type:', type);
  }
};

// Signal worker is ready
self.postMessage({ type: 'ready' });

export {};
