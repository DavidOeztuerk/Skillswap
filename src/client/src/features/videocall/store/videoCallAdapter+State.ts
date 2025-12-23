import { createEntityAdapter, type EntityState, type EntityId } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { ChatMessage } from '../../chat/types/ChatMessage';
import type { ChatE2EEStatus, E2EEStatus } from '../hooks/types';
import type { VideoCallConfig } from '../types/VideoCallConfig';

// ============================================================================
// Entity Adapter (optional - nur wenn mehrere Call-Configs benötigt werden)
// ============================================================================

export const videoCallAdapter = createEntityAdapter<VideoCallConfig, EntityId>({
  selectId: (vcc) => vcc.roomId,
  sortComparer: (a, b) => a.roomId.localeCompare(b.roomId),
});

// ============================================================================
// Main State Interface
// ============================================================================

export type LayoutMode = 'grid' | 'spotlight' | 'screenShare' | 'pip';

export interface VideoCallEntityState extends EntityState<VideoCallConfig, EntityId>, RequestState {
  // Session & Room
  sessionId: string | null;
  roomId: string | null;
  peerId: string | null;

  // Connection State
  isConnected: boolean;
  isInitializing: boolean;
  connectionQuality: ConnectionQuality;

  localStreamId: string | null;
  remoteStreamId: string | null;

  // Layout
  layoutMode: LayoutMode;
  activeSpeakerId: string | null;

  // Participants
  participants: CallParticipant[];

  // Call Timing
  callDuration: number;
  callStartTime: string | null; // ISO string

  // Media Controls
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;

  // Chat
  isChatOpen: boolean;
  messages: ChatMessage[];
  unreadMessageCount: number;

  // Statistics & Settings
  callStatistics: CallStatistics;
  settings: CallSettings;

  // E2EE State
  e2ee: E2EEState;
  chatE2EE: ChatE2EEState;
}

// ============================================================================
// Initial State
// ============================================================================

export const initialE2EEState: E2EEState = {
  status: 'disabled',
  localKeyFingerprint: null,
  remotePeerFingerprint: null,
  keyGeneration: 0,
  errorMessage: null,
  encryptionStats: null,
};

export const initialChatE2EEState: ChatE2EEState = {
  status: 'disabled',
  localFingerprint: null,
  peerFingerprint: null,
  stats: {
    messagesEncrypted: 0,
    messagesDecrypted: 0,
    verificationFailures: 0,
  },
};

export const initialCallStatistics: CallStatistics = {
  audioLevel: 0,
  networkQuality: 'good',
  packetsLost: 0,
  bandwidth: 0,
  jitter: 0,
  roundTripTime: 0,
  framesPerSecond: 0,
  resolution: null,
};

export const initialCallSettings: CallSettings = {
  videoQuality: 'hd',
  audioQuality: 'high',
  backgroundBlur: false,
  virtualBackground: null,
  speakerDetection: true,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
};

export const initialVideoCalllState: VideoCallEntityState = videoCallAdapter.getInitialState({
  // Session
  sessionId: null,
  roomId: null,
  peerId: null,

  // Connection
  isConnected: false,
  isInitializing: false,
  connectionQuality: 'good',

  localStreamId: null,
  remoteStreamId: null,

  // Layout
  layoutMode: 'grid',
  activeSpeakerId: null,

  // Participants
  participants: [],

  // Timing
  callDuration: 0,
  callStartTime: null,

  // Media Controls
  isMicEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  isRecording: false,

  // Chat
  isChatOpen: false,
  messages: [],
  unreadMessageCount: 0,

  // Stats & Settings
  callStatistics: initialCallStatistics,
  settings: initialCallSettings,

  // E2EE
  e2ee: initialE2EEState,
  chatE2EE: initialChatE2EEState,

  // Request State
  isLoading: false,
  errorMessage: undefined,
});

// ============================================================================
// Selectors from Adapter
// ============================================================================

export const videoCallSelectors = videoCallAdapter.getSelectors();

