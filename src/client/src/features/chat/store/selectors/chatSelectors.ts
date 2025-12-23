/**
 * Chat Redux Selectors
 * Memoized selectors for efficient chat state access
 */

import { createSelector } from '@reduxjs/toolkit';
import {
  chatThreadsAdapter,
  chatMessagesAdapter,
  type ChatEntityState,
} from '../adapters/chatAdapter+State';
import type { RootState } from '../../../../core/store/store';
import type { ChatThreadListItem, ChatMessageModel } from '../../types/Chat';

// ============================================================================
// Base Selectors
// ============================================================================

export const selectChatState = (state: RootState): ChatEntityState => state.chat;

// ============================================================================
// Connection Selectors
// ============================================================================

export const selectChatConnectionStatus = createSelector(
  selectChatState,
  (chat) => chat.isConnected
);

export const selectChatConnectionId = createSelector(selectChatState, (chat) => chat.connectionId);

// ============================================================================
// Thread Selectors
// ============================================================================

const selectThreadsState = createSelector(selectChatState, (chat) => chat.threads);

export const {
  selectAll: selectAllThreads,
  selectById: selectThreadById,
  selectIds: selectThreadIds,
  selectEntities: selectThreadEntities,
  selectTotal: selectThreadsTotal,
} = chatThreadsAdapter.getSelectors(selectThreadsState);

export const selectThreadsLoading = createSelector(selectChatState, (chat) => chat.threadsLoading);

export const selectThreadsError = createSelector(selectChatState, (chat) => chat.threadsError);

export const selectActiveThreadId = createSelector(selectChatState, (chat) => chat.activeThreadId);

export const selectActiveThread = createSelector(
  [selectThreadEntities, selectActiveThreadId],
  (entities, activeId): ChatThreadListItem | undefined =>
    activeId ? entities[activeId] : undefined
);

export const selectActiveThreadLoading = createSelector(
  selectChatState,
  (chat) => chat.activeThreadLoading
);

// Filtered threads
export const selectFilteredThreads = createSelector(
  [selectAllThreads, selectChatState],
  (threads, chat): ChatThreadListItem[] => {
    let result = threads;

    // Filter by search query
    if (chat.searchQuery) {
      const query = chat.searchQuery.toLowerCase();
      result = result.filter((thread) => {
        const nameMatch = thread.otherParticipantName.toLowerCase().includes(query);
        const skillMatch = thread.skillName?.toLowerCase().includes(query) ?? false;
        const previewMatch = thread.lastMessagePreview?.toLowerCase().includes(query) ?? false;
        return nameMatch || skillMatch || previewMatch;
      });
    }

    // Filter by unread only
    if (chat.filterUnreadOnly) {
      result = result.filter((thread) => thread.unreadCount > 0);
    }

    return result;
  }
);

// Threads with unread messages
export const selectUnreadThreads = createSelector(selectAllThreads, (threads) =>
  threads.filter((thread) => thread.unreadCount > 0)
);

// ============================================================================
// Message Selectors
// ============================================================================

export const selectMessagesByThread = createSelector(
  selectChatState,
  (chat) => chat.messagesByThread
);

export const selectMessagesForThread = createSelector(
  [selectMessagesByThread, (_state: RootState, threadId: string) => threadId],
  (messagesByThread, threadId): ChatMessageModel[] => {
    if (!(threadId in messagesByThread)) return [];
    return chatMessagesAdapter.getSelectors().selectAll(messagesByThread[threadId]);
  }
);

export const selectMessagesLoading = createSelector(
  selectChatState,
  (chat) => chat.messagesLoading
);

export const selectMessagesSending = createSelector(
  selectChatState,
  (chat) => chat.messagesSending
);

export const selectMessagesError = createSelector(selectChatState, (chat) => chat.messagesError);

export const selectHasMoreMessages = createSelector(
  [selectChatState, (_state: RootState, threadId: string) => threadId],
  (chat, threadId): boolean => chat.hasMoreMessages[threadId] ?? false
);

// Active thread messages
export const selectActiveThreadMessages = createSelector(
  [selectMessagesByThread, selectActiveThreadId],
  (messagesByThread, activeId): ChatMessageModel[] => {
    if (!activeId || !(activeId in messagesByThread)) return [];
    return chatMessagesAdapter.getSelectors().selectAll(messagesByThread[activeId]);
  }
);

// ============================================================================
// Unread Count Selectors
// ============================================================================

export const selectTotalUnreadCount = createSelector(
  selectChatState,
  (chat) => chat.totalUnreadCount
);

export const selectThreadUnreadCounts = createSelector(
  selectChatState,
  (chat) => chat.threadUnreadCounts
);

export const selectUnreadCountForThread = createSelector(
  [selectThreadById],
  (thread): number => thread.unreadCount
);

// ============================================================================
// Typing Indicator Selectors
// ============================================================================

export const selectTypingIndicators = createSelector(
  selectChatState,
  (chat) => chat.typingIndicators
);

export const selectTypingIndicatorForThread = createSelector(
  [selectTypingIndicators, (_state: RootState, threadId: string) => threadId],
  (indicators, threadId) => indicators[threadId]
);

export const selectActiveThreadTypingIndicator = createSelector(
  [selectTypingIndicators, selectActiveThreadId],
  (indicators, activeId) => (activeId ? indicators[activeId] : undefined)
);

// ============================================================================
// Online Users Selectors
// ============================================================================

export const selectOnlineUsers = createSelector(selectChatState, (chat) => chat.onlineUsers);

export const selectIsUserOnline = createSelector(
  [selectOnlineUsers, (_state: RootState, userId: string) => userId],
  (onlineUsers, userId): boolean => onlineUsers.includes(userId)
);

// ============================================================================
// UI State Selectors
// ============================================================================

export const selectIsDrawerOpen = createSelector(selectChatState, (chat) => chat.isDrawerOpen);

export const selectDrawerWidth = createSelector(selectChatState, (chat) => chat.drawerWidth);

export const selectSearchQuery = createSelector(selectChatState, (chat) => chat.searchQuery);

export const selectFilterUnreadOnly = createSelector(
  selectChatState,
  (chat) => chat.filterUnreadOnly
);

export const selectReplyToMessage = createSelector(selectChatState, (chat) => chat.replyToMessage);

export const selectEditingMessage = createSelector(selectChatState, (chat) => chat.editingMessage);

// ============================================================================
// Composite Selectors
// ============================================================================

export const selectChatSummary = createSelector(
  [selectAllThreads, selectTotalUnreadCount, selectChatConnectionStatus],
  (threads, unreadCount, isConnected) => ({
    threadCount: threads.length,
    unreadCount,
    isConnected,
    hasChats: threads.length > 0,
  })
);

export const selectActiveThreadSummary = createSelector(
  [selectActiveThread, selectActiveThreadMessages, selectActiveThreadTypingIndicator],
  (thread, messages, typingIndicator) => ({
    thread,
    messageCount: messages.length,
    isTyping: typingIndicator?.isTyping ?? false,
    typingUserName: typingIndicator?.userName,
    isLocked: thread?.isLocked ?? false,
  })
);
