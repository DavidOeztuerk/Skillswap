/**
 * Chat Service - API client for thread-based messaging
 */

import { apiClient } from '../../../core/api/apiClient';
import {
  type PagedResponse,
  isPagedResponse,
  type ApiResponse,
  isSuccessResponse,
} from '../../../shared/types/api/UnifiedResponse';
import type { SendChatMessageRequest } from '../types/ChatMessage';
import type {
  GetChatThreadsRequest,
  CreateChatThreadRequest,
  GetChatMessagesRequest,
  MarkMessagesAsReadRequest,
  AddReactionRequest,
} from '../types/ChatRequests';
import type {
  ChatThreadResponse,
  ChatMessageResponse,
  ChatUnreadCountResponse,
} from '../types/ChatResponses';

// ============================================================================
// Constants
// ============================================================================

// Base API paths
const API_CHAT_THREADS = '/api/chat/threads';
const THREAD_ID_REQUIRED = 'Thread-ID ist erforderlich';

// Chat API endpoints - defined locally with const assertion for proper typing
const ENDPOINTS = {
  THREADS: API_CHAT_THREADS,
  THREAD: API_CHAT_THREADS,
  CREATE_THREAD: API_CHAT_THREADS,
  MESSAGES: API_CHAT_THREADS,
  SEND_MESSAGE: API_CHAT_THREADS,
  MARK_READ: API_CHAT_THREADS,
  TYPING: API_CHAT_THREADS,
  REACTIONS: '/api/chat/messages',
  UNREAD_COUNT: '/api/chat/unread',
  UPLOAD_ATTACHMENT: '/api/chat/attachments/upload',
} as const;

// ============================================================================
// Types
// ============================================================================

interface APIError {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
}

// ============================================================================
// Chat Service
// ============================================================================

