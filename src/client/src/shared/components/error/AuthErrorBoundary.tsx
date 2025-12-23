import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Login as LoginIcon } from '@mui/icons-material';
import { Button, Alert } from '@mui/material';
import useAuth from '../../../features/auth/hooks/useAuth';
import { ErrorBoundary } from './ErrorBoundary';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Specialized error boundary for authentication-related components
 * Handles auth errors with specific recovery actions
 */
const AuthErrorFallback: React.FC<{ error: Error; onRetry: () => void }> = ({ error, onRetry }) => {
  const navigate = useNavigate();
  const { forceLogout } = useAuth();

  const isAuthError =
    error.message.toLowerCase().includes('auth') ||
    error.message.toLowerCase().includes('token') ||
    error.message.toLowerCase().includes('unauthorized');

  const handleRelogin = (): void => {
    // Clear auth state and redirect to login
    forceLogout();
    void navigate('/login');
  };

  return (
    <Alert
      severity="error"
      sx={{ m: 2 }}
      action={
        <>
          {isAuthError ? (
            <Button color="inherit" size="small" startIcon={<LoginIcon />} onClick={handleRelogin}>
              Re-Login
            </Button>
          ) : (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )}
        </>
      }
    >
      {isAuthError
        ? 'Authentication error. Please log in again.'
        : 'An error occurred in the authentication process.'}
    </Alert>
  );
};

export const AuthErrorBoundary: React.FC<AuthErrorBoundaryProps> = ({ children }) => (
  <ErrorBoundary
    level="component"
    fallback={
      <AuthErrorFallback
        error={new Error('Authentication error fallback')}
        onRetry={() => {
          window.location.reload();
        }}
      />
    }
    onError={(error) => {
      console.error('Auth Error Boundary:', error);
      // Could trigger auth refresh here
    }}
  >
    {children}
  </ErrorBoundary>
);

export default AuthErrorBoundary;
