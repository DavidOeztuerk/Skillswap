import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionContext';
import { useAuth } from '../../hooks/useAuth';
import { Box, CircularProgress, Alert, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface PermissionRouteProps {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean;
}

/**
 * Protected route component that checks for roles and permissions
 * 
 * @example
 * // In your router configuration
 * <Route element={<PermissionRoute roles={['Admin']} />}>
 *   <Route path="/admin" element={<AdminDashboard />} />
 *   <Route path="/admin/users" element={<UserManagement />} />
 * </Route>
 * 
 * @example
 * // With permissions
 * <Route 
 *   path="/users/manage" 
 *   element={
 *     <PermissionRoute 
 *       permissions={['users.view', 'users.manage']}
 *       requireAll={true}
 *     />
 *   }
 * >
 *   <Route index element={<UserList />} />
 * </Route>
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  roles = [],
  permissions: requiredPermissions = [],
  requireAll = false,
  redirectTo = '/',
  fallback,
  children,
  customCheck
}) => {
  const permissions = usePermissions();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Show loading while auth or permissions are loading
  if (authLoading || permissions.loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Perform custom check if provided
  if (customCheck) {
    const hasAccess = customCheck(permissions);
    if (!hasAccess) {
      return renderAccessDenied();
    }
    return children ? <>{children}</> : <Outlet />;
  }

  // Check roles
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    hasRequiredRoles = requireAll 
      ? permissions.hasAllRoles(...roles)
      : permissions.hasAnyRole(...roles);
  }

  // Check permissions
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? permissions.hasAllPermissions(...requiredPermissions)
      : permissions.hasAnyPermission(...requiredPermissions);
  }

  // Determine if user has access
  const hasAccess = roles.length === 0 && requiredPermissions.length === 0 
    ? true // No requirements specified, allow access
    : requireAll 
      ? hasRequiredRoles && hasRequiredPermissions
      : hasRequiredRoles || hasRequiredPermissions;

  if (!hasAccess) {
    return renderAccessDenied();
  }

  // User has access, render children or outlet
  return children ? <>{children}</> : <Outlet />;

  function renderAccessDenied() {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Redirect if specified
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Default access denied page
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        gap={3}
        p={3}
      >
        <LockIcon sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="body1" gutterBottom>
            You don't have the required permissions to access this page.
          </Typography>
          {roles.length > 0 && (
            <Box mt={2}>
              <Typography variant="body2">
                <strong>Required roles:</strong> {roles.join(', ')}
              </Typography>
            </Box>
          )}
          {requiredPermissions.length > 0 && (
            <Box mt={1}>
              <Typography variant="body2">
                <strong>Required permissions:</strong> {requiredPermissions.join(', ')}
              </Typography>
            </Box>
          )}
        </Alert>
        <Box display="flex" gap={2}>
          <Button variant="contained" href="/">
            Go to Home
          </Button>
          <Button variant="outlined" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }
};

/**
 * Admin-only route
 */
export const AdminRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => {
  return (
    <PermissionRoute 
      roles={['Admin', 'SuperAdmin']} 
      redirectTo={redirectTo}
    >
      {children}
    </PermissionRoute>
  );
};

/**
 * Moderator-only route (includes Admin and SuperAdmin)
 */
export const ModeratorRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => {
  return (
    <PermissionRoute 
      roles={['Moderator', 'Admin', 'SuperAdmin']} 
      redirectTo={redirectTo}
    >
      {children}
    </PermissionRoute>
  );
};

/**
 * SuperAdmin-only route
 */
export const SuperAdminRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => {
  return (
    <PermissionRoute 
      roles={['SuperAdmin']} 
      redirectTo={redirectTo}
    >
      {children}
    </PermissionRoute>
  );
};

/**
 * Route that requires specific permissions
 */
export const PermissionBasedRoute: React.FC<{
  permissions: string[];
  requireAll?: boolean;
  children?: React.ReactNode;
  redirectTo?: string;
}> = ({ permissions, requireAll = false, children, redirectTo }) => {
  return (
    <PermissionRoute 
      permissions={permissions}
      requireAll={requireAll}
      redirectTo={redirectTo}
    >
      {children}
    </PermissionRoute>
  );
};

export default PermissionRoute;