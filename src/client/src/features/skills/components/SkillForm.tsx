import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LocalOffer as OfferIcon,
  Search as SearchIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  Box,
  TextField,
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
import type { FlattenedTopicOption } from '../types/CreateSkillResponse';
import type { Skill, SkillCategory } from '../types/Skill';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Builds display path for a topic, skipping duplicate names
 */
const buildTopicPath = (
  categoryName: string,
  subcategoryName: string,
  topicName: string
): string => {
  const parts: string[] = [categoryName];
  if (subcategoryName !== categoryName) parts.push(subcategoryName);
  if (topicName !== subcategoryName && topicName !== categoryName) parts.push(topicName);
  return parts.join(' > ');
};

/**
 * Sort comparator for flattened topics
 * Sorts by: Category → Subcategory → Featured → Topic Name
 */
const compareTopics = (a: FlattenedTopicOption, b: FlattenedTopicOption): number => {
  // 1. Sort by category name
  const catCompare = a.categoryName.localeCompare(b.categoryName);
  if (catCompare !== 0) return catCompare;
  // 2. Sort by subcategory name within category
  const subCompare = a.subcategoryName.localeCompare(b.subcategoryName);
  if (subCompare !== 0) return subCompare;
  // 3. Featured topics first within subcategory
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
  // 4. Alphabetically by topic name
  return a.name.localeCompare(b.name);
};

/**
 * Flattens the category hierarchy into a list of topic options for the Autocomplete
 */
const flattenCategoriesToTopics = (categories: SkillCategory[]): FlattenedTopicOption[] =>
  categories
    .filter((cat) => cat.subcategories && cat.subcategories.length > 0)
    .flatMap((category) =>
      (category.subcategories ?? [])
        .filter((sub) => sub.topics.length > 0)
        .flatMap((subcategory) =>
          subcategory.topics.map((topic) => ({
            id: topic.id,
            name: topic.name,
            categoryId: category.id,
            categoryName: category.name,
            subcategoryId: subcategory.id,
            subcategoryName: subcategory.name,
            fullPath: buildTopicPath(category.name, subcategory.name, topic.name),
            isFeatured: topic.isFeatured,
            skillCount: topic.skillCount,
          }))
        )
    )
    .sort(compareTopics);

// =============================================================================
// TYPES
// =============================================================================

interface SkillFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (skillData: CreateSkillRequest, skillId?: string) => void;
  categories: SkillCategory[];
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

/**
 * Safely parse tags from tagsJson field
 * Handles: JSON array string '["a","b"]', comma-separated 'a,b', or empty
 */
const parseTagsJson = (tagsJson: string | undefined): string[] => {
  if (!tagsJson) return [];
  try {
    const parsed: unknown = JSON.parse(tagsJson);
    if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')) {
      return parsed;
    }
    return [];
  } catch {
    // Fallback for comma-separated format (legacy)
    return tagsJson
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
};

const initializeFormFromSkill = (skill: Skill): CreateSkillRequest => ({
  name: skill.name,
  description: skill.description,
  categoryId: skill.category.id,
  isOffered: skill.isOffered,
  tags: parseTagsJson(skill.tagsJson),
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
  const [selectedTopic, setSelectedTopic] = useState<FlattenedTopicOption | null>(null);

  const lastCategoryIdRef = useRef<string>('');

  // Flatten category hierarchy to topic options for Autocomplete
  const flattenedTopics = useMemo(() => flattenCategoriesToTopics(categories), [categories]);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      const initialValues = skill ? initializeFormFromSkill(skill) : getDefaultFormValues();

      setFormValues(initialValues);
      setErrors({});
      setExpandedSection(false);
      setImagePreview(null);
      // Track initial category for edit mode
      lastCategoryIdRef.current = initialValues.categoryId;
      // Find and set the selected topic for edit mode
      if (initialValues.categoryId && flattenedTopics.length > 0) {
        const topic = flattenedTopics.find((t) => t.id === initialValues.categoryId);
        setSelectedTopic(topic ?? null);
      } else {
        setSelectedTopic(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [open, skill, flattenedTopics]);

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

  // Handle topic selection from Autocomplete
  const handleTopicChange = (
    _event: React.SyntheticEvent,
    newValue: FlattenedTopicOption | null
  ): void => {
    setSelectedTopic(newValue);
    const newCategoryId = newValue?.id ?? '';
    setFormValues((prev) => ({ ...prev, categoryId: newCategoryId }));
    lastCategoryIdRef.current = newCategoryId;

    // Clear category error if present
    if (errors.categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: undefined }));
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
  const hasTopics = flattenedTopics.length > 0;

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
            disabled={loading || !hasTopics}
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

          {/* Topic Selection with Grouped Autocomplete */}
          <Autocomplete<FlattenedTopicOption>
            fullWidth
            options={flattenedTopics}
            value={selectedTopic}
            onChange={handleTopicChange}
            groupBy={(option: FlattenedTopicOption) => option.categoryName}
            getOptionLabel={(option: FlattenedTopicOption) => option.fullPath}
            isOptionEqualToValue={(option: FlattenedTopicOption, value: FlattenedTopicOption) =>
              option.id === value.id
            }
            disabled={loading || flattenedTopics.length === 0}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Kategorie / Topic"
                margin="normal"
                required
                error={!!errors.categoryId}
                helperText={errors.categoryId ?? 'Wähle ein passendes Topic für deinen Skill'}
                placeholder="Suche nach Topic..."
              />
            )}
            renderGroup={(params) => (
              <li key={params.key}>
                <Box
                  sx={{
                    position: 'sticky',
                    top: -8,
                    padding: '8px 10px',
                    backgroundColor: 'background.paper',
                    fontWeight: 'bold',
                    color: 'primary.main',
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  {params.group}
                </Box>
                <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
              </li>
            )}
            renderOption={(props, option: FlattenedTopicOption) => {
              const { key, ...otherProps } = props as React.HTMLAttributes<HTMLLIElement> & {
                key: string;
              };
              return (
                <li key={key} {...otherProps}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      pl: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{option.name}</Typography>
                      {option.subcategoryName !== option.categoryName &&
                        option.name !== option.subcategoryName && (
                          <Typography variant="caption" color="text.secondary">
                            ({option.subcategoryName})
                          </Typography>
                        )}
                    </Box>
                    {option.isFeatured ? (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: 14 }} />}
                        label="Beliebt"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: 11 } }}
                      />
                    ) : null}
                  </Box>
                </li>
              );
            }}
            noOptionsText="Keine Topics gefunden"
            loadingText="Lade Topics..."
            sx={{ mt: 2 }}
          />

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
