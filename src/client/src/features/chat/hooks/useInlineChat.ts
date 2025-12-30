/**
 * useInlineChat Hook
 * Manages inline chat functionality for detail pages (Match, Appointment)
 * Operates independently of the global ChatDrawer
 * Supports E2EE encryption when both participants have exchanged keys
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useChatE2Ee, type ChatE2EEStatus } from './useChatE2Ee';
import type { RootState } from '../../../core/store/store';
import type { ChatMessageModel, TypingIndicator } from '../types/Chat';

// ============================================================================
// Types
// ============================================================================

export interface UseInlineChatOptions {
  /** ThreadId from MatchRequest (SHA256-GUID format) - REQUIRED */
  threadId: string;
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

  // E2EE State
  e2eeStatus: ChatE2EEStatus;
  isE2EEReady: boolean;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  markAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useInlineChat(options: UseInlineChatOptions): UseInlineChatReturn {
  const {
    threadId,
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

  // E2EE Hook - manages key exchange and encryption
  const e2ee = useChatE2Ee({
    threadId,
    peerId: partnerId,
    autoInitiate: autoConnect,
  });

  // Track initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitializedRef = useRef(false);
  const isSendingRef = useRef(false);

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
        const trimmedContent = content.trim();

        // Use E2EE if key exchange is complete
        if (e2ee.isReady) {
          console.debug('[useInlineChat] Sending encrypted message');
          const encrypted = await e2ee.encryptMessage(trimmedContent);
          // Cast branded types to string for SignalR
          const keyGen = String(encrypted.keyGeneration);
          await chatHubService.sendEncryptedMessage(
            threadId,
            trimmedContent,
            encrypted.encryptedContent,
            keyGen,
            encrypted.iv
          );
        } else {
          // Fallback to plaintext if E2EE not ready
          console.debug('[useInlineChat] Sending plaintext message (E2EE not ready)');
          await chatHubService.sendTextMessage(threadId, trimmedContent);
        }
      } catch (error) {
        console.error('[useInlineChat] Failed to send message:', error);
      } finally {
        // Allow next send after a small delay to prevent rapid double-clicks
        setTimeout(() => {
          isSendingRef.current = false;
        }, 100);
      }
    },
    [threadId, currentUser?.id, e2ee]
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
  // Cleanup E2EE on unmount
  // ==========================================================================

  useEffect(() => () => e2ee.cleanup(), [e2ee]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    threadId,
    messages,
    isLoading: isInitializing || isLoadingMessages,
    isConnected,
    typingIndicator,
    // E2EE
    e2eeStatus: e2ee.status,
    isE2EEReady: e2ee.isReady,
    // Actions
    sendMessage,
    sendTyping,
    markAsRead,
    refresh,
  };
}

export default useInlineChat;
