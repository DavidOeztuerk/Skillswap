import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  FormHelperText,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import LoadingButton from '../ui/LoadingButton';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { toast } from 'react-toastify';
import skillService from '../../api/services/skillsService';

interface QuickSkillCreateProps {
  open: boolean;
  onClose: () => void;
  onSkillCreated: (skillId: string, skillName: string) => void;
  categories: Array<{ categoryId: string; name: string }>;
  proficiencyLevels: Array<{ levelId: string; level: string }>;
}

const QuickSkillCreate: React.FC<QuickSkillCreateProps> = ({
  open,
  onClose,
  onSkillCreated,
  categories,
  proficiencyLevels,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateSkillRequest>>({
    name: '',
    description: '',
    categoryId: '',
    proficiencyLevelId: '',
    isOffered: true, // Standard: Skill wird angeboten
    tags: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategorie ist erforderlich';
    }
    if (!formData.proficiencyLevelId) {
      newErrors.proficiencyLevelId = 'Kenntnisstand ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await skillService.createSkill(formData as CreateSkillRequest);
      
      if (response.success && response.data) {
        toast.success('Skill erfolgreich erstellt');
        onSkillCreated(response.data.skillId, response.data.name);
        handleClose();
      } else {
        toast.error(response.message || 'Fehler beim Erstellen des Skills');
      }
    } catch (error: any) {
      console.error('Error creating skill:', error);
      toast.error('Fehler beim Erstellen des Skills');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        proficiencyLevelId: '',
        isOffered: true,
        tags: [],
      });
      setErrors({});
      onClose();
    }
  };

  const handleChange = (field: keyof CreateSkillRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Neuen Skill erstellen</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            Erstelle schnell einen neuen Skill, den du im Tausch anbieten möchtest.
          </Alert>

          <TextField
            label="Skill-Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            disabled={loading}
            placeholder="z.B. JavaScript Programmierung"
          />

          <TextField
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            multiline
            rows={3}
            fullWidth
            required
            disabled={loading}
            placeholder="Beschreibe kurz, was du anbieten kannst..."
          />

          <FormControl fullWidth required error={!!errors.categoryId}>
            <InputLabel>Kategorie</InputLabel>
            <Select
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              label="Kategorie"
              disabled={loading}
            >
              <MenuItem value="">
                <em>Kategorie wählen</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            {errors.categoryId && (
              <FormHelperText>{errors.categoryId}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth required error={!!errors.proficiencyLevelId}>
            <InputLabel>Dein Kenntnisstand</InputLabel>
            <Select
              value={formData.proficiencyLevelId}
              onChange={(e) => handleChange('proficiencyLevelId', e.target.value)}
              label="Dein Kenntnisstand"
              disabled={loading}
            >
              <MenuItem value="">
                <em>Kenntnisstand wählen</em>
              </MenuItem>
              {proficiencyLevels.map((level) => (
                <MenuItem key={level.levelId} value={level.levelId}>
                  {level.level}
                </MenuItem>
              ))}
            </Select>
            {errors.proficiencyLevelId && (
              <FormHelperText>{errors.proficiencyLevelId}</FormHelperText>
            )}
          </FormControl>

          <TextField
            label="Tags (optional)"
            value={formData.tags?.join(', ')}
            onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
            helperText="Komma-getrennte Tags, z.B. Frontend, React, TypeScript"
            fullWidth
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Abbrechen
        </Button>
        <LoadingButton
          onClick={handleSubmit}
          loading={loading}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Skill erstellen
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default QuickSkillCreate;