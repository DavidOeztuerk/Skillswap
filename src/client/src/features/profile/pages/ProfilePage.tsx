import React, { useState, useEffect, useCallback, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format as formatDate } from 'date-fns';
import { de } from 'date-fns/locale';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { apiClient } from '../../../core/api/apiClient';
import PageContainer from '../../../shared/components/layout/PageContainer';
import PageHeader from '../../../shared/components/layout/PageHeader';
import AlertMessage from '../../../shared/components/ui/AlertMessage';
import LoadingButton from '../../../shared/components/ui/LoadingButton';
import ProfileAvatar from '../../../shared/components/ui/ProfileAvatar';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import useAuth from '../../auth/hooks/useAuth';
import type { UserExperienceResponse, UserEducationResponse } from '../types';
import SocialConnectionsTab from '../components/SocialConnectionsTab';

// ============================================================================
// Schemas
// ============================================================================

const profileSchema = z.object({
  firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  email: z.email({ message: 'Bitte geben Sie eine gültige E-Mail ein' }),
  bio: z.string().max(500, 'Biografie darf maximal 500 Zeichen lang sein').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Aktuelles Passwort wird benötigt'),
    newPassword: z
      .string()
      .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Passwort muss mind. einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
      ),
    confirmPassword: z.string().min(1, 'Passwort-Bestätigung wird benötigt'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const experienceSchema = z.object({
  title: z.string().min(2, 'Titel muss mindestens 2 Zeichen lang sein'),
  company: z.string().min(2, 'Unternehmen muss mindestens 2 Zeichen lang sein'),
  startDate: z.string().min(1, 'Startdatum wird benötigt'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein').optional(),
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

const educationSchema = z.object({
  degree: z.string().min(2, 'Abschluss muss mindestens 2 Zeichen lang sein'),
  institution: z.string().min(2, 'Institution muss mindestens 2 Zeichen lang sein'),
  graduationDate: z.string().optional(), // Format: YYYY-MM-DD for month+year picker
  description: z.string().max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein').optional(),
});

type EducationFormValues = z.infer<typeof educationSchema>;

// ============================================================================
// Tab Panel Component
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// ============================================================================
// Experience/Education Dialog
// ============================================================================

interface ExperienceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExperienceFormValues) => void;
  initialData?: UserExperienceResponse;
  isLoading: boolean;
}

const ExperienceDialog: React.FC<ExperienceDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isLoading,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      company: initialData?.company ?? '',
      startDate: initialData?.startDate.split('T')[0] ?? '',
      endDate: initialData?.endDate?.split('T')[0] ?? '',
      isCurrent: initialData?.isCurrent ?? !initialData?.endDate,
      description: initialData?.description ?? '',
    },
  });

  const isCurrent = useWatch({ control, name: 'isCurrent' });

  useEffect(() => {
    if (open) {
      const isCurrentValue = initialData?.isCurrent ?? !initialData?.endDate;
      reset({
        title: initialData?.title ?? '',
        company: initialData?.company ?? '',
        startDate: initialData?.startDate.split('T')[0] ?? '',
        endDate: initialData?.endDate?.split('T')[0] ?? '',
        isCurrent: isCurrentValue,
        description: initialData?.description ?? '',
      });
    }
  }, [open, initialData, reset]);

  // Clear endDate when isCurrent is checked
  useEffect(() => {
    if (isCurrent) {
      setValue('endDate', '');
    }
  }, [isCurrent, setValue]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{initialData ? 'Erfahrung bearbeiten' : 'Neue Erfahrung'}</DialogTitle>
        <form onSubmit={handleSubmit(onSave)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Position/Titel"
                      fullWidth
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Unternehmen"
                      fullWidth
                      error={!!errors.company}
                      helperText={errors.company?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Startdatum"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        // Use date-fns format to avoid timezone issues
                        field.onChange(date ? formatDate(date, 'yyyy-MM-dd') : '');
                      }}
                      maxDate={new Date()}
                      views={['year', 'month']}
                      openTo="month"
                      format="MM.yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startDate,
                          helperText: errors.startDate?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Enddatum"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        // Use date-fns format to avoid timezone issues
                        field.onChange(date ? formatDate(date, 'yyyy-MM-dd') : '');
                      }}
                      disabled={isCurrent}
                      maxDate={new Date()}
                      views={['year', 'month']}
                      openTo="month"
                      format="MM.yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: isCurrent ? 'Aktuell' : 'MM.JJJJ',
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="isCurrent"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value ?? false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Ich arbeite hier aktuell"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Beschreibung"
                      multiline
                      rows={3}
                      fullWidth
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Abbrechen</Button>
            <LoadingButton type="submit" variant="contained" loading={isLoading}>
              Speichern
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

