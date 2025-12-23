/**
 * ChatMessageInput Component
 * Rich text input with toolbar for code, GIFs, emojis, and attachments
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachIcon,
  Code as CodeIcon,
  Gif as GifIcon,
  Close as CloseIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import {
  Box,
  TextField,
  IconButton,
  Popover,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { selectAuthUser } from '../../auth/store/authSelectors';
import { chatHubService } from '../services/chatHub';
import { clearMessageContext } from '../store/chatSlice';
import {
  selectReplyToMessage,
  selectMessagesSending,
  selectChatConnectionStatus,
} from '../store/selectors/chatSelectors';
import type { ChatMessageModel } from '../types/Chat';

// ============================================================================
// Types
// ============================================================================

interface ChatMessageInputProps {
  threadId: string;
  disabled?: boolean;
}

interface EmojiData {
  native: string;
}

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const codeEditorContainerSx: SxProps<Theme> = {
  p: 2,
};

const codeEditorHeaderSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 1,
};

const languageSelectSx: SxProps<Theme> = {
  minWidth: 120,
};

const codeTextFieldSx: SxProps<Theme> = {
  '& .MuiInputBase-input': {
    fontFamily: 'monospace',
    fontSize: 13,
  },
};

const codeEditorActionsSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 1,
  mt: 1,
};

const mainInputContainerSx: SxProps<Theme> = {
  p: 1.5,
};

const toolbarSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  mb: 1,
};

const toolbarDividerSx: SxProps<Theme> = {
  mx: 0.5,
};

const inputRowSx: SxProps<Theme> = {
  display: 'flex',
  gap: 1,
  alignItems: 'flex-end',
};

const connectionWarningSx: SxProps<Theme> = {
  mt: 0.5,
  display: 'block',
};

const emojiPopoverOrigin = {
  anchorOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
  transformOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
};

// Helper to get input placeholder text
const getPlaceholderText = (isDisabled: boolean, hasReply: boolean): string => {
  if (isDisabled) return 'Chat ist gesperrt';
  if (hasReply) return 'Antwort schreiben...';
  return 'Nachricht schreiben...';
};

// Code language options
const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'plaintext', label: 'Plain Text' },
];

// ============================================================================
// Reply Preview Component
// ============================================================================

interface ReplyPreviewProps {
  message: ChatMessageModel;
  onClose: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onClose }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderLeft: `3px solid ${theme.palette.primary.main}`,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderRadius: '0 4px 4px 0',
      }}
    >
      <ReplyIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
          Antwort auf {message.senderName}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {message.content.slice(0, 100)}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
};

// ============================================================================
// Code Editor Mode Component
// ============================================================================

interface CodeEditorProps {
  onSubmit: (code: string, language: string) => void;
  onCancel: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ onSubmit, onCancel }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const handleSubmit = (): void => {
    if (code.trim()) {
      onSubmit(code.trim(), language);
      setCode('');
    }
  };

  return (
    <Box sx={codeEditorContainerSx}>
      <Box sx={codeEditorHeaderSx}>
        <Typography variant="subtitle2">Code-Block einfügen</Typography>
        <FormControl size="small" sx={languageSelectSx}>
          <InputLabel>Sprache</InputLabel>
          <Select
            value={language}
            label="Sprache"
            onChange={(e) => {
              setLanguage(e.target.value);
            }}
          >
            {CODE_LANGUAGES.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TextField
        multiline
        rows={6}
        fullWidth
        placeholder="Code hier einfügen..."
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
        }}
        sx={codeTextFieldSx}
      />
      <Box sx={codeEditorActionsSx}>
        <Chip label="Abbrechen" onClick={onCancel} />
        <Chip label="Einfügen" color="primary" onClick={handleSubmit} disabled={!code.trim()} />
      </Box>
    </Box>
  );
};

// ============================================================================
// Main ChatMessageInput Component
// ============================================================================

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({ threadId, disabled }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [message, setMessage] = useState('');
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLButtonElement | null>(null);
  const [codeMode, setCodeMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Selectors
  const replyToMessage = useAppSelector(selectReplyToMessage);
  const isSending = useAppSelector(selectMessagesSending);
  const isConnected = useAppSelector(selectChatConnectionStatus);
  const currentUser = useAppSelector(selectAuthUser);

  // Typing indicator effect
  const isTypingRef = useRef(false);

  useEffect(() => {
    // Sync ref with state inside effect (not during render)
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    const shouldStartTyping = Boolean(message) && !isTypingRef.current;
    if (shouldStartTyping) {
      requestAnimationFrame(() => setIsTyping(true));
      chatHubService.sendTyping(threadId, true);
    }

    const stopTyping = (): void => {
      requestAnimationFrame(() => setIsTyping(false));
      chatHubService.sendTyping(threadId, false);
    };

    const timer = setTimeout(() => {
      if (isTypingRef.current) stopTyping();
    }, 2000);

    return () => clearTimeout(timer);
  }, [message, threadId]);

  // Handlers
  const handleSend = useCallback(async () => {
    if (!message.trim() || !isConnected || !currentUser) return;

    const content = message.trim();
    setMessage('');

    // Clear reply context before sending
    if (replyToMessage) {
      dispatch(clearMessageContext());
    }

    // Send via SignalR - server will echo the message back via NewMessage event
    try {
      await chatHubService.sendMessage({
        threadId,
        content,
        replyToMessageId: replyToMessage?.id,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }

    // Stop typing indicator
    chatHubService.sendTyping(threadId, false);
    setIsTyping(false);
  }, [message, threadId, replyToMessage, isConnected, currentUser, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  const handleEmojiSelect = useCallback((emoji: EmojiData) => {
    setMessage((prev) => prev + emoji.native);
    setEmojiAnchor(null);
    inputRef.current?.focus();
  }, []);

  const handleCodeSubmit = useCallback(
    async (code: string, language: string) => {
      if (!isConnected) return;

      setCodeMode(false);

      try {
        await chatHubService.sendCodeMessage(threadId, code, language);
      } catch (error) {
        console.error('Failed to send code:', error);
      }
    },
    [threadId, isConnected]
  );

  return (
    <Box
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Reply Preview */}
      {replyToMessage ? (
        <ReplyPreview message={replyToMessage} onClose={() => dispatch(clearMessageContext())} />
      ) : null}

      {/* Code Editor Mode */}
      {codeMode ? (
        <CodeEditor
          onSubmit={(code, lang) => {
            void handleCodeSubmit(code, lang);
          }}
          onCancel={() => {
            setCodeMode(false);
          }}
        />
      ) : (
        <Box sx={mainInputContainerSx}>
          {/* Toolbar */}
          <Box sx={toolbarSx}>
            <Tooltip title="Emoji">
              <IconButton
                size="small"
                onClick={(e) => {
                  setEmojiAnchor(e.currentTarget);
                }}
                disabled={disabled}
              >
                <EmojiIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code-Block">
              <IconButton
                size="small"
                onClick={() => {
                  setCodeMode(true);
                }}
                disabled={disabled}
              >
                <CodeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="GIF (bald verfügbar)">
              <span>
                <IconButton size="small" disabled>
                  <GifIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Datei anhängen (bald verfügbar)">
              <span>
                <IconButton size="small" disabled>
                  <AttachIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={toolbarDividerSx} />
            <Tooltip title="Fett">
              <IconButton
                size="small"
                onClick={() => {
                  setMessage((prev) => `**${prev}**`);
                }}
                disabled={(disabled ?? false) || !message}
              >
                <BoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Kursiv">
              <IconButton
                size="small"
                onClick={() => {
                  setMessage((prev) => `_${prev}_`);
                }}
                disabled={(disabled ?? false) || !message}
              >
                <ItalicIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Input Field */}
          <Box sx={inputRowSx}>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={4}
              placeholder={getPlaceholderText(disabled ?? false, Boolean(replyToMessage))}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.action.selected, 0.3),
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': {
                    border: `1px solid ${theme.palette.primary.main}`,
                  },
                },
              }}
            />
            <Tooltip title={isConnected ? 'Senden (Enter)' : 'Offline'}>
              <span>
                <IconButton
                  color="primary"
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={!message.trim() || (disabled ?? false) || isSending || !isConnected}
                  sx={{
                    backgroundColor: message.trim() ? theme.palette.primary.main : 'transparent',
                    color: message.trim() ? 'white' : 'inherit',
                    '&:hover': {
                      backgroundColor: message.trim()
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.action.selected, 0.5),
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  {isSending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Connection status */}
          {!isConnected && (
            <Typography variant="caption" color="warning.main" sx={connectionWarningSx}>
              Verbindung wird wiederhergestellt...
            </Typography>
          )}
        </Box>
      )}

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => {
          setEmojiAnchor(null);
        }}
        {...emojiPopoverOrigin}
      >
        <Picker
          data={data as object}
          onEmojiSelect={handleEmojiSelect}
          theme={theme.palette.mode as 'light' | 'dark'}
          locale="de"
          previewPosition="none"
          skinTonePosition="none"
        />
      </Popover>
    </Box>
  );
};

export default ChatMessageInput;
