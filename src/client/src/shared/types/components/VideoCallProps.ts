/**
 * Video Call Component Props
 *
 * Standardized prop types for video call related components.
 * Centralizes all video call component interfaces for consistency.
 */

import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Video layout mode options
 */
export type LayoutMode = 'grid' | 'spotlight' | 'screenShare' | 'pip';

/**
 * Network quality levels
 */
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

/**
 * Connection status states
 */
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

/**
 * E2EE encryption status
 */
export type E2EEStatus = 'enabled' | 'disabled' | 'verifying' | 'error';

/**
 * Reaction types for video calls
 */
export type ReactionType = 'thumbsUp' | 'heart' | 'applause' | 'laugh' | 'wow';

// ============================================================================
// Participant Types
// ============================================================================

/**
 * Video call participant data
 */
export interface Participant {
  /** Unique participant ID */
  id: string;
  /** Display name */
  name: string;
  /** Video stream */
  videoStream?: MediaStream;
  /** Audio stream */
  audioStream?: MediaStream;
  /** Whether this is the local user */
  isLocal?: boolean;
  /** Whether participant is currently speaking */
  isSpeaking?: boolean;
  /** Whether participant is sharing screen */
  isScreenSharing?: boolean;
  /** Avatar URL */
  avatarUrl?: string;
  /** Mute status */
  isMuted?: boolean;
  /** Video disabled status */
  isVideoDisabled?: boolean;
}

/**
 * Received reaction from a participant
 */
export interface ReceivedReaction {
  /** Reaction type */
  type: ReactionType;
  /** Sender's participant ID */
  senderId: string;
  /** Optional unique ID for tracking */
  id?: string;
}

// ============================================================================
// Control Props
// ============================================================================

/**
 * Props for call control buttons
 */
export interface CallControlsProps {
  /** Microphone enabled state */
  isMicEnabled: boolean;
  /** Video enabled state */
  isVideoEnabled: boolean;
  /** Screen sharing state */
  isScreenSharing: boolean;
  /** Chat panel open state */
  isChatOpen: boolean;
  /** Toggle microphone handler */
  onToggleMic: () => void;
  /** Toggle video handler */
  onToggleVideo: () => void;
  /** Toggle screen share handler */
  onToggleScreenShare: () => void;
  /** Toggle chat panel handler */
  onToggleChat: () => void;
  /** End call handler */
  onEndCall: () => void;
  /** Open settings handler */
  onOpenSettings?: () => void;
}

/**
 * Props for call settings panel
 */
export interface CallSettingsProps {
  /** Whether settings panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Available audio input devices */
  audioInputDevices?: MediaDeviceInfo[];
  /** Available video input devices */
  videoInputDevices?: MediaDeviceInfo[];
  /** Selected audio input device ID */
  selectedAudioInput?: string;
  /** Selected video input device ID */
  selectedVideoInput?: string;
  /** Audio input change handler */
  onAudioInputChange?: (deviceId: string) => void;
  /** Video input change handler */
  onVideoInputChange?: (deviceId: string) => void;
}

// ============================================================================
// Layout Props
// ============================================================================

/**
 * Props for video layout container
 */
export interface VideoLayoutProps {
  /** List of participants */
  participants: Participant[];
  /** Local media stream */
  localStream?: MediaStream;
  /** Screen share stream */
  screenShareStream?: MediaStream;
  /** Current layout mode */
  activeLayoutMode: LayoutMode;
  /** Layout change handler */
  onLayoutChange: (mode: LayoutMode) => void;
  /** Active speaker ID */
  activeSpeakerId?: string;
  /** Show layout control buttons */
  showLayoutControls?: boolean;
  /** Render prop for custom layout */
  children?: (layout: {
    mode: LayoutMode;
    mainParticipant?: Participant;
    sideParticipants: Participant[];
    gridConfig: { columns: number; rows: number };
  }) => ReactNode;
}

/**
 * Props for local video preview
 */
