/**
 * StreamManager - Singleton Service für MediaStream-Lifecycle-Management
 *
 * Verantwortlich für:
 * - Erstellen und Verwalten von MediaStreams
 * - Track-Event-Handling
 * - Synchronisation mit Redux State
 * - Browser-spezifische Cleanup-Logik (Safari)
 */

import { getBrowserInfo } from '../utils/browserDetection';

// ============================================================================
// Types
// ============================================================================

export interface StreamMetadata {
  id: string;
  type: 'camera' | 'screen' | 'remote';
  createdAt: number;
  trackIds: string[];
  hasVideo: boolean;
  hasAudio: boolean;
  isActive: boolean;
}

export interface TrackEvent {
  streamId: string;
  trackId: string;
  trackKind: 'audio' | 'video';
  event: 'ended' | 'mute' | 'unmute' | 'added' | 'removed';
}

export type StreamEventType =
  | 'streamCreated'
  | 'streamDestroyed'
  | 'trackEnded'
  | 'trackMuted'
  | 'trackUnmuted'
  | 'trackAdded'
  | 'trackRemoved'
  | 'error';

export type StreamEventCallback = (event: {
  type: StreamEventType;
  streamId?: string;
  stream?: MediaStream;
  track?: MediaStreamTrack;
  error?: Error;
  metadata?: StreamMetadata;
}) => void;

// ============================================================================
// StreamManager Singleton
// ============================================================================

class StreamManager {
  private static instance: StreamManager | null = null;

  // Stream Storage
  private streams = new Map<string, MediaStream>();
  private metadata = new Map<string, StreamMetadata>();

  // Event Listeners
  private listeners = new Map<StreamEventType, Set<StreamEventCallback>>();

  // Track Cleanup Handlers (für Memory-Leak-Prevention)
  private trackHandlers = new Map<
    string,
    {
      ended: () => void;
      mute: () => void;
      unmute: () => void;
    }
  >();

  // Browser Detection (Safari needs special handling for camera release)
  private isSafari: boolean;

  private constructor() {
    const browserInfo = getBrowserInfo();
    this.isSafari = browserInfo.name === 'Safari';

    console.debug(`🎬 StreamManager initialized (${browserInfo.name} ${browserInfo.version})`);
  }

  // ========================================================================
  // Singleton Access
  // ========================================================================

  static getInstance(): StreamManager {
    StreamManager.instance ??= new StreamManager();
    return StreamManager.instance;
  }

  /**
   * Reset instance (für Tests oder vollständigen Cleanup)
   */
  static resetInstance(): void {
    if (StreamManager.instance) {
      StreamManager.instance.cleanup();
      StreamManager.instance = null;
    }
  }

  // ========================================================================
  // Stream Creation
  // ========================================================================

  /**
   * Erstellt einen neuen Camera/Microphone Stream
   */
  async createCameraStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
    console.debug('📹 StreamManager: Creating camera stream', constraints);

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const { id } = stream;

      this.registerStream(stream, 'camera');

