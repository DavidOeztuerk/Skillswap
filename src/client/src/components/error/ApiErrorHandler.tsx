import React from 'react';
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
import {
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CloudOff as CloudOffIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export interface ApiErrorProps {
  error: {
    type: 'NETWORK' | 'SERVER' | 'AUTH' | 'VALIDATION' | 'PERMISSION' | 'UNKNOWN';
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
  const getErrorConfig = (type: string) => {
    switch (type) {
      case 'NETWORK':
        return {
          icon: isOnline ? <WifiIcon /> : <WifiOffIcon />,
          title: isOnline ? 'Verbindungsfehler' : 'Offline',
          message: isOnline 
            ? 'Netzwerkfehler. Bitte versuchen Sie es erneut.' 
            : 'Keine Internetverbindung. Bitte prüfen Sie Ihre Netzwerkeinstellungen.',
          severity: 'error' as const,
          showRetry: true,
        };
      case 'SERVER':
        return {
          icon: <CloudOffIcon />,
          title: 'Server nicht erreichbar',
          message: 'Der Server ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.',
          severity: 'error' as const,
          showRetry: true,
        };
      case 'AUTH':
        return {
          icon: <WifiIcon />,
          title: 'Anmeldung erforderlich',
          message: 'Sie müssen sich erneut anmelden, um fortzufahren.',
          severity: 'warning' as const,
          showRetry: false,
        };
      case 'PERMISSION':
        return {
          icon: <WifiIcon />,
          title: 'Keine Berechtigung',
          message: 'Sie haben keine Berechtigung für diese Aktion.',
          severity: 'warning' as const,
          showRetry: false,
        };
      case 'VALIDATION':
        return {
          icon: <WifiIcon />,
          title: 'Eingabefehler',
          message: 'Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.',
          severity: 'info' as const,
          showRetry: false,
        };
      default:
        return {
          icon: <CloudOffIcon />,
          title: 'Unbekannter Fehler',
          message: 'Ein unerwarteter Fehler ist aufgetreten.',
          severity: 'error' as const,
          showRetry: true,
        };
    }
  };

  const config = getErrorConfig(error.type);
  const displayMessage = error.message || config.message;
  const canRetry = config.showRetry && retryCount < maxRetries && !isRetrying;

  if (compact) {
    return (
      <Alert 
        severity={config.severity}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {showNetworkStatus && !isOnline && (
              <Chip 
                icon={<WifiOffIcon />} 
                label="Offline" 
                size="small" 
                color="error" 
              />
            )}
            {showNetworkStatus && isSlowConnection && (
              <Chip 
                icon={<ScheduleIcon />} 
                label="Langsam" 
                size="small" 
                color="warning" 
              />
            )}
            {canRetry && onRetry && (
              <Button
                size="small"
                startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={onRetry}
                variant="outlined"
                color="inherit"
                disabled={isRetrying}
              >
                {isRetrying ? 'Versuche...' : `Retry (${retryCount}/${maxRetries})`}
              </Button>
            )}
            {onDismiss && (
              <Button
                size="small"
                onClick={onDismiss}
                color="inherit"
              >
                Dismiss
              </Button>
            )}
          </Box>
        }
      >
        <Typography variant="body2">
          <strong>{config.title}:</strong> {displayMessage}
        </Typography>
        {retryCount > 0 && (
          <Typography variant="caption" color="text.secondary">
            Versuch {retryCount} von {maxRetries}
          </Typography>
        )}
      </Alert>
    );
  }

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 2 }}>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
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
          {displayMessage}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {showNetworkStatus && !isOnline && (
            <Chip 
              icon={<WifiOffIcon />} 
              label="Offline" 
              size="small" 
              color="error" 
              variant="outlined"
            />
          )}
          {showNetworkStatus && isSlowConnection && (
            <Chip 
              icon={<ScheduleIcon />} 
              label="Langsame Verbindung" 
              size="small" 
              color="warning" 
              variant="outlined"
            />
          )}
          {retryCount > 0 && (
            <Chip 
              label={`Versuch ${retryCount}/${maxRetries}`} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>
        
        {(error.errorCode || error.code || error.traceId) && (
          <Box sx={{ mt: 1 }}>
            {error.errorCode && (
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                Error Code: {error.errorCode}
              </Typography>
            )}
            {error.code && !error.errorCode && (
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                Fehlercode: {error.code}
              </Typography>
            )}
            {error.traceId && (
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                Trace ID: {error.traceId}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
        {canRetry && onRetry && (
          <Button
            variant="contained"
            startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={onRetry}
            size="small"
            disabled={isRetrying}
          >
            {isRetrying ? 'Versuche erneut...' : 'Erneut versuchen'}
          </Button>
        )}
        {!canRetry && retryCount >= maxRetries && (
          <Typography variant="body2" color="text.secondary">
            Maximale Anzahl von Versuchen erreicht
          </Typography>
        )}
        {onDismiss && (
          <Button
            variant="text"
            onClick={onDismiss}
            size="small"
          >
            Schließen
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ApiErrorHandler;