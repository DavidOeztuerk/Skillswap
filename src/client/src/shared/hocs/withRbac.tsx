import React, { type ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { usePermissions } from '../../core/contexts/permissionContextHook';
import useAuth from '../../features/auth/hooks/useAuth';
import type { PermissionContextType } from '../../core/contexts/permissionContextValue';

export interface RBACOptions {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
  loadingComponent?: React.ReactNode;
  customCheck?: (permissions: PermissionContextType) => boolean;
}

// Helper: Render loading state
function renderLoading(loadingComponent?: React.ReactNode): React.JSX.Element {
  if (loadingComponent !== undefined) {
    return <>{loadingComponent}</>;
  }
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );
}

// Helper: Render unauthenticated state
function renderUnauthenticated(redirectTo?: string): React.JSX.Element {
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

// Helper: Check access based on roles and permissions
function checkAccess(
  permissions: PermissionContextType,
  roles: string[],
  requiredPermissions: string[],
  requireAll: boolean
): boolean {
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    hasRequiredRoles = requireAll
      ? permissions.hasAllRoles(...roles)
      : permissions.hasAnyRole(...roles);
  }

  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? permissions.hasAllPermissions(...requiredPermissions)
      : permissions.hasAnyPermission(...requiredPermissions);
  }

  return requireAll
    ? hasRequiredRoles && hasRequiredPermissions
    : hasRequiredRoles || hasRequiredPermissions;
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
  options: RBACOptions
): ComponentType<P> {
  const WrappedComponent = (props: P): React.JSX.Element | null => {
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
      customCheck,
    } = options;

    // Show loading state while permissions are being fetched
    if (permissions.loading) {
      return renderLoading(loadingComponent);
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      return renderUnauthenticated(redirectTo);
    }

    // Perform custom check if provided
    if (customCheck !== undefined) {
      const hasAccess = customCheck(permissions);
      if (!hasAccess) {
        return renderAccessDenied();
      }
      return <Component {...props} />;
    }

    // Determine if user has access
    const hasAccess = checkAccess(permissions, roles, requiredPermissions, requireAll);

    if (!hasAccess) {
      return renderAccessDenied();
    }

    // User has access, render the component
    return <Component {...props} />;

    function renderAccessDenied(): React.JSX.Element | null {
      // Use custom fallback if provided
      if (fallback !== undefined) {
        return <>{fallback}</>;
      }

      // Redirect if specified
      if (redirectTo !== undefined) {
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
                You don&apos;t have the required permissions to access this page.
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
  const componentName = Component.displayName ?? Component.name;
  WrappedComponent.displayName = componentName
    ? `withRBAC(${componentName})`
    : 'withRBAC(Component)';

  return WrappedComponent;
}
