import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  initialChatState,
  chatThreadsAdapter,
  chatMessagesAdapter,
  ensureThreadMessagesState,
} from './adapters/chatAdapter+State';
import {
  fetchChatThreads,
  fetchChatThread,
  fetchChatMessages,
  sendChatMessage,
  connectToChatHub,
  disconnectFromChatHub,
  joinChatThread,
  leaveChatThread,
  markMessagesAsRead,
  fetchUnreadCount,
  deleteMessage,
} from './chatThunks';
import type {
  ThreadJoinedPayload,
  ThreadLockedPayload,
  NewChatMessagePayload,
  MessagesReadPayload,
  TypingIndicatorPayload,
  ReactionUpdatedPayload,
  ChatUnreadCountPayload,
} from '../../../shared/types/signalr/ChatHubTypes';
import type { ChatThreadListItem, ChatMessageModel, ThreadUnreadCount } from '../types/Chat';
import type { ChatThreadResponse } from '../types/ChatResponses';

/**
 * Generates a message preview (max 50 chars with ellipsis)
 */
const getMessagePreview = (content: string): string =>
  content.length > 50 ? `${content.slice(0, 47)}...` : content;

/**
 * Parses reactions JSON safely
 */
const parseReactionsJson = (reactionsJson: string | undefined): Record<string, string[]> => {
  if (!reactionsJson) return {};
  try {
    return JSON.parse(reactionsJson) as Record<string, string[]>;
  } catch {
    return {};
  }
};

/**
 * Adds a user to an emoji reaction
 */
const addReaction = (
  reactions: Record<string, string[]>,
  emoji: string,
  userId: string
): Record<string, string[]> => {
  const updated = { ...reactions };
  if (!(emoji in updated)) updated[emoji] = [];
  if (!updated[emoji].includes(userId)) updated[emoji].push(userId);
  return updated;
};

/**
 * Removes a user from an emoji reaction
 */
const removeReaction = (
  reactions: Record<string, string[]>,
  emoji: string,
  userId: string
): Record<string, string[]> => {
  if (!(emoji in reactions)) return reactions;
  const filtered = reactions[emoji].filter((id) => id !== userId);
  if (filtered.length === 0) {
    const { [emoji]: _removed, ...rest } = reactions;
    return rest;
  }
  return { ...reactions, [emoji]: filtered };
};

