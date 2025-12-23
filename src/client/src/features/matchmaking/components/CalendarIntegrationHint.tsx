import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarMonth as CalendarIcon,
  Google as GoogleIcon,
  Apple as AppleIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  Collapse,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { useCalendarIntegration } from '../../settings/hooks/useCalendarIntegration';
import type { CalendarProvider } from '../../settings/services/calendarService';

// Microsoft icon (custom SVG)
const MicrosoftIcon: React.FC<{ sx?: object }> = ({ sx }) => (
  <Box component="svg" viewBox="0 0 23 23" sx={{ width: 16, height: 16, ...sx }}>
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </Box>
);

interface ProviderInfo {
  id: CalendarProvider;
  name: string;
  shortName: string;
  icon: React.ReactNode;
}

const SUPPORTED_PROVIDERS: ProviderInfo[] = [
  {
    id: 'google',
    name: 'Google Kalender',
    shortName: 'Google',
    icon: <GoogleIcon fontSize="small" />,
  },
  { id: 'microsoft', name: 'Microsoft Outlook', shortName: 'Outlook', icon: <MicrosoftIcon /> },
  { id: 'apple', name: 'Apple iCloud', shortName: 'iCloud', icon: <AppleIcon fontSize="small" /> },
];

// Color constants
const SUCCESS_LIGHTER = 'success.lighter';

// Helper to get border color based on connection state
function getBorderColor(noneConnected: boolean, allConnected: boolean): string {
  if (noneConnected) return 'warning.main';
  if (allConnected) return 'success.main';
  return 'info.main';
}

// Helper to get background color based on connection state
function getBgColor(noneConnected: boolean, allConnected: boolean): string {
  if (noneConnected) return 'warning.lighter';
  if (allConnected) return SUCCESS_LIGHTER;
  return 'info.lighter';
}

// Helper to get header text
function getHeaderText(
  allConnected: boolean,
  noneConnected: boolean,
  connectedCount: number,
  totalCount: number
): string {
  if (allConnected) return 'Alle Kalender verbunden';
  if (noneConnected) return 'Kalender verbinden empfohlen';
  return `${connectedCount} von ${totalCount} Kalendern verbunden`;
}

// Loading component
const LoadingState: React.FC = () => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      mb: 2,
      bgcolor: 'action.hover',
      borderColor: 'divider',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">
        Kalender-Status wird geladen...
      </Typography>
    </Stack>
  </Paper>
);

// Compact success state
const CompactSuccessState: React.FC = () => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      mb: 2,
      bgcolor: SUCCESS_LIGHTER,
      borderColor: 'success.light',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      <CheckIcon color="success" fontSize="small" />
      <Typography variant="body2" color="success.dark">
        Alle Kalender verbunden - freie Zeiten werden automatisch berücksichtigt
      </Typography>
    </Stack>
  </Paper>
);

interface CalendarIntegrationHintProps {
  /** Compact mode shows only essential info */
  compact?: boolean;
  /** Show expanded details by default */
  defaultExpanded?: boolean;
}

/**
 * Calendar Integration Hint Component
 *
 * Shows calendar connection status and encourages users to connect
 * their calendars for better scheduling during match requests.
 */
const CalendarIntegrationHint: React.FC<CalendarIntegrationHintProps> = ({
  compact = false,
  defaultExpanded = true,
}) => {
  const navigate = useNavigate();
  const { connections, isLoading, isProviderConnected } = useCalendarIntegration();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  // Count connected providers
  const connectedProviders = SUPPORTED_PROVIDERS.filter((p) => isProviderConnected(p.id));
  const unconnectedProviders = SUPPORTED_PROVIDERS.filter((p) => !isProviderConnected(p.id));
  const allConnected = unconnectedProviders.length === 0;
  const noneConnected = connectedProviders.length === 0;

  const handleNavigateToSettings = async (): Promise<void> => {
    await navigate('/settings/notifications');
  };

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Compact mode for already connected users
  if (compact && allConnected) {
    return <CompactSuccessState />;
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        overflow: 'hidden',
        borderColor: getBorderColor(noneConnected, allConnected),
        bgcolor: getBgColor(noneConnected, allConnected),
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CalendarIcon color={noneConnected ? 'warning' : allConnected ? 'success' : 'info'} />
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {getHeaderText(
                allConnected,
                noneConnected,
                connectedProviders.length,
                SUPPORTED_PROVIDERS.length
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allConnected
                ? 'Deine freien Zeiten werden automatisch bei der Terminsuche berücksichtigt'
                : 'Verbinde deine Kalender für bessere Terminvorschläge'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Connected indicators (collapsed view) */}
          {!expanded && connectedProviders.length > 0 && (
            <Stack direction="row" spacing={0.5}>
              {connectedProviders.map((p) => (
                <Tooltip key={p.id} title={`${p.name} verbunden`}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      color: 'white',
                    }}
                  >
                    {p.icon}
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          )}

          <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Stack>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          {/* Info Box */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              p: 1.5,
              mb: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <InfoIcon fontSize="small" color="info" sx={{ mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary">
              Wenn du deine Kalender verbindest, werden deine <strong>belegten Zeiten</strong>{' '}
              automatisch bei der Terminsuche berücksichtigt. So findest du schneller einen
              passenden Termin, der für beide Seiten funktioniert.
            </Typography>
          </Box>

          {/* Provider Status */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            {SUPPORTED_PROVIDERS.map((provider) => {
              const connected = isProviderConnected(provider.id);
              const connection = connections.find((c) => c.provider.toLowerCase() === provider.id);

              return (
                <Box
                  key={provider.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: connected ? SUCCESS_LIGHTER : 'background.paper',
                    border: 1,
                    borderColor: connected ? 'success.light' : 'divider',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {provider.icon}
                    <Box>
                      <Typography variant="body2" fontWeight={connected ? 600 : 400}>
                        {provider.name}
                      </Typography>
                      {connected && connection?.providerEmail ? (
                        <Typography variant="caption" color="text.secondary">
                          {connection.providerEmail}
                        </Typography>
                      ) : null}
                    </Box>
                  </Stack>

                  {connected ? (
                    <Chip
                      icon={<CheckIcon />}
                      label="Verbunden"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label="Nicht verbunden"
                      size="small"
                      variant="outlined"
                      sx={{ opacity: 0.7 }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>

          {/* Action Button */}
          {!allConnected && (
            <Button
              variant="contained"
              color={noneConnected ? 'warning' : 'primary'}
              startIcon={<SettingsIcon />}
              onClick={handleNavigateToSettings}
              fullWidth
            >
              {noneConnected
                ? 'Kalender jetzt verbinden'
                : `Weitere Kalender verbinden (${unconnectedProviders.length} verfügbar)`}
            </Button>
          )}

          {allConnected ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                p: 1,
                bgcolor: SUCCESS_LIGHTER,
                borderRadius: 1,
              }}
            >
              <CheckIcon color="success" />
              <Typography variant="body2" color="success.dark" fontWeight={500}>
                Perfekt! Alle unterstützten Kalender sind verbunden.
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default CalendarIntegrationHint;
