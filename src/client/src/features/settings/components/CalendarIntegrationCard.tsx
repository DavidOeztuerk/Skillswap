import React, { useState } from 'react';
import {
  CalendarMonth as CalendarIcon,
  Google as GoogleIcon,
  Apple as AppleIcon,
  Check as CheckIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
  Sync as SyncIcon,
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useCalendarIntegration } from '../hooks/useCalendarIntegration';
import AppleCalendarConnectDialog from './AppleCalendarConnectDialog';
import type { CalendarProvider, CalendarAuthType } from '../services/calendarService';

// Microsoft icon (custom SVG)
const MicrosoftIcon: React.FC<{ sx?: object }> = ({ sx }) => (
  <Box component="svg" viewBox="0 0 23 23" sx={{ width: 24, height: 24, ...sx }}>
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </Box>
);

interface CalendarProviderInfo {
  id: CalendarProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  authType: CalendarAuthType;
}

const PROVIDERS: CalendarProviderInfo[] = [
  {
    id: 'google',
    name: 'Google Kalender',
    description: 'Synchronisiere deine Termine mit Google Kalender',
    icon: <GoogleIcon />,
    authType: 'oauth',
  },
  {
    id: 'microsoft',
    name: 'Microsoft Outlook',
    description: 'Synchronisiere deine Termine mit Outlook Kalender',
    icon: <MicrosoftIcon />,
    authType: 'oauth',
  },
  {
    id: 'apple',
    name: 'Apple iCloud Kalender',
    description: 'Synchronisiere deine Termine mit iCloud Kalender',
    icon: <AppleIcon />,
    authType: 'password',
  },
];

/**
 * Calendar Integration Settings Card
 * Allows users to connect/disconnect external calendars (Google, Microsoft, Apple)
 */
const CalendarIntegrationCard: React.FC = () => {
  const {
    isLoading,
    connectingProvider,
    error,
    successMessage,
    connectProvider,
    connectApple,
    disconnectProvider,
    isProviderConnected,
    getProviderConnection,
    clearError,
    clearSuccessMessage,
  } = useCalendarIntegration();

  // Apple Calendar dialog state
  const [appleDialogOpen, setAppleDialogOpen] = useState(false);

  const handleConnect = (provider: CalendarProvider): void => {
    // Apple requires special dialog for app-specific password
    if (provider === 'apple') {
      setAppleDialogOpen(true);
      return;
    }
    void connectProvider(provider);
  };

  const handleAppleConnect = async (appleId: string, appPassword: string): Promise<boolean> =>
    connectApple(appleId, appPassword);

  const handleDisconnect = async (provider: CalendarProvider): Promise<void> => {
    await disconnectProvider(provider);
  };

  // Check if a specific provider is currently loading
  const isProviderLoading = (providerId: CalendarProvider): boolean =>
    connectingProvider === providerId;

  const formatLastSync = (dateString?: string): string => {
    if (!dateString) return 'Noch nie synchronisiert';
    const date = new Date(dateString);
    return `Zuletzt: ${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <CalendarIcon color="primary" />
          <Typography variant="h6">Kalender-Integration</Typography>
          <Box sx={{ flexGrow: 1 }} />
          {isLoading ? <CircularProgress size={20} /> : null}
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert severity="success" sx={{ mb: 2 }} onClose={clearSuccessMessage}>
            {successMessage}
          </Alert>
        ) : null}

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Verbinde deine externen Kalender, um Termine automatisch zu synchronisieren. Neue Termine
          werden automatisch in deinen verbundenen Kalendern erstellt.
        </Typography>

        <List>
          {PROVIDERS.map((provider) => {
            const connection = getProviderConnection(provider.id);
            const connected = isProviderConnected(provider.id);
            const isTokenExpired = connection?.isTokenExpired ?? false;

            return (
              <ListItem
                key={provider.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: connected ? 'action.hover' : 'transparent',
                }}
                secondaryAction={
                  connected ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={
                        isProviderLoading(provider.id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          <LinkOffIcon />
                        )
                      }
                      onClick={() => {
                        void handleDisconnect(provider.id);
                      }}
                      disabled={connectingProvider !== null}
                    >
                      Trennen
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={
                        isProviderLoading(provider.id) ? (
                          <CircularProgress size={16} />
                        ) : (
                          <LinkIcon />
                        )
                      }
                      onClick={() => {
                        handleConnect(provider.id);
                      }}
                      disabled={connectingProvider !== null}
                    >
                      Verbinden
                    </Button>
                  )
                }
              >
                <ListItemIcon>{provider.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2">{provider.name}</Typography>
                      {connected && !isTokenExpired ? (
                        <Chip icon={<CheckIcon />} label="Verbunden" color="success" size="small" />
                      ) : null}
                      {isTokenExpired ? (
                        <Chip
                          icon={<WarningIcon />}
                          label="Neu verbinden"
                          color="warning"
                          size="small"
                        />
                      ) : null}
                    </Stack>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="textSecondary"
                        sx={{ display: 'block' }}
                      >
                        {provider.description}
                      </Typography>
                      {connected && connection ? (
                        <Box component="span" sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          {connection.providerEmail ? (
                            <Typography component="span" variant="caption" color="textSecondary">
                              {connection.providerEmail}
                            </Typography>
                          ) : null}
                          <Typography component="span" variant="caption" color="textSecondary">
                            <SyncIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                            {formatLastSync(connection.lastSyncAt)}
                          </Typography>
                        </Box>
                      ) : null}
                    </>
                  }
                  slotProps={{
                    secondary: {
                      component: 'div',
                    },
                  }}
                />
              </ListItem>
            );
          })}
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Hinweis:</strong> Google und Microsoft verwenden OAuth - du wirst zur
            Anmeldeseite weitergeleitet. Apple erfordert ein App-spezifisches Passwort.
          </Typography>
        </Alert>
      </CardContent>

      {/* Apple Calendar Connect Dialog */}
      <AppleCalendarConnectDialog
        open={appleDialogOpen}
        onClose={() => {
          setAppleDialogOpen(false);
        }}
        onConnect={handleAppleConnect}
        isConnecting={connectingProvider === 'apple'}
      />
    </Card>
  );
};

export default CalendarIntegrationCard;