const chatSlice = createSlice({
  name: 'chat',
  initialState: initialChatState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setConnectionId: (state, action: PayloadAction<string | null>) => {
      state.connectionId = action.payload;
    },
    setActiveThread: (state, action: PayloadAction<string | null>) => {
      state.activeThreadId = action.payload;
    },
    threadJoined: (state, action: PayloadAction<ThreadJoinedPayload>) => {
      state.activeThreadId = action.payload.threadId;
      state.activeThreadLoading = false;
    },
    threadCreated: (state, action: PayloadAction<ChatThreadResponse>) => {
      const thread = action.payload;
      const userId = '';
      const listItem: ChatThreadListItem = {
        threadId: thread.threadId,
        otherParticipantId: thread.participant2Id,
        otherParticipantName: thread.participant2Name,
        otherParticipantAvatarUrl: thread.participant2AvatarUrl,
        skillName: thread.skillName,
        lastMessageAt: thread.lastMessageAt,
        lastMessagePreview: thread.lastMessagePreview,
        isLastMessageFromMe: thread.lastMessageSenderId === userId,
        unreadCount: 0,
        isLocked: thread.isLocked,
        isTyping: false,
      };

      state.threads = chatThreadsAdapter.addOne(state.threads, listItem);
    },
    threadLocked: (state, action: PayloadAction<ThreadLockedPayload>) => {
      state.threads = chatThreadsAdapter.updateOne(state.threads, {
        id: action.payload.threadId,
        changes: { isLocked: true },
      });
    },
    updateThread: (
      state,
      action: PayloadAction<{ threadId: string; changes: Partial<ChatThreadListItem> }>
    ) => {
      state.threads = chatThreadsAdapter.updateOne(state.threads, {
        id: action.payload.threadId,
        changes: action.payload.changes,
      });
    },
    messageReceived: (state, action: PayloadAction<ChatMessageModel>) => {
      const message = action.payload;
      const { threadId } = message;

      ensureThreadMessagesState(state, threadId);
      state.messagesByThread[threadId] = chatMessagesAdapter.addOne(
        state.messagesByThread[threadId],
        message
      );

      state.threads = chatThreadsAdapter.updateOne(state.threads, {
        id: threadId,
        changes: {
          lastMessageAt: message.createdAt,
          lastMessagePreview: getMessagePreview(message.content),
          isLastMessageFromMe: false,
          isTyping: false,
        },
      });
    },
    newChatMessage: (state, action: PayloadAction<NewChatMessagePayload>) => {
      const { threadId, message, unreadCount } = action.payload;
      const isActiveThread = threadId === state.activeThreadId;

      ensureThreadMessagesState(state, threadId);

      // Add message if not already present
      if (!(message.id in state.messagesByThread[threadId].entities)) {
        state.messagesByThread[threadId] = chatMessagesAdapter.addOne(
          state.messagesByThread[threadId],
          message
        );
      }

      state.threads = chatThreadsAdapter.updateOne(state.threads, {
        id: threadId,
        changes: {
          lastMessageAt: message.createdAt,
          lastMessagePreview: getMessagePreview(message.content),
          unreadCount: isActiveThread ? 0 : unreadCount,
          isTyping: false,
        },
      });

      if (!isActiveThread) state.totalUnreadCount += 1;
    },

    addOptimisticMessage: (state, action: PayloadAction<ChatMessageModel>) => {
      const message = action.payload;
      ensureThreadMessagesState(state, message.threadId);
      state.messagesByThread[message.threadId] = chatMessagesAdapter.addOne(
        state.messagesByThread[message.threadId],
        message
      );
    },
    removeOptimisticMessage: (
      state,
      action: PayloadAction<{ threadId: string; messageId: string }>
    ) => {
      const { threadId, messageId } = action.payload;
      if (threadId in state.messagesByThread) {
        state.messagesByThread[threadId] = chatMessagesAdapter.removeOne(
          state.messagesByThread[threadId],
          messageId
        );
      }
    },
    messagesRead: (state, action: PayloadAction<MessagesReadPayload>) => {
      const { threadId } = action.payload;

      // Mark all messages in thread as read
      if (threadId in state.messagesByThread) {
        const allIds = state.messagesByThread[threadId].ids;
        const updates = allIds.map((id) => ({
          id,
          changes: { isRead: true, readAt: action.payload.readAt },
        }));
        state.messagesByThread[threadId] = chatMessagesAdapter.updateMany(
          state.messagesByThread[threadId],
          updates
        );
      }

      // Update thread unread count (updateOne safely handles missing entities)
      state.threads = chatThreadsAdapter.updateOne(state.threads, {
        id: threadId,
        changes: { unreadCount: 0 },
      });
    },
    typingIndicator: (state, action: PayloadAction<TypingIndicatorPayload>) => {
      const { threadId, userId, userName, isTyping } = action.payload;

      if (isTyping) {
        state.typingIndicators[threadId] = {
          threadId,
          userId,
          userName,
          isTyping: true,
          timestamp: Date.now(),
        };
      } else {
        // Remove typing indicator using object destructuring (eslint no-dynamic-delete)
        const { [threadId]: _removed, ...restIndicators } = state.typingIndicators;
        state.typingIndicators = restIndicators;
      }

      // Update thread typing state (updateOne safely handles missing entities)
      state.threads = chatThreadsAdapter.updateOne(state.threads, {
        id: threadId,
        changes: { isTyping },
      });
    },
    clearTypingIndicator: (state, action: PayloadAction<string>) => {
      const threadId = action.payload;
      // Remove typing indicator using object destructuring (eslint no-dynamic-delete)
      const { [threadId]: _removed, ...restIndicators } = state.typingIndicators;
      state.typingIndicators = restIndicators;

      // Update thread typing state (updateOne safely handles missing entities)
      state.threads = chatThreadsAdapter.updateOne(state.threads, {
        id: threadId,
        changes: { isTyping: false },
      });
    },
    reactionUpdated: (state, action: PayloadAction<ReactionUpdatedPayload>) => {
      const { messageId, emoji, userId, added } = action.payload;

      // Find the message in any thread
      for (const threadId of Object.keys(state.messagesByThread)) {
        if (!(messageId in state.messagesByThread[threadId].entities)) continue;

        const message = state.messagesByThread[threadId].entities[messageId];
        const reactions = parseReactionsJson(message.reactionsJson);
        const updatedReactions = added
          ? addReaction(reactions, emoji, userId)
          : removeReaction(reactions, emoji, userId);

        state.messagesByThread[threadId] = chatMessagesAdapter.updateOne(
          state.messagesByThread[threadId],
          {
            id: messageId,
            changes: {
              reactionsJson: JSON.stringify(updatedReactions),
              reactions: updatedReactions,
            },
          }
        );
        break;
      }
    },
    setUnreadCount: (state, action: PayloadAction<ChatUnreadCountPayload>) => {
      state.totalUnreadCount = action.payload.totalUnreadCount;
      state.threadUnreadCounts = action.payload.threadUnreadCounts;

      // Update individual thread unread counts (updateOne safely handles missing entities)
      action.payload.threadUnreadCounts.forEach((tc: ThreadUnreadCount) => {
        state.threads = chatThreadsAdapter.updateOne(state.threads, {
          id: tc.threadId,
          changes: { unreadCount: tc.unreadCount },
        });
      });
    },
    openDrawer: (state) => {
      state.isDrawerOpen = true;
    },

    closeDrawer: (state) => {
      state.isDrawerOpen = false;
    },

    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },

    setDrawerWidth: (state, action: PayloadAction<'collapsed' | 'normal' | 'expanded'>) => {
      state.drawerWidth = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setFilterUnreadOnly: (state, action: PayloadAction<boolean>) => {
      state.filterUnreadOnly = action.payload;
    },

    setReplyToMessage: (state, action: PayloadAction<ChatMessageModel | null>) => {
      state.replyToMessage = action.payload;
      state.editingMessage = null; // Clear editing when replying
    },

    setEditingMessage: (state, action: PayloadAction<ChatMessageModel | null>) => {
      state.editingMessage = action.payload;
      state.replyToMessage = null; // Clear reply when editing
    },

    clearMessageContext: (state) => {
      state.replyToMessage = null;
      state.editingMessage = null;
    },
    clearError: (state) => {
      state.threadsError = null;
      state.messagesError = null;
      state.errorMessage = undefined;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchChatThreads.pending, (state) => {
        state.threadsLoading = true;
        state.threadsError = null;
      })
      .addCase(fetchChatThreads.fulfilled, (state, action) => {
        state.threadsLoading = false;
        state.threads = chatThreadsAdapter.setAll(state.threads, action.payload.data);
      })
      .addCase(fetchChatThreads.rejected, (state, action) => {
        state.threadsLoading = false;
        state.threadsError =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch threads';
      })
      .addCase(fetchChatThread.pending, (state) => {
        state.activeThreadLoading = true;
      })
      .addCase(fetchChatThread.fulfilled, (state) => {
        state.activeThreadLoading = false;
      })
      .addCase(fetchChatThread.rejected, (state, action) => {
        state.activeThreadLoading = false;
        state.threadsError =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch thread';
      })
      .addCase(fetchChatMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { threadId, response } = action.payload;

        ensureThreadMessagesState(state, threadId);
        state.messagesByThread[threadId] = chatMessagesAdapter.setAll(
          state.messagesByThread[threadId],
          response.data as ChatMessageModel[]
        );

        // Update pagination
        state.hasMoreMessages[threadId] = response.pageNumber < response.totalPages;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch messages';
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.messagesSending = true;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.messagesSending = false;
        const { threadId, message } = action.payload;

        ensureThreadMessagesState(state, threadId);
        state.messagesByThread[threadId] = chatMessagesAdapter.addOne(
          state.messagesByThread[threadId],
          message as ChatMessageModel
        );

        state.threads = chatThreadsAdapter.updateOne(state.threads, {
          id: threadId,
          changes: {
            lastMessageAt: message.createdAt,
            lastMessagePreview: getMessagePreview(message.content),
            isLastMessageFromMe: true,
          },
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.messagesSending = false;
        state.messagesError =
          action.payload?.message ?? action.error.message ?? 'Failed to send message';
      })
      .addCase(connectToChatHub.fulfilled, (state) => {
        state.isConnected = true;
      })
      .addCase(connectToChatHub.rejected, (state) => {
        state.isConnected = false;
      })
      .addCase(disconnectFromChatHub.fulfilled, (state) => {
        state.isConnected = false;
        state.connectionId = null;
      })
      .addCase(joinChatThread.pending, (state) => {
        state.activeThreadLoading = true;
      })
      .addCase(joinChatThread.fulfilled, (state, action) => {
        state.activeThreadLoading = false;
        state.activeThreadId = action.payload;
      })
      .addCase(joinChatThread.rejected, (state, action) => {
        state.activeThreadLoading = false;
        state.threadsError =
          action.payload?.message ?? action.error.message ?? 'Failed to join thread';
      })
      .addCase(leaveChatThread.fulfilled, (state, action) => {
        if (state.activeThreadId === action.payload) {
          state.activeThreadId = null;
        }
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const threadId = action.payload;

        // Update thread unread count
        if (threadId in state.threads.entities) {
          const thread = state.threads.entities[threadId];
          if (thread.unreadCount > 0) {
            const previousUnread = thread.unreadCount;
            state.threads = chatThreadsAdapter.updateOne(state.threads, {
              id: threadId,
              changes: { unreadCount: 0 },
            });
            state.totalUnreadCount = Math.max(0, state.totalUnreadCount - previousUnread);
          }
        }
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.totalUnreadCount = action.payload.totalUnreadCount;
        state.threadUnreadCounts = action.payload.threadUnreadCounts;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId, threadId } = action.payload;
        ensureThreadMessagesState(state, threadId);
        state.messagesByThread[threadId] = chatMessagesAdapter.updateOne(
          state.messagesByThread[threadId],
          {
            id: messageId,
            changes: {
              isDeleted: true,
              content: '[Nachricht wurde gelöscht]',
            },
          }
        );
      });
  },
});

export const {
  setConnectionStatus,
  setConnectionId,
  setActiveThread,
  threadJoined,
  threadCreated,
  threadLocked,
  updateThread,
  messageReceived,
  newChatMessage,
  addOptimisticMessage,
  removeOptimisticMessage,
  messagesRead,
  typingIndicator,
  clearTypingIndicator,
  reactionUpdated,
  setUnreadCount,
  openDrawer,
  closeDrawer,
  toggleDrawer,
  setDrawerWidth,
  setSearchQuery,
  setFilterUnreadOnly,
  setReplyToMessage,
  setEditingMessage,
  clearMessageContext,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
