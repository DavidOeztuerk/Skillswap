/**
 * Chat Async Thunks
 * Handles async operations for the chat system
 */

import { createAppAsyncThunk } from '../../../core/store/thunkHelpers';
import {
  isPagedResponse,
  type PagedSuccessResponse,
  isSuccessResponse,
} from '../../../shared/types/api/UnifiedResponse';
import chatHubService from '../services/chatHub';
import chatService from '../services/chatService';
import { type ChatThreadListItem, getThreadDisplayInfo, type ChatThread } from '../types/Chat';
import type {
  SendChatMessageRequest,
  GetChatThreadsRequest,
  GetChatMessagesRequest,
  AddReactionRequest,
} from '../types/ChatRequests';
import type { ChatMessageResponse } from '../types/ChatResponses';

// ============================================================================
// Thread Thunks
// ============================================================================

/**
 * Fetch all chat threads for the current user
 */
export const fetchChatThreads = createAppAsyncThunk(
  'chat/fetchThreads',
  async (params: GetChatThreadsRequest | undefined, { getState, rejectWithValue }) => {
    const response = await chatService.getThreads(params);

    if (!isPagedResponse(response)) {
      return rejectWithValue(response);
    }

    const currentUserId = getState().auth.user?.id;
    if (currentUserId === undefined) {
      return rejectWithValue({
        success: false,
        errors: ['User not authenticated'],
      });
    }

    // Transform to ChatThreadListItem for UI
    const transformedData: ChatThreadListItem[] = response.data.map((thread) =>
      getThreadDisplayInfo(thread as unknown as ChatThread, currentUserId)
    );

    const result: PagedSuccessResponse<ChatThreadListItem> = {
      ...response,
      data: transformedData,
    };

    return result;
  }
);

/**
 * Fetch a specific chat thread
 */
export const fetchChatThread = createAppAsyncThunk(
  'chat/fetchThread',
  async (threadId: string, { rejectWithValue }) => {
    const response = await chatService.getThread(threadId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// ============================================================================
// Message Thunks
// ============================================================================

/**
 * Fetch messages for a thread
 */
export const fetchChatMessages = createAppAsyncThunk(
  'chat/fetchMessages',
  async (
    { threadId, params }: { threadId: string; params?: GetChatMessagesRequest },
    { rejectWithValue }
  ) => {
    const response = await chatService.getMessages(threadId, params);
    if (!isPagedResponse(response)) {
      return rejectWithValue(response);
    }
    return { threadId, response };
  }
);

/**
 * Send a message via HTTP (fallback when SignalR unavailable)
 */
export const sendChatMessage = createAppAsyncThunk(
  'chat/sendMessage',
  async (
    { threadId, request }: { threadId: string; request: SendChatMessageRequest },
    { rejectWithValue }
  ) => {
    const response = await chatService.sendMessage(threadId, request);
    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }
    return { threadId, message: response.data };
  }
);

// ============================================================================
// Real-time Connection Thunks
// ============================================================================

/**
 * Connect to the chat hub
 */
export const connectToChatHub = createAppAsyncThunk('chat/connect', async (_, { getState }) => {
  // Set current user ID for filtering own events (e.g., typing indicators)
  const userId = getState().auth.user?.id;
  if (userId) {
    chatHubService.setCurrentUserId(userId);
  }
  await chatHubService.connect();
});

/**
 * Disconnect from the chat hub
 */
export const disconnectFromChatHub = createAppAsyncThunk('chat/disconnect', async () => {
  await chatHubService.disconnect();
});

/**
 * Join a chat thread
 */
export const joinChatThread = createAppAsyncThunk('chat/joinThread', async (threadId: string) => {
  await chatHubService.joinThread(threadId);
  return threadId;
});

/**
 * Leave a chat thread
 */
export const leaveChatThread = createAppAsyncThunk('chat/leaveThread', async (threadId: string) => {
  await chatHubService.leaveThread(threadId);
  return threadId;
});

/**
 * Subscribe to a thread for inline chat (doesn't change activeThreadId)
 */
export const subscribeToThread = createAppAsyncThunk(
  'chat/subscribeToThread',
  async (threadId: string) => {
    await chatHubService.subscribeToThread(threadId);
    return threadId;
  }
);

/**
 * Unsubscribe from a thread (for inline chat cleanup)
 */
export const unsubscribeFromThread = createAppAsyncThunk(
  'chat/unsubscribeFromThread',
  async (threadId: string) => {
    await chatHubService.unsubscribeFromThread(threadId);
    return threadId;
  }
);

// ============================================================================
// Read Receipt Thunks
// ============================================================================

/**
 * Mark messages as read in a thread
 */
export const markMessagesAsRead = createAppAsyncThunk(
  'chat/markAsRead',
  async (threadId: string) => {
    // Prefer SignalR if connected
    if (chatHubService.isConnected()) {
      await chatHubService.markAsRead(threadId);
    } else {
      await chatService.markAsRead(threadId);
    }
    return threadId;
  }
);

// ============================================================================
// Reaction Thunks
// ============================================================================

/**
 * Toggle a reaction on a message
 */
export const toggleMessageReaction = createAppAsyncThunk(
  'chat/toggleReaction',
  async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    // Prefer SignalR if connected
    if (chatHubService.isConnected()) {
      await chatHubService.toggleReaction(messageId, emoji);
    } else {
      const request: AddReactionRequest = { emoji };
      await chatService.toggleReaction(messageId, request);
    }
    return { messageId, emoji };
  }
);

// ============================================================================
// Message Delete Thunk
// ============================================================================

/**
 * Delete a message (soft-delete)
 */
export const deleteMessage = createAppAsyncThunk(
  'chat/deleteMessage',
  async ({ messageId, threadId }: { messageId: string; threadId: string }, { rejectWithValue }) => {
    const response = await chatService.deleteMessage(messageId);
    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }
    return { messageId, threadId };
  }
);

// ============================================================================
// Unread Count Thunks
// ============================================================================

/**
 * Fetch unread count
 */
export const fetchUnreadCount = createAppAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    const response = await chatService.getUnreadCount();
    if (!isSuccessResponse(response)) {
      return rejectWithValue(response);
    }
    return response.data;
  }
);

// ============================================================================
// Typing Indicator Thunks
// ============================================================================

/**
 * Send typing indicator
 */
export const sendTypingIndicator = createAppAsyncThunk(
  'chat/sendTyping',
  ({ threadId, isTyping }: { threadId: string; isTyping: boolean }) => {
    chatHubService.sendTyping(threadId, isTyping);
    return { threadId, isTyping };
  }
);

// ============================================================================
// Message Actions Thunks
// ============================================================================

/**
 * Add a new message to the store (from SignalR)
 */
export const addReceivedMessage = createAppAsyncThunk(
  'chat/addReceivedMessage',
  ({ threadId, message }: { threadId: string; message: ChatMessageResponse }) => ({
    threadId,
    message,
  })
);
