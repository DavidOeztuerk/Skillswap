import React, { useState, useEffect } from 'react';
import { LocalOffer as OfferIcon, Search as SearchIcon } from '@mui/icons-material';
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
  CircularProgress,
  Divider,
  Chip,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  type SelectChangeEvent,
} from '@mui/material';
import ErrorAlert from '../../../shared/components/error/ErrorAlert';
import FormDialog from '../../../shared/components/ui/FormDialog';
import { useAuth } from '../../auth/hooks/useAuth';
import { SchedulingSection, ExchangeSection, LocationSection } from './SkillFormSections';
import SkillImageSection, { type ImageOption } from './SkillImageSection';
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
  /** User's own offered skills for exchange selection when seeking */
  userOfferedSkills: Skill[];
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
  // Image
  imageOption: 'none',
  imageData: undefined,
  imageFileName: undefined,
  imageContentType: undefined,
  // Exchange
  exchangeType: 'skill_exchange',
  desiredSkillCategoryId: undefined,
  desiredSkillDescription: undefined,
  offeredSkillId: undefined,
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

const validateSchedulingFields = (
  formValues: CreateSkillRequest
): Partial<Record<keyof CreateSkillRequest, string>> => {
  const errors: Partial<Record<keyof CreateSkillRequest, string>> = {};

  if (!formValues.preferredDays || formValues.preferredDays.length === 0) {
    errors.preferredDays = 'Mindestens ein bevorzugter Tag ist erforderlich';
  }

  if (!formValues.preferredTimes || formValues.preferredTimes.length === 0) {
    errors.preferredTimes = 'Mindestens eine bevorzugte Uhrzeit ist erforderlich';
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
  offeredSkillId: skill.offeredSkillId,
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
  userOfferedSkills,
}) => {
  const { user } = useAuth();
  const [formValues, setFormValues] = useState<CreateSkillRequest>(getDefaultFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof CreateSkillRequest, string>>>({});
  const [expandedSection, setExpandedSection] = useState<string | false>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      setFormValues(skill ? initializeFormFromSkill(skill) : getDefaultFormValues());
      setErrors({});
      setExpandedSection(false);
      setImagePreview(null);
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

  const handleIsOfferedChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: 'offer' | 'seek' | null
  ): void => {
    if (newValue === null) return; // Don't allow deselection
    const isOffered = newValue === 'offer';
    setFormValues((prev) => ({ ...prev, isOffered }));

    // If switching to "seeking" (isOffered=false), payment is not allowed
    if (!isOffered && formValues.exchangeType === 'payment') {
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

    // Clear error when user adds a value (not when removing)
    const currentValues = formValues[name] ?? [];
    if (!currentValues.includes(value) && errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Image handlers
  const handleImageOptionChange = (option: ImageOption): void => {
    if (option === 'upload') {
      setFormValues((prev) => ({ ...prev, imageOption: option }));
    } else {
      // Clear upload data when switching away from upload
      setFormValues((prev) => ({
        ...prev,
        imageOption: option,
        imageData: undefined,
        imageFileName: undefined,
        imageContentType: undefined,
      }));
      setImagePreview(null);
    }
  };

  const handleImageUpload = (file: File): void => {
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      const base64 = e.target?.result as string;
      // Remove the data:image/xxx;base64, prefix for storage
      const base64Data = base64.split(',')[1];
      setFormValues((prev) => ({
        ...prev,
        imageOption: 'upload',
        imageData: base64Data,
        imageFileName: file.name,
        imageContentType: file.type,
      }));
      setImagePreview(base64); // Keep full data URL for preview
    });
    reader.readAsDataURL(file);
  };

  const handleImageClear = (): void => {
    setFormValues((prev) => ({
      ...prev,
      imageOption: 'none',
      imageData: undefined,
      imageFileName: undefined,
      imageContentType: undefined,
    }));
    setImagePreview(null);
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateSkillRequest, string>> = {
      ...validateBasicFields(formValues),
      ...validateSchedulingFields(formValues),
      ...validatePaymentFields(formValues),
      ...validateLocationFields(formValues),
    };
    setErrors(newErrors);

    // If scheduling errors exist, expand the section to show the error
    if (newErrors.preferredDays || newErrors.preferredTimes) {
      setExpandedSection('scheduling');
    }

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
        offeredSkillId:
          !formValues.isOffered && formValues.exchangeType === 'skill_exchange'
            ? formValues.offeredSkillId
            : undefined,
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
          {/* SKILL TYPE SELECTION (Offer or Seek) */}
          {/* ================================================================ */}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Was möchtest du tun?
            </Typography>
            <ToggleButtonGroup
              value={formValues.isOffered ? 'offer' : 'seek'}
              exclusive
              onChange={handleIsOfferedChange}
              disabled={loading}
              sx={{ width: '100%' }}
            >
              <ToggleButton
                value="offer"
                sx={{
                  flex: 1,
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <OfferIcon />
                  <Typography variant="body2">Ich biete an</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton
                value="seek"
                sx={{
                  flex: 1,
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'secondary.main',
                    color: 'secondary.contrastText',
                    '&:hover': {
                      backgroundColor: 'secondary.dark',
                    },
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SearchIcon />
                  <Typography variant="body2">Ich suche</Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formValues.isOffered
                ? 'Du bietest diesen Skill an und kannst anderen beibringen.'
                : 'Du suchst jemanden, der dir diesen Skill beibringen kann.'}
            </Typography>
          </Box>

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

          {/* Tags Input */}
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formValues.tags ?? []}
            onChange={(_, newValue) => {
              // Filter out empty strings and limit to 10 tags
              const filteredTags = newValue
                .map((tag) => (typeof tag === 'string' ? tag.trim() : tag))
                .filter((tag) => tag.length > 0)
                .slice(0, 10);
              setFormValues((prev) => ({ ...prev, tags: filteredTags }));
            }}
            renderValue={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option} size="small" {...tagProps} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder={
                  (formValues.tags?.length ?? 0) < 10 ? 'Tag eingeben und Enter drücken...' : ''
                }
                helperText={`${formValues.tags?.length ?? 0}/10 Tags - Hilft anderen, deinen Skill zu finden`}
                margin="normal"
                disabled={loading}
              />
            )}
            disabled={loading}
            sx={{ mt: 2 }}
          />

          <Divider sx={{ my: 3 }} />

          {/* ================================================================ */}
          {/* IMAGE SECTION (Collapsible) */}
          {/* ================================================================ */}

          <SkillImageSection
            imageOption={formValues.imageOption ?? 'none'}
            imagePreview={imagePreview}
            profilePhotoUrl={user?.profilePictureUrl}
            loading={loading}
            expanded={expandedSection === 'image'}
            onExpandChange={(expanded) => setExpandedSection(expanded ? 'image' : false)}
            onImageOptionChange={handleImageOptionChange}
            onImageUpload={handleImageUpload}
            onImageClear={handleImageClear}
          />

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
            errors={errors}
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
            userOfferedSkills={userOfferedSkills}
            onOfferedSkillChange={(skillId: string | undefined) =>
              setFormValues((prev) => ({ ...prev, offeredSkillId: skillId }))
            }
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
