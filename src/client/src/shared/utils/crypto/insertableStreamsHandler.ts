/**
 * Insertable Streams Handler
 *
 * Verwaltet E2EE Worker-Lifecycle und wendet Transforms auf RTCRtpSender/Receiver an.
 * Unterstützt Chrome/Firefox (createEncodedStreams/rtpTransform) und Safari (RTCRtpScriptTransform).
 */

import { exportAesKeyToJwk, type E2EEKeyMaterial } from '../../core/crypto';
import { getE2EECapabilities, type E2EECapabilities } from '../../detection';
import type { E2EEManager } from './e2eeVideoEncryption';
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
  WorkerStats,
} from '../../../workers/e2ee/shared/message-types';

// ============================================================================
// Types
// ============================================================================

type E2EEMethod = 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';

/** WebRTC Encoded Frame (RTCEncodedVideoFrame/RTCEncodedAudioFrame) */
interface EncodedMediaFrame {
  data: ArrayBuffer;
  timestamp?: number;
  type?: string;
  getMetadata?(): Record<string, unknown>;
}

/** Return type of RTCRtpSender/Receiver.createEncodedStreams() */
interface EncodedStreams {
  readable: ReadableStream<EncodedMediaFrame>;
  writable: WritableStream<EncodedMediaFrame>;
}

export interface FrameStats {
  totalFrames: number;
  encryptedFrames: number;
  decryptedFrames: number;
  encryptionErrors: number;
  decryptionErrors: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  droppedFrames: number;
}

interface PendingOperation {
  resolve: (value: ArrayBuffer) => void;
  reject: (reason: Error) => void;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

// Operation timeout: 5s für Frame-Verarbeitung
// Längerer Timeout verhindert vorzeitiges Frame-Dropping bei:
// - Langsamen Geräten (ältere Smartphones, Tablets)
// - CPU-Last durch andere Tabs
// - Netzwerklatenz bei Key-Exchange
const OPERATION_TIMEOUT = 5000;

// ============================================================================
// Handler Class
// ============================================================================

export class InsertableStreamsHandler {
  // Stored for potential fallback encryption if workers are unavailable
  private _e2eeManager: E2EEManager;
  private capabilities: E2EECapabilities;
  private e2eeMethod: E2EEMethod;

  // Workers
  private encryptionWorker: Worker | null = null;
  private decryptionWorker: Worker | null = null;

  // Pending operations
  private pendingEncryptions = new Map<number, PendingOperation>();
  private pendingDecryptions = new Map<number, PendingOperation>();
  private pendingKeyUpdates = new Map<
    number,
    { resolve: () => void; reject: (e: Error) => void }
  >();
  private operationCounter = 0;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  // State
  private encryptionEnabled = false;
  private workersInitialized = false;
  private workerInitPromise: Promise<void> | null = null;

  // Encoded Streams (Chrome legacy) - use WeakMap to store by sender/receiver
  private senderEncodedStreams = new WeakMap<
    RTCRtpSender,
    { readable: ReadableStream; writable: WritableStream }
  >();
  private receiverEncodedStreams = new WeakMap<
    RTCRtpReceiver,
    { readable: ReadableStream; writable: WritableStream }
  >();
  // Track which senders/receivers have been piped
  private pipedSenders = new WeakSet<RTCRtpSender>();
  private pipedReceivers = new WeakSet<RTCRtpReceiver>();

  // Applied transforms tracking
  private appliedSenderTransforms = new Set<string>();
  private appliedReceiverTransforms = new Set<string>();

  // Video receivers for keyframe requests after key updates
  // WICHTIG: Nach Key-Update fordern wir Keyframes an damit Video sofort startet!
  private videoReceivers = new Set<RTCRtpReceiver>();

  // PeerConnection reference for keyframe requests (Chrome workaround)
  private peerConnection: RTCPeerConnection | null = null;

  // Stats
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
    this._e2eeManager = e2eeManager;
    this.capabilities = getE2EECapabilities();
    this.e2eeMethod = this.capabilities.method;
    console.debug(`🔒 E2EE: Detected method: ${this.e2eeMethod}`);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getE2EEMethod(): E2EEMethod {
    return this.e2eeMethod;
  }

  getE2EEManager(): E2EEManager {
    return this._e2eeManager;
  }

  isSupported(): boolean {
    return this.e2eeMethod !== 'none';
  }

