/**
 * Insertable Streams Handler for WebRTC E2EE - KORRIGIERTE VERSION
 *
 * Fixes:
 * 1. ✅ ArrayBuffer Kopie vor Transfer (verhindert Invalidierung)
 * 2. ✅ Bessere Worker Message Handling mit Cleanup
 * 3. ✅ Memory Leak Prevention
 * 4. ✅ Error Recovery für einzelne Frames
 * 5. ✅ Performance-Optimierungen
 */

import { E2EEManager, E2EEKeyMaterial } from './e2eeVideoEncryption';

/**
 * Frame encryption statistics
 */
interface FrameStats {
  totalFrames: number;
  encryptedFrames: number;
  decryptedFrames: number;
  encryptionErrors: number;
  decryptionErrors: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  droppedFrames: number;
}

/**
 * Pending operation für Promise-basierte Worker Communication
 */
interface PendingOperation {
  resolve: (value: ArrayBuffer) => void;
  reject: (reason: Error) => void;
  timestamp: number;
}

// Operation Timeout (5 Sekunden)
const OPERATION_TIMEOUT = 5000;
// Max pending operations bevor Warnung
const MAX_PENDING_OPERATIONS = 100;

/**
 * Insertable Streams Handler - KORRIGIERT
 */
export class InsertableStreamsHandler {
  private e2eeManager: E2EEManager;
  private encryptionWorker: Worker | null = null;
  private decryptionWorker: Worker | null = null;
  private pendingEncryptions = new Map<number, PendingOperation>();
  private pendingDecryptions = new Map<number, PendingOperation>();
  private operationCounter = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private stats: FrameStats = {
    totalFrames: 0,
    encryptedFrames: 0,
    decryptedFrames: 0,
    encryptionErrors: 0,
    decryptionErrors: 0,
    averageEncryptionTime: 0,
    averageDecryptionTime: 0,
    droppedFrames: 0,
  };

  constructor(e2eeManager: E2EEManager) {
    this.e2eeManager = e2eeManager;
  }

