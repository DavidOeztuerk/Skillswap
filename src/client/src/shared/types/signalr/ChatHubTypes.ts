/**
 * Typed SignalR Hub Interfaces for Chat
 * Microsoft Teams-style thread-based chat system
 * Provides compile-time type safety for SignalR communication
 */

import type {
  ChatMessageModel,
  ChatThread,
  ChatUnreadCountResult,
} from '../../../features/chat/types/Chat';
import type { HubConnection } from '@microsoft/signalr';

// ============================================================================
// Server -> Client Event Payloads
// ============================================================================

export interface ThreadJoinedPayload {
  threadId: string;
  isLocked: boolean;
  lockReason?: string;
}

export type NewMessagePayload = ChatMessageModel;

export interface NewChatMessagePayload {
  threadId: string;
  message: ChatMessageModel;
  unreadCount: number;
}

export interface TypingIndicatorPayload {
  threadId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MessagesReadPayload {
  threadId: string;
  readBy: string;
  readAt: string;
}

export interface ReactionUpdatedPayload {
  messageId: string;
  emoji: string;
  userId: string;
  added: boolean;
}

export interface MessageDeletedPayload {
  messageId: string;
  threadId: string;
  deletedBy: string;
  deletedAt: string;
}

export type ThreadCreatedPayload = ChatThread;

export interface ThreadLockedPayload {
  threadId: string;
  reason: string;
  lockedAt: string;
}

export interface MessageErrorPayload {
  error: string;
  threadId?: string;
}

export type ChatUnreadCountPayload = ChatUnreadCountResult;

// ============================================================================
// E2EE Key Exchange Payloads
// ============================================================================

export interface E2EEKeyOfferPayload {
  threadId: string;
  senderId: string;
  publicKey: string;
  fingerprint: string;
  timestamp: string;
}

export interface E2EEKeyAnswerPayload {
  threadId: string;
  senderId: string;
  publicKey: string;
  fingerprint: string;
  timestamp: string;
}

export interface E2EEReadyPayload {
  threadId: string;
  senderId: string;
  fingerprint: string;
}

// ============================================================================
// Server -> Client Events
// ============================================================================

export interface ChatServerToClientEvents {
  // Connection Events
  Error: (message: string) => void;

  // Thread Events
  ThreadJoined: (data: ThreadJoinedPayload) => void;
  ThreadCreated: (data: ThreadCreatedPayload) => void;
  ThreadLocked: (data: ThreadLockedPayload) => void;

  // Message Events
  NewMessage: (data: NewMessagePayload) => void;
  NewChatMessage: (data: NewChatMessagePayload) => void;
  MessageError: (message: string) => void;

  // Read Receipts
  MessagesRead: (data: MessagesReadPayload) => void;

  // Typing Indicator
  TypingIndicator: (data: TypingIndicatorPayload) => void;

  // Reactions
  ReactionUpdated: (data: ReactionUpdatedPayload) => void;

  // Message Operations
  MessageDeleted: (data: MessageDeletedPayload) => void;

  // Unread Count
  ChatUnreadCount: (data: ChatUnreadCountPayload) => void;

  // E2EE Key Exchange
  ReceiveKeyOffer: (data: E2EEKeyOfferPayload) => void;
  ReceiveKeyAnswer: (data: E2EEKeyAnswerPayload) => void;
  ReceiveE2EEReady: (data: E2EEReadyPayload) => void;
  E2EEError: (message: string) => void;
}

// ============================================================================
// Client -> Server Methods
// ============================================================================

export interface ChatClientToServerMethods {
  // Thread Operations
  JoinThread: (threadId: string) => Promise<void>;
  LeaveThread: (threadId: string) => Promise<void>;

  // Messaging
  SendMessage: (
    threadId: string,
    content: string,
    messageType?: string,
    context?: string,
    contextReferenceId?: string,
    replyToMessageId?: string,
    codeLanguage?: string,
    giphyId?: string,
    gifUrl?: string,
    isEncrypted?: boolean,
    encryptedContent?: string,
    encryptionKeyId?: string,
    encryptionIV?: string
  ) => Promise<void>;

