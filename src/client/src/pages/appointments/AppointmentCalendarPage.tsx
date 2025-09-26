import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import CalendarView from '../../components/appointments/CalendarView';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import errorService from '../../services/errorService';

const AppointmentCalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { appointments, isLoading, errorMessage } = useAppointments();
    
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    useEffect(() => {
        errorService.addBreadcrumb('Loading appointment calendar', 'navigation');
    }, []);

    const handleAppointmentClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setDetailDialogOpen(true);
        errorService.addBreadcrumb('Viewing appointment details', 'ui', { appointmentId: appointment.id });
    };

    const handleDateClick = (date: Date) => {
        // Date selection handling can be added here if needed
        errorService.addBreadcrumb('Selected calendar date', 'ui', { date: date.toISOString() });
    };

    const handleViewDetails = () => {
        if (selectedAppointment) {
            navigate(`/appointments/${selectedAppointment.id}`);
        }
    };

    const handleJoinCall = () => {
        if (selectedAppointment?.meetingLink) {
            window.open(selectedAppointment.meetingLink, '_blank');
        }
    };

    const getAppointmentIcon = (appointment: Appointment) => {
        if (appointment.isSkillExchange) return <SwapHoriz />;
        if (appointment.isMonetary) return <AttachMoney />;
        return <VideoCall />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'warning';
            case 'Accepted': return 'success';
            case 'Scheduled': return 'info';
            case 'Completed': return 'default';
            case 'Cancelled': return 'error';
            default: return 'default';
        }
    };

    if (isLoading) {
        return <PageLoader message="Kalender wird geladen..." />;
    }

    if (errorMessage) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <EmptyState
                    title="Fehler beim Laden"
                    description="Die Termine konnten nicht geladen werden. Bitte versuche es später erneut."
                    actionLabel="Neu laden"
                    actionHandler={() => window.location.reload()}
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
                        {appointments.filter(a => a.status === AppointmentStatus.Accepted).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Anstehende Termine
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6">
                        {appointments.filter(a => a.status === AppointmentStatus.Pending).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Ausstehende Anfragen
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6">
                        {appointments.filter(a => a.status === 'Completed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Abgeschlossene Termine
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant="h6">
                        {appointments.filter(a => {
                            const today = new Date();
                            const aptDate = new Date(a.scheduledDate);
                            return aptDate.toDateString() === today.toDateString();
                        }).length}
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
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Termindetails</Typography>
                        <IconButton
                            size="small"
                            onClick={() => setDetailDialogOpen(false)}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedAppointment && (
                        <Box>
                            {/* Status */}
                            <Box sx={{ mb: 2 }}>
                                <Chip
                                    label={selectedAppointment.status}
                                    color={getStatusColor(selectedAppointment.status)}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                {selectedAppointment.sessionNumber && selectedAppointment.sessionNumber > 1 && (
                                    <Chip
                                        label={`Session ${selectedAppointment.sessionNumber}/${selectedAppointment.totalSessions}`}
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
                            {selectedAppointment.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {selectedAppointment.description}
                                </Typography>
                            )}

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
                                        secondary={`${selectedAppointment.organizerUserId === user?.id ? 'Du (Organisator)' : 'Teilnehmer'}`}
                                    />
                                </ListItem>

                                {selectedAppointment.skillId && (
                                    <ListItem>
                                        <ListItemIcon>
                                            {getAppointmentIcon(selectedAppointment)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Skill"
                                            secondary={selectedAppointment.skillId}
                                        />
                                    </ListItem>
                                )}

                                <ListItem>
                                    <ListItemIcon>
                                        <Schedule />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Dauer"
                                        secondary={`${selectedAppointment.durationMinutes} Minuten`}
                                    />
                                </ListItem>

                                {selectedAppointment.isMonetary && selectedAppointment.amount && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <AttachMoney />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Bezahlung"
                                            secondary={`${selectedAppointment.amount} ${selectedAppointment.currency || 'EUR'}`}
                                        />
                                    </ListItem>
                                )}
                            </List>

                            {/* Meeting Link */}
                            {selectedAppointment.meetingLink && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Meeting-Link verfügbar
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<VideoCall />}
                                        onClick={handleJoinCall}
                                        fullWidth
                                    >
                                        Videoanruf beitreten
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>
                        Schließen
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleViewDetails}
                    >
                        Details anzeigen
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AppointmentCalendarPage;