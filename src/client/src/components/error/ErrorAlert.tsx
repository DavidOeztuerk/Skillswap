import React from 'react';
import { Alert, Box, Typography, Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useFormError } from '../../hooks/useFormError';

interface ErrorAlertProps {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
}

/**
 * Error alert that automatically processes errors and shows user-friendly messages
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  compact = true,
}) => {
  const { hasError, errorMessage, errorCode, traceId, showRetry, isAuthError } =
    useFormError(error);

  // Don't render if there's no error
  if (!hasError && (error === null || error === undefined)) return null;

  const displayMessage = errorMessage || 'Ein Fehler ist aufgetreten';
  const displaySeverity = isAuthError ? 'warning' : 'error';

  return (
    <Alert
      severity={displaySeverity}
      onClose={onDismiss}
      sx={{
        animation: 'fadeIn 0.3s ease-in',
        mb: 2,
      }}
      action={
        (showRetry || (error !== null && !hasError)) && onRetry !== undefined ? (
          <Button
            size="small"
            startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={onRetry}
            disabled={isRetrying}
            color="inherit"
          >
            {isRetrying ? 'Versuche...' : 'Erneut versuchen'}
          </Button>
        ) : undefined
      }
    >
      <Box>
        <Typography variant="body2">{displayMessage}</Typography>
        {!compact && errorCode !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Error Code: {errorCode}
          </Typography>
        )}
        {!compact && traceId !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Trace ID: {traceId}
          </Typography>
        )}
      </Box>
    </Alert>
  );
};

export default ErrorAlert;
