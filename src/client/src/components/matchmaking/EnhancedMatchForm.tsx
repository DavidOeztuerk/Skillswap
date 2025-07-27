// src/components/matchmaking/EnhancedMatchForm.tsx
import React, { useMemo, useState } from 'react';
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
  FormHelperText,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ListItemText,
  InputAdornment,
  Switch,
  Slider,
  RadioGroup,
  Radio,
  Autocomplete,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  EmojiObjects as SkillIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { WEEKDAYS, TIME_SLOTS } from '../../config/constants';
import LoadingButton from '../ui/LoadingButton';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { Skill } from '../../types/models/Skill';

// Enhanced validation schema
const enhancedMatchFormSchema = z.object({
  skillId: z.string().nonempty('Skill muss ausgewählt werden'),
  requestType: z.enum(['teach', 'learn'], {
    errorMap: () => ({ message: 'Bitte wähle einen Anfrage-Typ' }),
  }),
  preferredDays: z.array(z.string()).min(1, 'Wähle mindestens einen Tag'),
  preferredTimes: z.array(z.string()).min(1, 'Wähle mindestens eine Zeit'),
  sessionDuration: z.number().min(30).max(240),
  sessionFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'flexible']),
  isRemote: z.boolean(),
  location: z.string().optional(),
  budget: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
      currency: z.string().default('EUR'),
    })
    .optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  learningGoals: z
    .string()
    .min(10, 'Beschreibe deine Lernziele (mind. 10 Zeichen)')
    .max(1000),
  additionalNotes: z
    .string()
    .max(500, 'Notizen dürfen maximal 500 Zeichen enthalten')
    .optional(),
  urgency: z.enum(['low', 'medium', 'high']),
  preferredLanguage: z.string().optional(),
});

type EnhancedMatchFormValues = z.infer<typeof enhancedMatchFormSchema>;

interface EnhancedMatchFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MatchRequest) => Promise<void>;
  skill: Skill;
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

const LANGUAGES = [
  'Deutsch',
  'Englisch',
  'Französisch',
  'Spanisch',
  'Italienisch',
  'Portugiesisch',
  'Russisch',
  'Chinesisch',
  'Japanisch',
];

const LOCATIONS = [
  'Berlin',
  'München',
  'Hamburg',
  'Köln',
  'Frankfurt am Main',
  'Stuttgart',
  'Düsseldorf',
  'Dortmund',
  'Essen',
  'Leipzig',
];

const steps = [
  'Grundeinstellungen',
  'Zeitplanung',
  'Ort & Budget',
  'Lernziele & Details',
];

