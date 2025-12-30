/**
 * ChatHub SignalR Client Service
 */

import {
  type HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import { toast } from 'react-toastify';
import { getToken } from '../../../shared/utils/authHelpers';
import type { AppDispatch } from '../../../core/store/store';
import type { Base64String, KeyFingerprint } from '../../../shared/core/crypto';
import type {
  ChatServerToClientEvents,
  ChatConnectionState,
  ThreadJoinedPayload,
  ThreadCreatedPayload,
  ThreadLockedPayload,
  NewMessagePayload,
  NewChatMessagePayload,
  MessagesReadPayload,
  TypingIndicatorPayload,
  ReactionUpdatedPayload,
  ChatUnreadCountPayload,
  SendMessageOptions,
} from '../../../shared/types/signalr/ChatHubTypes';
import type { ChatMessageModel } from '../types/Chat';

// Constants
const CHAT_HUB_NOT_CONNECTED = 'ChatHub not connected';

// Store reference pattern to avoid circular dependencies
// Store is initialized at app startup via setStoreDispatch
let storeDispatch: AppDispatch | null = null;

export function setStoreDispatch(dispatch: AppDispatch): void {
  storeDispatch = dispatch;
}

function getDispatch(): AppDispatch {
  if (!storeDispatch) {
    throw new Error('ChatHub: Store dispatch not initialized. Call setStoreDispatch first.');
  }
  return storeDispatch;
}

// ============================================================================
// Types
// ============================================================================

type ChatEventCallback<T extends keyof ChatServerToClientEvents> = ChatServerToClientEvents[T];

// E2EE Key Exchange Types
interface E2EEKeyOfferPayload {
  ThreadId: string;
  SenderId: string;
  PublicKey: string;
  Fingerprint: string;
  Timestamp: string;
}

interface E2EEKeyAnswerPayload {
  ThreadId: string;
  SenderId: string;
  PublicKey: string;
  Fingerprint: string;
  Timestamp: string;
}

interface E2EEReadyPayload {
  ThreadId: string;
  SenderId: string;
  Fingerprint: string;
}

interface MessageDeletedPayload {
  messageId: string;
  threadId: string;
  deletedBy: string;
  deletedAt: string;
}

interface ChatHubCallbacks {
  onThreadJoined?: ChatEventCallback<'ThreadJoined'>;
  onThreadCreated?: ChatEventCallback<'ThreadCreated'>;
  onThreadLocked?: ChatEventCallback<'ThreadLocked'>;
  onNewMessage?: ChatEventCallback<'NewMessage'>;
  onNewChatMessage?: ChatEventCallback<'NewChatMessage'>;
  onMessageError?: ChatEventCallback<'MessageError'>;
  onMessagesRead?: ChatEventCallback<'MessagesRead'>;
  onTypingIndicator?: ChatEventCallback<'TypingIndicator'>;
  onReactionUpdated?: ChatEventCallback<'ReactionUpdated'>;
  onUnreadCount?: ChatEventCallback<'ChatUnreadCount'>;
  onError?: ChatEventCallback<'Error'>;
  onConnectionStateChanged?: (state: ChatConnectionState) => void;
  // E2EE Callbacks
  onE2EEKeyOffer?: (data: E2EEKeyOfferPayload) => void;
  onE2EEKeyAnswer?: (data: E2EEKeyAnswerPayload) => void;
  onE2EEReady?: (data: E2EEReadyPayload) => void;
  onE2EEError?: (message: string) => void;
  // Message Operations
  onMessageDeleted?: (data: MessageDeletedPayload) => void;
}

// ============================================================================
// ChatHub Service Class
// ============================================================================

class ChatHubService {
  private connection: HubConnection | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000;
  private isIntentionalDisconnect = false;
  private callbacks: ChatHubCallbacks = {};
  private activeThreadId: string | null = null;
  private typingDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private typingAutoStopTimer: ReturnType<typeof setTimeout> | null = null;
  // Connection lock to prevent race conditions
  private connectingPromise: Promise<void> | null = null;
  // Current user ID to filter own events
  private currentUserId: string | null = null;

  /**
   * Get the connection or throw if not connected
   */
  private getConnection(): HubConnection {
    if (this.connection === null) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }
    return this.connection;
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  /**
   * Set the current user ID for filtering own events
   */
  public setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Connect to the ChatHub
   */
  public async connect(): Promise<void> {
    // Already connected - return immediately
    if (this.connection?.state === HubConnectionState.Connected) {
      console.debug('[ChatHub] Already connected');
      return;
    }

    // Connection in progress - wait for it
    if (this.connectingPromise) {
      console.debug('[ChatHub] Connection already in progress, waiting...');
      return this.connectingPromise;
    }

    const token = getToken();
    if (!token) {
      console.warn('[ChatHub] No authentication token found, skipping connection');
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
    const hubUrl = `${baseUrl}/notification-service/hubs/chat`;

    console.debug('[ChatHub] Connecting to:', hubUrl);

    // Create connection promise to prevent race conditions
    this.connectingPromise = (async () => {
      // Double-check we didn't get connected while waiting
      if (this.connection?.state === HubConnectionState.Connected) {
        console.debug('[ChatHub] Already connected (race check)');
        return;
      }

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, { accessTokenFactory: () => token })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) => {
            if (ctx.previousRetryCount >= this.maxReconnectAttempts) return null;
            // Exponential backoff with jitter
            const delay = this.baseReconnectDelay * 1.5 ** ctx.previousRetryCount;
            const jitter = delay * 0.2 * Math.random();
            return Math.min(delay + jitter, 30000);
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      this.setupEventHandlers();

      try {
        await this.connection.start();
        this.notifyConnectionState('Connected');
        this.reconnectAttempts = 0;
        console.debug('[ChatHub] Connected successfully');
      } catch (err) {
        console.error('[ChatHub] Connection failed:', err);
        this.notifyConnectionState('Disconnected');
        this.scheduleReconnect();
        throw err;
      }
    })();

    try {
      await this.connectingPromise;
    } finally {
      this.connectingPromise = null;
    }
  }

  /**
   * Disconnect from the ChatHub
   */
  public async disconnect(): Promise<void> {
    this.isIntentionalDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.typingDebounceTimer) {
      clearTimeout(this.typingDebounceTimer);
      this.typingDebounceTimer = null;
    }

    if (this.typingAutoStopTimer) {
      clearTimeout(this.typingAutoStopTimer);
      this.typingAutoStopTimer = null;
    }

    if (this.connection) {
      try {
        // Leave active thread before disconnecting
        if (this.activeThreadId) {
          await this.leaveThread(this.activeThreadId);
        }
        await this.connection.stop();
      } finally {
        this.connection = null;
        this.notifyConnectionState('Disconnected');
      }
    }

    this.isIntentionalDisconnect = false;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[ChatHub] Max reconnection attempts reached');
      toast.error('Chat-Verbindung verloren. Bitte Seite neu laden.');
      return;
    }

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectAttempts += 1;
    const delay = this.baseReconnectDelay * 2 ** (this.reconnectAttempts - 1);
    const jitter = delay * 0.2 * Math.random();

    console.debug(
      `[ChatHub] Scheduling reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay + jitter)}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((err: unknown) => {
        console.error('[ChatHub] Reconnect failed:', err);
      });
    }, delay + jitter);
  }

  /**
   * Notify about connection state changes
   */
  private notifyConnectionState(state: ChatConnectionState): void {
    this.callbacks.onConnectionStateChanged?.(state);

    // Dispatch to Redux if needed
    getDispatch()({
      type: 'chat/setConnectionStatus',
      payload: state === 'Connected',
    });
  }

  // ==========================================================================
  // Event Handlers Setup
  // ==========================================================================

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Thread Events
    this.connection.on('ThreadJoined', (data: ThreadJoinedPayload) => {
      console.debug('[ChatHub] ThreadJoined:', data.threadId);
      this.callbacks.onThreadJoined?.(data);
      getDispatch()({ type: 'chat/threadJoined', payload: data });
    });

    this.connection.on('ThreadCreated', (data: ThreadCreatedPayload) => {
      console.debug('[ChatHub] ThreadCreated:', data.threadId);
      this.callbacks.onThreadCreated?.(data);
      getDispatch()({ type: 'chat/threadCreated', payload: data });
      toast.success('Neuer Chat erstellt!');
    });

    this.connection.on('ThreadLocked', (data: ThreadLockedPayload) => {
      console.debug('[ChatHub] ThreadLocked:', data.threadId);
      this.callbacks.onThreadLocked?.(data);
      getDispatch()({ type: 'chat/threadLocked', payload: data });
      toast.info('Chat wurde gesperrt');
    });

    // Message Events
    this.connection.on('NewMessage', (data: NewMessagePayload) => {
      console.debug('[ChatHub] NewMessage in thread:', data.threadId);
      this.callbacks.onNewMessage?.(data);
      getDispatch()({ type: 'chat/messageReceived', payload: data });
    });

    this.connection.on('NewChatMessage', (data: NewChatMessagePayload) => {
      console.debug('[ChatHub] NewChatMessage:', data.threadId);
      this.callbacks.onNewChatMessage?.(data);
      getDispatch()({ type: 'chat/newChatMessage', payload: data });

      // Show notification if not in the active thread
      if (data.threadId !== this.activeThreadId) {
        this.showMessageNotification(data.message);
      }
    });

    this.connection.on('MessageError', (message: string) => {
      console.error('[ChatHub] MessageError:', message);
      this.callbacks.onMessageError?.(message);
      toast.error(`Nachrichtenfehler: ${message}`);
    });

    // Read Receipts
    this.connection.on('MessagesRead', (data: MessagesReadPayload) => {
      console.debug('[ChatHub] MessagesRead:', data.threadId);
      this.callbacks.onMessagesRead?.(data);
      getDispatch()({ type: 'chat/messagesRead', payload: data });
    });

    // Typing Indicator - ignore own events
    this.connection.on('TypingIndicator', (data: TypingIndicatorPayload) => {
      // CRITICAL: Ignore typing events from ourselves (backend broadcasts to all)
      if (this.currentUserId && data.userId === this.currentUserId) {
        console.debug('[ChatHub] TypingIndicator: Ignoring own event');
        return;
      }
      console.debug('[ChatHub] TypingIndicator:', data);
      this.callbacks.onTypingIndicator?.(data);
      getDispatch()({ type: 'chat/typingIndicator', payload: data });
    });

    // Reactions
    this.connection.on('ReactionUpdated', (data: ReactionUpdatedPayload) => {
      console.debug('[ChatHub] ReactionUpdated:', data);
      this.callbacks.onReactionUpdated?.(data);
      getDispatch()({ type: 'chat/reactionUpdated', payload: data });
    });

    // Unread Count
    this.connection.on('ChatUnreadCount', (data: ChatUnreadCountPayload) => {
      console.debug('[ChatHub] ChatUnreadCount:', data.totalUnreadCount);
      this.callbacks.onUnreadCount?.(data);
      getDispatch()({ type: 'chat/setUnreadCount', payload: data });
    });

    // Error
    this.connection.on('Error', (message: string) => {
      console.error('[ChatHub] Error:', message);
      this.callbacks.onError?.(message);
      toast.error(`Chat-Fehler: ${message}`);
    });

    // E2EE Events - Backend sends ReceiveKeyOffer, ReceiveKeyAnswer, ReceiveE2EEReady
    this.connection.on('ReceiveKeyOffer', (data: E2EEKeyOfferPayload) => {
      console.debug('[ChatHub] ReceiveKeyOffer:', data.ThreadId);
      this.callbacks.onE2EEKeyOffer?.(data);
    });

    this.connection.on('ReceiveKeyAnswer', (data: E2EEKeyAnswerPayload) => {
      console.debug('[ChatHub] ReceiveKeyAnswer:', data.ThreadId);
      this.callbacks.onE2EEKeyAnswer?.(data);
    });

    this.connection.on('ReceiveE2EEReady', (data: E2EEReadyPayload) => {
      console.debug('[ChatHub] ReceiveE2EEReady:', data.ThreadId);
      this.callbacks.onE2EEReady?.(data);
    });

    this.connection.on('E2EEError', (message: string) => {
      console.error('[ChatHub] E2EEError:', message);
      this.callbacks.onE2EEError?.(message);
    });

    // Message Deleted Event
    this.connection.on('MessageDeleted', (data: MessageDeletedPayload) => {
      console.debug('[ChatHub] MessageDeleted:', data.messageId);
      this.callbacks.onMessageDeleted?.(data);
      getDispatch()({ type: 'chat/messageDeleted', payload: data });
    });

    // Connection Lifecycle
    this.connection.onclose(() => {
      console.debug('[ChatHub] Connection closed');
      this.notifyConnectionState('Disconnected');
      if (!this.isIntentionalDisconnect) {
        this.scheduleReconnect();
      }
    });

    this.connection.onreconnecting(() => {
      console.debug('[ChatHub] Reconnecting...');
      this.notifyConnectionState('Reconnecting');
    });

    this.connection.onreconnected(() => {
      console.debug('[ChatHub] Reconnected');
      this.notifyConnectionState('Connected');
      this.reconnectAttempts = 0;

      // Rejoin active thread if any
      if (this.activeThreadId) {
        this.joinThread(this.activeThreadId).catch((err: unknown) => {
          console.error('[ChatHub] Failed to rejoin thread:', err);
        });
      }
    });
  }

  // ==========================================================================
  // Thread Operations
  // ==========================================================================

  // Lock for join operation to prevent race conditions
  private joiningThreadPromise: Promise<void> | null = null;
  private joiningThreadId: string | null = null;

  /**
   * Join a chat thread to receive messages
   */
  public async joinThread(threadId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    // Already in this thread - skip
    if (this.activeThreadId === threadId) {
      console.debug('[ChatHub] Already in thread:', threadId);
      return;
    }

    // Join in progress for this thread - wait for it
    if (this.joiningThreadPromise && this.joiningThreadId === threadId) {
      console.debug('[ChatHub] Join already in progress for:', threadId);
      return this.joiningThreadPromise;
    }

    // Leave current thread if different
    if (this.activeThreadId && this.activeThreadId !== threadId) {
      await this.leaveThread(this.activeThreadId);
    }

    this.joiningThreadId = threadId;
    this.joiningThreadPromise = (async () => {
      console.debug('[ChatHub] Joining thread:', threadId);
      await this.getConnection().invoke('JoinThread', threadId);
      this.activeThreadId = threadId;
    })();

    try {
      await this.joiningThreadPromise;
    } finally {
      this.joiningThreadPromise = null;
      this.joiningThreadId = null;
    }
  }

  /**
   * Leave a chat thread
   */
  public async leaveThread(threadId: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn('[ChatHub] Cannot leave thread - not connected');
      return;
    }

    console.debug('[ChatHub] Leaving thread:', threadId);
    await this.getConnection().invoke('LeaveThread', threadId);

    if (this.activeThreadId === threadId) {
      this.activeThreadId = null;
    }
  }

  // ==========================================================================
  // Messaging
  // ==========================================================================

  /**
   * Send a message to the active thread
   */
  public async sendMessage(options: SendMessageOptions): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    const {
      threadId,
      content,
      messageType = 'Text',
      context = 'Direct',
      contextReferenceId,
      replyToMessageId,
      codeLanguage,
      giphyId,
      gifUrl,
      isEncrypted = false,
      encryptedContent,
      encryptionKeyId,
      encryptionIV,
    } = options;

    console.debug('[ChatHub] Sending message to thread:', threadId);

    await this.getConnection().invoke(
      'SendMessage',
      threadId,
      content,
      messageType,
      context,
      contextReferenceId ?? null,
      replyToMessageId ?? null,
      codeLanguage ?? null,
      giphyId ?? null,
      gifUrl ?? null,
      isEncrypted,
      encryptedContent ?? null,
      encryptionKeyId ?? null,
      encryptionIV ?? null
    );
  }

  /**
   * Send a text message (simplified)
   */
  public async sendTextMessage(threadId: string, content: string): Promise<void> {
    await this.sendMessage({ threadId, content });
  }

  /**
   * Send a code block message
   */
  public async sendCodeMessage(threadId: string, code: string, language: string): Promise<void> {
    await this.sendMessage({
      threadId,
      content: code,
      messageType: 'CodeBlock',
      codeLanguage: language,
    });
  }

  /**
   * Send a GIF message
   */
  public async sendGifMessage(threadId: string, giphyId: string, gifUrl: string): Promise<void> {
    await this.sendMessage({
      threadId,
      content: 'GIF',
      messageType: 'GIF',
      giphyId,
      gifUrl,
    });
  }

  /**
   * Reply to a message
   */
  public async replyToMessage(
    threadId: string,
    content: string,
    replyToMessageId: string
  ): Promise<void> {
    await this.sendMessage({ threadId, content, replyToMessageId });
  }

  // ==========================================================================
  // Typing Indicator
  // ==========================================================================

  /**
   * Send typing indicator with debouncing
   */
  public sendTyping(threadId: string, isTyping: boolean): void {
    console.debug('[ChatHub] sendTyping called:', {
      threadId,
      isTyping,
      connected: this.isConnected(),
    });

    if (!this.isConnected()) {
      console.warn('[ChatHub] sendTyping: Not connected, skipping');
      return;
    }

    // Clear existing timer
    if (this.typingDebounceTimer) {
      clearTimeout(this.typingDebounceTimer);
      this.typingDebounceTimer = null;
    }

    // Send immediately if stopping
    if (!isTyping) {
      console.debug('[ChatHub] sendTyping: Sending stop typing');
      this.getConnection()
        .invoke('SendTyping', threadId, false)
        .catch((err: unknown) => {
          console.error('[ChatHub] Failed to send typing indicator:', err);
        });
      return;
    }

    // Debounce start typing
    this.typingDebounceTimer = setTimeout(() => {
      console.debug('[ChatHub] sendTyping: Sending start typing (after debounce)');
      this.getConnection()
        .invoke('SendTyping', threadId, true)
        .catch((err: unknown) => {
          console.error('[ChatHub] Failed to send typing indicator:', err);
        });
    }, 300);

    // Clear any existing auto-stop timer to prevent multiple false events
    if (this.typingAutoStopTimer) {
      clearTimeout(this.typingAutoStopTimer);
    }

    // Auto-stop typing after 5 seconds of no typing activity
    this.typingAutoStopTimer = setTimeout(() => {
      console.debug('[ChatHub] sendTyping: Auto-stop after 5s');
      if (this.isConnected()) {
        this.getConnection()
          .invoke('SendTyping', threadId, false)
          .catch(() => {
            // Ignore errors on auto-stop
          });
      }
      this.typingAutoStopTimer = null;
    }, 5000);
  }

  // ==========================================================================
  // Read Receipts
  // ==========================================================================

  /**
   * Mark messages as read in a thread
   */
  public async markAsRead(threadId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    console.debug('[ChatHub] Marking messages as read:', threadId);
    await this.getConnection().invoke('MarkAsRead', threadId);
  }

  // ==========================================================================
  // Reactions
  // ==========================================================================

  /**
   * Toggle a reaction on a message
   */
  public async toggleReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    console.debug('[ChatHub] Toggling reaction:', messageId, emoji);
    await this.getConnection().invoke('ToggleReaction', messageId, emoji);
  }

  // ==========================================================================
  // Message Operations
  // ==========================================================================

  /**
   * Delete a message (soft-delete, sender only)
   */
  public async deleteMessage(messageId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    console.debug('[ChatHub] Deleting message:', messageId);
    await this.getConnection().invoke('DeleteMessage', messageId);
  }

  // ==========================================================================
  // E2EE Key Exchange
  // ==========================================================================

  /**
   * Send E2EE key offer to peer
   */
  public async sendKeyOffer(
    threadId: string,
    publicKey: Base64String,
    fingerprint: KeyFingerprint
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    console.debug('[ChatHub] Sending E2EE key offer:', threadId);
    await this.getConnection().invoke('SendKeyOffer', threadId, publicKey, fingerprint);
  }

  /**
   * Send E2EE key answer to peer
   */
  public async sendKeyAnswer(
    threadId: string,
    publicKey: string,
    fingerprint: string
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    console.debug('[ChatHub] Sending E2EE key answer:', threadId);
    await this.getConnection().invoke('SendKeyAnswer', threadId, publicKey, fingerprint);
  }

  /**
   * Notify peer that E2EE is ready
   */
  public async sendE2EEReady(threadId: string, fingerprint: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    console.debug('[ChatHub] Sending E2EE ready:', threadId);
    await this.getConnection().invoke('SendE2EEReady', threadId, fingerprint);
  }

  /**
   * Send an encrypted message
   */
  public async sendEncryptedMessage(
    threadId: string,
    plaintextPreview: string,
    encryptedContent: string,
    encryptionKeyId: string,
    encryptionIV: string
  ): Promise<void> {
    await this.sendMessage({
      threadId,
      content:
        plaintextPreview.length > 20 ? `${plaintextPreview.slice(0, 17)}...` : plaintextPreview,
      isEncrypted: true,
      encryptedContent,
      encryptionKeyId,
      encryptionIV,
    });
  }

  // ==========================================================================
  // Callbacks Registration
  // ==========================================================================

  /**
   * Set callbacks for chat events
   */
  public setCallbacks(callbacks: ChatHubCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Clear all callbacks
   */
  public clearCallbacks(): void {
    this.callbacks = {};
  }

  // ==========================================================================
  // State Getters
  // ==========================================================================

  public getConnectionState(): HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  public getActiveThreadId(): string | null {
    return this.activeThreadId;
  }

  public getConnectionId(): string | null {
    return this.connection?.connectionId ?? null;
  }

  // ==========================================================================
  // Inline Chat Support (subscribe without changing activeThreadId)
  // ==========================================================================

  private subscribedThreads = new Set<string>();
  private subscribingPromises = new Map<string, Promise<void>>();

  /**
   * Subscribe to a thread for inline chat (doesn't change activeThreadId)
   */
  public async subscribeToThread(threadId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error(CHAT_HUB_NOT_CONNECTED);
    }

    // Already subscribed - skip
    if (this.subscribedThreads.has(threadId)) {
      console.debug('[ChatHub] Already subscribed to thread:', threadId);
      return;
    }

    // Subscription in progress - wait for it
    const existingPromise = this.subscribingPromises.get(threadId);
    if (existingPromise) {
      console.debug('[ChatHub] Subscription already in progress for:', threadId);
      return existingPromise;
    }

    // Create subscription promise to prevent race conditions
    const subscribePromise = (async () => {
      console.debug('[ChatHub] Subscribing to thread (inline):', threadId);
      await this.getConnection().invoke('JoinThread', threadId);
      this.subscribedThreads.add(threadId);
    })();

    this.subscribingPromises.set(threadId, subscribePromise);

    try {
      await subscribePromise;
    } finally {
      this.subscribingPromises.delete(threadId);
    }
  }

  /**
   * Unsubscribe from a thread (for inline chat cleanup)
   */
  public async unsubscribeFromThread(threadId: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn('[ChatHub] Cannot unsubscribe - not connected');
      return;
    }

    // Don't unsubscribe if this is also the active thread
    if (threadId === this.activeThreadId) {
      console.debug('[ChatHub] Not unsubscribing - is active thread:', threadId);
      this.subscribedThreads.delete(threadId);
      return;
    }

    if (!this.subscribedThreads.has(threadId)) {
      return;
    }

    console.debug('[ChatHub] Unsubscribing from thread (inline):', threadId);
    await this.getConnection().invoke('LeaveThread', threadId);
    this.subscribedThreads.delete(threadId);
  }

  /**
   * Check if subscribed to a thread
   */
  public isSubscribedToThread(threadId: string): boolean {
    return this.subscribedThreads.has(threadId) || this.activeThreadId === threadId;
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  private showMessageNotification(message: ChatMessageModel): void {
    // Only show if document is not focused or user is not on chat page
    if (document.hasFocus()) return;

    const truncatedContent =
      message.content.length > 50 ? `${message.content.slice(0, 47)}...` : message.content;

    toast.info(`${message.senderName}: ${truncatedContent}`, {
      position: 'top-right',
      autoClose: 4000,
      onClick: () => {
        // Navigate to chat when clicked
        window.dispatchEvent(
          new CustomEvent('openChat', { detail: { threadId: message.threadId } })
        );
      },
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const chatHubService = new ChatHubService();
export default chatHubService;
