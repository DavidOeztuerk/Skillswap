import React, { useEffect, useState } from 'react';
import { formatDate } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  // VideoCall as VideoCallIcon,
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
  Share as ShareIcon,
  CalendarToday as CalendarIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  DoneAll as DoneAllIcon,
  Update as UpdateIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Drawer,
} from '@mui/material';
import { FEATURES } from '../../../core/config/featureFlags';
import errorService from '../../../core/services/errorService';
import AppointmentErrorBoundary from '../../../shared/components/error/AppointmentErrorBoundary';
import AlertMessage from '../../../shared/components/ui/AlertMessage';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import EmptyState from '../../../shared/components/ui/EmptyState';
import PageLoader from '../../../shared/components/ui/PageLoader';
import { formatDateTimeRange, isPastDate } from '../../../shared/utils/dateUtils';
import { useAuth } from '../../auth/hooks/useAuth';
import InlineChatPanel from '../../chat/components/InlineChatPanel';
import MeetingLinkSection from '../components/MeetingLinkSection';
import RescheduleDialog from '../components/RescheduleDialog';
import { useAppointments } from '../hooks/useAppointments';
import appointmentService from '../services/appointmentService';
import { type Appointment, AppointmentStatus } from '../types/Appointment';

// Constants
const UNKNOWN_ERROR = 'Unknown error';

// Dialog configuration
const DIALOG_CONFIG = {
  confirm: {
    title: 'Termin bestätigen',
    message: 'Möchtest du diesen Termin bestätigen?',
    successMessage: 'Termin wurde erfolgreich bestätigt',
    status: AppointmentStatus.Confirmed,
  },
  cancel: {
    title: 'Termin absagen',
    message: 'Möchtest du diesen Termin wirklich absagen?',
    successMessage: 'Termin wurde abgesagt',
    status: AppointmentStatus.Cancelled,
  },
  complete: {
    title: 'Termin abschließen',
    message: 'Möchtest du diesen Termin als abgeschlossen markieren?',
    successMessage: 'Termin wurde als abgeschlossen markiert',
    status: null, // Uses completeAppointment instead
  },
} as const;

// Status configuration for icons, colors, and labels
const STATUS_CONFIG: Record<
  AppointmentStatus,
  {
    icon: React.ReactElement;
    color: 'warning' | 'success' | 'error' | 'info' | 'default';
    label: string;
  }
> = {
  [AppointmentStatus.Pending]: {
    icon: <ScheduleIcon />,
    color: 'warning',
    label: 'Ausstehend',
  },
  [AppointmentStatus.Confirmed]: {
    icon: <EventAvailableIcon />,
    color: 'success',
    label: 'Bestätigt',
  },
  [AppointmentStatus.Cancelled]: {
    icon: <EventBusyIcon />,
    color: 'error',
    label: 'Abgesagt',
  },
  [AppointmentStatus.Completed]: {
    icon: <DoneAllIcon />,
    color: 'info',
    label: 'Abgeschlossen',
  },
  [AppointmentStatus.Rescheduled]: {
    icon: <ScheduleIcon />,
    color: 'warning',
    label: 'Verschoben',
  },
};

// Helper to extract error message
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : UNKNOWN_ERROR;
}

// Helper to calculate action permissions
interface ActionPermissions {
  canConfirm: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canComplete: boolean;
}

function calculateActionPermissions(
  appointment: Appointment,
  isTeacher: boolean
): ActionPermissions {
  return {
    canConfirm: isTeacher && appointment.status === AppointmentStatus.Pending,
    canCancel:
      appointment.status === AppointmentStatus.Pending ||
      (appointment.status === AppointmentStatus.Confirmed && !isPastDate(appointment.startTime)),
    canReschedule:
      appointment.status === AppointmentStatus.Confirmed &&
      !isPastDate(appointment.startTime) &&
      isTeacher,
    canComplete:
      isTeacher &&
      appointment.status === AppointmentStatus.Confirmed &&
      isPastDate(appointment.endTime),
  };
}

// Helper to get chat partner info
interface ChatPartnerInfo {
  threadId: string | null;
  partnerId: string | null;
  partnerName: string;
  partnerAvatarUrl: string | undefined;
}

function getChatPartnerInfo(
  appointment: Appointment,
  isTeacher: boolean,
  otherUser: Appointment['studentDetails']
): ChatPartnerInfo {
  const partnerId = isTeacher
    ? (appointment.studentId ?? appointment.participantUserId ?? appointment.otherPartyUserId)
    : (appointment.teacherId ?? appointment.organizerUserId ?? appointment.otherPartyUserId);

  const fullName = `${otherUser?.firstName ?? ''} ${otherUser?.lastName ?? ''}`.trim();
  const partnerName = fullName.length > 0 ? fullName : (appointment.otherPartyName ?? 'Partner');
  const partnerAvatarUrl = otherUser?.profilePictureUrl ?? appointment.otherPartyAvatarUrl;

  return {
    threadId: appointment.threadId ?? null,
    partnerId: partnerId ?? null,
    partnerName,
    partnerAvatarUrl,
  };
}