export interface LocalVideoProps {
  /** Media stream to display */
  stream?: MediaStream;
  /** Whether video is muted/disabled */
  muted?: boolean;
  /** Whether to mirror the video */
  mirrored?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for remote video display
 */
export interface RemoteVideoProps {
  /** Participant data */
  participant: Participant;
  /** Whether this is the main/spotlight view */
  isMain?: boolean;
  /** Whether participant is speaking */
  isSpeaking?: boolean;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

// ============================================================================
// Status Props
// ============================================================================

/**
 * Props for connection status indicator
 */
export interface ConnectionStatusProps {
  /** Current connection status */
  status: ConnectionStatus;
  /** Reconnection attempt count */
  reconnectAttempt?: number;
  /** Show detailed status text */
  showDetails?: boolean;
}

/**
 * Props for E2EE status indicator
 */
export interface E2EEStatusProps {
  /** E2EE status */
  status: E2EEStatus;
  /** Whether E2EE is currently active */
  isActive: boolean;
  /** Number of encrypted messages */
  messagesEncrypted?: number;
  /** Number of decrypted messages */
  messagesDecrypted?: number;
  /** Number of verification failures */
  verificationFailures?: number;
  /** Click handler for details */
  onClick?: () => void;
}

/**
 * Props for network quality indicator
 */
export interface NetworkQualityIndicatorProps {
  /** Network quality stats */
  stats: {
    quality: NetworkQuality;
    videoPacketsLostPerSecond: number;
    videoJitter: number;
    videoBandwidth: number;
    audioPacketsLostPerSecond: number;
    audioJitter: number;
    audioBandwidth: number;
    roundTripTime: number;
    totalBandwidth: number;
    lastUpdate: Date;
  };
  /** Show detailed stats in tooltip */
  showDetails?: boolean;
}

// ============================================================================
// Reaction Props
// ============================================================================

/**
 * Props for call reactions component
 */
export interface CallReactionsProps {
  /** Send reaction handler */
  onSendReaction: (reaction: ReactionType) => void;
  /** Reactions received from others */
  receivedReactions?: ReceivedReaction[];
  /** Whether reactions are disabled */
  disabled?: boolean;
  /** Position of reaction buttons */
  position?: 'bottom-left' | 'bottom-right' | 'top-right';
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// Panel Props
// ============================================================================

/**
 * Props for in-call chat panel
 */
export interface ChatPanelProps {
  /** Whether panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Room/call ID for the chat */
  roomId: string;
  /** List of participants for mentions */
  participants?: Participant[];
  /** Custom width */
  width?: number | string;
}

/**
 * Props for pre-call lobby
 */
export interface PreCallLobbyProps {
  /** Appointment ID */
  appointmentId: string;
  /** Partner's name */
  partnerName: string;
  /** Partner's avatar URL */
  partnerAvatarUrl?: string;
  /** Local video stream for preview */
  localStream?: MediaStream;
  /** Join call handler */
  onJoinCall: () => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Whether currently joining */
  isJoining?: boolean;
}

/**
 * Props for post-call summary
 */
export interface PostCallSummaryProps {
  /** Appointment ID */
  appointmentId: string;
  /** Call duration in seconds */
  duration: number;
  /** Partner's name */
  partnerName: string;
  /** Whether to show rating prompt */
  showRating?: boolean;
  /** Rating submit handler */
  onRatingSubmit?: (rating: number, feedback?: string) => void;
  /** Close handler */
  onClose: () => void;
}

// ============================================================================
// Debug Props
// ============================================================================

/**
 * Props for E2EE debug panel (development only)
 */
export interface E2EEDebugPanelProps {
  /** Whether panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** E2EE statistics */
  stats: {
    status: E2EEStatus;
    publicKeyFingerprint?: string;
    messagesEncrypted: number;
    messagesDecrypted: number;
    verificationFailures: number;
    lastKeyRotation?: Date;
  };
}
