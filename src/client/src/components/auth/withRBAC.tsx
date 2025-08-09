import React, { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { usePermissions } from '../../contexts/PermissionContext';
import { useAuth } from '../../hooks/useAuth';
import LockIcon from '@mui/icons-material/Lock';

export interface RBACOptions {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
  loadingComponent?: React.ReactNode;
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean;
}

/**
 * Higher-Order Component for Role-Based Access Control
 * Wraps a component and checks if the user has the required roles/permissions
 * 
 * @param Component - The component to protect
 * @param options - RBAC configuration options
 * 
 * @example
 * // Require Admin role
 * const AdminPanel = withRBAC(Panel, { roles: ['Admin'] });
 * 
 * @example
 * // Require specific permissions
 * const UserManager = withRBAC(UserList, { 
 *   permissions: ['users.view', 'users.manage'],
 *   requireAll: true 
 * });
 * 
 * @example
 * // Custom check
 * const SpecialComponent = withRBAC(Component, {
 *   customCheck: (perms) => perms.isAdmin || perms.hasPermission('special.access')
 * });
 */
export function withRBAC<P extends object>(
  Component: ComponentType<P>,
  options: RBACOptions = {}
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const permissions = usePermissions();
    const { isAuthenticated } = useAuth();
    const {
      roles = [],
      permissions: requiredPermissions = [],
      requireAll = false,
      fallback,
      redirectTo,
      showError = true,
      loadingComponent,
      customCheck
    } = options;

    // Show loading state while permissions are being fetched
    if (permissions.loading) {
      if (loadingComponent) {
        return <>{loadingComponent}</>;
      }
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="400px"
          gap={2}
        >
          <LockIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography variant="h5" color="text.secondary">
            Authentication Required
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please log in to access this content
          </Typography>
          <Button variant="contained" href="/login">
            Go to Login
          </Button>
        </Box>
      );
    }

    // Perform custom check if provided
    if (customCheck) {
      const hasAccess = customCheck(permissions);
      if (!hasAccess) {
        return renderAccessDenied();
      }
      return <Component {...props} />;
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
    const hasAccess = requireAll 
      ? hasRequiredRoles && hasRequiredPermissions
      : hasRequiredRoles || hasRequiredPermissions;

    if (!hasAccess) {
      return renderAccessDenied();
    }

    // User has access, render the component
    return <Component {...props} />;

    function renderAccessDenied() {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Redirect if specified
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }

      // Show error message
      if (showError) {
        return (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="400px"
            gap={2}
            p={3}
          >
            <LockIcon sx={{ fontSize: 60, color: 'error.main' }} />
            <Typography variant="h5" color="error">
              Access Denied
            </Typography>
            <Alert severity="error" sx={{ maxWidth: 500 }}>
              <Typography variant="body2">
                You don't have the required permissions to access this page.
                {roles.length > 0 && (
                  <Box mt={1}>
                    <strong>Required roles:</strong> {roles.join(', ')}
                  </Box>
                )}
                {requiredPermissions.length > 0 && (
                  <Box mt={1}>
                    <strong>Required permissions:</strong> {requiredPermissions.join(', ')}
                  </Box>
                )}
              </Typography>
            </Alert>
            <Button variant="outlined" href="/">
              Go to Home
            </Button>
          </Box>
        );
      }

      // Silent denial - render nothing
      return null;
    }
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withRBAC(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * Component for conditional rendering based on permissions
 * Use this for inline permission checks
 * 
 * @example
 * <PermissionGate roles={['Admin']}>
 *   <AdminButton />
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate permissions={['users.delete']} fallback={<DisabledButton />}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<{
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean;
}> = ({ 
  children, 
  roles = [], 
  permissions: requiredPermissions = [], 
  requireAll = false,
  fallback = null,
  customCheck
}) => {
  const permissions = usePermissions();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Perform custom check if provided
  if (customCheck) {
    return customCheck(permissions) ? <>{children}</> : <>{fallback}</>;
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
  const hasAccess = requireAll 
    ? hasRequiredRoles && hasRequiredPermissions
    : hasRequiredRoles || hasRequiredPermissions;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook for checking permissions programmatically
 * 
 * @example
 * const canDelete = usePermissionCheck({ permissions: ['users.delete'] });
 * 
 * @example
 * const isAdmin = usePermissionCheck({ roles: ['Admin'] });
 */
export const usePermissionCheck = (options: {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean;
}): boolean => {
  const permissions = usePermissions();
  const { isAuthenticated } = useAuth();
  const {
    roles = [],
    permissions: requiredPermissions = [],
    requireAll = false,
    customCheck
  } = options;

  if (!isAuthenticated) {
    return false;
  }

  // Perform custom check if provided
  if (customCheck) {
    return customCheck(permissions);
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
  return requireAll 
    ? hasRequiredRoles && hasRequiredPermissions
    : hasRequiredRoles || hasRequiredPermissions;
};

export default withRBAC;