// Helper to handle API response validation
function validateMeetingLinkResponse(
  response: Awaited<ReturnType<typeof appointmentService.generateMeetingLink>>
): string {
  if (!response.success) {
    const errorMsg =
      'errors' in response ? response.errors.join(', ') : 'Failed to generate meeting link';
    throw new Error(errorMsg);
  }

  if (!('data' in response) || !response.data) {
    throw new Error('No meeting link returned from server');
  }

  return response.data;
}

// Action buttons component to reduce main component complexity
interface ActionButtonsProps {
  permissions: ActionPermissions;
  onConfirmDialogOpen: (action: 'confirm' | 'cancel' | 'complete') => void;
  onRescheduleOpen: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  permissions,
  onConfirmDialogOpen,
  onRescheduleOpen,
}) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {permissions.canConfirm ? (
      <Button
        variant="outlined"
        color="success"
        startIcon={<CheckIcon />}
        onClick={() => onConfirmDialogOpen('confirm')}
      >
        Bestätigen
      </Button>
    ) : null}
    {permissions.canCancel ? (
      <Button
        variant="outlined"
        color="error"
        startIcon={<CancelIcon />}
        onClick={() => onConfirmDialogOpen('cancel')}
      >
        Absagen
      </Button>
    ) : null}
    {permissions.canComplete ? (
      <Button
        variant="outlined"
        color="info"
        startIcon={<DoneAllIcon />}
        onClick={() => onConfirmDialogOpen('complete')}
      >
        Abschließen
      </Button>
    ) : null}
    {permissions.canReschedule ? (
      <Button variant="outlined" startIcon={<UpdateIcon />} onClick={onRescheduleOpen}>
        Verschieben
      </Button>
    ) : null}
  </Box>
);

// Header icon buttons component
interface HeaderActionsProps {
  canReschedule: boolean;
  onRescheduleOpen: () => void;
  onShare: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  canReschedule,
  onRescheduleOpen,
  onShare,
}) => (
  <Box sx={{ display: 'flex', gap: 1 }}>
    {canReschedule ? (
      <Tooltip title="Termin verschieben">
        <IconButton onClick={onRescheduleOpen}>
          <UpdateIcon />
        </IconButton>
      </Tooltip>
    ) : null}
    <Tooltip title="Teilen">
      <IconButton onClick={onShare}>
        <ShareIcon />
      </IconButton>
    </Tooltip>
    <Tooltip title="Bearbeiten">
      <IconButton>
        <EditIcon />
      </IconButton>
    </Tooltip>
  </Box>
);

// Chat drawer component
interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  chatPartner: ChatPartnerInfo;
  skillId?: string;
  skillName?: string;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({
  open,
  onClose,
  chatPartner,
  skillId,
  skillName,
}) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    slotProps={{
      paper: {
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100%',
        },
      },
    }}
  >
    {chatPartner.partnerId && chatPartner.threadId ? (
      <InlineChatPanel
        threadId={chatPartner.threadId}
        partnerId={chatPartner.partnerId}
        partnerName={chatPartner.partnerName}
        partnerAvatarUrl={chatPartner.partnerAvatarUrl}
        skillId={skillId}
        skillName={skillName}
        height="100vh"
        onClose={onClose}
        defaultExpanded
      />
    ) : null}
  </Drawer>
);

// Participant info section
interface ParticipantInfoProps {
  otherUser: Appointment['studentDetails'];
  isTeacher: boolean;
  showChat: boolean;
  onToggleChat: () => void;
}

const ParticipantInfo: React.FC<ParticipantInfoProps> = ({
  otherUser,
  isTeacher,
  showChat,
  onToggleChat,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
    <Avatar sx={{ width: 56, height: 56 }}>
      <PersonIcon />
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6">
        {otherUser?.firstName ?? ''} {otherUser?.lastName ?? ''}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {isTeacher ? 'Lernende:r' : 'Lehrende:r'}
      </Typography>
    </Box>
    <Tooltip title={showChat ? 'Chat schließen' : 'Chat öffnen'}>
      <IconButton
        color={showChat ? 'primary' : 'default'}
        onClick={onToggleChat}
        sx={{
          bgcolor: showChat ? 'primary.main' : 'action.hover',
          color: showChat ? 'primary.contrastText' : 'text.primary',
          '&:hover': {
            bgcolor: showChat ? 'primary.dark' : 'action.selected',
          },
        }}
      >
        {showChat ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
      </IconButton>
    </Tooltip>
  </Box>
);

// Notes section
interface NotesSectionProps {
  notes: string | undefined;
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes }) => {
  if (!notes) return null;
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotesIcon />
        Notizen
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="body2">{notes}</Typography>
      </Paper>
    </Box>
  );
};

