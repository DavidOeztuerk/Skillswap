// src/components/notifications/NotificationCenter.tsx
import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Tooltip,
  ListItemButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  Star as StarIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification, NotificationType } from '../../types/models/Notification';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.MatchRequest:
      return <PersonAddIcon />;
    case NotificationType.MatchAccepted:
      return <CheckCircleIcon color="success" />;
    case NotificationType.MatchRejected:
      return <CancelIcon color="error" />;
    case NotificationType.AppointmentRequest:
    case NotificationType.AppointmentConfirmed:
    case NotificationType.AppointmentCancelled:
    case NotificationType.AppointmentReminder:
      return <EventIcon />;
    case NotificationType.VideoCallStarted:
      return <VideoCallIcon color="primary" />;
    case NotificationType.SkillEndorsement:
      return <StarIcon color="warning" />;
    case NotificationType.System:
    default:
      return <InfoIcon />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.MatchAccepted:
      return 'success';
    case NotificationType.MatchRejected:
    case NotificationType.AppointmentCancelled:
      return 'error';
    case NotificationType.MatchRequest:
    case NotificationType.AppointmentRequest:
      return 'info';
    case NotificationType.VideoCallStarted:
      return 'primary';
    case NotificationType.SkillEndorsement:
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Notification Center Component für die Anzeige aller Benachrichtigungen
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotificationById,
  } = useNotifications();

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notificationId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigation zur entsprechenden Seite wenn actionUrl vorhanden
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async () => {
    if (selectedNotification) {
      await deleteNotificationById(selectedNotification);
      handleMenuClose();
    }
  };

  const handleMarkAsRead = async () => {
    if (selectedNotification) {
      await markAsRead(selectedNotification);
      handleMenuClose();
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100vw' : 400,
            maxWidth: '100vw',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon />
              <Typography variant="h6">Benachrichtigungen</Typography>
              {unreadCount > 0 && (
                <Badge badgeContent={unreadCount} color="error">
                  <Box />
                </Badge>
              )}
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Actions */}
          {notifications.length > 0 && (
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Button
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                size="small"
              >
                Alle als gelesen markieren
              </Button>
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {isLoading ? (
              <LoadingSpinner message="Benachrichtigungen werden geladen..." />
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<NotificationsIcon />}
                title="Keine Benachrichtigungen"
                description={{message:"Du hast momentan keine Benachrichtigungen."}}
              />
            ) : (
              <List disablePadding>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItemButton
  onClick={() => handleNotificationClick(notification)}
  sx={{
    backgroundColor: notification.isRead
      ? 'transparent'
      : theme.palette.action.hover,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  }}
>

                      <ListItemIcon>
                        {getNotificationIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: notification.isRead ? 'normal' : 'bold',
                                flex: 1,
                              }}
                            >
                              {notification.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={notification.type}
                              color={getNotificationColor(notification.type) as 
                                'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Optionen">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => handleMenuClick(e, notification.id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {selectedNotification && !notifications.find(n => n.id === selectedNotification)?.isRead && (
          <MenuItem onClick={handleMarkAsRead}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            Als gelesen markieren
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteNotification}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Löschen
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationCenter;