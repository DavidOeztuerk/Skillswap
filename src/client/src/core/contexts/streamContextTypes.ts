import type { StreamMetadata } from '../services/StreamManager';

// ============================================================================
// Types
// ============================================================================

export interface StreamContextState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
}

export interface StreamContextValue extends StreamContextState {
  // Stream Creation (async - uses StreamManager)
  createLocalStream: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  createScreenStream: (constraints?: DisplayMediaStreamOptions) => Promise<MediaStream>;
  registerRemoteStream: (stream: MediaStream, peerId?: string) => void;

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

  // Debug
  getDebugInfo: () => {
    streamCount: number;
    streams: (StreamMetadata & {
      trackDetails: { id: string; kind: string; enabled: boolean; readyState: string }[];
    })[];
  };
}