  areWorkersInitialized(): boolean {
    return this.workersInitialized;
  }

  requiresEncodedStreams(): boolean {
    return this.e2eeMethod === 'encodedStreams';
  }

  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

  getStats(): FrameStats {
    return { ...this.stats };
  }

  /**
   * Set the PeerConnection reference for Chrome keyframe workaround
   * Chrome doesn't support RTCRtpReceiver.requestKeyFrame(), so we need
   * to trigger keyframes via SDP renegotiation or other means.
   */
  setPeerConnection(pc: RTCPeerConnection): void {
    this.peerConnection = pc;
  }

  // ============================================================================
  // Worker Initialization
  // ============================================================================

  async initializeWorkers(): Promise<void> {
    if (this.workersInitialized) return;
    if (this.workerInitPromise) return this.workerInitPromise;

    this.workerInitPromise = this.doInitializeWorkers();
    return this.workerInitPromise;
  }

  private async doInitializeWorkers(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('⚠️ E2EE: Not supported in this browser');
      return;
    }

    try {
      const { usesScriptTransform } = this.capabilities;
      const workerUrl = usesScriptTransform
        ? new URL('../../../workers/e2ee/safari-e2ee-worker.ts', import.meta.url)
        : new URL('../../../workers/e2ee/chrome-e2ee-worker.ts', import.meta.url);

      console.debug(
        `🔧 E2EE: Loading ${usesScriptTransform ? 'ScriptTransform' : 'EncodedStreams'} worker...`
      );

      // Create workers
      this.encryptionWorker = new Worker(workerUrl, { type: 'module' });
      this.decryptionWorker = new Worker(workerUrl, { type: 'module' });

      // Setup message handlers
      this.setupWorkerHandlers(this.encryptionWorker, 'encryption');
      this.setupWorkerHandlers(this.decryptionWorker, 'decryption');

      // Wait for workers to be ready
      await Promise.all([
        this.waitForWorkerReady(this.encryptionWorker),
        this.waitForWorkerReady(this.decryptionWorker),
      ]);

      // Start cleanup interval for timed-out operations
      this.cleanupInterval = setInterval(() => this.cleanupTimedOutOperations(), 1000);

      this.workersInitialized = true;
      console.debug('✅ E2EE: Workers initialized successfully');
    } catch (error) {
      console.error('❌ E2EE: Worker initialization failed:', error);
      throw error;
    }
  }

  private setupWorkerHandlers(worker: Worker, type: 'encryption' | 'decryption'): void {
    worker.addEventListener('message', (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'encryptSuccess':
          this.handleEncryptSuccess(message.operationId, message.payload);
          break;

        case 'decryptSuccess':
          this.handleDecryptSuccess(message.operationId, message.payload);
          break;

        case 'error':
          this.handleWorkerError(message.operationId, message.payload.error);
          break;

        case 'stats':
          this.updateStatsFromWorker(message.payload);
          break;

        case 'keyUpdated':
          console.debug(`🔑 E2EE ${type} worker: Key updated`);
          if (message.operationId !== undefined) {
            const pending = this.pendingKeyUpdates.get(message.operationId);
            if (pending) {
              this.pendingKeyUpdates.delete(message.operationId);
              pending.resolve();
            }
          }
          break;

        case 'ready':
          console.debug(`✅ E2EE ${type} worker: Ready`);
          break;

        case 'cleanupComplete':
          console.debug(`🧹 E2EE ${type} worker: Cleanup complete`);
          break;

        default:
          // Exhaustive check for future message types
          console.debug(`E2EE ${type} worker: Unknown message type`);
      }
    });

