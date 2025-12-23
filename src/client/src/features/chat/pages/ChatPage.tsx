import React, { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Chat as ChatIcon,
  Circle as CircleIcon,
  Lock as LockIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  InputBase,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Skeleton,
  Chip,
  Tooltip,
  alpha,
  Paper,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/hooks';
import PageContainer from '../../../shared/components/layout/PageContainer';
import PageHeader from '../../../shared/components/layout/PageHeader';
import EmptyState from '../../../shared/components/ui/EmptyState';
import ChatConversation from '../components/ChatConversation';
import { setActiveThread, setSearchQuery, setFilterUnreadOnly } from '../store/chatSlice';
import { fetchChatThreads, joinChatThread, connectToChatHub } from '../store/chatThunks';
import {
  selectFilteredThreads,
  selectThreadsLoading,
  selectActiveThreadId,
  selectTotalUnreadCount,
  selectChatConnectionStatus,
  selectSearchQuery,
  selectFilterUnreadOnly,
} from '../store/selectors/chatSelectors';
import type { ChatThreadListItem } from '../types/Chat';

const containerSx: SxProps<Theme> = {
  display: 'flex',
  // Account for header (56px mobile, 64px desktop) + padding + tabbar (72px mobile)
  height: {
    xs: 'calc(100vh - 56px - 72px - 32px)',
    sm: 'calc(100vh - 64px - 48px)',
    md: 'calc(100vh - 64px - 48px)',
  },
  minHeight: { xs: 400, sm: 500 },
  overflow: 'hidden',
  borderRadius: { xs: 0, sm: 2 },
};

const headerBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: 2,
};

const headerTitleBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const headerTitleSx: SxProps<Theme> = {
  fontWeight: 600,
};

const unreadChipSx: SxProps<Theme> = {
  height: 20,
  fontSize: 11,
};

const connectionChipSx: SxProps<Theme> = {
  height: 20,
  fontSize: 10,
};

const searchContainerSx: SxProps<Theme> = {
  p: 1.5,
};

const threadListSx: SxProps<Theme> = {
  flex: 1,
  overflow: 'auto',
};

const emptyIconSx: SxProps<Theme> = {
  fontSize: 64,
  color: 'text.disabled',
  mb: 2,
};

interface EmptyConversationProps {
  sx: SxProps<Theme>;
}

const EmptyConversationState: React.FC<EmptyConversationProps> = ({ sx }) => (
  <Box sx={sx}>
    <ChatIcon sx={emptyIconSx} />
    <Typography variant="h6" color="text.secondary">
      Wähle einen Chat aus
    </Typography>
    <Typography variant="body2" color="text.disabled">
      um die Konversation zu sehen
    </Typography>
  </Box>
);

const mobileConversationSx: SxProps<Theme> = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0, // This is relative to the container, which already accounts for tabbar
  zIndex: 1,
};

interface ThreadListItemProps {
  thread: ChatThreadListItem;
  isActive: boolean;
  onClick: () => void;
}

const ThreadListItemComponent: React.FC<ThreadListItemProps> = ({ thread, isActive, onClick }) => {
  const theme = useTheme();

  const listItemButtonSx: SxProps<Theme> = {
    py: 1.5,
    px: 2,
    borderRadius: 1,
    mx: 1,
    mb: 0.5,
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.18),
      },
    },
  };

  const avatarSx: SxProps<Theme> = {
    width: 44,
    height: 44,
    bgcolor: theme.palette.primary.main,
  };

  const onlineIndicatorSx: SxProps<Theme> = {
    width: 12,
    height: 12,
    color: theme.palette.success.main,
    backgroundColor: theme.palette.background.paper,
    borderRadius: '50%',
  };

  const lockIconSx: SxProps<Theme> = {
    fontSize: 14,
    color: 'text.disabled',
  };

  return (
    <ListItem disablePadding>
      <ListItemButton selected={isActive} onClick={onClick} sx={listItemButtonSx}>
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={thread.isOnline ? <CircleIcon sx={onlineIndicatorSx} /> : null}
          >
            <Avatar
              src={thread.otherParticipantAvatarUrl}
              alt={thread.otherParticipantName}
              sx={avatarSx}
            >
              {thread.otherParticipantName.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: thread.unreadCount > 0 ? 700 : 500,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {thread.otherParticipantName}
              </Typography>
              {thread.isLocked ? <LockIcon sx={lockIconSx} /> : null}
              {thread.lastMessageAt ? (
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(thread.lastMessageAt), {
                    addSuffix: false,
                    locale: de,
                  })}
                </Typography>
              ) : null}
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
              {thread.isTyping ? (
                <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', flex: 1 }}>
                  Schreibt...
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: thread.unreadCount > 0 ? 600 : 400,
                  }}
                >
                  {thread.isLastMessageFromMe ? 'Du: ' : null}
                  {thread.lastMessagePreview ?? 'Keine Nachrichten'}
                </Typography>
              )}
              {thread.unreadCount > 0 && (
                <Badge
                  badgeContent={thread.unreadCount}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: 10,
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                />
              )}
            </Box>
          }
          slotProps={{ secondary: { component: 'div' } }}
        />
      </ListItemButton>
    </ListItem>
  );
};

