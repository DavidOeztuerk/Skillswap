// SkillForm.tsx
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material';
import {
  Skill,
  SkillCategory,
  ProficiencyLevel,
} from '../../types/models/Skill';

interface SkillRequest {
  name: string;
  description: string;
  isOffering: boolean;
  skillCategoryId: string;
  proficiencyLevelId: string;
}

interface SkillFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (skillData: SkillRequest, skillId?: string) => void;
  categories: SkillCategory[];
  proficiencyLevels: ProficiencyLevel[];
  loading: boolean;
  skill?: Skill;
  title?: string;
}

const SkillForm: React.FC<SkillFormProps> = ({
  open,
  onClose,
  onSubmit,
  categories,
  proficiencyLevels,
  loading,
  skill,
  title,
}) => {
  const theme = useTheme();

  const [formValues, setFormValues] = useState<SkillRequest>({
    name: '',
    description: '',
    skillCategoryId: '',
    proficiencyLevelId: '',
    isOffering: true,
  });

  const [errors, setErrors] = useState<Partial<SkillRequest>>({});

  // Helper function to get the correct ID field from categories
  const getCategoryId = (category: SkillCategory): string => {
    // Try different possible ID field names
    return category.categoryId || category.categoryId || '';
  };

  // Helper function to get the correct ID field from proficiency levels
  const getProficiencyLevelId = (level: ProficiencyLevel): string => {
    // Try different possible ID field names
    return level.levelId || level.levelId || '';
  };

  // Helper function to get rank from proficiency level
  const getProficiencyLevelRank = (level: ProficiencyLevel): number => {
    return level.rank || 0;
  };

  useEffect(() => {
    console.log('[SkillForm] Categories received:', categories);
    console.log('[SkillForm] ProficiencyLevels received:', proficiencyLevels);

    if (open) {
      if (skill) {
        setFormValues({
          name: skill.name ?? '',
          description: skill.description ?? '',
          skillCategoryId: skill.category?.categoryId ?? '',
          proficiencyLevelId: skill.proficiencyLevel?.levelId ?? '',
          isOffering: skill.isOffering,
        });
      } else {
        setFormValues({
          name: '',
          description: '',
          skillCategoryId: '',
          proficiencyLevelId: '',
          isOffering: true,
        });
      }
      setErrors({});
    }
  }, [open, skill, categories, proficiencyLevels]);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SkillRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    console.log('[SkillForm] Select change:', { name, value });

    setFormValues((prev) => {
      const newValues = { ...prev, [name]: value };
      console.log('[SkillForm] New form values:', newValues);
      return newValues;
    });

    if (errors[name as keyof SkillRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SkillRequest> = {};

    if (!formValues.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    // Backend requires description to be between 10-2000 characters
    if (!formValues.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    } else if (formValues.description.trim().length < 10) {
      newErrors.description =
        'Beschreibung muss mindestens 10 Zeichen lang sein';
    } else if (formValues.description.trim().length > 2000) {
      newErrors.description =
        'Beschreibung darf maximal 2000 Zeichen lang sein';
    }

    if (!formValues.skillCategoryId) {
      newErrors.skillCategoryId = 'Kategorie ist erforderlich';
    }
    if (!formValues.proficiencyLevelId) {
      newErrors.proficiencyLevelId = 'Fertigkeitsstufe ist erforderlich';
    }

    console.log('[SkillForm] Validation errors:', newErrors);
    console.log('[SkillForm] Current form values:', formValues);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SkillForm] handleSubmit -> formValues:', formValues);

    if (validateForm()) {
      onSubmit(
        {
          name: formValues.name.trim(),
          description: formValues.description.trim(),
          isOffering: formValues.isOffering,
          skillCategoryId: formValues.skillCategoryId,
          proficiencyLevelId: formValues.proficiencyLevelId,
        },
        skill?.skillId
      );
    }
  };

  const handleDialogClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Debug: Check if we have valid data
  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const hasProficiencyLevels =
    Array.isArray(proficiencyLevels) && proficiencyLevels.length > 0;

  console.log('[SkillForm] Render state:', {
    hasCategories,
    hasProficiencyLevels,
    categoriesLength: categories?.length || 0,
    proficiencyLevelsLength: proficiencyLevels?.length || 0,
    formValues,
  });

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="skill-form-dialog-title"
    >
      <DialogTitle id="skill-form-dialog-title">
        {title || (skill ? 'Skill bearbeiten' : 'Neuen Skill erstellen')}
        <IconButton
          aria-label="Schließen"
          onClick={handleDialogClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formValues.name}
              onChange={handleTextChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
              autoFocus
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Beschreibung"
              name="description"
              value={formValues.description}
              onChange={handleTextChange}
              error={!!errors.description}
              helperText={
                errors.description || 'Mindestens 10 Zeichen erforderlich'
              }
              multiline
              rows={4}
              disabled={loading}
              margin="normal"
              required
              inputProps={{
                maxLength: 2000,
              }}
            />

            <FormControl
              fullWidth
              error={!!errors.skillCategoryId}
              disabled={loading || !hasCategories}
              margin="normal"
              required
            >
              <InputLabel id="category-select-label">Kategorie</InputLabel>
              <Select
                labelId="category-select-label"
                name="skillCategoryId"
                value={formValues.skillCategoryId}
                onChange={handleSelectChange}
                label="Kategorie"
              >
                {hasCategories ? (
                  categories.map((category) => {
                    const categoryId = getCategoryId(category);
                    return (
                      <MenuItem key={categoryId} value={categoryId}>
                        {category.name}
                      </MenuItem>
                    );
                  })
                ) : (
                  <MenuItem disabled>Kategorien werden geladen...</MenuItem>
                )}
              </Select>
              {errors.skillCategoryId && (
                <FormHelperText>{errors.skillCategoryId}</FormHelperText>
              )}
              {!hasCategories && (
                <FormHelperText>Kategorien werden geladen...</FormHelperText>
              )}
            </FormControl>

            <FormControl
              fullWidth
              error={!!errors.proficiencyLevelId}
              disabled={loading || !hasProficiencyLevels}
              margin="normal"
              required
            >
              <InputLabel id="proficiency-select-label">
                Fertigkeitsstufe
              </InputLabel>
              <Select
                labelId="proficiency-select-label"
                name="proficiencyLevelId"
                value={formValues.proficiencyLevelId}
                onChange={handleSelectChange}
                label="Fertigkeitsstufe"
              >
                {hasProficiencyLevels ? (
                  [...proficiencyLevels]
                    .sort(
                      (a, b) =>
                        getProficiencyLevelRank(a) - getProficiencyLevelRank(b)
                    )
                    .map((level) => {
                      const levelId = getProficiencyLevelId(level);
                      const rank = getProficiencyLevelRank(level);
                      return (
                        <MenuItem key={levelId} value={levelId}>
                          {level.level} {rank > 0 && `(${'★'.repeat(rank)})`}
                        </MenuItem>
                      );
                    })
                ) : (
                  <MenuItem disabled>
                    Fertigkeitsstufen werden geladen...
                  </MenuItem>
                )}
              </Select>
              {errors.proficiencyLevelId && (
                <FormHelperText>{errors.proficiencyLevelId}</FormHelperText>
              )}
              {!hasProficiencyLevels && (
                <FormHelperText>
                  Fertigkeitsstufen werden geladen...
                </FormHelperText>
              )}
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formValues.isOffering}
                  onChange={handleSwitchChange}
                  name="isOffering"
                  color="primary"
                  disabled={loading}
                />
              }
              label={
                <Typography>
                  {formValues.isOffering ? 'Angeboten' : 'Gesucht'}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {formValues.isOffering
                      ? '(Ich biete diese Fähigkeit an)'
                      : '(Ich suche jemanden mit dieser Fähigkeit)'}
                  </Typography>
                </Typography>
              }
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !hasCategories || !hasProficiencyLevels}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading
              ? 'Wird gespeichert...'
              : skill
                ? 'Aktualisieren'
                : 'Erstellen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SkillForm;
