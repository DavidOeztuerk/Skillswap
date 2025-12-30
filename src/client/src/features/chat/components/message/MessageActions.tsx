import React, { useState, useCallback } from 'react';
import {
  Reply as ReplyIcon,
  EmojiEmotions as EmojiIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Popover, useTheme } from '@mui/material';
import { useAppDispatch } from '../../../../core/store/store.hooks';
import ConfirmDialog from '../../../../shared/components/ui/ConfirmDialog';
import { setReplyToMessage, setEditingMessage } from '../../store/chatSlice';
import { toggleMessageReaction, deleteMessage } from '../../store/chatThunks';
import type { ChatMessageModel } from '../../types/Chat';

// Quick reactions for popup
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export interface MessageActionsProps {
  /** The message this action bar belongs to */
  message: ChatMessageModel;
  /** Whether this is the current user's message */
  isOwn: boolean;
  /** Whether the actions are visible */
  visible: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({ message, isOwn, visible }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [reactionAnchor, setReactionAnchor] = useState<HTMLButtonElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reaction handlers
  const handleReactionPopup = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setReactionAnchor(event.currentTarget);
  };

  const handleReactionClose = (): void => {
    setReactionAnchor(null);
  };

  const handleQuickReaction = (emoji: string): void => {
    void dispatch(toggleMessageReaction({ messageId: message.id, emoji }));
    handleReactionClose();
  };

  // Reply handler
  const handleReply = useCallback((): void => {
    dispatch(setReplyToMessage(message));
  }, [dispatch, message]);

  // Copy message handler
  const handleCopyMessage = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, [message.content]);

  // Edit message handler
  const handleEditMessage = useCallback((): void => {
    dispatch(setEditingMessage(message));
  }, [dispatch, message]);

  // Delete message handlers
  const handleDeleteMessage = useCallback((): void => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback((): void => {
    void dispatch(deleteMessage({ messageId: message.id, threadId: message.threadId }));
    setShowDeleteConfirm(false);
  }, [dispatch, message.id, message.threadId]);

  const handleCancelDelete = useCallback((): void => {
    setShowDeleteConfirm(false);
  }, []);

  if (!visible) return null;

  // Own messages: only edit/delete actions
  // Other messages: react, reply, copy actions
  return (
    <>
      {/* Hover actions toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          boxShadow: 1,
          p: 0.25,
        }}
      >
        {isOwn ? (
          // Own messages: Edit and Delete only
          <>
            {!message.isDeleted && (
              <Tooltip title="Bearbeiten">
                <IconButton size="small" onClick={handleEditMessage}>
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            {!message.isDeleted && (
              <Tooltip title="Löschen">
                <IconButton size="small" onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </>
        ) : (
          // Other messages: React, Reply, Copy
          <>
            <Tooltip title="Reagieren">
              <IconButton size="small" onClick={handleReactionPopup}>
                <EmojiIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Antworten">
              <IconButton size="small" onClick={handleReply}>
                <ReplyIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={copied ? 'Kopiert!' : 'Kopieren'}>
              <IconButton
                size="small"
                onClick={() => {
                  void handleCopyMessage();
                }}
              >
                <CopyIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Reaction Popover */}
      <Popover
        open={Boolean(reactionAnchor)}
        anchorEl={reactionAnchor}
        onClose={handleReactionClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ display: 'flex', gap: 0.5, p: 1 }}>
          {QUICK_REACTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => {
                handleQuickReaction(emoji);
              }}
              sx={{
                fontSize: 20,
                '&:hover': { transform: 'scale(1.2)' },
                transition: 'transform 0.1s',
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Nachricht löschen"
        message="Möchtest du diese Nachricht wirklich löschen?"
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmColor="error"
      />
    </>
  );
};

export default MessageActions;
