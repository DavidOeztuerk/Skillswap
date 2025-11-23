import React from 'react';
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
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = React.useState({
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
  });

  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // TODO: Implement save to backend
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Systemeinstellungen</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          Speichern
        </Button>
      </Stack>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Einstellungen erfolgreich gespeichert!
        </Alert>
      )}

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
                />
                <TextField
                  label="Seitenbeschreibung"
                  value={settings.siteDescription}
                  onChange={handleChange('siteDescription')}
                  fullWidth
                  multiline
                  rows={2}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleChange('maintenanceMode')}
                    />
                  }
                  label="Wartungsmodus"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRegistration}
                      onChange={handleChange('allowRegistration')}
                    />
                  }
                  label="Registrierung erlauben"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireEmailVerification}
                      onChange={handleChange('requireEmailVerification')}
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
                />
                <TextField
                  label="Session-Timeout (Minuten)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={handleChange('sessionTimeout')}
                  fullWidth
                />
                <TextField
                  label="Minimale Passwortlänge"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={handleChange('passwordMinLength')}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireStrongPassword}
                      onChange={handleChange('requireStrongPassword')}
                    />
                  }
                  label="Starkes Passwort erforderlich"
                />
                <FormControlLabel
                  control={
                    <Switch checked={settings.enable2FA} onChange={handleChange('enable2FA')} />
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
                />
                <TextField
                  label="SMTP Port"
                  type="number"
                  value={settings.smtpPort}
                  onChange={handleChange('smtpPort')}
                  fullWidth
                />
                <TextField
                  label="SMTP Benutzer"
                  value={settings.smtpUser}
                  onChange={handleChange('smtpUser')}
                  fullWidth
                />
                <TextField
                  label="Absendername"
                  value={settings.smtpFromName}
                  onChange={handleChange('smtpFromName')}
                  fullWidth
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
                    />
                  }
                  label="E-Mail-Benachrichtigungen"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enablePushNotifications}
                      onChange={handleChange('enablePushNotifications')}
                    />
                  }
                  label="Push-Benachrichtigungen"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableSmsNotifications}
                      onChange={handleChange('enableSmsNotifications')}
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
                />
                <TextField
                  label="Match-Ablauf (Tage)"
                  type="number"
                  value={settings.matchExpiryDays}
                  onChange={handleChange('matchExpiryDays')}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoMatchEnabled}
                      onChange={handleChange('autoMatchEnabled')}
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
                />
                <TextField
                  label="Erinnerung (Stunden vorher)"
                  type="number"
                  value={settings.appointmentReminderHours}
                  onChange={handleChange('appointmentReminderHours')}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowCancellation}
                      onChange={handleChange('allowCancellation')}
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
                  disabled={!settings.allowCancellation}
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

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button variant="outlined" sx={{ mr: 2 }}>
          Zurücksetzen
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          Alle Einstellungen speichern
        </Button>
      </Box>
    </Box>
  );
};

export default AdminSettingsPage;
