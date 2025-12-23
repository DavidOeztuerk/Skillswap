/**
 * InlineChatPanel Component
 * Embeddable chat panel for detail pages (Match, Appointment)
 * Independent of the global ChatDrawer
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Send as SendIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
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
  Collapse,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppSelector } from '../../../core/store/hooks';
import { selectAuthUser } from '../../auth/store/authSelectors';
import { useInlineChat } from '../hooks/useInlineChat';
import { ChatE2EEStatusHeader } from './ChatE2EeIndicator';
import ChatMessageBubble from './ChatMessageBubble';
import type { ChatE2EEStatus } from '../../videocall/hooks/types';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
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

const headerFlexRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
};

const avatarSx: SxProps<Theme> = {
  width: 36,
  height: 36,
};

const headerActionsSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

const offlineChipSx: SxProps<Theme> = {
  ml: 1,
  height: 20,
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

export interface InlineChatPanelProps {
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string;
  skillId?: string;
  skillName?: string;
  height?: number | string;
  onClose?: () => void;
  defaultExpanded?: boolean;
}

// ============================================================================
// Date Separator Component
// ============================================================================

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const theme = useTheme();
  const formattedDate = React.useMemo(() => {
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

const InlineChatPanel: React.FC<InlineChatPanelProps> = ({
  partnerId,
  partnerName,
  partnerAvatarUrl,
  skillId,
  skillName,
  height = 400,
  onClose,
  defaultExpanded = true,
}) => {
  const theme = useTheme();
  const currentUser = useAppSelector(selectAuthUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Use inline chat hook
  const { messages, isLoading, isConnected, typingIndicator, sendMessage, sendTyping } =
    useInlineChat({
      partnerId,
      partnerName,
      partnerAvatarUrl,
      skillId,
      skillName,
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isExpanded]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setInputValue(value);

      // Send typing indicator
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

    // Clear input immediately to prevent double sends from rapid clicks
    setInputValue('');
    sendTyping(false);

    await sendMessage(trimmedValue);

    // Focus input after sending
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
  const groupedMessages = React.useMemo(() => {
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

  // Calculate E2EE status from messages
  const e2eeStats = React.useMemo(() => {
    let encrypted = 0;
    let decrypted = 0;

    messages.forEach((message) => {
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
      verificationFailures: 0, // TODO: Track verification failures when signature verification is implemented
    };
  }, [messages]);

  // Toggle expand/collapse
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Helper function to render messages content (extracted to avoid nested ternaries)
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
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isExpanded ? height : 'auto',
        overflow: 'hidden',
        borderRadius: 2,
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
          cursor: 'pointer',
        }}
        onClick={toggleExpand}
      >
        <Box sx={headerFlexRowSx}>
          <Avatar src={partnerAvatarUrl} sx={avatarSx}>
            {partnerName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {partnerName}
            </Typography>
            {skillName ? (
              <Typography variant="caption" color="text.secondary">
                {skillName}
              </Typography>
            ) : null}
          </Box>
          {!isConnected && <Chip label="Offline" size="small" color="warning" sx={offlineChipSx} />}
        </Box>
        <Box sx={headerActionsSx}>
          {onClose ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : null}
          <IconButton size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* E2EE Status Header */}
      {isExpanded ? (
        <ChatE2EEStatusHeader
          status={e2eeStats.status}
          isActive={e2eeStats.isActive}
          messagesEncrypted={e2eeStats.messagesEncrypted}
          messagesDecrypted={e2eeStats.messagesDecrypted}
          verificationFailures={e2eeStats.verificationFailures}
        />
      ) : null}

      {/* Collapsible Content */}
      <Collapse in={isExpanded}>
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 1,
            height: typeof height === 'number' ? height - 130 : `calc(${height} - 130px)`,
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
      </Collapse>
    </Paper>
  );
};

export default InlineChatPanel;
