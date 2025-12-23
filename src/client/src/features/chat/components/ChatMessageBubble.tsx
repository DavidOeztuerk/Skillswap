/**
 * ChatMessageBubble Component - Microsoft Teams Style
 * Displays individual chat messages with reactions and actions
 *
 * Refactored to use modular subcomponents for better maintainability.
 */

import React, { useState, useCallback, memo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  InsertDriveFile as FileIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Avatar,
  useTheme,
  alpha,
  Tooltip,
  Link,
  Chip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { type ChatMessageModel, ChatMessageType } from '../types/Chat';
import CodeBlock from './message/CodeBlock';
import MessageActions from './message/MessageActions';
import MessageReactions from './message/MessageReactions';
import ReplyPreview from './message/ReplyPreview';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const systemMessageContainerSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  py: 1,
};

const gifImageSx: SxProps<Theme> = {
  maxWidth: 300,
  maxHeight: 200,
  borderRadius: 1,
  mt: 0.5,
};

const imageAttachmentSx: SxProps<Theme> = {
  maxWidth: 300,
  maxHeight: 200,
  borderRadius: 1,
  mt: 0.5,
  cursor: 'pointer',
};

const textMessageSx: SxProps<Theme> = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const avatarContainerSx: SxProps<Theme> = {
  width: 32,
  flexShrink: 0,
};

const smallAvatarSx: SxProps<Theme> = {
  width: 32,
  height: 32,
};

const bubbleContainerSx: SxProps<Theme> = {
  maxWidth: '70%',
  display: 'flex',
  flexDirection: 'column',
};

const senderNameSx: SxProps<Theme> = {
  fontWeight: 600,
  mb: 0.25,
  ml: 1,
};

const encryptedIconSx: SxProps<Theme> = {
  position: 'absolute',
  top: 4,
  right: 4,
  fontSize: 12,
  opacity: 0.7,
};

const timestampContainerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 0.5,
  mt: 0.5,
};

const timestampSx: SxProps<Theme> = {
  fontSize: 10,
  opacity: 0.7,
};

const statusIconSx: SxProps<Theme> = {
  fontSize: 14,
  opacity: 0.7,
};

// ============================================================================
// Types
// ============================================================================

interface ChatMessageBubbleProps {
  message: ChatMessageModel;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId: string;
}

// ============================================================================
// Content Renderers
// ============================================================================

interface MessageContentProps {
  message: ChatMessageModel;
  isOwn: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ message, isOwn }) => {
  const theme = useTheme();

  // System message
  if (message.messageType === ChatMessageType.System) {
    return (
      <Box sx={systemMessageContainerSx}>
        <Chip
          label={message.content}
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.action.selected, 0.5),
            fontSize: 12,
          }}
        />
      </Box>
    );
  }

  // Code block
  if (message.messageType === ChatMessageType.CodeBlock) {
    return <CodeBlock code={message.content} language={message.codeLanguage} />;
  }

  // GIF
  if (message.messageType === ChatMessageType.GIF && message.gifUrl) {
    return <Box component="img" src={message.gifUrl} alt="GIF" sx={gifImageSx} />;
  }

  // Image attachment
  if (message.messageType === ChatMessageType.Image && message.attachment?.storageUrl) {
    return (
      <Box
        component="img"
        src={message.attachment.storageUrl}
        alt={message.attachment.originalFileName}
        sx={imageAttachmentSx}
      />
    );
  }

  // File attachment
  if (message.messageType === ChatMessageType.File && message.attachment) {
    return (
      <Link
        href={message.attachment.storageUrl}
        target="_blank"
        underline="none"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          mt: 0.5,
          borderRadius: 1,
          backgroundColor: alpha(theme.palette.action.selected, 0.5),
          '&:hover': { backgroundColor: alpha(theme.palette.action.selected, 0.7) },
        }}
      >
        <FileIcon />
        <Box>
          <Typography variant="body2">{message.attachment.originalFileName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(message.attachment.fileSize / 1024)} KB
          </Typography>
        </Box>
      </Link>
    );
  }

  // Default text message with link detection
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.content.split(urlRegex);

  return (
    <Typography variant="body2" sx={textMessageSx}>
      {parts.map((part) =>
        urlRegex.test(part) ? (
          <Link
            key={part}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: isOwn ? 'inherit' : 'primary.main' }}
          >
            {part}
          </Link>
        ) : (
          <React.Fragment key={part}>{part}</React.Fragment>
        )
      )}
    </Typography>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = memo(
  ({ message, isOwn, showAvatar, currentUserId }) => {
    const theme = useTheme();
    const [hovered, setHovered] = useState(false);

    const handleMouseEnter = useCallback(() => {
      setHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setHovered(false);
    }, []);

    // System messages have special styling
    if (message.messageType === ChatMessageType.System) {
      return <MessageContent message={message} isOwn={isOwn} />;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: isOwn ? 'row-reverse' : 'row',
          gap: 1,
          mb: 1,
          px: 1,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Avatar */}
        {!isOwn && (
          <Box sx={avatarContainerSx}>
            {showAvatar ? (
              <Avatar src={message.senderAvatarUrl} alt={message.senderName} sx={smallAvatarSx}>
                {message.senderName.charAt(0).toUpperCase()}
              </Avatar>
            ) : null}
          </Box>
        )}

        {/* Message Bubble */}
        <Box
          sx={{
            ...bubbleContainerSx,
            alignItems: isOwn ? 'flex-end' : 'flex-start',
          }}
        >
          {/* Sender name */}
          {!isOwn && showAvatar ? (
            <Typography variant="caption" sx={senderNameSx}>
              {message.senderName}
            </Typography>
          ) : null}

          {/* Reply preview */}
          {message.replyToMessage ? <ReplyPreview replyToMessage={message.replyToMessage} /> : null}

          {/* Message content bubble */}
          <Box
            sx={{
              position: 'relative',
              px: 1.5,
              py: 1,
              borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              backgroundColor: isOwn
                ? theme.palette.primary.main
                : alpha(theme.palette.action.selected, 0.5),
              color: isOwn ? theme.palette.primary.contrastText : 'inherit',
            }}
          >
            {/* Encrypted indicator */}
            {message.isEncrypted ? (
              <Tooltip title="Ende-zu-Ende verschlüsselt">
                <LockIcon sx={encryptedIconSx} />
              </Tooltip>
            ) : null}

            <MessageContent message={message} isOwn={isOwn} />

            {/* Time and status */}
            <Box sx={timestampContainerSx}>
              <Typography variant="caption" sx={timestampSx}>
                {format(new Date(message.createdAt), 'HH:mm', { locale: de })}
              </Typography>
              {isOwn ? (
                message.isRead ? (
                  <DoneAllIcon sx={statusIconSx} />
                ) : (
                  <DoneIcon sx={statusIconSx} />
                )
              ) : null}
            </Box>
          </Box>

          {/* Reactions */}
          <MessageReactions
            reactions={message.reactions ?? message.reactionsJson}
            currentUserId={currentUserId}
            messageId={message.id}
          />
        </Box>

        {/* Hover actions */}
        <MessageActions message={message} isOwn={isOwn} visible={hovered} />
      </Box>
    );
  }
);

ChatMessageBubble.displayName = 'ChatMessageBubble';

export default ChatMessageBubble;
