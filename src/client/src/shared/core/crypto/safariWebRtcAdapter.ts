/**
 * Safari WebRTC Adapter
 *
 * Handles Safari-specific WebRTC E2EE integration:
 * - RTCRtpScriptTransform for Safari
 * - Encoded Streams (createEncodedStreams) for Chrome
 * - Automatic selection based on browser capabilities
 * - Correct track cleanup order (Safari: removeTrack before stop)
 *
 * Usage:
 * ```typescript
 * const adapter = new SafariWebRTCAdapter(peerConnection);
 * await adapter.setupE2EE(encryptionKey);
 * // ... when done
 * await adapter.cleanup();
 * ```
 */

import { getBrowserQuirks, getE2EECapabilities } from '../../detection';
import type { E2EEMethod } from '../../detection/types';

// ============================================================================
// Constants
// ============================================================================

/** Message type for key updates */
const MSG_KEY_UPDATE = 'key-update' as const;

// ============================================================================
// Types
// ============================================================================

/** E2EE Transform Setup Result */
interface E2EESetupResult {
  readonly success: boolean;
  readonly method: E2EEMethod;
  readonly error?: string;
}

/** Transform Options */
interface TransformOptions {
  readonly encryptionKey: CryptoKey;
  readonly keyGeneration: number;
  readonly direction: 'send' | 'receive';
}

// ============================================================================
// Safari WebRTC Adapter Class
// ============================================================================

/**
 * Safari WebRTC Adapter
 *
 * Provides a unified interface for setting up E2EE on WebRTC connections
 * across different browsers (Safari, Chrome, Firefox)
 */
export class SafariWebRTCAdapter {
  private readonly peerConnection: RTCPeerConnection;
  private readonly e2eeMethod: E2EEMethod;
  private readonly quirks: ReturnType<typeof getBrowserQuirks>;
  private worker: Worker | null = null;
  private isCleanedUp = false;

  // Track transforms for cleanup
  private readonly senderTransforms = new Map<RTCRtpSender, unknown>();
  private readonly receiverTransforms = new Map<RTCRtpReceiver, unknown>();

  constructor(peerConnection: RTCPeerConnection) {
    this.peerConnection = peerConnection;
    this.e2eeMethod = getE2EECapabilities().method;
    this.quirks = getBrowserQuirks();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Setup E2EE transforms for all senders
   */
  async setupSenderE2EE(options: TransformOptions): Promise<E2EESetupResult> {
    if (this.isCleanedUp) {
      return { success: false, method: this.e2eeMethod, error: 'Adapter already cleaned up' };
    }

    try {
      const senders = this.peerConnection.getSenders();

      for (const sender of senders) {
        if (sender.track) {
          // eslint-disable-next-line no-await-in-loop -- Sequential setup is intentional
          await this.setupSenderTransform(sender, options);
        }
      }

      return { success: true, method: this.e2eeMethod };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SafariWebRTCAdapter] Failed to setup sender E2EE:', error);
      return { success: false, method: this.e2eeMethod, error: message };
    }
  }

