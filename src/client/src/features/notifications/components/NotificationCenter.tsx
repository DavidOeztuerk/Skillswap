import React, { type JSX, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
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
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
import EmptyState from '../../../shared/components/ui/EmptyState';
import SkeletonLoader from '../../../shared/components/ui/SkeletonLoader';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType, type Notification } from '../types/Notification';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType): JSX.Element => {
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

const getNotificationColor = (
  type: NotificationType
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (type) {
    case NotificationType.MatchAccepted:
    case NotificationType.AppointmentConfirmed:
      return 'success';
    case NotificationType.MatchRejected:
    case NotificationType.AppointmentCancelled:
      return 'error';
    case NotificationType.MatchRequest:
    case NotificationType.AppointmentRequest:
    case NotificationType.AppointmentReminder:
      return 'info';
    case NotificationType.VideoCallStarted:
      return 'primary';
    case NotificationType.SkillEndorsement:
      return 'warning';
    case NotificationType.System:
    default:
      return 'default';
  }
};

/**
 * Notification Center Component für die Anzeige aller Benachrichtigungen
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notificationId: string): void => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notificationId);
  };

  const handleMenuClose = (): void => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleNotificationClick = (notification: Notification): void => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to the action URL if available
    if (notification.actionUrl) {
      // Close notification center
      onClose();

      // Use navigate for SPA routing (no page reload)
      void navigate(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = (): void => {
    markAllAsRead();
  };

  const handleDeleteNotification = (): void => {
    if (selectedNotification) {
      deleteNotificationById(selectedNotification);
      handleMenuClose();
    }
  };

  const handleMarkAsRead = (): void => {
    if (selectedNotification) {
      markAsRead(selectedNotification);
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
              <SkeletonLoader variant="list" count={5} />
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<NotificationsIcon />}
                title="Keine Benachrichtigungen"
                description="Du hast momentan keine Benachrichtigungen."
              />
            ) : (
              <List disablePadding>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <Tooltip title="Optionen">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              handleMenuClick(e, notification.id);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemButton
                        onClick={() => {
                          handleNotificationClick(notification);
                        }}
                        sx={{
                          backgroundColor: notification.isRead
                            ? 'transparent'
                            : theme.palette.action.hover,
                          '&:hover': {
                            backgroundColor: theme.palette.action.selected,
                          },
                        }}
                      >
                        <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
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
                                color={getNotificationColor(notification.type)}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {notification.message}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.disabled">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: de,
                                })}
                              </Typography>
                            </>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Context Menu */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        {selectedNotification &&
        !notifications.find((n) => n.id === selectedNotification)?.isRead ? (
          <MenuItem onClick={handleMarkAsRead}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            Als gelesen markieren
          </MenuItem>
        ) : null}
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
