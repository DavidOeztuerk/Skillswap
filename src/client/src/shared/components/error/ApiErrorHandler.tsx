import React from 'react';
import {
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CloudOff as CloudOffIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

// ============================================================================
// Error Configuration
// ============================================================================

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  severity: ErrorSeverity;
  showRetry: boolean;
}

// Base configurations without network-aware icon/title
const ERROR_CONFIGS: Record<
  string,
  Omit<ErrorConfig, 'icon' | 'title'> & { defaultTitle: string }
> = {
  NETWORK: {
    defaultTitle: 'Verbindungsfehler',
    message: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    severity: 'error',
    showRetry: true,
  },
  SERVER: {
    defaultTitle: 'Server nicht erreichbar',
    message: 'Der Server ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.',
    severity: 'error',
    showRetry: true,
  },
  AUTH: {
    defaultTitle: 'Anmeldung erforderlich',
    message: 'Sie müssen sich erneut anmelden, um fortzufahren.',
    severity: 'warning',
    showRetry: false,
  },
  PERMISSION: {
    defaultTitle: 'Keine Berechtigung',
    message: 'Sie haben keine Berechtigung für diese Aktion.',
    severity: 'warning',
    showRetry: false,
  },
  VALIDATION: {
    defaultTitle: 'Eingabefehler',
    message: 'Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.',
    severity: 'info',
    showRetry: false,
  },
  UNKNOWN: {
    defaultTitle: 'Unbekannter Fehler',
    message: 'Ein unerwarteter Fehler ist aufgetreten.',
    severity: 'error',
    showRetry: true,
  },
};

const getErrorConfig = (type: string, isOnline: boolean): ErrorConfig => {
  const baseConfig = ERROR_CONFIGS[type] ?? ERROR_CONFIGS.UNKNOWN;

  // Network type has special handling based on online status
  if (type === 'NETWORK') {
    return {
      icon: isOnline ? <WifiIcon /> : <WifiOffIcon />,
      title: isOnline ? 'Verbindungsfehler' : 'Offline',
      message: isOnline
        ? 'Netzwerkfehler. Bitte versuchen Sie es erneut.'
        : 'Keine Internetverbindung. Bitte prüfen Sie Ihre Netzwerkeinstellungen.',
      severity: baseConfig.severity,
      showRetry: baseConfig.showRetry,
    };
  }

  // Default icon based on error type
  const icon = type === 'SERVER' || type === 'UNKNOWN' ? <CloudOffIcon /> : <WifiIcon />;

  return {
    icon,
    title: baseConfig.defaultTitle,
    message: baseConfig.message,
    severity: baseConfig.severity,
    showRetry: baseConfig.showRetry,
  };
};

// ============================================================================
// Sub-components
// ============================================================================

interface NetworkStatusChipsProps {
  showNetworkStatus: boolean;
  isOnline: boolean;
  isSlowConnection: boolean;
}

const NetworkStatusChips: React.FC<NetworkStatusChipsProps> = ({
  showNetworkStatus,
  isOnline,
  isSlowConnection,
}) => (
  <>
    {showNetworkStatus && !isOnline ? (
      <Chip icon={<WifiOffIcon />} label="Offline" size="small" color="error" />
    ) : null}
    {showNetworkStatus && isSlowConnection ? (
      <Chip icon={<ScheduleIcon />} label="Langsam" size="small" color="warning" />
    ) : null}
  </>
);

interface RetryButtonProps {
  canRetry: boolean;
  onRetry?: () => void;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  compact?: boolean;
}

const RetryButton: React.FC<RetryButtonProps> = ({
  canRetry,
  onRetry,
  isRetrying,
  retryCount,
  maxRetries,
  compact = false,
}) => {
  if (!canRetry || onRetry === undefined) return null;

  return (
    <Button
      size="small"
      variant={compact ? 'outlined' : 'contained'}
      startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
      onClick={onRetry}
      color={compact ? 'inherit' : undefined}
      disabled={isRetrying}
    >
      {isRetrying
        ? compact
          ? 'Versuche...'
          : 'Versuche erneut...'
        : compact
          ? `Retry (${retryCount}/${maxRetries})`
          : 'Erneut versuchen'}
    </Button>
  );
};

