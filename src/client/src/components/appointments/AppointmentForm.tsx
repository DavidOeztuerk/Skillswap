import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAfter, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import LoadingButton from '../ui/LoadingButton';
import { Match } from '../../types/models/Match';

// Zod-Schema
const appointmentFormSchema = z
  .object({
    matchId: z.string(),
    startDate: z
      .date()
      .refine((date) => isAfter(date, addDays(new Date(), -1)), {
        message: 'Das Datum muss in der Zukunft liegen',
      }),
    startTime: z.date(),
    endTime: z.date(),
    notes: z
      .string()
      .max(500, 'Notizen dürfen maximal 500 Zeichen enthalten')
      .optional(),
  })
  .refine(
    (data) => {
      // Datum+Uhrzeit zusammenführen
      const startDateTime = new Date(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        data.startDate.getDate(),
        data.startTime.getHours(),
        data.startTime.getMinutes()
      );
      const endDateTime = new Date(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        data.startDate.getDate(),
        data.endTime.getHours(),
        data.endTime.getMinutes()
      );
      // Muss endTime > startTime sein
      return isAfter(endDateTime, startDateTime);
    },
    { message: 'Die Endzeit muss nach der Startzeit liegen', path: ['endTime'] }
  );

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentRequest) => Promise<void>;
  match: Match;
  isLoading?: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  open,
  onClose,
  onSubmit,
  match,
  isLoading = false,
}) => {
  // Bestimme Lehrer vs. Schüler
  const teacher = match.isLearningMode
    ? match.responderDetails
    : match.requesterDetails;
  const student = match.isLearningMode
    ? match.requesterDetails
    : match.responderDetails;

  // Standardwerte
  const defaultValues = useMemo(
    () => ({
      matchId: match.id,
      startDate: addDays(new Date(), 1),
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0, 0)),
      notes: '',
    }),
    [match.id]
  );

  // React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues,
  });

  // Reset beim Öffnen
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const handleFormSubmit: SubmitHandler<AppointmentFormValues> = async (
    data
  ) => {
    try {
      const startDateTime = new Date(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        data.startDate.getDate(),
        data.startTime.getHours(),
        data.startTime.getMinutes()
      );
      const endDateTime = new Date(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        data.startDate.getDate(),
        data.endTime.getHours(),
        data.endTime.getMinutes()
      );

      const appointmentRequest: AppointmentRequest = {
        matchId: data.matchId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: data.notes,
      };

      await onSubmit(appointmentRequest);
      onClose();
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="appointment-form-title"
      >
        <DialogTitle id="appointment-form-title">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Neuen Termin vereinbaren</Typography>
            <IconButton aria-label="close" onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent dividers>
            {/*
              Grid als Container:
              columns={12} => Wir haben ein 12-Spalten-Layout
              spacing={3} => Abstand
            */}
            <Grid container columns={12} spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Teilnehmer
                </Typography>
                <Box display="flex" gap={3} mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box ml={1.5}>
                      <Typography variant="body1" fontWeight="medium">
                        {teacher.firstName} {teacher.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lehrende:r
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center">
                    <Box ml={1.5}>
                      <Typography variant="body1" fontWeight="medium">
                        {student.firstName} {student.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lernende:r
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box bgcolor="action.hover" p={2} borderRadius={1} mb={3}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Skill:</strong> {match.skill.name}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Startdatum */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Datum"
                      value={field.value}
                      onChange={field.onChange}
                      disablePast
                      format="dd.MM.yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startDate,
                          helperText: errors.startDate?.message,
                          disabled: isLoading,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Startzeit */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Startzeit"
                      value={field.value}
                      onChange={field.onChange}
                      minutesStep={15}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startTime,
                          helperText: errors.startTime?.message,
                          disabled: isLoading,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Endzeit */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Endzeit"
                      value={field.value}
                      onChange={field.onChange}
                      minutesStep={15}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.endTime,
                          helperText: errors.endTime?.message,
                          disabled: isLoading,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Notizen */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notizen (optional)"
                      multiline
                      rows={4}
                      fullWidth
                      error={!!errors.notes}
                      helperText={errors.notes?.message}
                      disabled={isLoading}
                      placeholder="Füge hier optional Notizen oder eine Agenda für den Termin hinzu..."
                      slotProps={{
                        input: {
                          endAdornment: field.value ? (
                            <InputAdornment position="end">
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {field.value.length}/500
                              </Typography>
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} color="inherit" disabled={isLoading}>
              Abbrechen
            </Button>
            <LoadingButton
              type="submit"
              color="primary"
              variant="contained"
              loading={isLoading}
            >
              Termin erstellen
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AppointmentForm;
