/**
 * ChatConversation Component - Microsoft Teams Style
 * Displays the active chat conversation with messages
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  Info as InfoIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  useTheme,
  Chip,
  Skeleton,
  alpha,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { selectAuthUser } from '../../auth/store/authSelectors';
import { fetchChatMessages, markMessagesAsRead } from '../store/chatThunks';
import {
  selectActiveThread,
  selectActiveThreadMessages,
  selectMessagesLoading,
  selectActiveThreadTypingIndicator,
} from '../store/selectors/chatSelectors';
import { ChatE2EEStatusHeader } from './ChatE2EeIndicator';
import ChatMessageBubble from './ChatMessageBubble';
import ChatMessageInput from './ChatMessageInput';
import type { ChatE2EEStatus, ChatMessageModel } from '../types/Chat';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const dateSeparatorContainerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  py: 2,
};

const typingIndicatorContainerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 2,
  py: 1,
};

const typingDotBaseSx: SxProps<Theme> = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  animation: 'typing-bounce 1.4s infinite ease-in-out',
  '@keyframes typing-bounce': {
    '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
    '40%': { transform: 'scale(1)', opacity: 1 },
  },
};

const mainContainerSx: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
};

const notFoundContainerSx: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarSx: SxProps<Theme> = {
  width: 40,
  height: 40,
};

const headerFlexSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
};

const headerNameContainerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const headerNameSx: SxProps<Theme> = {
  fontWeight: 600,
};

const lockIconSx: SxProps<Theme> = {
  fontSize: 16,
  color: 'text.disabled',
};

const headerActionsSx: SxProps<Theme> = {
  display: 'flex',
  gap: 0.5,
};

const messagesPaddingSx: SxProps<Theme> = {
  pt: 2,
};

const emptyMessagesSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  py: 4,
};

const lockedIconSx: SxProps<Theme> = {
  fontSize: 18,
  color: 'warning.main',
};

// ============================================================================
// Types
// ============================================================================

interface ChatConversationProps {
  threadId: string;
  onBack?: () => void;
}

// ============================================================================
// Date Separator Component
// ============================================================================

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const theme = useTheme();
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Heute';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    }
    return d.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [date]);

  return (
    <Box sx={dateSeparatorContainerSx}>
      <Chip
        label={formattedDate}
        size="small"
        sx={{
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          fontSize: 11,
          fontWeight: 500,
        }}
      />
    </Box>
  );
};

// ============================================================================
// Typing Indicator Component
// ============================================================================

interface TypingIndicatorProps {
  userName: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  const theme = useTheme();

  return (
    <Box sx={typingIndicatorContainerSx}>
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          backgroundColor: alpha(theme.palette.action.selected, 0.5),
          borderRadius: 2,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              ...typingDotBaseSx,
              backgroundColor: theme.palette.text.secondary,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {userName} schreibt...
      </Typography>
    </Box>
  );
};

// ============================================================================
// Skeleton widths for loading state (pre-computed to avoid impure function in render)
// ============================================================================

const SKELETON_WIDTHS = ['55%', '70%', '45%', '60%'];

// ============================================================================
// Main ChatConversation Component
// ============================================================================

const ChatConversation: React.FC<ChatConversationProps> = ({ threadId, onBack }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selectors
  const thread = useAppSelector(selectActiveThread);
  const messages = useAppSelector(selectActiveThreadMessages);
  const isLoading = useAppSelector(selectMessagesLoading);
  const typingIndicator = useAppSelector(selectActiveThreadTypingIndicator);
  const currentUser = useAppSelector(selectAuthUser);

  // Fetch messages on mount
  useEffect(() => {
    if (threadId) {
      void dispatch(fetchChatMessages({ threadId }));
      void dispatch(markMessagesAsRead(threadId));
    }
  }, [threadId, dispatch]);

  // Scroll to bottom on new messages OR when typing indicator appears
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingIndicator?.isTyping]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessageModel[] }[] = [];
    let currentDate = '';

    messages.forEach((message: ChatMessageModel) => {
      const messageDate = new Date(message.createdAt).toDateString();
      if (messageDate === currentDate) {
        const lastGroup = groups.at(-1);
        if (lastGroup) {
          lastGroup.messages.push(message);
        }
      } else {
        currentDate = messageDate;
        groups.push({ date: message.createdAt, messages: [message] });
      }
    });

    return groups;
  }, [messages]);

  // Calculate E2EE status from messages
  const e2eeStats = useMemo(() => {
    let encrypted = 0;
    let decrypted = 0;

    messages.forEach((message: ChatMessageModel) => {
      if (message.isEncrypted) {
        // If we can read the content, it's been decrypted
        if (message.content && message.content.length > 0) {
          decrypted++;
        } else {
          encrypted++;
        }
      }
    });

    const hasEncryptedMessages = encrypted > 0 || decrypted > 0;
    const status: ChatE2EEStatus = hasEncryptedMessages ? 'active' : 'disabled';

    return {
      status,
      isActive: hasEncryptedMessages,
      messagesEncrypted: encrypted,
      messagesDecrypted: decrypted,
      verificationFailures: 0,
    };
  }, [messages]);

  // Check if message is from current user
  const isOwnMessage = useCallback(
    (senderId: string) => senderId === currentUser?.id,
    [currentUser?.id]
  );

  // Helper function to render messages content (extracted to avoid nested ternaries)
  const renderMessagesContent = (): React.ReactNode => {
    if (isLoading) {
      return (
        <Box sx={messagesPaddingSx}>
          {[1, 2, 3, 4].map((i, index) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                gap: 1,
                mb: 2,
                justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
              }}
            >
              {i % 2 !== 0 && <Skeleton variant="circular" width={32} height={32} />}
              <Skeleton
                variant="rounded"
                width={SKELETON_WIDTHS[index]}
                height={50}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>
      );
    }

    if (messages.length === 0) {
      return (
        <Box sx={emptyMessagesSx}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Noch keine Nachrichten
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Sende die erste Nachricht, um die Konversation zu starten.
          </Typography>
          {/* Show typing indicator even in empty state */}
          {typingIndicator?.isTyping === true && (
            <Box sx={{ mt: 2 }}>
              <TypingIndicator userName={typingIndicator.userName} />
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box sx={messagesPaddingSx}>
        {groupedMessages.map((group) => (
          <React.Fragment key={group.date}>
            <DateSeparator date={group.date} />
            {group.messages.map((message, index) => {
              const isOwn = isOwnMessage(message.senderId);
              const showAvatar =
                !isOwn && (index === 0 || group.messages[index - 1].senderId !== message.senderId);

              return (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  currentUserId={currentUser?.id ?? ''}
                />
              );
            })}
          </React.Fragment>
        ))}
        {typingIndicator?.isTyping === true && (
          <TypingIndicator userName={typingIndicator.userName} />
        )}
        <div ref={messagesEndRef} />
      </Box>
    );
  };

  if (!thread) {
    return (
      <Box sx={notFoundContainerSx}>
        <Typography color="text.secondary">Chat nicht gefunden</Typography>
      </Box>
    );
  }

  const { otherParticipantAvatarUrl, otherParticipantName, skillName, isLocked } = thread;

  return (
    <Box sx={mainContainerSx}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {onBack ? (
          <IconButton onClick={onBack} size="small" sx={{ mr: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
        ) : null}
        <Avatar src={otherParticipantAvatarUrl} alt={otherParticipantName} sx={avatarSx}>
          {otherParticipantName?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={headerFlexSx}>
          <Box sx={headerNameContainerSx}>
            <Typography variant="subtitle1" sx={headerNameSx} noWrap>
              {otherParticipantName}
            </Typography>
            {isLocked ? (
              <Tooltip title="Chat gesperrt">
                <LockIcon sx={lockIconSx} />
              </Tooltip>
            ) : null}
          </Box>
          {skillName ? (
            <Typography variant="caption" color="text.secondary" noWrap>
              {skillName}
            </Typography>
          ) : null}
        </Box>
        <Box sx={headerActionsSx}>
          <Tooltip title="Videoanruf starten">
            <IconButton size="small" disabled={isLocked}>
              <VideocamIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chat-Info">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      {/* E2EE Status Header */}
      <ChatE2EEStatusHeader
        status={e2eeStats.status}
        isActive={e2eeStats.isActive}
        messagesEncrypted={e2eeStats.messagesEncrypted}
        messagesDecrypted={e2eeStats.messagesDecrypted}
        verificationFailures={e2eeStats.verificationFailures}
      />

      {/* Messages Container */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: alpha(theme.palette.background.default, 0.3),
          px: 2,
        }}
      >
        {renderMessagesContent()}
      </Box>

      {/* Locked Chat Notice */}
      {isLocked ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: 1.5,
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <LockIcon sx={lockedIconSx} />
          <Typography variant="body2" color="warning.main">
            Dieser Chat ist gesperrt
          </Typography>
        </Box>
      ) : null}

      {/* Message Input */}
      {!isLocked && <ChatMessageInput threadId={threadId} disabled={isLocked} />}
    </Box>
  );
};

export default ChatConversation;
