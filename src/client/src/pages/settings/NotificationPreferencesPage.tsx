import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
  Alert,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  PhoneAndroid as PhoneIcon,
  DesktopWindows as DesktopIcon,
  EventAvailable as EventIcon,
  Star as StarIcon,
  Info as InfoIcon,
  Handshake as HandshakeIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import PageLoader from '../../components/ui/PageLoader';
import type { NotificationSettings } from '../../types/models/Notification';

const NotificationPreferencesPage: React.FC = () => {
  const { settings, isLoading, loadSettings, updateSettings } = useNotifications();
  const [localSettings, setLocalSettings] = React.useState<NotificationSettings | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = (field: keyof NotificationSettings): void => {
    if (localSettings) {
      setLocalSettings({
        ...localSettings,
        [field]: !localSettings[field],
      });
    }
  };

  const handleSave = (): void => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      // Fire-and-forget - updateSettings returns void
      updateSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    localSettings !== null && JSON.stringify(localSettings) !== JSON.stringify(settings);

  if (isLoading && localSettings === null) {
    return <PageLoader variant="form" message="Lade Benachrichtigungseinstellungen..." />;
  }

  if (!localSettings) {
    return null;
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Benachrichtigungseinstellungen
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Verwalte deine Benachrichtigungspräferenzen für verschiedene Ereignisse
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Speichere...' : 'Speichern'}
        </Button>
      </Stack>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Benachrichtigungseinstellungen erfolgreich gespeichert!
        </Alert>
      )}

      {hasChanges && !saveSuccess && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Du hast ungespeicherte Änderungen. Klicke auf "Speichern", um sie zu übernehmen.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notification Channels */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6">Benachrichtigungskanäle</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.emailNotifications}
                        onChange={() => {
                          handleToggle('emailNotifications');
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EmailIcon fontSize="small" />
                        <Typography>E-Mail-Benachrichtigungen</Typography>
                      </Stack>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Erhalte Benachrichtigungen per E-Mail
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.pushNotifications}
                        onChange={() => {
                          handleToggle('pushNotifications');
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PhoneIcon fontSize="small" />
                        <Typography>Push-Benachrichtigungen</Typography>
                      </Stack>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Erhalte Push-Benachrichtigungen auf deinem Gerät
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.desktopNotifications}
                        onChange={() => {
                          handleToggle('desktopNotifications');
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <DesktopIcon fontSize="small" />
                        <Typography>Desktop-Benachrichtigungen</Typography>
                      </Stack>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Zeige Desktop-Benachrichtigungen im Browser
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Types */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <InfoIcon color="secondary" />
                <Typography variant="h6">Benachrichtigungstypen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.matchRequests}
                        onChange={() => {
                          handleToggle('matchRequests');
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <HandshakeIcon fontSize="small" />
                        <Typography>Match-Anfragen</Typography>
                      </Stack>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Benachrichtigungen über neue Match-Anfragen und Antworten
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.appointmentReminders}
                        onChange={() => {
                          handleToggle('appointmentReminders');
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EventIcon fontSize="small" />
                        <Typography>Termin-Erinnerungen</Typography>
                      </Stack>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Erinnerungen an bevorstehende Termine
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.skillEndorsements}
                        onChange={() => {
                          handleToggle('skillEndorsements');
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <StarIcon fontSize="small" />
                        <Typography>Skill-Endorsements</Typography>
                      </Stack>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Benachrichtigungen über neue Skill-Endorsements
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.systemUpdates}
                        onChange={() => {
                          handleToggle('systemUpdates');
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <InfoIcon fontSize="small" />
                        <Typography>System-Updates</Typography>
                      </Stack>
                    }
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Wichtige System-Updates und Wartungshinweise
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Schnellaktionen
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const allEnabled: NotificationSettings = {
                      emailNotifications: true,
                      pushNotifications: true,
                      desktopNotifications: true,
                      matchRequests: true,
                      appointmentReminders: true,
                      skillEndorsements: true,
                      systemUpdates: true,
                    };
                    setLocalSettings(allEnabled);
                  }}
                >
                  Alle aktivieren
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const allDisabled: NotificationSettings = {
                      emailNotifications: false,
                      pushNotifications: false,
                      desktopNotifications: false,
                      matchRequests: false,
                      appointmentReminders: false,
                      skillEndorsements: false,
                      systemUpdates: false,
                    };
                    setLocalSettings(allDisabled);
                  }}
                >
                  Alle deaktivieren
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setLocalSettings(settings);
                  }}
                  disabled={!hasChanges}
                >
                  Zurücksetzen
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Box */}
        <Grid size={{ xs: 12 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Hinweis:</strong> Desktop-Benachrichtigungen erfordern möglicherweise eine
              Browser-Berechtigung. Stelle sicher, dass du Benachrichtigungen in deinen
              Browser-Einstellungen zugelassen hast.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Save Button (Bottom) */}
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="outlined"
          sx={{ mr: 2 }}
          onClick={() => {
            setLocalSettings(settings);
          }}
          disabled={!hasChanges}
        >
          Abbrechen
        </Button>
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationPreferencesPage;
