import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useAppDispatch } from '../store/store.hooks';
import { setLocalStreamId, setRemoteStreamId } from '../features/videocall/videoCallSlice';
import { getStreamManager, type StreamEventCallback } from '../services/StreamManager';
import type { StreamContextValue } from './streamContextTypes';

const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_STREAMS === 'true';

// ============================================================================
// Context
// ============================================================================

const StreamContext = createContext<StreamContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface StreamProviderProps {
  children: ReactNode;
}

export const StreamProvider: React.FC<StreamProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const streamManager = getStreamManager();

  // React State für UI-Updates (synced mit StreamManager)
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStreamState] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStreamState] = useState<MediaStream | null>(null);

  // Stream IDs für schnellen Zugriff
  const [localStreamId, setLocalStreamIdState] = useState<string | null>(null);
  const [remoteStreamId, setRemoteStreamIdState] = useState<string | null>(null);
  const [screenStreamId, setScreenStreamIdState] = useState<string | null>(null);

  // ========================================================================
  // StreamManager Event Handler
  // ========================================================================

  useEffect(() => {
    const handleStreamCreated: StreamEventCallback = (event) => {
      if (!event.stream || !event.metadata) return;

      if (DEBUG) {
        console.debug(
          `📹 StreamContext: Stream created (${event.metadata.type}): ${event.streamId ?? 'unknown'}`
        );
      }

      switch (event.metadata.type) {
        case 'camera':
          setLocalStreamState(event.stream);
          setLocalStreamIdState(event.streamId ?? null);
          dispatch(setLocalStreamId(event.streamId ?? null));
          break;

        case 'screen':
          setScreenStreamState(event.stream);
          setScreenStreamIdState(event.streamId ?? null);
          break;

        case 'remote':
          setRemoteStreamState(event.stream);
          setRemoteStreamIdState(event.streamId ?? null);
          dispatch(setRemoteStreamId(event.streamId ?? null));
          break;

        default:
          // This should never happen as type is 'camera' | 'screen' | 'remote'
          console.warn('Unknown stream type received');
          break;
      }
    };

    const handleStreamDestroyed: StreamEventCallback = (event) => {
      if (!event.streamId) return;

      if (DEBUG) {
        console.debug(`📹 StreamContext: Stream destroyed: ${event.streamId}`);
      }

      // Prüfe welcher Stream zerstört wurde und update State
      if (event.streamId === localStreamId) {
        setLocalStreamState(null);
        setLocalStreamIdState(null);
        dispatch(setLocalStreamId(null));
      } else if (event.streamId === remoteStreamId) {
        setRemoteStreamState(null);
        setRemoteStreamIdState(null);
        dispatch(setRemoteStreamId(null));
      } else if (event.streamId === screenStreamId) {
        setScreenStreamState(null);
        setScreenStreamIdState(null);
      }
    };

    const handleTrackEnded: StreamEventCallback = (event) => {
      if (DEBUG) {
        console.debug(`📹 StreamContext: Track ended in stream: ${event.streamId ?? 'unknown'}`);
      }
      // StreamManager handles cleanup - we just need to update UI state if needed
    };

    const handleError: StreamEventCallback = (event) => {
      console.error('📹 StreamContext: StreamManager error:', event.error);
    };

    // Subscribe to StreamManager events
    const unsubCreated = streamManager.on('streamCreated', handleStreamCreated);
    const unsubDestroyed = streamManager.on('streamDestroyed', handleStreamDestroyed);
    const unsubEnded = streamManager.on('trackEnded', handleTrackEnded);
    const unsubError = streamManager.on('error', handleError);

    return () => {
      unsubCreated();
      unsubDestroyed();
      unsubEnded();
      unsubError();
    };
  }, [dispatch, streamManager, localStreamId, remoteStreamId, screenStreamId]);

  // ========================================================================
  // Stream Creation (NEW - preferred methods)
  // ========================================================================

  const createLocalStream = useCallback(
    async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      // Cleanup existing stream first
      if (localStreamId) {
        streamManager.destroyStream(localStreamId);
      }

      const stream = await streamManager.createCameraStream(constraints);
      return stream;
    },
    [streamManager, localStreamId]
  );

  const createScreenStream = useCallback(
    async (constraints?: DisplayMediaStreamOptions): Promise<MediaStream> => {
      // Cleanup existing screen stream first
      if (screenStreamId) {
        streamManager.destroyStream(screenStreamId);
      }

      const stream = await streamManager.createScreenStream(constraints);
      return stream;
    },
    [streamManager, screenStreamId]
  );

  const registerRemoteStream = useCallback(
    (stream: MediaStream, peerId?: string): void => {
      // Cleanup existing remote stream first
      if (remoteStreamId) {
        streamManager.destroyStream(remoteStreamId);
      }

      streamManager.registerRemoteStream(stream, peerId);
    },
    [streamManager, remoteStreamId]
  );

  // ========================================================================
  // Legacy Setters (for backward compatibility)
  // ========================================================================

  const setLocalStream = useCallback(
    (stream: MediaStream | null) => {
      console.debug('📹 StreamContext.setLocalStream called:', {
        stream: stream ? `id=${stream.id}, tracks=${String(stream.getTracks().length)}` : 'null',
        currentLocalStreamId: localStreamId,
      });

      if (stream === null) {
        // Destroy existing stream
        if (localStreamId) {
          console.debug('📹 StreamContext: Destroying existing stream', localStreamId);
          streamManager.destroyStream(localStreamId);
        }
      } else {
        // Cleanup old stream if different
        if (localStreamId && localStreamId !== stream.id) {
          console.debug('📹 StreamContext: Cleanup old stream (different ID)', localStreamId);
          streamManager.destroyStream(localStreamId);
        }

        // Prüfe ob Stream bereits registriert
        const existing = streamManager.getStream(stream.id);
        console.debug('📹 StreamContext: Existing stream check:', existing ? 'YES' : 'NO');

        if (!existing) {
          // Register new stream as camera type
          console.debug('📹 StreamContext: Calling streamManager.registerStream for camera');
          streamManager.registerStream(stream, 'camera');
        }

        // Update local state
        console.debug('📹 StreamContext: Updating local state');
        setLocalStreamState(stream);
        setLocalStreamIdState(stream.id);
        dispatch(setLocalStreamId(stream.id));
      }
    },
    [streamManager, localStreamId, dispatch]
  );

  const setRemoteStream = useCallback(
    (stream: MediaStream | null) => {
      if (stream === null) {
        if (remoteStreamId) {
          // Don't destroy remote tracks - they're controlled by the peer
          // Just clear our reference
          setRemoteStreamState(null);
          setRemoteStreamIdState(null);
          dispatch(setRemoteStreamId(null));
        }
      } else {
        // Cleanup old stream reference if different
        if (remoteStreamId && remoteStreamId !== stream.id) {
          setRemoteStreamState(null);
          setRemoteStreamIdState(null);
        }

        // Register with StreamManager
        const existing = streamManager.getStream(stream.id);
        if (!existing) {
          streamManager.registerRemoteStream(stream);
        }

        setRemoteStreamState(stream);
        setRemoteStreamIdState(stream.id);
        dispatch(setRemoteStreamId(stream.id));
      }
    },
    [streamManager, remoteStreamId, dispatch]
  );

  const setScreenStream = useCallback(
    (stream: MediaStream | null) => {
      if (stream === null) {
        if (screenStreamId) {
          streamManager.destroyStream(screenStreamId);
        }
      } else {
        if (screenStreamId && screenStreamId !== stream.id) {
          streamManager.destroyStream(screenStreamId);
        }

        const existing = streamManager.getStream(stream.id);
        if (!existing) {
          streamManager.registerStream(stream, 'screen');
        }

        setScreenStreamState(stream);
        setScreenStreamIdState(stream.id);
      }
    },
    [streamManager, screenStreamId]
  );

  // ========================================================================
  // Stop Methods (SYNCHRONOUS - critical for Safari camera cleanup)
  // ========================================================================

  const stopLocalStream = useCallback(() => {
    if (localStreamId) {
      console.debug('🛑 StreamContext: Stopping local stream via StreamManager');
      streamManager.destroyStream(localStreamId);
      // State wird durch Event Handler gecleart
    }
  }, [streamManager, localStreamId]);

  const stopRemoteStream = useCallback(() => {
    // Don't stop remote tracks - they're controlled by the peer
    // Just clear our reference
    setRemoteStreamState(null);
    setRemoteStreamIdState(null);
    dispatch(setRemoteStreamId(null));
  }, [dispatch]);

  const stopScreenStream = useCallback(() => {
    if (screenStreamId) {
      console.debug('🛑 StreamContext: Stopping screen stream via StreamManager');
      streamManager.destroyStream(screenStreamId);
    }
  }, [streamManager, screenStreamId]);

  const cleanup = useCallback(() => {
    console.debug('🧹 StreamContext: Full cleanup via StreamManager');
    console.debug('🧹 StreamContext: Current state:', {
      localStreamId,
      remoteStreamId,
      screenStreamId,
      streamManagerDebug: streamManager.getDebugInfo(),
    });

    // Destroy all local streams through StreamManager
    streamManager.destroyAllStreams();

    // Clear local state
    setLocalStreamState(null);
    setRemoteStreamState(null);
    setScreenStreamState(null);
    setLocalStreamIdState(null);
    setRemoteStreamIdState(null);
    setScreenStreamIdState(null);

    // Clear Redux state
    dispatch(setLocalStreamId(null));
    dispatch(setRemoteStreamId(null));

    console.debug('✅ StreamContext: Cleanup complete');
  }, [streamManager, dispatch, localStreamId, remoteStreamId, screenStreamId]);

  // ========================================================================
  // Track Management
  // ========================================================================

  const addLocalTrack = useCallback(
    (track: MediaStreamTrack) => {
      if (localStream) {
        localStream.addTrack(track);
        if (DEBUG) console.debug(`➕ Added ${track.kind} track to local stream`);
      } else {
        // Create new stream with this track
        const stream = new MediaStream([track]);
        setLocalStream(stream);
      }
    },
    [localStream, setLocalStream]
  );

  const removeLocalTrack = useCallback(
    (track: MediaStreamTrack) => {
      if (localStream) {
        localStream.removeTrack(track);
        track.stop();
        if (DEBUG) console.debug(`➖ Removed ${track.kind} track from local stream`);
      }
    },
    [localStream]
  );

  const replaceLocalTrack = useCallback(
    (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack): boolean => {
      if (!localStream) return false;

      try {
        localStream.removeTrack(oldTrack);
        oldTrack.stop();
        localStream.addTrack(newTrack);
        if (DEBUG) console.debug(`🔄 Replaced ${oldTrack.kind} track in local stream`);
        return true;
      } catch (e) {
        console.error('Failed to replace track:', e);
        return false;
      }
    },
    [localStream]
  );

  // ========================================================================
  // Utilities
  // ========================================================================

  const getLocalStreamId = useCallback(() => localStreamId, [localStreamId]);
  const getRemoteStreamId = useCallback(() => remoteStreamId, [remoteStreamId]);

  const hasLocalVideo = useCallback(
    () =>
      localStream
        ?.getVideoTracks()
        .some((t: MediaStreamTrack) => t.readyState === 'live' && t.enabled) ?? false,
    [localStream]
  );

  const hasLocalAudio = useCallback(
    () =>
      localStream
        ?.getAudioTracks()
        .some((t: MediaStreamTrack) => t.readyState === 'live' && t.enabled) ?? false,
    [localStream]
  );

  const hasRemoteVideo = useCallback(
    () =>
      remoteStream?.getVideoTracks().some((t: MediaStreamTrack) => t.readyState === 'live') ??
      false,
    [remoteStream]
  );

  const hasRemoteAudio = useCallback(
    () =>
      remoteStream?.getAudioTracks().some((t: MediaStreamTrack) => t.readyState === 'live') ??
      false,
    [remoteStream]
  );

  const getDebugInfo = useCallback(() => streamManager.getDebugInfo(), [streamManager]);

  // ========================================================================
  // Cleanup on Unmount
  // ========================================================================

  useEffect(
    () => () => {
      if (DEBUG) console.debug('🧹 StreamProvider unmounting - cleaning up all streams');
      // StreamManager handles actual cleanup
      streamManager.destroyAllStreams();
    },
    [streamManager]
  );

  // ========================================================================
  // Context Value (memoized to prevent unnecessary re-renders)
  // ========================================================================

  const value = useMemo<StreamContextValue>(
    () => ({
      // State
      localStream,
      remoteStream,
      screenStream,

      // Creation
      createLocalStream,
      createScreenStream,
      registerRemoteStream,

      // Setters (legacy)
      setLocalStream,
      setRemoteStream,
      setScreenStream,

      // Cleanup
      stopLocalStream,
      stopRemoteStream,
      stopScreenStream,
      cleanup,

      // Track Management
      addLocalTrack,
      removeLocalTrack,
      replaceLocalTrack,

      // Utilities
      getLocalStreamId,
      getRemoteStreamId,
      hasLocalVideo,
      hasLocalAudio,
      hasRemoteVideo,
      hasRemoteAudio,
      getDebugInfo,
    }),
    [
      // State
      localStream,
      remoteStream,
      screenStream,
      // All callbacks are stable due to useCallback
      createLocalStream,
      createScreenStream,
      registerRemoteStream,
      setLocalStream,
      setRemoteStream,
      setScreenStream,
      stopLocalStream,
      stopRemoteStream,
      stopScreenStream,
      cleanup,
      addLocalTrack,
      removeLocalTrack,
      replaceLocalTrack,
      getLocalStreamId,
      getRemoteStreamId,
      hasLocalVideo,
      hasLocalAudio,
      hasRemoteVideo,
      hasRemoteAudio,
      getDebugInfo,
    ]
  );

  return <StreamContext.Provider value={value}>{children}</StreamContext.Provider>;
};

export default StreamContext;
