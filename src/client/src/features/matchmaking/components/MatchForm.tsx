import React, { useMemo, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import z from 'zod';
import {
  Button,
  TextField,
  Box,
  Typography,
  InputAdornment,
  Grid,
  CircularProgress,
} from '@mui/material';
import ErrorAlert from '../../../shared/components/error/ErrorAlert';
import FormDialog from '../../../shared/components/ui/FormDialog';
import { LoadingButton } from '../../../shared/components/ui/LoadingButton';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { skillService } from '../../skills/services/skillsService';
import {
  EXCHANGE_TYPES,
  DEFAULT_TOTAL_DURATION_MINUTES,
  DEFAULT_SESSION_DURATION_MINUTES,
  DEFAULT_CURRENCY,
  DEFAULT_HOURLY_RATE,
  MIN_TOTAL_DURATION_MINUTES,
  MAX_TOTAL_DURATION_MINUTES,
  MIN_SESSION_DURATION_MINUTES,
  MAX_SESSION_DURATION_MINUTES,
} from '../constants/scheduling';
import { calculateSessions } from '../utils/sessionCalculations';
import QuickSkillCreate from './QuickSkillCreate';
import { SessionPlanningSection } from './scheduling';
import type {
  SkillCategoryResponse,
  ProficiencyLevelResponse,
} from '../../skills/types/CreateSkillResponse';
import type { Skill } from '../../skills/types/Skill';
import type { GetUserSkillResponse } from '../../skills/types/SkillResponses';
import type { CreateMatchRequest } from '../types/CreateMatchRequest';

// Schema angepasst für CreateMatchRequest mit neuen Session-Planungs-Feldern
const matchFormSchema = z
  .object({
    skillId: z.string().nonempty('Skill muss ausgewählt werden'),
    description: z.string().max(500, 'Beschreibung darf maximal 500 Zeichen enthalten').optional(),
    message: z.string().max(500, 'Nachricht darf maximal 500 Zeichen enthalten').optional(),
    additionalNotes: z.string().max(500, 'Notizen dürfen maximal 500 Zeichen enthalten').optional(),

    // Session Planning Fields
    isOffering: z.boolean(),
    totalDurationMinutes: z
      .number()
      .min(MIN_TOTAL_DURATION_MINUTES, `Mindestens ${MIN_TOTAL_DURATION_MINUTES} Minuten`)
      .max(MAX_TOTAL_DURATION_MINUTES, `Maximal ${MAX_TOTAL_DURATION_MINUTES} Minuten`),
    sessionDurationMinutes: z
      .number()
      .min(MIN_SESSION_DURATION_MINUTES, `Mindestens ${MIN_SESSION_DURATION_MINUTES} Minuten`)
      .max(MAX_SESSION_DURATION_MINUTES, `Maximal ${MAX_SESSION_DURATION_MINUTES} Minuten`),

    // Exchange Type Fields
    exchangeType: z.enum([
      EXCHANGE_TYPES.SKILL_EXCHANGE,
      EXCHANGE_TYPES.PAYMENT,
      // EXCHANGE_TYPES.FREE,
    ]),
    exchangeSkillId: z.string().optional(),
    exchangeSkillName: z.string().optional(),
    hourlyRate: z.number().min(0).optional(),
    currency: z.string().optional(),

    // Schedule Preferences
    preferredDays: z.array(z.string()).min(1, 'Wähle mindestens einen Tag'),
    preferredTimes: z.array(z.string()).min(1, 'Wähle mindestens eine Zeit'),
  })
  .refine(
    (data) =>
      // Wenn Skill-Tausch gewählt ist, muss auch ein Tausch-Skill ausgewählt sein
      !(data.exchangeType === EXCHANGE_TYPES.SKILL_EXCHANGE && !data.exchangeSkillId),
    {
      message: 'Bei einem Skill-Tausch muss ein eigener Skill ausgewählt werden',
      path: ['exchangeSkillId'],
    }
  )
  .refine(
    (data) =>
      // Bei Bezahlung muss ein Stundensatz angegeben sein
      !(
        data.exchangeType === EXCHANGE_TYPES.PAYMENT &&
        (data.hourlyRate === undefined || data.hourlyRate <= 0)
      ),
    {
      message: 'Bei Bezahlung muss ein Stundensatz angegeben werden',
      path: ['hourlyRate'],
    }
  );

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMatchRequest) => Promise<boolean>;
  skill: Skill;
  targetUserId: string;
  targetUserName?: string;
  isLoading?: boolean;
  userSkills?: GetUserSkillResponse[];
  error?: string | undefined;
}

