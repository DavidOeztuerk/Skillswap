import React, { useEffect, useState, useCallback } from 'react';
import { AccessAlarm as AlarmIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Box,
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  FormGroup,
} from '@mui/material';
import { apiClient } from '../../../core/api/apiClient';
import { NOTIFICATION_ENDPOINTS } from '../../../core/config/endpoints';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';

interface ReminderSettings {
  userId: string;
  reminderMinutesBefore: number[];
  emailRemindersEnabled: boolean;
  pushRemindersEnabled: boolean;
  smsRemindersEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

const REMINDER_OPTIONS = [
  { value: 5, label: '5 Minuten vorher' },
  { value: 15, label: '15 Minuten vorher' },
  { value: 30, label: '30 Minuten vorher' },
  { value: 60, label: '1 Stunde vorher' },
  { value: 1440, label: '1 Tag vorher' },
];

/**
 * Reminder Settings Card
 * Allows users to configure appointment reminder times and channels
 */
const ReminderSettingsCard: React.FC = () => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<ReminderSettings | null>(null);

  // Fetch reminder settings
  const fetchSettings = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ReminderSettings>(
        NOTIFICATION_ENDPOINTS.REMINDER_SETTINGS
      );

      if (isSuccessResponse(response)) {
        setSettings(response.data);
        setOriginalSettings(response.data);
      } else {
        setError(response.message ?? 'Einstellungen konnten nicht geladen werden');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  // Track changes
  useEffect(() => {
    if (settings && originalSettings) {
      const changed =
        JSON.stringify([...settings.reminderMinutesBefore].sort()) !==
          JSON.stringify([...originalSettings.reminderMinutesBefore].sort()) ||
        settings.emailRemindersEnabled !== originalSettings.emailRemindersEnabled ||
        settings.pushRemindersEnabled !== originalSettings.pushRemindersEnabled ||
        settings.smsRemindersEnabled !== originalSettings.smsRemindersEnabled;
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  // Toggle reminder time
  const handleToggleTime = (minutes: number): void => {
    if (!settings) return;

    const currentTimes = settings.reminderMinutesBefore;
    const newTimes = currentTimes.includes(minutes)
      ? currentTimes.filter((t) => t !== minutes)
      : [...currentTimes, minutes];

    setSettings({
      ...settings,
      reminderMinutesBefore: newTimes,
    });
  };

  // Toggle channel
  const handleToggleChannel = (channel: 'email' | 'push' | 'sms'): void => {
    if (!settings) return;

    const fieldMap = {
      email: 'emailRemindersEnabled',
      push: 'pushRemindersEnabled',
      sms: 'smsRemindersEnabled',
    } as const;

    setSettings({
      ...settings,
      [fieldMap[channel]]: !settings[fieldMap[channel]],
    });
  };

  // Save settings
  const handleSave = async (): Promise<void> => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await apiClient.put<ReminderSettings>(
        NOTIFICATION_ENDPOINTS.REMINDER_SETTINGS,
        {
          reminderMinutesBefore: settings.reminderMinutesBefore,
          emailRemindersEnabled: settings.emailRemindersEnabled,
          pushRemindersEnabled: settings.pushRemindersEnabled,
          smsRemindersEnabled: settings.smsRemindersEnabled,
        }
      );

      if (isSuccessResponse(response)) {
        setSettings(response.data);
        setOriginalSettings(response.data);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setError(response.message ?? 'Speichern fehlgeschlagen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <AlarmIcon color="primary" />
          <Typography variant="h6">Termin-Erinnerungen</Typography>
          <Box sx={{ flexGrow: 1 }} />
          {hasChanges ? (
            <Button
              variant="contained"
              size="small"
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving}
            >
              Speichern
            </Button>
          ) : null}
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {saveSuccess ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Erinnerungseinstellungen gespeichert!
          </Alert>
        ) : null}

        <Typography variant="subtitle2" gutterBottom>
          Erinnerungszeiten
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Wähle, wann du vor einem Termin erinnert werden möchtest:
        </Typography>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
          {REMINDER_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              variant={
                settings?.reminderMinutesBefore.includes(option.value) ? 'filled' : 'outlined'
              }
              color={settings?.reminderMinutesBefore.includes(option.value) ? 'primary' : 'default'}
              onClick={() => {
                handleToggleTime(option.value);
              }}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Erinnerungskanäle
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Wähle, wie du erinnert werden möchtest:
        </Typography>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings?.emailRemindersEnabled ?? true}
                onChange={() => {
                  handleToggleChannel('email');
                }}
                color="primary"
              />
            }
            label="E-Mail-Erinnerungen"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings?.pushRemindersEnabled ?? true}
                onChange={() => {
                  handleToggleChannel('push');
                }}
                color="primary"
              />
            }
            label="Push-Erinnerungen"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings?.smsRemindersEnabled ?? false}
                onChange={() => {
                  handleToggleChannel('sms');
                }}
                color="primary"
                disabled // SMS not implemented yet
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>SMS-Erinnerungen</span>
                <Chip label="Bald verfügbar" size="small" variant="outlined" />
              </Stack>
            }
          />
        </FormGroup>

        {hasChanges ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">Du hast ungespeicherte Änderungen.</Alert>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default ReminderSettingsCard;
