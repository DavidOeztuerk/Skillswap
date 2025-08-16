import React, { useMemo, useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Checkbox,
  TextField,
  Box,
  Typography,
  Divider,
  FormHelperText,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ListItemText,
  InputAdornment,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import FormDialog from '../ui/FormDialog';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { WEEKDAYS, TIME_SLOTS } from '../../config/constants';
import LoadingButton from '../ui/LoadingButton';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { Skill } from '../../types/models/Skill';
import { GetUserSkillRespone } from '../../api/services/skillsService';
import { SkillService } from '../../api/services/skillsService';
import QuickSkillCreate from './QuickSkillCreate';
import { Add as AddIcon } from '@mui/icons-material';

// Schema angepasst für CreateMatchRequest
const matchFormSchema = z.object({
  skillId: z.string().nonempty('Skill muss ausgewählt werden'),
  description: z
    .string()
    .max(500, 'Beschreibung darf maximal 500 Zeichen enthalten')
    .optional(),
  message: z
    .string()
    .max(500, 'Nachricht darf maximal 500 Zeichen enthalten')
    .optional(),
  isOffering: z.boolean(),
  isSkillExchange: z.boolean().optional(),
  exchangeSkillId: z.string().optional(),
  preferredDays: z.array(z.string()).min(1, 'Wähle mindestens einen Tag'),
  preferredTimes: z.array(z.string()).min(1, 'Wähle mindestens eine Zeit'),
  additionalNotes: z
    .string()
    .max(500, 'Notizen dürfen maximal 500 Zeichen enthalten')
    .optional(),
}).refine(
  (data) => {
    // Wenn Skill-Tausch gewählt ist, muss auch ein Tausch-Skill ausgewählt sein
    if (data.isSkillExchange && !data.exchangeSkillId) {
      return false;
    }
    return true;
  },
  {
    message: 'Bei einem Skill-Tausch muss ein eigener Skill ausgewählt werden',
    path: ['exchangeSkillId'],
  }
);

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMatchRequest) => Promise<void>;
  skill: Skill;
  targetUserId: string; // ✅ VEREINFACHT: Direkt targetUserId anstatt User-Objekt
  targetUserName?: string; // ✅ Optional: Name für Anzeige
  isLoading?: boolean;
  userSkills?: GetUserSkillRespone[]; // Skills des aktuellen Users für Tausch
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
  targetUserId,
  targetUserName,
  isLoading = false,
  userSkills: providedUserSkills,
}) => {
  const [userSkills, setUserSkills] = useState<GetUserSkillRespone[]>(providedUserSkills || []);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [proficiencyLevels, setProficiencyLevels] = useState<any[]>([]);

  // Lade User Skills wenn Dialog geöffnet wird und keine bereitgestellt wurden
  useEffect(() => {
    if (open) {
      if (!providedUserSkills) {
        loadUserSkills();
      } else {
        setUserSkills(providedUserSkills);
      }
      // Lade Kategorien und Levels für Quick Create
      loadCategoriesAndLevels();
    }
  }, [open, providedUserSkills]);

  const loadUserSkills = async () => {
    try {
      setLoadingSkills(true);
      const response = await SkillService.getUserSkills(1, 50, true); // Nur angebotene Skills
      if (response.data) {
        setUserSkills(response.data);
      }
    } catch (error) {
      console.error('Error loading user skills:', error);
      setUserSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadCategoriesAndLevels = async () => {
    try {
      const [catResponse, levelResponse] = await Promise.all([
        SkillService.getCategories(),
        SkillService.getProficiencyLevels(),
      ]);
      if (catResponse.data) setCategories(catResponse.data);
      if (levelResponse.data) setProficiencyLevels(levelResponse.data);
    } catch (error) {
      console.error('Error loading categories/levels:', error);
    }
  };

  const handleQuickSkillCreated = async (skillId: string, _skillName: string) => {
    // Skill wurde erstellt, lade Skills neu und wähle den neuen Skill aus
    await loadUserSkills();
    // Setze den neuen Skill als ausgewählt
    setValue('exchangeSkillId', skillId);
    setQuickCreateOpen(false);
  };
  // Default-Werte
  const defaultValues = useMemo(() => {
    return {
      skillId: skill.id,
      description: skill.isOffered ? 'Ich möchte diesen Skill lernen' : 'Ich kann bei diesem Skill helfen',
      isOffering: !skill.isOffered, // Umgekehrt: wenn der Nutzer den Skill anbietet, will er ihn hier lernen
      isSkillExchange: false,
      exchangeSkillId: '',
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
    setValue,
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
      if (!targetUserId) {
        console.error('❌ MatchForm: targetUserId ist erforderlich für Match-Anfragen');
        throw new Error('Target User ID ist erforderlich');
      }

      const matchRequest: CreateMatchRequest = {
        skillId: data.skillId,
        targetUserId: targetUserId,
        message: data.message || data.description || (data.isOffering ? 'Ich möchte diesen Skill anbieten' : 'Ich möchte diesen Skill lernen'),
        isSkillExchange: data.isSkillExchange || false,
        exchangeSkillId: data.exchangeSkillId,
        isMonetary: false, // Vorerst kein Geld-Austausch
        sessionDurationMinutes: 60, // Standard: 60 Minuten
        totalSessions: 1, // Standard: 1 Session
        preferredDays: data.preferredDays,
        preferredTimes: data.preferredTimes,
        // Frontend-only fields for display
        description: data.description,
        skillName: skill.name,
        exchangeSkillName: data.exchangeSkillId 
          ? userSkills.find(s => s.skillId === data.exchangeSkillId)?.name
          : undefined,
      };

      await onSubmit(matchRequest);
      onClose();
    } catch (error) {
      console.error('Failed to create match request:', error);
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
          >
            Match-Anfrage senden
          </LoadingButton>
        </>
      }
    >
      <form id="match-request-form" onSubmit={handleSubmit(handleFormSubmit)}>
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

            {loadingSkills && (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            )}

            {targetUserName && (
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
            )}

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
                  helperText={errors.description?.message || 'Beschreibe kurz, was du möchtest'}
                  disabled={isLoading}
                  placeholder="Was möchtest du mit diesem Skill machen?"
                />
              )}
            />

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
            
            {/* Skill Exchange Option */}
            <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
              <Controller
                name="isSkillExchange"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label="Skill-Tausch: Ich möchte einen eigenen Skill im Austausch anbieten"
                  />
                )}
              />
            </FormControl>

            {/* Exchange Skill Selection */}
            {watch('isSkillExchange') && (
              <Controller
                name="exchangeSkillId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.exchangeSkillId} sx={{ mb: 2 }}>
                    <FormLabel>Wähle deinen Skill für den Tausch</FormLabel>
                    <Select
                      {...field}
                      value={field.value || ''}
                      disabled={isLoading || userSkills.length === 0}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        {userSkills.length === 0 
                          ? 'Keine eigenen Skills vorhanden'
                          : 'Wähle einen Skill aus'}
                      </MenuItem>
                      {userSkills.map((userSkill) => (
                        <MenuItem key={userSkill.skillId} value={userSkill.skillId}>
                          <Box>
                            <Typography variant="body1">{userSkill.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {userSkill.category.name} • {userSkill.proficiencyLevel.level}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.exchangeSkillId && (
                      <FormHelperText>{errors.exchangeSkillId.message}</FormHelperText>
                    )}
                    {userSkills.length === 0 && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Du hast noch keine eigenen Skills. 
                        <Button 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                          onClick={() => setQuickCreateOpen(true)}
                          startIcon={<AddIcon />}
                        >
                          Skill erstellen
                        </Button>
                      </Alert>
                    )}
                    {userSkills.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setQuickCreateOpen(true)}
                        >
                          Neuen Skill erstellen
                        </Button>
                      </Box>
                    )}
                  </FormControl>
                )}
              />
            )}
            
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
      </form>
      
      {/* Quick Skill Create Dialog */}
      <QuickSkillCreate
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSkillCreated={handleQuickSkillCreated}
        categories={categories}
        proficiencyLevels={proficiencyLevels}
      />
    </FormDialog>
  );
};

export default MatchForm;
