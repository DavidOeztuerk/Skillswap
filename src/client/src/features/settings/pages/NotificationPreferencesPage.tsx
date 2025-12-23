import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as PushIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material';
import PageLoader from '../../../shared/components/ui/PageLoader';
import { useNotifications } from '../../notifications/hooks/useNotifications';
import CalendarIntegrationCard from '../components/CalendarIntegrationCard';
import PushNotificationCard from '../components/PushNotificationCard';
import ReminderSettingsCard from '../components/ReminderSettingsCard';
import type { NotificationSettings } from '../../notifications/types/Notification';

const NotificationPreferencesPage: React.FC = () => {
  const { settings, isLoading, loadSettings, updateSettingsAsync } = useNotifications();
  const [localSettings, setLocalSettings] = React.useState<NotificationSettings | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Track if initial load has completed to prevent unnecessary syncs
  const hasInitialized = useRef(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Only sync localSettings from Redux on initial load, not after saves
  useEffect(() => {
    // Skip if we're in the middle of saving
    if (isSavingRef.current) {
      return;
    }

    // Initialize localSettings when settings first load
    if (!hasInitialized.current) {
      setLocalSettings(settings);
      hasInitialized.current = true;
    }
  }, [settings]);

  const handleToggle = useCallback((field: keyof NotificationSettings): void => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const currentValue = prev[field];
      if (typeof currentValue === 'boolean') {
        return {
          ...prev,
          [field]: !currentValue,
        };
      }
      return prev;
    });
  }, []);

  const handleSelectChange = useCallback(
    (field: keyof NotificationSettings, value: string): void => {
      setLocalSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: value,
        };
      });
    },
    []
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (!localSettings) return;

    setIsSaving(true);
    isSavingRef.current = true;

    try {
      const success = await updateSettingsAsync(localSettings);

      if (success) {
        setSaveSuccess(true);
        // Update hasInitialized ref to allow future syncs after manual reset
        hasInitialized.current = true;
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [localSettings, updateSettingsAsync]);

  // Memoize hasChanges to prevent recalculation on every render
  const hasChanges = useMemo(() => {
    if (!localSettings) return false;
    return JSON.stringify(localSettings) !== JSON.stringify(settings);
  }, [localSettings, settings]);

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
            Verwalte deine Benachrichtigungspräferenzen für verschiedene Kanäle
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={() => {
            void handleSave();
          }}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Speichere...' : 'Speichern'}
        </Button>
      </Stack>

      {saveSuccess ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Benachrichtigungseinstellungen erfolgreich gespeichert!
        </Alert>
      ) : null}

      {hasChanges && !saveSuccess ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Du hast ungespeicherte Änderungen. Klicke auf &quot;Speichern&quot;, um sie zu übernehmen.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        {/* Email Notifications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <EmailIcon color="primary" />
                <Typography variant="h6">E-Mail-Benachrichtigungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.emailEnabled}
                        onChange={() => {
                          handleToggle('emailEnabled');
                        }}
                        color="primary"
                      />
                    }
                    label={<Typography>E-Mail aktiviert</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Erhalte grundlegende E-Mail-Benachrichtigungen
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.emailSecurity}
                        onChange={() => {
                          handleToggle('emailSecurity');
                        }}
                        color="primary"
                        disabled={!localSettings.emailEnabled}
                      />
                    }
                    label={<Typography>Sicherheits-E-Mails</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Login-Benachrichtigungen und Sicherheitswarnungen
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.emailUpdates}
                        onChange={() => {
                          handleToggle('emailUpdates');
                        }}
                        color="primary"
                        disabled={!localSettings.emailEnabled}
                      />
                    }
                    label={<Typography>Updates</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Match-Anfragen, Terminerinnerungen und System-Updates
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.emailMarketing}
                        onChange={() => {
                          handleToggle('emailMarketing');
                        }}
                        color="primary"
                        disabled={!localSettings.emailEnabled}
                      />
                    }
                    label={<Typography>Marketing</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Newsletter, Tipps und Empfehlungen
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Push Notifications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <PushIcon color="secondary" />
                <Typography variant="h6">Push-Benachrichtigungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.pushEnabled}
                        onChange={() => {
                          handleToggle('pushEnabled');
                        }}
                        color="primary"
                      />
                    }
                    label={<Typography>Push aktiviert</Typography>}
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
                        checked={localSettings.pushSecurity}
                        onChange={() => {
                          handleToggle('pushSecurity');
                        }}
                        color="primary"
                        disabled={!localSettings.pushEnabled}
                      />
                    }
                    label={<Typography>Sicherheits-Push</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Sofortige Sicherheitswarnungen
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.pushUpdates}
                        onChange={() => {
                          handleToggle('pushUpdates');
                        }}
                        color="primary"
                        disabled={!localSettings.pushEnabled}
                      />
                    }
                    label={<Typography>Updates</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Match-Anfragen, Termine und wichtige Updates
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.pushMarketing}
                        onChange={() => {
                          handleToggle('pushMarketing');
                        }}
                        color="primary"
                        disabled={!localSettings.pushEnabled}
                      />
                    }
                    label={<Typography>Marketing</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Empfehlungen und Tipps
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* SMS Notifications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <SmsIcon color="info" />
                <Typography variant="h6">SMS-Benachrichtigungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.smsEnabled}
                        onChange={() => {
                          handleToggle('smsEnabled');
                        }}
                        color="primary"
                      />
                    }
                    label={<Typography>SMS aktiviert</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Erhalte SMS für wichtige Benachrichtigungen
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.smsSecurity}
                        onChange={() => {
                          handleToggle('smsSecurity');
                        }}
                        color="primary"
                        disabled={!localSettings.smsEnabled}
                      />
                    }
                    label={<Typography>Sicherheits-SMS</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Zwei-Faktor-Authentifizierung und Sicherheitscodes
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.smsReminders}
                        onChange={() => {
                          handleToggle('smsReminders');
                        }}
                        color="primary"
                        disabled={!localSettings.smsEnabled}
                      />
                    }
                    label={<Typography>SMS-Erinnerungen</Typography>}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ ml: 4, display: 'block' }}
                  >
                    Terminerinnerungen per SMS
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* General Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <ScheduleIcon color="action" />
                <Typography variant="h6">Allgemeine Einstellungen</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="timezone-label">Zeitzone</InputLabel>
                  <Select
                    labelId="timezone-label"
                    value={localSettings.timeZone}
                    label="Zeitzone"
                    onChange={(e: SelectChangeEvent) => {
                      handleSelectChange('timeZone', e.target.value);
                    }}
                  >
                    <MenuItem value="Europe/Berlin">Europe/Berlin (MEZ)</MenuItem>
                    <MenuItem value="Europe/Vienna">Europe/Vienna (MEZ)</MenuItem>
                    <MenuItem value="Europe/Zurich">Europe/Zurich (MEZ)</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="digest-label">E-Mail-Zusammenfassung</InputLabel>
                  <Select
                    labelId="digest-label"
                    value={localSettings.digestFrequency}
                    label="E-Mail-Zusammenfassung"
                    onChange={(e: SelectChangeEvent) => {
                      handleSelectChange('digestFrequency', e.target.value);
                    }}
                  >
                    <MenuItem value="Instant">Sofort</MenuItem>
                    <MenuItem value="Daily">Täglich</MenuItem>
                    <MenuItem value="Weekly">Wöchentlich</MenuItem>
                    <MenuItem value="Never">Nie</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="language-label">Sprache</InputLabel>
                  <Select
                    labelId="language-label"
                    value={localSettings.language}
                    label="Sprache"
                    onChange={(e: SelectChangeEvent) => {
                      handleSelectChange('language', e.target.value);
                    }}
                    startAdornment={<LanguageIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Push Notifications Setup */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PushNotificationCard />
        </Grid>

        {/* Reminder Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ReminderSettingsCard />
        </Grid>

        {/* Calendar Integration */}
        <Grid size={{ xs: 12 }}>
          <CalendarIntegrationCard />
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Schnellaktionen
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setLocalSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            emailEnabled: true,
                            emailMarketing: true,
                            emailSecurity: true,
                            emailUpdates: true,
                            pushEnabled: true,
                            pushMarketing: true,
                            pushSecurity: true,
                            pushUpdates: true,
                            smsEnabled: true,
                            smsSecurity: true,
                            smsReminders: true,
                          }
                        : prev
                    );
                  }}
                >
                  Alle aktivieren
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setLocalSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            emailEnabled: false,
                            emailMarketing: false,
                            emailSecurity: false,
                            emailUpdates: false,
                            pushEnabled: false,
                            pushMarketing: false,
                            pushSecurity: false,
                            pushUpdates: false,
                            smsEnabled: false,
                            smsSecurity: false,
                            smsReminders: false,
                          }
                        : prev
                    );
                  }}
                >
                  Alle deaktivieren
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setLocalSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            emailEnabled: true,
                            emailMarketing: false,
                            emailSecurity: true,
                            emailUpdates: true,
                            pushEnabled: true,
                            pushMarketing: false,
                            pushSecurity: true,
                            pushUpdates: true,
                            smsEnabled: false,
                            smsSecurity: false,
                            smsReminders: false,
                          }
                        : prev
                    );
                  }}
                >
                  Nur wichtige
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
          onClick={() => {
            void handleSave();
          }}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationPreferencesPage;
