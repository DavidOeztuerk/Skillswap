/**
 * useChat Hook
 * Provides easy access to chat functionality for page integrations
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { getUserIdFromToken } from '../../../shared/utils/authHelpers';
import { openDrawer, closeDrawer, toggleDrawer, setActiveThread } from '../store/chatSlice';
import {
  connectToChatHub,
  disconnectFromChatHub,
  fetchChatThreads,
  joinChatThread,
} from '../store/chatThunks';
import {
  selectChatConnectionStatus,
  selectTotalUnreadCount,
  selectIsDrawerOpen,
  selectActiveThreadId,
  selectFilteredThreads,
} from '../store/selectors/chatSelectors';

// ============================================================================
// Hook Definition
// ============================================================================

interface UseChatReturn {
  // State
  isConnected: boolean;
  totalUnreadCount: number;
  isDrawerOpen: boolean;
  activeThreadId: string | null;
  threads: ReturnType<typeof selectFilteredThreads>;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  openChat: (threadId?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  joinThread: (threadId: string) => Promise<void>;
  refreshThreads: () => Promise<void>;

  // Utilities
  generateThreadId: (userId1: string, userId2: string, skillId?: string) => string;
  openChatWithUser: (
    userId: string,
    userName: string,
    skillId?: string,
    skillName?: string
  ) => void;
}

export const useChat = (): UseChatReturn => {
  const dispatch = useAppDispatch();

  // Selectors
  const isConnected = useAppSelector(selectChatConnectionStatus);
  const totalUnreadCount = useAppSelector(selectTotalUnreadCount);
  const isDrawerOpen = useAppSelector(selectIsDrawerOpen);
  const activeThreadId = useAppSelector(selectActiveThreadId);
  const threads = useAppSelector(selectFilteredThreads);

  // Auto-connect effect
  useEffect(() => {
    const handleOpenChatEvent = (event: CustomEvent<{ threadId: string }>): void => {
      dispatch(openDrawer());
      if (event.detail.threadId) {
        dispatch(setActiveThread(event.detail.threadId));
        void dispatch(joinChatThread(event.detail.threadId));
      }
    };

    window.addEventListener('openChat', handleOpenChatEvent as EventListener);

    return () => {
      window.removeEventListener('openChat', handleOpenChatEvent as EventListener);
    };
  }, [dispatch]);

  // Actions
  const connect = useCallback(async () => {
    try {
      await dispatch(connectToChatHub()).unwrap();
      // Only fetch threads if connection succeeded
      await dispatch(fetchChatThreads({ pageNumber: 1, pageSize: 50 })).unwrap();
    } catch (error) {
      // Connection failed (e.g., no token) - don't fetch threads
      console.debug('[useChat] Connection failed, skipping thread fetch:', error);
    }
  }, [dispatch]);

  const disconnect = useCallback(async () => {
    await dispatch(disconnectFromChatHub()).unwrap();
  }, [dispatch]);

  const openChat = useCallback(
    (threadId?: string) => {
      dispatch(openDrawer());
      if (threadId) {
        dispatch(setActiveThread(threadId));
        void dispatch(joinChatThread(threadId));
      }
    },
    [dispatch]
  );

  const closeChat = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const toggleChat = useCallback(() => {
    dispatch(toggleDrawer());
  }, [dispatch]);

  const joinThread = useCallback(
    async (threadId: string) => {
      await dispatch(joinChatThread(threadId)).unwrap();
    },
    [dispatch]
  );

  const refreshThreads = useCallback(async () => {
    await dispatch(fetchChatThreads({ pageNumber: 1, pageSize: 50 })).unwrap();
  }, [dispatch]);

  // Utilities
  const generateThreadId = useCallback((userId1: string, userId2: string, skillId?: string) => {
    const sortedIds = [userId1, userId2].sort();
    return skillId
      ? `${sortedIds[0]}:${sortedIds[1]}:${skillId}`
      : `${sortedIds[0]}:${sortedIds[1]}`;
  }, []);

  const openChatWithUser = useCallback(
    (userId: string, _userName: string, skillId?: string, _skillName?: string) => {
      // Get current user ID from JWT token
      const currentUserId = getUserIdFromToken();
      if (!currentUserId) {
        console.warn('Cannot open chat: No current user (no valid token)');
        return;
      }

      // Generate thread ID (this matches the backend algorithm)
      const threadId = generateThreadId(currentUserId, userId, skillId);

      // Dispatch CustomEvent - ChatButton handles connection and drawer opening
      window.dispatchEvent(new CustomEvent('openChat', { detail: { threadId } }));
    },
    [generateThreadId]
  );

  return {
    // State
    isConnected,
    totalUnreadCount,
    isDrawerOpen,
    activeThreadId,
    threads,

    // Actions
    connect,
    disconnect,
    openChat,
    closeChat,
    toggleChat,
    joinThread,
    refreshThreads,

    // Utilities
    generateThreadId,
    openChatWithUser,
  };
};

export default useChat;
