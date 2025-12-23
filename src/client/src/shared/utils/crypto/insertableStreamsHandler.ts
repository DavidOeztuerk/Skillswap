/**
 * Insertable Streams Handler for WebRTC E2EE
 */

import type { E2EEManager, E2EEKeyMaterial } from './e2eeVideoEncryption';

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

interface PendingOperation {
  resolve: (value: ArrayBuffer) => void;
  reject: (reason: Error) => void;
  timestamp: number;
}

// Worker message types
interface WorkerStatsPayload {
  totalFrames?: number;
  encryptedFrames?: number;
  decryptedFrames?: number;
  encryptionErrors?: number;
  decryptionErrors?: number;
  averageEncryptionTime?: number;
  averageDecryptionTime?: number;
}

interface WorkerSuccessPayload {
  encryptionTime?: number;
  decryptionTime?: number;
  encryptedData?: ArrayBuffer;
  decryptedData?: ArrayBuffer;
  error?: string;
}

interface WorkerMessage {
  type: string;
  payload?: WorkerStatsPayload | WorkerSuccessPayload;
  operationId?: number;
}

// RTCEncodedFrame type for typed access
interface RTCEncodedFrame {
  data: ArrayBuffer;
  timestamp: number;
  type?: string;
}

const OPERATION_TIMEOUT = 5000;

type E2EEMethod = 'encodedStreams' | 'rtpTransform' | 'scriptTransform' | 'none';

function detectE2EEMethod(): E2EEMethod {
  // KRITISCHER FIX: Chrome 143+ erkennt beide APIs, aber encodedStreams ist korrekt!
  const ua = navigator.userAgent.toLowerCase();

  // 1. ZUERST auf echte Safari prüfen (mit robuster Erkennung)
  const isRealSafari = (() => {
    const isWebKit = 'webkitSpeechRecognition' in window || 'webkitAudioContext' in window;
    const hasSafariInUA =
      ua.includes('safari') &&
      !ua.includes('chrome') &&
      !ua.includes('chromium') &&
      !ua.includes('edg');
    return isWebKit && hasSafariInUA;
  })();

  // 2. Echte Safari mit RTCRtpScriptTransform
  if (isRealSafari && typeof RTCRtpScriptTransform !== 'undefined') {
    console.debug('🍎 E2EE: Safari detected, using scriptTransform');
    return 'scriptTransform';
  }

  // 3. WICHTIG: Chrome/Edge PRÜFEN VOR Firefox!
  // Chrome 86+ hat createEncodedStreams, Chrome 118+ hat AUCH rtpTransform
  // ABER wir MÜSSEN encodedStreams verwenden für korrekte E2EE!
  const isChrome = ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg');

  if (isChrome && typeof RTCRtpSender !== 'undefined') {
    // Chrome 86+ mit createEncodedStreams
    if ('createEncodedStreams' in RTCRtpSender.prototype) {
      console.debug(
        '🌐 E2EE: Chrome/Edge detected, using encodedStreams (createEncodedStreams API)'
      );
      return 'encodedStreams';
    }
    // Chrome 118+ mit rtpTransform (NICHT verwenden für E2EE - nur als Fallback)
    if ('transform' in RTCRtpSender.prototype) {
      console.warn('⚠️ E2EE: Chrome with only rtpTransform - limited E2EE support');
      return 'rtpTransform';
    }
  }

  // 4. Firefox 117+ mit RTCRtpSender.transform
  const isFirefox = ua.includes('firefox');
  if (isFirefox && typeof RTCRtpSender !== 'undefined' && 'transform' in RTCRtpSender.prototype) {
    console.debug('🦊 E2EE: Firefox detected, using rtpTransform (TransformStream)');
    return 'rtpTransform';
  }

  console.warn('⚠️ E2EE: No supported method found');
  return 'none';
}

export class InsertableStreamsHandler {
  private e2eeManager: E2EEManager;
  private encryptionWorker: Worker | null = null;
  private decryptionWorker: Worker | null = null;
  private safariEncryptionWorker: Worker | null = null;
  private safariDecryptionWorker: Worker | null = null;
  private pendingEncryptions = new Map<number, PendingOperation>();
  private pendingDecryptions = new Map<number, PendingOperation>();
  private operationCounter = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private e2eeMethod: E2EEMethod;

