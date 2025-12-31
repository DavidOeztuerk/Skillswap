import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  type SelectChangeEvent,
} from '@mui/material';
import ErrorAlert from '../../../shared/components/error/ErrorAlert';
import FormDialog from '../../../shared/components/ui/FormDialog';
import { SchedulingSection, ExchangeSection, LocationSection } from './SkillFormSections';
import type { CreateSkillRequest } from '../types/CreateSkillRequest';
import type { ProficiencyLevel, Skill, SkillCategory } from '../types/Skill';

// =============================================================================
// TYPES
// =============================================================================

interface SkillFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (skillData: CreateSkillRequest, skillId?: string) => void;
  categories: SkillCategory[];
  proficiencyLevels: ProficiencyLevel[];
  loading: boolean;
  skill?: Skill;
  title?: string;
  error?: { message: string } | null;
}

// interface FormValues extends CreateSkillRequest {
//   // All fields from CreateSkillRequest
// }

const getDefaultFormValues = (): CreateSkillRequest => ({
  name: '',
  description: '',
  categoryId: '',
  proficiencyLevelId: '',
  isOffered: true,
  tags: [],
  // Exchange
  exchangeType: 'skill_exchange',
  desiredSkillCategoryId: undefined,
  desiredSkillDescription: undefined,
  hourlyRate: undefined,
  currency: 'EUR',
  // Scheduling
  preferredDays: [],
  preferredTimes: [],
  sessionDurationMinutes: 60,
  totalSessions: 1,
  // Location
  locationType: 'remote',
  locationAddress: undefined,
  locationCity: undefined,
  locationPostalCode: undefined,
  locationCountry: undefined,
  maxDistanceKm: 50,
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const validateBasicFields = (
  formValues: CreateSkillRequest
): Partial<Record<keyof CreateSkillRequest, string>> => {
  const errors: Partial<Record<keyof CreateSkillRequest, string>> = {};

  if (!formValues.name.trim()) {
    errors.name = 'Name ist erforderlich';
  } else if (formValues.name.trim().length < 3) {
    errors.name = 'Name muss mindestens 3 Zeichen lang sein';
  }

  if (!formValues.description.trim()) {
    errors.description = 'Beschreibung ist erforderlich';
  } else if (formValues.description.trim().length < 10) {
    errors.description = 'Beschreibung muss mindestens 10 Zeichen lang sein';
  }

  if (!formValues.categoryId) {
    errors.categoryId = 'Kategorie ist erforderlich';
  }
  if (!formValues.proficiencyLevelId) {
    errors.proficiencyLevelId = 'Fertigkeitsstufe ist erforderlich';
  }

  return errors;
};

const validatePaymentFields = (
  formValues: CreateSkillRequest
): Partial<Record<keyof CreateSkillRequest, string>> => {
  const errors: Partial<Record<keyof CreateSkillRequest, string>> = {};

  if (formValues.exchangeType === 'payment') {
    if (!formValues.isOffered) {
      errors.exchangeType = 'Bezahlung ist nur beim Anbieten möglich';
    }
    if (formValues.hourlyRate === undefined || formValues.hourlyRate < 5) {
      errors.hourlyRate = 'Stundensatz muss mindestens 5 sein';
    }
  }

  return errors;
};

const validateLocationFields = (
  formValues: CreateSkillRequest
): Partial<Record<keyof CreateSkillRequest, string>> => {
  const errors: Partial<Record<keyof CreateSkillRequest, string>> = {};

  if (formValues.locationType === 'in_person' || formValues.locationType === 'both') {
    if (!formValues.locationCity?.trim()) {
      errors.locationCity = 'Stadt ist für Vor-Ort-Skills erforderlich';
    }
    if (!formValues.locationCountry?.trim()) {
      errors.locationCountry = 'Land ist für Vor-Ort-Skills erforderlich';
    }
  }

  return errors;
};

// =============================================================================
// FORM INITIALIZATION HELPER
// =============================================================================

const initializeFormFromSkill = (skill: Skill): CreateSkillRequest => ({
  name: skill.name,
  description: skill.description,
  categoryId: skill.category.id,
  proficiencyLevelId: skill.proficiencyLevel.id,
  isOffered: skill.isOffered,
  tags: skill.tagsJson ? (JSON.parse(skill.tagsJson) as string[]) : [],
  exchangeType: skill.exchangeType ?? 'skill_exchange',
  desiredSkillCategoryId: skill.desiredSkillCategoryId,
  desiredSkillDescription: skill.desiredSkillDescription,
  hourlyRate: skill.hourlyRate,
  currency: skill.currency ?? 'EUR',
  preferredDays: skill.preferredDays ?? [],
  preferredTimes: skill.preferredTimes ?? [],
  sessionDurationMinutes: skill.sessionDurationMinutes ?? 60,
  totalSessions: skill.totalSessions ?? 1,
  locationType: skill.locationType ?? 'remote',
  locationAddress: skill.locationAddress,
  locationCity: skill.locationCity,
  locationPostalCode: skill.locationPostalCode,
  locationCountry: skill.locationCountry,
  maxDistanceKm: skill.maxDistanceKm ?? 50,
});

// =============================================================================
// COMPONENT
// =============================================================================

const SkillForm: React.FC<SkillFormProps> = ({
  open,
  onClose,
  onSubmit,
  categories,
  proficiencyLevels,
  loading,
  skill,
  title,
  error,
}) => {
  const [formValues, setFormValues] = useState<CreateSkillRequest>(getDefaultFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSkillRequest, string>>>({});
  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      setFormValues(skill ? initializeFormFromSkill(skill) : getDefaultFormValues());
      setErrors({});
      setExpandedSection(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [open, skill]);

  // Handlers
  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ): void => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateSkillRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: checked }));

    // If switching to "seeking" (isOffered=false), payment is not allowed
    if (name === 'isOffered' && !checked && formValues.exchangeType === 'payment') {
      setFormValues((prev) => ({ ...prev, exchangeType: 'skill_exchange' }));
    }
  };

  const handleNumberChange = (name: keyof CreateSkillRequest, value: number): void => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayToggle = (name: 'preferredDays' | 'preferredTimes', value: string): void => {
    setFormValues((prev) => {
      const current = prev[name] ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [name]: updated };
    });
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateSkillRequest, string>> = {
      ...validateBasicFields(formValues),
      ...validatePaymentFields(formValues),
      ...validateLocationFields(formValues),
    };
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (validateForm()) {
      const submitData: CreateSkillRequest = {
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        isOffered: formValues.isOffered,
        categoryId: formValues.categoryId,
        proficiencyLevelId: formValues.proficiencyLevelId,
        tags: formValues.tags,
        // Exchange
        exchangeType: formValues.exchangeType,
        desiredSkillCategoryId: formValues.desiredSkillCategoryId,
        desiredSkillDescription: formValues.desiredSkillDescription?.trim(),
        hourlyRate: formValues.exchangeType === 'payment' ? formValues.hourlyRate : undefined,
        currency: formValues.exchangeType === 'payment' ? formValues.currency : undefined,
        // Scheduling
        preferredDays: formValues.preferredDays,
        preferredTimes: formValues.preferredTimes,
        sessionDurationMinutes: formValues.sessionDurationMinutes,
        totalSessions: formValues.totalSessions,
        // Location
        locationType: formValues.locationType,
        locationAddress: formValues.locationAddress?.trim(),
        locationCity: formValues.locationCity?.trim(),
        locationPostalCode: formValues.locationPostalCode?.trim(),
        locationCountry: formValues.locationCountry?.toUpperCase().trim(),
        maxDistanceKm: formValues.maxDistanceKm,
      };
      onSubmit(submitData, skill?.id);
    }
  };

  const handleDialogClose = (): void => {
    if (!loading) {
      onClose();
    }
  };

  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const hasProficiencyLevels = Array.isArray(proficiencyLevels) && proficiencyLevels.length > 0;

  // Calculate total duration
  const totalDuration = (formValues.sessionDurationMinutes ?? 60) * (formValues.totalSessions ?? 1);
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;

  return (
    <FormDialog
      open={open}
      onClose={handleDialogClose}
      title={title ?? (skill === undefined ? 'Neuen Skill erstellen' : 'Skill bearbeiten')}
      maxWidth="md"
      fullWidth
      actions={
        <>
          <Button onClick={handleDialogClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !hasCategories || !hasProficiencyLevels}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
            form="skill-form"
          >
            {loading ? 'Wird gespeichert...' : skill === undefined ? 'Erstellen' : 'Aktualisieren'}
          </Button>
        </>
      }
    >
      <form id="skill-form" onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <ErrorAlert
            error={error}
            onDismiss={() => {}}
            compact={process.env.NODE_ENV === 'production'}
          />

          {/* ================================================================ */}
          {/* BASIC INFORMATION */}
          {/* ================================================================ */}

          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formValues.name}
            onChange={handleFieldChange}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Beschreibung"
            name="description"
            value={formValues.description}
            onChange={handleFieldChange}
            error={!!errors.description}
            helperText={errors.description ?? 'Mindestens 10 Zeichen erforderlich'}
            multiline
            rows={4}
            disabled={loading}
            margin="normal"
            required
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />

          <FormControl
            fullWidth
            error={!!errors.categoryId}
            disabled={loading || !hasCategories}
            margin="normal"
            required
          >
            <InputLabel id="category-select-label">Kategorie</InputLabel>
            <Select
              labelId="category-select-label"
              name="categoryId"
              value={formValues.categoryId}
              onChange={handleFieldChange}
              label="Kategorie"
            >
              {hasCategories ? (
                categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>Kategorien werden geladen...</MenuItem>
              )}
            </Select>
            {errors.categoryId ? <FormHelperText>{errors.categoryId}</FormHelperText> : null}
          </FormControl>

          <FormControl
            fullWidth
            error={!!errors.proficiencyLevelId}
            disabled={loading || !hasProficiencyLevels}
            margin="normal"
            required
          >
            <InputLabel id="proficiency-select-label">Fertigkeitsstufe</InputLabel>
            <Select
              labelId="proficiency-select-label"
              name="proficiencyLevelId"
              value={formValues.proficiencyLevelId}
              onChange={handleFieldChange}
              label="Fertigkeitsstufe"
            >
              {hasProficiencyLevels ? (
                [...proficiencyLevels]
                  .sort((a, b) => a.rank - b.rank)
                  .map((level) => (
                    <MenuItem key={level.id} value={level.id}>
                      {level.level} {level.rank > 0 ? `(${'★'.repeat(level.rank)})` : ''}
                    </MenuItem>
                  ))
              ) : (
                <MenuItem disabled>Fertigkeitsstufen werden geladen...</MenuItem>
              )}
            </Select>
            {errors.proficiencyLevelId ? (
              <FormHelperText>{errors.proficiencyLevelId}</FormHelperText>
            ) : null}
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formValues.isOffered}
                onChange={handleSwitchChange}
                name="isOffered"
                color="primary"
                disabled={loading}
              />
            }
            label={
              <Typography>
                {formValues.isOffered ? 'Angeboten' : 'Gesucht'}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {formValues.isOffered
                    ? '(Ich biete diese Fähigkeit an)'
                    : '(Ich suche jemanden mit dieser Fähigkeit)'}
                </Typography>
              </Typography>
            }
            sx={{ mt: 2 }}
          />

          <Divider sx={{ my: 3 }} />

          {/* ================================================================ */}
          {/* SCHEDULING SECTION (Collapsible) */}
          {/* ================================================================ */}

          <SchedulingSection
            formValues={formValues}
            loading={loading}
            expanded={expandedSection === 'scheduling'}
            onExpandChange={(expanded) => setExpandedSection(expanded ? 'scheduling' : false)}
            onNumberChange={handleNumberChange}
            onArrayToggle={handleArrayToggle}
            totalHours={totalHours}
            totalMinutes={totalMinutes}
          />

          {/* ================================================================ */}
          {/* EXCHANGE SECTION (Collapsible) */}
          {/* ================================================================ */}

          <ExchangeSection
            formValues={formValues}
            loading={loading}
            expanded={expandedSection === 'exchange'}
            onExpandChange={(expanded) => setExpandedSection(expanded ? 'exchange' : false)}
            categories={categories}
            hasCategories={hasCategories}
            errors={errors}
            onFieldChange={handleFieldChange}
            onExchangeTypeChange={(value) =>
              setFormValues((prev) => ({ ...prev, exchangeType: value }))
            }
            onNumberChange={handleNumberChange}
            totalDuration={totalDuration}
            totalHours={totalHours}
            totalMinutes={totalMinutes}
          />

          {/* ================================================================ */}
          {/* LOCATION SECTION (Collapsible) */}
          {/* ================================================================ */}

          <LocationSection
            formValues={formValues}
            loading={loading}
            expanded={expandedSection === 'location'}
            onExpandChange={(expanded) => setExpandedSection(expanded ? 'location' : false)}
            errors={errors}
            onFieldChange={handleFieldChange}
            onLocationTypeChange={(value) =>
              setFormValues((prev) => ({ ...prev, locationType: value }))
            }
            onNumberChange={handleNumberChange}
          />
        </Box>
      </form>
    </FormDialog>
  );
};

export default SkillForm;
