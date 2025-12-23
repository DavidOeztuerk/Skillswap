import React, { useEffect, useState } from 'react';
import { formatDate } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
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
  type SxProps,
  type Theme,
} from '@mui/material';
import ErrorNotification from '../../../shared/components/common/ErrorNotification';
import AppointmentErrorBoundary from '../../../shared/components/error/AppointmentErrorBoundary';
import AlertMessage from '../../../shared/components/ui/AlertMessage';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import EmptyState from '../../../shared/components/ui/EmptyState';
import PageLoader from '../../../shared/components/ui/PageLoader';
import { isPastDate, formatDateTimeRange } from '../../../shared/utils/dateUtils';
import MeetingLinkSection from '../../appointments/components/MeetingLinkSection';
import { useAppointments } from '../../appointments/hooks/useAppointments';
import appointmentService from '../../appointments/services/appointmentService';
import { type Appointment, AppointmentStatus } from '../../appointments/types/Appointment';
import { useAuth } from '../../auth/hooks/useAuth';
import useNotificationHandler from '../../notifications/hooks/useNotificationHandler';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const headerCardSx: SxProps<Theme> = {
  mb: 3,
  borderRadius: 3,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
};

const statusChipSx: SxProps<Theme> = {
  bgcolor: 'white',
  color: 'primary.main',
  fontWeight: 600,
};

const semiTransparentChipSx: SxProps<Theme> = {
  bgcolor: 'rgba(255,255,255,0.2)',
  color: 'white',
};

const confirmedChipSx: SxProps<Theme> = {
  bgcolor: 'rgba(76, 175, 80, 0.3)',
  color: 'white',
};

const cardWithBorderSx: SxProps<Theme> = {
  mb: 3,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
};