const chatService = {
  // ==========================================================================
  // Thread Operations
  // ==========================================================================

  /**
   * Get all chat threads for the current user
   */
  async getThreads(params?: GetChatThreadsRequest): Promise<PagedResponse<ChatThreadResponse>> {
    try {
      console.debug('[ChatService] Fetching threads with params:', params);
      const response = await apiClient.getPaged<ChatThreadResponse>(ENDPOINTS.THREADS, params);
      if (isPagedResponse(response)) {
        console.debug('[ChatService] Fetched threads:', response.data.length);
      }
      return response;
    } catch (error) {
      console.error('[ChatService] Failed to fetch threads:', error);
      throw error;
    }
  },

  /**
   * Get a specific chat thread by ID
   */
  async getThread(threadId: string): Promise<ApiResponse<ChatThreadResponse>> {
    if (!threadId.trim()) throw new Error(THREAD_ID_REQUIRED);

    try {
      console.debug('[ChatService] Fetching thread:', threadId);
      return await apiClient.get<ChatThreadResponse>(`${ENDPOINTS.THREAD}/${threadId}`);
    } catch (error) {
      console.error('[ChatService] Failed to fetch thread:', threadId, error);
      throw error;
    }
  },

  /**
   * Create a new chat thread (usually triggered by match acceptance)
   */
  async createThread(request: CreateChatThreadRequest): Promise<ApiResponse<ChatThreadResponse>> {
    if (!request.threadId.trim()) throw new Error(THREAD_ID_REQUIRED);
    if (!request.participant1Id.trim()) throw new Error('Participant1-ID ist erforderlich');
    if (!request.participant2Id.trim()) throw new Error('Participant2-ID ist erforderlich');

    try {
      console.debug('[ChatService] Creating thread:', request);
      const response = await apiClient.post<ChatThreadResponse>(ENDPOINTS.CREATE_THREAD, request);
      if (isSuccessResponse(response)) {
        console.debug('[ChatService] Thread created:', response.data.threadId);
      }
      return response;
    } catch (error) {
      console.error('[ChatService] Failed to create thread:', error);
      throw error;
    }
  },

  // ==========================================================================
  // Message Operations
  // ==========================================================================

  /**
   * Get messages for a specific thread
   */
  async getMessages(
    threadId: string,
    params?: GetChatMessagesRequest
  ): Promise<PagedResponse<ChatMessageResponse>> {
    if (!threadId.trim()) throw new Error(THREAD_ID_REQUIRED);

    try {
      console.debug('[ChatService] Fetching messages for thread:', threadId, params);
      const response = await apiClient.getPaged<ChatMessageResponse>(
        `${ENDPOINTS.MESSAGES}/${threadId}/messages`,
        params
      );
      if (isPagedResponse(response)) {
        console.debug('[ChatService] Fetched messages:', response.data.length);
      }
      return response;
    } catch (error) {
      console.error('[ChatService] Failed to fetch messages:', threadId, error);
      throw error;
    }
  },

  /**
   * Send a message to a thread (prefer SignalR for real-time)
   */
  async sendMessage(
    threadId: string,
    request: SendChatMessageRequest
  ): Promise<ApiResponse<ChatMessageResponse>> {
    if (!threadId.trim()) throw new Error(THREAD_ID_REQUIRED);
    if (!request.message.trim()) throw new Error('Nachricht ist erforderlich');

    try {
      console.debug('[ChatService] Sending message to thread:', threadId);
      const response = await apiClient.post<ChatMessageResponse>(
        `${ENDPOINTS.SEND_MESSAGE}/${threadId}/messages`,
        request
      );
      if (isSuccessResponse(response)) {
        console.debug('[ChatService] Message sent:', response.data.id);
      }
      return response;
    } catch (error: unknown) {
      const apiError = error as APIError;
      console.error('[ChatService] Failed to send message:', error);
      if (apiError.response?.data !== undefined) {
        console.error('[ChatService] Error response:', apiError.response.data);
      }
      throw error;
    }
  },

  // ==========================================================================
  // Read Receipts
  // ==========================================================================

  /**
   * Mark messages as read in a thread
   */
  async markAsRead(
    threadId: string,
    request?: MarkMessagesAsReadRequest
  ): Promise<ApiResponse<boolean>> {
    if (!threadId.trim()) throw new Error(THREAD_ID_REQUIRED);

    try {
      console.debug('[ChatService] Marking messages as read:', threadId);
      return await apiClient.post<boolean>(
        `${ENDPOINTS.MARK_READ}/${threadId}/read`,
        request ?? {}
      );
    } catch (error) {
      console.error('[ChatService] Failed to mark as read:', threadId, error);
      throw error;
    }
  },

  // ==========================================================================
  // Typing Indicator
  // ==========================================================================

  /**
   * Update typing indicator (prefer SignalR for real-time)
   */
  async updateTypingIndicator(threadId: string, isTyping: boolean): Promise<ApiResponse<boolean>> {
    if (!threadId.trim()) throw new Error(THREAD_ID_REQUIRED);

    try {
      return await apiClient.post<boolean>(`${ENDPOINTS.TYPING}/${threadId}/typing`, null, {
        params: { isTyping },
      });
    } catch (error) {
      console.error('[ChatService] Failed to update typing indicator:', error);
      throw error;
    }
  },

  // ==========================================================================
  // Reactions
  // ==========================================================================

  /**
   * Toggle a reaction on a message
   */
  async toggleReaction(
    messageId: string,
    request: AddReactionRequest
  ): Promise<ApiResponse<boolean>> {
    if (!messageId.trim()) throw new Error('Message-ID ist erforderlich');
    if (!request.emoji.trim()) throw new Error('Emoji ist erforderlich');

    try {
      console.debug('[ChatService] Toggling reaction:', messageId, request.emoji);
      return await apiClient.post<boolean>(
        `${ENDPOINTS.REACTIONS}/${messageId}/reactions`,
        request
      );
    } catch (error) {
      console.error('[ChatService] Failed to toggle reaction:', messageId, error);
      throw error;
    }
  },

  /**
   * Delete a message (soft-delete)
   */
  async deleteMessage(messageId: string): Promise<ApiResponse<boolean>> {
    if (!messageId.trim()) throw new Error('Message-ID ist erforderlich');

    try {
      console.debug('[ChatService] Deleting message:', messageId);
      return await apiClient.delete<boolean>(`${ENDPOINTS.REACTIONS}/${messageId}`);
    } catch (error) {
      console.error('[ChatService] Failed to delete message:', messageId, error);
      throw error;
    }
  },

  // ==========================================================================
  // Unread Count
  // ==========================================================================

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<ApiResponse<ChatUnreadCountResponse>> {
    try {
      console.debug('[ChatService] Fetching unread count');
      const response = await apiClient.get<ChatUnreadCountResponse>(ENDPOINTS.UNREAD_COUNT);
      if (isSuccessResponse(response)) {
        console.debug('[ChatService] Unread count:', response.data.totalUnreadCount);
      }
      return response;
    } catch (error) {
      console.error('[ChatService] Failed to fetch unread count:', error);
      throw error;
    }
  },

  // ==========================================================================
  // File Attachments
  // ==========================================================================

  /**
   * Upload a file attachment
   */
  async uploadAttachment(
    threadId: string,
    file: File,
    isEncrypted = false,
    encryptionKeyId?: string
  ): Promise<ApiResponse<{ attachmentId: string; storageUrl: string }>> {
    if (!threadId.trim()) throw new Error(THREAD_ID_REQUIRED);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('threadId', threadId);
    formData.append('isEncrypted', String(isEncrypted));
    if (encryptionKeyId) {
      formData.append('encryptionKeyId', encryptionKeyId);
    }

    try {
      console.debug('[ChatService] Uploading attachment:', file.name);
      const response = await apiClient.post<{ attachmentId: string; storageUrl: string }>(
        ENDPOINTS.UPLOAD_ATTACHMENT,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (isSuccessResponse(response)) {
        console.debug('[ChatService] Attachment uploaded:', response.data.attachmentId);
      }
      return response;
    } catch (error) {
      console.error('[ChatService] Failed to upload attachment:', error);
      throw error;
    }
  },

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Generate thread ID from participants and skill (matching backend algorithm)
   */
  generateThreadId(userId1: string, userId2: string, skillId?: string): string {
    const sortedIds = [userId1, userId2].sort();
    // Simple hash for client-side (actual SHA256 is done server-side)
    // This is just for reference - actual threadId comes from backend
    return skillId
      ? `${sortedIds[0]}:${sortedIds[1]}:${skillId}`
      : `${sortedIds[0]}:${sortedIds[1]}`;
  },

  /**
   * Check if the current user is a participant
   */
  isUserParticipant(thread: ChatThreadResponse, userId: string): boolean {
    return thread.participant1Id === userId || thread.participant2Id === userId;
  },

  /**
   * Get the other participant's info
   */
  getOtherParticipant(
    thread: ChatThreadResponse,
    currentUserId: string
  ): { id: string; name: string; avatarUrl?: string } {
    if (thread.participant1Id === currentUserId) {
      return {
        id: thread.participant2Id,
        name: thread.participant2Name,
        avatarUrl: thread.participant2AvatarUrl,
      };
    }
    return {
      id: thread.participant1Id,
      name: thread.participant1Name,
      avatarUrl: thread.participant1AvatarUrl,
    };
  },

  /**
   * Get unread count for a specific user in a thread
   */
  getUnreadCountForUser(thread: ChatThreadResponse, userId: string): number {
    if (thread.participant1Id === userId) {
      return thread.participant1UnreadCount;
    }
    return thread.participant2UnreadCount;
  },
};

export default chatService;