  // Flag für aktive Encryption
  private encryptionEnabled = false;

  // Gecachte Encoded Streams für Chrome
  private senderEncodedStreams = new Map<
    string,
    { readable: ReadableStream; writable: WritableStream }
  >();
  private receiverEncodedStreams = new Map<
    string,
    { readable: ReadableStream; writable: WritableStream }
  >();

  // Track applied transforms to avoid double-applying
  private appliedSenderTransforms = new Set<string>();
  private appliedReceiverTransforms = new Set<string>();

  // Flag to track if workers are initialized
  private workersInitialized = false;
  private workerInitPromise: Promise<void> | null = null;

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
    this.e2eeMethod = detectE2EEMethod();
    console.debug(`🔒 E2EE: Detected method: ${this.e2eeMethod}`);
  }

  getE2EEMethod(): E2EEMethod {
    return this.e2eeMethod;
  }

  isSupported(): boolean {
    return this.e2eeMethod !== 'none';
  }

  areWorkersInitialized(): boolean {
    return this.workersInitialized;
  }

  /**
   * NEU: Prüft ob diese Methode Encoded Streams benötigt
   */
  requiresEncodedStreams(): boolean {
    return this.e2eeMethod === 'encodedStreams';
  }

  enableEncryption(): void {
    console.debug('🔐 E2EE: Enabling encryption (keys ready)');
    this.encryptionEnabled = true;

    // Informiere alle Worker
    const workers = [
      this.encryptionWorker,
      this.decryptionWorker,
      this.safariEncryptionWorker,
      this.safariDecryptionWorker,
    ];

    workers.forEach((worker) => {
      if (worker) {
        worker.postMessage({ type: 'enableEncryption' });
      }
    });
  }

  disableEncryption(): void {
    console.debug('🔓 E2EE: Disabling encryption');
    this.encryptionEnabled = false;

    const workers = [
      this.encryptionWorker,
      this.decryptionWorker,
      this.safariEncryptionWorker,
      this.safariDecryptionWorker,
    ];

    workers.forEach((worker) => {
      if (worker) {
        worker.postMessage({ type: 'disableEncryption' });
      }
    });
  }

  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

  /**
   * Encoded Streams für Sender vorbereiten
   */
  prepareEncodedStreamsForSender(sender: RTCRtpSender, kind: 'video' | 'audio'): boolean {
    if (this.e2eeMethod !== 'encodedStreams') {
      return false;
    }

    const trackId = sender.track?.id ?? `sender-${kind}-${Date.now()}`;

    if (this.senderEncodedStreams.has(trackId)) {
      console.debug(`🔒 E2EE: Encoded streams already prepared for ${kind} sender`);
      return true;
    }

    try {
      // WICHTIG: Type Assertion für Chrome API
      const senderWithStreams = sender as RTCRtpSender & {
        createEncodedStreams?: () => { readable: ReadableStream; writable: WritableStream };
      };
      if (typeof senderWithStreams.createEncodedStreams !== 'function') {
        console.error(`❌ E2EE: createEncodedStreams not available on sender`);
        return false;
      }

      const encodedStreams = senderWithStreams.createEncodedStreams();
      this.senderEncodedStreams.set(trackId, encodedStreams);
      console.debug(`✅ E2EE: Prepared encoded streams for ${kind} sender (${trackId})`);
      return true;
    } catch (error) {
      console.error(`❌ E2EE: Failed to prepare encoded streams for ${kind} sender:`, error);
      return false;
    }
  }

  /**
   * Encoded Streams für Receiver vorbereiten
   */
  prepareEncodedStreamsForReceiver(receiver: RTCRtpReceiver, kind: 'video' | 'audio'): boolean {
    if (this.e2eeMethod !== 'encodedStreams') {
      return false;
    }

    // WICHTIG: Gleicher Fallback wie in applyDecryptionChrome für Cache-Konsistenz!
    const trackId = receiver.track.id || `receiver-${kind}`;

    if (this.receiverEncodedStreams.has(trackId)) {
      console.debug(`🔒 E2EE: Encoded streams already prepared for ${kind} receiver (${trackId})`);
      return true;
    }

    try {
      const receiverWithStreams = receiver as RTCRtpReceiver & {
        createEncodedStreams?: () => { readable: ReadableStream; writable: WritableStream };
      };
      if (typeof receiverWithStreams.createEncodedStreams !== 'function') {
        console.error(`❌ E2EE: createEncodedStreams not available on receiver`);
        return false;
      }

      const encodedStreams = receiverWithStreams.createEncodedStreams();
      this.receiverEncodedStreams.set(trackId, encodedStreams);
      console.debug(`✅ E2EE: Prepared encoded streams for ${kind} receiver (${trackId})`);
      return true;
    } catch (error) {
      // Wenn Streams bereits von applyDecryptionChrome erstellt wurden, ist das OK
      // Diese Race Condition kann auftreten wenn ontrack nach applyTransformPipelines feuert
      if (error instanceof Error && error.message.includes('already created')) {
        console.debug(
          `✅ E2EE: Encoded streams already exist for ${kind} receiver (${trackId}) - created by applyDecryption`
        );
        return true;
      }
      console.error(`❌ E2EE: Failed to prepare encoded streams for ${kind} receiver:`, error);
      return false;
    }
  }

  async initializeWorkers(): Promise<void> {
    // Prevent double initialization
    if (this.workersInitialized) {
      console.debug('🔧 E2EE: Workers already initialized, skipping');
      return;
    }

    // If initialization is in progress, wait for it
    if (this.workerInitPromise) {
      console.debug('🔧 E2EE: Worker initialization in progress, waiting...');
      return this.workerInitPromise;
    }

    console.debug('🔧 E2EE: Initializing workers for', this.e2eeMethod);

    // Track the initialization promise
    this.workerInitPromise = (async () => {
      switch (this.e2eeMethod) {
        case 'scriptTransform':
          await this.initializeSafariWorkers();
          break;

        case 'encodedStreams':
        case 'rtpTransform':
          await this.initializeStandardWorkers();
          break;

        case 'none':
        default:
          console.warn('⚠️ E2EE: No supported method, running without encryption');
          break;
      }

      this.workersInitialized = true;
      this.cleanupInterval = setInterval(() => {
        this.cleanupTimedOutOperations();
      }, 1000);
      console.debug('✅ E2EE: Workers initialized');
    })();

    await this.workerInitPromise;
    this.workerInitPromise = null;
  }

  private async initializeSafariWorkers(): Promise<void> {
    this.safariEncryptionWorker = new Worker(
      new URL('../../../workers/safariE2EEWorker.ts', import.meta.url),
      { type: 'module', name: 'safari-e2ee-encryption' }
    );

    this.safariDecryptionWorker = new Worker(
      new URL('../../../workers/safariE2EEWorker.ts', import.meta.url),
      { type: 'module', name: 'safari-e2ee-decryption' }
    );

    this.setupWorkerMessageHandler(this.safariEncryptionWorker, 'encryption');
    this.setupWorkerMessageHandler(this.safariDecryptionWorker, 'decryption');

    await Promise.all([
      this.waitForWorkerReady(this.safariEncryptionWorker, 'Safari Encryption'),
      this.waitForWorkerReady(this.safariDecryptionWorker, 'Safari Decryption'),
    ]);

    const keyMaterial = this.e2eeManager.getCurrentKeyMaterial();
    if (keyMaterial) {
      await this.updateWorkerKeys(keyMaterial);
    }
  }

  private async initializeStandardWorkers(): Promise<void> {
    this.encryptionWorker = new Worker(
      new URL('../../../workers/e2eeTransformWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.decryptionWorker = new Worker(
      new URL('../../../workers/e2eeTransformWorker.ts', import.meta.url),
      { type: 'module' }
    );

    this.setupWorkerMessageHandler(this.encryptionWorker, 'encryption');
    this.setupWorkerMessageHandler(this.decryptionWorker, 'decryption');

    await Promise.all([
      this.waitForWorkerReady(this.encryptionWorker, 'Encryption'),
      this.waitForWorkerReady(this.decryptionWorker, 'Decryption'),
    ]);

    const keyMaterial = this.e2eeManager.getCurrentKeyMaterial();
    if (keyMaterial) {
      await this.updateWorkerKeys(keyMaterial);
    }
  }

  private handleWorkerStats(
    statsPayload: WorkerStatsPayload,
    type: 'encryption' | 'decryption'
  ): void {
    this.stats.totalFrames = Math.max(this.stats.totalFrames, statsPayload.totalFrames ?? 0);
    if (type === 'encryption') {
      this.stats.encryptedFrames = statsPayload.encryptedFrames ?? 0;
      this.stats.encryptionErrors = statsPayload.encryptionErrors ?? 0;
      this.stats.averageEncryptionTime = statsPayload.averageEncryptionTime ?? 0;
    } else {
      this.stats.decryptedFrames = statsPayload.decryptedFrames ?? 0;
      this.stats.decryptionErrors = statsPayload.decryptionErrors ?? 0;
      this.stats.averageDecryptionTime = statsPayload.averageDecryptionTime ?? 0;
    }
  }

  private handleWorkerSuccess(
    msgType: string,
    successPayload: WorkerSuccessPayload | undefined,
    pending: PendingOperation
  ): void {
    if (msgType === 'encryptSuccess') {
      this.updateEncryptionStats(successPayload?.encryptionTime ?? 0);
    } else {
      this.updateDecryptionStats(successPayload?.decryptionTime ?? 0);
    }
    const resultData = successPayload?.encryptedData ?? successPayload?.decryptedData;
    if (resultData) {
      pending.resolve(resultData);
    } else {
      pending.reject(new Error('No data in response'));
    }
  }

  private setupWorkerMessageHandler(worker: Worker, type: 'encryption' | 'decryption'): void {
    const pendingMap = type === 'encryption' ? this.pendingEncryptions : this.pendingDecryptions;

    worker.addEventListener('message', (event: MessageEvent<WorkerMessage>): void => {
      const { type: msgType, payload, operationId } = event.data;

      if (msgType === 'ready' || msgType === 'initSuccess' || msgType === 'cleanupSuccess') {
        return;
      }

      // Safari Worker sends periodic stats
      if (msgType === 'stats' && payload !== undefined) {
        this.handleWorkerStats(payload as WorkerStatsPayload, type);
        return;
      }

      if (operationId !== undefined && pendingMap.has(operationId)) {
        const pending = pendingMap.get(operationId);
        if (!pending) return;
        pendingMap.delete(operationId);
        const successPayload = payload as WorkerSuccessPayload | undefined;

        if (msgType === 'encryptSuccess' || msgType === 'decryptSuccess') {
          this.handleWorkerSuccess(msgType, successPayload, pending);
        } else if (msgType === 'error') {
          pending.reject(new Error(successPayload?.error ?? 'Unknown error'));
        }
      }
    });

    worker.addEventListener('error', (error) => {
      console.error(`❌ E2EE: ${type} worker error:`, error);
      for (const [id, pending] of pendingMap) {
        pending.reject(new Error(`Worker error: ${error.message}`));
        pendingMap.delete(id);
      }
    });
  }

  private waitForWorkerReady(worker: Worker, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${name} worker initialization timeout`));
      }, 10000);

      const handler = (event: MessageEvent<WorkerMessage>): void => {
        if (event.data.type === 'ready') {
          clearTimeout(timeout);
          worker.removeEventListener('message', handler);
          console.debug(`✅ E2EE: ${name} worker ready`);
          resolve();
        }
      };

      worker.addEventListener('message', handler);
    });
  }

  applyEncryptionToSender(sender: RTCRtpSender, kind: 'video' | 'audio'): void {
    const trackId = sender.track?.id ?? `sender-${kind}-${Date.now()}`;

    // Check if already applied
    if (this.appliedSenderTransforms.has(trackId)) {
      console.debug(`🔒 E2EE: Encryption transform already applied to ${kind} sender, skipping`);
      return;
    }

    console.debug(`🔒 E2EE: Applying encryption to ${kind} sender (${trackId})`);

    switch (this.e2eeMethod) {
      case 'scriptTransform':
        this.applyEncryptionSafari(sender, kind);
        break;

      case 'encodedStreams':
        this.applyEncryptionChrome(sender, kind);
        break;

      case 'rtpTransform':
        this.applyEncryptionFirefox(sender, kind);
        break;

      case 'none':
      default:
        console.warn('⚠️ E2EE method none - running without encryption');
        return; // Don't track if not applied
    }

    this.appliedSenderTransforms.add(trackId);
  }

  applyDecryptionToReceiver(receiver: RTCRtpReceiver, kind: 'video' | 'audio'): void {
    const trackId = receiver.track.id || `receiver-${kind}-${Date.now()}`;

    // Check if already applied
    if (this.appliedReceiverTransforms.has(trackId)) {
      console.debug(`🔓 E2EE: Decryption transform already applied to ${kind} receiver, skipping`);
      return;
    }

    console.debug(`🔓 E2EE: Applying decryption to ${kind} receiver (${trackId})`);

    switch (this.e2eeMethod) {
      case 'scriptTransform':
        this.applyDecryptionSafari(receiver, kind);
        break;

      case 'encodedStreams':
        this.applyDecryptionChrome(receiver, kind);
        break;

      case 'rtpTransform':
        this.applyDecryptionFirefox(receiver, kind);
        break;

      case 'none':
      default:
        console.warn('⚠️ E2EE method none - running without decryption');
        return; // Don't track if not applied
    }

    this.appliedReceiverTransforms.add(trackId);
  }

  private applyEncryptionSafari(sender: RTCRtpSender, kind: string): void {
    if (!this.safariEncryptionWorker) {
      throw new Error('Safari encryption worker not initialized');
    }

    const transform = new RTCRtpScriptTransform(this.safariEncryptionWorker, {
      operation: 'encrypt',
      kind,
    });

    (sender as RTCRtpSender & { transform?: RTCRtpScriptTransform }).transform = transform;
    console.debug(`✅ Safari E2EE: Encryption applied to ${kind} sender`);
  }

  private applyDecryptionSafari(receiver: RTCRtpReceiver, kind: string): void {
    if (!this.safariDecryptionWorker) {
      throw new Error('Safari decryption worker not initialized');
    }

    const transform = new RTCRtpScriptTransform(this.safariDecryptionWorker, {
      operation: 'decrypt',
      kind,
    });

    (receiver as RTCRtpReceiver & { transform?: RTCRtpScriptTransform }).transform = transform;
    console.debug(`✅ Safari E2EE: Decryption applied to ${kind} receiver`);
  }

  private applyEncryptionChrome(sender: RTCRtpSender, kind: string): void {
    if (!this.encryptionWorker) throw new Error('Encryption worker not initialized');

    const trackId = sender.track?.id ?? `sender-${kind}`;

    // Versuche gecachte Streams zu nutzen
    const cachedStreams = this.senderEncodedStreams.get(trackId);
    let streams: { readable: ReadableStream; writable: WritableStream };

    if (cachedStreams) {
      streams = cachedStreams;
    } else {
      console.warn(`⚠️ E2EE: No prepared streams for ${kind} sender, trying to create now...`);
      const senderWithStreams = sender as RTCRtpSender & {
        createEncodedStreams?: () => { readable: ReadableStream; writable: WritableStream };
      };
      const newStreams = senderWithStreams.createEncodedStreams?.();
      if (!newStreams) {
        console.error(`❌ E2EE: Failed to create encoded streams for ${kind} sender`);
        return;
      }
      streams = newStreams;
      this.senderEncodedStreams.set(trackId, newStreams);
    }

    const transformStream = new TransformStream<RTCEncodedFrame, RTCEncodedFrame>({
      transform: async (
        encodedFrame: RTCEncodedFrame,
        controller: TransformStreamDefaultController<RTCEncodedFrame>
      ) => {
        try {
          this.stats.totalFrames++;

          // Passthrough wenn Encryption nicht aktiviert
          if (!this.encryptionEnabled) {
            controller.enqueue(encodedFrame);
            return;
          }

          const frameDataCopy = this.copyArrayBuffer(encodedFrame.data);
          const encryptedData = await this.encryptFrameViaWorker(frameDataCopy);

          // Stelle sicher dass Daten korrekt kopiert werden
          const encryptedArray = new Uint8Array(encryptedData);
          // eslint-disable-next-line require-atomic-updates
          encodedFrame.data = encryptedArray.buffer;

          this.stats.encryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Encryption error (${kind}):`, error);
          this.stats.encryptionErrors++;
          // Bei Fehler trotzdem durchleiten für bessere UX
          controller.enqueue(encodedFrame);
        }
      },
    });

    (streams.readable as ReadableStream<RTCEncodedFrame>)
      .pipeThrough(transformStream)
      .pipeTo(streams.writable as WritableStream<RTCEncodedFrame>)
      .catch((error: unknown) => {
        console.error('[E2EE] Encryption pipeline error:', error);
      });

    this.senderEncodedStreams.delete(trackId);
  }

  private applyDecryptionChrome(receiver: RTCRtpReceiver, kind: string): void {
    if (!this.decryptionWorker) throw new Error('Decryption worker not initialized');

    const trackId = receiver.track.id || `receiver-${kind}`;

    const cachedStreams = this.receiverEncodedStreams.get(trackId);
    let streams: { readable: ReadableStream; writable: WritableStream };

    if (cachedStreams) {
      streams = cachedStreams;
    } else {
      console.warn(`⚠️ E2EE: No prepared streams for ${kind} receiver, trying to create now...`);
      const receiverWithStreams = receiver as RTCRtpReceiver & {
        createEncodedStreams?: () => { readable: ReadableStream; writable: WritableStream };
      };
      const newStreams = receiverWithStreams.createEncodedStreams?.();
      if (!newStreams) {
        console.error(`❌ E2EE: Failed to create encoded streams for ${kind} receiver`);
        return;
      }
      streams = newStreams;
      this.receiverEncodedStreams.set(trackId, newStreams);
    }

    // KRITISCH: hasKey wird außerhalb des Transforms geprüft um schnellen Zugriff zu ermöglichen
    // Die Decryption sollte IMMER versucht werden wenn ein Key vorhanden ist,
    // unabhängig von encryptionEnabled - denn der andere Peer könnte bereits verschlüsselt senden!
    const transformStream = new TransformStream<RTCEncodedFrame, RTCEncodedFrame>({
      transform: async (
        encodedFrame: RTCEncodedFrame,
        controller: TransformStreamDefaultController<RTCEncodedFrame>
      ) => {
        try {
          this.stats.totalFrames++;

          // GEÄNDERT: Decryption nur überspringen wenn KEIN Worker und KEIN Key
          // Wenn ein Key vorhanden ist, IMMER versuchen zu decrypten,
          // denn der andere Peer könnte bereits encrypted senden!
          const hasKey = this.e2eeManager.getCurrentKeyMaterial() !== null;

          if (!hasKey) {
            // Kein Key → Passthrough (Peer hat noch nicht Key Exchange abgeschlossen)
            controller.enqueue(encodedFrame);
            return;
          }

          const encryptedDataCopy = this.copyArrayBuffer(encodedFrame.data);
          const decryptedData = await this.decryptFrameViaWorker(encryptedDataCopy);

          // Stelle sicher dass Daten korrekt kopiert werden
          const decryptedArray = new Uint8Array(decryptedData);
          // eslint-disable-next-line require-atomic-updates
          encodedFrame.data = decryptedArray.buffer;

          this.stats.decryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Decryption error (${kind}):`, error);
          this.stats.decryptionErrors++;
          // Bei Fehler trotzdem durchleiten (könnte unverschlüsselter Frame sein)
          controller.enqueue(encodedFrame);
        }
      },
    });

    (streams.readable as ReadableStream<RTCEncodedFrame>)
      .pipeThrough(transformStream)
      .pipeTo(streams.writable as WritableStream<RTCEncodedFrame>)
      .catch((error: unknown) => {
        console.error('[E2EE] Decryption pipeline error:', error);
      });

    this.receiverEncodedStreams.delete(trackId);
  }

  private applyEncryptionFirefox(sender: RTCRtpSender, kind: string): void {
    if (!this.encryptionWorker) throw new Error('Encryption worker not initialized');

    const transformStream = new TransformStream<RTCEncodedFrame, RTCEncodedFrame>({
      transform: async (
        encodedFrame: RTCEncodedFrame,
        controller: TransformStreamDefaultController<RTCEncodedFrame>
      ) => {
        try {
          this.stats.totalFrames++;

          // Passthrough wenn Encryption nicht aktiviert
          if (!this.encryptionEnabled) {
            controller.enqueue(encodedFrame);
            return;
          }

          const frameDataCopy = this.copyArrayBuffer(encodedFrame.data);
          const encryptedData = await this.encryptFrameViaWorker(frameDataCopy);

          const encryptedArray = new Uint8Array(encryptedData);
          // eslint-disable-next-line require-atomic-updates
          encodedFrame.data = encryptedArray.buffer;

          this.stats.encryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Encryption error (${kind}):`, error);
          this.stats.encryptionErrors++;
          this.stats.droppedFrames++;
        }
      },
    });

    (
      sender as RTCRtpSender & { transform?: TransformStream<RTCEncodedFrame, RTCEncodedFrame> }
    ).transform = transformStream;
  }

  private applyDecryptionFirefox(receiver: RTCRtpReceiver, kind: string): void {
    if (!this.decryptionWorker) throw new Error('Decryption worker not initialized');

    // KRITISCH: Decryption sollte IMMER versucht werden wenn ein Key vorhanden ist,
    // unabhängig von encryptionEnabled - denn der andere Peer könnte bereits verschlüsselt senden!
    const transformStream = new TransformStream<RTCEncodedFrame, RTCEncodedFrame>({
      transform: async (
        encodedFrame: RTCEncodedFrame,
        controller: TransformStreamDefaultController<RTCEncodedFrame>
      ) => {
        try {
          this.stats.totalFrames++;

          // GEÄNDERT: Nur auf Key-Verfügbarkeit prüfen, nicht auf encryptionEnabled
          const hasKey = this.e2eeManager.getCurrentKeyMaterial() !== null;

          if (!hasKey) {
            // Kein Key → Passthrough
            controller.enqueue(encodedFrame);
            return;
          }

          const encryptedDataCopy = this.copyArrayBuffer(encodedFrame.data);
          const decryptedData = await this.decryptFrameViaWorker(encryptedDataCopy);

          const decryptedArray = new Uint8Array(decryptedData);
          // eslint-disable-next-line require-atomic-updates
          encodedFrame.data = decryptedArray.buffer;

          this.stats.decryptedFrames++;
          controller.enqueue(encodedFrame);
        } catch (error) {
          console.error(`[E2EE] Decryption error (${kind}):`, error);
          this.stats.decryptionErrors++;
          // Bei Fehler durchleiten statt droppen (könnte unverschlüsselter Frame sein)
          controller.enqueue(encodedFrame);
        }
      },
    });

    (
      receiver as RTCRtpReceiver & { transform?: TransformStream<RTCEncodedFrame, RTCEncodedFrame> }
    ).transform = transformStream;
  }

  async updateWorkerKeys(keyMaterial: E2EEKeyMaterial): Promise<void> {
    console.debug(`🔄 E2EE: Updating worker keys (generation ${keyMaterial.generation})`);

    try {
      const exportedKey = await crypto.subtle.exportKey('jwk', keyMaterial.encryptionKey);
      const updatePayload = {
        encryptionKey: exportedKey,
        generation: keyMaterial.generation,
      };

      const workers = [
        this.encryptionWorker,
        this.decryptionWorker,
        this.safariEncryptionWorker,
        this.safariDecryptionWorker,
      ];

      // KRITISCH: Warte auf Worker-Bestätigung, nicht nur auf postMessage!
      // Ohne dies kann onrtctransform laufen BEVOR der Key gesetzt ist.
      const updatePromises = workers
        .filter((worker): worker is Worker => worker !== null)
        .map(
          (worker) =>
            new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Worker key update timeout'));
              }, 5000);

              const handler = (event: MessageEvent<WorkerMessage>): void => {
                if (event.data.type === 'keyUpdated') {
                  clearTimeout(timeout);
                  worker.removeEventListener('message', handler);
                  console.debug(
                    `✅ E2EE: Worker confirmed key update (gen ${keyMaterial.generation})`
                  );
                  resolve();
                }
              };

              worker.addEventListener('message', handler);
              worker.postMessage({ type: 'updateKey', payload: updatePayload });
            })
        );

      await Promise.all(updatePromises);
      console.debug('✅ E2EE: All worker keys confirmed');
    } catch (error) {
      console.error('❌ E2EE: Failed to update worker keys:', error);
    }
  }

  private encryptFrameViaWorker(frameData: ArrayBuffer): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const worker =
        this.e2eeMethod === 'scriptTransform' ? this.safariEncryptionWorker : this.encryptionWorker;

      if (!worker) {
        reject(new Error('Encryption worker not available'));
        return;
      }

      const operationId = this.operationCounter++;
      this.pendingEncryptions.set(operationId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      worker.postMessage(
        {
          type: 'encrypt',
          operationId,
          payload: { frameData },
        },
        [frameData]
      );
    });
  }

  private decryptFrameViaWorker(encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const worker =
        this.e2eeMethod === 'scriptTransform' ? this.safariDecryptionWorker : this.decryptionWorker;

      if (!worker) {
        reject(new Error('Decryption worker not available'));
        return;
      }

      const operationId = this.operationCounter++;
      this.pendingDecryptions.set(operationId, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      worker.postMessage(
        {
          type: 'decrypt',
          operationId,
          payload: { frameData: encryptedData },
        },
        [encryptedData]
      );
    });
  }

  private copyArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
    const copy = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(copy).set(new Uint8Array(buffer));
    return copy;
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
  }

  private updateEncryptionStats(encryptionTime: number): void {
    const n = this.stats.encryptedFrames;
    this.stats.averageEncryptionTime =
      (this.stats.averageEncryptionTime * n + encryptionTime) / (n + 1);
  }

  private updateDecryptionStats(decryptionTime: number): void {
    const n = this.stats.decryptedFrames;
    this.stats.averageDecryptionTime =
      (this.stats.averageDecryptionTime * n + decryptionTime) / (n + 1);
  }

  getStats(): FrameStats {
    return { ...this.stats };
  }

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

  cleanup(): void {
    console.debug('🧹 E2EE: Cleaning up Insertable Streams handler');

    // Disable encryption first
    this.disableEncryption();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const [, pending] of this.pendingEncryptions) {
      pending.reject(new Error('Handler cleanup'));
    }
    this.pendingEncryptions.clear();

    for (const [, pending] of this.pendingDecryptions) {
      pending.reject(new Error('Handler cleanup'));
    }
    this.pendingDecryptions.clear();

    this.senderEncodedStreams.clear();
    this.receiverEncodedStreams.clear();
    this.appliedSenderTransforms.clear();
    this.appliedReceiverTransforms.clear();
    this.workersInitialized = false;
    this.workerInitPromise = null;

    const terminateWorker = (worker: Worker | null): void => {
      if (worker) {
        try {
          worker.postMessage({ type: 'cleanup' });
          setTimeout(() => {
            try {
              worker.terminate();
            } catch (e) {
              console.warn('Failed to terminate worker:', e);
            }
          }, 100);
        } catch (e) {
          console.warn('Failed to send cleanup to worker:', e);
        }
      }
    };

    terminateWorker(this.encryptionWorker);
    terminateWorker(this.decryptionWorker);
    terminateWorker(this.safariEncryptionWorker);
    terminateWorker(this.safariDecryptionWorker);

    this.encryptionWorker = null;
    this.decryptionWorker = null;
    this.safariEncryptionWorker = null;
    this.safariDecryptionWorker = null;

    this.resetStats();
    console.debug('✅ E2EE: Insertable Streams handler cleanup complete');
  }
}

export type { FrameStats };
