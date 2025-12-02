// src/components/videocall/ChatPanel.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  useTheme,
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';
import { ChatMessage } from '../../types/models/ChatMessage';
import { ChatE2EEStatusHeader, MessageE2EEIndicator } from './ChatE2EEIndicator';
import { ChatE2EEStatus } from '../../store/adapters/videoCallAdapter+State';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onClose: () => void;
  currentUserId: string;
  // E2EE Props
  e2eeStatus?: ChatE2EEStatus;
  isE2EEActive?: boolean;
  messagesEncrypted?: number;
  messagesDecrypted?: number;
  verificationFailures?: number;
}

/**
 * Chat-Panel für die Kommunikation während eines Videoanrufs
 */
const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onClose,
  currentUserId,
  e2eeStatus = 'disabled',
  isE2EEActive = false,
  messagesEncrypted = 0,
  messagesDecrypted = 0,
  verificationFailures = 0,
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Beim Hinzufügen neuer Nachrichten zum Ende scrollen
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Gruppiere Nachrichten nach Datum
  const groupedMessages: { [date: string]: ChatMessage[] } = {};

  messages.forEach((message) => {
    const messageDate = new Date(message.sentAt);
    const dateKey = messageDate.toDateString();

    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }

    groupedMessages[dateKey].push(message);
  });

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
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6">Chat</Typography>
        <IconButton onClick={onClose} aria-label="Chat schließen" size="small">
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
        ref={messagesContainerRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {Object.entries(groupedMessages).map(([date, dateMessages], index) => (
          <Box key={date} sx={{ mb: 2 }}>
            {/* Date Divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                mt: index > 0 ? 3 : 0,
              }}
            >
              <Divider sx={{ flexGrow: 1, mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(new Date(date))}
              </Typography>
              <Divider sx={{ flexGrow: 1, ml: 1 }} />
            </Box>

            {/* Messages for this date */}
            <List disablePadding>
              {dateMessages.map((message) => {
                const isCurrentUser = message.senderId === currentUserId;

                return (
                  <ListItem
                    key={message.id}
                    alignItems="flex-start"
                    sx={{
                      flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                      px: 0,
                      py: 0.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        ml: isCurrentUser ? 1 : 0,
                        mr: isCurrentUser ? 0 : 1,
                        bgcolor: isCurrentUser
                          ? 'primary.main'
                          : 'secondary.main',
                        fontSize: '0.875rem',
                      }}
                    >
                      {message.senderName.charAt(0).toUpperCase()}
                    </Avatar>

                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: isCurrentUser
                              ? 'primary.main'
                              : 'background.default',
                            color: isCurrentUser
                              ? 'primary.contrastText'
                              : 'text.primary',
                            borderRadius: 2,
                            display: 'inline-block',
                            maxWidth: '85%',
                            wordBreak: 'break-word',
                            boxShadow: 1,
                          }}
                        >
                          {message.message}
                          {message.isEncrypted && (
                            <MessageE2EEIndicator
                              isEncrypted={message.isEncrypted}
                              isVerified={message.isVerified}
                              variant="icon"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          align={isCurrentUser ? 'right' : 'left'}
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatDate(new Date(message.sentAt), 'HH:mm')}
                        </Typography>
                      }
                      sx={{
                        m: 0,
                        textAlign: isCurrentUser ? 'right' : 'left',
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />

        {/* Empty state for no messages */}
        {messages?.length === 0 && (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              p: 3,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              gutterBottom
            >
              Noch keine Nachrichten
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              Sende eine Nachricht, um den Chat zu starten
            </Typography>
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.default,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex' }}>
          <TextField
            fullWidth
            placeholder="Nachricht schreiben..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            multiline
            maxRows={3}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            aria-label="Nachricht senden"
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatPanel;
