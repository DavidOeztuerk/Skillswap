// src/components/skills/SkillForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  FormControlLabel,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Skill,
  SkillCategory,
  ProficiencyLevel,
} from '../../types/models/Skill';
import { useSkills } from '../../hooks/useSkills';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';

interface SkillFormProps {
  initialData?: Skill;
  onSubmitSuccess?: (skill: Skill) => void;
  onCancel?: () => void;
}

const SkillForm: React.FC<SkillFormProps> = ({
  initialData,
  onSubmitSuccess,
  onCancel,
}) => {
  const theme = useTheme();
  const isEditMode = !!initialData;
  const {
    categories,
    proficiencyLevels,
    getCategories,
    getProficiencyLevels,
    addSkill,
    editSkill,
    status,
  } = useSkills();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load categories and proficiency levels if not already loaded
    if (categories.length === 0) {
      getCategories();
    }
    if (proficiencyLevels.length === 0) {
      getProficiencyLevels();
    }
  }, [
    categories.length,
    proficiencyLevels.length,
    getCategories,
    getProficiencyLevels,
  ]);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name ist erforderlich')
      .min(3, 'Name muss mindestens 3 Zeichen lang sein')
      .max(100, 'Name darf maximal 100 Zeichen lang sein'),
    description: Yup.string().max(
      1000,
      'Beschreibung darf maximal 1000 Zeichen lang sein'
    ),
    skillCategoryId: Yup.string().required('Kategorie ist erforderlich'),
    proficiencyLevelId: Yup.string().required(
      'Fertigkeitsstufe ist erforderlich'
    ),
    isOffering: Yup.boolean().required(
      'Bitte wähle aus, ob du diesen Skill anbietest oder suchst'
    ),
  });

  // Initialize form with Formik
  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      skillCategoryId: initialData?.skillCategoryId || '',
      proficiencyLevelId: initialData?.proficiencyLevelId || '',
      isOffering:
        initialData?.isOffering !== undefined ? initialData.isOffering : true,
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        let result;

        if (isEditMode && initialData) {
          // Update existing skill
          const updateData: UpdateSkillRequest = {
            name: values.name,
            description: values.description,
            skillCategoryId: values.skillCategoryId,
            proficiencyLevelId: values.proficiencyLevelId,
            isOffering: values.isOffering,
          };

          result = await editSkill(initialData.id, updateData);
        } else {
          // Create new skill
          const newSkillData: CreateSkillRequest = {
            name: values.name,
            description: values.description,
            skillCategoryId: values.skillCategoryId,
            proficiencyLevelId: values.proficiencyLevelId,
            isOffering: values.isOffering,
          };

          result = await addSkill(newSkillData);
        }

        if (result.success) {
          if (onSubmitSuccess) {
            if (result.data) {
              onSubmitSuccess(result.data);
            }
          }
        } else {
          if (result.data) {
            setErrorMessage(result.error || 'Ein Fehler ist aufgetreten');
          }
        }
      } catch (error) {
        console.error('Error submitting skill form:', error);
        setErrorMessage('Ein unerwarteter Fehler ist aufgetreten');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const isFormLoading =
    status.categories === 'loading' || status.proficiencyLevels === 'loading';

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {isEditMode ? 'Skill bearbeiten' : 'Neuen Skill erstellen'}
        </Typography>

        {isFormLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            noValidate
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              {/* Skill Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Skill Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  required
                />
              </Grid>

              {/* Skill Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Beschreibung"
                  multiline
                  rows={4}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.description &&
                    Boolean(formik.errors.description)
                  }
                  helperText={
                    formik.touched.description && formik.errors.description
                  }
                />
              </Grid>

              {/* Category Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={
                    formik.touched.skillCategoryId &&
                    Boolean(formik.errors.skillCategoryId)
                  }
                  required
                >
                  <InputLabel id="category-label">Kategorie</InputLabel>
                  <Select
                    labelId="category-label"
                    id="skillCategoryId"
                    name="skillCategoryId"
                    value={formik.values.skillCategoryId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Kategorie"
                  >
                    {categories.map((category: SkillCategory) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.skillCategoryId &&
                    formik.errors.skillCategoryId && (
                      <FormHelperText>
                        {formik.errors.skillCategoryId}
                      </FormHelperText>
                    )}
                </FormControl>
              </Grid>

              {/* Proficiency Level Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  error={
                    formik.touched.proficiencyLevelId &&
                    Boolean(formik.errors.proficiencyLevelId)
                  }
                  required
                >
                  <InputLabel id="proficiency-level-label">
                    Fertigkeitsstufe
                  </InputLabel>
                  <Select
                    labelId="proficiency-level-label"
                    id="proficiencyLevelId"
                    name="proficiencyLevelId"
                    value={formik.values.proficiencyLevelId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Fertigkeitsstufe"
                  >
                    {proficiencyLevels.map((level: ProficiencyLevel) => (
                      <MenuItem key={level.id} value={level.id}>
                        {level.level}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.proficiencyLevelId &&
                    formik.errors.proficiencyLevelId && (
                      <FormHelperText>
                        {formik.errors.proficiencyLevelId}
                      </FormHelperText>
                    )}
                </FormControl>
              </Grid>

              {/* IsOffering Switch */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: theme.palette.grey[50],
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Art des Skills
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.isOffering}
                        onChange={(e) =>
                          formik.setFieldValue('isOffering', e.target.checked)
                        }
                        name="isOffering"
                        color="primary"
                      />
                    }
                    label={
                      formik.values.isOffering
                        ? 'Ich biete diesen Skill an'
                        : 'Ich suche diesen Skill'
                    }
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {formik.values.isOffering
                      ? 'Wähle diese Option, wenn du anderen bei diesem Skill helfen möchtest.'
                      : 'Wähle diese Option, wenn du diesen Skill erlernen oder verbessern möchtest.'}
                  </Typography>

                  {formik.touched.isOffering && formik.errors.isOffering && (
                    <FormHelperText error>
                      {formik.errors.isOffering}
                    </FormHelperText>
                  )}
                </Box>
              </Grid>

              {/* Error Message */}
              {errorMessage && (
                <Grid item xs={12}>
                  <Typography color="error" variant="body2">
                    {errorMessage}
                  </Typography>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    mt: 2,
                  }}
                >
                  {onCancel && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Abbrechen
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting || !formik.isValid}
                    startIcon={
                      isSubmitting ? <CircularProgress size={20} /> : null
                    }
                  >
                    {isSubmitting
                      ? 'Wird gespeichert...'
                      : isEditMode
                        ? 'Skill aktualisieren'
                        : 'Skill erstellen'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillForm;
