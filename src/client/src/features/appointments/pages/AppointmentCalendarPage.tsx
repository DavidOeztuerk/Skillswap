import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  List as ListIcon,
  VideoCall,
  SwapHoriz,
  AttachMoney,
  Person,
  Schedule,
  Close,
} from '@mui/icons-material';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import errorService from '../../../core/services/errorService';
import EmptyState from '../../../shared/components/ui/EmptyState';
import PageLoader from '../../../shared/components/ui/PageLoader';
import { useAuth } from '../../auth/hooks/useAuth';
import CalendarView from '../components/CalendarView';
import { useAppointments } from '../hooks/useAppointments';
import { type Appointment, AppointmentStatus } from '../types/Appointment';

const AppointmentCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appointments, isLoading, error, loadAppointments } = useAppointments();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    errorService.addBreadcrumb('Loading appointment calendar', 'navigation');
    loadAppointments({ pageNumber: 1, pageSize: 100, includePast: true });
  }, [loadAppointments]);

  const handleAppointmentClick = (appointment: Appointment): void => {
    setSelectedAppointment(appointment);
    setDetailDialogOpen(true);
    errorService.addBreadcrumb('Viewing appointment details', 'ui', {
      appointmentId: appointment.id,
    });
  };

  const handleDateClick = (date: Date): void => {
    // Date selection handling can be added here if needed
    errorService.addBreadcrumb('Selected calendar date', 'ui', { date: date.toISOString() });
  };

  const handleViewDetails = (): void => {
    if (selectedAppointment) {
      void navigate(`/appointments/${selectedAppointment.id}`);
    }
  };

  const handleJoinCall = (): void => {
    if (selectedAppointment?.id) {
      void navigate(`/videocall/${selectedAppointment.id}`);
    }
  };

  // Check if appointment can be joined (5 minutes before start)
  const canJoinCall = (appointment: Appointment | null): { canJoin: boolean; message: string } => {
    if (!appointment?.scheduledDate) {
      return { canJoin: false, message: 'Kein Termin ausgewählt' };
    }

    const now = new Date();
    const appointmentStart = new Date(appointment.scheduledDate);
    const appointmentEnd = new Date(
      appointmentStart.getTime() + appointment.durationMinutes * 60000
    );
    const fiveMinutesBefore = new Date(appointmentStart.getTime() - 5 * 60000);

    // Can join 5 minutes before until appointment end
    if (now < fiveMinutesBefore) {
      const minutesUntil = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / 60000);
      return {
        canJoin: false,
        message: `Verfügbar in ${minutesUntil} Minute${minutesUntil === 1 ? '' : 'n'}`,
      };
    }

    if (now > appointmentEnd) {
      return { canJoin: false, message: 'Termin ist beendet' };
    }

    return { canJoin: true, message: 'Jetzt beitreten' };
  };

  const getAppointmentIcon = (appointment: Appointment): React.ReactNode => {
    if (appointment.isSkillExchange) return <SwapHoriz />;
    if (appointment.isMonetary) return <AttachMoney />;
    return <VideoCall />;
  };

  const getStatusColor = (status: string): 'warning' | 'success' | 'info' | 'default' | 'error' => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Accepted':
        return 'success';
      case 'Scheduled':
        return 'info';
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <PageLoader message="Kalender wird geladen..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Fehler beim Laden"
          description="Die Termine konnten nicht geladen werden. Bitte versuche es später erneut."
          actionLabel="Neu laden"
          actionHandler={() => {
            window.location.reload();
          }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Terminkalender
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Verwalte deine Lern- und Lehrtermine
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ListIcon />}
              onClick={() => navigate('/appointments')}
            >
              Listenansicht
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/appointments/new')}
            >
              Neuer Termin
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">
            {appointments.filter((a) => a.status === AppointmentStatus.Confirmed).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Anstehende Termine
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">
            {appointments.filter((a) => a.status === AppointmentStatus.Pending).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ausstehende Anfragen
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">
            {appointments.filter((a) => a.status === AppointmentStatus.Completed).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Abgeschlossene Termine
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">
            {
              appointments.filter((a) => {
                const today = new Date();
                const aptDate = new Date(a.scheduledDate);
                return aptDate.toDateString() === today.toDateString();
              }).length
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Heute
          </Typography>
        </Paper>
      </Stack>

      {/* Calendar */}
      <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 600 }}>
        <CalendarView
          appointments={appointments}
          onAppointmentClick={handleAppointmentClick}
          onDateClick={handleDateClick}
        />
      </Box>

      {/* Appointment Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Termindetails</Typography>
            <IconButton
              size="small"
              onClick={() => {
                setDetailDialogOpen(false);
              }}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAppointment ? (
            <Box>
              {/* Status */}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={selectedAppointment.status}
                  color={getStatusColor(selectedAppointment.status)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                {selectedAppointment.sessionNumber !== undefined &&
                  selectedAppointment.totalSessionsInSeries !== undefined &&
                  selectedAppointment.sessionNumber > 1 && (
                    <Chip
                      label={`Session ${selectedAppointment.sessionNumber.toString()}/${selectedAppointment.totalSessionsInSeries.toString()}`}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1, mb: 1 }}
                    />
                  )}
              </Box>

              {/* Title */}
              <Typography variant="h6" gutterBottom>
                {selectedAppointment.title}
              </Typography>

              {/* Description */}
              {selectedAppointment.description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedAppointment.description}
                </Typography>
              ) : null}

              {/* Details List */}
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary="Datum & Zeit"
                    secondary={format(
                      new Date(selectedAppointment.scheduledDate),
                      "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'",
                      { locale: de }
                    )}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="Teilnehmer"
                    secondary={
                      selectedAppointment.organizerUserId === user?.id
                        ? 'Du (Organisator)'
                        : 'Teilnehmer'
                    }
                  />
                </ListItem>

                {selectedAppointment.skillId ? (
                  <ListItem>
                    <ListItemIcon>{getAppointmentIcon(selectedAppointment)}</ListItemIcon>
                    <ListItemText primary="Skill" secondary={selectedAppointment.skillId} />
                  </ListItem>
                ) : null}

                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dauer"
                    secondary={`${selectedAppointment.durationMinutes.toString()} Minuten`}
                  />
                </ListItem>

                {selectedAppointment.isMonetary &&
                selectedAppointment.paymentAmount != null &&
                selectedAppointment.paymentAmount > 0 ? (
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney />
                    </ListItemIcon>
                    <ListItemText
                      primary="Bezahlung"
                      secondary={`${selectedAppointment.paymentAmount} ${selectedAppointment.currency ?? 'EUR'}`}
                    />
                  </ListItem>
                ) : null}
              </List>

              {/* Meeting Link */}
              {selectedAppointment.meetingLink
                ? (() => {
                    const joinStatus = canJoinCall(selectedAppointment);
                    return (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: joinStatus.canJoin ? 'primary.light' : 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {joinStatus.canJoin ? 'Meeting-Link verfügbar' : 'Meeting-Raum'}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<VideoCall />}
                          onClick={handleJoinCall}
                          disabled={!joinStatus.canJoin}
                          fullWidth
                        >
                          {joinStatus.message}
                        </Button>
                        {!joinStatus.canJoin && joinStatus.message.includes('Verfügbar') && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
                          >
                            Der Raum öffnet sich 5 Minuten vor Terminbeginn
                          </Typography>
                        )}
                      </Box>
                    );
                  })()
                : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailDialogOpen(false);
            }}
          >
            Schließen
          </Button>
          <Button variant="contained" onClick={handleViewDetails}>
            Details anzeigen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentCalendarPage;