      console.debug(`✅ StreamManager: Camera stream created (${id})`);
      return stream;
    } catch (error) {
      console.error('❌ StreamManager: Failed to create camera stream:', error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Erstellt einen Screen Share Stream
   */
  async createScreenStream(constraints?: DisplayMediaStreamOptions): Promise<MediaStream> {
    console.debug('🖥️ StreamManager: Creating screen stream');

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(
        constraints ?? { video: true, audio: false }
      );
      const { id } = stream;

      this.registerStream(stream, 'screen');

      // Screen Share hat oft ein onended Event wenn User auf "Stop Sharing" klickt
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          console.debug('🖥️ StreamManager: Screen share ended by user');
          this.destroyStream(id);
        });
      });

      console.debug(`✅ StreamManager: Screen stream created (${id})`);
      return stream;
    } catch (error) {
      console.error('❌ StreamManager: Failed to create screen stream:', error);
      this.emit('error', { error: error as Error });
      throw error;
    }
  }

  /**
   * Registriert einen Remote Stream (von WebRTC)
   */
  registerRemoteStream(stream: MediaStream, peerId?: string): void {
    const id = peerId ? `remote-${peerId}` : stream.id;
    console.debug(`📡 StreamManager: Registering remote stream (${id})`);

    // Falls der Stream schon eine ID hat, verwenden wir diese
    this.registerStream(stream, 'remote');
  }

  // ========================================================================
  // Stream Registration & Lifecycle
  // ========================================================================

  /**
   * Registriert einen Stream manuell (für Legacy-Kompatibilität)
   */
  registerStream(stream: MediaStream, type: 'camera' | 'screen' | 'remote'): void {
    const { id } = stream;

    console.debug(
      `📝 StreamManager.registerStream called: type=${type}, id=${id}, tracks=${String(stream.getTracks().length)}`
    );

    // Speichere Stream
    this.streams.set(id, stream);
    console.debug(
      `📝 StreamManager: Stream stored, total streams now: ${String(this.streams.size)}`
    );

    // Erstelle Metadata
    const meta: StreamMetadata = {
      id,
      type,
      createdAt: Date.now(),
      trackIds: stream.getTracks().map((t) => t.id),
      hasVideo: stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live'),
      hasAudio: stream.getAudioTracks().some((t) => t.enabled && t.readyState === 'live'),
      isActive: true,
    };
    this.metadata.set(id, meta);

    // Setup Track Listeners
    this.setupTrackListeners(stream);

    // Setup Stream Event Listeners
    stream.addEventListener('addtrack', (event) => {
      this.handleTrackAdded(id, event.track);
    });

    stream.addEventListener('removetrack', (event) => {
      this.handleTrackRemoved(id, event.track);
    });

    // Emit Event
    this.emit('streamCreated', { streamId: id, stream, metadata: meta });
  }

  private setupTrackListeners(stream: MediaStream): void {
    stream.getTracks().forEach((track) => {
      this.addTrackListeners(stream.id, track);
    });
  }

  private addTrackListeners(streamId: string, track: MediaStreamTrack): void {
    const trackId = track.id;

    // Cleanup alte Handler falls vorhanden
    this.removeTrackListeners(trackId);

    const handlers = {
      ended: () => {
        this.handleTrackEnded(streamId, track);
      },
      mute: () => {
        this.handleTrackMuted(streamId, track);
      },
      unmute: () => {
        this.handleTrackUnmuted(streamId, track);
      },
    };

    track.addEventListener('ended', handlers.ended);
    track.addEventListener('mute', handlers.mute);
    track.addEventListener('unmute', handlers.unmute);

    this.trackHandlers.set(trackId, handlers);
  }

  private removeTrackListeners(trackId: string): void {
    const handlers = this.trackHandlers.get(trackId);
    if (!handlers) return;

    // Wir haben keinen direkten Zugriff auf den Track hier,
    // aber das ist OK - wenn der Track destroyed wird, werden die Listener
    // automatisch entfernt. Wir räumen nur unsere Map auf.
    this.trackHandlers.delete(trackId);
  }

  // ========================================================================
  // Track Event Handlers
  // ========================================================================

  private handleTrackEnded(streamId: string, track: MediaStreamTrack): void {
    console.debug(`🔇 StreamManager: Track ended (${track.kind}) in stream ${streamId}`);

    this.updateMetadata(streamId);
    this.emit('trackEnded', { streamId, track });

    // Cleanup Track Handler
    this.removeTrackListeners(track.id);

    // Prüfe ob alle Tracks beendet sind
    const stream = this.streams.get(streamId);
    if (stream?.getTracks().every((t) => t.readyState === 'ended')) {
      console.debug(`🔚 StreamManager: All tracks ended, destroying stream ${streamId}`);
      this.destroyStream(streamId);
    }
  }

  private handleTrackMuted(streamId: string, track: MediaStreamTrack): void {
    console.debug(`🔇 StreamManager: Track muted (${track.kind}) in stream ${streamId}`);
    this.updateMetadata(streamId);
    this.emit('trackMuted', { streamId, track });
  }

  private handleTrackUnmuted(streamId: string, track: MediaStreamTrack): void {
    console.debug(`🔊 StreamManager: Track unmuted (${track.kind}) in stream ${streamId}`);
    this.updateMetadata(streamId);
    this.emit('trackUnmuted', { streamId, track });
  }

  private handleTrackAdded(streamId: string, track: MediaStreamTrack): void {
    console.debug(`➕ StreamManager: Track added (${track.kind}) to stream ${streamId}`);
    this.addTrackListeners(streamId, track);
    this.updateMetadata(streamId);
    this.emit('trackAdded', { streamId, track });
  }

  private handleTrackRemoved(streamId: string, track: MediaStreamTrack): void {
    console.debug(`➖ StreamManager: Track removed (${track.kind}) from stream ${streamId}`);
    this.removeTrackListeners(track.id);
    this.updateMetadata(streamId);
    this.emit('trackRemoved', { streamId, track });
  }

  private updateMetadata(streamId: string): void {
    const stream = this.streams.get(streamId);
    const meta = this.metadata.get(streamId);

    if (!stream || !meta) return;

    meta.trackIds = stream.getTracks().map((t) => t.id);
    meta.hasVideo = stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');
    meta.hasAudio = stream.getAudioTracks().some((t) => t.enabled && t.readyState === 'live');
    meta.isActive = stream.getTracks().some((t) => t.readyState === 'live');
  }

  // ========================================================================
  // Stream Destruction
  // ========================================================================

  /**
   * Zerstört einen Stream vollständig
   * - Stoppt alle Tracks
   * - Entfernt alle Event Listener
   * - Räumt Metadata auf
   * - Browser-spezifische Cleanup-Logik
   */
  destroyStream(streamId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      console.warn(`⚠️ StreamManager: Stream ${streamId} not found for destruction`);
      return;
    }

    console.debug(`🗑️ StreamManager: Destroying stream ${streamId}`);

    const tracks = stream.getTracks();

    // 1. Stoppe alle Tracks SYNCHRON
    tracks.forEach((track) => {
      try {
        if (track.readyState === 'live') {
          console.debug(`🛑 StreamManager: Stopping ${track.kind} track ${track.id}`);
          track.stop();
          track.enabled = false;
        }
      } catch (_e) {
        console.warn(`Failed to stop track ${track.id}:`, _e);
      }

      // Cleanup Handler
      this.removeTrackListeners(track.id);
    });

    // 2. Safari-spezifisch: Entferne Tracks aus Stream für Camera-Indikator
    if (this.isSafari) {
      tracks.forEach((track) => {
        try {
          stream.removeTrack(track);
        } catch (_e) {
          // Ignoriere - Track könnte bereits entfernt sein
        }
      });
    }

    // 3. Cleanup Maps
    this.streams.delete(streamId);
    this.metadata.delete(streamId);

    // 4. Emit Event
    this.emit('streamDestroyed', { streamId });

    console.debug(`✅ StreamManager: Stream ${streamId} destroyed`);
  }

  /**
   * Zerstört alle Streams
   */
  destroyAllStreams(): void {
    console.debug(`🗑️ StreamManager: Destroying all streams (${String(this.streams.size)})`);

    // Kopiere IDs um während Iteration nicht zu modifizieren
    const streamIds = Array.from(this.streams.keys());
    streamIds.forEach((id) => {
      this.destroyStream(id);
    });
  }

  // ========================================================================
  // Stream Access
  // ========================================================================

  getStream(streamId: string): MediaStream | undefined {
    return this.streams.get(streamId);
  }

  getMetadata(streamId: string): StreamMetadata | undefined {
    return this.metadata.get(streamId);
  }

  getAllStreams(): Map<string, MediaStream> {
    return new Map(this.streams);
  }

  getAllMetadata(): Map<string, StreamMetadata> {
    return new Map(this.metadata);
  }

  getCameraStream(): MediaStream | undefined {
    for (const [id, meta] of this.metadata) {
      if (meta.type === 'camera' && meta.isActive) {
        return this.streams.get(id);
      }
    }
    return undefined;
  }

  getScreenStream(): MediaStream | undefined {
    for (const [id, meta] of this.metadata) {
      if (meta.type === 'screen' && meta.isActive) {
        return this.streams.get(id);
      }
    }
    return undefined;
  }

  // ========================================================================
  // Track Operations
  // ========================================================================

  /**
   * Ersetzt einen Track in einem Stream
   * Nützlich für Device-Wechsel
   */
  async replaceTrack(
    streamId: string,
    oldTrackKind: 'audio' | 'video',
    newConstraints: MediaTrackConstraints
  ): Promise<MediaStreamTrack | null> {
    const stream = this.streams.get(streamId);
    if (!stream) return null;

    const oldTracks = oldTrackKind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();

    if (oldTracks.length === 0) return null;

    try {
      // Erstelle neuen Track
      const constraints: MediaStreamConstraints = {
        [oldTrackKind]: newConstraints,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack =
        oldTrackKind === 'audio' ? newStream.getAudioTracks()[0] : newStream.getVideoTracks()[0];

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (newTrack === undefined) {
        throw new Error(`No ${oldTrackKind} track in new stream`);
      }

      // Stoppe alten Track
      oldTracks.forEach((track) => {
        stream.removeTrack(track);
        track.stop();
        this.removeTrackListeners(track.id);
      });

      // Füge neuen Track hinzu
      stream.addTrack(newTrack);
      this.addTrackListeners(streamId, newTrack);
      this.updateMetadata(streamId);

      console.debug(`🔄 StreamManager: Replaced ${oldTrackKind} track in stream ${streamId}`);

      return newTrack;
    } catch (error) {
      console.error(`❌ StreamManager: Failed to replace ${oldTrackKind} track:`, error);
      throw error;
    }
  }

  /**
   * Toggle Track enabled State
   */
  toggleTrack(streamId: string, trackKind: 'audio' | 'video'): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    const tracks = trackKind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();

    if (tracks.length === 0) return false;

    const newEnabled = !tracks[0].enabled;
    tracks.forEach((track) => {
      track.enabled = newEnabled;
    });

    this.updateMetadata(streamId);

    // Emit appropriate event
    if (newEnabled) {
      tracks.forEach((track) => {
        this.emit('trackUnmuted', { streamId, track });
      });
    } else {
      tracks.forEach((track) => {
        this.emit('trackMuted', { streamId, track });
      });
    }

    return newEnabled;
  }

  // ========================================================================
  // Event System
  // ========================================================================

  on(event: StreamEventType, callback: StreamEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: StreamEventType, callback: StreamEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(
    type: StreamEventType,
    data: Omit<Parameters<StreamEventCallback>[0], 'type'>
  ): void {
    const callbacks = this.listeners.get(type);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
      try {
        callback({ type, ...data });
      } catch (error) {
        console.error(`StreamManager: Error in ${type} event handler:`, error);
      }
    });
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  /**
   * Vollständiger Cleanup
   */
  cleanup(): void {
    console.debug('🧹 StreamManager: Full cleanup');

    // Zerstöre alle Streams
    this.destroyAllStreams();

    // Entferne alle Event Listener
    this.listeners.clear();

    // Clear Track Handlers
    this.trackHandlers.clear();

    console.debug('✅ StreamManager: Cleanup complete');
  }

  // ========================================================================
  // Debug Helpers
  // ========================================================================

  getDebugInfo(): {
    streamCount: number;
    streams: (StreamMetadata & {
      trackDetails: { id: string; kind: string; enabled: boolean; readyState: string }[];
    })[];
  } {
    const streams = Array.from(this.metadata.values()).map((meta) => {
      const stream = this.streams.get(meta.id);
      return {
        ...meta,
        trackDetails:
          stream?.getTracks().map((t) => ({
            id: t.id,
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
          })) ?? [],
      };
    });

    return {
      streamCount: this.streams.size,
      streams,
    };
  }
}

// Export Singleton Access
export const getStreamManager = (): StreamManager => StreamManager.getInstance();
export const resetStreamManager = (): void => {
  StreamManager.resetInstance();
};

export default StreamManager;
