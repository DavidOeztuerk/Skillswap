import React, { useState, useCallback, useRef, useEffect, type JSX } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  ClearAll as ClearAllIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Button,
  Box,
  Divider,
  Tooltip,
  Alert,
  ListItemButton,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationBellProps {
  maxDisplayCount?: number;
  showPreview?: boolean;
  autoMarkAsRead?: boolean;
  playSound?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ maxDisplayCount = 10 }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();

  const audioRef = useRef<HTMLAudioElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use notifications hook
  const {
    notifications,
    unreadCount,
    isLoading,
    error: errorMessage,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useNotifications();

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = useCallback(
    async (notificationId: string): Promise<void> => {
      markAsRead(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);

      // Close menu before navigation
      setAnchorEl(null);

      if (notification?.actionUrl) {
        // Use React Router for internal navigation, window.location for external
        if (notification.actionUrl.startsWith('/')) {
          await navigate(notification.actionUrl);
        } else {
          window.location.href = notification.actionUrl;
        }
      }
    },
    [notifications, markAsRead, navigate]
  );

  const handleMarkAllAsRead = useCallback((): void => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback((): void => {
    clearAll();
    setAnchorEl(null);
  }, [clearAll]);

  const handleDeleteNotification = useCallback(
    (notificationId: string): void => {
      deleteNotification(notificationId);
    },
    [deleteNotification]
  );

  const getNotificationIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'appointment':
        return <StarIcon fontSize="small" color="primary" />;
      case 'match':
        return <CheckIcon fontSize="small" color="success" />;
      case 'warning':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'info':
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  };

  const open = Boolean(anchorEl);
  // Show only unread notifications in the dropdown
  const displayNotifications = notifications.filter((n) => !n.isRead).slice(0, maxDisplayCount);

  return (
    <>
      <Tooltip title="Benachrichtigungen">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                fontWeight: 'bold',
              },
            }}
          >
            {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxHeight: 500,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              mt: 1,
            },
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div">
              Benachrichtigungen
              {unreadCount > 0 && (
                <Chip label={unreadCount} size="small" color="error" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Stack direction="row" spacing={1}>
              {unreadCount > 0 && (
                <Tooltip title="Alle als gelesen markieren">
                  <IconButton size="small" onClick={handleMarkAllAsRead}>
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {notifications.length > 0 && (
                <Tooltip title="Alle löschen">
                  <IconButton size="small" onClick={handleClearAll}>
                    <ClearAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Schließen">
                <IconButton size="small" onClick={handleClose}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : errorMessage ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{errorMessage}</Alert>
            </Box>
          ) : displayNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Keine Benachrichtigungen vorhanden
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {displayNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={async () => {
                        await handleNotificationClick(notification.id);
                      }}
                      sx={{
                        py: 1.5,
                        backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'background.paper' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.isRead ? 'normal' : 'medium',
                              mb: 0.5,
                            }}
                          >
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </Typography>
                          </>
                        }
                      />
                      <Box sx={{ ml: 1 }}>
                        <Tooltip title="Löschen">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  {index < displayNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Show "View All" button - always visible if there are any notifications */}
        {notifications.length > 0 && (
          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="text"
              size="small"
              onClick={() => {
                handleClose();
                void navigate('/notifications');
              }}
            >
              {notifications.length > maxDisplayCount
                ? `Alle ${notifications.length} Benachrichtigungen anzeigen`
                : 'Alle Benachrichtigungen anzeigen'}
            </Button>
          </Box>
        )}
      </Popover>

      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
        <track kind="captions" />
      </audio>
    </>
  );
};

export default NotificationBell;
