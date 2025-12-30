/**
 * MessageReactions Component
 * Displays emoji reactions on a chat message
 */

import React, { useMemo } from 'react';
import { Box, Chip, useTheme, alpha } from '@mui/material';
import { useAppDispatch } from '../../../../core/store/store.hooks';
import { toggleMessageReaction } from '../../store/chatThunks';
import { parseReactions } from '../../types/Chat';

export interface MessageReactionsProps {
  /** Reactions data - either JSON string or parsed object */
  reactions?: string | Record<string, string[]>;
  /** Current user's ID to highlight their reactions */
  currentUserId: string;
  /** Message ID for toggling reactions */
  messageId: string;
  /** Whether this is the current user's own message (reactions disabled) */
  isOwn?: boolean;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions: reactionsData,
  currentUserId,
  messageId,
  isOwn = false,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { reactions, userReactions } = useMemo(
    () => parseReactions(reactionsData, currentUserId),
    [reactionsData, currentUserId]
  );

  if (reactions.length === 0) return null;

  const handleReactionClick = (emoji: string): void => {
    // Don't allow reacting to own messages
    if (isOwn) return;
    void dispatch(toggleMessageReaction({ messageId, emoji }));
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
      {reactions.map((reaction) => (
        <Chip
          key={reaction.emoji}
          label={`${reaction.emoji} ${reaction.count}`}
          size="small"
          onClick={() => {
            handleReactionClick(reaction.emoji);
          }}
          sx={{
            height: 22,
            fontSize: 12,
            backgroundColor: userReactions.includes(reaction.emoji)
              ? alpha(theme.palette.primary.main, 0.2)
              : alpha(theme.palette.action.selected, 0.5),
            border: userReactions.includes(reaction.emoji)
              ? `1px solid ${theme.palette.primary.main}`
              : 'none',
            // Show pointer cursor only if not own message
            cursor: isOwn ? 'default' : 'pointer',
            '&:hover': {
              backgroundColor: isOwn ? undefined : alpha(theme.palette.primary.main, 0.3),
            },
          }}
        />
      ))}
    </Box>
  );
};

export default MessageReactions;
