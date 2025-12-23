/**
 * Chat Entity Adapter and State
 * Microsoft Teams-style thread-based chat system
 */

import { createEntityAdapter, type EntityState, type EntityId } from '@reduxjs/toolkit';
import type { RequestState } from '../../../../shared/types/common/RequestState';
import type {
  ChatThreadListItem,
  ChatMessageModel,
  ThreadUnreadCount,
  TypingIndicator,
} from '../../types/Chat';

// ============================================================================
// Entity Adapters
// ============================================================================

export const chatThreadsAdapter = createEntityAdapter<ChatThreadListItem, EntityId>({
  selectId: (thread) => thread.threadId,
  sortComparer: (a, b) => {
    // Sort by last message time (most recent first)
    const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return dateB - dateA;
  },
});

export const chatMessagesAdapter = createEntityAdapter<ChatMessageModel, EntityId>({
  selectId: (message) => message.id,
  // Sort by created time (oldest first for chat display)
  sortComparer: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
});

// ============================================================================
// State Interface
// ============================================================================

export interface ChatEntityState extends RequestState {
  // Thread List
  threads: EntityState<ChatThreadListItem, EntityId>;
  threadsLoading: boolean;
  threadsError: string | null;

  // Active Thread
  activeThreadId: string | null;
  activeThreadLoading: boolean;

  // Messages per Thread (keyed by threadId)
  messagesByThread: Record<string, EntityState<ChatMessageModel, EntityId>>;
  messagesLoading: boolean;
  messagesSending: boolean;
  messagesError: string | null;

  // Pagination per Thread
  hasMoreMessages: Record<string, boolean>;
  messagesCursor: Record<string, string | null>;

  // Real-time State
  isConnected: boolean;
  connectionId: string | null;

  // Unread Counts
  totalUnreadCount: number;
  threadUnreadCounts: ThreadUnreadCount[];

  // Typing Indicators (keyed by threadId)
  typingIndicators: Record<string, TypingIndicator>;

  // Online Users
  onlineUsers: string[];

  // Message Reply/Edit State
  replyToMessage: ChatMessageModel | null;
  editingMessage: ChatMessageModel | null;

  // UI State
  isDrawerOpen: boolean;
  drawerWidth: 'collapsed' | 'normal' | 'expanded';
  searchQuery: string;
  filterUnreadOnly: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

export const initialChatState: ChatEntityState = {
  // Thread List
  threads: chatThreadsAdapter.getInitialState(),
  threadsLoading: false,
  threadsError: null,

  // Active Thread
  activeThreadId: null,
  activeThreadLoading: false,

  // Messages
  messagesByThread: {},
  messagesLoading: false,
  messagesSending: false,
  messagesError: null,

  // Pagination
  hasMoreMessages: {},
  messagesCursor: {},

  // Real-time
  isConnected: false,
  connectionId: null,

  // Unread
  totalUnreadCount: 0,
  threadUnreadCounts: [],

  // Typing
  typingIndicators: {},

  // Online
  onlineUsers: [],

  // Message Reply/Edit
  replyToMessage: null,
  editingMessage: null,

  // UI
  isDrawerOpen: false,
  drawerWidth: 'normal',
  searchQuery: '',
  filterUnreadOnly: false,

  // RequestState
  isLoading: false,
  errorMessage: undefined,
};

// ============================================================================
// Selectors
// ============================================================================

export const chatThreadsSelectors = chatThreadsAdapter.getSelectors();
export const chatMessagesSelectors = chatMessagesAdapter.getSelectors();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get or create messages state for a thread
 */
export function getThreadMessagesState(
  state: ChatEntityState,
  threadId: string
): EntityState<ChatMessageModel, EntityId> {
  return state.messagesByThread[threadId] ?? chatMessagesAdapter.getInitialState();
}

/**
 * Ensure messages state exists for a thread
 */
export function ensureThreadMessagesState(
  state: ChatEntityState,
  threadId: string
): EntityState<ChatMessageModel, EntityId> {
  if (!(threadId in state.messagesByThread)) {
    state.messagesByThread[threadId] = chatMessagesAdapter.getInitialState();
  }
  return state.messagesByThread[threadId];
}
