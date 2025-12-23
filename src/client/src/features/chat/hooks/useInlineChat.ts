/**
 * useInlineChat Hook
 * Manages inline chat functionality for detail pages (Match, Appointment)
 * Operates independently of the global ChatDrawer
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { selectAuthUser } from '../../auth/store/authSelectors';
import { chatHubService } from '../services/chatHub';
import chatService from '../services/chatService';
import {
  fetchChatMessages,
  markMessagesAsRead,
  connectToChatHub,
  subscribeToThread,
  unsubscribeFromThread,
} from '../store/chatThunks';
import {
  selectMessagesForThread,
  selectTypingIndicatorForThread,
  selectChatConnectionStatus,
  selectMessagesLoading,
} from '../store/selectors/chatSelectors';
import type { RootState } from '../../../core/store/store';
import type { ChatMessageModel, TypingIndicator } from '../types/Chat';

// ============================================================================
// Types
// ============================================================================

export interface UseInlineChatOptions {
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string;
  skillId?: string;
  skillName?: string;
  matchId?: string;
  autoConnect?: boolean;
}

export interface UseInlineChatReturn {
  // State
  threadId: string;
  messages: ChatMessageModel[];
  isLoading: boolean;
  isConnected: boolean;
  typingIndicator: TypingIndicator | undefined;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  markAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Thread ID Generation
// ============================================================================

function generateThreadId(userId1: string, userId2: string, skillId?: string): string {
  const sortedIds = [userId1, userId2].sort();
  return skillId ? `${sortedIds[0]}:${sortedIds[1]}:${skillId}` : `${sortedIds[0]}:${sortedIds[1]}`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useInlineChat(options: UseInlineChatOptions): UseInlineChatReturn {
  const {
    partnerId,
    partnerName,
    partnerAvatarUrl,
    skillId,
    skillName,
    matchId,
    autoConnect = true,
  } = options;

  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectAuthUser);
  const isConnected = useAppSelector(selectChatConnectionStatus);
  const isLoadingMessages = useAppSelector(selectMessagesLoading);

  // Track initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitializedRef = useRef(false);
  const isSendingRef = useRef(false);

  // Generate thread ID
  const threadId = useMemo(() => {
    if (!currentUser?.id) return '';
    return generateThreadId(currentUser.id, partnerId, skillId);
  }, [currentUser?.id, partnerId, skillId]);

  // Select messages for this specific thread
  const messages = useAppSelector((state: RootState) => selectMessagesForThread(state, threadId));

  // Select typing indicator for this thread
  const typingIndicator = useAppSelector((state: RootState) =>
    selectTypingIndicatorForThread(state, threadId)
  );

  // ==========================================================================
  // Initialize chat connection and subscribe to thread
  // ==========================================================================

  useEffect(() => {
    if (!threadId || !currentUser?.id || !autoConnect) {
      setIsInitializing(false);
      return;
    }
    if (hasInitializedRef.current) return;

    setIsInitializing(true);
    hasInitializedRef.current = true;

    try {
      // Connect to hub if not connected
      const handleConnect = async (): Promise<void> => {
        if (!chatHubService.isConnected()) {
          console.debug('[useInlineChat] Connecting to chat hub...');
          await dispatch(connectToChatHub()).unwrap();
        }

        // Create thread if it doesn't exist (idempotent - returns existing if found)
        const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'User';
        console.debug('[useInlineChat] Ensuring thread exists:', threadId);
        await chatService.createThread({
          threadId,
          participant1Id: currentUser.id,
          participant2Id: partnerId,
          participant1Name: currentUserName,
          participant2Name: partnerName,
          participant1AvatarUrl: currentUser.profilePictureUrl,
          participant2AvatarUrl: partnerAvatarUrl,
          skillId,
          skillName,
          matchId,
        });

        // Subscribe to thread (doesn't change global activeThreadId)
        await dispatch(subscribeToThread(threadId)).unwrap();

        // Fetch messages (PageNumber required by backend)
        await dispatch(
          fetchChatMessages({ threadId, params: { pageNumber: 1, pageSize: 50 } })
        ).unwrap();

        // Mark messages as read
        await dispatch(markMessagesAsRead(threadId)).unwrap();
      };
      handleConnect().catch(() => {});
    } catch (error: unknown) {
      console.error('[useInlineChat] Failed to initialize:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [
    threadId,
    currentUser?.id,
    currentUser?.firstName,
    currentUser?.lastName,
    currentUser?.profilePictureUrl,
    autoConnect,
    dispatch,
    partnerId,
    partnerName,
    partnerAvatarUrl,
    skillId,
    skillName,
    matchId,
  ]);

  // Cleanup: unsubscribe from thread on unmount
  useEffect(() => {
    const currentThreadId = threadId;

    return () => {
      if (currentThreadId && chatHubService.isConnected()) {
        void dispatch(unsubscribeFromThread(currentThreadId));
      }
    };
  }, [threadId, dispatch]);

  // ==========================================================================
  // Actions
  // ==========================================================================

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!threadId || !content.trim() || !currentUser?.id) return;

      // Prevent double sends (React StrictMode or rapid clicks)
      if (isSendingRef.current) {
        console.debug('[useInlineChat] Ignoring duplicate send request');
        return;
      }
      isSendingRef.current = true;

      try {
        // Send via SignalR - server will echo the message back via NewMessage event
        // No optimistic update needed - message appears when server confirms
        await chatHubService.sendTextMessage(threadId, content.trim());
      } catch (error) {
        console.error('[useInlineChat] Failed to send message:', error);
      } finally {
        // Allow next send after a small delay to prevent rapid double-clicks
        setTimeout(() => {
          isSendingRef.current = false;
        }, 100);
      }
    },
    [threadId, currentUser?.id]
  );

  const sendTyping = useCallback(
    (isTyping: boolean): void => {
      if (!threadId) return;
      chatHubService.sendTyping(threadId, isTyping);
    },
    [threadId]
  );

  const markAsRead = useCallback(async (): Promise<void> => {
    if (!threadId) return;
    try {
      await dispatch(markMessagesAsRead(threadId)).unwrap();
    } catch (error) {
      console.error('[useInlineChat] Failed to mark as read:', error);
    }
  }, [threadId, dispatch]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!threadId) return;
    try {
      await dispatch(fetchChatMessages({ threadId })).unwrap();
    } catch (error) {
      console.error('[useInlineChat] Failed to refresh messages:', error);
    }
  }, [threadId, dispatch]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    threadId,
    messages,
    isLoading: isInitializing || isLoadingMessages,
    isConnected,
    typingIndicator,
    sendMessage,
    sendTyping,
    markAsRead,
    refresh,
  };
}

export default useInlineChat;
