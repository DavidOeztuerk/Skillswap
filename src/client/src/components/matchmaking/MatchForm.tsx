import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Checkbox,
  TextField,
  Box,
  Typography,
  IconButton,
  Divider,
  FormHelperText,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ListItemText,
  InputAdornment,
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { WEEKDAYS, TIME_SLOTS } from '../../config/constants';
import LoadingButton from '../ui/LoadingButton';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { Skill } from '../../types/models/Skill';
import { User } from '../../types/models/User';

// Schema angepasst für CreateMatchRequest
const matchFormSchema = z.object({
  targetUserId: z.string().nonempty('Zielbenutzer muss ausgewählt werden'),
  skillId: z.string().nonempty('Skill muss ausgewählt werden'),
  message: z
    .string()
    .max(500, 'Nachricht darf maximal 500 Zeichen enthalten')
    .optional(),
  isOffering: z.boolean(),
  preferredDays: z.array(z.string()).min(1, 'Wähle mindestens einen Tag'),
  preferredTimes: z.array(z.string()).min(1, 'Wähle mindestens eine Zeit'),
  additionalNotes: z
    .string()
    .max(500, 'Notizen dürfen maximal 500 Zeichen enthalten')
    .optional(),
});

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMatchRequest) => Promise<void>;
  skill: Skill;
  targetUser?: User;
  isLoading?: boolean;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

/**
 * Formular zur Erstellung einer Match-Anfrage
 */
const MatchForm: React.FC<MatchFormProps> = ({
  open,
  onClose,
  onSubmit,
  skill,
  targetUser,
  isLoading = false,
}) => {
  // Default-Werte
  const defaultValues = useMemo(() => {
    return {
      targetUserId: skill?.userId || '',
      skillId: skill.skillId,
      isOffering: !skill.isOffering, // Umgekehrt: wenn der Nutzer den Skill anbietet, will er ihn hier lernen
      preferredDays: ['Montag', 'Dienstag', 'Mittwoch'],
      preferredTimes: ['18:00', '19:00'],
      message: '',
      additionalNotes: '',
    };
  }, [skill]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues,
  });

  // Reset beim Öffnen
  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const handleFormSubmit: SubmitHandler<MatchFormValues> = async (data) => {
    try {
      // Transformiere die Daten in das CreateMatchRequest Format
      const matchRequest: CreateMatchRequest = {
        targetUserId: data.targetUserId,
        skillId: data.skillId,
        message: data.message || '',
        isLearningMode: data.isOffering,
        // preferredSchedule: {
        //   preferredDays: data.preferredDays,
        //   preferredTimes: data.preferredTimes,
        //   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Automatisch die lokale Zeitzone
        // },
        // additionalNotes: data.additionalNotes,
      };

      await onSubmit(matchRequest);
      onClose();
    } catch (error) {
      console.error('Failed to create match request:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="match-form-title"
    >
      <DialogTitle id="match-form-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Match-Anfrage erstellen</Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Box bgcolor="action.hover" p={2} borderRadius={1} mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Skill: {skill.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {skill.description}
                </Typography>
              </Box>

              {targetUser && (
                <Box
                  bgcolor="primary.main"
                  color="primary.contrastText"
                  p={2}
                  borderRadius={1}
                  mb={2}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Anfrage an:{' '}
                    {targetUser.userName ||
                      targetUser.firstName + ' ' + targetUser.lastName}
                  </Typography>
                  {/* <Typography variant="body2">
                    {targetUser.bio || 'Keine Beschreibung verfügbar'}
                  </Typography> */}
                </Box>
              )}

              {!targetUser && (
                <Controller
                  name="targetUserId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Zielbenutzer ID"
                      fullWidth
                      error={!!errors.targetUserId}
                      helperText={errors.targetUserId?.message}
                      disabled={isLoading}
                      placeholder="Benutzer-ID eingeben"
                    />
                  )}
                />
              )}

              <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
                <FormLabel component="legend">
                  Was möchtest du mit diesem Skill machen?
                </FormLabel>
                <Controller
                  name="isOffering"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={isLoading}
                        />
                      }
                      label={
                        field.value
                          ? 'Ich möchte diesen Skill anbieten (lehren)'
                          : 'Ich möchte diesen Skill lernen'
                      }
                    />
                  )}
                />
              </FormControl>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Message */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Persönliche Nachricht (optional)"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.message}
                    helperText={errors.message?.message}
                    disabled={isLoading}
                    placeholder="Stelle dich kurz vor und erkläre, warum du dich für diesen Skill-Austausch interessierst..."
                  />
                )}
              />
            </Grid>

            {/* PreferredDays */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="preferredDays"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.preferredDays}>
                    <FormLabel component="legend">Bevorzugte Tage</FormLabel>
                    <Select
                      multiple
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      input={<OutlinedInput id="select-multiple-days" />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                      disabled={isLoading}
                    >
                      {WEEKDAYS.map((day) => (
                        <MenuItem key={day} value={day}>
                          <Checkbox checked={field.value.indexOf(day) > -1} />
                          <ListItemText primary={day} />
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.preferredDays && (
                      <FormHelperText>
                        {errors.preferredDays.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* PreferredTimes */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="preferredTimes"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.preferredTimes}>
                    <FormLabel component="legend">Bevorzugte Zeiten</FormLabel>
                    <Select
                      multiple
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      input={<OutlinedInput id="select-multiple-times" />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                      disabled={isLoading}
                    >
                      {TIME_SLOTS.map((time) => (
                        <MenuItem key={time} value={time}>
                          <Checkbox checked={field.value.indexOf(time) > -1} />
                          <ListItemText primary={time} />
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.preferredTimes && (
                      <FormHelperText>
                        {errors.preferredTimes.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* AdditionalNotes */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="additionalNotes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Zusätzliche Notizen (optional)"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.additionalNotes}
                    helperText={errors.additionalNotes?.message}
                    disabled={isLoading}
                    placeholder={
                      watch('isOffering')
                        ? 'Beschreibe, was du unterrichten kannst und wie du den Austausch gestalten möchtest...'
                        : 'Beschreibe, was du gerne lernen möchtest und welche Vorkenntnisse du hast...'
                    }
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
            Match-Anfrage senden
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MatchForm;