// ============================================================================
// Types
// ============================================================================

export type ConnectionQuality = 'poor' | 'fair' | 'good' | 'excellent';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt: string; // ISO string
  connectionQuality: ConnectionQuality;
  isLocal: boolean;
  audioLevel: number;
  lastActiveAt: string;
}

export interface CallStatistics {
  audioLevel: number;
  networkQuality: ConnectionQuality;
  packetsLost: number;
  bandwidth: number;
  jitter: number;
  roundTripTime: number;
  framesPerSecond: number;
  resolution: { width: number; height: number } | null;
}

export interface CallSettings {
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  backgroundBlur: boolean;
  virtualBackground: string | null;
  speakerDetection: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

export type VideoQuality = 'low' | 'medium' | 'hd' | '4k';
export type AudioQuality = 'low' | 'medium' | 'high';

// ============================================================================
// SignalR Types
// ============================================================================

export enum SignalRMessageType {
  // Room Management
  JoinRoom = 'JoinRoom',
  LeaveRoom = 'LeaveRoom',

  // Signaling
  SendOffer = 'SendOffer',
  SendAnswer = 'SendAnswer',
  SendIceCandidate = 'SendIceCandidate',

  // Legacy (für Kompatibilität)
  SendSignal = 'SendSignal',
  ReceiveSignal = 'ReceiveSignal',

  // Chat
  SendChatMessage = 'SendChatMessage',
  ReceiveChatMessage = 'ReceiveChatMessage',

  // Events
  UserJoined = 'UserJoined',
  UserLeft = 'UserLeft',
  CallEnded = 'CallEnded',

  // E2EE
  SendKeyExchange = 'SendKeyExchange',
  ReceiveKeyExchange = 'ReceiveKeyExchange',

  // Media State
  MediaStateChanged = 'MediaStateChanged',

  // Health
  SendHeartbeat = 'SendHeartbeat',
}

export interface PeerOptions {
  iceServers: RTCIceServer[];
  sdpSemantics: 'unified-plan';
  iceCandidatePoolSize?: number;
  bundlePolicy?: RTCBundlePolicy;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'candidate' | 'renegotiate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

export interface VideoCallParticipant {
  id: string;
  name?: string;
  isConnected?: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

// ============================================================================
// E2EE Types
// ============================================================================

export interface E2EEState {
  status: E2EEStatus;
  localKeyFingerprint: string | null;
  remotePeerFingerprint: string | null;
  keyGeneration: number;
  errorMessage: string | null;
  encryptionStats: EncryptionStats | null;
}

export interface ChatE2EEState {
  status: ChatE2EEStatus;
  localFingerprint: string | null;
  peerFingerprint: string | null;
  stats: ChatE2EEStats;
}

export interface EncryptionStats {
  totalFrames: number;
  encryptedFrames: number;
  decryptedFrames: number;
  encryptionErrors: number;
  decryptionErrors: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  // Optional fields for extended stats
  droppedFrames?: number;
  lastKeyRotation?: string | null;
}

export interface ChatE2EEStats {
  messagesEncrypted: number;
  messagesDecrypted: number;
  verificationFailures: number;
}

// ============================================================================
// Action Payload Types (für typsichere Actions)
// ============================================================================

export interface AddParticipantPayload {
  id: string;
  name: string;
  avatar?: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

export interface UpdateParticipantPayload {
  id: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  connectionQuality?: ConnectionQuality;
  audioLevel?: number;
}

export interface UpdateCallStatisticsPayload {
  audioLevel?: number;
  networkQuality?: ConnectionQuality;
  packetsLost?: number;
  bandwidth?: number;
  jitter?: number;
  roundTripTime?: number;
  framesPerSecond?: number;
  resolution?: { width: number; height: number } | null;
}

export interface UpdateSettingsPayload {
  videoQuality?: VideoQuality;
  audioQuality?: AudioQuality;
  backgroundBlur?: boolean;
  virtualBackground?: string | null;
  speakerDetection?: boolean;
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
}
