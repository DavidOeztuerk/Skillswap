import { ChatMessage } from '../models/ChatMessage';
import { SliceError } from '../../store/types';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
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

export interface VideoCallState {
  roomId: string | null;
  isConnected: boolean;
  isInitializing: boolean;
  peerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  participants: CallParticipant[];
  callDuration: number;
  callStartTime: Date | null;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isRecording: boolean;
  messages: ChatMessage[];
  callStatistics: CallStatistics;
  settings: CallSettings;
  isLoading: boolean;
  error: SliceError | null;
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