interface EducationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EducationFormValues) => void;
  initialData?: UserEducationResponse;
  isLoading: boolean;
}

const EducationDialog: React.FC<EducationDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isLoading,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: initialData?.degree ?? '',
      institution: initialData?.institution ?? '',
      // Build date from year+month: e.g., 2024-06-01 for June 2024
      graduationDate:
        initialData?.graduationYear == null
          ? ''
          : `${initialData.graduationYear}-${String(initialData.graduationMonth ?? 1).padStart(2, '0')}-01`,
      description: initialData?.description ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        degree: initialData?.degree ?? '',
        institution: initialData?.institution ?? '',
        graduationDate:
          initialData?.graduationYear == null
            ? ''
            : `${initialData.graduationYear}-${String(initialData.graduationMonth ?? 1).padStart(2, '0')}-01`,
        description: initialData?.description ?? '',
      });
    }
  }, [open, initialData, reset]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{initialData ? 'Ausbildung bearbeiten' : 'Neue Ausbildung'}</DialogTitle>
        <form onSubmit={handleSubmit(onSave)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="degree"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Abschluss"
                      fullWidth
                      error={!!errors.degree}
                      helperText={errors.degree?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="institution"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Institution"
                      fullWidth
                      error={!!errors.institution}
                      helperText={errors.institution?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="graduationDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Abschlussdatum"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        // Use date-fns format to avoid timezone issues
                        field.onChange(date ? formatDate(date, 'yyyy-MM-dd') : '');
                      }}
                      maxDate={new Date()}
                      views={['year', 'month']}
                      openTo="month"
                      format="MM.yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: 'MM.JJJJ',
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Beschreibung"
                      multiline
                      rows={3}
                      fullWidth
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Abbrechen</Button>
            <LoadingButton type="submit" variant="contained" loading={isLoading}>
              Speichern
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const spaceBetween = 'space-between';

const ProfilePage: React.FC = () => {
  const {
    user,
    userAvatarUrl,
    isLoading: isAuthLoading,
    updateProfile,
    changePassword,
    // uploadProfilePicture,
    deleteProfilePicture,
  } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState(0);

  // Form States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Experience & Education States
  const [experiences, setExperiences] = useState<UserExperienceResponse[]>([]);
  const [education, setEducation] = useState<UserEducationResponse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Dialog States
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<UserExperienceResponse | undefined>();
  const [editingEducation, setEditingEducation] = useState<UserEducationResponse | undefined>();
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  // Avatar ref for file input
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile Form
  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfileForm,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? '',
    },
  });

  // Password Form
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Load Experience & Education
  const loadExperienceEducation = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [expResponse, eduResponse] = await Promise.all([
        apiClient.get<UserExperienceResponse[]>('/api/users/profile/me/experience'),
        apiClient.get<UserEducationResponse[]>('/api/users/profile/me/education'),
      ]);

      if (isSuccessResponse(expResponse)) {
        setExperiences(expResponse.data);
      }
      if (isSuccessResponse(eduResponse)) {
        setEducation(eduResponse.data);
      }
    } catch (error) {
      console.error('Error loading experience/education:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      void loadExperienceEducation();
    }
  }, [activeTab, loadExperienceEducation]);

  // Handle avatar upload - uses useAuth hook
  // TODO: Aktivieren wenn Firebase Storage implementiert ist
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    console.debug(event);
    // const file = event.target.files?.[0];
    // if (!file) return;

    // // Validate file type
    // if (!file.type.startsWith('image/')) {
    //   setStatusMessage({ text: 'Nur Bilddateien sind erlaubt', type: 'error' });
    //   return;
    // }

    // // Validate file size (5MB max)
    // if (file.size > 5 * 1024 * 1024) {
    //   setStatusMessage({ text: 'Datei ist zu groß (max. 5MB)', type: 'error' });
    //   return;
    // }

    // // Use Redux thunk for upload
    // uploadProfilePicture(file);
    // setStatusMessage({ text: 'Profilbild wird hochgeladen...', type: 'info' });

    // // Reset input so same file can be selected again
    // if (avatarInputRef.current) {
    //   avatarInputRef.current.value = '';
    // }
  };

  // Handle avatar delete - uses useAuth hook
  // TODO: Aktivieren wenn Firebase Storage implementiert ist
  const handleAvatarDelete = (): void => {
    deleteProfilePicture();
    setStatusMessage({ text: 'Profilbild wird gelöscht...', type: 'info' });
  };

  // Toggle Edit Mode
  const toggleEditMode = (): void => {
    if (isEditMode) {
      resetProfileForm({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        bio: user?.bio ?? '',
      });
    }
    setIsEditMode(!isEditMode);
  };

  // Submit Profile Form
  const onProfileSubmit = (data: ProfileFormValues): void => {
    setIsSubmitting(true);
    try {
      // email ist im Backend nicht erlaubt - nur erlaubte Felder senden
      const { email: _email, ...updateData } = data;
      updateProfile(updateData);
      setStatusMessage({ text: 'Profil erfolgreich aktualisiert', type: 'success' });
      setIsEditMode(false);
    } catch (error) {
      setStatusMessage({ text: `Fehler: ${String(error)}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Password Form
  const onPasswordSubmit = (data: PasswordFormValues): void => {
    setIsSubmitting(true);
    try {
      if (!user?.id) throw new Error('Benutzer nicht authentifiziert');
      changePassword({
        userId: user.id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setStatusMessage({ text: 'Passwort erfolgreich geändert', type: 'success' });
      resetPasswordForm();
    } catch (error) {
      setStatusMessage({ text: `Fehler: ${String(error)}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Experience CRUD
  const handleSaveExperience = async (data: ExperienceFormValues): Promise<void> => {
    setIsDialogLoading(true);
    try {
      // Wenn isCurrent aktiviert ist, setze endDate auf null
      const endDate = data.isCurrent
        ? null
        : data.endDate
          ? new Date(data.endDate).toISOString()
          : null;

      const payload = {
        title: data.title,
        company: data.company,
        startDate: new Date(data.startDate).toISOString(),
        endDate,
        description: data.description ?? null,
        isCurrent: data.isCurrent ?? false,
        sortOrder: 0,
      };

      if (editingExperience) {
        await apiClient.put(`/api/users/profile/me/experience/${editingExperience.id}`, payload);
      } else {
        await apiClient.post('/api/users/profile/me/experience', payload);
      }

      setExperienceDialogOpen(false);
      setEditingExperience(undefined);
      await loadExperienceEducation();
      setStatusMessage({ text: 'Erfahrung gespeichert', type: 'success' });
    } catch (error) {
      setStatusMessage({ text: `Fehler: ${String(error)}`, type: 'error' });
    } finally {
      setIsDialogLoading(false);
    }
  };

  const handleDeleteExperience = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/users/profile/me/experience/${id}`);
      await loadExperienceEducation();
      setStatusMessage({ text: 'Erfahrung gelöscht', type: 'success' });
    } catch (error) {
      setStatusMessage({ text: `Fehler: ${String(error)}`, type: 'error' });
    }
  };

  // Education CRUD
  const handleSaveEducation = async (data: EducationFormValues): Promise<void> => {
    setIsDialogLoading(true);
    try {
      // Extract year and month from graduation date (format: YYYY-MM-DD)
      let graduationYear: number | null = null;
      let graduationMonth: number | null = null;
      if (data.graduationDate) {
        const gradDate = new Date(data.graduationDate);
        graduationYear = gradDate.getFullYear();
        graduationMonth = gradDate.getMonth() + 1; // getMonth() is 0-indexed
      }

      const payload = {
        degree: data.degree,
        institution: data.institution,
        graduationYear,
        graduationMonth,
        description: data.description ?? null,
        sortOrder: 0,
      };

      if (editingEducation) {
        await apiClient.put(`/api/users/profile/me/education/${editingEducation.id}`, payload);
      } else {
        await apiClient.post('/api/users/profile/me/education', payload);
      }

      setEducationDialogOpen(false);
      setEditingEducation(undefined);
      await loadExperienceEducation();
      setStatusMessage({ text: 'Ausbildung gespeichert', type: 'success' });
    } catch (error) {
      setStatusMessage({ text: `Fehler: ${String(error)}`, type: 'error' });
    } finally {
      setIsDialogLoading(false);
    }
  };

  const handleDeleteEducation = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/users/profile/me/education/${id}`);
      await loadExperienceEducation();
      setStatusMessage({ text: 'Ausbildung gelöscht', type: 'success' });
    } catch (error) {
      setStatusMessage({ text: `Fehler: ${String(error)}`, type: 'error' });
    }
  };

  // Format date for display (MM.YYYY format)
  const formatDateRange = (startDate: string, endDate?: string, isCurrent?: boolean): string => {
    const start = new Date(startDate);
    const startMonth = String(start.getMonth() + 1).padStart(2, '0');
    const startYear = start.getFullYear();
    const startStr = `${startMonth}.${startYear}`;

    if (isCurrent || !endDate) return `${startStr} - heute`;

    const end = new Date(endDate);
    const endMonth = String(end.getMonth() + 1).padStart(2, '0');
    const endYear = end.getFullYear();
    return `${startStr} - ${endMonth}.${endYear}`;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Mein Profil"
        subtitle="Persönliche Informationen und Qualifikationen verwalten"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profil' }]}
      />

      {statusMessage ? (
        <AlertMessage
          severity={statusMessage.type}
          message={[statusMessage.text]}
          onClose={() => setStatusMessage(null)}
        />
      ) : null}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue: number) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<PersonIcon />} label="Persönliche Daten" iconPosition="start" />
          <Tab icon={<WorkIcon />} label="Erfahrung & Ausbildung" iconPosition="start" />
          <Tab icon={<LinkedInIcon />} label="LinkedIn & Xing" iconPosition="start" />
        </Tabs>

        {/* Tab 0: Persönliche Daten */}
        <TabPanel value={activeTab} index={0}>
          <Grid container columns={12} spacing={3} sx={{ p: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, mb: 3 }} elevation={0}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: spaceBetween,
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" component="h2">
                    Persönliche Informationen
                  </Typography>
                  <Button
                    startIcon={isEditMode ? <CancelIcon /> : <EditIcon />}
                    onClick={toggleEditMode}
                    color={isEditMode ? 'inherit' : 'primary'}
                  >
                    {isEditMode ? 'Abbrechen' : 'Bearbeiten'}
                  </Button>
                </Box>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                  <Grid container columns={12} spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="firstName"
                        control={profileControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Vorname"
                            fullWidth
                            disabled={!isEditMode || isSubmitting}
                            error={!!profileErrors.firstName}
                            helperText={profileErrors.firstName?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="lastName"
                        control={profileControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Nachname"
                            fullWidth
                            disabled={!isEditMode || isSubmitting}
                            error={!!profileErrors.lastName}
                            helperText={profileErrors.lastName?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="email"
                        control={profileControl}
                        render={({ field }) => (
                          <TextField {...field} label="E-Mail" fullWidth disabled />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="bio"
                        control={profileControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Über mich"
                            fullWidth
                            multiline
                            rows={4}
                            disabled={!isEditMode || isSubmitting}
                            error={!!profileErrors.bio}
                            helperText={profileErrors.bio?.message}
                          />
                        )}
                      />
                    </Grid>
                    {isEditMode ? (
                      <Grid
                        size={{ xs: 12 }}
                        sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                      >
                        <LoadingButton
                          type="submit"
                          variant="contained"
                          loading={isSubmitting}
                          startIcon={<SaveIcon />}
                        >
                          Speichern
                        </LoadingButton>
                      </Grid>
                    ) : null}
                  </Grid>
                </form>
              </Paper>

              {/* Password Change */}
              <Paper sx={{ p: 3 }} elevation={0}>
                <Typography variant="h5" component="h2" mb={3}>
                  Passwort ändern
                </Typography>
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                  <Grid container columns={12} spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="currentPassword"
                        control={passwordControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Aktuelles Passwort"
                            fullWidth
                            type={showCurrentPassword ? 'text' : 'password'}
                            disabled={isSubmitting}
                            error={!!passwordErrors.currentPassword}
                            helperText={passwordErrors.currentPassword?.message}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      edge="end"
                                    >
                                      {showCurrentPassword ? (
                                        <VisibilityOffIcon />
                                      ) : (
                                        <VisibilityIcon />
                                      )}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="newPassword"
                        control={passwordControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Neues Passwort"
                            fullWidth
                            type={showNewPassword ? 'text' : 'password'}
                            disabled={isSubmitting}
                            error={!!passwordErrors.newPassword}
                            helperText={passwordErrors.newPassword?.message}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      edge="end"
                                    >
                                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="confirmPassword"
                        control={passwordControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Passwort bestätigen"
                            fullWidth
                            type={showConfirmPassword ? 'text' : 'password'}
                            disabled={isSubmitting}
                            error={!!passwordErrors.confirmPassword}
                            helperText={passwordErrors.confirmPassword?.message}
                            slotProps={{
                              input: {
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      edge="end"
                                    >
                                      {showConfirmPassword ? (
                                        <VisibilityOffIcon />
                                      ) : (
                                        <VisibilityIcon />
                                      )}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid
                      size={{ xs: 12 }}
                      sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                    >
                      <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                        Passwort ändern
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>

            {/* Sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, textAlign: 'center' }} elevation={0}>
                {/* Avatar - Upload deaktiviert bis Firebase Storage implementiert ist */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <ProfileAvatar
                    src={userAvatarUrl}
                    alt={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
                    size={120}
                  />
                </Box>

                <Typography variant="h5" gutterBottom>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>

                <>
                  {/* Hidden file input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />

                  {/* Upload / Delete buttons */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <LoadingButton
                      variant="outlined"
                      size="small"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => avatarInputRef.current?.click()}
                      loading={isAuthLoading}
                    >
                      {userAvatarUrl ? 'Ändern' : 'Hochladen'}
                    </LoadingButton>
                    {userAvatarUrl ? (
                      <LoadingButton
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleAvatarDelete}
                        loading={isAuthLoading}
                      >
                        Löschen
                      </LoadingButton>
                    ) : null}
                  </Box>
                </>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Erfahrung & Ausbildung */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            {isLoadingData ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container columns={12} spacing={3}>
                {/* Berufserfahrung */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3 }} elevation={0}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: spaceBetween,
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon color="primary" />
                        <Typography variant="h6">Berufserfahrung</Typography>
                      </Box>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setEditingExperience(undefined);
                          setExperienceDialogOpen(true);
                        }}
                      >
                        Hinzufügen
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {experiences.length === 0 ? (
                      <Typography color="text.secondary" textAlign="center" py={2}>
                        Keine Berufserfahrung eingetragen
                      </Typography>
                    ) : (
                      <List>
                        {experiences.map((exp) => (
                          <ListItem
                            key={exp.id}
                            sx={{ px: 0, cursor: 'pointer' }}
                            onClick={() => {
                              setEditingExperience(exp);
                              setExperienceDialogOpen(true);
                            }}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeleteExperience(exp.id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={exp.title}
                              secondary={
                                <>
                                  {exp.company}
                                  <br />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>
                </Grid>

                {/* Ausbildung */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3 }} elevation={0}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: spaceBetween,
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon color="secondary" />
                        <Typography variant="h6">Ausbildung</Typography>
                      </Box>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setEditingEducation(undefined);
                          setEducationDialogOpen(true);
                        }}
                      >
                        Hinzufügen
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {education.length === 0 ? (
                      <Typography color="text.secondary" textAlign="center" py={2}>
                        Keine Ausbildung eingetragen
                      </Typography>
                    ) : (
                      <List>
                        {education.map((edu) => (
                          <ListItem
                            key={edu.id}
                            sx={{ px: 0, cursor: 'pointer' }}
                            onClick={() => {
                              setEditingEducation(edu);
                              setEducationDialogOpen(true);
                            }}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeleteEducation(edu.id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={edu.degree}
                              secondary={
                                <>
                                  {edu.institution}
                                  {edu.graduationYear == null ? null : (
                                    <>
                                      <br />
                                      <Typography variant="caption" color="text.secondary">
                                        Abschluss:{' '}
                                        {edu.graduationMonth == null
                                          ? edu.graduationYear
                                          : `${String(edu.graduationMonth).padStart(2, '0')}.${edu.graduationYear}`}
                                      </Typography>
                                    </>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Tab 2: LinkedIn & Xing */}
        <TabPanel value={activeTab} index={2}>
          <SocialConnectionsTab />
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <ExperienceDialog
        open={experienceDialogOpen}
        onClose={() => {
          setExperienceDialogOpen(false);
          setEditingExperience(undefined);
        }}
        onSave={(data) => {
          handleSaveExperience(data).catch(console.error);
        }}
        initialData={editingExperience}
        isLoading={isDialogLoading}
      />

      <EducationDialog
        open={educationDialogOpen}
        onClose={() => {
          setEducationDialogOpen(false);
          setEditingEducation(undefined);
        }}
        onSave={(data) => {
          handleSaveEducation(data).catch(console.error);
        }}
        initialData={editingEducation}
        isLoading={isDialogLoading}
      />
    </PageContainer>
  );
};

export default ProfilePage;
