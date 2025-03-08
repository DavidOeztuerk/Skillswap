// src/components/matchmaking/MatchForm.tsx
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
  Grid,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  FormHelperText,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { WEEKDAYS, TIME_SLOTS } from '../../config/constants';
import LoadingButton from '../ui/LoadingButton';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { UserSkill } from '../../types/models/UserSkill';

// Validierungsschema mit Zod
const matchFormSchema = z.object({
  skillId: z.string().nonempty('Skill muss ausgewählt werden'),
  isLearningMode: z.boolean(),
  preferredDays: z
    .array(z.string())
    .min(1, 'Wähle mindestens einen bevorzugten Tag'),
  preferredTimes: z
    .array(z.string())
    .min(1, 'Wähle mindestens eine bevorzugte Zeit'),
  additionalNotes: z
    .string()
    .max(500, 'Notizen dürfen maximal 500 Zeichen enthalten')
    .optional(),
});

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MatchRequest) => Promise<void>;
  userSkill: UserSkill;
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
  userSkill,
  isLoading = false,
}) => {
  // Standard-Werte für das Formular
  const defaultValues = useMemo(
    () => ({
      skillId: userSkill.skillId,
      isLearningMode: !userSkill.isTeachable, // Standardmäßig Lernmodus, wenn der Skill nicht lehrbar ist
      preferredDays: ['Montag', 'Dienstag', 'Mittwoch'], // Standardtage
      preferredTimes: ['18:00', '19:00'], // Standardzeiten
      additionalNotes: '',
    }),
    [userSkill]
  );

  // React Hook Form mit Zod-Resolver
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

  // Überwachte Formularwerte
  const isLearningMode = watch('isLearningMode');
  const additionalNotes = watch('additionalNotes');

  // Formular zurücksetzen, wenn sich der Dialog öffnet oder schließt
  React.useEffect(() => {
    if (open) {
      reset({
        ...defaultValues,
        isLearningMode: userSkill.isLearnable && !userSkill.isTeachable, // Lernmodus als Standard, wenn nur lernbar
      });
    }
  }, [defaultValues, open, reset, userSkill]);

  const handleFormSubmit: SubmitHandler<MatchFormValues> = async (data) => {
    try {
      await onSubmit(data);
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
            <Grid item xs={12}>
              <Box bgcolor="action.hover" p={2} borderRadius={1} mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Skill: {userSkill.skill.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userSkill.skill.description}
                </Typography>
              </Box>

              {userSkill.isTeachable && userSkill.isLearnable && (
                <>
                  <FormControl
                    component="fieldset"
                    sx={{ width: '100%', mb: 2 }}
                  >
                    <FormLabel component="legend">
                      Möchtest du diesen Skill lehren oder lernen?
                    </FormLabel>
                    <Controller
                      name="isLearningMode"
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
                              ? 'Ich möchte diesen Skill lernen'
                              : 'Ich möchte diesen Skill lehren'
                          }
                        />
                      )}
                    />
                  </FormControl>
                  <Divider sx={{ my: 2 }} />
                </>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12}>
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
                      isLearningMode
                        ? 'Beschreibe, was du gerne lernen möchtest und welche Vorkenntnisse du bereits hast...'
                        : 'Beschreibe, was du unterrichten kannst und welche Erfahrungen du hast...'
                    }
                    InputProps={{
                      endAdornment: additionalNotes ? (
                        <InputAdornment position="end">
                          <Typography variant="caption" color="text.secondary">
                            {additionalNotes.length}/500
                          </Typography>
                        </InputAdornment>
                      ) : null,
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