    worker.addEventListener('error', (error) => {
      console.error(`❌ E2EE ${type} worker error:`, error);
    });
  }

  private handleEncryptSuccess(
    operationId: number,
    payload: { encryptedData: ArrayBuffer; encryptionTime?: number }
  ): void {
    const pending = this.pendingEncryptions.get(operationId);
    if (!pending) return;

    this.pendingEncryptions.delete(operationId);
    pending.resolve(payload.encryptedData);

    this.stats.totalFrames++;
    this.stats.encryptedFrames++;
    if (payload.encryptionTime !== undefined && payload.encryptionTime !== 0) {
      this.updateAverageTime('encryption', payload.encryptionTime);
    }
  }

  private handleDecryptSuccess(
    operationId: number,
    payload: { decryptedData: ArrayBuffer; decryptionTime?: number; dropped?: boolean }
  ): void {
    const pending = this.pendingDecryptions.get(operationId);
    if (!pending) return;

    this.pendingDecryptions.delete(operationId);

    // Handle dropped frames: reject the promise so TransformStream doesn't enqueue
    if (payload.dropped === true) {
      this.stats.droppedFrames++;
      // Reject with a special error that the TransformStream can catch
      pending.reject(new Error('FRAME_DROPPED'));
      return;
    }

    pending.resolve(payload.decryptedData);

    this.stats.totalFrames++;
    this.stats.decryptedFrames++;
    if (payload.decryptionTime !== undefined && payload.decryptionTime !== 0) {
      this.updateAverageTime('decryption', payload.decryptionTime);
    }
  }

  private handleWorkerError(operationId: number | undefined, errorMessage: string): void {
    if (operationId === undefined) return;

    const encPending = this.pendingEncryptions.get(operationId);
    if (encPending) {
      this.pendingEncryptions.delete(operationId);
      encPending.reject(new Error(errorMessage));
      this.stats.encryptionErrors++;
      return;
    }

    const decPending = this.pendingDecryptions.get(operationId);
    if (decPending) {
      this.pendingDecryptions.delete(operationId);
      decPending.reject(new Error(errorMessage));
      this.stats.decryptionErrors++;
    }
  }

  private waitForWorkerReady(worker: Worker): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker initialization timeout'));
      }, 5000);

      const handler = (event: MessageEvent<WorkerOutboundMessage>): void => {
        if (event.data.type === 'ready') {
          clearTimeout(timeout);
          worker.removeEventListener('message', handler);
          resolve();
        }
      };

      worker.addEventListener('message', handler);
    });
  }

  // ============================================================================
  // Key Management
  // ============================================================================

  async updateKey(encryptionKey: CryptoKey, generation: number): Promise<void> {
    if (!this.workersInitialized) {
      await this.initializeWorkers();
    }

    const keyJwk = await exportAesKeyToJwk(encryptionKey);

    // Create promises that wait for key update acknowledgement from workers
    // CRITICAL for RTCRtpScriptTransform (Safari/Firefox): onrtctransform fires
    // immediately when RTCRtpScriptTransform is created, so we MUST ensure the
    // worker has the key BEFORE we create the transform.
    const promises: Promise<void>[] = [];

    if (this.encryptionWorker) {
      const encOpId = this.operationCounter++;
      const encPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingKeyUpdates.delete(encOpId);
          reject(new Error('Encryption worker key update timeout'));
        }, 3000);

        this.pendingKeyUpdates.set(encOpId, {
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: (e) => {
            clearTimeout(timeout);
            reject(e);
          },
        });
      });
      promises.push(encPromise);

      const message: WorkerInboundMessage = {
        type: 'updateKey',
        payload: { encryptionKey: keyJwk, generation },
        operationId: encOpId,
      };
      this.encryptionWorker.postMessage(message);
    }

    if (this.decryptionWorker) {
      const decOpId = this.operationCounter++;
      const decPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingKeyUpdates.delete(decOpId);
          reject(new Error('Decryption worker key update timeout'));
        }, 3000);

        this.pendingKeyUpdates.set(decOpId, {
          resolve: () => {
            clearTimeout(timeout);
            resolve();
          },
          reject: (e) => {
            clearTimeout(timeout);
            reject(e);
          },
        });
      });
      promises.push(decPromise);

      const message: WorkerInboundMessage = {
        type: 'updateKey',
        payload: { encryptionKey: keyJwk, generation },
        operationId: decOpId,
      };
      this.decryptionWorker.postMessage(message);
    }

    // Wait for BOTH workers to acknowledge the key update
    await Promise.all(promises);

    console.debug(`🔑 E2EE: Key updated to generation ${generation} (both workers confirmed)`);

    // KRITISCH: Keyframe anfordern damit Video sofort startet!
    // Ohne das muss der Decoder auf den nächsten I-Frame warten (2-10 Sekunden)
    this.requestKeyFrames();
  }

  /**
   * Request keyframes from all video receivers
   *
   * WICHTIG: Nach Key-Exchange oder Key-Rotation müssen wir einen Keyframe anfordern,
   * sonst muss der Video-Decoder auf den nächsten I-Frame warten (kann 2-10 Sekunden dauern!)
   *
   * Für Chrome (encodedStreams/rtpTransform) verwenden wir verschiedene Ansätze:
   * 1. RTCRtpReceiver.requestKeyFrame() (wenn verfügbar)
   * 2. Trigger via setParameters (forces encoder to send keyframe)
   *
   * Für RTCRtpScriptTransform (Safari/Firefox) wird dies im Worker via
   * RTCRtpScriptTransformer.sendKeyFrameRequest() gemacht.
   */
  private requestKeyFrames(): void {
    // RTCRtpScriptTransform: Worker macht das automatisch via sendKeyFrameRequest()
    if (this.e2eeMethod === 'scriptTransform') {
      console.debug('🔧 ScriptTransform: Keyframe request handled by worker');
      return;
    }

    if (this.videoReceivers.size === 0) {
      console.debug('📹 E2EE: No video receivers to request keyframes from');
      return;
    }

    console.debug(`📹 E2EE: Requesting keyframes from ${this.videoReceivers.size} video receivers`);

    // Try receiver.requestKeyFrame() first (newer browsers)
    let requestSent = false;
    for (const receiver of this.videoReceivers) {
      try {
        const receiverWithKeyFrame = receiver as RTCRtpReceiver & {
          requestKeyFrame?(): Promise<void>;
        };

        if (typeof receiverWithKeyFrame.requestKeyFrame === 'function') {
          void receiverWithKeyFrame
            .requestKeyFrame()
            .then(() => {
              console.debug('📹 E2EE: Keyframe request sent via RTCRtpReceiver.requestKeyFrame()');
            })
            .catch((error: unknown) => {
              console.debug('📹 E2EE: Keyframe request failed (not critical):', error);
            });
          requestSent = true;
        }
      } catch (error) {
        console.debug('📹 E2EE: Keyframe request error (not critical):', error);
      }
    }

    // Chrome workaround: trigger keyframe via sender setParameters
    // This forces the local encoder to send a keyframe, which helps the remote decoder
    if (!requestSent && this.peerConnection) {
      this.triggerKeyframeViaSender();
    } else if (!requestSent) {
      console.debug('📹 E2EE: No keyframe request method available - video may be briefly blurry');
    }
  }

  /**
   * Chrome workaround: Trigger keyframe by temporarily changing sender parameters
   * This causes the encoder to generate a new keyframe
   */
  private triggerKeyframeViaSender(): void {
    if (!this.peerConnection) return;

    const senders = this.peerConnection.getSenders();
    for (const sender of senders) {
      if (sender.track?.kind !== 'video') continue;

      try {
        const params = sender.getParameters();
        const { encodings } = params;
        if (encodings.length === 0) continue;

        // Temporarily change priority to force a new keyframe
        // This is a known Chrome workaround
        const firstEncoding = encodings[0];
        const originalPriority = firstEncoding.priority ?? 'low';
        firstEncoding.priority = originalPriority === 'high' ? 'medium' : 'high';

        void sender.setParameters(params).then(() => {
          // Restore original priority after a short delay
          setTimeout(() => {
            const restoreParams = sender.getParameters();
            const restoreEncodings = restoreParams.encodings;
            if (restoreEncodings.length > 0) {
              restoreEncodings[0].priority = originalPriority;
              void sender.setParameters(restoreParams).catch(() => {
                // Ignore errors during restore
              });
            }
          }, 100);
          console.debug('📹 E2EE: Keyframe triggered via sender setParameters (Chrome workaround)');
        });
      } catch (error) {
        console.debug('📹 E2EE: Chrome keyframe workaround failed (not critical):', error);
      }
    }
  }

  async updateWorkerKeys(keyMaterial: E2EEKeyMaterial): Promise<void> {
    await this.updateKey(keyMaterial.encryptionKey, keyMaterial.generation);
  }

  enableEncryption(): void {
    this.encryptionEnabled = true;

    const message: WorkerInboundMessage = { type: 'enableEncryption' };
    this.encryptionWorker?.postMessage(message);
    this.decryptionWorker?.postMessage(message);

    console.debug('🔐 E2EE: Encryption enabled');
  }

  disableEncryption(): void {
    this.encryptionEnabled = false;

    const message: WorkerInboundMessage = { type: 'disableEncryption' };
    this.encryptionWorker?.postMessage(message);
    this.decryptionWorker?.postMessage(message);

    console.debug('🔓 E2EE: Encryption disabled');
  }

  // ============================================================================
  // Transform Application (Chrome encodedStreams)
  // ============================================================================

  prepareEncodedStreamsForSender(sender: RTCRtpSender, kind: 'video' | 'audio'): void {
    if (this.e2eeMethod !== 'encodedStreams') return;
    if (this.senderEncodedStreams.has(sender)) return; // Already prepared

    try {
      // Chrome-specific API for Insertable Streams
      const senderWithStreams = sender as RTCRtpSender & {
        createEncodedStreams(): EncodedStreams;
      };
      const { readable, writable } = senderWithStreams.createEncodedStreams();
      this.senderEncodedStreams.set(sender, { readable, writable });
      console.debug(`📤 E2EE: Prepared encoded streams for ${kind} sender`);
    } catch (e) {
      console.warn(`⚠️ E2EE: Could not create encoded streams for ${kind} sender:`, e);
    }
  }

  prepareEncodedStreamsForReceiver(receiver: RTCRtpReceiver, kind: 'video' | 'audio'): void {
    if (this.e2eeMethod !== 'encodedStreams') return;
    if (this.receiverEncodedStreams.has(receiver)) return; // Already prepared

    try {
      // Chrome-specific API for Insertable Streams
      const receiverWithStreams = receiver as RTCRtpReceiver & {
        createEncodedStreams(): EncodedStreams;
      };
      const { readable, writable } = receiverWithStreams.createEncodedStreams();
      this.receiverEncodedStreams.set(receiver, { readable, writable });
      console.debug(`📥 E2EE: Prepared encoded streams for ${kind} receiver`);
    } catch (e) {
      console.warn(`⚠️ E2EE: Could not create encoded streams for ${kind} receiver:`, e);
    }
  }

  async applyEncryptionToSenders(senders: RTCRtpSender[]): Promise<void> {
    if (!this.workersInitialized) {
      await this.initializeWorkers();
    }

    for (const sender of senders) {
      if (!sender.track) continue;

      const kind = sender.track.kind as 'video' | 'audio';
      const senderId = `${kind}-${sender.track.id}`;

      if (this.appliedSenderTransforms.has(senderId)) {
        continue;
      }

      try {
        this.applyEncryptionTransform(sender, kind);
        this.appliedSenderTransforms.add(senderId);
      } catch (e) {
        console.warn(`⚠️ E2EE: Failed to apply encryption to ${kind} sender:`, e);
      }
    }
  }

  async applyEncryptionToSender(sender: RTCRtpSender, kind: 'video' | 'audio'): Promise<void> {
    if (!this.workersInitialized) {
      await this.initializeWorkers();
    }

    if (!sender.track) return;

    const senderId = `${kind}-${sender.track.id}`;
    if (this.appliedSenderTransforms.has(senderId)) return;

    try {
      this.applyEncryptionTransform(sender, kind);
      this.appliedSenderTransforms.add(senderId);
    } catch (e) {
      console.warn(`⚠️ E2EE: Failed to apply encryption to ${kind} sender:`, e);
    }
  }

  async applyDecryptionToReceivers(receivers: RTCRtpReceiver[]): Promise<void> {
    if (!this.workersInitialized) {
      await this.initializeWorkers();
    }

    for (const receiver of receivers) {
      const kind = receiver.track.kind as 'video' | 'audio';
      const receiverId = `${kind}-${receiver.track.id}`;

      if (this.appliedReceiverTransforms.has(receiverId)) {
        continue;
      }

      try {
        this.applyDecryptionTransform(receiver, kind);
        this.appliedReceiverTransforms.add(receiverId);
      } catch (e) {
        console.warn(`⚠️ E2EE: Failed to apply decryption to ${kind} receiver:`, e);
      }
    }
  }

  /**
   * Apply decryption to a single receiver
   * Handles RTCRtpScriptTransform (Safari/Firefox), encodedStreams (Chrome legacy), and rtpTransform
   */
  applyDecryptionToReceiver(receiver: RTCRtpReceiver, kind: 'video' | 'audio'): void {
    const receiverId = `${kind}-${receiver.track.id}`;
    if (this.appliedReceiverTransforms.has(receiverId)) return;

    // Track video receivers for keyframe requests after key updates
    if (kind === 'video') {
      this.videoReceivers.add(receiver);
      console.debug(
        `📹 E2EE: Tracking video receiver for keyframe requests (total: ${this.videoReceivers.size})`
      );
    }

    if (this.e2eeMethod === 'scriptTransform') {
      // Safari/Firefox: RTCRtpScriptTransform
      if (this.decryptionWorker) {
        try {
          receiver.transform = new RTCRtpScriptTransform(this.decryptionWorker, {
            operation: 'decrypt',
            kind,
          });
          this.appliedReceiverTransforms.add(receiverId);
          console.debug(`🔧 ScriptTransform: Applied decryption transform to ${kind} receiver`);
        } catch (e) {
          console.warn(`⚠️ ScriptTransform: Failed to apply decryption transform:`, e);
        }
      }
    } else if (this.e2eeMethod === 'encodedStreams') {
      // Chrome: Pipe encoded streams through decryption transform
      // CRITICAL: The streams must be prepared BEFORE this is called!
      this.pipeEncodedStreamsForReceiver(receiver, kind);
      this.appliedReceiverTransforms.add(receiverId);
    } else if (this.e2eeMethod === 'rtpTransform') {
      // Firefox/Chrome 118+: RTCRtpReceiver.transform
      const transformStream = this.createDecryptionTransformStream();
      receiver.transform = transformStream;
      this.appliedReceiverTransforms.add(receiverId);
      console.debug(`🦊 Firefox/Chrome: Applied rtp transform to ${kind} receiver`);
    }
  }

  // ============================================================================
  // Private Transform Methods
  // ============================================================================

  private applyEncryptionTransform(sender: RTCRtpSender, kind: 'video' | 'audio'): void {
    if (this.e2eeMethod === 'scriptTransform') {
      // Safari/Firefox: RTCRtpScriptTransform
      if (this.encryptionWorker) {
        sender.transform = new RTCRtpScriptTransform(this.encryptionWorker, {
          operation: 'encrypt',
          kind,
        });
        console.debug(`🔧 ScriptTransform: Applied encryption transform to ${kind} sender`);
      }
    } else if (this.e2eeMethod === 'rtpTransform') {
      // Firefox/Chrome 118+: RTCRtpSender.transform with TransformStream
      const transformStream = this.createEncryptionTransformStream();
      sender.transform = transformStream;
      console.debug(`🦊 Firefox/Chrome: Applied rtp transform to ${kind} sender`);
    } else if (this.e2eeMethod === 'encodedStreams') {
      // Chrome legacy: pipe readable → transform → writable
      this.pipeEncodedStreamsForSender(sender, kind);
    }
  }

  private applyDecryptionTransform(receiver: RTCRtpReceiver, kind: 'video' | 'audio'): void {
    if (this.e2eeMethod === 'scriptTransform') {
      // Safari/Firefox: RTCRtpScriptTransform
      if (this.decryptionWorker) {
        receiver.transform = new RTCRtpScriptTransform(this.decryptionWorker, {
          operation: 'decrypt',
          kind,
        });
        console.debug(`🔧 ScriptTransform: Applied decryption transform to ${kind} receiver`);
      }
    } else if (this.e2eeMethod === 'rtpTransform') {
      // Firefox/Chrome 118+
      const transformStream = this.createDecryptionTransformStream();
      receiver.transform = transformStream;
      console.debug(`🦊 Firefox/Chrome: Applied rtp transform to ${kind} receiver`);
    } else if (this.e2eeMethod === 'encodedStreams') {
      // Chrome legacy: pipe readable → transform → writable
      this.pipeEncodedStreamsForReceiver(receiver, kind);
    }
  }

  /**
   * Chrome encodedStreams: Pipe sender streams through encryption transform
   */
  private pipeEncodedStreamsForSender(sender: RTCRtpSender, kind: 'video' | 'audio'): void {
    if (this.pipedSenders.has(sender)) {
      console.debug(`🌐 Chrome: Sender ${kind} already piped`);
      return;
    }

    const streams = this.senderEncodedStreams.get(sender);
    if (!streams) {
      console.warn(`⚠️ Chrome: No encoded streams found for ${kind} sender`);
      return;
    }

    const transformStream = this.createEncryptionTransformStream();

    // Pipe: readable → transform → writable
    // Note: Chrome's createEncodedStreams returns streams with `any` type
    void streams.readable
      .pipeThrough(transformStream)
      .pipeTo(streams.writable as WritableStream<EncodedMediaFrame>)
      .catch((error: unknown) => {
        console.error(`❌ Chrome: Encryption pipeline error for ${kind}:`, error);
      });

    this.pipedSenders.add(sender);
    console.debug(`🌐 Chrome: Piped encryption transform for ${kind} sender`);
  }

  /**
   * Chrome encodedStreams: Pipe receiver streams through decryption transform
   */
  private pipeEncodedStreamsForReceiver(receiver: RTCRtpReceiver, kind: 'video' | 'audio'): void {
    if (this.pipedReceivers.has(receiver)) {
      console.debug(`🌐 Chrome: Receiver ${kind} already piped`);
      return;
    }

    const streams = this.receiverEncodedStreams.get(receiver);
    if (!streams) {
      console.warn(`⚠️ Chrome: No encoded streams found for ${kind} receiver`);
      return;
    }

    const transformStream = this.createDecryptionTransformStream();

    // Pipe: readable → transform → writable
    // Note: Chrome's createEncodedStreams returns streams with `any` type
    void streams.readable
      .pipeThrough(transformStream)
      .pipeTo(streams.writable as WritableStream<EncodedMediaFrame>)
      .catch((error: unknown) => {
        console.error(`❌ Chrome: Decryption pipeline error for ${kind}:`, error);
      });

    this.pipedReceivers.add(receiver);
    console.debug(`🌐 Chrome: Piped decryption transform for ${kind} receiver`);
  }

  private createEncryptionTransformStream(): TransformStream<EncodedMediaFrame, EncodedMediaFrame> {
    return new TransformStream<EncodedMediaFrame, EncodedMediaFrame>({
      transform: async (frame, controller) => {
        if (!this.encryptionEnabled || !this.encryptionWorker) {
          controller.enqueue(frame);
          return;
        }

        try {
          const encryptedData = await this.encryptFrame(frame.data);
          // CRITICAL: Mutate the frame's data property directly!
          // RTCEncodedVideoFrame/RTCEncodedAudioFrame are special objects
          // that cannot be spread - spreading loses critical internal state.
          // Chrome requires the original frame object with modified data.
          // eslint-disable-next-line require-atomic-updates -- Intentional mutation of WebRTC frame
          frame.data = encryptedData;
          controller.enqueue(frame);
        } catch (error: unknown) {
          // Bei Encryption-Fehler: Frame unverschlüsselt durchreichen
          // Besser als gar kein Video - Empfänger kann unverschlüsselte Frames erkennen
          this.stats.encryptionErrors++;
          console.warn('[E2EE] Encryption failed, passing through unencrypted:', error);
          controller.enqueue(frame);
        }
      },
    });
  }

  private createDecryptionTransformStream(): TransformStream<EncodedMediaFrame, EncodedMediaFrame> {
    return new TransformStream<EncodedMediaFrame, EncodedMediaFrame>({
      transform: async (frame, controller) => {
        if (!this.decryptionWorker) {
          controller.enqueue(frame);
          return;
        }

        try {
          const decryptedData = await this.decryptFrame(frame.data);
          // CRITICAL: Mutate the frame's data property directly!
          // RTCEncodedVideoFrame/RTCEncodedAudioFrame are special objects
          // that cannot be spread - spreading loses critical internal state.
          // Chrome requires the original frame object with modified data.
          // eslint-disable-next-line require-atomic-updates -- Intentional mutation of WebRTC frame
          frame.data = decryptedData;
          controller.enqueue(frame);
        } catch (error: unknown) {
          // FRAME_DROPPED means the worker intentionally dropped this frame
          // (encrypted frame arrived before key exchange completed)
          // Don't enqueue anything - video will briefly freeze until key is ready
          if (error instanceof Error && error.message === 'FRAME_DROPPED') {
            this.stats.droppedFrames++;
            return; // Don't enqueue - frame is intentionally dropped
          }
          // KRITISCH: Bei Decryption-Fehler Frame DROPPEN, nicht durchreichen!
          // Durchreichen des verschlüsselten Frames → schwarzes/korruptes Video
          this.stats.decryptionErrors++;
          this.stats.droppedFrames++;
          console.warn('[E2EE] Decryption failed, dropping frame:', error);
          // Nicht enqueueen = Frame wird verworfen (besser als korruptes Video)
        }
      },
    });
  }

  // ============================================================================
  // Frame Encryption/Decryption via Worker
  // ============================================================================

  private async encryptFrame(frameData: ArrayBuffer): Promise<ArrayBuffer> {
    const worker = this.encryptionWorker;
    if (!worker) {
      throw new Error('Encryption worker not initialized');
    }

    const operationId = this.operationCounter++;

    return new Promise<ArrayBuffer>((resolve, reject) => {
      this.pendingEncryptions.set(operationId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      const message: WorkerInboundMessage = {
        type: 'encrypt',
        payload: { frameData },
        operationId,
      };

      worker.postMessage(message, [frameData]);
    });
  }

  private async decryptFrame(frameData: ArrayBuffer): Promise<ArrayBuffer> {
    const worker = this.decryptionWorker;
    if (!worker) {
      throw new Error('Decryption worker not initialized');
    }

    const operationId = this.operationCounter++;

    return new Promise<ArrayBuffer>((resolve, reject) => {
      this.pendingDecryptions.set(operationId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      const message: WorkerInboundMessage = {
        type: 'decrypt',
        payload: { frameData },
        operationId,
      };

      worker.postMessage(message, [frameData]);
    });
  }

  // ============================================================================
  // Stats & Cleanup
  // ============================================================================

  private updateAverageTime(type: 'encryption' | 'decryption', time: number): void {
    if (type === 'encryption') {
      const total = this.stats.encryptedFrames;
      this.stats.averageEncryptionTime =
        (this.stats.averageEncryptionTime * (total - 1) + time) / total;
    } else {
      const total = this.stats.decryptedFrames;
      this.stats.averageDecryptionTime =
        (this.stats.averageDecryptionTime * (total - 1) + time) / total;
    }
  }

  private updateStatsFromWorker(workerStats: WorkerStats): void {
    this.stats.totalFrames = workerStats.totalFrames;
    this.stats.encryptedFrames = workerStats.encryptedFrames;
    this.stats.decryptedFrames = workerStats.decryptedFrames;
    this.stats.encryptionErrors = workerStats.encryptionErrors;
    this.stats.decryptionErrors = workerStats.decryptionErrors;
    this.stats.averageEncryptionTime = workerStats.averageEncryptionTimeMs;
    this.stats.averageDecryptionTime = workerStats.averageDecryptionTimeMs;
  }

  private cleanupTimedOutOperations(): void {
    const now = Date.now();

    for (const [id, op] of this.pendingEncryptions) {
      if (now - op.timestamp > OPERATION_TIMEOUT) {
        this.pendingEncryptions.delete(id);
        op.reject(new Error('Operation timed out'));
        this.stats.droppedFrames++;
      }
    }

    for (const [id, op] of this.pendingDecryptions) {
      if (now - op.timestamp > OPERATION_TIMEOUT) {
        this.pendingDecryptions.delete(id);
        op.reject(new Error('Operation timed out'));
        this.stats.droppedFrames++;
      }
    }
  }

  cleanup(): void {
    console.debug('🧹 E2EE: Cleanup InsertableStreamsHandler');

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Send cleanup to workers
    const cleanupMessage: WorkerInboundMessage = { type: 'cleanup' };
    this.encryptionWorker?.postMessage(cleanupMessage);
    this.decryptionWorker?.postMessage(cleanupMessage);

    // Terminate workers
    this.encryptionWorker?.terminate();
    this.decryptionWorker?.terminate();
    this.encryptionWorker = null;
    this.decryptionWorker = null;

    // Clear pending operations
    for (const op of this.pendingEncryptions.values()) {
      op.reject(new Error('Cleanup'));
    }
    for (const op of this.pendingDecryptions.values()) {
      op.reject(new Error('Cleanup'));
    }
    this.pendingEncryptions.clear();
    this.pendingDecryptions.clear();
    for (const op of this.pendingKeyUpdates.values()) {
      op.reject(new Error('Cleanup'));
    }
    this.pendingKeyUpdates.clear();

    // Reset encoded streams (WeakMaps will be garbage collected when senders/receivers are gone)
    this.senderEncodedStreams = new WeakMap();
    this.receiverEncodedStreams = new WeakMap();
    this.pipedSenders = new WeakSet();
    this.pipedReceivers = new WeakSet();

    // Clear applied transforms
    this.appliedSenderTransforms.clear();
    this.appliedReceiverTransforms.clear();

    // Reset state
    this.workersInitialized = false;
    this.workerInitPromise = null;
    this.encryptionEnabled = false;

    // Reset stats
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
}
