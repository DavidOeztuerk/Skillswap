import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Divider,
  Pagination,
  type SelectChangeEvent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  RestartAlt as ResetIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { de } from 'date-fns/locale';
import { startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import AppointmentCard from './AppointmentCard';
import SkeletonLoader from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import { type Appointment, AppointmentStatus } from '../../types/models/Appointment';

/**
 * Props für die Terminliste
 */
interface AppointmentListProps {
  appointments: Appointment[];
  isLoading?: boolean;
  error?: string | null;
  userRole?: 'teacher' | 'student';
  onConfirm?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onComplete?: (appointmentId: string) => void;
}

/**
 * Komponente zur Anzeige einer Liste von Terminen mit Filter- und Tab-Funktionen
 */
const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  isLoading = false,
  error = null,
  userRole,
  onConfirm,
  onCancel,
  onComplete,
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const appointmentsPerPage = 8;
  const tabs = ['Alle Termine', 'Ausstehend', 'Bestätigt', 'Vergangen'];

  // Filterlogik
  const filteredAppointments = useMemo(() => {
    if (appointments.length === 0) return [];
    return appointments.filter((appointment) => {
      // Welcher Nutzer ist "der andere"?
      const otherUser =
        userRole === 'teacher' ? appointment.studentDetails : appointment.teacherDetails;

      const otherUserName =
        `${otherUser?.firstName ?? ''} ${otherUser?.lastName ?? ''}`.toLowerCase();
      const skillName = appointment.skill?.name.toLowerCase() ?? '';

      // Suche (Skill oder Personenname)
      const matchesSearch =
        searchTerm === '' ||
        skillName.includes(searchTerm.toLowerCase()) ||
        otherUserName.includes(searchTerm.toLowerCase());

      // Status
      const matchesStatus =
        selectedStatus === '' || appointment.status === (selectedStatus as AppointmentStatus);

      // Datum
      let matchesDate = true;
      if (selectedDate) {
        const appointmentDate = appointment.startTime
          ? new Date(appointment.startTime)
          : new Date();
        const filterStartDate = startOfDay(selectedDate);
        const filterEndDate = endOfDay(selectedDate);

        matchesDate =
          isAfter(appointmentDate, filterStartDate) && isBefore(appointmentDate, filterEndDate);
      }

      // Tab-Filter
      let matchesTab = true;
      if (tabValue === 1) {
        // Ausstehend
        matchesTab = appointment.status === AppointmentStatus.Pending;
      } else if (tabValue === 2) {
        // Bestätigt (noch in Zukunft)
        matchesTab =
          appointment.status === AppointmentStatus.Confirmed &&
          isAfter(new Date(appointment.startTime), new Date());
      } else if (tabValue === 3) {
        // Vergangen: endTime < now ODER Cancelled/Completed
        matchesTab =
          isBefore(new Date(appointment.endTime), new Date()) ||
          appointment.status === AppointmentStatus.Cancelled ||
          appointment.status === AppointmentStatus.Completed;
      }

      return matchesSearch && matchesStatus && matchesDate && matchesTab;
    });
  }, [appointments, searchTerm, selectedStatus, selectedDate, tabValue, userRole]);

  // Pagination
  const pageCount = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const displayedAppointments = filteredAppointments.slice(
    (currentPage - 1) * appointmentsPerPage,
    currentPage * appointmentsPerPage
  );

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event: SelectChangeEvent): void => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleDateChange = (date: Date | null): void => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number): void => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = (): void => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedDate(null);
    setCurrentPage(1);
  };

  // Loading/Fehler
  if (isLoading) {
    return <SkeletonLoader variant="card" count={4} />;
  }
  if (error !== null) {
    return (
      <EmptyState
        title="Fehler beim Laden der Termine"
        description={error}
        actionLabel="Erneut versuchen"
        actionHandler={() => {
          window.location.reload();
        }}
      />
    );
  }
  if (appointments.length === 0) {
    return (
      <EmptyState
        title="Keine Termine gefunden"
        description={'Du hast noch keine Termine vereinbart.'}
        actionLabel="Zur Matchmaking-Seite"
        actionPath="/matchmaking"
      />
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Box>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab}
                id={`appointment-tab-${index.toString()}`}
                aria-controls={`appointment-tabpanel-${index.toString()}`}
              />
            ))}
          </Tabs>
        </Box>

        {/* Filter-Bereich */}
        <Grid container columns={12} spacing={2} sx={{ mb: 3 }}>
          {/* Suchfeld */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Suche nach Skill oder Person"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          {/* Status-Auswahl */}
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                value={selectedStatus}
                onChange={handleStatusChange}
                label="Status"
                slotProps={
                  {
                    // Falls du ein Icon vornedran willst, müsstest du
                    // stattdessen in der `renderValue` oder so arbeiten.
                  }
                }
              >
                <MenuItem value="">Alle Status</MenuItem>
                <Divider />
                <MenuItem value="Pending">Ausstehend</MenuItem>
                <MenuItem value="Confirmed">Bestätigt</MenuItem>
                <MenuItem value="Cancelled">Abgesagt</MenuItem>
                <MenuItem value="Completed">Abgeschlossen</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Datum */}
          <Grid size={{ xs: 12, md: 3 }}>
            <DatePicker
              label="Datum"
              value={selectedDate}
              onChange={handleDateChange}
              format="dd.MM.yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  // InputProps -> slotProps für Deprecation
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon />
                      </InputAdornment>
                    ),
                  },
                },
              }}
            />
          </Grid>

          {/* Reset-Button */}
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={resetFilters}
              startIcon={<ResetIcon />}
              sx={{ height: '100%' }}
            >
              Zurücksetzen
            </Button>
          </Grid>
        </Grid>

        {/* Ergebnisanzahl + Seite */}
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {filteredAppointments.length} {filteredAppointments.length === 1 ? 'Termin' : 'Termine'}{' '}
            gefunden
          </Typography>
          {pageCount > 1 && (
            <Typography variant="body2" color="text.secondary">
              Seite {String(currentPage)} von {String(pageCount)}
            </Typography>
          )}
        </Box>

        {/* Termine-Liste */}
        {displayedAppointments.length > 0 ? (
          <Grid container columns={12} spacing={3}>
            {displayedAppointments.map((appointment, _) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  isTeacher={userRole === 'teacher'}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                  onComplete={onComplete}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState
            title="Keine passenden Termine gefunden"
            description={'Versuche deine Suche zu verfeinern.'}
            actionLabel="Filter zurücksetzen"
            actionHandler={resetFilters}
          />
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <Box mt={4} display="flex" justifyContent="center">
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AppointmentList;