  /**
   * Initialize workers for encryption/decryption
   */
  async initializeWorkers(): Promise<void> {
    console.log('🔧 E2EE: Initializing transform workers...');

    // Create workers
    this.encryptionWorker = new Worker(
      new URL('../../workers/e2eeTransformWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.decryptionWorker = new Worker(
      new URL('../../workers/e2eeTransformWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.setupWorkerMessageHandler(this.encryptionWorker, 'encryption');
    this.setupWorkerMessageHandler(this.decryptionWorker, 'decryption');

    // Wait for workers to be ready
    await Promise.all([
      this.waitForWorkerReady(this.encryptionWorker, 'Encryption'),
      this.waitForWorkerReady(this.decryptionWorker, 'Decryption'),
    ]);

    // Initialize workers with current key
    const keyMaterial = this.e2eeManager.getCurrentKeyMaterial();
    if (keyMaterial) {
      await this.updateWorkerKeys(keyMaterial);
    }

    this.cleanupInterval = setInterval(() => this.cleanupTimedOutOperations(), 1000);

    console.log('✅ E2EE: Transform workers initialized');
  }

  /**
   * Setup Worker Message Handler mit Operation ID Support
   */
  private setupWorkerMessageHandler(worker: Worker, type: 'encryption' | 'decryption'): void {
    const pendingMap = type === 'encryption' ? this.pendingEncryptions : this.pendingDecryptions;

    worker.onmessage = (event: MessageEvent) => {
      const { type: msgType, payload, operationId } = event.data;

      if (msgType === 'ready' || msgType === 'initSuccess' || msgType === 'cleanupSuccess') {
        // Lifecycle messages - no operation ID
        return;
      }

      if (operationId !== undefined && pendingMap.has(operationId)) {
        const pending = pendingMap.get(operationId)!;
        pendingMap.delete(operationId);

        if (msgType === 'encryptSuccess' || msgType === 'decryptSuccess') {
          // Update stats
          if (msgType === 'encryptSuccess') {
            this.updateEncryptionStats(payload.encryptionTime);
          } else {
            this.updateDecryptionStats(payload.decryptionTime);
          }

          pending.resolve(payload.encryptedData || payload.decryptedData);
        } else if (msgType === 'error') {
          pending.reject(new Error(payload.error));
        }
      }
    };

    worker.onerror = (error) => {
      console.error(`❌ E2EE: ${type} worker error:`, error);

      // Reject all pending operations
      for (const [id, pending] of pendingMap) {
        pending.reject(new Error(`Worker error: ${error.message}`));
        pendingMap.delete(id);
      }
    };
  }

  /**
   * Wait for worker ready message
   */
  private waitForWorkerReady(worker: Worker, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${name} worker initialization timeout`));
      }, 10000);

      const handler = (event: MessageEvent) => {
        if (event.data.type === 'ready') {
          clearTimeout(timeout);
          worker.removeEventListener('message', handler);
          console.log(`✅ E2EE: ${name} worker ready`);
          resolve();
        }
      };

      worker.addEventListener('message', handler);
    });
  }

  private cleanupTimedOutOperations(): void {
    const now = Date.now();

    for (const [id, pending] of this.pendingEncryptions) {
      if (now - pending.timestamp > OPERATION_TIMEOUT) {
        pending.reject(new Error('Encryption operation timed out'));
        this.pendingEncryptions.delete(id);
        this.stats.droppedFrames++;
      }
    }

    for (const [id, pending] of this.pendingDecryptions) {
      if (now - pending.timestamp > OPERATION_TIMEOUT) {
        pending.reject(new Error('Decryption operation timed out'));
        this.pendingDecryptions.delete(id);
        this.stats.droppedFrames++;
      }
    }

    // Warnung bei zu vielen pending Operations
    const totalPending = this.pendingEncryptions.size + this.pendingDecryptions.size;
    if (totalPending > MAX_PENDING_OPERATIONS) {
      console.warn(`⚠️ E2EE: High pending operations count: ${totalPending}`);
    }
  }

  /**
   * Update worker keys (for key rotation)
   */
  async updateWorkerKeys(keyMaterial: E2EEKeyMaterial): Promise<void> {
    if (!this.encryptionWorker || !this.decryptionWorker) {
      throw new Error('Workers not initialized');
    }

    console.log(`🔄 E2EE: Updating worker keys (generation ${keyMaterial.generation})`);

    // Export key to JWK for worker transfer
    const exportedKey = await crypto.subtle.exportKey('jwk', keyMaterial.encryptionKey);

    // Send to both workers
    this.encryptionWorker.postMessage({
      type: 'updateKey',
      payload: {
        encryptionKey: exportedKey,
        generation: keyMaterial.generation,
      },
    });

    this.decryptionWorker.postMessage({
      type: 'updateKey',
      payload: {
        encryptionKey: exportedKey,
        generation: keyMaterial.generation,
      },
    });
  }

  /**
   * Apply E2EE to outgoing media sender (encrypt)
   */
  applyEncryptionToSender(sender: RTCRtpSender, kind: 'video' | 'audio'): void {
    console.log(`🔒 E2EE: Applying encryption to ${kind} sender`);

    if (!this.encryptionWorker) {
      throw new Error('Encryption worker not initialized');
    }

    // Check browser support
    if ('createEncodedStreams' in sender) {
      this.applyEncryptionChrome(sender, kind);
    } else if ('transform' in sender) {
      this.applyEncryptionFirefox(sender, kind);
    } else {
      throw new Error('Insertable Streams not supported in this browser');
    }
  }

  /**
   * Apply E2EE to incoming media receiver (decrypt)
   */
  applyDecryptionToReceiver(receiver: RTCRtpReceiver, kind: 'video' | 'audio'): void {
    console.log(`🔓 E2EE: Applying decryption to ${kind} receiver`);

    if (!this.decryptionWorker) {
      throw new Error('Decryption worker not initialized');
    }

    if ('createEncodedStreams' in receiver) {
      this.applyDecryptionChrome(receiver, kind);
    } else if ('transform' in receiver) {
      this.applyDecryptionFirefox(receiver, kind);
    } else {
      throw new Error('Insertable Streams not supported in this browser');
    }
  }

  /**
   * Chrome/Edge: Apply encryption using createEncodedStreams
   */
  private applyEncryptionChrome(sender: RTCRtpSender, kind: string): void {
    const senderStreams = (sender as any).createEncodedStreams();

    const transformStream = new TransformStream({
      transform: async (encodedFrame, controller) => {
        try {
          this.stats.totalFrames++;

          const frameData = encodedFrame.data;

          const frameDataCopy = this.copyArrayBuffer(frameData);

          // Encrypt via worker
          const encryptedData = await this.encryptFrameViaWorker(frameDataCopy);

          // Update frame with encrypted data
          encodedFrame.data = encryptedData;

          this.stats.encryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Encryption error (${kind}):`, error);
          this.stats.encryptionErrors++;

          this.stats.droppedFrames++;
        }
      },
    });

    senderStreams.readable
      .pipeThrough(transformStream)
      .pipeTo(senderStreams.writable)
      .catch((error: any) => {
        console.error('[E2EE] Encryption pipeline error:', error);
      });
  }

  /**
   * Chrome/Edge: Apply decryption using createEncodedStreams
   */
  private applyDecryptionChrome(receiver: RTCRtpReceiver, kind: string): void {
    const receiverStreams = (receiver as any).createEncodedStreams();

    const transformStream = new TransformStream({
      transform: async (encodedFrame, controller) => {
        try {
          this.stats.totalFrames++;

          const encryptedData = encodedFrame.data;

          const encryptedDataCopy = this.copyArrayBuffer(encryptedData);

          // Decrypt via worker
          const decryptedData = await this.decryptFrameViaWorker(encryptedDataCopy);

          // Update frame with decrypted data
          encodedFrame.data = decryptedData;

          this.stats.decryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Decryption error (${kind}):`, error);
          this.stats.decryptionErrors++;
          this.stats.droppedFrames++;
          // Don't enqueue - corrupted frame
        }
      },
    });

    receiverStreams.readable
      .pipeThrough(transformStream)
      .pipeTo(receiverStreams.writable)
      .catch((error: any) => {
        console.error('[E2EE] Decryption pipeline error:', error);
      });
  }

  /**
   * Firefox: Apply encryption using transform property
   */
  private applyEncryptionFirefox(sender: RTCRtpSender, kind: string): void {
    const transformStream = new TransformStream({
      transform: async (encodedFrame, controller) => {
        try {
          this.stats.totalFrames++;

          const frameData = encodedFrame.data;
          const frameDataCopy = this.copyArrayBuffer(frameData);

          const encryptedData = await this.encryptFrameViaWorker(frameDataCopy);

          encodedFrame.data = encryptedData;

          this.stats.encryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Encryption error (${kind}):`, error);
          this.stats.encryptionErrors++;
          this.stats.droppedFrames++;
        }
      },
    });

    (sender as any).transform = transformStream;
  }

  /**
   * Firefox: Apply decryption using transform property
   */
  private applyDecryptionFirefox(receiver: RTCRtpReceiver, kind: string): void {
    const transformStream = new TransformStream({
      transform: async (encodedFrame, controller) => {
        try {
          this.stats.totalFrames++;

          const encryptedData = encodedFrame.data;
          const encryptedDataCopy = this.copyArrayBuffer(encryptedData);

          const decryptedData = await this.decryptFrameViaWorker(encryptedDataCopy);

          encodedFrame.data = decryptedData;

          this.stats.decryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Decryption error (${kind}):`, error);
          this.stats.decryptionErrors++;
          this.stats.droppedFrames++;
        }
      },
    });

    (receiver as any).transform = transformStream;
  }

  private copyArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
    const copy = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(copy).set(new Uint8Array(buffer));
    return copy;
  }

  private encryptFrameViaWorker(frameData: ArrayBuffer): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.encryptionWorker) {
        reject(new Error('Encryption worker not available'));
        return;
      }

      const operationId = this.operationCounter++;

      this.pendingEncryptions.set(operationId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Send to worker mit Operation ID (Transfer Ownership für Performance)
      this.encryptionWorker.postMessage(
        {
          type: 'encrypt',
          operationId,
          payload: { frameData },
        },
        [frameData] // Transfer ownership
      );
    });
  }

  private decryptFrameViaWorker(encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.decryptionWorker) {
        reject(new Error('Decryption worker not available'));
        return;
      }

      const operationId = this.operationCounter++;

      this.pendingDecryptions.set(operationId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.decryptionWorker.postMessage(
        {
          type: 'decrypt',
          operationId,
          payload: { frameData: encryptedData },
        },
        [encryptedData]
      );
    });
  }

  /**
   * Update encryption statistics
   */
  private updateEncryptionStats(encryptionTime: number): void {
    const n = this.stats.encryptedFrames;
    this.stats.averageEncryptionTime =
      (this.stats.averageEncryptionTime * n + encryptionTime) / (n + 1);
  }

  /**
   * Update decryption statistics
   */
  private updateDecryptionStats(decryptionTime: number): void {
    const n = this.stats.decryptedFrames;
    this.stats.averageDecryptionTime =
      (this.stats.averageDecryptionTime * n + decryptionTime) / (n + 1);
  }

  /**
   * Get current frame statistics
   */
  getStats(): FrameStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalFrames: 0,
      encryptedFrames: 0,
      decryptedFrames: 0,
      encryptionErrors: 0,
      decryptionErrors: 0,
      averageEncryptionTime: 0,
      averageDecryptionTime: 0,
      droppedFrames: 0,
    };
  }

  /**
   * Vollständige Cleanup
   */
  cleanup(): void {
    console.log('🧹 E2EE: Cleaning up Insertable Streams handler');

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Reject all pending operations
    for (const [, pending] of this.pendingEncryptions) {
      pending.reject(new Error('Handler cleanup'));
    }
    this.pendingEncryptions.clear();

    for (const [, pending] of this.pendingDecryptions) {
      pending.reject(new Error('Handler cleanup'));
    }
    this.pendingDecryptions.clear();

    // Terminate workers
    if (this.encryptionWorker) {
      this.encryptionWorker.postMessage({ type: 'cleanup' });
      this.encryptionWorker.terminate();
      this.encryptionWorker = null;
    }

    if (this.decryptionWorker) {
      this.decryptionWorker.postMessage({ type: 'cleanup' });
      this.decryptionWorker.terminate();
      this.decryptionWorker = null;
    }

    this.resetStats();
  }
}
