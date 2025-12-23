import React, { useState, useCallback } from 'react';
import {
  Reply as ReplyIcon,
  EmojiEmotions as EmojiIcon,
  MoreHoriz as MoreIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
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
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLButtonElement | null>(null);
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

  // More menu handlers
  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = (): void => {
    setMoreMenuAnchor(null);
  };

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
    handleMoreMenuClose();
  }, [message.content]);

  const handleEditMessage = useCallback((): void => {
    dispatch(setEditingMessage(message));
    handleMoreMenuClose();
  }, [dispatch, message]);

  const handleDeleteMessage = useCallback((): void => {
    setShowDeleteConfirm(true);
    handleMoreMenuClose();
  }, []);

  const handleConfirmDelete = useCallback((): void => {
    void dispatch(deleteMessage({ messageId: message.id, threadId: message.threadId }));
    setShowDeleteConfirm(false);
  }, [dispatch, message.id, message.threadId]);

  const handleCancelDelete = useCallback((): void => {
    setShowDeleteConfirm(false);
  }, []);

  if (!visible) return null;

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
        <Tooltip title={copied ? 'Kopiert!' : 'Mehr'}>
          <IconButton size="small" onClick={handleMoreMenuOpen}>
            <MoreIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { minWidth: 160 },
          },
        }}
      >
        {[
          <MenuItem
            key="copy"
            onClick={() => {
              void handleCopyMessage();
            }}
          >
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{copied ? 'Kopiert!' : 'Kopieren'}</ListItemText>
          </MenuItem>,
          isOwn && !message.isDeleted ? (
            <MenuItem key="edit" onClick={handleEditMessage}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Bearbeiten</ListItemText>
            </MenuItem>
          ) : null,
          isOwn && !message.isDeleted ? <Divider key="divider" /> : null,
          isOwn && !message.isDeleted ? (
            <MenuItem key="delete" onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Löschen</ListItemText>
            </MenuItem>
          ) : null,
        ].filter(Boolean)}
      </Menu>

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
