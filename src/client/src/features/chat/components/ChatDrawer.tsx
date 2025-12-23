import React, { useEffect, useCallback, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Chat as ChatIcon,
  Circle as CircleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import {
  Drawer,
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
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import EmptyState from '../../../shared/components/ui/EmptyState';
import {
  setActiveThread,
  setSearchQuery,
  setFilterUnreadOnly,
  closeDrawer,
} from '../store/chatSlice';
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
import ChatConversation from './ChatConversation';
import type { ChatThreadListItem } from '../types/Chat';

const mainContainerSx: SxProps<Theme> = {
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
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

const headerActionsSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

const searchContainerSx: SxProps<Theme> = {
  p: 1.5,
};

const searchIconSx: SxProps<Theme> = {
  color: 'text.secondary',
  fontSize: 20,
};

const searchInputSx: SxProps<Theme> = {
  flex: 1,
  fontSize: 14,
};

const threadListContainerSx: SxProps<Theme> = {
  flex: 1,
  overflow: 'auto',
};

const threadListSx: SxProps<Theme> = {
  pt: 1,
};

const skeletonListItemSx: SxProps<Theme> = {
  px: 2,
  py: 1.5,
};

const primaryRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const secondaryRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mt: 0.25,
};

const typingTextSx: SxProps<Theme> = {
  fontStyle: 'italic',
  flex: 1,
};

const lockIconSx: SxProps<Theme> = {
  fontSize: 14,
  color: 'text.disabled',
};

const emptyConversationIconSx: SxProps<Theme> = {
  fontSize: 64,
  color: 'text.disabled',
  mb: 2,
};

const mobileConversationSx: SxProps<Theme> = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1,
};

const unreadBadgeSx: SxProps<Theme> = {
  '& .MuiBadge-badge': {
    fontSize: 10,
    height: 18,
    minWidth: 18,
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

interface EmptyConversationStateProps {
  bgColor: string;
}

const EmptyConversationState: React.FC<EmptyConversationStateProps> = ({ bgColor }) => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bgColor,
    }}
  >
    <ChatIcon sx={emptyConversationIconSx} />
    <Typography variant="h6" color="text.secondary">
      Wähle einen Chat aus
    </Typography>
    <Typography variant="body2" color="text.disabled">
      um die Konversation zu sehen
    </Typography>
  </Box>
);

const ThreadListSkeleton: React.FC = () => (
  <List>
    {[1, 2, 3, 4, 5].map((i) => (
      <ListItem key={i} sx={skeletonListItemSx}>
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

// ============================================================================
// Types
// ============================================================================

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  initialThreadId?: string;
}

// ============================================================================
// Thread List Item Helpers
// ============================================================================

const OnlineIndicator: React.FC<{ isOnline?: boolean; theme: Theme }> = ({ isOnline, theme }) =>
  isOnline ? (
    <CircleIcon
      sx={{
        width: 12,
        height: 12,
        color: theme.palette.success.main,
        backgroundColor: theme.palette.background.paper,
        borderRadius: '50%',
      }}
    />
  ) : null;

const MessagePreview: React.FC<{ thread: ChatThreadListItem }> = ({ thread }) => {
  if (thread.isTyping) {
    return (
      <Typography variant="body2" color="primary" sx={typingTextSx}>
        Schreibt...
      </Typography>
    );
  }
  const prefix = thread.isLastMessageFromMe ? 'Du: ' : '';
  return (
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
      {prefix}
      {thread.lastMessagePreview ?? 'Keine Nachrichten'}
    </Typography>
  );
};

// ============================================================================
// Thread List Item Component
// ============================================================================

interface ThreadListItemProps {
  thread: ChatThreadListItem;
  isActive: boolean;
  onClick: () => void;
}

const ThreadListItemComponent: React.FC<ThreadListItemProps> = ({ thread, isActive, onClick }) => {
  const theme = useTheme();
  const hasUnread = thread.unreadCount > 0;

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isActive}
        onClick={onClick}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 1,
          mx: 1,
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18) },
          },
        }}
      >
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={<OnlineIndicator isOnline={thread.isOnline} theme={theme} />}
          >
            <Avatar
              src={thread.otherParticipantAvatarUrl}
              alt={thread.otherParticipantName}
              sx={{ width: 44, height: 44, bgcolor: theme.palette.primary.main }}
            >
              {thread.otherParticipantName.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={primaryRowSx}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: hasUnread ? 700 : 500,
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
            <Box sx={secondaryRowSx}>
              <MessagePreview thread={thread} />
              {hasUnread ? (
                <Badge badgeContent={thread.unreadCount} color="primary" sx={unreadBadgeSx} />
              ) : null}
            </Box>
          }
          slotProps={{ secondary: { component: 'div' } }}
        />
      </ListItemButton>
    </ListItem>
  );
};

// ============================================================================
// Thread List Content Component
// ============================================================================

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
  if (isLoading) return <ThreadListSkeleton />;

  if (threads.length === 0) {
    const description = searchQuery
      ? 'Keine Chats gefunden. Versuche eine andere Suche.'
      : 'Starte einen Chat, indem du eine Match-Anfrage akzeptierst.';
    return <EmptyState icon={<ChatIcon />} title="Keine Chats" description={description} />;
  }

  return (
    <List disablePadding sx={threadListSx}>
      {threads.map((thread) => (
        <ThreadListItemComponent
          key={thread.threadId}
          thread={thread}
          isActive={thread.threadId === activeThreadId}
          onClick={() => onThreadClick(thread.threadId)}
        />
      ))}
    </List>
  );
};