// Status message component
interface StatusMessageProps {
  message: { text: string; type: 'success' | 'error' | 'info' } | null;
  onClose: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, onClose }) => {
  if (!message) return null;
  return <AlertMessage message={[message.text]} severity={message.type} onClose={onClose} />;
};

// Reschedule dialog wrapper
interface RescheduleDialogWrapperProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onReschedule: (newDateTime: Date, newDuration?: number, reason?: string) => Promise<void>;
}

const RescheduleDialogWrapper: React.FC<RescheduleDialogWrapperProps> = ({
  open,
  onClose,
  appointment,
  onReschedule,
}) => {
  if (!appointment.id) return null;
  return (
    <RescheduleDialog
      open={open}
      onClose={onClose}
      appointment={appointment}
      onReschedule={onReschedule}
      availableSlots={[]}
    />
  );
};

const AppointmentDetailPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { appointments, respondToAppointment, completeAppointment, isLoading, error } =
    useAppointments();

  // Local state
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
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
    if (!appointmentId) return;

    errorService.addBreadcrumb('Loading appointment detail', 'navigation', { appointmentId });
    const foundAppointment = appointments.find((apt) => apt.id === appointmentId);

    if (!foundAppointment) {
      errorService.addBreadcrumb('Appointment not found', 'error', { appointmentId });
      return;
    }

    setAppointment(foundAppointment);
    errorService.addBreadcrumb('Appointment loaded successfully', 'data', {
      appointmentId,
      skillName: foundAppointment.skill?.name ?? 'Unknown',
    });
  }, [appointmentId, appointments]);

  const handleConfirmDialogOpen = (action: 'confirm' | 'cancel' | 'complete'): void => {
    errorService.addBreadcrumb('Opening appointment action dialog', 'ui', {
      appointmentId,
      action,
    });

    const isCompletionDisabled = action === 'complete' && !FEATURES.appointments.enableCompletion;
    if (isCompletionDisabled) {
      setStatusMessage({ text: 'Abschließen ist derzeit nicht verfügbar', type: 'info' });
      return;
    }

    const config = DIALOG_CONFIG[action];
    setConfirmDialog({ open: true, title: config.title, message: config.message, action });
  };

  const executeAppointmentAction = (action: 'confirm' | 'cancel' | 'complete'): void => {
    if (!appointmentId) return;

    const config = DIALOG_CONFIG[action];

    if (action === 'complete') {
      completeAppointment(appointmentId);
    } else if (config.status !== null) {
      respondToAppointment(appointmentId, config.status);
    }

    setStatusMessage({ text: config.successMessage, type: 'success' });
    errorService.addBreadcrumb('Appointment action completed', 'action', { appointmentId, action });
  };

  const handleConfirmAction = (): void => {
    const { action } = confirmDialog;

    try {
      errorService.addBreadcrumb('Performing appointment action', 'action', {
        appointmentId,
        action,
      });
      executeAppointmentAction(action);
    } catch (actionError: unknown) {
      const errorMessage = getErrorMessage(actionError);
      errorService.addBreadcrumb('Error performing appointment action', 'error', {
        appointmentId,
        action,
        error: errorMessage,
      });
      setStatusMessage({ text: `Fehler bei der Terminverwaltung: ${errorMessage}`, type: 'error' });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  // const handleJoinVideoCall = () => {
  //   errorService.addBreadcrumb('Joining video call', 'navigation', { appointmentId });

  //   if (appointmentId) {
  //     navigate(`/videocall/${appointmentId}`);
  //   }
  // };

  const handleGenerateMeetingLink = async (): Promise<string> => {
    if (!appointmentId) throw new Error('Appointment ID is required');

    errorService.addBreadcrumb('Generating meeting link', 'action', { appointmentId });

    try {
      const response = await appointmentService.generateMeetingLink(appointmentId);
      const meetingLink = validateMeetingLinkResponse(response);

      errorService.addBreadcrumb('Meeting link generated successfully', 'action', {
        appointmentId,
      });
      setStatusMessage({ text: 'Meeting-Link wurde erfolgreich generiert', type: 'success' });
      return meetingLink;
    } catch (generateError) {
      errorService.addBreadcrumb('Error generating meeting link', 'error', {
        appointmentId,
        error: getErrorMessage(generateError),
      });
      setStatusMessage({ text: 'Fehler beim Generieren des Meeting-Links', type: 'error' });
      throw generateError;
    }
  };

  const handleRefreshMeetingLink = async (): Promise<string> => {
    if (!appointmentId) throw new Error('Appointment ID is required');

    errorService.addBreadcrumb('Refreshing meeting link', 'action', { appointmentId });

    try {
      const response = await appointmentService.generateMeetingLink(appointmentId);
      const meetingLink = validateMeetingLinkResponse(response);

      errorService.addBreadcrumb('Meeting link refreshed successfully', 'action', {
        appointmentId,
      });
      setStatusMessage({ text: 'Meeting-Link wurde aktualisiert', type: 'success' });
      return meetingLink;
    } catch (refreshError) {
      errorService.addBreadcrumb('Error refreshing meeting link', 'error', {
        appointmentId,
        error: getErrorMessage(refreshError),
      });
      setStatusMessage({ text: 'Fehler beim Aktualisieren des Meeting-Links', type: 'error' });
      throw refreshError;
    }
  };

  const handleReschedule = async (
    newDateTime: Date,
    newDuration?: number,
    reason?: string
  ): Promise<void> => {
    if (!appointmentId) return;

    errorService.addBreadcrumb('Rescheduling appointment', 'action', {
      appointmentId,
      newDateTime: newDateTime.toISOString(),
    });

    try {
      await appointmentService.rescheduleAppointment(
        appointmentId,
        newDateTime.toISOString(),
        newDuration,
        reason
      );
      setStatusMessage({ text: 'Termin wurde erfolgreich verschoben', type: 'success' });
      setRescheduleDialogOpen(false);
    } catch (rescheduleError) {
      errorService.addBreadcrumb('Error rescheduling appointment', 'error', {
        appointmentId,
        error: getErrorMessage(rescheduleError),
      });
      const isNotImplemented =
        rescheduleError instanceof Error && rescheduleError.message.includes('not implemented');
      setStatusMessage({
        text: isNotImplemented
          ? 'Termin-Verschiebung wird bald verfügbar sein'
          : 'Fehler beim Verschieben des Termins',
        type: isNotImplemented ? 'info' : 'error',
      });
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
      } catch {
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
          description="Der angeforderte Termin existiert nicht oder ist nicht verfügbar."
          actionLabel="Zurück zu Terminen"
          actionHandler={() => navigate('/appointments')}
        />
      </Container>
    );
  }

  // Determine if current user is the teacher/organizer
  const isTeacher =
    appointment.teacherId === user?.id ||
    appointment.organizerUserId === user?.id ||
    appointment.isOrganizer === true;
  const otherUser = isTeacher ? appointment.studentDetails : appointment.teacherDetails;
  const { canConfirm, canCancel, canReschedule, canComplete } = calculateActionPermissions(
    appointment,
    isTeacher
  );

  // Get status config from lookup
  const statusConfig = STATUS_CONFIG[appointment.status];

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {/* Status messages */}
      <StatusMessage message={statusMessage} onClose={() => setStatusMessage(null)} />

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
                    icon={statusConfig.icon}
                    label={statusConfig.label}
                    color={statusConfig.color}
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

              <HeaderActions
                canReschedule={canReschedule}
                onRescheduleOpen={() => setRescheduleDialogOpen(true)}
                onShare={handleShare}
              />
            </Box>

            {/* Participant info */}
            <ParticipantInfo
              otherUser={otherUser}
              isTeacher={isTeacher}
              showChat={showChat}
              onToggleChat={() => setShowChat(!showChat)}
            />

            {/* Notes */}
            <NotesSection notes={appointment.notes} />

            {/* Action buttons */}
            <Divider sx={{ my: 3 }} />
            <ActionButtons
              permissions={{ canConfirm, canCancel, canComplete, canReschedule }}
              onConfirmDialogOpen={handleConfirmDialogOpen}
              onRescheduleOpen={() => setRescheduleDialogOpen(true)}
            />
          </Paper>

          {/* Meeting Link Section */}
          {appointment.status === AppointmentStatus.Confirmed && appointmentId ? (
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
              allowEarlyJoin
              earlyJoinMinutes={5}
            />
          ) : null}
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
      <RescheduleDialogWrapper
        open={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        appointment={appointment}
        onReschedule={handleReschedule}
      />

      {/* Chat Drawer - Opens from right */}
      <ChatDrawer
        open={showChat}
        onClose={() => setShowChat(false)}
        chatPartner={getChatPartnerInfo(appointment, isTeacher, otherUser)}
        skillId={appointment.skill?.id}
        skillName={appointment.skill?.name}
      />
    </Container>
  );
};

const WrappedAppointmentDetailPage: React.FC = () => (
  <AppointmentErrorBoundary>
    <AppointmentDetailPage />
  </AppointmentErrorBoundary>
);

export default WrappedAppointmentDetailPage;
