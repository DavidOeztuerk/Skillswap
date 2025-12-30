/**
 * Typed SignalR Hub Interfaces for Video Call
 * Provides compile-time type safety for SignalR communication
 */

import type { KeyExchangeMessage } from '../../core/crypto';
import type { HubConnection } from '@microsoft/signalr';

// ============================================================================
// Server -> Client Events (Hub sends to Client)
// ============================================================================

export interface UserJoinedPayload {
  userId: string;
  timestamp?: string;
}

export interface UserLeftPayload {
  userId: string;
  timestamp?: string;
}

export interface RoomParticipant {
  userId: string;
  connectionId: string;
  joinedAt: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenShareEnabled: boolean;
  isInitiator: boolean;
}

export interface RoomJoinedPayload {
  roomId: string;
  participants: RoomParticipant[];
}

export interface OfferPayload {
  fromUserId: string;
  offer: string; // SDP string
}

export interface AnswerPayload {
  fromUserId: string;
  answer: string; // SDP string
}

export interface IceCandidatePayload {
  fromUserId: string;
  candidate: string; // JSON stringified RTCIceCandidateInit
}

export interface KeyExchangePayload {
  fromUserId: string;
  message: KeyExchangeMessage | string;
}

export interface MediaStateChangedPayload {
  userId: string;
  type: 'audio' | 'video' | 'screen';
  enabled: boolean;
}

export interface HeartbeatAckPayload {
  timestamp: string;
  acknowledged: boolean;
}

export interface CallEndedPayload {
  roomId: string;
  endedBy: string;
  reason: 'user_left' | 'timeout' | 'error';
}

export interface ChatMessagePayload {
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  isEncrypted?: boolean;
}

/**
 * Events sent from Server to Client
 */
export interface ServerToClientEvents {
  // Room Management
  UserJoined: (data: UserJoinedPayload) => void;
  UserLeft: (data: UserLeftPayload) => void;
  RoomJoined: (data: RoomJoinedPayload) => void;
  CallEnded: (data: CallEndedPayload) => void;

  // WebRTC Signaling
  ReceiveOffer: (data: OfferPayload) => void;
  ReceiveAnswer: (data: AnswerPayload) => void;
  ReceiveIceCandidate: (data: IceCandidatePayload) => void;

  // E2EE Key Exchange
  ReceiveKeyOffer: (fromUserId: string, message: KeyExchangeMessage | string) => void;
  ReceiveKeyAnswer: (fromUserId: string, message: KeyExchangeMessage | string) => void;
  ReceiveKeyRotation: (fromUserId: string, message: KeyExchangeMessage | string) => void;

  // Media State
  MediaStateChanged: (data: MediaStateChangedPayload) => void;
  CameraToggled: (data: { userId: string; enabled: boolean }) => void;
  MicrophoneToggled: (data: { userId: string; enabled: boolean }) => void;
  ScreenShareStarted: (data: { userId: string }) => void;
  ScreenShareStopped: (data: { userId: string }) => void;

  // Connection
  HeartbeatAck: (data: HeartbeatAckPayload) => void;
}

// ============================================================================
// Client -> Server Events (Client invokes on Hub)
// ============================================================================

/**
 * Methods the Client can invoke on the Server
 */
export interface ClientToServerMethods {
  // Room Management
  JoinRoom: (roomId: string) => Promise<void>;
  LeaveRoom: (roomId: string) => Promise<void>;

  // WebRTC Signaling
  SendOffer: (roomId: string, targetUserId: string, sdp: string) => Promise<void>;
  SendAnswer: (roomId: string, targetUserId: string, sdp: string) => Promise<void>;
  SendIceCandidate: (roomId: string, targetUserId: string, candidate: string) => Promise<void>;

  // E2EE Key Exchange (unified method)
  ForwardE2EEMessage: (message: {
    type: number;
    targetUserId: string;
    roomId: string;
    encryptedPayload: string;
    keyFingerprint?: string;
    keyGeneration?: number;
    clientTimestamp?: string;
  }) => Promise<{ success: boolean; errorCode?: string; errorMessage?: string }>;

  // Media State
  MediaStateChanged: (roomId: string, mediaType: string, enabled: boolean) => Promise<void>;
  ToggleCamera: (roomId: string, enabled: boolean) => Promise<void>;
  ToggleMicrophone: (roomId: string, enabled: boolean) => Promise<void>;
  StartScreenShare: (roomId: string) => Promise<void>;
  StopScreenShare: (roomId: string) => Promise<void>;

  // Connection
  SendHeartbeat: (roomId: string) => Promise<void>;
}

/**
 * Type-safe wrapper for registering SignalR event handlers
 */
export type TypedEventHandler<T extends keyof ServerToClientEvents> = ServerToClientEvents[T];

/**
 * Helper type for extracting event payload type
 */
export type EventPayload<T extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[T]
>[0];

/**
 * Register a type-safe event handler on a SignalR connection
 */
export function onTypedEvent<T extends keyof ServerToClientEvents>(
  connection: HubConnection,
  event: T,
  handler: ServerToClientEvents[T]
): void {
  connection.on(event, handler as (...args: unknown[]) => void);
}

/**
 * Remove a type-safe event handler from a SignalR connection
 */
export function offTypedEvent<T extends keyof ServerToClientEvents>(
  connection: HubConnection,
  event: T,
  handler?: ServerToClientEvents[T]
): void {
  if (handler) {
    connection.off(event, handler as (...args: unknown[]) => void);
  } else {
    connection.off(event);
  }
}

/**
 * Type-safe invoke wrapper
 * All ClientToServerMethods return Promise<void>, so we await and return void
 */
export async function invokeTyped<T extends keyof ClientToServerMethods>(
  connection: HubConnection,
  method: T,
  ...args: Parameters<ClientToServerMethods[T]>
): Promise<void> {
  await connection.invoke(method, ...args);
}

// ============================================================================
// Connection State Types
// ============================================================================

export type SignalRConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Disconnecting'
  | 'Reconnecting';

export interface SignalRConnectionInfo {
  state: SignalRConnectionState;
  connectionId: string | null;
  roomId: string | null;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
}

// ============================================================================
// Reconnection Strategy
// ============================================================================

export interface ReconnectStrategy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RECONNECT_STRATEGY: ReconnectStrategy = {
  maxRetries: 10,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Calculate next retry delay with exponential backoff
 */
export function getNextRetryDelay(
  retryCount: number,
  strategy: ReconnectStrategy = DEFAULT_RECONNECT_STRATEGY
): number {
  const delay = strategy.initialDelayMs * strategy.backoffMultiplier ** retryCount;
  return Math.min(delay, strategy.maxDelayMs);
}
