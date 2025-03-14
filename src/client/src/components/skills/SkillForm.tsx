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

  useEffect(() => {
    if (open) {
      if (skill) {
        setFormValues({
          name: skill.name ?? '',
          description: skill.description ?? '',
          skillCategoryId: skill.skillCategoryId ?? '',
          proficiencyLevelId: skill.proficiencyLevelId ?? '',
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
  }, [open, skill]);

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
    setFormValues((prev) => ({ ...prev, [name]: value }));

    // Logging die neue Kategorie-ID
    if (name === 'skillCategoryId') {
      console.log('[SkillForm] skillCategoryId changed to:', value);
    }

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
    if (!formValues.skillCategoryId) {
      newErrors.skillCategoryId = 'Kategorie ist erforderlich';
    }
    if (!formValues.proficiencyLevelId) {
      newErrors.proficiencyLevelId = 'Fertigkeitsstufe ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('[SkillForm] handleSubmit -> formValues:', formValues);
      onSubmit(
        {
          name: formValues.name.trim(),
          description: formValues.description.trim(),
          isOffering: formValues.isOffering,
          skillCategoryId: formValues.skillCategoryId,
          proficiencyLevelId: formValues.proficiencyLevelId,
        },
        skill?.id
      );
    }
  };

  const handleDialogClose = () => {
    if (!loading) {
      onClose();
    }
  };

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
              multiline
              rows={4}
              disabled={loading}
              margin="normal"
            />

            <FormControl
              fullWidth
              error={!!errors.skillCategoryId}
              disabled={loading}
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
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.skillCategoryId && (
                <FormHelperText>{errors.skillCategoryId}</FormHelperText>
              )}
            </FormControl>

            <FormControl
              fullWidth
              error={!!errors.proficiencyLevelId}
              disabled={loading}
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
                {[...proficiencyLevels]
                  .sort((a, b) => a.rank - b.rank)
                  .map((level) => (
                    <MenuItem key={level.id} value={level.id}>
                      {level.level} ({'★'.repeat(level.rank)})
                    </MenuItem>
                  ))}
              </Select>
              {errors.proficiencyLevelId && (
                <FormHelperText>{errors.proficiencyLevelId}</FormHelperText>
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
            disabled={loading}
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