  /**
   * Setup E2EE transforms for all receivers
   */
  async setupReceiverE2EE(options: TransformOptions): Promise<E2EESetupResult> {
    if (this.isCleanedUp) {
      return { success: false, method: this.e2eeMethod, error: 'Adapter already cleaned up' };
    }

    try {
      const receivers = this.peerConnection.getReceivers();

      for (const receiver of receivers) {
        // eslint-disable-next-line no-await-in-loop -- Sequential setup is intentional
        await this.setupReceiverTransform(receiver, options);
      }

      return { success: true, method: this.e2eeMethod };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SafariWebRTCAdapter] Failed to setup receiver E2EE:', error);
      return { success: false, method: this.e2eeMethod, error: message };
    }
  }

  /**
   * Update encryption key for all transforms
   */
  async updateKey(newKey: CryptoKey, newGeneration: number): Promise<void> {
    if (this.isCleanedUp) return;

    // Send key update to worker
    if (this.worker) {
      const keyData = await crypto.subtle.exportKey('raw', newKey);
      this.worker.postMessage(
        {
          type: MSG_KEY_UPDATE,
          keyData,
          generation: newGeneration,
        },
        [keyData]
      );
    }
  }

  /**
   * Cleanup all transforms and tracks
   * Uses correct order for Safari (removeTrack before stop)
   */
  cleanup(): void {
    if (this.isCleanedUp) return;
    this.isCleanedUp = true;

    console.debug('[SafariWebRTCAdapter] Starting cleanup...');

    // Get all senders
    const senders = this.peerConnection.getSenders();

    for (const sender of senders) {
      if (sender.track) {
        try {
          if (this.quirks.requiresRemoveTrackBeforeStop) {
            // Safari: removeTrack FIRST, then stop
            this.peerConnection.removeTrack(sender);
            sender.track.stop();
            sender.track.enabled = false;
          } else {
            // Chrome/Firefox: stop first, then removeTrack
            sender.track.stop();
            sender.track.enabled = false;
            this.peerConnection.removeTrack(sender);
          }
        } catch (error) {
          console.warn('[SafariWebRTCAdapter] Error cleaning up sender track:', error);
        }
      }
    }

    // Clear transforms
    this.senderTransforms.clear();
    this.receiverTransforms.clear();

    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    console.debug('[SafariWebRTCAdapter] Cleanup complete');
  }

  /**
   * Set the E2EE worker
   */
  setWorker(worker: Worker): void {
    this.worker = worker;
  }

  /**
   * Get the E2EE method being used
   */
  getMethod(): E2EEMethod {
    return this.e2eeMethod;
  }

  /**
   * Check if E2EE is supported
   */
  isSupported(): boolean {
    return this.e2eeMethod !== 'none';
  }

  // ==========================================================================
  // Private Methods - Transform Setup
  // ==========================================================================

  private async setupSenderTransform(
    sender: RTCRtpSender,
    options: TransformOptions
  ): Promise<void> {
    // eslint-disable-next-line default-case -- All E2EEMethod values are handled
    switch (this.e2eeMethod) {
      case 'scriptTransform':
        await this.setupScriptTransform(sender, options, 'sender');
        break;
      case 'encodedStreams':
        await this.setupEncodedStreams(sender, options, 'sender');
        break;
      case 'rtpTransform':
        await this.setupRtpTransform(sender, options, 'sender');
        break;
      case 'none':
        console.warn('[SafariWebRTCAdapter] No E2EE method available');
        break;
    }
  }

  private async setupReceiverTransform(
    receiver: RTCRtpReceiver,
    options: TransformOptions
  ): Promise<void> {
    // eslint-disable-next-line default-case -- All E2EEMethod values are handled
    switch (this.e2eeMethod) {
      case 'scriptTransform':
        await this.setupScriptTransform(receiver, options, 'receiver');
        break;
      case 'encodedStreams':
        await this.setupEncodedStreams(receiver, options, 'receiver');
        break;
      case 'rtpTransform':
        await this.setupRtpTransform(receiver, options, 'receiver');
        break;
      case 'none':
        console.warn('[SafariWebRTCAdapter] No E2EE method available');
        break;
    }
  }

  // ==========================================================================
  // Safari: RTCRtpScriptTransform
  // ==========================================================================

  private async setupScriptTransform(
    senderOrReceiver: RTCRtpSender | RTCRtpReceiver,
    options: TransformOptions,
    type: 'sender' | 'receiver'
  ): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not set. Call setWorker() first.');
    }

    // Safari requires the key to be set before creating the transform
    if (this.quirks.requiresKeyBeforeTransform) {
      const keyData = await crypto.subtle.exportKey('raw', options.encryptionKey);
      this.worker.postMessage(
        {
          type: MSG_KEY_UPDATE,
          keyData,
          generation: options.keyGeneration,
        },
        [keyData]
      );
    }

    // Create RTCRtpScriptTransform with worker
    const transform = new RTCRtpScriptTransform(this.worker, {
      operation: type === 'sender' ? 'encrypt' : 'decrypt',
      generation: options.keyGeneration,
    });

    // Apply transform
    if (type === 'sender') {
      const sender = senderOrReceiver as RTCRtpSender;
      sender.transform = transform;
      this.senderTransforms.set(sender, transform);
    } else {
      const receiver = senderOrReceiver as RTCRtpReceiver;
      receiver.transform = transform;
      this.receiverTransforms.set(receiver, transform);
    }
  }

  // ==========================================================================
  // Chrome (legacy): createEncodedStreams
  // ==========================================================================

  private async setupEncodedStreams(
    senderOrReceiver: RTCRtpSender | RTCRtpReceiver,
    options: TransformOptions,
    type: 'sender' | 'receiver'
  ): Promise<void> {
    if (this.worker === null) {
      throw new Error('Worker not set. Call setWorker() first.');
    }

    // Type for Chrome's createEncodedStreams result
    interface EncodedStreamsResult {
      readable: ReadableStream<RTCEncodedVideoFrame | RTCEncodedAudioFrame>;
      writable: WritableStream<RTCEncodedVideoFrame | RTCEncodedAudioFrame>;
    }

    if (type === 'sender') {
      const sender = senderOrReceiver as RTCRtpSender;
      const senderWithStreams = sender as RTCRtpSender & {
        createEncodedStreams?: () => EncodedStreamsResult;
      };

      if (typeof senderWithStreams.createEncodedStreams !== 'function') {
        throw new TypeError('createEncodedStreams not supported');
      }

      const streams = senderWithStreams.createEncodedStreams();
      const { readable, writable } = streams;

      // Send streams to worker
      this.worker.postMessage(
        {
          type: 'sender-streams',
          readable,
          writable,
          trackId: sender.track?.id,
        },
        [readable as unknown as Transferable, writable as unknown as Transferable]
      );

      this.senderTransforms.set(sender, { readable, writable });
    } else {
      const receiver = senderOrReceiver as RTCRtpReceiver;
      const receiverWithStreams = receiver as RTCRtpReceiver & {
        createEncodedStreams?: () => EncodedStreamsResult;
      };

      if (typeof receiverWithStreams.createEncodedStreams !== 'function') {
        throw new TypeError('createEncodedStreams not supported');
      }

      const streams = receiverWithStreams.createEncodedStreams();
      const { readable, writable } = streams;

      // Send streams to worker
      this.worker.postMessage(
        {
          type: 'receiver-streams',
          readable,
          writable,
          trackId: receiver.track.id,
        },
        [readable as unknown as Transferable, writable as unknown as Transferable]
      );

      this.receiverTransforms.set(receiver, { readable, writable });
    }

    // Send key
    const keyData = await crypto.subtle.exportKey('raw', options.encryptionKey);
    this.worker.postMessage(
      {
        type: MSG_KEY_UPDATE,
        keyData,
        generation: options.keyGeneration,
      },
      [keyData]
    );
  }

  // ==========================================================================
  // Modern: RTCRtpSender.transform (Chrome 118+, Firefox 117+)
  // ==========================================================================

  private async setupRtpTransform(
    senderOrReceiver: RTCRtpSender | RTCRtpReceiver,
    options: TransformOptions,
    type: 'sender' | 'receiver'
  ): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not set. Call setWorker() first.');
    }

    // Create TransformStream for the worker
    const { readable, writable } = new TransformStream();

    if (type === 'sender') {
      const sender = senderOrReceiver as RTCRtpSender;
      if (!('transform' in sender)) {
        throw new Error('RTCRtpSender.transform not supported');
      }

      sender.transform = new RTCRtpScriptTransform(this.worker, {
        operation: 'encrypt',
        readable,
        writable,
      });

      this.senderTransforms.set(sender, { readable, writable });
    } else {
      const receiver = senderOrReceiver as RTCRtpReceiver;
      if (!('transform' in receiver)) {
        throw new Error('RTCRtpReceiver.transform not supported');
      }

      receiver.transform = new RTCRtpScriptTransform(this.worker, {
        operation: 'decrypt',
        readable,
        writable,
      });

      this.receiverTransforms.set(receiver, { readable, writable });
    }

    // Send key
    const keyData = await crypto.subtle.exportKey('raw', options.encryptionKey);
    this.worker.postMessage(
      {
        type: MSG_KEY_UPDATE,
        keyData,
        generation: options.keyGeneration,
      },
      [keyData]
    );
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Safari WebRTC Adapter for the given peer connection
 */
export function createWebRTCAdapter(peerConnection: RTCPeerConnection): SafariWebRTCAdapter {
  return new SafariWebRTCAdapter(peerConnection);
}

/**
 * Check if E2EE is supported for WebRTC
 */
export function isWebRTCE2EESupported(): boolean {
  return getE2EECapabilities().method !== 'none';
}

/**
 * Get the E2EE method that will be used
 */
export function getWebRTCE2EEMethod(): E2EEMethod {
  return getE2EECapabilities().method;
}
