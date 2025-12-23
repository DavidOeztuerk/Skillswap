import React, { useState, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import { format, isBefore, addHours, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
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
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useLoading } from '../../../core/contexts/loadingContextHooks';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import LoadingButton from '../../../shared/components/ui/LoadingButton';
import TimeSlotPicker from './TimeSlotPicker';
import type { Appointment } from '../types/Appointment';

// Utility functions (extracted outside component)
const combineDateTime = (date: Date, time: Date): Date => {
  const combined = new Date(date);
  combined.setHours(time.getHours());
  combined.setMinutes(time.getMinutes());
  combined.setSeconds(0);
  combined.setMilliseconds(0);
  return combined;
};

const formatDateTime = (date: Date): string =>
  format(date, "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de });

interface RescheduleDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onReschedule: (newDateTime: Date, newDuration?: number, reason?: string) => Promise<void>;
  availableSlots?: Date[];
}

/**
 * Appointment Reschedule Dialog Component
 * Multi-step dialog for rescheduling appointments
 */
const RescheduleDialog: React.FC<RescheduleDialogProps> = memo(
  ({ open, onClose, appointment, onReschedule, availableSlots = [] }) => {
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

    // Conflict dialog state
    const [showConflictDialog, setShowConflictDialog] = useState(false);

    // Get current appointment details
    const { currentDateTime, duration } = useMemo(() => {
      const current = appointment.startTime ? new Date(appointment.startTime) : new Date();
      const end = appointment.endTime
        ? new Date(appointment.endTime)
        : new Date(current.getTime() + 60 * 60 * 1000);
      return {
        currentDateTime: current,
        duration: (end.getTime() - current.getTime()) / (1000 * 60), // in minutes
      };
    }, [appointment.startTime, appointment.endTime]);

    // Steps for the stepper
    const steps = useMemo(() => ['Datum wählen', 'Uhrzeit & Dauer wählen', 'Bestätigen'], []);

    // Derived state: Check for scheduling conflicts
    const conflicts = useMemo(() => {
      if (!selectedDate || !selectedTime) return [];

      const conflictList: string[] = [];

      // Check if too close to current time
      const now = new Date();
      const proposedDateTime = combineDateTime(selectedDate, selectedTime);

      if (isBefore(proposedDateTime, addHours(now, 1))) {
        conflictList.push('Der neue Termin sollte mindestens 1 Stunde in der Zukunft liegen');
      }

      // Check if it's the same as current time
      if (
        isSameDay(proposedDateTime, currentDateTime) &&
        proposedDateTime.getHours() === currentDateTime.getHours() &&
        proposedDateTime.getMinutes() === currentDateTime.getMinutes()
      ) {
        conflictList.push('Der neue Termin ist identisch mit dem aktuellen Termin');
      }

      // Check against available slots if provided
      if (availableSlots.length > 0) {
        const isAvailable = availableSlots.some(
          (slot) =>
            isSameDay(slot, proposedDateTime) &&
            slot.getHours() === proposedDateTime.getHours() &&
            slot.getMinutes() === proposedDateTime.getMinutes()
        );

        if (!isAvailable) {
          conflictList.push('Dieser Zeitslot ist nicht verfügbar');
        }
      }

      return conflictList;
    }, [selectedDate, selectedTime, currentDateTime, availableSlots]);

    // Handle date selection
    const handleDateSelect = useCallback((date: Date | null) => {
      setSelectedDate(date);
      if (date) {
        setActiveStep(1);
      }
    }, []);

    // Handle time selection
    const handleTimeSelect = useCallback(
      (time: Date | null) => {
        setSelectedTime(time);
        if (time && selectedDate) {
          setActiveStep(2);
        }
      },
      [selectedDate]
    );

    // Handle dialog close with state reset
    const handleClose = useCallback(() => {
      setActiveStep(0);
      setSelectedDate(null);
      setSelectedTime(null);
      setNewDuration(null);
      setReason('');
      setNotifyOtherParty(true);
      setError(null);
      setSuccessMessage(null);
      onClose();
    }, [onClose]);

    // Execute the actual reschedule operation
    const executeReschedule = useCallback(async () => {
      if (!selectedDate || !selectedTime) return;

      await withLoading('rescheduleAppointment', async () => {
        try {
          setError(null);
          const newDateTime = combineDateTime(selectedDate, selectedTime);

          await onReschedule(
            newDateTime,
            newDuration ?? undefined,
            reason === '' ? undefined : reason
          );

          setSuccessMessage('Termin erfolgreich verschoben!');

          // Close dialog after success
          setTimeout(() => {
            handleClose();
          }, 2000);
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            console.error('❌ Axios error rescheduling appointment:', err.response ?? err.message);
            const errorData = err.response?.data as { message?: string } | undefined;
            setError(
              errorData?.message ??
                'Fehler beim Verschieben des Termins. Bitte versuchen Sie es erneut.'
            );
          } else {
            console.error('❌ Unexpected error rescheduling appointment:', err);
            setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
          }
        }
      });
    }, [selectedDate, selectedTime, newDuration, reason, withLoading, onReschedule, handleClose]);

    // Handle conflict dialog confirm
    const handleConflictConfirm = useCallback((): void => {
      setShowConflictDialog(false);
      void executeReschedule();
    }, [executeReschedule]);

    // Handle conflict dialog cancel
    const handleConflictCancel = useCallback((): void => {
      setShowConflictDialog(false);
    }, []);

    // Handle final confirmation
    const handleConfirm = useCallback(async () => {
      if (!selectedDate || !selectedTime) {
        setError('Bitte wählen Sie Datum und Uhrzeit');
        return;
      }

      if (conflicts.length > 0) {
        setShowConflictDialog(true);
        return;
      }

      await executeReschedule();
    }, [selectedDate, selectedTime, conflicts, executeReschedule]);

    // Render step content
    const renderStepContent = useCallback(() => {
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
                Wählen Sie eine neue Uhrzeit für{' '}
                {selectedDate ? format(selectedDate, 'EEEE, d. MMMM', { locale: de }) : null}:
              </Typography>

              {availableSlots.length > 0 && selectedDate ? (
                <TimeSlotPicker
                  selectedDate={selectedDate}
                  availableSlots={availableSlots.filter((slot) => isSameDay(slot, selectedDate))}
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
                    value={newDuration ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setNewDuration(e.target.value === '' ? null : Number(e.target.value));
                    }}
                    fullWidth
                    helperText="Lassen Sie leer, um die aktuelle Dauer beizubehalten"
                    slotProps={{
                      select: { native: true },
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
                  {conflicts.map((conflict) => (
                    <Typography key={conflict} variant="body2">
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
                    <Typography variant="body1">{formatDateTime(currentDateTime)}</Typography>
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'success.lighter' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="success.main">
                      Neuer Termin:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedDate && selectedTime
                        ? formatDateTime(combineDateTime(selectedDate, selectedTime))
                        : null}
                    </Typography>
                    {newDuration !== null && (
                      <Typography variant="body2" color="text.secondary">
                        Neue Dauer: {newDuration} Minuten{' '}
                        {newDuration !== duration && `(vorher: ${duration} Minuten)`}
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
                onChange={(e) => {
                  setReason(e.target.value);
                }}
                fullWidth
                sx={{ mt: 3 }}
                placeholder="z.B. Terminkonflikt, Krankheit, etc."
              />

              {/* Notification checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifyOtherParty}
                    onChange={(e) => {
                      setNotifyOtherParty(e.target.checked);
                    }}
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
                  {conflicts.map((conflict) => (
                    <Typography key={conflict} variant="body2">
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
    }, [
      activeStep,
      selectedDate,
      selectedTime,
      newDuration,
      reason,
      notifyOtherParty,
      conflicts,
      currentDateTime,
      duration,
      handleDateSelect,
      handleTimeSelect,
      availableSlots,
      isLoading,
    ]);

    // Success state
    if (successMessage) {
      return (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 2,
              },
            },
          }}
        >
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                {successMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notifyOtherParty
                  ? 'Eine Benachrichtigung wurde an den anderen Teilnehmer gesendet.'
                  : null}
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
            },
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
            onClick={handleClose}
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
          {error ? (
            <Alert
              severity="error"
              onClose={() => {
                setError(null);
              }}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          ) : null}

          {/* Step content */}
          {renderStepContent()}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {activeStep > 0 && (
            <Button
              onClick={() => {
                setActiveStep((prev) => prev - 1);
              }}
              startIcon={<ArrowBackIcon />}
              disabled={isLoading('rescheduleAppointment')}
            >
              Zurück
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={isLoading('rescheduleAppointment')}
          >
            Abbrechen
          </Button>

          {activeStep < 2 ? (
            <Button
              onClick={() => {
                setActiveStep((prev) => prev + 1);
              }}
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

        {/* Conflict confirmation dialog */}
        <ConfirmDialog
          open={showConflictDialog}
          title="Terminkonflikt"
          message="Es gibt Konflikte mit diesem Termin. Möchten Sie trotzdem fortfahren?"
          confirmLabel="Trotzdem fortfahren"
          cancelLabel="Abbrechen"
          confirmColor="warning"
          onConfirm={handleConflictConfirm}
          onCancel={handleConflictCancel}
        />
      </Dialog>
    );
  }
);

RescheduleDialog.displayName = 'RescheduleDialog';

export default RescheduleDialog;
