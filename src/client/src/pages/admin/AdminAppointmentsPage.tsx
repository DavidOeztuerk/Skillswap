import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAppointments } from '../../hooks/useAppointments';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import { AppointmentStatus } from '../../types/models/Appointment';
import { formatDate } from '../../utils/dateUtils';

const AdminAppointmentsPage: React.FC = () => {
  const { appointments, isLoading, loadAppointments } = useAppointments();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  useEffect(() => {
    loadAppointments({ pageNumber: 1, pageSize: 100 });
  }, [loadAppointments]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      searchQuery === '' ||
      apt.skill?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.Pending:
        return 'warning';
      case AppointmentStatus.Accepted:
        return 'success';
      case AppointmentStatus.Cancelled:
        return 'error';
      case AppointmentStatus.Completed:
        return 'info';
      default:
        return 'default';
    }
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === AppointmentStatus.Pending).length,
    accepted: appointments.filter((a) => a.status === AppointmentStatus.Accepted).length,
    completed: appointments.filter((a) => a.status === AppointmentStatus.Completed).length,
    cancelled: appointments.filter((a) => a.status === AppointmentStatus.Cancelled).length,
  };

  if (isLoading && appointments.length === 0) {
    return <PageLoader variant="list" message="Lade Termine..." />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Termine-Verwaltung
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesamt
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ausstehend
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Bestätigt
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.accepted}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Abgeschlossen
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Abgesagt
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.cancelled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Suche nach Skill oder Notizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">Alle Status</MenuItem>
              <MenuItem value={AppointmentStatus.Pending}>Ausstehend</MenuItem>
              <MenuItem value={AppointmentStatus.Accepted}>Bestätigt</MenuItem>
              <MenuItem value={AppointmentStatus.Completed}>Abgeschlossen</MenuItem>
              <MenuItem value={AppointmentStatus.Cancelled}>Abgesagt</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Skill</TableCell>
                <TableCell>Datum</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Lehrer</TableCell>
                <TableCell>Schüler</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      title="Keine Termine gefunden"
                      description="Es wurden keine Termine mit den aktuellen Filterkriterien gefunden."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.id.substring(0, 8)}...</TableCell>
                    <TableCell>{appointment.skill?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {formatDate(appointment.scheduledDate, 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {appointment.teacherDetails?.firstName ||
                        appointment.organizerUserId?.substring(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {appointment.studentDetails?.firstName ||
                        appointment.participantUserId?.substring(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" color="default">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AdminAppointmentsPage;