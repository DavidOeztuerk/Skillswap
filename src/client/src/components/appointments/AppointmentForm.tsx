import React, { useEffect, useMemo } from 'react';
import { Button, TextField, Box, Typography, Divider, Grid, InputAdornment } from '@mui/material';
import FormDialog from '../ui/FormDialog';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAfter, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import type { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import LoadingButton from '../ui/LoadingButton';
import type { MatchDisplay } from '../../types/contracts/MatchmakingDisplay';
import ErrorAlert from '../error/ErrorAlert';

// Zod-Schema
const appointmentFormSchema = z.object({
  matchId: z.string(),
  startDate: z.date().refine((date) => isAfter(date, addDays(new Date(), -1)), {
    message: 'Das Datum muss in der Zukunft liegen',
  }),
  startTime: z.date(),
  notes: z.string().max(500, 'Notizen dürfen maximal 500 Zeichen enthalten').optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentRequest) => Promise<void>;
  match: MatchDisplay;
  isLoading?: boolean;
  error?: { message: string } | null;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  open,
  onClose,
  onSubmit,
  match,
  isLoading = false,
  error,
}) => {
  // Determine teacher vs. student based on match structure
  const teacherName = match.isLearningMode ? match.partnerName || 'Unknown Teacher' : 'You';
  const studentName = match.isLearningMode ? 'You' : match.partnerName || 'Unknown Student';

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

  const handleFormSubmit: SubmitHandler<AppointmentFormValues> = async (data) => {
    try {
      const startDateTime = new Date(
        data.startDate.getFullYear(),
        data.startDate.getMonth(),
        data.startDate.getDate(),
        data.startTime.getHours(),
        data.startTime.getMinutes()
      );

      // Generate meaningful title and description
      const { skillName } = match;
      // TODO: echte namen aus der Datenbank holen
      const teacherDisplayName = match.isLearningMode ? match.partnerName : 'Du';
      const studentDisplayName = match.isLearningMode ? 'Du' : match.partnerName;

      const appointmentRequest: AppointmentRequest = {
        matchId: data.matchId,
        scheduledDate: startDateTime.toISOString(),
        title: `Lerntermin: ${skillName}`,
        description:
          data.notes ?? `${teacherDisplayName} lehrt ${studentDisplayName} in ${skillName}`,
        durationMinutes: 60,
        participantUserId: match.partnerId,
        skillId: match.skillId,
        meetingType: 'VideoCall',
      };

      await onSubmit(appointmentRequest);
      onClose();
    } catch (err: unknown) {
      console.error('❌ Failed to create appointment:', err);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <FormDialog
        open={open}
        onClose={onClose}
        title="Neuen Termin vereinbaren"
        maxWidth="md"
        fullWidth
        actions={
          <>
            <Button onClick={onClose} color="inherit" disabled={isLoading}>
              Abbrechen
            </Button>
            <LoadingButton
              onClick={handleSubmit(handleFormSubmit)}
              color="primary"
              variant="contained"
              loading={isLoading}
              disabled={isLoading || Object.keys(errors).filter((key) => key !== 'root').length > 0}
            >
              Termin erstellen
            </LoadingButton>
          </>
        }
      >
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ErrorAlert
            error={
              error ??
              (errors.root?.message !== undefined ? { message: errors.root.message } : undefined)
            }
            onDismiss={() => {}}
            compact={process.env.NODE_ENV === 'production'}
          />

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
                      {teacherName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lehrende:r
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center">
                  <Box ml={1.5}>
                    <Typography variant="body1" fontWeight="medium">
                      {studentName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lernende:r
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box bgcolor="action.hover" p={2} borderRadius={1} mb={3}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Skill:</strong> {match.skillName}
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
            {/* <Grid size={{ xs: 12, md: 4 }}>
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
            </Grid> */}

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
                        endAdornment:
                          field.value !== undefined && field.value !== '' ? (
                            <InputAdornment position="end">
                              <Typography variant="caption" color="text.secondary">
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
        </form>
      </FormDialog>
    </LocalizationProvider>
  );
};

export default AppointmentForm;