const progressBarSx: SxProps<Theme> = {
  height: 10,
  borderRadius: 1,
  bgcolor: 'grey.200',
  '& .MuiLinearProgress-bar': {
    borderRadius: 1,
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
};

const descriptionTitleSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const joinCallButtonSx: SxProps<Theme> = {
  py: 1.5,
  px: 4,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '&:hover': {
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
  },
};

const sidebarCardSx: SxProps<Theme> = {
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
};

const listItemSx: SxProps<Theme> = {
  py: 1,
};

const listItemIconSx: SxProps<Theme> = {
  minWidth: 40,
};

const dividerSx: SxProps<Theme> = {
  my: 1,
};

const tipsCardSx: SxProps<Theme> = {
  mt: 3,
  borderRadius: 2,
  bgcolor: 'primary.50',
  border: '1px solid',
  borderColor: 'primary.100',
};

const avatarSx: SxProps<Theme> = {
  width: 48,
  height: 48,
  bgcolor: 'rgba(255,255,255,0.2)',
};

// ============================================================================
// Status Config Maps
// ============================================================================

const STATUS_ICONS: Record<AppointmentStatus, React.ReactElement> = {
  [AppointmentStatus.Pending]: <ScheduleIcon />,
  [AppointmentStatus.Confirmed]: <EventAvailableIcon />,
  [AppointmentStatus.Cancelled]: <EventBusyIcon />,
  [AppointmentStatus.Completed]: <DoneAllIcon />,
  [AppointmentStatus.Rescheduled]: <ScheduleIcon />,
};

const STATUS_COLORS: Record<
  AppointmentStatus,
  'warning' | 'success' | 'error' | 'info' | 'default'
> = {
  [AppointmentStatus.Pending]: 'warning',
  [AppointmentStatus.Confirmed]: 'success',
  [AppointmentStatus.Cancelled]: 'error',
  [AppointmentStatus.Completed]: 'info',
  [AppointmentStatus.Rescheduled]: 'warning',
};

const DIALOG_CONFIG: Record<'confirm' | 'cancel' | 'complete', { title: string; message: string }> =
  {
    confirm: { title: 'Session bestätigen', message: 'Möchtest du diese Session bestätigen?' },
    cancel: { title: 'Session absagen', message: 'Möchtest du diese Session wirklich absagen?' },
    complete: {
      title: 'Session abschließen',
      message: 'Möchtest du diese Session als abgeschlossen markieren?',
    },
  };

// ============================================================================
// Sub-Components
// ============================================================================

interface ConnectionChipProps {
  connectionType: string;
}

const ConnectionChip: React.FC<ConnectionChipProps> = ({ connectionType }) => {
  const config: Record<string, { label: string; icon: React.ReactElement }> = {
    SkillExchange: { label: 'Skill-Tausch', icon: <SwapIcon /> },
    Payment: { label: 'Bezahlt', icon: <PaymentIcon /> },
  };
  const defaultConfig = { label: 'Kostenlos', icon: <CheckCircleIcon /> };
  const { label, icon } = config[connectionType] ?? defaultConfig;
  return <Chip label={label} icon={icon} sx={semiTransparentChipSx} />;
};

interface ActionButtonsProps {
  canJoinCall: boolean;
  canConfirm: boolean;
  canCancel: boolean;
  canComplete: boolean;
  onJoin: () => void;
  onConfirmDialog: (action: 'confirm' | 'cancel' | 'complete') => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  canJoinCall,
  canConfirm,
  canCancel,
  canComplete,
  onJoin,
  onConfirmDialog,
}) => (
  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 3 }}>
    {canJoinCall ? (
      <Button
        variant="contained"
        size="large"
        startIcon={<VideoCallIcon />}
        onClick={onJoin}
        sx={joinCallButtonSx}
      >
        Videoanruf beitreten
      </Button>
    ) : null}
    {canConfirm ? (
      <Button
        variant="outlined"
        color="success"
        size="large"
        startIcon={<CheckIcon />}
        onClick={() => onConfirmDialog('confirm')}
      >
        Bestätigen
      </Button>
    ) : null}
    {canCancel ? (
      <Button
        variant="outlined"
        color="error"
        size="large"
        startIcon={<CancelIcon />}
        onClick={() => onConfirmDialog('cancel')}
      >
        Absagen
      </Button>
    ) : null}
    {canComplete ? (
      <Button
        variant="outlined"
        color="info"
        size="large"
        startIcon={<DoneAllIcon />}
        onClick={() => onConfirmDialog('complete')}
      >
        Abschließen
      </Button>
    ) : null}
  </Stack>
);

const TipsCard: React.FC = () => (
  <Card elevation={0} sx={tipsCardSx}>
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
);

// Session Series Progress Card - extracted to reduce complexity
interface SeriesProgressCardProps {
  title: string | undefined;
  completed: number;
  total: number;
  progress: number;
}

const SeriesProgressCard: React.FC<SeriesProgressCardProps> = ({
  title,
  completed,
  total,
  progress,
}) => {
  if (title === undefined || total <= 0) return null;
  return (
    <Card elevation={0} sx={cardWithBorderSx}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight="600" color="text.secondary">
              📚 {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completed > 0 ? completed : 0} / {total} abgeschlossen
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={progressBarSx} />
        </Stack>
      </CardContent>
    </Card>
  );
};

// Payment Info Alert - extracted to reduce complexity
interface PaymentInfoAlertProps {
  isMonetary: boolean | undefined;
  amount: number | undefined;
  currency: string | undefined;
  isCompleted: boolean | undefined;
}

const PaymentInfoAlert: React.FC<PaymentInfoAlertProps> = ({
  isMonetary,
  amount,
  currency,
  isCompleted,
}) => {
  if (isMonetary !== true || (amount ?? 0) <= 0) return null;
  return (
    <Alert
      severity={isCompleted === true ? 'success' : 'warning'}
      icon={<PaymentIcon />}
      sx={{ mb: 3, borderRadius: 2 }}
    >
      <Typography variant="body1" fontWeight="600">
        Preis: {amount} {currency ?? 'EUR'}
        {isCompleted === true ? ' ✓ Bezahlt' : ' - Zahlung ausstehend'}
      </Typography>
    </Alert>
  );
};

