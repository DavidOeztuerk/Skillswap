import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IconButton,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Zoom,
  Popover,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Circle as CircleIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  DeleteSweep as ClearAllIcon,
  Settings as SettingsIcon,
  Event as EventIcon,
  Message as MessageIcon,
  Handshake as MatchIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  subscribeToRealTimeNotifications,
  unsubscribeFromRealTimeNotifications,
} from '../../features/notifications/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface NotificationBellProps {
  maxDisplayCount?: number;
  showPreview?: boolean;
  autoMarkAsRead?: boolean;
  playSound?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  maxDisplayCount = 5,
  showPreview = true,
  autoMarkAsRead = false,
  playSound = true,
}) => {
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showingPreview, setShowingPreview] = useState<string | null>(null);
  const [soundEnabled] = useState(playSound);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
  } = useAppSelector((state) => state.notifications);

  const { user } = useAppSelector((state) => state.auth);

  const prevUserIdRef = useRef<string>("");

useEffect(() => {
  if (!user?.id || prevUserIdRef.current === user.id) return;

  prevUserIdRef.current = user.id;
  dispatch(fetchNotifications());
  dispatch(subscribeToRealTimeNotifications(user.id));

  return () => {
    dispatch(unsubscribeFromRealTimeNotifications());
  };
}, [user?.id, dispatch]);

  // Handle new notification sound and preview
  const lastNotification = notifications[0];
  
  useEffect(() => {
    if (lastNotification && lastNotification.id !== showingPreview) {
      // Play notification sound
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch((error) => {
          // Silently handle audio play errors (e.g., missing file, user interaction required)
          if (error.name !== 'NotSupportedError' && error.name !== 'NotAllowedError') {
            console.warn('Notification sound failed to play:', error);
          }
        });
      }

      // Show preview if enabled
      if (showPreview && !anchorEl) {
        setShowingPreview(lastNotification.id);
        
        // Auto-hide preview after 5 seconds
        previewTimeoutRef.current = setTimeout(() => {
          setShowingPreview(null);
        }, 5000);
      }

      // Auto-mark as read if enabled
      if (autoMarkAsRead) {
        setTimeout(() => {
          dispatch(markNotificationAsRead(lastNotification.id));
        }, 3000);
      }
    }
  }, [lastNotification, soundEnabled, showPreview, autoMarkAsRead, anchorEl, showingPreview, dispatch]);

  const handleBellClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // Hide preview when opening main menu
    setShowingPreview(null);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleNotificationClick = useCallback((notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId));
    // Handle navigation based on notification type
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }, [dispatch, notifications]);

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(clearAllNotifications());
    setAnchorEl(null);
  }, [dispatch]);

  const handleDeleteNotification = useCallback((notificationId: string) => {
    dispatch(deleteNotification(notificationId));
  }, [dispatch]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <EventIcon color="primary" />;
      case 'message':
        return <MessageIcon color="info" />;
      case 'match':
        return <MatchIcon color="success" />;
      case 'rating':
        return <StarIcon color="warning" />;
      case 'system':
        return <InfoIcon color="action" />;
      case 'warning':
        return <WarningIcon color="error" />;
      default:
        return <PersonIcon color="action" />;
    }
  };


  const handlePreviewClose = () => {
    setShowingPreview(null);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
  };

  const recentNotifications = notifications.slice(0, maxDisplayCount);
  const hasMoreNotifications = notifications?.length > maxDisplayCount;

  return (
    <>
      {/* Hidden audio element for notification sounds */}
      <audio
        ref={audioRef}
        preload="auto"
        src="/sounds/notification.mp3" // Add notification sound file to public/sounds/
      />

      {/* Notification Bell */}
      <Tooltip 
        title={`${unreadCount} neue Benachrichtigungen`}
      >
        <IconButton
          color="inherit"
          onClick={handleBellClick}
          aria-label={`${unreadCount} ungelesene Benachrichtigungen`}
          sx={{
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' },
            },
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            max={99}
          >
            {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notification Preview Popup */}
      {showingPreview && lastNotification && (
        <Zoom in={true}>
          <Paper
            sx={{
              position: 'fixed',
              top: 70,
              right: 20,
              width: 350,
              maxWidth: '90vw',
              zIndex: 9999,
              border: '2px solid',
              borderColor: 'primary.main',
            }}
            elevation={8}
          >
            <Alert
              severity="info"
              action={
                <IconButton
                  size="small"
                  onClick={handlePreviewClose}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {lastNotification.title}
                </Typography>
                <Typography variant="body2">
                  {lastNotification.message}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDistanceToNow(new Date(lastNotification.createdAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </Typography>
              </Box>
            </Alert>
          </Paper>
        </Zoom>
      )}

      {/* Notifications Menu */}
      <Popover
        open={Boolean(anchorEl)}
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
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: '95vw',
            maxHeight: 600,
          },
        }}
      >
        <Box>
          {/* Header */}
          <Box p={2} pb={1}>
            <Box display="flex" justifyContent="between" alignItems="center">
              <Typography variant="h6" component="h2">
                Benachrichtigungen
              </Typography>
              <Box display="flex" gap={1}>
                {unreadCount > 0 && (
                  <Tooltip title="Alle als gelesen markieren">
                    <IconButton size="small" onClick={handleMarkAllAsRead}>
                      <MarkReadIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Alle löschen">
                  <IconButton size="small" onClick={handleClearAll} color="error">
                    <ClearAllIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Einstellungen">
                  <IconButton size="small">
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} ungelesen`}
                size="small"
                color="primary"
              />
            )}
          </Box>

          <Divider />

          {/* Loading State */}
          {isLoading && (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error.message}
            </Alert>
          )}

          {/* Notifications List */}
          {!isLoading && !error && (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {recentNotifications?.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <NotificationsIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography color="textSecondary">
                    Keine Benachrichtigungen
                  </Typography>
                </Box>
              ) : (
                recentNotifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    sx={{
                      backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                      borderLeft: notification.isRead ? 'none' : '4px solid',
                      borderLeftColor: 'primary.main',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'transparent' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <CircleIcon color="primary" sx={{ fontSize: 8 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: de,
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Löschen">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification.id);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          )}

          {/* Footer */}
          {hasMoreNotifications && (
            <>
              <Divider />
              <Box p={2}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    handleClose();
                    // Navigate to full notifications page
                    window.location.href = '/notifications';
                  }}
                >
                  Alle Benachrichtigungen anzeigen ({notifications.length})
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;