// MenuProps wird jetzt in SessionPlanningSection verwaltet

/**
 * Formular zur Erstellung einer Match-Anfrage
 */
const MatchForm: React.FC<MatchFormProps> = ({
  open,
  onClose,
  onSubmit,
  skill,
  targetUserId,
  targetUserName,
  isLoading = false,
  userSkills: providedUserSkills,
  error,
}) => {
  const [userSkills, setUserSkills] = useState<GetUserSkillResponse[]>(providedUserSkills ?? []);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [categories, setCategories] = useState<SkillCategoryResponse[]>([]);
  const [proficiencyLevels, setProficiencyLevels] = useState<ProficiencyLevelResponse[]>([]);

  const loadUserSkills = async (): Promise<void> => {
    try {
      setLoadingSkills(true);
      const response = await skillService.getUserSkills(1, 50, true);
      if (isSuccessResponse(response)) {
        setUserSkills(response.data);
      }
    } catch (err) {
      console.error('Error loading user skills:', err);
      setUserSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadCategoriesAndLevels = async (): Promise<void> => {
    try {
      const [catResponse, levelResponse] = await Promise.all([
        skillService.getCategories(),
        skillService.getProficiencyLevels(),
      ]);
      if (isSuccessResponse(catResponse)) setCategories(catResponse.data);
      if (isSuccessResponse(levelResponse)) setProficiencyLevels(levelResponse.data);
    } catch (err) {
      console.error('Error loading categories/levels:', err);
    }
  };

  // Lade User Skills wenn Dialog geöffnet wird und keine bereitgestellt wurden
  useEffect(() => {
    if (open) {
      if (providedUserSkills) {
        setUserSkills(providedUserSkills);
      } else {
        void loadUserSkills();
      }
      // Lade Kategorien und Levels für Quick Create
      void loadCategoriesAndLevels();
    }
  }, [open, providedUserSkills]);

  // Default-Werte mit neuen Session-Planungs-Feldern
  const defaultValues = useMemo(
    () => ({
      skillId: skill.id,
      description: skill.isOffered
        ? 'Ich möchte diesen Skill lernen'
        : 'Ich kann bei diesem Skill helfen',
      message: '',
      additionalNotes: '',

      // Session Planning
      isOffering: !skill.isOffered, // Umgekehrt: wenn der Nutzer den Skill anbietet, will er ihn hier lernen
      totalDurationMinutes: DEFAULT_TOTAL_DURATION_MINUTES,
      sessionDurationMinutes: DEFAULT_SESSION_DURATION_MINUTES,

      // Exchange Type
      exchangeType: EXCHANGE_TYPES.SKILL_EXCHANGE,
      exchangeSkillId: '',
      exchangeSkillName: '',
      hourlyRate: DEFAULT_HOURLY_RATE,
      currency: DEFAULT_CURRENCY,

      // Schedule Preferences
      preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
      preferredTimes: ['18:00', '19:00'],
    }),
    [skill]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues,
  });

  const handleQuickSkillCreated = async (skillId: string, _skillName: string): Promise<void> => {
    // Skill wurde erstellt, lade Skills neu und wähle den neuen Skill aus
    await loadUserSkills();
    // Setze den neuen Skill als ausgewählt
    setValue('exchangeSkillId', skillId);
    setQuickCreateOpen(false);
  };

  // Reset beim Öffnen
  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const handleFormSubmit: SubmitHandler<MatchFormValues> = async (data) => {
    // Transformiere die Daten in das CreateMatchRequest Format
    if (!targetUserId) {
      console.error('❌ MatchForm: targetUserId ist erforderlich für Match-Anfragen');
      throw new Error('Target User ID ist erforderlich');
    }

    // Berechne die Session-Anzahl aus Gesamtdauer und Session-Dauer
    const isSkillExchange = data.exchangeType === EXCHANGE_TYPES.SKILL_EXCHANGE;
    const calculation = calculateSessions(
      data.totalDurationMinutes,
      data.sessionDurationMinutes,
      isSkillExchange
    );

    const matchRequest: CreateMatchRequest = {
      skillId: data.skillId,
      targetUserId,
      message:
        data.message ??
        data.description ??
        (data.isOffering ? 'Ich möchte diesen Skill anbieten' : 'Ich möchte diesen Skill lernen'),

      // Session Planning - berechnet aus Gesamtdauer
      sessionDurationMinutes: data.sessionDurationMinutes,
      totalSessions: calculation.totalSessions,
      totalDurationMinutes: data.totalDurationMinutes,

      // Exchange Type
      exchangeType: data.exchangeType,
      isSkillExchange,
      exchangeSkillId: isSkillExchange ? data.exchangeSkillId : undefined,
      isMonetary: data.exchangeType === EXCHANGE_TYPES.PAYMENT,
      offeredAmount:
        data.exchangeType === EXCHANGE_TYPES.PAYMENT &&
        data.hourlyRate !== undefined &&
        data.hourlyRate > 0
          ? data.hourlyRate * (data.totalDurationMinutes / 60)
          : undefined,
      hourlyRate: data.exchangeType === EXCHANGE_TYPES.PAYMENT ? data.hourlyRate : undefined,
      currency: data.exchangeType === EXCHANGE_TYPES.PAYMENT ? data.currency : undefined,

      // Offer/Seek
      isOffering: data.isOffering,

      // Schedule Preferences
      preferredDays: data.preferredDays,
      preferredTimes: data.preferredTimes,

      // Frontend-only fields for display
      description: data.description,
      skillName: skill.name,
      exchangeSkillName: isSkillExchange ? data.exchangeSkillName : undefined,
    };

    try {
      const success = await onSubmit(matchRequest);
      // Only close modal if submission was successful
      if (success) {
        onClose();
      } else {
        console.error('Match request failed - modal stays open for error display');
        // Don't close modal on failure - let the error be displayed via ErrorAlert
      }
    } catch (err) {
      console.error('Failed to create match request:', err);
      // Don't close modal on error - let the error be displayed via ErrorAlert
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Match-Anfrage erstellen"
      maxWidth="md"
      fullWidth
      actions={
        <>
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Abbrechen
          </Button>
          <LoadingButton
            type="submit"
            form="match-request-form"
            color="primary"
            variant="contained"
            loading={isLoading}
            disabled={isLoading || Object.keys(errors).some((key) => key !== 'root')}
          >
            Match-Anfrage senden
          </LoadingButton>
        </>
      }
    >
      <form id="match-request-form" onSubmit={handleSubmit(handleFormSubmit)}>
        <ErrorAlert
          error={error ?? (errors.root ? { message: errors.root.message ?? '' } : undefined)}
          onDismiss={() => {}}
          compact={process.env.NODE_ENV === 'production'}
        />

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

            {loadingSkills ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : null}

            {targetUserName ? (
              <Box
                bgcolor="primary.main"
                color="primary.contrastText"
                p={2}
                borderRadius={1}
                mb={2}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Anfrage an: {targetUserName}
                </Typography>
              </Box>
            ) : null}

            {/* Description field */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Kurze Beschreibung"
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message ?? 'Beschreibe kurz, was du möchtest'}
                  disabled={isLoading}
                  placeholder="Was möchtest du mit diesem Skill machen?"
                  sx={{ mb: 3 }}
                />
              )}
            />
          </Grid>

          {/* Session Planning Section - enthält:
              - Offer/Seek Toggle (Lernen/Lehren)
              - Exchange Type (Skill-Tausch/Bezahlung/Kostenlos)
              - Total Duration + Session Duration
              - Session Calculation Display
              - Preferred Days + Times
          */}
          <Grid size={{ xs: 12 }}>
            <SessionPlanningSection
              control={control as never}
              errors={errors as never}
              watch={watch as never}
              setValue={setValue as never}
              userSkills={userSkills}
              onCreateSkill={() => setQuickCreateOpen(true)}
              targetUserName={targetUserName}
              skillName={skill.name}
              isLoading={isLoading}
            />
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
                      endAdornment:
                        field.value && field.value.length > 0 ? (
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

      {/* Quick Skill Create Dialog */}
      <QuickSkillCreate
        open={quickCreateOpen}
        onClose={() => {
          setQuickCreateOpen(false);
        }}
        onSkillCreated={handleQuickSkillCreated}
        categories={categories}
        proficiencyLevels={proficiencyLevels}
      />
    </FormDialog>
  );
};

export default MatchForm;
