import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';

// ============================================================================
// Types
// ============================================================================

interface StreamContextState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
}

interface StreamContextValue extends StreamContextState {
  // Setters
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;

  // Cleanup
  stopLocalStream: () => void;
  stopRemoteStream: () => void;
  stopScreenStream: () => void;
  cleanup: () => void;

  // Track Management
  addLocalTrack: (track: MediaStreamTrack) => void;
  removeLocalTrack: (track: MediaStreamTrack) => void;
  replaceLocalTrack: (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) => boolean;

  // Utilities
  getLocalStreamId: () => string | null;
  getRemoteStreamId: () => string | null;
  hasLocalVideo: () => boolean;
  hasLocalAudio: () => boolean;
  hasRemoteVideo: () => boolean;
  hasRemoteAudio: () => boolean;
}

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
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStreamState] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStreamState] = useState<MediaStream | null>(null);

  // Refs für Cleanup-Tracking
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // ========================================================================
  // Stream Stop Helpers
  // ========================================================================

  const stopStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        try {
          if (track.readyState === 'live') {
            track.stop();
            console.log(`🛑 Stopped ${track.kind} track: ${track.id}`);
          }
        } catch (e) {
          console.warn(`Failed to stop track:`, e);
        }
      });
    }
  }, []);

  // ========================================================================
  // Setters with Cleanup
  // ========================================================================

  const setLocalStream = useCallback((stream: MediaStream | null) => {
    // Stop previous stream if different
    if (localStreamRef.current && localStreamRef.current !== stream) {
      stopStream(localStreamRef.current);
    }
    localStreamRef.current = stream;
    setLocalStreamState(stream);

    if (stream) {
      console.log(`📹 Local stream set: ${stream.id} (${stream.getTracks().length} tracks)`);
    } else {
      console.log('📹 Local stream cleared');
    }
  }, [stopStream]);

  const setRemoteStream = useCallback((stream: MediaStream | null) => {
    if (remoteStreamRef.current && remoteStreamRef.current !== stream) {
      // Don't stop remote stream tracks - they're controlled by the peer
      console.log('📹 Remote stream replaced');
    }
    remoteStreamRef.current = stream;
    setRemoteStreamState(stream);

    if (stream) {
      console.log(`📹 Remote stream set: ${stream.id} (${stream.getTracks().length} tracks)`);

      // Listen for track ended events
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        track.onended = () => {
          console.log(`📹 Remote ${track.kind} track ended`);
        };
      });
    }
  }, []);

  const setScreenStream = useCallback((stream: MediaStream | null) => {
    if (screenStreamRef.current && screenStreamRef.current !== stream) {
      stopStream(screenStreamRef.current);
    }
    screenStreamRef.current = stream;
    setScreenStreamState(stream);

    if (stream) {
      console.log(`🖥️ Screen stream set: ${stream.id}`);

      // Auto-cleanup when screen sharing ends
      stream.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.onended = () => {
          console.log('🖥️ Screen sharing ended by user');
          setScreenStreamState(null);
          screenStreamRef.current = null;
        };
      });
    }
  }, [stopStream]);

  // ========================================================================
  // Stop Methods
  // ========================================================================

  const stopLocalStream = useCallback(() => {
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStreamState(null);
  }, [stopStream]);

  const stopRemoteStream = useCallback(() => {
    // Don't stop tracks, just clear reference
    remoteStreamRef.current = null;
    setRemoteStreamState(null);
  }, []);

  const stopScreenStream = useCallback(() => {
    stopStream(screenStreamRef.current);
    screenStreamRef.current = null;
    setScreenStreamState(null);
  }, [stopStream]);

  const cleanup = useCallback(() => {
    console.log('🧹 StreamContext: Full cleanup');
    stopLocalStream();
    stopRemoteStream();
    stopScreenStream();
  }, [stopLocalStream, stopRemoteStream, stopScreenStream]);

  // ========================================================================
  // Track Management
  // ========================================================================

  const addLocalTrack = useCallback((track: MediaStreamTrack) => {
    if (localStreamRef.current) {
      localStreamRef.current.addTrack(track);
      console.log(`➕ Added ${track.kind} track to local stream`);
    } else {
      const stream = new MediaStream([track]);
      setLocalStream(stream);
    }
  }, [setLocalStream]);

  const removeLocalTrack = useCallback((track: MediaStreamTrack) => {
    if (localStreamRef.current) {
      localStreamRef.current.removeTrack(track);
      track.stop();
      console.log(`➖ Removed ${track.kind} track from local stream`);
    }
  }, []);

  const replaceLocalTrack = useCallback((
    oldTrack: MediaStreamTrack,
    newTrack: MediaStreamTrack
  ): boolean => {
    if (!localStreamRef.current) return false;

    try {
      localStreamRef.current.removeTrack(oldTrack);
      oldTrack.stop();
      localStreamRef.current.addTrack(newTrack);
      console.log(`🔄 Replaced ${oldTrack.kind} track in local stream`);
      return true;
    } catch (e) {
      console.error('Failed to replace track:', e);
      return false;
    }
  }, []);

  // ========================================================================
  // Utilities
  // ========================================================================

  const getLocalStreamId = useCallback(() => {
    return localStreamRef.current?.id ?? null;
  }, []);

  const getRemoteStreamId = useCallback(() => {
    return remoteStreamRef.current?.id ?? null;
  }, []);

  const hasLocalVideo = useCallback(() => {
    return localStreamRef.current?.getVideoTracks().some(
      (t: MediaStreamTrack) => t.readyState === 'live' && t.enabled
    ) ?? false;
  }, []);

  const hasLocalAudio = useCallback(() => {
    return localStreamRef.current?.getAudioTracks().some(
      (t: MediaStreamTrack) => t.readyState === 'live' && t.enabled
    ) ?? false;
  }, []);

  const hasRemoteVideo = useCallback(() => {
    return remoteStreamRef.current?.getVideoTracks().some(
      (t: MediaStreamTrack) => t.readyState === 'live'
    ) ?? false;
  }, []);

  const hasRemoteAudio = useCallback(() => {
    return remoteStreamRef.current?.getAudioTracks().some(
      (t: MediaStreamTrack) => t.readyState === 'live'
    ) ?? false;
  }, []);

  // ========================================================================
  // Cleanup on Unmount
  // ========================================================================

  useEffect(() => {
    return () => {
      console.log('🧹 StreamProvider unmounting - cleaning up all streams');
      stopStream(localStreamRef.current);
      stopStream(screenStreamRef.current);
      // Don't stop remote stream tracks
    };
  }, [stopStream]);

  // ========================================================================
  // Context Value
  // ========================================================================

  const value: StreamContextValue = {
    // State
    localStream,
    remoteStream,
    screenStream,

    // Setters
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
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useStreams = (): StreamContextValue => {
  const context = useContext(StreamContext);

  if (!context) {
    throw new Error('useStreams must be used within a StreamProvider');
  }

  return context;
};

// ============================================================================
// HOC for Legacy Components
// ============================================================================

export interface WithStreamsProps {
  streams: StreamContextValue;
}

export function withStreams<P extends WithStreamsProps>(
  WrappedComponent: React.ComponentType<P>
): React.FC<Omit<P, 'streams'>> {
  const WithStreamsComponent: React.FC<Omit<P, 'streams'>> = (props) => {
    const streams = useStreams();
    return <WrappedComponent {...(props as P)} streams={streams} />;
  };

  WithStreamsComponent.displayName = `withStreams(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithStreamsComponent;
}

export default StreamContext;