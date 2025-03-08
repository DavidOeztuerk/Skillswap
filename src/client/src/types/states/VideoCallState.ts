import { RequestState } from '../common/RequestState';
import { ChatMessage } from '../models/ChatMessage';

export interface VideoCallState extends RequestState {
  roomId: string | null;
  isConnected: boolean;
  peerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  messages: ChatMessage[];
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