const EnhancedMatchForm: React.FC<EnhancedMatchFormProps> = ({
  open,
  onClose,
  onSubmit,
  skill,
  isLoading = false,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  // Default values
  const defaultValues = useMemo(() => {
    return {
      skillId: skill.id,
      requestType: skill.isOffering ? 'learn' : ('teach' as 'teach' | 'learn'),
      preferredDays: ['Montag', 'Mittwoch', 'Freitag'],
      preferredTimes: ['18:00', '19:00', '20:00'],
      sessionDuration: 60,
      sessionFrequency: 'weekly' as const,
      isRemote: true,
      location: '',
      budget: {
        min: 0,
        max: 50,
        currency: 'EUR',
      },
      experienceLevel: 'beginner' as const,
      learningGoals: '',
      additionalNotes: '',
      urgency: 'medium' as const,
      preferredLanguage: 'Deutsch',
    };
  }, [skill]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    trigger,
  } = useForm<EnhancedMatchFormValues>({
    resolver: zodResolver(enhancedMatchFormSchema),
    defaultValues,
  });

  const watchRequestType = watch('requestType');
  const watchIsRemote = watch('isRemote');
  const watchSessionDuration = watch('sessionDuration');

  // Reset when opening
  React.useEffect(() => {
    if (open) {
      reset({
        ...defaultValues,
        requestType: skill.isOffering ? 'learn' : 'teach',
      });
      setActiveStep(0);
    }
  }, [defaultValues, open, reset, skill]);

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getFieldsForStep = (
    step: number
  ): (keyof EnhancedMatchFormValues)[] => {
    switch (step) {
      case 0:
        return ['requestType', 'experienceLevel', 'urgency'];
      case 1:
        return [
          'preferredDays',
          'preferredTimes',
          'sessionDuration',
          'sessionFrequency',
        ];
      case 2:
        return ['isRemote', 'location'];
      case 3:
        return ['learningGoals'];
      default:
        return [];
    }
  };

  const handleFormSubmit: SubmitHandler<EnhancedMatchFormValues> = async (
    data
  ) => {
    try {
      const matchRequest: MatchRequest = {
        matchId: '', // Wird vom Backend generiert
        requesterId: '', // Muss ggf. im Parent/Context gesetzt werden
        requesterName: '', // Wird vom Backend gesetzt
        targetUserId: skill.userId || '', // Annahme: Skill enthält userId
        skillId: skill.id,
        skillName: skill.name,
        message: data.learningGoals || '',
        isOffering: data.requestType === 'teach',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        // respondedAt und expiresAt optional, werden ggf. vom Backend gesetzt
      };

      await onSubmit(matchRequest);
      onClose();
    } catch (error) {
      console.error('Failed to create match request:', error);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Du erstellst eine Anfrage für den Skill:{' '}
                <strong>{skill.name}</strong>
              </Alert>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="requestType"
                control={control}
                render={({ field }) => (
                  <FormControl
                    component="fieldset"
                    error={!!errors.requestType}
                  >
                    <FormLabel component="legend">Was möchtest du?</FormLabel>
                    <RadioGroup {...field} row>
                      <FormControlLabel
                        value="learn"
                        control={<Radio />}
                        label="Ich möchte diesen Skill lernen"
                      />
                      <FormControlLabel
                        value="teach"
                        control={<Radio />}
                        label="Ich möchte diesen Skill lehren"
                      />
                    </RadioGroup>
                    {errors.requestType && (
                      <FormHelperText>
                        {errors.requestType.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="experienceLevel"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.experienceLevel}>
                    <FormLabel>Dein aktuelles Niveau</FormLabel>
                    <Select {...field} displayEmpty>
                      <MenuItem value="beginner">Anfänger</MenuItem>
                      <MenuItem value="intermediate">Fortgeschritten</MenuItem>
                      <MenuItem value="advanced">Erweitert</MenuItem>
                      <MenuItem value="expert">Experte</MenuItem>
                    </Select>
                    {errors.experienceLevel && (
                      <FormHelperText>
                        {errors.experienceLevel.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="urgency"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <FormLabel>Dringlichkeit</FormLabel>
                    <Select {...field}>
                      <MenuItem value="low">Niedrig - Ich habe Zeit</MenuItem>
                      <MenuItem value="medium">
                        Mittel - In den nächsten Wochen
                      </MenuItem>
                      <MenuItem value="high">
                        Hoch - So schnell wie möglich
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="preferredDays"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.preferredDays}>
                    <FormLabel>Bevorzugte Tage</FormLabel>
                    <Select
                      multiple
                      value={field.value}
                      onChange={field.onChange}
                      input={<OutlinedInput />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
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

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="preferredTimes"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.preferredTimes}>
                    <FormLabel>Bevorzugte Zeiten</FormLabel>
                    <Select
                      multiple
                      value={field.value}
                      onChange={field.onChange}
                      input={<OutlinedInput />}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
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

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="sessionDuration"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <FormLabel>Session-Dauer (Minuten)</FormLabel>
                    <Box sx={{ px: 2, pt: 1 }}>
                      <Slider
                        {...field}
                        min={30}
                        max={240}
                        step={15}
                        marks={[
                          { value: 30, label: '30min' },
                          { value: 60, label: '1h' },
                          { value: 120, label: '2h' },
                          { value: 240, label: '4h' },
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value} min`}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        {watchSessionDuration} Minuten
                      </Typography>
                    </Box>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="sessionFrequency"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <FormLabel>Häufigkeit</FormLabel>
                    <Select {...field}>
                      <MenuItem value="weekly">Wöchentlich</MenuItem>
                      <MenuItem value="biweekly">Alle zwei Wochen</MenuItem>
                      <MenuItem value="monthly">Monatlich</MenuItem>
                      <MenuItem value="flexible">Flexibel</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="isRemote"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch checked={field.value} onChange={field.onChange} />
                    }
                    label="Online-Session (Remote)"
                  />
                )}
              />
            </Grid>

            {!watchIsRemote && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={LOCATIONS}
                      freeSolo
                      onChange={(_, value) => field.onChange(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Ort"
                          placeholder="Stadt oder Adresse"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Budget (optional)
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="budget.min"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Min. Preis"
                            type="number"
                            fullWidth
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  €/h
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="budget.max"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Max. Preis"
                            type="number"
                            fullWidth
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  €/h
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="preferredLanguage"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={LANGUAGES}
                    onChange={(_, value) => field.onChange(value || 'Deutsch')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Bevorzugte Sprache"
                        placeholder="Wähle eine Sprache"
                      />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="learningGoals"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={`${watchRequestType === 'learn' ? 'Lernziele' : 'Was ich lehren kann'}`}
                    multiline
                    rows={6}
                    fullWidth
                    required
                    error={!!errors.learningGoals}
                    helperText={
                      errors.learningGoals?.message ||
                      `Beschreibe detailliert, was du ${watchRequestType === 'learn' ? 'lernen' : 'lehren'} möchtest`
                    }
                    placeholder={
                      watchRequestType === 'learn'
                        ? 'Z.B. Ich möchte React lernen, um moderne Webanwendungen zu entwickeln. Besonders interessieren mich Hooks, State Management und Testing...'
                        : 'Z.B. Ich kann React von Grund auf beibringen, inklusive moderner Patterns wie Hooks, Context API und Testing mit Jest...'
                    }
                    inputProps={{ maxLength: 1000 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" color="text.secondary">
                            {field.value?.length || 0}/1000
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

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
                    placeholder="Weitere Informationen, Besonderheiten oder Wünsche..."
                    inputProps={{ maxLength: 500 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" color="text.secondary">
                            {field.value?.length || 0}/500
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="enhanced-match-form-title"
    >
      <DialogTitle id="enhanced-match-form-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Match-Anfrage erstellen</Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  <Box sx={{ mb: 2, mt: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        startIcon={<ArrowBackIcon />}
                      >
                        Zurück
                      </Button>
                      {index === steps?.length - 1 ? (
                        <LoadingButton
                          type="submit"
                          variant="contained"
                          loading={isLoading}
                          startIcon={<SkillIcon />}
                        >
                          Anfrage senden
                        </LoadingButton>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          endIcon={<ArrowForwardIcon />}
                        >
                          Weiter
                        </Button>
                      )}
                    </Box>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Abbrechen
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Schritt {activeStep + 1} von {steps.length}
          </Typography>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EnhancedMatchForm;
