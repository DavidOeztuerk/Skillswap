import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  // VideoCall as VideoCallIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  EmojiObjects as SkillIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
  Star as StarIcon,
  Share as ShareIcon,
  CalendarToday as CalendarIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  DoneAll as DoneAllIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTimeRange, formatDate, isPastDate } from '../../utils/dateUtils';
import { type Appointment, AppointmentStatus } from '../../types/models/Appointment';
import AppointmentErrorBoundary from '../../components/error/AppointmentErrorBoundary';
import errorService from '../../services/errorService';
import RescheduleDialog from '../../components/appointments/RescheduleDialog';
import appointmentService from '../../api/services/appointmentService';
import MeetingLinkSection from '../../components/appointments/MeetingLinkSection';
import { FEATURES } from '../../config/featureFlags';

// Mock message interface
interface AppointmentMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system';
}

const AppointmentDetailPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { appointments, respondToAppointment, completeAppointment, isLoading, error } =
    useAppointments();

  // Local state
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [messages, setMessages] = useState<AppointmentMessage[]>([]);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: 'confirm' | 'cancel' | 'complete';
  }>({
    open: false,
    title: '',
    message: '',
    action: 'confirm',
  });
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Load appointment data
  useEffect(() => {
    if (appointmentId) {
      errorService.addBreadcrumb('Loading appointment detail', 'navigation', { appointmentId });

      const foundAppointment = appointments.find((apt) => apt.id === appointmentId);
      if (foundAppointment) {
        setAppointment(foundAppointment);
        errorService.addBreadcrumb('Appointment loaded successfully', 'data', {
          appointmentId,
          skillName: foundAppointment.skill?.name ?? 'Unknown',
        });

        // Inline mock messages laden um Function-Dependency zu vermeiden
        setMessages([
          {
            id: '1',
            senderId: 'teacher1',
            senderName: 'Anna Müller',
            content:
              'Hallo! Ich freue mich auf unsere Session. Haben Sie schon Erfahrungen mit React?',
            timestamp: '2024-01-15T09:00:00Z',
            type: 'message',
          },
          {
            id: '2',
            senderId: 'student1',
            senderName: 'Max Schmidt',
            content:
              'Ja, ich habe schon einige kleine Projekte gemacht. Würde gerne mehr über Hooks lernen!',
            timestamp: '2024-01-15T09:05:00Z',
            type: 'message',
          },
        ]);
      } else {
        errorService.addBreadcrumb('Appointment not found', 'error', { appointmentId });
      }
    }
  }, [appointmentId, appointments]);

  const handleConfirmDialogOpen = (action: 'confirm' | 'cancel' | 'complete'): void => {
    errorService.addBreadcrumb('Opening appointment action dialog', 'ui', {
      appointmentId,
      action,
    });

    let title = '';
    let message = '';

    switch (action) {
      case 'confirm':
        title = 'Termin bestätigen';
        message = 'Möchtest du diesen Termin bestätigen?';
        break;
      case 'cancel':
        title = 'Termin absagen';
        message = 'Möchtest du diesen Termin wirklich absagen?';
        break;
      case 'complete':
        if (!FEATURES.appointments.enableCompletion) {
          setStatusMessage({ text: 'Abschließen ist derzeit nicht verfügbar', type: 'info' });
          return;
        }
        title = 'Termin abschließen';
        message = 'Möchtest du diesen Termin als abgeschlossen markieren?';
        break;
      default:
        return;
    }

    setConfirmDialog({
      open: true,
      title,
      message,
      action,
    });
  };

  const handleConfirmAction = (): void => {
    if (!appointmentId) return;

    try {
      errorService.addBreadcrumb('Performing appointment action', 'action', {
        appointmentId,
        action: confirmDialog.action,
      });

      const { action } = confirmDialog;

      switch (action) {
        case 'confirm':
          respondToAppointment(appointmentId, AppointmentStatus.Confirmed);
          setStatusMessage({
            text: 'Termin wurde erfolgreich bestätigt',
            type: 'success',
          });
          break;
        case 'cancel':
          respondToAppointment(appointmentId, AppointmentStatus.Cancelled);
          setStatusMessage({
            text: 'Termin wurde abgesagt',
            type: 'success',
          });
          break;
        case 'complete':
          if (!FEATURES.appointments.enableCompletion) {
            setStatusMessage({ text: 'Abschließen ist derzeit nicht verfügbar', type: 'info' });
            break;
          }
          completeAppointment(appointmentId);
          setStatusMessage({
            text: 'Termin wurde als abgeschlossen markiert',
            type: 'success',
          });
          break;
        default:
          break;
      }

      errorService.addBreadcrumb('Appointment action completed', 'action', {
        appointmentId,
        action,
      });
    } catch (actionError: unknown) {
      const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
      errorService.addBreadcrumb('Error performing appointment action', 'error', {
        appointmentId,
        action: confirmDialog.action,
        error: errorMessage,
      });
      setStatusMessage({
        text: `Fehler bei der Terminverwaltung: ${errorMessage}`,
        type: 'error',
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSendMessage = (): void => {
    if (!newMessage.trim()) return;

    errorService.addBreadcrumb('Sending message in appointment detail', 'form', { appointmentId });

    const firstName = user?.firstName ?? '';
    const lastName = user?.lastName ?? '';
    const message: AppointmentMessage = {
      id: Date.now().toString(),
      senderId: user?.id ?? 'unknown',
      senderName: firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Du',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message',
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
    setMessageDialogOpen(false);
    setStatusMessage({
      text: 'Nachricht gesendet',
      type: 'success',
    });
  };

  // const handleJoinVideoCall = () => {
  //   errorService.addBreadcrumb('Joining video call', 'navigation', { appointmentId });

  //   if (appointmentId) {
  //     navigate(`/videocall/${appointmentId}`);
  //   }
  // };

  const handleGenerateMeetingLink = async (): Promise<string> => {
    if (!appointmentId) {
      throw new Error('Appointment ID is required');
    }

    try {
      errorService.addBreadcrumb('Generating meeting link', 'action', { appointmentId });

      const response = await appointmentService.generateMeetingLink(appointmentId);

      if (!response.success) {
        const errorMsg =
          'errors' in response ? response.errors.join(', ') : 'Failed to generate meeting link';
        throw new Error(errorMsg);
      }

      if (!('data' in response) || !response.data) {
        throw new Error('No meeting link returned from server');
      }

      errorService.addBreadcrumb('Meeting link generated successfully', 'action', {
        appointmentId,
      });
      setStatusMessage({
        text: 'Meeting-Link wurde erfolgreich generiert',
        type: 'success',
      });

      return response.data;
    } catch (generateError) {
      errorService.addBreadcrumb('Error generating meeting link', 'error', {
        appointmentId,
        error: generateError instanceof Error ? generateError.message : 'Unknown error',
      });

      setStatusMessage({
        text: 'Fehler beim Generieren des Meeting-Links',
        type: 'error',
      });

      throw generateError;
    }
  };

  const handleRefreshMeetingLink = async (): Promise<string> => {
    if (!appointmentId) {
      throw new Error('Appointment ID is required');
    }

    try {
      errorService.addBreadcrumb('Refreshing meeting link', 'action', { appointmentId });

      // Backend uses same endpoint for refresh - it generates a new link
      const response = await appointmentService.generateMeetingLink(appointmentId);

      if (!response.success) {
        const errorMsg =
          'errors' in response ? response.errors.join(', ') : 'Failed to refresh meeting link';
        throw new Error(errorMsg);
      }

      if (!('data' in response) || !response.data) {
        throw new Error('No meeting link returned from server');
      }

      errorService.addBreadcrumb('Meeting link refreshed successfully', 'action', {
        appointmentId,
      });
      setStatusMessage({
        text: 'Meeting-Link wurde aktualisiert',
        type: 'success',
      });

      return response.data;
    } catch (refreshError) {
      errorService.addBreadcrumb('Error refreshing meeting link', 'error', {
        appointmentId,
        error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
      });

      setStatusMessage({
        text: 'Fehler beim Aktualisieren des Meeting-Links',
        type: 'error',
      });

      throw refreshError;
    }
  };

  const handleReschedule = async (
    newDateTime: Date,
    newDuration?: number,
    reason?: string
  ): Promise<void> => {
    if (!appointmentId) return;

    try {
      errorService.addBreadcrumb('Rescheduling appointment', 'action', {
        appointmentId,
        newDateTime: newDateTime.toISOString(),
      });

      // Note: This will throw an error as the endpoint doesn't exist yet
      // We're setting it up for future backend implementation
      await appointmentService.rescheduleAppointment(
        appointmentId,
        newDateTime.toISOString(),
        newDuration,
        reason
      );

      setStatusMessage({
        text: 'Termin wurde erfolgreich verschoben',
        type: 'success',
      });

      // Refresh appointment data
      // In real implementation, this would reload the appointment
      setRescheduleDialogOpen(false);
    } catch (rescheduleError) {
      errorService.addBreadcrumb('Error rescheduling appointment', 'error', {
        appointmentId,
        error: rescheduleError instanceof Error ? rescheduleError.message : 'Unknown error',
      });

      // For now, show a success message since backend isn't ready
      if (rescheduleError instanceof Error && rescheduleError.message.includes('not implemented')) {
        setStatusMessage({
          text: 'Termin-Verschiebung wird bald verfügbar sein',
          type: 'info',
        });
      } else {
        setStatusMessage({
          text: 'Fehler beim Verschieben des Termins',
          type: 'error',
        });
      }
    }
  };

  const handleShare = async (): Promise<void> => {
    const shareData = {
      title: `Termin: ${appointment?.skill?.name ?? 'Unknown'}`,
      text: `Termin am ${appointment ? formatDateTimeRange(appointment.startTime, appointment.endTime) : ''}`,
      url: window.location.href,
    };

    if (typeof navigator.share === 'function') {
      try {
        errorService.addBreadcrumb('Sharing appointment via native share', 'action', {
          appointmentId,
        });
        await navigator.share(shareData);
      } catch (_error) {
        errorService.addBreadcrumb('Share cancelled by user', 'ui', { appointmentId });
        console.debug('Share canceled');
      }
    } else {
      errorService.addBreadcrumb('Copying appointment link to clipboard', 'action', {
        appointmentId,
      });
      void navigator.clipboard.writeText(window.location.href);
      setStatusMessage({
        text: 'Link in Zwischenablage kopiert',
        type: 'success',
      });
    }
  };

  // Loading state
  if (isLoading && !appointment) {
    return <PageLoader variant="details" message="Termin wird geladen..." />;
  }

  // Error or not found
  if (error || !appointment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Termin nicht gefunden"
          description={'Der angeforderte Termin existiert nicht oder ist nicht verfügbar.'}
          actionLabel="Zurück zu Terminen"
          actionHandler={() => navigate('/appointments')}
        />
      </Container>
    );
  }

  const isTeacher = appointment.teacherId === user?.id;
  const otherUser = isTeacher ? appointment.studentDetails : appointment.teacherDetails;
  const canConfirm = isTeacher && appointment.status === AppointmentStatus.Pending;
  const canCancel =
    appointment.status === AppointmentStatus.Pending ||
    (appointment.status === AppointmentStatus.Confirmed && !isPastDate(appointment.startTime));
  const canReschedule =
    appointment.status === AppointmentStatus.Confirmed &&
    !isPastDate(appointment.startTime) &&
    isTeacher; // Only teacher can reschedule for now
  const canComplete =
    isTeacher &&
    appointment.status === AppointmentStatus.Confirmed &&
    isPastDate(appointment.endTime);

  const getStatusIcon = (): React.ReactElement => {
    switch (appointment.status) {
      case AppointmentStatus.Pending:
        return <ScheduleIcon />;
      case AppointmentStatus.Confirmed:
        return <EventAvailableIcon />;
      case AppointmentStatus.Cancelled:
        return <EventBusyIcon />;
      case AppointmentStatus.Completed:
        return <DoneAllIcon />;
      default:
        return <CalendarIcon />;
    }
  };

  const getStatusColor = (): 'warning' | 'success' | 'error' | 'info' | 'default' => {
    switch (appointment.status) {
      case AppointmentStatus.Pending:
        return 'warning';
      case AppointmentStatus.Confirmed:
        return 'success';
      case AppointmentStatus.Cancelled:
        return 'error';
      case AppointmentStatus.Completed:
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (): string => {
    switch (appointment.status) {
      case AppointmentStatus.Pending:
        return 'Ausstehend';
      case AppointmentStatus.Confirmed:
        return 'Bestätigt';
      case AppointmentStatus.Cancelled:
        return 'Abgesagt';
      case AppointmentStatus.Completed:
        return 'Abgeschlossen';
      default:
        return appointment.status;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {/* Status messages */}
      {statusMessage && (
        <AlertMessage
          message={[statusMessage.text]}
          severity={statusMessage.type}
          onClose={() => {
            setStatusMessage(null);
          }}
        />
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            errorService.addBreadcrumb('Navigating back to appointments', 'navigation', {
              appointmentId,
            });
            void navigate('/appointments');
          }}
          sx={{ mb: 2 }}
        >
          Zurück zu Terminen
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Appointment header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    icon={getStatusIcon()}
                    label={getStatusLabel()}
                    color={getStatusColor()}
                    size="small"
                  />
                  <Chip
                    label={appointment.skill?.name ?? 'Skill'}
                    variant="outlined"
                    size="small"
                    icon={<SkillIcon />}
                  />
                </Box>

                <Typography variant="h4" component="h1" gutterBottom>
                  Termin: {appointment.skill?.name ?? 'Skill'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TimeIcon color="action" />
                  <Typography variant="h6">
                    {formatDateTimeRange(appointment.startTime, appointment.endTime)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {canReschedule && (
                  <Tooltip title="Termin verschieben">
                    <IconButton
                      onClick={() => {
                        setRescheduleDialogOpen(true);
                      }}
                    >
                      <UpdateIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Teilen">
                  <IconButton onClick={handleShare}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Bearbeiten">
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Participant info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {otherUser?.firstName ?? ''} {otherUser?.lastName ?? ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isTeacher ? 'Lernende:r' : 'Lehrende:r'}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2">4.8 (23 Bewertungen)</Typography>
                </Box>
              </Box>
            </Box>

            {/* Notes */}
            {appointment.notes && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <NotesIcon />
                  Notizen
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2">{appointment.notes}</Typography>
                </Paper>
              </Box>
            )}

            {/* Action buttons */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {canConfirm && (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => {
                    handleConfirmDialogOpen('confirm');
                  }}
                >
                  Bestätigen
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    handleConfirmDialogOpen('cancel');
                  }}
                >
                  Absagen
                </Button>
              )}

              {canComplete && (
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<DoneAllIcon />}
                  onClick={() => {
                    handleConfirmDialogOpen('complete');
                  }}
                >
                  Abschließen
                </Button>
              )}

              {canReschedule && (
                <Button
                  variant="outlined"
                  startIcon={<UpdateIcon />}
                  onClick={() => {
                    setRescheduleDialogOpen(true);
                  }}
                >
                  Verschieben
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={() => {
                  setMessageDialogOpen(true);
                }}
              >
                Nachricht senden
              </Button>
            </Box>
          </Paper>

          {/* Meeting Link Section */}
          {appointment.status === AppointmentStatus.Confirmed && appointmentId && (
            <MeetingLinkSection
              appointmentId={appointmentId}
              meetingUrl={appointment.videocallUrl}
              startTime={appointment.startTime || appointment.scheduledDate}
              endTime={
                appointment.endTime ||
                new Date(
                  new Date(appointment.scheduledDate).getTime() +
                    appointment.durationMinutes * 60000
                ).toISOString()
              }
              status={appointment.status}
              isOrganizer={isTeacher}
              onGenerateLink={
                !appointment.videocallUrl && isTeacher ? handleGenerateMeetingLink : undefined
              }
              onRefreshLink={
                appointment.videocallUrl && isTeacher ? handleRefreshMeetingLink : undefined
              }
              allowEarlyJoin={true}
              earlyJoinMinutes={5}
            />
          )}

          {/* Messages timeline */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Nachrichten & Aktivitäten
            </Typography>

            {messages.length > 0 ? (
              <Timeline>
                {messages.map((message, index) => (
                  <TimelineItem key={message.id}>
                    <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                      <Typography variant="caption">
                        {formatDate(message.timestamp, 'HH:mm')}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot
                        color={message.type === 'system' ? 'primary' : 'secondary'}
                        variant={message.senderId === user?.id ? 'filled' : 'outlined'}
                      >
                        {message.type === 'system' ? <ScheduleIcon /> : <MessageIcon />}
                      </TimelineDot>
                      {index < messages.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {message.senderName}
                      </Typography>
                      <Typography variant="body2">{message.content}</Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Noch keine Nachrichten vorhanden.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Quick info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Termindetails
            </Typography>
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Datum"
                  secondary={formatDate(appointment.startTime, 'EEEE, dd. MMMM yyyy')}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon>
                  <TimeIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Zeit"
                  secondary={`${formatDate(appointment.startTime, 'HH:mm')} - ${formatDate(appointment.endTime, 'HH:mm')}`}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Ort"
                  secondary={appointment.videocallUrl ? 'Online (Videoanruf)' : 'Präsenz'}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Rolle"
                  secondary={isTeacher ? 'Du unterrichtest' : 'Du lernst'}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Preparation tips */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tipps zur Vorbereitung
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="📚 Vorbereitung"
                  secondary="Überlege dir Fragen oder Themen, die du besprechen möchtest"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="💻 Technik"
                  secondary="Teste deine Kamera und dein Mikrofon vor dem Termin"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="📝 Notizen"
                  secondary="Halte Stift und Papier oder ein digitales Notizbuch bereit"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="🌐 Internetverbindung"
                  secondary="Sorge für eine stabile Internetverbindung"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Message Dialog */}
      <Dialog
        open={messageDialogOpen}
        onClose={() => {
          setMessageDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nachricht senden</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Nachricht"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
            }}
            placeholder={`Schreibe eine Nachricht an ${otherUser?.firstName ?? 'Teilnehmer'}...`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setMessageDialogOpen(false);
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSendMessage}
            variant="contained"
            disabled={!newMessage.trim()}
            startIcon={<MessageIcon />}
          >
            Senden
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setConfirmDialog({ ...confirmDialog, open: false });
        }}
        confirmLabel="Bestätigen"
        cancelLabel="Abbrechen"
        confirmColor={confirmDialog.action === 'cancel' ? 'error' : 'primary'}
      />

      {/* Reschedule Dialog */}
      {appointment.id && (
        <RescheduleDialog
          open={rescheduleDialogOpen}
          onClose={() => {
            setRescheduleDialogOpen(false);
          }}
          appointment={appointment}
          onReschedule={handleReschedule}
          // availableSlots would come from API in real implementation
          availableSlots={[]}
        />
      )}
    </Container>
  );
};

const WrappedAppointmentDetailPage: React.FC = () => (
  <AppointmentErrorBoundary>
    <AppointmentDetailPage />
  </AppointmentErrorBoundary>
);

export default WrappedAppointmentDetailPage;