  // Typing Indicator
  SendTyping: (threadId: string, isTyping: boolean) => Promise<void>;

  // Read Receipts
  MarkAsRead: (threadId: string) => Promise<void>;

  // Reactions
  ToggleReaction: (messageId: string, emoji: string) => Promise<void>;

  // Message Operations
  DeleteMessage: (messageId: string) => Promise<void>;

  // E2EE Key Exchange
  SendKeyOffer: (threadId: string, publicKey: string, fingerprint: string) => Promise<void>;
  SendKeyAnswer: (threadId: string, publicKey: string, fingerprint: string) => Promise<void>;
  SendE2EEReady: (threadId: string, fingerprint: string) => Promise<void>;
}

// ============================================================================
// Type-Safe Event Handler Registration
// ============================================================================

export type ChatEventHandler<T extends keyof ChatServerToClientEvents> =
  ChatServerToClientEvents[T];

export type ChatEventPayload<T extends keyof ChatServerToClientEvents> = Parameters<
  ChatServerToClientEvents[T]
>[0];

/**
 * Register a type-safe chat event handler on a SignalR connection
 */
export function onChatEvent<T extends keyof ChatServerToClientEvents>(
  connection: HubConnection,
  event: T,
  handler: ChatServerToClientEvents[T]
): void {
  connection.on(event, handler as (...args: unknown[]) => void);
}

/**
 * Remove a type-safe chat event handler from a SignalR connection
 */
export function offChatEvent<T extends keyof ChatServerToClientEvents>(
  connection: HubConnection,
  event: T,
  handler?: ChatServerToClientEvents[T]
): void {
  if (handler) {
    connection.off(event, handler as (...args: unknown[]) => void);
  } else {
    connection.off(event);
  }
}

/**
 * Type-safe invoke wrapper for chat methods
 */
export async function invokeChatMethod<T extends keyof ChatClientToServerMethods>(
  connection: HubConnection,
  method: T,
  ...args: Parameters<ChatClientToServerMethods[T]>
): Promise<void> {
  await connection.invoke(method, ...args);
}

// ============================================================================
// Connection State Types
// ============================================================================

export type ChatConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Disconnecting'
  | 'Reconnecting';

export interface ChatConnectionInfo {
  state: ChatConnectionState;
  connectionId: string | null;
  activeThreadId: string | null;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
}

// ============================================================================
// Send Message Options
// ============================================================================

export interface SendMessageOptions {
  threadId: string;
  content: string;
  messageType?: string;
  context?: string;
  contextReferenceId?: string;
  replyToMessageId?: string;
  codeLanguage?: string;
  giphyId?: string;
  gifUrl?: string;
  // E2EE fields
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptionKeyId?: string;
  encryptionIV?: string;
}

// ============================================================================
// Chat Hub Events for Redux Integration
// ============================================================================

export type ChatHubEventType =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'reconnected'
  | 'thread_joined'
  | 'thread_left'
  | 'new_message'
  | 'message_deleted'
  | 'typing_indicator'
  | 'messages_read'
  | 'reaction_updated'
  | 'thread_created'
  | 'thread_locked'
  | 'unread_count_updated'
  | 'e2ee_key_offer'
  | 'e2ee_key_answer'
  | 'e2ee_ready'
  | 'e2ee_error'
  | 'error';

export interface ChatHubEvent<T = unknown> {
  type: ChatHubEventType;
  payload: T;
  timestamp: number;
}

// ============================================================================
// Reconnection Strategy
// ============================================================================

export interface ChatReconnectStrategy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_CHAT_RECONNECT_STRATEGY: ChatReconnectStrategy = {
  maxRetries: 15,
  initialDelayMs: 500,
  maxDelayMs: 30000,
  backoffMultiplier: 1.5,
};

export function getChatRetryDelay(
  retryCount: number,
  strategy: ChatReconnectStrategy = DEFAULT_CHAT_RECONNECT_STRATEGY
): number {
  const delay = strategy.initialDelayMs * strategy.backoffMultiplier ** retryCount;
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.2 * Math.random();
  return Math.min(delay + jitter, strategy.maxDelayMs);
}