// Description Card - extracted to reduce complexity
interface DescriptionCardProps {
  description: string | undefined;
}

const DescriptionCard: React.FC<DescriptionCardProps> = ({ description }) => {
  if (!description) return null;
  return (
    <Card elevation={0} sx={cardWithBorderSx}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={descriptionTitleSx}>
          <InfoIcon /> Beschreibung
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Header Status Chips - extracted to reduce complexity
interface HeaderChipsProps {
  statusIcon: React.ReactElement;
  status: AppointmentStatus;
  statusColor: 'warning' | 'success' | 'error' | 'info' | 'default';
  connectionType: string | undefined;
  sessionNumber: number | undefined;
  totalSessions: number | undefined;
  isConfirmed: boolean | undefined;
}

const HeaderChips: React.FC<HeaderChipsProps> = ({
  statusIcon,
  status,
  statusColor,
  connectionType,
  sessionNumber,
  totalSessions,
  isConfirmed,
}) => {
  const showSessionNumber = (sessionNumber ?? 0) > 0 && (totalSessions ?? 0) > 0;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Chip icon={statusIcon} label={status} color={statusColor} sx={statusChipSx} />
      {connectionType ? <ConnectionChip connectionType={connectionType} /> : null}
      {showSessionNumber ? (
        <Chip
          label={`Session ${sessionNumber ?? 0}/${totalSessions ?? 0}`}
          icon={<NumbersIcon />}
          sx={semiTransparentChipSx}
        />
      ) : null}
      {isConfirmed ? (
        <Chip label="✓ Bestätigt" icon={<CheckCircleIcon />} sx={confirmedChipSx} />
      ) : null}
    </Stack>
  );
};

// Sidebar Details Card - extracted to reduce complexity
interface SidebarDetailsCardProps {
  startTime: string;
  endTime: string;
  hasVideoLink: boolean;
  isOrganizer: boolean;
  connectionId: string | undefined;
}

const SidebarDetailsCard: React.FC<SidebarDetailsCardProps> = ({
  startTime,
  endTime,
  hasVideoLink,
  isOrganizer,
  connectionId,
}) => {
  const locationText = hasVideoLink ? 'Online (Videoanruf)' : 'Präsenz';
  const roleText = isOrganizer ? 'Du unterrichtest' : 'Du lernst';

  return (
    <Card elevation={0} sx={sidebarCardSx}>
      <CardContent>
        <Typography variant="h6" fontWeight="700" gutterBottom>
          Session-Details
        </Typography>
        <List disablePadding>
          <ListItem disablePadding sx={listItemSx}>
            <ListItemIcon sx={listItemIconSx}>
              <CalendarIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Datum"
              secondary={formatDate(startTime, 'EEEE, dd. MMMM yyyy')}
              slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
            />
          </ListItem>
          <Divider sx={dividerSx} />
          <ListItem disablePadding sx={listItemSx}>
            <ListItemIcon sx={listItemIconSx}>
              <TimeIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Zeit"
              secondary={`${formatDate(startTime, 'HH:mm')} - ${formatDate(endTime, 'HH:mm')}`}
              slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
            />
          </ListItem>
          <Divider sx={dividerSx} />
          <ListItem disablePadding sx={listItemSx}>
            <ListItemIcon sx={listItemIconSx}>
              <LocationIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Ort"
              secondary={locationText}
              slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
            />
          </ListItem>
          <Divider sx={dividerSx} />
          <ListItem disablePadding sx={listItemSx}>
            <ListItemIcon sx={listItemIconSx}>
              <SchoolIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Rolle"
              secondary={roleText}
              slotProps={{ primary: { fontWeight: 600, fontSize: '0.875rem' } }}
            />
          </ListItem>
          {connectionId ? (
            <>
              <Divider sx={dividerSx} />
              <ListItem disablePadding sx={listItemSx}>
                <ListItemIcon sx={listItemIconSx}>
                  <LinkIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Connection ID"
                  secondary={`${connectionId.slice(0, 12)}...`}
                  slotProps={{
                    primary: { fontWeight: 600, fontSize: '0.875rem' },
                    secondary: { sx: { fontFamily: 'monospace', fontSize: '0.7rem' } },
                  }}
                />
              </ListItem>
            </>
          ) : null}
        </List>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Component
// ============================================================================

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
    if (!appointmentId) return;
    const foundAppointment = appointments.find((apt) => apt.id === appointmentId);
    if (foundAppointment) setAppointment(foundAppointment);
  }, [appointmentId, appointments]);

  const handleConfirmDialogOpen = (action: 'confirm' | 'cancel' | 'complete'): void => {
    const config = DIALOG_CONFIG[action];
    setConfirmDialog({ open: true, title: config.title, message: config.message, action });
  };

  const handleConfirmAction = (): void => {
    if (!appointmentId) return;

    const actions: Record<
      'confirm' | 'cancel' | 'complete',
      { execute: () => void; successMsg: string; successTitle: string }
    > = {
      confirm: {
        execute: () => respondToAppointment(appointmentId, AppointmentStatus.Confirmed),
        successMsg: 'Session wurde erfolgreich bestätigt!',
        successTitle: 'Bestätigt',
      },
      cancel: {
        execute: () => cancelAppointment(appointmentId),
        successMsg: 'Session wurde erfolgreich abgesagt',
        successTitle: 'Abgesagt',
      },
      complete: {
        execute: () => completeAppointment(appointmentId),
        successMsg: 'Session wurde erfolgreich abgeschlossen!',
        successTitle: 'Abgeschlossen',
      },
    };

    try {
      const action = actions[confirmDialog.action];
      action.execute();
      handleSuccess(action.successMsg, action.successTitle);
    } catch (err: unknown) {
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

  const statusIcon = STATUS_ICONS[appointment.status];
  const statusColor = STATUS_COLORS[appointment.status];

  const seriesProgress =
    (appointment.totalSessionsInSeries ?? 0) > 0
      ? ((appointment.completedSessionsInSeries ?? 0) / (appointment.totalSessionsInSeries ?? 1)) *
        100
      : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {statusMessage ? (
        <AlertMessage
          message={[statusMessage.text]}
          severity={statusMessage.type}
          onClose={() => {
            setStatusMessage(null);
          }}
        />
      ) : null}

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
          <Card elevation={0} sx={headerCardSx}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2}>
                <HeaderChips
                  statusIcon={statusIcon}
                  status={appointment.status}
                  statusColor={statusColor}
                  connectionType={appointment.connectionType}
                  sessionNumber={appointment.sessionNumber}
                  totalSessions={appointment.totalSessionsInSeries}
                  isConfirmed={appointment.isConfirmed}
                />

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
                  <Avatar sx={avatarSx}>
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
          <SeriesProgressCard
            title={appointment.sessionSeriesTitle}
            completed={appointment.completedSessionsInSeries ?? 0}
            total={appointment.totalSessionsInSeries ?? 0}
            progress={seriesProgress}
          />

          {/* Description */}
          <DescriptionCard description={appointment.description} />

          {/* Payment Info */}
          <PaymentInfoAlert
            isMonetary={appointment.isMonetary}
            amount={appointment.paymentAmount}
            currency={appointment.currency}
            isCompleted={appointment.isPaymentCompleted}
          />

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
              allowEarlyJoin
              earlyJoinMinutes={5}
            />
          )}

          {/* Action Buttons */}
          <ActionButtons
            canJoinCall={canJoinCall}
            canConfirm={canConfirm}
            canCancel={canCancel}
            canComplete={canComplete}
            onJoin={handleJoinVideoCall}
            onConfirmDialog={handleConfirmDialogOpen}
          />
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <SidebarDetailsCard
            startTime={appointment.startTime}
            endTime={appointment.endTime}
            hasVideoLink={(appointment.meetingLink ?? appointment.videocallUrl) !== undefined}
            isOrganizer={isOrganizer}
            connectionId={appointment.connectionId}
          />

          {/* Tips */}
          <TipsCard />
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
