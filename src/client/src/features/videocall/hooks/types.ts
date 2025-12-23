/**
 * Video Call Hook Types
 *
 * Centralized type definitions for the useVideoCall hook family.
 * Note: VideoCallSharedRefs is defined in VideoCallContext.tsx
 */

import type { ChatMessage } from '../../chat/types/ChatMessage';
import type { EncryptionStats, CallParticipant } from '../store/videoCallAdapter+State';
import type { VideoCallConfig } from '../types/VideoCallConfig';

// ============================================================================
// Status Types
// ============================================================================

export type E2EEStatus =
  | 'disabled'
  | 'initializing'
  | 'key-exchange'
  | 'key-rotation'
  | 'active'
  | 'error'
  | 'unsupported';

export type ChatE2EEStatus = 'disabled' | 'initializing' | 'active' | 'error';

// ============================================================================
// E2EE Types
// ============================================================================

/**
 * E2EE Compatibility info returned by getE2EECompatibility()
 */
export interface E2EECompatibility {
  supported: boolean;
  browser: string;
  message: string;
}

export interface E2EEState {
  status: E2EEStatus;
  isActive: boolean;
  localKeyFingerprint: string | null;
  remotePeerFingerprint: string | null;
  formattedLocalFingerprint: string | null;
  formattedRemoteFingerprint: string | null;
  keyGeneration: number;
  encryptionStats: EncryptionStats | null;
  compatibility: E2EECompatibility;
  errorMessage: string | null;
  rotateKeys: () => Promise<void>;
}

export interface ChatE2EEState {
  status: ChatE2EEStatus;
  isActive: boolean;
  localFingerprint: string | null;
  peerFingerprint: string | null;
  stats: {
    messagesEncrypted: number;
    messagesDecrypted: number;
    verificationFailures: number;
  };
}

// ============================================================================
// Video Call State & Actions
// ============================================================================

export interface VideoCallState {
  sessionId: string | null;
  roomId: string;
  isConnected: boolean;
  peerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  messages: ChatMessage[];
  callDuration: number;
  participants: CallParticipant[];
  isLoading: boolean;
  error: string | null;
  callConfig: VideoCallConfig | null;
}

export interface VideoCallActions {
  startVideoCall: (appointmentId: string) => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  toggleChatPanel: () => void;
  toggleScreenSharing: () => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// Main Hook Return Type
// ============================================================================

export interface UseVideoCallReturn extends VideoCallState, VideoCallActions {
  peerConnection: RTCPeerConnection | null;
  e2ee: E2EEState;
  chatE2EE: ChatE2EEState;
}

// ============================================================================
// Constants
// ============================================================================

export const VIDEO_CALL_CONSTANTS = {
  MAX_ICE_BUFFER_SIZE: 50,
  RECONNECT_DELAYS: [0, 1000, 5000, 10000, 30000],
  HEARTBEAT_INTERVAL: 30000,
  E2EE_INIT_DELAY: 1500,
  STATS_UPDATE_INTERVAL: 5000,
  CONNECTION_TIMEOUT: 5000,
} as const;
