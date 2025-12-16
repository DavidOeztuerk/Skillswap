import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Alert, Button, Box, Typography, Chip, List, ListItem, ListItemText } from '@mui/material';
import {
  Event as EventIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface AppointmentErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Specialized error boundary for appointment and scheduling components
 * Handles scheduling conflicts, availability errors, and calendar issues
 */
const AppointmentErrorFallback: React.FC<{ error: Error; onRetry: () => void }> = ({
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  const isConflictError =
    error.message.toLowerCase().includes('conflict') ||
    error.message.toLowerCase().includes('overlap');

  const isAvailabilityError =
    error.message.toLowerCase().includes('availability') ||
    error.message.toLowerCase().includes('unavailable');

  const isCalendarError =
    error.message.toLowerCase().includes('calendar') ||
    error.message.toLowerCase().includes('sync');

  const isValidationError =
    error.message.toLowerCase().includes('invalid') ||
    error.message.toLowerCase().includes('validation');

  const handleViewCalendar = React.useCallback((): void => {
    void navigate('/appointments/calendar');
  }, [navigate]);

  const handleCheckAvailability = React.useCallback((): void => {
    void navigate('/profile/availability');
  }, [navigate]);

  const getSuggestion = (): string => {
    if (isConflictError) {
      return 'This time slot conflicts with an existing appointment.';
    }
    if (isAvailabilityError) {
      return 'The selected time is not available. Please choose a different time.';
    }
    if (isCalendarError) {
      return 'Unable to sync with calendar. Please check your calendar settings.';
    }
    if (isValidationError) {
      return 'Invalid appointment details. Please check the information and try again.';
    }
    return 'Unable to process appointment at this time.';
  };

  const getConflictDetails = (): string[] => {
    // Parse conflict details from error message if available
    const conflictMatch = /conflicts with: (.*?)$/.exec(error.message);
    if (conflictMatch !== null) {
      return conflictMatch[1].split(',').map((item) => item.trim());
    }
    return [];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" icon={<EventIcon />} sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Appointment Error
        </Typography>
        <Typography variant="body2">{getSuggestion()}</Typography>
      </Alert>

      {isConflictError && getConflictDetails().length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Conflicting appointments:
          </Typography>
          <List dense>
            {getConflictDetails().map((conflict, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={conflict}
                  slotProps={{
                    primary: { variant: 'caption' },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {isAvailabilityError && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Suggested actions:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Check your availability"
              size="small"
              onClick={handleCheckAvailability}
              clickable
            />
            <Chip label="View calendar" size="small" onClick={handleViewCalendar} clickable />
            <Chip label="Contact participant" size="small" />
          </Box>
        </Box>
      )}

      {isCalendarError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">Calendar sync issues can be resolved by:</Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Checking your calendar permissions</li>
            <li>Refreshing your calendar connection</li>
            <li>Manually entering the appointment</li>
          </ul>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={onRetry} startIcon={<RefreshIcon />} size="small">
          Try Again
        </Button>

        {(isConflictError || isAvailabilityError) && (
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={handleViewCalendar}
            size="small"
          >
            View Calendar
          </Button>
        )}

        {isAvailabilityError && (
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={handleCheckAvailability}
            size="small"
          >
            Update Availability
          </Button>
        )}

        <Button variant="text" onClick={() => navigate('/appointments')} size="small">
          All Appointments
        </Button>
      </Box>

      {isValidationError && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Common issues: Duration too short/long, past dates, invalid time format
          </Typography>
        </Alert>
      )}

      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Error: {error.message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const AppointmentErrorBoundary: React.FC<AppointmentErrorBoundaryProps> = ({ children }) => (
  <ErrorBoundary
    level="component"
    onError={(error, _errorInfo) => {
      console.error('Appointment Component Error:', error);
      // Log appointment-specific errors with context
      const appointmentContext = {
        timestamp: new Date().toISOString(),
        currentAppointment: sessionStorage.getItem('currentAppointment'),
        calendarView: sessionStorage.getItem('calendarView'),
      };
      console.warn('Appointment error context:', appointmentContext);

      // Clear stale appointment data on error
      if (error.message.includes('conflict') || error.message.includes('invalid')) {
        sessionStorage.removeItem('currentAppointment');
      }
    }}
  >
    {(hasError, error, retry) =>
      hasError && error !== null ? (
        <AppointmentErrorFallback error={error} onRetry={retry} />
      ) : (
        children
      )
    }
  </ErrorBoundary>
);

export default AppointmentErrorBoundary;
