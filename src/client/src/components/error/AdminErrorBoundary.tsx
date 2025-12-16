import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Alert, Button, Box, Typography } from '@mui/material';
import { Shield as ShieldIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../contexts/permissionContextHook';

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Specialized error boundary for admin panel components
 * Handles permission errors and admin-specific issues
 */
const AdminErrorFallback: React.FC<{ error: Error; onRetry: () => void }> = ({
  error,
  onRetry,
}) => {
  const navigate = useNavigate();
  const { isAdmin, refreshPermissions } = usePermissions();

  const isPermissionError =
    error.message.toLowerCase().includes('permission') ||
    error.message.toLowerCase().includes('forbidden') ||
    error.message.toLowerCase().includes('403');

  const handleRefreshPermissions = (): void => {
    refreshPermissions()
      .then(() => {
        onRetry();
      })
      .catch((err: unknown) => {
        console.error('Failed to refresh permissions:', err);
      });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" icon={<ShieldIcon />} sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Admin Access Error
        </Typography>
        <Typography variant="body2">
          {isPermissionError
            ? 'You do not have the required permissions to access this admin feature.'
            : 'An error occurred while loading the admin panel.'}
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        {isPermissionError ? (
          <>
            <Button variant="contained" onClick={handleRefreshPermissions} size="small">
              Refresh Permissions
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/dashboard')}
              size="small"
            >
              Go to Dashboard
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={onRetry} size="small">
            Try Again
          </Button>
        )}
      </Box>

      {!isAdmin && isPermissionError && (
        <Alert severity="info" sx={{ mt: 2 }}>
          If you believe you should have admin access, please contact your system administrator.
        </Alert>
      )}
    </Box>
  );
};

export const AdminErrorBoundary: React.FC<AdminErrorBoundaryProps> = ({ children }) => (
  <ErrorBoundary
    level="section"
    onError={(error, errorInfo) => {
      console.error('Admin Panel Error:', error);
      // Log admin errors with high priority
      if (error.message.includes('permission')) {
        console.warn('Permission error in admin panel:', errorInfo.componentStack);
      }
    }}
  >
    {(hasError, error, retry) =>
      hasError && error !== null ? <AdminErrorFallback error={error} onRetry={retry} /> : children
    }
  </ErrorBoundary>
);

export default AdminErrorBoundary;
