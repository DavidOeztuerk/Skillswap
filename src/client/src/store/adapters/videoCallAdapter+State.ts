import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { RequestState } from "../../types/common/RequestState";
import { VideoCallConfig } from "../../types/models/VideoCallConfig";
import { ChatMessage } from "../../types/models/ChatMessage";

export const videoCallAdapter = createEntityAdapter<VideoCallConfig, EntityId>({
  selectId: (vcc) => vcc.roomId,
  sortComparer: (a, b) => a.roomId.localeCompare(b.roomId),
});

export interface VideoCallEntityState extends EntityState<VideoCallConfig, EntityId>, RequestState {
  sessionId: string | null;
  roomId: string | null;
  isConnected: boolean;
  isInitializing: boolean;
  peerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  participants: CallParticipant[];
  callDuration: number;
  callStartTime: string | null; // ISO string
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isRecording: boolean;
  messages: ChatMessage[];
  callStatistics: CallStatistics;
  settings: CallSettings;
}

export const initialVideoCalllState: VideoCallEntityState = videoCallAdapter.getInitialState({
  sessionId: null,
  roomId: null,
  isConnected: false,
  isInitializing: false,
  peerId: null,
  localStream: null,
  remoteStream: null,
  participants: [],
  callDuration: 0,
  callStartTime: null,
  connectionQuality: 'good',
  isMicEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  isChatOpen: false,
  isRecording: false,
  messages: [],
  callStatistics: {
    audioLevel: 0,
    networkQuality: 'good',
    packetsLost: 0,
    bandwidth: 0,
  },
  settings: {
    videoQuality: 'hd',
    audioQuality: 'high',
    backgroundBlur: false,
    virtualBackground: null,
    speakerDetection: true,
  },
  isLoading: false,
  errorMessage: undefined
});

export const videoCallSelectors = videoCallAdapter.getSelectors();

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt: string; // ISO string
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface CallStatistics {
  audioLevel: number;
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
  packetsLost: number;
  bandwidth: number;
}

export interface CallSettings {
  videoQuality: 'low' | 'medium' | 'hd' | '4k';
  audioQuality: 'low' | 'medium' | 'high';
  backgroundBlur: boolean;
  virtualBackground: string | null;
  speakerDetection: boolean;
}

export enum SignalRMessageType {
  JoinRoom = 'JoinRoom',
  LeaveRoom = 'LeaveRoom',
  SendSignal = 'SendSignal',
  ReceiveSignal = 'ReceiveSignal',
  SendChatMessage = 'SendChatMessage',
  ReceiveChatMessage = 'ReceiveChatMessage',
  UserJoined = 'UserJoined',
  UserLeft = 'UserLeft',
  CallEnded = 'CallEnded',
}

export interface PeerOptions {
  iceServers: RTCIceServer[];
  sdpSemantics: 'unified-plan' | 'plan-b';
}

/**
 * WebRTC-Signal
 */
export interface SignalData {
  type: string;
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
