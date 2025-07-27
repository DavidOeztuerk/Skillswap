import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Avatar,
  Chip,
  IconButton,
  Badge,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
} from '@mui/material';
import {
  Event as EventIcon,
  Add as AddIcon,
  Today as TodayIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  VideoCall as VideoCallIcon,
  Edit as EditIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import {
  fetchAppointments,
  fetchUpcomingAppointments,
  fetchPastAppointments,
  respondToAppointment,
  cancelAppointment,
  rescheduleAppointment,
  rateAppointment,
} from '../../features/appointments/appointmentsSlice';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { AppointmentStatus } from '../../types/models/Appointment';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appointments-tabpanel-${index}`}
      aria-labelledby={`appointments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedAppointmentsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [newDateTime, setNewDateTime] = useState<Date | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const dispatch = useAppDispatch();
  const {
    appointments,
    upcomingAppointments,
    pagination,
    isLoading,
    error,
  } = useAppSelector((state) => state.appointments);

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchUpcomingAppointments({ limit: 5 }));
    dispatch(fetchPastAppointments({ page: pagination.page, limit: pagination.limit }));
  }, [dispatch, pagination.page, pagination.limit]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAcceptAppointment = (appointmentId: string) => {
    dispatch(respondToAppointment({ appointmentId, status: AppointmentStatus.Confirmed }));
  };

  const handleCancelAppointment = (appointmentId: string) => {
    dispatch(cancelAppointment(appointmentId));
  };

  const handleRescheduleAppointment = () => {
    if (selectedAppointment && newDateTime) {
      dispatch(rescheduleAppointment({
        appointmentId: selectedAppointment.id,
        newDateTime: newDateTime.toISOString(),
        reason: rescheduleReason.trim() || undefined,
      }));
      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setNewDateTime(null);
      setRescheduleReason('');
    }
  };

  const handleRateAppointment = () => {
    if (selectedAppointment && rating > 0) {
      dispatch(rateAppointment({
        appointmentId: selectedAppointment.id,
        rating,
        feedback: feedback.trim() || undefined,
      }));
      setRatingDialogOpen(false);
      setSelectedAppointment(null);
      setRating(0);
      setFeedback('');
    }
  };

  const openRescheduleDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRescheduleDialogOpen(true);
  };

  const openRatingDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRatingDialogOpen(true);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.Confirmed:
        return 'success';
      case AppointmentStatus.Pending:
        return 'warning';
      case AppointmentStatus.Cancelled:
        return 'error';
      case AppointmentStatus.Completed:
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.Confirmed:
        return <CheckIcon />;
      case AppointmentStatus.Pending:
        return <ScheduleIcon />;
      case AppointmentStatus.Cancelled:
        return <CloseIcon />;
      case AppointmentStatus.Completed:
        return <StarIcon />;
      default:
        return <EventIcon />;
    }
  };

  if (isLoading && appointments?.length === 0) {
    return <LoadingSpinner fullPage message="Lade Termine..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Meine Termine"
        subtitle="Verwalte deine Skill-Sessions und Lerntermine"
        icon={<EventIcon />}
        actions={
          <Box display="flex" gap={1}>
            <Button variant="contained" startIcon={<AddIcon />}>
              Neuer Termin
            </Button>
            <IconButton>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={() => dispatch(fetchAppointments())}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Quick Stats */}
      <Box display="flex" gap={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: '1 1 0' }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">
                    {upcomingAppointments.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Anstehend
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                  <TodayIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <TodayIcon sx={{ mr: 1 }} />
                  Anstehend
                  {upcomingAppointments?.length > 0 && (
                    <Badge badgeContent={upcomingAppointments.length} color="primary" sx={{ ml: 1 }} />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <EventIcon sx={{ mr: 1 }} />
                  Alle Termine
                </Box>
              }
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Upcoming Appointments Tab */}
      <TabPanel value={currentTab} index={0}>
        <Box display="flex" flexDirection="column" gap={3}>
          {upcomingAppointments?.length === 0 ? (
            <Box>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Keine anstehenden Termine
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Vereinbare deinen ersten Termin!
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
                  Termin erstellen
                </Button>
              </Box>
            </Box>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={3}>
              {upcomingAppointments.map((appointment) => (
              <Box key={appointment.id} sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <SchoolIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {'Skill Session'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {appointment.skill?.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status) as any}
                        icon={getStatusIcon(appointment.status)}
                        size="small"
                      />
                    </Box>

                    <Box display="flex" gap={1} mt={2}>
                      {appointment.status === AppointmentStatus.Pending && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAcceptAppointment(appointment.id)}
                            startIcon={<CheckIcon />}
                          >
                            Bestätigen
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            startIcon={<CloseIcon />}
                          >
                            Ablehnen
                          </Button>
                        </>
                      )}
                      
                      {appointment.status === AppointmentStatus.Confirmed && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<VideoCallIcon />}
                          >
                            Video-Call
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openRescheduleDialog(appointment)}
                            startIcon={<EditIcon />}
                          >
                            Verschieben
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              ))}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* All Appointments Tab */}
      <TabPanel value={currentTab} index={1}>
        <Box>
          <Box>
            <Typography variant="h6">
              Alle Termine ({appointments.length})
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
              {appointments.map((appointment) => (
                <Box key={appointment.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" flex={1}>
                          <Avatar sx={{ mr: 2 }}>
                            <EventIcon />
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h6">
                              {'Termin'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {appointment.skill?.name}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={appointment.status}
                            color={getStatusColor(appointment.status) as any}
                            icon={getStatusIcon(appointment.status)}
                            size="small"
                          />
                          
                          {appointment.status === AppointmentStatus.Completed && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openRatingDialog(appointment)}
                              startIcon={<StarIcon />}
                            >
                              Bewerten
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Termin verschieben</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Neuen Zeitpunkt wählen
            </Typography>
            <DatePicker
              label="Datum"
              value={newDateTime}
              onChange={(newValue) => setNewDateTime(newValue)}
              sx={{ width: '100%', mb: 2 }}
            />
            <TimePicker
              label="Zeit"
              value={newDateTime}
              onChange={(newValue) => setNewDateTime(newValue)}
              sx={{ width: '100%' }}
            />
          </Box>
          <TextField
            label="Grund für Verschiebung (optional)"
            multiline
            rows={3}
            fullWidth
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
            placeholder="Warum möchtest du den Termin verschieben?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleRescheduleAppointment} variant="contained" disabled={!newDateTime}>
            Verschieben
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Termin bewerten</DialogTitle>
        <DialogContent>
          <Box textAlign="center" mb={3}>
            <Typography variant="h6" gutterBottom>
              Wie war deine Session?
            </Typography>
            <Rating
              value={rating}
              onChange={(_event, newValue) => setRating(newValue || 0)}
              size="large"
            />
          </Box>
          <TextField
            label="Feedback (optional)"
            multiline
            rows={3}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Teile deine Erfahrung mit..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleRateAppointment} variant="contained" disabled={rating === 0}>
            Bewerten
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default EnhancedAppointmentsPage;