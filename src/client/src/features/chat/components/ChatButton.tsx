/**
 * ChatButton Component
 * Floating action button for accessing chat drawer
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chat as ChatIcon } from '@mui/icons-material';
import { Fab, Badge, Tooltip, Zoom, useTheme, useMediaQuery } from '@mui/material';
import { useAppSelector } from '../../../core/store/store.hooks';
import { selectAuthUser } from '../../auth/store/authSelectors';
import { useChat } from '../hooks/useChat';
import ChatDrawer from './ChatDrawer';

// ============================================================================
// Types
// ============================================================================

interface ChatButtonProps {
  position?: 'fixed' | 'absolute';
  bottom?: number;
  right?: number;
}

// ============================================================================
// Component
// ============================================================================

const ChatButton: React.FC<ChatButtonProps> = ({ position = 'fixed', bottom = 24, right = 24 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    totalUnreadCount,
    isDrawerOpen,
    isConnected: _isConnected,
    openChat,
    closeChat,
    connect,
  } = useChat();
  const currentUser = useAppSelector(selectAuthUser);

  const [initialThreadId, setInitialThreadId] = useState<string | undefined>();
  const hasConnectedRef = useRef(false);

  // Handle open chat events from other components
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<{ threadId?: string }>): void => {
      if (event.detail.threadId) {
        setInitialThreadId(event.detail.threadId);
      }
      // Connect on first open if not already connected
      if (!hasConnectedRef.current && currentUser?.id) {
        hasConnectedRef.current = true;
        void connect();
      }
      openChat(event.detail.threadId);
    };

    window.addEventListener('openChat', handleOpenChat as EventListener);

    return () => {
      window.removeEventListener('openChat', handleOpenChat as EventListener);
    };
  }, [openChat, connect, currentUser?.id]);

  const handleClick = useCallback((): void => {
    if (isDrawerOpen) {
      closeChat();
    } else {
      // Connect on first open if not already connected
      if (!hasConnectedRef.current && currentUser?.id) {
        hasConnectedRef.current = true;
        void connect();
      }
      openChat();
    }
  }, [isDrawerOpen, openChat, closeChat, connect, currentUser?.id]);

  const handleClose = useCallback((): void => {
    closeChat();
    setInitialThreadId(undefined);
  }, [closeChat]);

  // Don't render if not authenticated
  if (!currentUser?.id) {
    return null;
  }

  return (
    <>
      <Zoom in>
        <Tooltip title="Chat öffnen" placement="left">
          <Badge
            badgeContent={totalUnreadCount}
            color="error"
            max={99}
            overlap="circular"
            sx={{
              position,
              bottom: isMobile ? bottom + 56 : bottom, // Account for mobile tabbar
              right,
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <Fab
              color="primary"
              onClick={handleClick}
              aria-label="Chat"
              sx={{
                boxShadow: theme.shadows[4],
                '&:hover': {
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <ChatIcon />
            </Fab>
          </Badge>
        </Tooltip>
      </Zoom>

      <ChatDrawer open={isDrawerOpen} onClose={handleClose} initialThreadId={initialThreadId} />
    </>
  );
};

export default ChatButton;
