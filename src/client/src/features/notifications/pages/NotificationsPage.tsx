import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Notifications as NotificationsIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Handshake as HandshakeIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Paper,
  Pagination,
} from '@mui/material';
import PageLoader from '../../../shared/components/ui/PageLoader';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType, type Notification } from '../types/Notification';

type FilterStatus = 'all' | 'read' | 'unread';
type FilterType = 'all' | NotificationType;

const ITEMS_PER_PAGE = 10;

/**
 * Full Notifications Page
 * Displays all notifications with filtering, pagination, and detail view
 */
const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotifications();

  // Local state
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Filter notifications
  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        // Filter by status
        if (filterStatus === 'read' && !notification.isRead) return false;
        if (filterStatus === 'unread' && notification.isRead) return false;

        // Filter by type
        if (filterType !== 'all' && notification.type !== filterType) return false;

        return true;
      }),
    [notifications, filterStatus, filterType]
  );

  // Paginated notifications
  const paginatedNotifications = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNotifications, page]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);

  // Get icon for notification type
  const getNotificationIcon = useCallback((type: NotificationType): React.ReactNode => {
    switch (type) {
      case NotificationType.MatchRequest:
      case NotificationType.MatchAccepted:
      case NotificationType.MatchRejected:
        return <HandshakeIcon color="primary" />;
      case NotificationType.AppointmentRequest:
      case NotificationType.AppointmentConfirmed:
      case NotificationType.AppointmentCancelled:
      case NotificationType.AppointmentReminder:
        return <EventIcon color="secondary" />;
      case NotificationType.VideoCallStarted:
        return <VideoCallIcon color="success" />;
      case NotificationType.SkillEndorsement:
        return <StarIcon color="warning" />;
      case NotificationType.System:
        return <InfoIcon color="info" />;
      default:
        return <NotificationsIcon />;
    }
  }, []);

  // Get label for notification type
  const getTypeLabel = useCallback((type: NotificationType): string => {
    switch (type) {
      case NotificationType.MatchRequest:
        return 'Match-Anfrage';
      case NotificationType.MatchAccepted:
        return 'Match angenommen';
      case NotificationType.MatchRejected:
        return 'Match abgelehnt';
      case NotificationType.AppointmentRequest:
        return 'Terminanfrage';
      case NotificationType.AppointmentConfirmed:
        return 'Termin bestätigt';
      case NotificationType.AppointmentCancelled:
        return 'Termin storniert';
      case NotificationType.AppointmentReminder:
        return 'Erinnerung';
      case NotificationType.VideoCallStarted:
        return 'Videoanruf';
      case NotificationType.SkillEndorsement:
        return 'Empfehlung';
      case NotificationType.System:
        return 'System';
      default:
        return 'Benachrichtigung';
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      setSelectedNotification(notification);
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

  // Handle navigate to action URL
  const handleNavigateToAction = useCallback(
    (notification: Notification) => {
      if (notification.actionUrl) {
        if (notification.actionUrl.startsWith('/')) {
          void navigate(notification.actionUrl);
        } else {
          window.location.href = notification.actionUrl;
        }
      }
    },
    [navigate]
  );

  // Handle delete confirmation
  const handleDeleteClick = useCallback((notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationToDelete(notificationId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete);
      setDeleteConfirmOpen(false);
      setNotificationToDelete(null);
      // Close detail view if deleted notification was selected
      if (selectedNotification?.id === notificationToDelete) {
        setSelectedNotification(null);
      }
    }
  }, [notificationToDelete, deleteNotification, selectedNotification]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Handle filter changes - reset page to 1
  const handleFilterStatusChange = useCallback((newStatus: FilterStatus) => {
    setFilterStatus(newStatus);
    setPage(1);
  }, []);

  const handleFilterTypeChange = useCallback((newType: FilterType) => {
    setFilterType(newType);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterStatus('all');
    setFilterType('all');
    setPage(1);
  }, []);

  if (isLoading && notifications.length === 0) {
    return <PageLoader variant="list" message="Lade Benachrichtigungen..." />;
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Benachrichtigungen
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} ungelesen`}
                color="error"
                size="small"
                sx={{ ml: 2, verticalAlign: 'middle' }}
              />
            )}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {filteredNotifications.length} Benachrichtigung
            {filteredNotifications.length === 1 ? '' : 'en'}
            {filterStatus !== 'all' || filterType !== 'all' ? ' (gefiltert)' : ''}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button variant="outlined" startIcon={<DoneAllIcon />} onClick={handleMarkAllAsRead}>
            Alle als gelesen markieren
          </Button>
        )}
      </Stack>

      {/* Error Alert */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      ) : null}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FilterListIcon color="action" />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => {
                handleFilterStatusChange(e.target.value as FilterStatus);
              }}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="unread">Ungelesen</MenuItem>
              <MenuItem value="read">Gelesen</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Typ</InputLabel>
            <Select
              value={filterType}
              label="Typ"
              onChange={(e) => {
                handleFilterTypeChange(e.target.value as FilterType);
              }}
            >
              <MenuItem value="all">Alle Typen</MenuItem>
              <MenuItem value={NotificationType.MatchRequest}>Match-Anfragen</MenuItem>
              <MenuItem value={NotificationType.MatchAccepted}>Match angenommen</MenuItem>
              <MenuItem value={NotificationType.AppointmentRequest}>Terminanfragen</MenuItem>
              <MenuItem value={NotificationType.AppointmentReminder}>Erinnerungen</MenuItem>
              <MenuItem value={NotificationType.SkillEndorsement}>Empfehlungen</MenuItem>
              <MenuItem value={NotificationType.System}>System</MenuItem>
            </Select>
          </FormControl>
          {(filterStatus !== 'all' || filterType !== 'all') && (
            <Button size="small" onClick={handleResetFilters}>
              Filter zurücksetzen
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Keine Benachrichtigungen
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {filterStatus !== 'all' || filterType !== 'all'
                ? 'Keine Benachrichtigungen entsprechen deinen Filterkriterien.'
                : 'Du hast noch keine Benachrichtigungen erhalten.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Stack spacing={1}>
            {paginatedNotifications.map((notification) => (
              <Card
                key={notification.id}
                sx={{
                  bgcolor: notification.isRead ? 'background.paper' : 'action.hover',
                  borderLeft: notification.isRead ? 'none' : 4,
                  borderLeftColor: 'primary.main',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
                onClick={() => {
                  handleNotificationClick(notification);
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: 'background.default' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={getTypeLabel(notification.type)}
                          size="small"
                          variant="outlined"
                        />
                        {!notification.isRead && <Chip label="Neu" size="small" color="primary" />}
                      </Stack>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      {!notification.isRead && (
                        <Tooltip title="Als gelesen markieren">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Löschen">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            handleDeleteClick(notification.id, e);
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => {
                  setPage(newPage);
                }}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={selectedNotification !== null}
        onClose={() => {
          setSelectedNotification(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        {selectedNotification ? (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getNotificationIcon(selectedNotification.type)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{selectedNotification.title}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(selectedNotification.createdAt), 'PPpp', { locale: de })}
                  </Typography>
                </Box>
                <Chip label={getTypeLabel(selectedNotification.type)} size="small" />
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedNotification.message}
              </Typography>
              {selectedNotification.metadata &&
              Object.keys(selectedNotification.metadata).length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Details:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                      <Typography key={key} variant="body2">
                        <strong>{key}:</strong> {String(value)}
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              ) : null}
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setSelectedNotification(null);
                }}
              >
                Schließen
              </Button>
              {selectedNotification.actionUrl ? (
                <Button
                  variant="contained"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => {
                    handleNavigateToAction(selectedNotification);
                  }}
                >
                  Zur Aktion
                </Button>
              ) : null}
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="warning" />
            <Typography>Benachrichtigung löschen?</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du diese Benachrichtigung wirklich löschen? Diese Aktion kann nicht rückgängig
            gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
            }}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            startIcon={<DeleteIcon />}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;
