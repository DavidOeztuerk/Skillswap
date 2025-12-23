/**
 * ReplyPreview Component
 * Shows a preview of the message being replied to
 */

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import type { ChatMessageModel } from '../../types/Chat';

export interface ReplyPreviewProps {
  /** The message being replied to */
  replyToMessage: ChatMessageModel;
  /** Maximum content length to display */
  maxLength?: number;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyToMessage, maxLength = 50 }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        mb: 0.5,
        borderLeft: `2px solid ${theme.palette.primary.main}`,
        backgroundColor: alpha(theme.palette.action.selected, 0.3),
        borderRadius: '0 8px 8px 0',
        maxWidth: '100%',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {replyToMessage.senderName}: {replyToMessage.content.slice(0, Math.max(0, maxLength))}
        {replyToMessage.content.length > maxLength ? '...' : ''}
      </Typography>
    </Box>
  );
};

export default ReplyPreview;
