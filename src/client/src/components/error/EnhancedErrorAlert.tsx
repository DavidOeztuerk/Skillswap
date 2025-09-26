import React from 'react';
import {
  Alert,
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useFormError } from '../../hooks/useFormError';

interface EnhancedErrorAlertProps {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
}

/**
 * Enhanced error alert that automatically processes errors and shows user-friendly messages
 */
const EnhancedErrorAlert: React.FC<EnhancedErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  compact = true,
}) => {
  const { hasError, errorMessage, errorCode, traceId, showRetry, isAuthError } = useFormError(error);


  // Fallback: if processed error is empty but we have a raw error, show it
  if (!hasError && !error) return null;
  
  const displayMessage = errorMessage || 'Ein Fehler ist aufgetreten';
  const displaySeverity = isAuthError ? "warning" : "error";

  return (
    <Alert
      severity={displaySeverity}
      onClose={onDismiss}
      sx={{ 
        animation: 'fadeIn 0.3s ease-in',
        mb: 2 
      }}
      action={
        (showRetry || (error && !hasError)) && onRetry ? (
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
        <Typography variant="body2">
          {displayMessage}
        </Typography>
        {!compact && (errorCode) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Error Code: {errorCode}
          </Typography>
        )}
        {!compact && (traceId) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Trace ID: {traceId}
          </Typography>
        )}
      </Box>
    </Alert>
  );
};

export default EnhancedErrorAlert;