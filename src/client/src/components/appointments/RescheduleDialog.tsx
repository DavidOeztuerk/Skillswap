import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import { format, isBefore, addHours, isSameDay } from 'date-fns';
import LoadingButton from '../ui/LoadingButton';
import { useLoading } from '../../contexts/LoadingContext';
import TimeSlotPicker from './TimeSlotPicker';
import { Appointment } from '../../types/models/Appointment';

interface RescheduleDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onReschedule: (newDateTime: Date, newDuration?: number, reason?: string) => Promise<void>;
  availableSlots?: Date[]; // Available time slots from backend
}

/**
 * Appointment Reschedule Dialog Component
 * Multi-step dialog for rescheduling appointments
 */
const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  open,
  onClose,
  appointment,
  onReschedule,
  availableSlots = [],
}) => {
  const { withLoading, isLoading } = useLoading();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [newDuration, setNewDuration] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [notifyOtherParty, setNotifyOtherParty] = useState(true);
  const [conflicts, setConflicts] = useState<string[]>([]);
  
  // Get current appointment details
  const currentDateTime = appointment.startTime ? new Date(appointment.startTime) : new Date();
  const endDateTime = appointment.endTime ? new Date(appointment.endTime) : new Date(currentDateTime.getTime() + 60 * 60 * 1000);
  const duration = (endDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60); // in minutes
  
  // Steps for the stepper
  const steps = ['Datum wählen', 'Uhrzeit & Dauer wählen', 'Bestätigen'];
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setSelectedDate(null);
      setSelectedTime(null);
      setNewDuration(null);
      setReason('');
      setNotifyOtherParty(true);
      setError(null);
      setSuccessMessage(null);
      setConflicts([]);
    }
  }, [open]);
  
  // Check for conflicts when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      checkForConflicts();
    }
  }, [selectedDate, selectedTime]);
  
  // Check for scheduling conflicts
  const checkForConflicts = () => {
    const newConflicts: string[] = [];
    
    // Check if too close to current time
    const now = new Date();
    const proposedDateTime = combineDateTime(selectedDate!, selectedTime!);
    
    if (isBefore(proposedDateTime, addHours(now, 1))) {
      newConflicts.push('Der neue Termin sollte mindestens 1 Stunde in der Zukunft liegen');
    }
    
    // Check if it's the same as current time
    if (isSameDay(proposedDateTime, currentDateTime) && 
        proposedDateTime.getHours() === currentDateTime.getHours() &&
        proposedDateTime.getMinutes() === currentDateTime.getMinutes()) {
      newConflicts.push('Der neue Termin ist identisch mit dem aktuellen Termin');
    }
    
    // Check against available slots if provided
    if (availableSlots.length > 0) {
      const isAvailable = availableSlots.some(slot => 
        isSameDay(slot, proposedDateTime) &&
        slot.getHours() === proposedDateTime.getHours() &&
        slot.getMinutes() === proposedDateTime.getMinutes()
      );
      
      if (!isAvailable) {
        newConflicts.push('Dieser Zeitslot ist nicht verfügbar');
      }
    }
    
    setConflicts(newConflicts);
  };
  
  // Combine date and time
  const combineDateTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };
  
  // Format date and time for display
  const formatDateTime = (date: Date): string => {
    return format(date, "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de });
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setActiveStep(1);
    }
  };
  
  // Handle time selection
  const handleTimeSelect = (time: Date | null) => {
    setSelectedTime(time);
    if (time && selectedDate) {
      setActiveStep(2);
    }
  };
  
  // Handle final confirmation
  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Bitte wählen Sie Datum und Uhrzeit');
      return;
    }
    
    if (conflicts.length > 0 && !window.confirm('Es gibt Konflikte mit diesem Termin. Möchten Sie trotzdem fortfahren?')) {
      return;
    }
    
    await withLoading('rescheduleAppointment', async () => {
      try {
        setError(null);
        const newDateTime = combineDateTime(selectedDate, selectedTime);
        
        await onReschedule(
          newDateTime, 
          newDuration || undefined,
          reason || undefined
        );
        
        setSuccessMessage('Termin erfolgreich verschoben!');
        
        // Close dialog after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (err: any) {
        console.error('Failed to reschedule appointment:', err);
        setError(
          err?.message || 
          'Fehler beim Verschieben des Termins. Bitte versuchen Sie es erneut.'
        );
      }
    });
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Wählen Sie ein neues Datum für Ihren Termin:
            </Typography>
            
            {/* Current appointment info */}
            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Aktueller Termin:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formatDateTime(currentDateTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dauer: {duration} Minuten
                </Typography>
              </CardContent>
            </Card>
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
              <DatePicker
                label="Neues Datum"
                value={selectedDate}
                onChange={handleDateSelect}
                minDate={addHours(new Date(), 1)}
                maxDate={new Date(new Date().setMonth(new Date().getMonth() + 3))}
                disabled={isLoading('rescheduleAppointment')}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
            
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" icon={<InfoIcon />}>
                Sie können einen Termin bis zu 3 Monate im Voraus planen.
              </Alert>
            </Box>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Wählen Sie eine neue Uhrzeit für {selectedDate && format(selectedDate, 'EEEE, d. MMMM', { locale: de })}:
            </Typography>
            
            {availableSlots.length > 0 ? (
              <TimeSlotPicker
                selectedDate={selectedDate!}
                availableSlots={availableSlots.filter(slot => isSameDay(slot, selectedDate!))}
                onSelectSlot={handleTimeSelect}
                selectedSlot={selectedTime}
                duration={duration}
              />
            ) : (
              <Stack spacing={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                  <TimePicker
                    label="Neue Uhrzeit"
                    value={selectedTime}
                    onChange={handleTimeSelect}
                    ampm={false}
                    minutesStep={15}
                    disabled={isLoading('rescheduleAppointment')}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
                
                {/* Duration selector */}
                <TextField
                  select
                  label={`Dauer (optional - aktuell: ${duration} Minuten)`}
                  value={newDuration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDuration(e.target.value ? Number(e.target.value) : null)}
                  fullWidth
                  helperText="Lassen Sie leer, um die aktuelle Dauer beizubehalten"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Aktuelle Dauer beibehalten</option>
                  <option value="15">15 Minuten</option>
                  <option value="30">30 Minuten</option>
                  <option value="45">45 Minuten</option>
                  <option value="60">1 Stunde</option>
                  <option value="90">1,5 Stunden</option>
                  <option value="120">2 Stunden</option>
                  <option value="180">3 Stunden</option>
                  <option value="240">4 Stunden</option>
                </TextField>
              </Stack>
            )}
            
            {conflicts.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
                {conflicts.map((conflict, index) => (
                  <Typography key={index} variant="body2">
                    • {conflict}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Terminverschiebung bestätigen
            </Typography>
            
            {/* Summary cards */}
            <Stack spacing={2}>
              <Card sx={{ bgcolor: 'error.lighter' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="error.main">
                    Alter Termin:
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(currentDateTime)}
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ bgcolor: 'success.lighter' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="success.main">
                    Neuer Termin:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {selectedDate && selectedTime && formatDateTime(combineDateTime(selectedDate, selectedTime))}
                  </Typography>
                  {newDuration && (
                    <Typography variant="body2" color="text.secondary">
                      Neue Dauer: {newDuration} Minuten {newDuration !== duration && `(vorher: ${duration} Minuten)`}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
            
            {/* Reason field */}
            <TextField
              label="Grund für die Verschiebung (optional)"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              sx={{ mt: 3 }}
              placeholder="z.B. Terminkonflikt, Krankheit, etc."
            />
            
            {/* Notification checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifyOtherParty}
                  onChange={(e) => setNotifyOtherParty(e.target.checked)}
                />
              }
              label="Anderen Teilnehmer per E-Mail benachrichtigen"
              sx={{ mt: 2 }}
            />
            
            {conflicts.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Achtung: Es gibt Konflikte mit diesem Termin
                </Typography>
                {conflicts.map((conflict, index) => (
                  <Typography key={index} variant="body2">
                    • {conflict}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  // Success state
  if (successMessage) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon 
              color="success" 
              sx={{ fontSize: 64, mb: 2 }} 
            />
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
              {successMessage}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notifyOtherParty && 'Eine Benachrichtigung wurde an den anderen Teilnehmer gesendet.'}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6">Termin verschieben</Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Error display */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Step content */}
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        {activeStep > 0 && (
          <Button 
            onClick={() => setActiveStep(activeStep - 1)}
            startIcon={<ArrowBackIcon />}
            disabled={isLoading('rescheduleAppointment')}
          >
            Zurück
          </Button>
        )}
        
        <Box sx={{ flex: 1 }} />
        
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={isLoading('rescheduleAppointment')}
        >
          Abbrechen
        </Button>
        
        {activeStep < 2 ? (
          <Button
            onClick={() => setActiveStep(activeStep + 1)}
            variant="contained"
            disabled={
              (activeStep === 0 && !selectedDate) ||
              (activeStep === 1 && !selectedTime) ||
              isLoading('rescheduleAppointment')
            }
          >
            Weiter
          </Button>
        ) : (
          <LoadingButton
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            loading={isLoading('rescheduleAppointment')}
            disabled={!selectedDate || !selectedTime}
          >
            Termin verschieben
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RescheduleDialog;