// Thread List Content - extracted to reduce complexity
interface ThreadListContentProps {
  isLoading: boolean;
  threads: ChatThreadListItem[];
  activeThreadId: string | null;
  searchQuery: string;
  onThreadClick: (threadId: string) => void;
}

const ThreadListContent: React.FC<ThreadListContentProps> = ({
  isLoading,
  threads,
  activeThreadId,
  searchQuery,
  onThreadClick,
}) => {
  if (isLoading) {
    return (
      <List>
        {[1, 2, 3, 4, 5].map((i) => (
          <ListItem key={i} sx={{ px: 2, py: 1.5 }}>
            <ListItemAvatar>
              <Skeleton variant="circular" width={44} height={44} />
            </ListItemAvatar>
            <ListItemText
              primary={<Skeleton variant="text" width="60%" />}
              secondary={<Skeleton variant="text" width="80%" />}
            />
          </ListItem>
        ))}
      </List>
    );
  }

  if (threads.length === 0) {
    const description = searchQuery
      ? 'Keine Chats gefunden. Versuche eine andere Suche.'
      : 'Starte einen Chat, indem du eine Match-Anfrage akzeptierst.';
    return <EmptyState icon={<ChatIcon />} title="Keine Chats" description={description} />;
  }

  return (
    <List disablePadding sx={{ pt: 1 }}>
      {threads.map((thread) => (
        <ThreadListItemComponent
          key={thread.threadId}
          thread={thread}
          isActive={thread.threadId === activeThreadId}
          onClick={() => {
            onThreadClick(thread.threadId);
          }}
        />
      ))}
    </List>
  );
};

// ============================================================================
// Main ChatPage Component
// ============================================================================

const ChatPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { threadId: urlThreadId } = useParams<{ threadId?: string }>();

  // Selectors
  const threads = useAppSelector(selectFilteredThreads);
  const isLoading = useAppSelector(selectThreadsLoading);
  const activeThreadId = useAppSelector(selectActiveThreadId);
  const totalUnreadCount = useAppSelector(selectTotalUnreadCount);
  const isConnected = useAppSelector(selectChatConnectionStatus);
  const searchQuery = useAppSelector(selectSearchQuery);
  const filterUnreadOnly = useAppSelector(selectFilterUnreadOnly);

  // Local state for mobile view switching
  const [showConversation, setShowConversation] = useState(false);

  // Dynamic styles
  const listWidth = isMobile ? '100%' : 320;

  const threadListWrapperSx: SxProps<Theme> = {
    width: listWidth,
    minWidth: listWidth,
    display: 'flex',
    flexDirection: 'column',
    borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
    height: '100%',
    bgcolor: theme.palette.background.paper,
  };

  const searchBoxSx: SxProps<Theme> = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    backgroundColor: alpha(theme.palette.action.selected, 0.5),
    borderRadius: 2,
    px: 1.5,
    py: 0.5,
  };

  const conversationAreaSx: SxProps<Theme> = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette.background.default, 0.5),
  };

  // Effects
  useEffect(() => {
    const connectHub = async (): Promise<void> => {
      if (!isConnected) await dispatch(connectToChatHub());
      await dispatch(fetchChatThreads({}));
    };
    connectHub().catch(() => {});
  }, [isConnected, dispatch]);

  useEffect(() => {
    if (!urlThreadId) return;
    const setupThread = async (): Promise<void> => {
      dispatch(setActiveThread(urlThreadId));
      await dispatch(joinChatThread(urlThreadId));
      if (isMobile) requestAnimationFrame(() => setShowConversation(true));
    };
    setupThread().catch(() => {});
  }, [urlThreadId, isMobile, dispatch]);

  // Handlers
  const handleThreadClick = useCallback(
    async (threadId: string) => {
      dispatch(setActiveThread(threadId));
      await dispatch(joinChatThread(threadId));
      await navigate(`/chat/${threadId}`, { replace: true });
      if (isMobile) {
        setShowConversation(true);
      }
    },
    [dispatch, navigate, isMobile]
  );

  const handleBackToList = useCallback(async () => {
    setShowConversation(false);
    await navigate('/chat', { replace: true });
  }, [navigate]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchQuery(event.target.value));
    },
    [dispatch]
  );

  const handleToggleUnreadFilter = useCallback(() => {
    dispatch(setFilterUnreadOnly(!filterUnreadOnly));
  }, [dispatch, filterUnreadOnly]);

  const showBackButton = isMobile && showConversation;
  const onBackClick = (): void => {
    handleBackToList().catch(() => {});
  };
  const headerActions = showBackButton ? (
    <IconButton onClick={onBackClick}>
      <ArrowBackIcon />
    </IconButton>
  ) : undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Nachrichten"
        subtitle="Deine Konversationen"
        icon={<ChatIcon />}
        actions={headerActions}
      />

      <Paper sx={containerSx}>
        {/* Thread List Sidebar */}
        {(!isMobile || !showConversation) && (
          <Box sx={threadListWrapperSx}>
            {/* Header */}
            <Box sx={headerBoxSx}>
              <Box sx={headerTitleBoxSx}>
                <ChatIcon color="primary" />
                <Typography variant="h6" sx={headerTitleSx}>
                  Chats
                </Typography>
                {totalUnreadCount > 0 && (
                  <Chip size="small" label={totalUnreadCount} color="primary" sx={unreadChipSx} />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {!isConnected && (
                  <Chip
                    size="small"
                    label="Offline"
                    color="warning"
                    variant="outlined"
                    sx={connectionChipSx}
                  />
                )}
              </Box>
            </Box>

            {/* Search */}
            <Box sx={searchContainerSx}>
              <Box sx={searchBoxSx}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <InputBase
                  placeholder="Chats durchsuchen..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  sx={{ flex: 1, fontSize: 14 }}
                />
                <Tooltip title={filterUnreadOnly ? 'Alle anzeigen' : 'Nur ungelesene'}>
                  <IconButton
                    size="small"
                    onClick={handleToggleUnreadFilter}
                    color={filterUnreadOnly ? 'primary' : 'default'}
                  >
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Thread List */}
            <Box sx={threadListSx}>
              <ThreadListContent
                isLoading={isLoading}
                threads={threads}
                activeThreadId={activeThreadId}
                searchQuery={searchQuery}
                onThreadClick={(threadId) => {
                  void handleThreadClick(threadId);
                }}
              />
            </Box>
          </Box>
        )}

        {/* Conversation Area - Desktop */}
        {!isMobile && (
          <>
            {activeThreadId ? (
              <ChatConversation threadId={activeThreadId} />
            ) : (
              <EmptyConversationState sx={conversationAreaSx} />
            )}
          </>
        )}

        {/* Mobile Conversation View */}
        {isMobile && showConversation && activeThreadId ? (
          <Box sx={{ ...mobileConversationSx, bgcolor: theme.palette.background.paper }}>
            <ChatConversation
              threadId={activeThreadId}
              onBack={() => {
                void handleBackToList();
              }}
            />
          </Box>
        ) : null}
      </Paper>
    </PageContainer>
  );
};

export default ChatPage;
