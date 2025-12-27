import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  memo,
  type ReactNode,
} from 'react';
import {
  setLocalStreamId as dispatchLocalStreamId,
  setRemoteStreamId as dispatchRemoteStreamId,
} from '../../features/videocall/store/videoCallSlice';
import { getStreamManager, type StreamEventCallback } from '../services/StreamManager';
import { useAppDispatch } from '../store/store.hooks';
import type { StreamContextValue } from './streamContextTypes';

const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_STREAMS === 'true';
const log = DEBUG ? console.debug.bind(console) : () => {};

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

export const StreamProvider: React.FC<StreamProviderProps> = memo(({ children }) => {
  const dispatch = useAppDispatch();
  const streamManager = getStreamManager();

  // React State für UI-Updates (synced mit StreamManager)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Stream IDs für schnellen Zugriff
  const [localStreamId, setLocalStreamId] = useState<string | null>(null);
  const [remoteStreamId, setRemoteStreamId] = useState<string | null>(null);
  const [screenStreamId, setScreenStreamId] = useState<string | null>(null);

  // ========================================================================
  // Refs für stabile Referenzen (verhindert stale closures in Event Handlers)
  // ========================================================================
  const localStreamIdRef = useRef<string | null>(null);
  const remoteStreamIdRef = useRef<string | null>(null);
  const screenStreamIdRef = useRef<string | null>(null);

  // Sync refs with state
  useEffect(() => {
    localStreamIdRef.current = localStreamId;
  }, [localStreamId]);

  useEffect(() => {
    remoteStreamIdRef.current = remoteStreamId;
  }, [remoteStreamId]);

  useEffect(() => {
    screenStreamIdRef.current = screenStreamId;
  }, [screenStreamId]);

  // ========================================================================
  // StreamManager Event Handler (stabil - verwendet Refs statt State)
  // ========================================================================

  useEffect(() => {
    const handleStreamCreated: StreamEventCallback = (event) => {
      if (!event.stream || !event.metadata) return;

      log(
        `📹 StreamContext: Stream created (${event.metadata.type}): ${event.streamId ?? 'unknown'}`
      );

      switch (event.metadata.type) {
        case 'camera':
          setLocalStream(event.stream);
          setLocalStreamId(event.streamId ?? null);
          dispatch(dispatchLocalStreamId(event.streamId ?? null));
          break;

        case 'screen':
          setScreenStream(event.stream);
          setScreenStreamId(event.streamId ?? null);
          break;

        case 'remote':
          setRemoteStream(event.stream);
          setRemoteStreamId(event.streamId ?? null);
          dispatch(dispatchRemoteStreamId(event.streamId ?? null));
          break;

        default:
          console.warn('Unknown stream type received');
          break;
      }
    };

    const handleStreamDestroyed: StreamEventCallback = (event) => {
      if (!event.streamId) return;

      log(`📹 StreamContext: Stream destroyed: ${event.streamId}`);

      // WICHTIG: Verwende Refs statt State um stale closures zu vermeiden!
      // Der Effect läuft nur einmal, aber die Refs werden immer aktualisiert.
      if (event.streamId === localStreamIdRef.current) {
        setLocalStream(null);
        setLocalStreamId(null);
        dispatch(dispatchLocalStreamId(null));
      } else if (event.streamId === remoteStreamIdRef.current) {
        setRemoteStream(null);
        setRemoteStreamId(null);
        dispatch(dispatchRemoteStreamId(null));
      } else if (event.streamId === screenStreamIdRef.current) {
        setScreenStream(null);
        setScreenStreamId(null);
      }
    };

    const handleTrackEnded: StreamEventCallback = (event) => {
      log(`📹 StreamContext: Track ended in stream: ${event.streamId ?? 'unknown'}`);
    };

    const handleError: StreamEventCallback = (event) => {
      console.error('📹 StreamContext: StreamManager error:', event.error);
    };

    // Subscribe to StreamManager events (nur einmal beim Mount!)
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
  }, [dispatch, streamManager]); // Keine Stream-ID Dependencies mehr!

  // ========================================================================
  // Stream Creation (stabil durch Refs)
  // ========================================================================

  const createLocalStream = useCallback(
    async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      // Cleanup existing stream first (use ref for current value)
      if (localStreamIdRef.current) {
        streamManager.destroyStream(localStreamIdRef.current);
      }

      return streamManager.createCameraStream(constraints);
    },
    [streamManager] // Keine State-Dependencies mehr!
  );

  const createScreenStream = useCallback(
    async (constraints?: DisplayMediaStreamOptions): Promise<MediaStream> => {
      // Cleanup existing screen stream first
      if (screenStreamIdRef.current) {
        streamManager.destroyStream(screenStreamIdRef.current);
      }

      return streamManager.createScreenStream(constraints);
    },
    [streamManager]
  );

  const registerRemoteStream = useCallback(
    (stream: MediaStream, peerId?: string): void => {
      // Cleanup existing remote stream first
      if (remoteStreamIdRef.current) {
        streamManager.destroyStream(remoteStreamIdRef.current);
      }

      streamManager.registerRemoteStream(stream, peerId);
    },
    [streamManager]
  );

  // ========================================================================
  // Stop Methods (SYNCHRONOUS - critical for Safari camera cleanup)
  // ========================================================================

  const stopLocalStream = useCallback(() => {
    if (localStreamIdRef.current) {
      log('🛑 StreamContext: Stopping local stream');
      streamManager.destroyStream(localStreamIdRef.current);
    }
  }, [streamManager]);

  const stopRemoteStream = useCallback(() => {
    // Don't stop remote tracks - they're controlled by the peer
    // Just clear our reference
    setRemoteStream(null);
    setRemoteStreamId(null);
    dispatch(dispatchRemoteStreamId(null));
  }, [dispatch]);

  const stopScreenStream = useCallback(() => {
    if (screenStreamIdRef.current) {
      log('🛑 StreamContext: Stopping screen stream');
      streamManager.destroyStream(screenStreamIdRef.current);
    }
  }, [streamManager]);

  const cleanup = useCallback(() => {
    log('🧹 StreamContext: Full cleanup');

    streamManager.destroyAllStreams();

    setLocalStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setLocalStreamId(null);
    setRemoteStreamId(null);
    setScreenStreamId(null);

    dispatch(dispatchLocalStreamId(null));
    dispatch(dispatchRemoteStreamId(null));
  }, [streamManager, dispatch]);

  // ========================================================================
  // Track Management
  // ========================================================================

  const addLocalTrack = useCallback(
    (track: MediaStreamTrack) => {
      if (localStream) {
        localStream.addTrack(track);
        log(`➕ Added ${track.kind} track to local stream`);
      } else {
        // Create new stream and register with StreamManager
        const stream = new MediaStream([track]);
        streamManager.registerStream(stream, 'camera');
      }
    },
    [localStream, streamManager]
  );

  const removeLocalTrack = useCallback(
    (track: MediaStreamTrack) => {
      if (localStream) {
        localStream.removeTrack(track);
        track.stop();
        log(`➖ Removed ${track.kind} track from local stream`);
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
        log(`🔄 Replaced ${oldTrack.kind} track in local stream`);
        return true;
      } catch (e) {
        console.error('Failed to replace track:', e);
        return false;
      }
    },
    [localStream]
  );

  // ========================================================================
  // Utilities (stabil durch Refs)
  // ========================================================================

  const getLocalStreamId = useCallback(() => localStreamIdRef.current, []);
  const getRemoteStreamId = useCallback(() => remoteStreamIdRef.current, []);

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
      log('🧹 StreamProvider unmounting');
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

      // Stream Creation
      createLocalStream,
      createScreenStream,
      registerRemoteStream,

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
      // Callbacks (stable due to useCallback)
      createLocalStream,
      createScreenStream,
      registerRemoteStream,
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
});

StreamProvider.displayName = 'StreamProvider';

export default StreamContext;
