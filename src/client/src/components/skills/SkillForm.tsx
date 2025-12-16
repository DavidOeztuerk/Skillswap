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
  type SelectChangeEvent,
} from '@mui/material';
import FormDialog from '../ui/FormDialog';
import type { Skill, SkillCategory, ProficiencyLevel } from '../../types/models/Skill';
import type { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import ErrorAlert from '../error/ErrorAlert';

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
  const getCategoryId = (category: SkillCategory): string => category.id;

  const getProficiencyLevelId = (level: ProficiencyLevel): string => level.id;

  const getProficiencyLevelRank = (level: ProficiencyLevel): number => level.rank;

  const [formValues, setFormValues] = useState<CreateSkillRequest>({
    name: '',
    description: '',
    categoryId: '',
    proficiencyLevelId: '',
    isOffered: true,
  });

  const [errors, setErrors] = useState<Partial<CreateSkillRequest>>({});

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (skill) {
          setFormValues({
            name: skill.name,
            description: skill.description,
            categoryId: skill.category.id,
            proficiencyLevelId: skill.proficiencyLevel.id,
            isOffered: skill.isOffered,
          });
        } else {
          setFormValues({
            name: '',
            description: '',
            categoryId: '',
            proficiencyLevelId: '',
            isOffered: true,
          });
        }
        setErrors({});
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [open, skill]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    const errorKey = name as keyof CreateSkillRequest;
    if (errors[errorKey] !== undefined) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent): void => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    const errorKey = name as keyof CreateSkillRequest;
    if (errors[errorKey] !== undefined) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateSkillRequest> = {};

    if (!formValues.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formValues.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    } else if (formValues.description.trim().length < 10) {
      newErrors.description = 'Beschreibung muss mindestens 10 Zeichen lang sein';
    } else if (formValues.description.trim().length > 2000) {
      newErrors.description = 'Beschreibung darf maximal 2000 Zeichen lang sein';
    }

    if (formValues.categoryId.length === 0) {
      newErrors.categoryId = 'Kategorie ist erforderlich';
    }
    if (formValues.proficiencyLevelId.length === 0) {
      newErrors.proficiencyLevelId = 'Fertigkeitsstufe ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(
        {
          name: formValues.name.trim(),
          description: formValues.description.trim(),
          isOffered: formValues.isOffered,
          categoryId: formValues.categoryId,
          proficiencyLevelId: formValues.proficiencyLevelId,
        },
        skill?.id
      );
    }
  };

  const handleDialogClose = (): void => {
    if (!loading) {
      onClose();
    }
  };

  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const hasProficiencyLevels = Array.isArray(proficiencyLevels) && proficiencyLevels.length > 0;

  return (
    <FormDialog
      open={open}
      onClose={handleDialogClose}
      title={title ?? (skill !== undefined ? 'Skill bearbeiten' : 'Neuen Skill erstellen')}
      maxWidth="sm"
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
            {loading ? 'Wird gespeichert...' : skill !== undefined ? 'Aktualisieren' : 'Erstellen'}
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

          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formValues.name}
            onChange={handleTextChange}
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
            onChange={handleTextChange}
            error={!!errors.description}
            helperText={errors.description ?? 'Mindestens 10 Zeichen erforderlich'}
            multiline
            rows={4}
            disabled={loading}
            margin="normal"
            required
            slotProps={{
              htmlInput: {
                maxLength: 2000,
              },
            }}
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
            {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
            {!hasCategories && <FormHelperText>Kategorien werden geladen...</FormHelperText>}
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
              onChange={handleSelectChange}
              label="Fertigkeitsstufe"
            >
              {hasProficiencyLevels ? (
                [...proficiencyLevels]
                  .sort((a, b) => getProficiencyLevelRank(a) - getProficiencyLevelRank(b))
                  .map((level) => {
                    const levelId = getProficiencyLevelId(level);
                    const rank = getProficiencyLevelRank(level);
                    return (
                      <MenuItem key={levelId} value={levelId}>
                        {level.level} {rank > 0 ? `(${'★'.repeat(rank)})` : ''}
                      </MenuItem>
                    );
                  })
              ) : (
                <MenuItem disabled>Fertigkeitsstufen werden geladen...</MenuItem>
              )}
            </Select>
            {errors.proficiencyLevelId && (
              <FormHelperText>{errors.proficiencyLevelId}</FormHelperText>
            )}
            {!hasProficiencyLevels && (
              <FormHelperText>Fertigkeitsstufen werden geladen...</FormHelperText>
            )}
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
        </Box>
      </form>
    </FormDialog>
  );
};

export default SkillForm;
