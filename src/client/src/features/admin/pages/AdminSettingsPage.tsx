import React, { useMemo, useCallback, memo, useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Stack,
  Divider,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { Permissions } from '../../auth/components/permissions.constants';
import { adminService } from '../services/adminService';
import type { AdminSettings } from '../types/Admin';

const AdminSettingsPage: React.FC = memo(() => {
  const { hasPermission } = usePermissions();

  // Permission checks
  const canManageSettings = useMemo(
    () => hasPermission(Permissions.System.MANAGE_SETTINGS),
    [hasPermission]
  );

  // Default settings (used as fallback)
  const defaultSettings = useMemo(
    () => ({
      // General Settings
      siteName: 'Skillswap',
      siteDescription: 'Plattform für den Austausch von Fähigkeiten',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      // Security Settings
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireStrongPassword: true,
      enable2FA: true,
      // Email Settings
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@skillswap.com',
      smtpFromName: 'Skillswap Team',
      // Notification Settings
      enableEmailNotifications: true,
      enablePushNotifications: true,
      enableSmsNotifications: false,
      notificationBatchSize: 100,
      // Match Settings
      maxActiveMatches: 10,
      matchExpiryDays: 30,
      autoMatchEnabled: true,
      minCompatibilityScore: 60,
      // Appointment Settings
      maxAppointmentsPerUser: 20,
      appointmentReminderHours: 24,
      allowCancellation: true,
      cancellationDeadlineHours: 2,
    }),
    []
  );

  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await adminService.getSettings();
        if (isSuccessResponse(response)) {
          setSettings((prev) => ({ ...prev, ...response.data }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Einstellungen konnten nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings().catch(() => {});
  }, []);

  const handleChange = useCallback(
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!canManageSettings) return; // Prevent changes without permission
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      setSettings((prev) => ({ ...prev, [field]: value }));
    },
    [canManageSettings]
  );

  // FIXED: Save settings to backend
  const handleSave = useCallback(async () => {
    if (!canManageSettings) return;

    try {
      setIsSaving(true);
      setError(null);
      const response = await adminService.updateSettings(settings as Partial<AdminSettings>);

      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setError(response.message ?? 'Speichern fehlgeschlagen');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Einstellungen konnten nicht gespeichert werden');
    } finally {
      setIsSaving(false);
    }
  }, [canManageSettings, settings]);

  // Read-only mode indicator
  const isReadOnly = !canManageSettings;

  // Show loading spinner while fetching settings
  if (isLoading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4">Systemeinstellungen</Typography>
          {isReadOnly ? (
            <Chip icon={<LockIcon />} label="Nur Lesezugriff" color="warning" size="small" />
          ) : null}
        </Stack>
        {canManageSettings ? (
          <Button
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setError(null);
          }}
        >
          {error}
        </Alert>
      ) : null}

      {saveSuccess ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Einstellungen erfolgreich gespeichert!
        </Alert>
      ) : null}

      {isReadOnly ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Sie haben nur Lesezugriff auf diese Einstellungen. Zum Bearbeiten benötigen Sie die
          Berechtigung &quot;system:manage_settings&quot;.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">Allgemeine Einstellungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="Seitenname"
                  value={settings.siteName}
                  onChange={handleChange('siteName')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="Seitenbeschreibung"
                  value={settings.siteDescription}
                  onChange={handleChange('siteDescription')}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={isReadOnly}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleChange('maintenanceMode')}
                      disabled={isReadOnly}
                    />
                  }
                  label="Wartungsmodus"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRegistration}
                      onChange={handleChange('allowRegistration')}
                      disabled={isReadOnly}
                    />
                  }
                  label="Registrierung erlauben"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireEmailVerification}
                      onChange={handleChange('requireEmailVerification')}
                      disabled={isReadOnly}
                    />
                  }
                  label="E-Mail-Verifizierung erforderlich"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <SecurityIcon color="error" />
                <Typography variant="h6">Sicherheitseinstellungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="Max. Login-Versuche"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={handleChange('maxLoginAttempts')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="Session-Timeout (Minuten)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={handleChange('sessionTimeout')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="Minimale Passwortlänge"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={handleChange('passwordMinLength')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireStrongPassword}
                      onChange={handleChange('requireStrongPassword')}
                      disabled={isReadOnly}
                    />
                  }
                  label="Starkes Passwort erforderlich"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable2FA}
                      onChange={handleChange('enable2FA')}
                      disabled={isReadOnly}
                    />
                  }
                  label="2-Faktor-Authentifizierung aktivieren"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Email Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <EmailIcon color="info" />
                <Typography variant="h6">E-Mail-Einstellungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="SMTP Host"
                  value={settings.smtpHost}
                  onChange={handleChange('smtpHost')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="SMTP Port"
                  type="number"
                  value={settings.smtpPort}
                  onChange={handleChange('smtpPort')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="SMTP Benutzer"
                  value={settings.smtpUser}
                  onChange={handleChange('smtpUser')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="Absendername"
                  value={settings.smtpFromName}
                  onChange={handleChange('smtpFromName')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <Alert severity="info">
                  SMTP-Passwort wird aus Sicherheitsgründen in Umgebungsvariablen gespeichert.
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <NotificationsIcon color="warning" />
                <Typography variant="h6">Benachrichtigungseinstellungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableEmailNotifications}
                      onChange={handleChange('enableEmailNotifications')}
                      disabled={isReadOnly}
                    />
                  }
                  label="E-Mail-Benachrichtigungen"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enablePushNotifications}
                      onChange={handleChange('enablePushNotifications')}
                      disabled={isReadOnly}
                    />
                  }
                  label="Push-Benachrichtigungen"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableSmsNotifications}
                      onChange={handleChange('enableSmsNotifications')}
                      disabled={isReadOnly}
                    />
                  }
                  label="SMS-Benachrichtigungen"
                />
                <TextField
                  label="Batch-Größe"
                  type="number"
                  value={settings.notificationBatchSize}
                  onChange={handleChange('notificationBatchSize')}
                  fullWidth
                  helperText="Anzahl der Benachrichtigungen pro Verarbeitungszyklus"
                  disabled={isReadOnly}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Match Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Match-Einstellungen
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="Max. aktive Matches pro Nutzer"
                  type="number"
                  value={settings.maxActiveMatches}
                  onChange={handleChange('maxActiveMatches')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="Match-Ablauf (Tage)"
                  type="number"
                  value={settings.matchExpiryDays}
                  onChange={handleChange('matchExpiryDays')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoMatchEnabled}
                      onChange={handleChange('autoMatchEnabled')}
                      disabled={isReadOnly}
                    />
                  }
                  label="Automatisches Matching aktivieren"
                />
                <TextField
                  label="Min. Kompatibilitätsscore (%)"
                  type="number"
                  value={settings.minCompatibilityScore}
                  onChange={handleChange('minCompatibilityScore')}
                  fullWidth
                  helperText="Mindest-Kompatibilität für automatische Matches"
                  disabled={isReadOnly}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Appointment Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Termin-Einstellungen
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="Max. Termine pro Nutzer"
                  type="number"
                  value={settings.maxAppointmentsPerUser}
                  onChange={handleChange('maxAppointmentsPerUser')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <TextField
                  label="Erinnerung (Stunden vorher)"
                  type="number"
                  value={settings.appointmentReminderHours}
                  onChange={handleChange('appointmentReminderHours')}
                  fullWidth
                  disabled={isReadOnly}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowCancellation}
                      onChange={handleChange('allowCancellation')}
                      disabled={isReadOnly}
                    />
                  }
                  label="Stornierung erlauben"
                />
                <TextField
                  label="Stornierungsfrist (Stunden)"
                  type="number"
                  value={settings.cancellationDeadlineHours}
                  onChange={handleChange('cancellationDeadlineHours')}
                  fullWidth
                  disabled={isReadOnly || !settings.allowCancellation}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Systemstatus
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Version
                  </Typography>
                  <Typography variant="h6">v1.0.0-beta</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Umgebung
                  </Typography>
                  <Chip label="Development" color="warning" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Letzter Deploy
                  </Typography>
                  <Typography variant="h6">08.01.2025 14:30</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Cache Status
                  </Typography>
                  <Chip label="Aktiv" color="success" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {canManageSettings ? (
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button variant="outlined" sx={{ mr: 2 }}>
            Zurücksetzen
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            Alle Einstellungen speichern
          </Button>
        </Box>
      ) : null}
    </Box>
  );
});

AdminSettingsPage.displayName = 'AdminSettingsPage';

export default AdminSettingsPage;