// ============================================================================
// Conversation Area Component
// ============================================================================

interface ConversationAreaProps {
  isMobile: boolean;
  isTablet: boolean;
  showConversation: boolean;
  activeThreadId: string | null;
  onBack?: () => void;
  bgColor: string;
  paperBgColor: string;
}

const ConversationArea: React.FC<ConversationAreaProps> = ({
  isMobile,
  isTablet,
  showConversation,
  activeThreadId,
  onBack,
  bgColor,
  paperBgColor,
}) => {
  // Desktop conversation area (not mobile, not tablet)
  const showDesktopArea = (!isMobile || showConversation) && !isTablet;
  // Mobile/tablet conversation area
  const showMobileArea = (isMobile || isTablet) && showConversation && Boolean(activeThreadId);

  if (showDesktopArea) {
    return activeThreadId ? (
      <ChatConversation threadId={activeThreadId} onBack={isMobile ? onBack : undefined} />
    ) : (
      <EmptyConversationState bgColor={bgColor} />
    );
  }

  if (showMobileArea && activeThreadId) {
    return (
      <Box sx={{ ...mobileConversationSx, backgroundColor: paperBgColor }}>
        <ChatConversation threadId={activeThreadId} onBack={onBack} />
      </Box>
    );
  }

  return null;
};

// ============================================================================
// Main ChatDrawer Component
// ============================================================================

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose, initialThreadId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const dispatch = useAppDispatch();

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

  // Effects
  useEffect(() => {
    if (!open) return;
    if (!isConnected) void dispatch(connectToChatHub());
    void dispatch(fetchChatThreads({}));
  }, [open, isConnected, dispatch]);

  useEffect(() => {
    if (!initialThreadId || !open) return;
    void dispatch(joinChatThread(initialThreadId));
    if (isMobile) {
      requestAnimationFrame(() => setShowConversation(true));
    }
  }, [initialThreadId, open, isMobile, dispatch]);

  // Handlers
  const handleThreadClick = useCallback(
    (threadId: string) => {
      dispatch(setActiveThread(threadId));
      void dispatch(joinChatThread(threadId));
      if (isMobile) {
        setShowConversation(true);
      }
    },
    [dispatch, isMobile]
  );

  const handleBackToList = useCallback(() => {
    setShowConversation(false);
  }, []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchQuery(event.target.value));
    },
    [dispatch]
  );

  const handleToggleUnreadFilter = useCallback(() => {
    dispatch(setFilterUnreadOnly(!filterUnreadOnly));
  }, [dispatch, filterUnreadOnly]);

  const handleClose = useCallback(() => {
    dispatch(closeDrawer());
    onClose();
  }, [dispatch, onClose]);

  // Drawer width calculation
  const drawerWidth = isMobile ? '100vw' : isTablet ? 400 : 800;
  const listWidth = isMobile ? '100%' : isTablet ? '100%' : 320;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={mainContainerSx}>
        {/* Thread List Sidebar */}
        {(!isMobile || !showConversation) && (
          <Box
            sx={{
              width: listWidth,
              minWidth: listWidth,
              display: 'flex',
              flexDirection: 'column',
              borderRight: !isMobile && !isTablet ? `1px solid ${theme.palette.divider}` : 'none',
              height: '100%',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                ...headerBoxSx,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={headerTitleBoxSx}>
                <ChatIcon color="primary" />
                <Typography variant="h6" sx={headerTitleSx}>
                  Chats
                </Typography>
                {totalUnreadCount > 0 && (
                  <Chip size="small" label={totalUnreadCount} color="primary" sx={unreadChipSx} />
                )}
              </Box>
              <Box sx={headerActionsSx}>
                {!isConnected && (
                  <Chip
                    size="small"
                    label="Offline"
                    color="warning"
                    variant="outlined"
                    sx={connectionChipSx}
                  />
                )}
                <IconButton onClick={handleClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Search */}
            <Box sx={{ ...searchContainerSx, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: alpha(theme.palette.action.selected, 0.5),
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <SearchIcon sx={searchIconSx} />
                <InputBase
                  placeholder="Chats durchsuchen..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  sx={searchInputSx}
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
            <Box sx={threadListContainerSx}>
              <ThreadListContent
                isLoading={isLoading}
                threads={threads}
                activeThreadId={activeThreadId}
                searchQuery={searchQuery}
                onThreadClick={handleThreadClick}
              />
            </Box>
          </Box>
        )}

        {/* Conversation Area */}
        <ConversationArea
          isMobile={isMobile}
          isTablet={isTablet}
          showConversation={showConversation}
          activeThreadId={activeThreadId}
          onBack={handleBackToList}
          bgColor={alpha(theme.palette.background.default, 0.5)}
          paperBgColor={theme.palette.background.paper}
        />
      </Box>
    </Drawer>
  );
};

export default ChatDrawer;