interface ErrorCodeDisplayProps {
  error: {
    code?: string | number;
    errorCode?: string;
    traceId?: string;
  };
}

const ErrorCodeDisplay: React.FC<ErrorCodeDisplayProps> = ({ error }) => {
  const hasErrorInfo =
    error.errorCode !== undefined || error.code !== undefined || error.traceId !== undefined;

  if (!hasErrorInfo) return null;

  return (
    <Box sx={{ mt: 1 }}>
      {error.errorCode === undefined ? null : (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          Error Code: {error.errorCode}
        </Typography>
      )}
      {error.code === undefined || error.errorCode !== undefined ? null : (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          Fehlercode: {error.code}
        </Typography>
      )}
      {error.traceId === undefined ? null : (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          Trace ID: {error.traceId}
        </Typography>
      )}
    </Box>
  );
};

// ============================================================================
// Component
// ============================================================================

export interface ApiErrorProps {
  error: {
    type: 'NETWORK' | 'SERVER' | 'CLIENT' | 'VALIDATION' | 'PERMISSION' | 'UNKNOWN';
    message: string;
    code?: string | number;
    errorCode?: string;
    traceId?: string;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  showNetworkStatus?: boolean;
}

const ApiErrorHandler: React.FC<ApiErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  compact = false,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  showNetworkStatus = true,
}) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const config = getErrorConfig(error.type, isOnline);
  const canRetry = config.showRetry && retryCount < maxRetries;

  if (compact) {
    return (
      <Alert
        severity={config.severity}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <NetworkStatusChips
              showNetworkStatus={showNetworkStatus}
              isOnline={isOnline}
              isSlowConnection={isSlowConnection}
            />
            <RetryButton
              canRetry={canRetry}
              onRetry={onRetry}
              isRetrying={isRetrying}
              retryCount={retryCount}
              maxRetries={maxRetries}
              compact
            />
            {onDismiss ? (
              <Button size="small" onClick={onDismiss} color="inherit">
                Dismiss
              </Button>
            ) : null}
          </Box>
        }
      >
        <Typography variant="body2">
          <strong>{config.title}:</strong> {config.message}
        </Typography>
        {retryCount > 0 ? (
          <Typography variant="caption" color="text.secondary">
            Versuch {retryCount} von {maxRetries}
          </Typography>
        ) : null}
      </Alert>
    );
  }

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: '50%',
              bgcolor: `${config.severity}.light`,
              color: `${config.severity}.contrastText`,
            }}
          >
            {config.icon}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>
          {config.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {config.message}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
          {showNetworkStatus && !isOnline ? (
            <Chip
              icon={<WifiOffIcon />}
              label="Offline"
              size="small"
              color="error"
              variant="outlined"
            />
          ) : null}
          {showNetworkStatus && isSlowConnection ? (
            <Chip
              icon={<ScheduleIcon />}
              label="Langsame Verbindung"
              size="small"
              color="warning"
              variant="outlined"
            />
          ) : null}
          {retryCount > 0 ? (
            <Chip label={`Versuch ${retryCount}/${maxRetries}`} size="small" variant="outlined" />
          ) : null}
        </Box>

        <ErrorCodeDisplay error={error} />
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
        <RetryButton
          canRetry={canRetry}
          onRetry={onRetry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
        {!canRetry && retryCount >= maxRetries ? (
          <Typography variant="body2" color="text.secondary">
            Maximale Anzahl von Versuchen erreicht
          </Typography>
        ) : null}
        {onDismiss === undefined ? null : (
          <Button variant="text" onClick={onDismiss} size="small">
            Schließen
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ApiErrorHandler;
