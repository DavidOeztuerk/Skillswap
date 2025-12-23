import React from 'react';
import {
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
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
} from '@mui/material';
import { usePushNotifications } from '../hooks/usePushNotifications';

/**
 * Push Notification Settings Card
 * Allows users to enable/disable browser push notifications
 */
const PushNotificationCard: React.FC = () => {
  const {
    isSupported,
    isEnabled,
    isLoading,
    error,
    enablePushNotifications,
    isPermissionDenied,
    isPermissionDefault,
  } = usePushNotifications();

  const handleEnablePush = async (): Promise<void> => {
    await enablePushNotifications();
  };

  // Not supported in this browser
  if (!isSupported) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <NotificationsOffIcon color="disabled" />
            <Typography variant="h6">Push-Benachrichtigungen</Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Alert severity="warning">
            Push-Benachrichtigungen werden in diesem Browser nicht unterstützt. Bitte verwende einen
            modernen Browser wie Chrome, Firefox oder Edge.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <NotificationsActiveIcon color="primary" />
          <Typography variant="h6">Push-Benachrichtigungen</Typography>
          <Box sx={{ flexGrow: 1 }} />
          {isEnabled ? (
            <Chip icon={<CheckIcon />} label="Aktiviert" color="success" size="small" />
          ) : null}
          {isPermissionDenied ? (
            <Chip icon={<CloseIcon />} label="Blockiert" color="error" size="small" />
          ) : null}
          {isPermissionDefault && !isEnabled ? (
            <Chip icon={<WarningIcon />} label="Nicht aktiviert" color="warning" size="small" />
          ) : null}
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Erhalte Push-Benachrichtigungen direkt in deinem Browser, auch wenn die Seite nicht
          geöffnet ist. Perfekt für Termin-Erinnerungen und wichtige Updates.
        </Typography>

        {isPermissionDenied ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Du hast Push-Benachrichtigungen blockiert. Um sie zu aktivieren, musst du die
                Berechtigung in deinen Browser-Einstellungen ändern:
              </Typography>
              <Typography variant="body2" component="ol" sx={{ mt: 1, pl: 2 }}>
                <li>Klicke auf das Schloss-Symbol in der Adressleiste</li>
                <li>Suche nach &quot;Benachrichtigungen&quot;</li>
                <li>Ändere die Einstellung auf &quot;Zulassen&quot;</li>
                <li>Lade die Seite neu</li>
              </Typography>
            </Alert>
          </Box>
        ) : isEnabled ? (
          <Box>
            <Alert severity="success">
              Push-Benachrichtigungen sind aktiviert. Du wirst über wichtige Ereignisse
              benachrichtigt.
            </Alert>
          </Box>
        ) : (
          <Button
            variant="contained"
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <NotificationsActiveIcon />
              )
            }
            onClick={handleEnablePush}
            disabled={isLoading}
          >
            {isLoading ? 'Aktiviere...' : 'Push-Benachrichtigungen aktivieren'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationCard;
