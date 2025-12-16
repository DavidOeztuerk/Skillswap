import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  VideoCall as VideoCallIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  DoneAll as DoneAllIcon,
  Payment as PaymentIcon,
  SwapHoriz as SwapIcon,
  Numbers as NumbersIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  School as SchoolIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTimeRange, formatDate, isPastDate } from '../../utils/dateUtils';
import { type Appointment, AppointmentStatus } from '../../types/models/Appointment';
import AppointmentErrorBoundary from '../../components/error/AppointmentErrorBoundary';
import MeetingLinkSection from '../../components/appointments/MeetingLinkSection';
import appointmentService from '../../api/services/appointmentService';
import ErrorNotification from '../../components/common/ErrorNotification';
import { useNotificationHandler } from '../../hooks/useNotificationHandler';

const SessionDetailPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const {
    appointments,
    respondToAppointment,
    completeAppointment,
    cancelAppointment,
    isLoading,
    error: appointmentError,
  } = useAppointments();

  // Error/Success Notification Handler
  const { notification, handleError, handleSuccess, clearNotification } = useNotificationHandler();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
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

  useEffect(() => {
    if (appointmentId) {
      const foundAppointment = appointments.find((apt) => apt.id === appointmentId);
      if (foundAppointment) {
        setAppointment(foundAppointment);
      }
    }
  }, [appointmentId, appointments]);

  const handleConfirmDialogOpen = (action: 'confirm' | 'cancel' | 'complete'): void => {
    let title = '';
    let message = '';

    switch (action) {
      case 'confirm':
        title = 'Session bestätigen';
        message = 'Möchtest du diese Session bestätigen?';
        break;
      case 'cancel':
        title = 'Session absagen';
        message = 'Möchtest du diese Session wirklich absagen?';
        break;
      case 'complete':
        title = 'Session abschließen';
        message = 'Möchtest du diese Session als abgeschlossen markieren?';
        break;
      default:
        // Exhaustive check
        break;
    }

    setConfirmDialog({ open: true, title, message, action });
  };

  const handleConfirmAction = (): void => {
    if (!appointmentId) return;

    try {
      switch (confirmDialog.action) {
        case 'confirm':
          // Accept appointment by responding with Confirmed status
          respondToAppointment(appointmentId, AppointmentStatus.Confirmed);
          handleSuccess('Session wurde erfolgreich bestätigt!', 'Bestätigt');
          break;
        case 'cancel':
          // Cancel appointment
          cancelAppointment(appointmentId);
          handleSuccess('Session wurde erfolgreich abgesagt', 'Abgesagt');
          break;
        case 'complete':
          // Complete appointment
          completeAppointment(appointmentId);
          handleSuccess('Session wurde erfolgreich abgeschlossen!', 'Abgeschlossen');
          break;
        default:
          // Exhaustive check
          break;
      }
    } catch (err: unknown) {
      // Handle network errors or unexpected errors
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      handleError({ errorCode: 'NETWORK_ERROR', errors: [errorMsg] });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleGenerateMeetingLink = async (): Promise<string> => {
    if (!appointmentId) throw new Error('Appointment ID is required');

    try {
      const response = await appointmentService.generateMeetingLink(appointmentId);
      if (!response.success || !('data' in response) || !response.data) {
        // Response failed - extract error info if available
        const errorResponse = 'errors' in response || 'errorCode' in response ? response : null;
        handleError(
          errorResponse as Parameters<typeof handleError>[0],
          'Meeting-Link konnte nicht generiert werden'
        );
        throw new Error('Failed to generate meeting link');
      }
      handleSuccess('Meeting-Link wurde erfolgreich generiert!', 'Link erstellt');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      handleError({ errorCode: 'NETWORK_ERROR', errors: [errorMessage] });
      throw error;
    }
  };

  const handleJoinVideoCall = (): void => {
    if (appointmentId) {
      void navigate(`/videocall/${appointmentId}`);
    }
  };

  if (isLoading && !appointment) {
    return <PageLoader variant="details" message="Session wird geladen..." />;
  }

  if (appointmentError !== undefined || !appointment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Session nicht gefunden"
          description="Die angeforderte Session existiert nicht oder ist nicht verfügbar."
          actionLabel="Zurück zu Sessions"
          actionHandler={() => navigate('/appointments')}
        />
      </Container>
    );
  }

  const isOrganizer = appointment.isOrganizer ?? appointment.teacherId === user?.id;
  const otherUser = isOrganizer ? appointment.studentDetails : appointment.teacherDetails;
  // Allow join for Confirmed status only (Accepted was removed from enum)
  const canJoinCall =
    appointment.status === AppointmentStatus.Confirmed &&
    (appointment.meetingLink ?? appointment.videocallUrl) !== undefined &&
    !isPastDate(appointment.endTime);
  // FIX: Only the PARTICIPANT (not the organizer) can accept the appointment
  const canConfirm = !isOrganizer && appointment.status === AppointmentStatus.Pending;
  const canCancel =
    appointment.status === AppointmentStatus.Pending ||
    (appointment.status === AppointmentStatus.Confirmed && !isPastDate(appointment.startTime));
  const canComplete =
    isOrganizer &&
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
      case AppointmentStatus.Rescheduled:
        return <ScheduleIcon />;
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
      case AppointmentStatus.Rescheduled:
        return 'warning';
      default:
        return 'default';
    }
  };

  const seriesProgress =
    (appointment.totalSessionsInSeries ?? 0) > 0
      ? ((appointment.completedSessionsInSeries ?? 0) / (appointment.totalSessionsInSeries ?? 1)) *
        100
      : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {statusMessage && (
        <AlertMessage
          message={[statusMessage.text]}
          severity={statusMessage.type}
          onClose={() => {
            setStatusMessage(null);
          }}
        />
      )}

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/appointments')}
        sx={{ mb: 3 }}
      >
        Zurück zu Sessions
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Header Card - Modern Design */}
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    icon={getStatusIcon()}
                    label={appointment.status}
                    color={getStatusColor()}
                    sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 600 }}
                  />
                  {appointment.connectionType && (
                    <Chip
                      label={
                        appointment.connectionType === 'SkillExchange'
                          ? 'Skill-Tausch'
                          : appointment.connectionType === 'Payment'
                            ? 'Bezahlt'
                            : 'Kostenlos'
                      }
                      icon={
                        appointment.connectionType === 'SkillExchange' ? (
                          <SwapIcon />
                        ) : appointment.connectionType === 'Payment' ? (
                          <PaymentIcon />
                        ) : (
                          <CheckCircleIcon />
                        )
                      }
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  )}
                  {(appointment.sessionNumber ?? 0) > 0 &&
                    (appointment.totalSessionsInSeries ?? 0) > 0 && (
                      <Chip
                        label={`Session ${String(appointment.sessionNumber)}/${String(appointment.totalSessionsInSeries)}`}
                        icon={<NumbersIcon />}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    )}
                  {appointment.isConfirmed && (
                    <Chip
                      label="✓ Bestätigt"
                      icon={<CheckCircleIcon />}
                      sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', color: 'white' }}
                    />
                  )}
                </Stack>

                <Typography variant="h4" fontWeight="700" sx={{ mt: 2 }}>
                  {appointment.title ?? `${appointment.skill?.name ?? 'Skill'} Session`}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <TimeIcon />
                  <Typography variant="h6">
                    {formatDateTimeRange(appointment.startTime, appointment.endTime)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="600">
                      {appointment.otherPartyName ??
                        `${otherUser?.firstName ?? ''} ${otherUser?.lastName ?? ''}`}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {isOrganizer ? 'Lernende:r' : 'Lehrende:r'}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Session Series Progress */}
          {appointment.sessionSeriesTitle !== undefined &&
            (appointment.totalSessionsInSeries ?? 0) > 0 && (
              <Card
                elevation={0}
                sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight="600" color="text.secondary">
                        📚 {appointment.sessionSeriesTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(appointment.completedSessionsInSeries ?? 0) > 0
                          ? appointment.completedSessionsInSeries
                          : 0}{' '}
                        / {appointment.totalSessionsInSeries} abgeschlossen
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={seriesProgress}
                      sx={{
                        height: 10,
                        borderRadius: 1,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 1,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        },
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            )}

          {/* Description */}
          {appointment.description && (
            <Card
              elevation={0}
              sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <InfoIcon /> Beschreibung
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {appointment.description}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          {appointment.isMonetary === true && (appointment.paymentAmount ?? 0) > 0 && (
            <Alert
              severity={appointment.isPaymentCompleted === true ? 'success' : 'warning'}
              icon={<PaymentIcon />}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              <Typography variant="body1" fontWeight="600">
                Preis: {appointment.paymentAmount} {appointment.currency ?? 'EUR'}
                {appointment.isPaymentCompleted === true ? ' ✓ Bezahlt' : ' - Zahlung ausstehend'}
              </Typography>
            </Alert>
          )}

          {/* Meeting Link Section */}
          {appointment.status === AppointmentStatus.Confirmed && appointmentId !== undefined && (
            <MeetingLinkSection
              appointmentId={appointmentId}
              meetingUrl={appointment.meetingLink ?? appointment.videocallUrl}
              startTime={appointment.startTime}
              endTime={appointment.endTime}
              status={appointment.status}
              isOrganizer={isOrganizer}
              onGenerateLink={
                !appointment.meetingLink && isOrganizer ? handleGenerateMeetingLink : undefined
              }
              allowEarlyJoin={true}
              earlyJoinMinutes={5}
            />
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 3 }}>
            {canJoinCall && (
              <Button
                variant="contained"
                size="large"
                startIcon={<VideoCallIcon />}
                onClick={handleJoinVideoCall}
                sx={{
                  py: 1.5,
                  px: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                Videoanruf beitreten
              </Button>
            )}
            {canConfirm && (
              <Button
                variant="outlined"
                color="success"
                size="large"
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
                size="large"
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
                size="large"
                startIcon={<DoneAllIcon />}
                onClick={() => {
                  handleConfirmDialogOpen('complete');
                }}
              >
                Abschließen
              </Button>
            )}
          </Stack>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="700" gutterBottom>
                Session-Details
              </Typography>
              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Datum"
                    secondary={formatDate(appointment.startTime, 'EEEE, dd. MMMM yyyy')}
                    slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <TimeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Zeit"
                    secondary={`${formatDate(appointment.startTime, 'HH:mm')} - ${formatDate(appointment.endTime, 'HH:mm')}`}
                    slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ort"
                    secondary={
                      (appointment.meetingLink ?? appointment.videocallUrl) !== undefined
                        ? 'Online (Videoanruf)'
                        : 'Präsenz'
                    }
                    slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Rolle"
                    secondary={isOrganizer ? 'Du unterrichtest' : 'Du lernst'}
                    slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
                  />
                </ListItem>
                {appointment.connectionId && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <LinkIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Connection ID"
                        secondary={`${appointment.connectionId.substring(0, 12)}...`}
                        slotProps={{
                          primary: { fontWeight: 600, fontSize: '0.875rem' },
                          secondary: { sx: { fontFamily: 'monospace', fontSize: '0.7rem' } },
                        }}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card
            elevation={0}
            sx={{
              mt: 3,
              borderRadius: 2,
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.100',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight="700" gutterBottom color="primary">
                💡 Tipps
              </Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  📚 Bereite Fragen vor
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  💻 Teste Kamera & Mikrofon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📝 Halte Notizen bereit
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  🌐 Stabile Internetverbindung
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* Error/Success Notification */}
      <ErrorNotification
        open={notification !== null}
        title={notification?.title ?? ''}
        message={notification?.message ?? ''}
        severity={notification?.severity ?? 'error'}
        onClose={clearNotification}
      />
    </Container>
  );
};

const WrappedSessionDetailPage: React.FC = () => (
  <AppointmentErrorBoundary>
    <SessionDetailPage />
  </AppointmentErrorBoundary>
);

export default WrappedSessionDetailPage;
