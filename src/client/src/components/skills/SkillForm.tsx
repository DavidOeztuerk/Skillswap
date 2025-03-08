// src/components/skills/SkillForm.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Grid,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '../ui/LoadingButton';
import { AddUserSkillRequest } from '../../types/contracts/requests/AddUserSkillRequest';
import { SkillCategory } from '../../types/models/Skill';
import { UserSkill } from '../../types/models/UserSkill';
import { PROFICIENCY_LEVELS } from '../../config/constants';

// Validierungsschema mit Zod
const skillFormSchema = z
  .object({
    skillId: z.string(),
    proficiencyLevel: z.enum([
      'Beginner',
      'Intermediate',
      'Advanced',
      'Expert',
    ] as const),
    isTeachable: z.boolean(),
    isLearnable: z.boolean(),
    description: z
      .string()
      .max(500, 'Die Beschreibung darf maximal 500 Zeichen haben')
      .optional(),
  })
  .refine((data) => data.isTeachable || data.isLearnable, {
    message: 'Skill muss entweder lehrbar oder lernbar sein',
    path: ['isTeachable'],
  });

type SkillFormValues = z.infer<typeof skillFormSchema>;

interface SkillFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddUserSkillRequest) => Promise<void>;
  skillId: string;
  skillName: string;
  skillCategory: SkillCategory;
  userSkill?: UserSkill;
  isLoading?: boolean;
}

/**
 * Formular zum Hinzufügen oder Bearbeiten eines Benutzerskills
 */
const SkillForm: React.FC<SkillFormProps> = ({
  open,
  onClose,
  onSubmit,
  skillId,
  skillName,
  skillCategory,
  userSkill,
  isLoading = false,
}) => {
  const isEditMode = !!userSkill;

  // Standard-Werte für das Formular
  const defaultValues: SkillFormValues = React.useMemo(() => ({
    skillId,
    proficiencyLevel: userSkill?.proficiencyLevel || 'Beginner',
    isTeachable: userSkill?.isTeachable || false,
    isLearnable: userSkill?.isLearnable || true,
    description: userSkill?.description || '',
  }), [skillId, userSkill]);

  // React Hook Form mit Zod-Resolver
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues,
  });

  // Formular zurücksetzen, wenn sich der Dialog öffnet oder schließt
  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const handleFormSubmit: SubmitHandler<SkillFormValues> = async (data) => {
    try {
      const requestData: AddUserSkillRequest = {
        ...data,
        proficiencyLevel: data.proficiencyLevel as AddUserSkillRequest['proficiencyLevel'],
      };
      await onSubmit(requestData);
      onClose();
    } catch (error) {
      console.error('Failed to save skill:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="skill-form-title"
    >
      <DialogTitle id="skill-form-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {isEditMode ? 'Skill bearbeiten' : 'Skill hinzufügen'}
          </Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Skill"
                value={skillName}
                fullWidth
                disabled
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Kategorie"
                value={skillCategory}
                fullWidth
                disabled
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="proficiencyLevel"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.proficiencyLevel}>
                    <InputLabel id="proficiency-level-label">
                      Kompetenzlevel
                    </InputLabel>
                    <Select
                      {...field}
                      labelId="proficiency-level-label"
                      label="Kompetenzlevel"
                      disabled={isLoading}
                    >
                      {PROFICIENCY_LEVELS.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level === 'Beginner' && 'Anfänger'}
                          {level === 'Intermediate' && 'Fortgeschritten'}
                          {level === 'Advanced' && 'Sehr erfahren'}
                          {level === 'Expert' && 'Experte'}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.proficiencyLevel && (
                      <FormHelperText>
                        {errors.proficiencyLevel.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Beschreibung deiner Erfahrung (optional)"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={isLoading}
                    placeholder="Beschreibe deine Erfahrung mit diesem Skill..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Wie möchtest du diesen Skill nutzen?
              </Typography>

              <Controller
                name="isTeachable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    }
                    label="Ich möchte diesen Skill anderen beibringen"
                  />
                )}
              />

              <Controller
                name="isLearnable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    }
                    label="Ich möchte mehr über diesen Skill lernen"
                  />
                )}
              />

              {errors.isTeachable && (
                <FormHelperText error>
                  {errors.isTeachable.message}
                </FormHelperText>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Abbrechen
          </Button>
          <LoadingButton
            type="submit"
            color="primary"
            variant="contained"
            loading={isLoading}
          >
            {isEditMode ? 'Speichern' : 'Hinzufügen'}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SkillForm;
