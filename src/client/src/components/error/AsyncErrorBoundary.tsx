import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { CircularProgress, Box, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallbackRetryDelay?: number; // Auto-retry delay in ms
  maxRetries?: number;
  onRetryExhausted?: () => void;
}

/**
 * Error boundary with automatic retry logic for async operations
 * Useful for components that fetch data
 */
export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({ 
  children, 
  fallbackRetryDelay = 3000,
  maxRetries = 3,
  onRetryExhausted 
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isRetrying && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setIsRetrying(false);
        setError(null);
      }, fallbackRetryDelay);

      return () => clearTimeout(timer);
    }

    if (retryCount >= maxRetries && onRetryExhausted) {
      onRetryExhausted();
    }
  }, [isRetrying, retryCount, maxRetries, fallbackRetryDelay, onRetryExhausted]);

  const handleError = (error: Error) => {
    setError(error);
    setRetryCount(prev => prev + 1);
    
    if (retryCount < maxRetries) {
      setIsRetrying(true);
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setIsRetrying(true);
    setError(null);
  };

  if (isRetrying) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 200,
        gap: 2
      }}>
        <CircularProgress />
        <Alert severity="info" sx={{ maxWidth: 400 }}>
          Retrying... (Attempt {retryCount} of {maxRetries})
        </Alert>
      </Box>
    );
  }

  if (error && retryCount >= maxRetries) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error"
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<RefreshIcon />}
              onClick={handleManualRetry}
            >
              Retry
            </Button>
          }
        >
          Failed after {maxRetries} attempts: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary
      level="component"
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AsyncErrorBoundary;