/**
 * VideoCallChatPanel Component
 *
 * Chat panel for video calls using the shared chat infrastructure with E2EE.
 * Based on InlineChatPanel UI but adapted for video call context.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Send as SendIcon, Close as CloseIcon, Chat as ChatIcon } from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Skeleton,
  Chip,
  useTheme,
  alpha,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppSelector } from '../../../core/store/store.hooks';
import { selectAuthUser } from '../../auth/store/authSelectors';
import { ChatE2EEStatusHeader } from '../../chat/components/ChatE2EeIndicator';
import ChatMessageBubble from '../../chat/components/ChatMessageBubble';
import { useInlineChat } from '../../chat/hooks/useInlineChat';
import type { ChatE2EEStatus } from '../hooks/types';

// ============================================================================
// Sx Styles (extracted for performance)
// ============================================================================

const dateSeparatorSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  py: 1,
};

const typingContainerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 2,
  py: 0.5,
};

const loadingContainerSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  py: 2,
};

const emptyStateSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: 1,
  py: 4,
};

const emptyIconSx: SxProps<Theme> = {
  fontSize: 48,
  color: 'text.disabled',
};

// ============================================================================
// Types
// ============================================================================

export interface VideoCallChatPanelProps {
  /** ThreadId from MatchRequest (SHA256-GUID format) - REQUIRED */
  threadId: string;
  /** Partner user ID */
  peerId: string;
  /** Partner display name */
  peerName: string;
  /** Partner avatar URL */
  peerAvatarUrl?: string;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** E2EE status */
  e2eeStatus?: ChatE2EEStatus;
  /** Whether E2EE is active */
  isE2EEActive?: boolean;
  /** Number of encrypted messages sent */
  messagesEncrypted?: number;
  /** Number of decrypted messages received */
  messagesDecrypted?: number;
  /** Number of verification failures */
  verificationFailures?: number;
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
    <Box sx={dateSeparatorSx}>
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

interface TypingIndicatorDisplayProps {
  userName: string;
}

const TypingIndicatorDisplay: React.FC<TypingIndicatorDisplayProps> = ({ userName }) => {
  const theme = useTheme();

  return (
    <Box sx={typingContainerSx}>
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          '& span': {
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: theme.palette.text.secondary,
            animation: 'typing-bounce 1.4s infinite ease-in-out both',
            '&:nth-of-type(1)': { animationDelay: '-0.32s' },
            '&:nth-of-type(2)': { animationDelay: '-0.16s' },
          },
          '@keyframes typing-bounce': {
            '0%, 80%, 100%': { transform: 'scale(0)' },
            '40%': { transform: 'scale(1)' },
          },
        }}
      >
        <span />
        <span />
        <span />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {userName} tippt...
      </Typography>
    </Box>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const VideoCallChatPanel: React.FC<VideoCallChatPanelProps> = ({
  threadId,
  peerId,
  peerName,
  peerAvatarUrl,
  onClose,
  e2eeStatus = 'disabled',
  isE2EEActive = false,
  messagesEncrypted = 0,
  messagesDecrypted = 0,
  verificationFailures = 0,
}) => {
  const theme = useTheme();
  const currentUser = useAppSelector(selectAuthUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Use shared chat infrastructure with threadId from API (not generated locally)
  const { messages, isLoading, isConnected, typingIndicator, sendMessage, sendTyping } =
    useInlineChat({
      threadId,
      partnerId: peerId,
      partnerName: peerName,
      partnerAvatarUrl: peerAvatarUrl,
      autoConnect: true,
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setInputValue(value);

      if (value.length > 0) {
        sendTyping(true);
      }
    },
    [sendTyping]
  );

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    setInputValue('');
    sendTyping(false);

    await sendMessage(trimmedValue);
    inputRef.current?.focus();
  }, [inputValue, sendMessage, sendTyping]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
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

  // Render messages content
  const renderMessagesContent = (): React.ReactNode => {
    if (isLoading) {
      return (
        <Box sx={loadingContainerSx}>
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
              }}
            >
              {i % 2 !== 0 && <Skeleton variant="circular" width={32} height={32} />}
              <Skeleton
                variant="rounded"
                width={`${40 + i * 10}%`}
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
        <Box sx={emptyStateSx}>
          <ChatIcon sx={emptyIconSx} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Noch keine Nachrichten.
            <br />
            Starte die Unterhaltung!
          </Typography>
          {/* Show typing indicator even in empty state */}
          {typingIndicator?.isTyping === true && typingIndicator.userName ? (
            <Box sx={{ mt: 2 }}>
              <TypingIndicatorDisplay userName={typingIndicator.userName} />
            </Box>
          ) : null}
        </Box>
      );
    }

    return (
      <>
        {groupedMessages.map((group, groupIndex) => (
          <React.Fragment key={group.date || `group-${groupIndex}`}>
            <DateSeparator date={group.date} />
            {group.messages.map((message, index) => {
              const isOwn = message.senderId === currentUser?.id;
              const prevMessage = index > 0 ? group.messages[index - 1] : null;
              const showAvatar = !isOwn && prevMessage?.senderId !== message.senderId;

              return (
                <ChatMessageBubble
                  key={message.id || `msg-${groupIndex}-${index}`}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  currentUserId={currentUser?.id ?? ''}
                />
              );
            })}
          </React.Fragment>
        ))}

        {typingIndicator?.isTyping === true && typingIndicator.userName ? (
          <TypingIndicatorDisplay userName={typingIndicator.userName} />
        ) : null}

        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <Paper
      elevation={4}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: 320,
        height: '100%',
        maxHeight: '100%',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={peerAvatarUrl} sx={{ width: 32, height: 32 }}>
            {peerName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {peerName}
            </Typography>
            {!isConnected && (
              <Chip label="Offline" size="small" color="warning" sx={{ height: 18 }} />
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Chat schließen">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* E2EE Status Header */}
      {e2eeStatus !== 'disabled' && (
        <ChatE2EEStatusHeader
          status={e2eeStatus}
          isActive={isE2EEActive}
          messagesEncrypted={messagesEncrypted}
          messagesDecrypted={messagesDecrypted}
          verificationFailures={verificationFailures}
        />
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 1,
          backgroundColor: theme.palette.background.default,
        }}
      >
        {renderMessagesContent()}
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Nachricht schreiben..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          inputRef={inputRef}
          disabled={!isConnected}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      void handleSend();
                    }}
                    disabled={!inputValue.trim() || !isConnected}
                    size="small"
                    aria-label="Nachricht senden"
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              },
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default VideoCallChatPanel;
