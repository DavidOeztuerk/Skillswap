import React, { useState, useCallback, useRef } from 'react';
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
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationBellProps {
  maxDisplayCount?: number;
  showPreview?: boolean;
  autoMarkAsRead?: boolean;
  playSound?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  maxDisplayCount = 10,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use notifications hook
  const {
    notifications,
    unreadCount,
    isLoading,
    error: errorMessage,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = useCallback((notificationId: string) => {
    markAsRead(notificationId);
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }, [notifications, markAsRead]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    clearAll();
    setAnchorEl(null);
  }, [clearAll]);

  const handleDeleteNotification = useCallback((notificationId: string) => {
    deleteNotification(notificationId);
  }, [deleteNotification]);

  const getNotificationIcon = (type: string) => {
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

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  };

  const open = Boolean(anchorEl);
  const displayNotifications = notifications.slice(0, maxDisplayCount);

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
            {unreadCount > 0 ? (
              <NotificationsIcon />
            ) : (
              <NotificationsNoneIcon />
            )}
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
                <Chip 
                  label={unreadCount} 
                  size="small" 
                  color="error" 
                  sx={{ ml: 1 }}
                />
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
                      onClick={() => handleNotificationClick(notification.id)}
                      sx={{
                        py: 1.5,
                        backgroundColor: notification.isRead
                          ? 'transparent'
                          : 'action.hover',
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
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </Typography>
                          </Box>
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

        {notifications.length > maxDisplayCount && (
          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="text"
              size="small"
              onClick={() => {
                // Navigate to full notifications page
                handleClose();
              }}
            >
              Alle {notifications.length} Benachrichtigungen anzeigen
            </Button>
          </Box>
        )}
      </Popover>

      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
      </audio>
    </>
  );
};

export default NotificationBell;