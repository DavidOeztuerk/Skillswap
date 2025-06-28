// src/pages/profile/ProfilePage.tsx
import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

import PageHeader from '../../components/layout/PageHeader';
import PageContainer from '../../components/layout/PageContainer';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingButton from '../../components/ui/LoadingButton';
import { useAuth } from '../../hooks/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Validierungsschema für Profilinformationen
const profileSchema = z.object({
  firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail ein'),
  bio: z
    .string()
    .max(500, 'Biografie darf maximal 500 Zeichen lang sein')
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Validierungsschema für Passwortänderung
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

/**
 * Seite zur Anzeige und Bearbeitung des Benutzerprofils
 */
const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // State
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Form
  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfileForm,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      // bio: user?.bio || '',
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

  // Toggle Edit Mode
  const toggleEditMode = () => {
    if (isEditMode) {
      // Cancel edits - reset form
      resetProfileForm({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        // bio: user?.bio || '',
      });
    }
    setIsEditMode(!isEditMode);
  };

  // Submit Profile Form
  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);

    try {
      const success = await updateProfile(data);

      if (success) {
        setStatusMessage({
          text: 'Profil erfolgreich aktualisiert',
          type: 'success',
        });
        setIsEditMode(false);
      } else {
        throw new Error('Fehler beim Aktualisieren des Profils');
      }
    } catch (error) {
      setStatusMessage({
        text: 'Fehler beim Ändern des Passworts' + ' ' + String(error),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Password Form
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsSubmitting(true);

    try {
      console.log(data);

      // Hier würde die tatsächliche Passwortänderung implementiert werden
      // Da wir das in dieser Demo nicht ausführen können, simulieren wir den Erfolg
      setTimeout(() => {
        setStatusMessage({
          text: 'Passwort erfolgreich geändert',
          type: 'success',
        });
        resetPasswordForm();
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      setStatusMessage({
        text: 'Fehler beim Ändern des Passworts' + ' ' + String(error),
        type: 'error',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Mein Profil"
        subtitle="Persönliche Informationen anzeigen und bearbeiten"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profil' },
        ]}
      />

      {statusMessage && (
        <AlertMessage
          severity={statusMessage.type}
          message={[statusMessage.text]}
          onClose={() => setStatusMessage(null)}
        />
      )}

      <Grid container columns={12} spacing={3}>
        {/* Profil-Informationen */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
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
                        variant="outlined"
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
                        variant="outlined"
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
                      <TextField
                        {...field}
                        label="E-Mail"
                        variant="outlined"
                        fullWidth
                        disabled // E-Mail sollte nicht änderbar sein
                        error={!!profileErrors.email}
                        helperText={profileErrors.email?.message}
                      />
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
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={4}
                        disabled={!isEditMode || isSubmitting}
                        error={!!profileErrors.bio}
                        helperText={profileErrors.bio?.message || ''}
                      />
                    )}
                  />
                </Grid>

                {isEditMode && (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                  >
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      color="primary"
                      loading={isSubmitting}
                      startIcon={<SaveIcon />}
                    >
                      Speichern
                    </LoadingButton>
                  </Grid>
                )}
              </Grid>
            </form>
          </Paper>

          {/* Passwort-Änderung */}
          <Paper sx={{ p: 3 }}>
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
                        variant="outlined"
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
                                  aria-label="Passwort-Sichtbarkeit umschalten"
                                  onClick={() =>
                                    setShowCurrentPassword(!showCurrentPassword)
                                  }
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
                        variant="outlined"
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
                                  aria-label="Passwort-Sichtbarkeit umschalten"
                                  onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                  }
                                  edge="end"
                                >
                                  {showNewPassword ? (
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
                    name="confirmPassword"
                    control={passwordControl}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Passwort bestätigen"
                        variant="outlined"
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
                                  aria-label="Passwort-Sichtbarkeit umschalten"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
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
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    loading={isSubmitting}
                  >
                    Passwort ändern
                  </LoadingButton>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Profil-Bild und Statistik */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* <Avatar
              src={user?.profilePicture || undefined}
              alt={user?.firstName || 'Benutzer'}
              sx={{ width: 120, height: 120, mb: 2 }}
            /> */}

            <Typography variant="h5" gutterBottom>
              {user?.firstName} {user?.lastName}
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email}
            </Typography>

            <Button variant="outlined" color="primary" sx={{ mt: 2 }}>
              Profilbild ändern
            </Button>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Konto-Informationen
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Benutzername
              </Typography>
              {/* <Typography variant="body2">{user?.username}</Typography> */}
            </Box>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Mitglied seit
              </Typography>
              {/* <Typography variant="body2">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : '-'}
              </Typography> */}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Statistik
            </Typography>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Skills
              </Typography>
              <Typography variant="body2">12</Typography>
            </Box>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Abgeschlossene Lektionen
              </Typography>
              <Typography variant="body2">25</Typography>
            </Box>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Gehaltene Lektionen
              </Typography>
              <Typography variant="body2">18</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ProfilePage;
