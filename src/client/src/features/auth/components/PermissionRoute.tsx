import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import { Box, CircularProgress, Alert, Typography, Button } from '@mui/material';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import { getToken } from '../../../shared/utils/authHelpers';
import useAuth from '../hooks/useAuth';
import type { Role, Permission } from './permissions.constants';

// ============================================================================
// Constants
// ============================================================================

const DEBUG = import.meta.env.DEV;

// Default empty arrays (defined outside component to avoid re-creation)
const DEFAULT_ROLES: string[] = [];
const DEFAULT_PERMISSIONS: string[] = [];

// ============================================================================
// Types
// ============================================================================

/**
 * Route configuration for PermissionRoute
 */
export interface PermissionRouteConfig {
  /** Required roles (any match grants access unless requireAll is true) */
  roles?: Role[] | string[];

  /** Required permissions (any match grants access unless requireAll is true) */
  permissions?: Permission[] | string[];

  /** If true, ALL roles AND permissions must match */
  requireAll?: boolean;

  /** Explicitly require authentication (no specific roles/permissions) */
  requireAuth?: boolean;

  /** Redirect path for unauthenticated users */
  redirectTo?: string;

  /** Redirect path for unauthorized users (missing roles/permissions) */
  unauthorizedRedirect?: string;

  /** Custom fallback component when access is denied */
  fallback?: React.ReactNode;

  /** Custom access check function */
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean;
}

interface PermissionRouteProps extends PermissionRouteConfig {
  /** Children to render (alternative to Outlet) */
  children?: React.ReactNode;
}

/**
 * Authorization status
 */
enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  UNAUTHORIZED = 'unauthorized',
}

interface AuthStatusResult {
  status: AuthStatus;
  reason?: string;
  details?: {
    required: string[];
    user: string[];
  };
}

// ============================================================================
// Authorization Helper Functions (extracted to reduce cognitive complexity)
// ============================================================================

type PermissionContextType = ReturnType<typeof usePermissions>;

/** Check authentication status when not authenticated */
const checkUnauthenticated = (): AuthStatusResult => {
  const hasStoredToken = Boolean(getToken());
  if (hasStoredToken) {
    if (DEBUG) console.debug('⏳ PermissionRoute: Token found but not authenticated - waiting');
    return { status: AuthStatus.LOADING, reason: 'Lade Benutzerdaten...' };
  }
  if (DEBUG) console.debug('🚫 PermissionRoute: No authentication found');
  return { status: AuthStatus.UNAUTHENTICATED, reason: 'Nicht angemeldet' };
};

/** Check user data availability */
const checkMissingUser = (): AuthStatusResult => {
  const hasStoredToken = Boolean(getToken());
  if (!hasStoredToken) {
    if (DEBUG) console.debug('⚠️ PermissionRoute: No user data and no token');
    return { status: AuthStatus.UNAUTHENTICATED, reason: 'Session abgelaufen' };
  }
  if (DEBUG) console.debug('⏳ PermissionRoute: Authenticated but no user data - waiting');
  return { status: AuthStatus.LOADING, reason: 'Lade Benutzerprofil...' };
};

/** Check custom access function */
const checkCustomAccess = (
  customCheck: PermissionRouteConfig['customCheck'],
  permissionContext: PermissionContextType,
  hasOtherRequirements: boolean
): AuthStatusResult | null => {
  if (!customCheck) return null;
  const hasAccess = customCheck(permissionContext);
  if (!hasAccess) {
    if (DEBUG) console.debug('🔐 PermissionRoute: Custom check failed');
    return { status: AuthStatus.UNAUTHORIZED, reason: 'Zugriff verweigert (Custom Check)' };
  }
  if (!hasOtherRequirements) return { status: AuthStatus.AUTHENTICATED };
  return null;
};

/** Check roles and return result */
const checkRolesAccess = (
  requiredRoles: string[],
  permissionContext: PermissionContextType,
  requireAll: boolean
): { hasRoles: boolean; earlyReturn: AuthStatusResult | null } => {
  if (requiredRoles.length === 0) return { hasRoles: true, earlyReturn: null };

  const hasRoles = requireAll
    ? permissionContext.hasAllRoles(...requiredRoles)
    : permissionContext.hasAnyRole(...requiredRoles);

  if (!hasRoles && requireAll) {
    if (DEBUG) console.debug('🔐 PermissionRoute: Role check failed (requireAll)');
    return {
      hasRoles: false,
      earlyReturn: {
        status: AuthStatus.UNAUTHORIZED,
        reason: 'Fehlende Rolle',
        details: { required: [...requiredRoles], user: permissionContext.roles },
      },
    };
  }
  return { hasRoles, earlyReturn: null };
};

/** Check permissions and return result */
const checkPermissionsAccess = (
  requiredPermissions: string[],
  permissionContext: PermissionContextType,
  requireAll: boolean
): { hasPermissions: boolean; earlyReturn: AuthStatusResult | null } => {
  if (requiredPermissions.length === 0) return { hasPermissions: true, earlyReturn: null };

  const hasPermissions = requireAll
    ? permissionContext.hasAllPermissions(...requiredPermissions)
    : permissionContext.hasAnyPermission(...requiredPermissions);

  if (!hasPermissions && requireAll) {
    if (DEBUG) console.debug('🔐 PermissionRoute: Permission check failed (requireAll)');
    return {
      hasPermissions: false,
      earlyReturn: {
        status: AuthStatus.UNAUTHORIZED,
        reason: 'Fehlende Berechtigung',
        details: { required: [...requiredPermissions], user: permissionContext.permissions },
      },
    };
  }
  return { hasPermissions, earlyReturn: null };
};

/** Build access denied result */
const buildAccessDenied = (
  requiredRoles: string[],
  requiredPermissions: string[],
  permissionContext: PermissionContextType
): AuthStatusResult => {
  if (DEBUG) console.debug('🔐 PermissionRoute: Access denied');
  return {
    status: AuthStatus.UNAUTHORIZED,
    reason: 'Zugriff verweigert',
    details: {
      required: [...requiredRoles, ...requiredPermissions],
      user: [...permissionContext.roles, ...permissionContext.permissions],
    },
  };
};

// ============================================================================
// Authorization Hook
// ============================================================================

/**
 * Hook for authorization logic
 * Centralized auth checking for any route protection scenario
 */
const useAuthorizationStatus = (config: PermissionRouteConfig): AuthStatusResult => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const permissionContext = usePermissions();

  const {
    roles: requiredRoles = DEFAULT_ROLES,
    permissions: requiredPermissions = DEFAULT_PERMISSIONS,
    requireAll = false,
    requireAuth = false,
    customCheck,
  } = config;

  return useMemo(() => {
    // Step 1: Auth loading
    if (authLoading) {
      return { status: AuthStatus.LOADING, reason: 'Überprüfe Berechtigung...' };
    }

    // Step 2: Check authentication
    if (!isAuthenticated) return checkUnauthenticated();

    // Step 3: Check user data
    if (!user) return checkMissingUser();

    // Step 4: Permissions loading
    const hasRequirements = requiredRoles.length > 0 || requiredPermissions.length > 0;
    const needsPermissionCheck = hasRequirements || customCheck !== undefined;
    if (permissionContext.loading && needsPermissionCheck) {
      return { status: AuthStatus.LOADING, reason: 'Lade Berechtigungen...' };
    }

    // Step 5: Auth-only check (no roles/permissions/customCheck)
    if (requireAuth && !needsPermissionCheck) {
      return { status: AuthStatus.AUTHENTICATED };
    }

    // Step 6: Custom check
    const customResult = checkCustomAccess(customCheck, permissionContext, hasRequirements);
    if (customResult !== null) return customResult;

    // Step 7: Role check
    const roleCheck = checkRolesAccess(requiredRoles, permissionContext, requireAll);
    if (roleCheck.earlyReturn !== null) return roleCheck.earlyReturn;

    // Step 8: Permission check
    const permCheck = checkPermissionsAccess(requiredPermissions, permissionContext, requireAll);
    if (permCheck.earlyReturn !== null) return permCheck.earlyReturn;

    // Step 9: Final access - no requirements means authenticated
    if (!hasRequirements) return { status: AuthStatus.AUTHENTICATED };

    // Determine if user has access based on requireAll flag
    const hasAccess = requireAll
      ? roleCheck.hasRoles && permCheck.hasPermissions
      : roleCheck.hasRoles || permCheck.hasPermissions;

    return hasAccess
      ? { status: AuthStatus.AUTHENTICATED }
      : buildAccessDenied(requiredRoles, requiredPermissions, permissionContext);
  }, [
    authLoading,
    isAuthenticated,
    user,
    permissionContext,
    requiredRoles,
    requiredPermissions,
    requireAll,
    requireAuth,
    customCheck,
  ]);
};

// ============================================================================
// Access Denied Component (defined before PermissionRoute to avoid use-before-define)
// ============================================================================

interface AccessDeniedProps {
  roles: string[];
  permissions: string[];
  reason?: string;
  details?: {
    required: string[];
    user: string[];
  };
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ roles, permissions, reason, details }) => (
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
      Zugriff verweigert
    </Typography>

    <Alert severity="error" sx={{ maxWidth: 600 }}>
      <Typography variant="body1" gutterBottom>
        {reason ?? 'Sie haben nicht die erforderlichen Berechtigungen für diese Seite.'}
      </Typography>

      {roles.length > 0 && (
        <Box mt={2}>
          <Typography variant="body2">
            <strong>Erforderliche Rollen:</strong> {roles.join(', ')}
          </Typography>
        </Box>
      )}

      {permissions.length > 0 && (
        <Box mt={1}>
          <Typography variant="body2">
            <strong>Erforderliche Berechtigungen:</strong> {permissions.join(', ')}
          </Typography>
        </Box>
      )}

      {DEBUG && details ? (
        <Box mt={2} sx={{ opacity: 0.7 }}>
          <Typography variant="caption" component="div">
            <strong>Debug Info:</strong>
          </Typography>
          <Typography variant="caption" component="div">
            Required: {details.required.join(', ')}
          </Typography>
          <Typography variant="caption" component="div">
            User has: {details.user.join(', ') || 'none'}
          </Typography>
        </Box>
      ) : null}
    </Alert>

    <Box display="flex" gap={2}>
      <Button variant="contained" href="/">
        Zur Startseite
      </Button>
      <Button
        variant="outlined"
        onClick={() => {
          window.history.back();
        }}
      >
        Zurück
      </Button>
    </Box>
  </Box>
);

// ============================================================================
// Component
// ============================================================================

/**
 * PermissionRoute - Unified route protection component
 *
 * Replaces both PrivateRoute and the old AdminRoute.
 * Handles authentication, roles, and permissions in one component.
 *
 * @example
 * // Just authentication (any logged-in user)
 * <PermissionRoute requireAuth>
 *   <Dashboard />
 * </PermissionRoute>
 *
 * @example
 * // Role-based (any of the roles)
 * <PermissionRoute roles={['Admin', 'SuperAdmin']}>
 *   <AdminPanel />
 * </PermissionRoute>
 *
 * @example
 * // Permission-based (any of the permissions)
 * <PermissionRoute permissions={['users:view_all']}>
 *   <UserList />
 * </PermissionRoute>
 *
 * @example
 * // Strict mode (ALL roles AND permissions required)
 * <PermissionRoute
 *   roles={['Admin']}
 *   permissions={['users:manage', 'users:delete']}
 *   requireAll
 * >
 *   <UserManagement />
 * </PermissionRoute>
 *
 * @example
 * // Custom check
 * <PermissionRoute
 *   customCheck={(perms) => perms.hasPermission('special') && someCondition}
 * >
 *   <SpecialPage />
 * </PermissionRoute>
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  roles = DEFAULT_ROLES,
  permissions = DEFAULT_PERMISSIONS,
  requireAll = false,
  requireAuth = false,
  redirectTo = '/auth/login',
  unauthorizedRedirect,
  fallback,
  customCheck,
  children,
}) => {
  const location = useLocation();

  // Determine if any protection is needed
  const hasProtection =
    requireAuth || roles.length > 0 || permissions.length > 0 || customCheck !== undefined;

  // Get authorization status
  const authStatus = useAuthorizationStatus({
    roles,
    permissions,
    requireAll,
    requireAuth: hasProtection, // If any protection, require auth
    customCheck,
  });

  // Development logging
  if (DEBUG && authStatus.status === AuthStatus.UNAUTHORIZED) {
    console.warn(`[PermissionRoute] Access denied for ${location.pathname}`, authStatus.details);
  }

  // Render based on status
  switch (authStatus.status) {
    case AuthStatus.LOADING:
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress />
          {authStatus.reason ? (
            <Typography variant="body2" color="text.secondary">
              {authStatus.reason}
            </Typography>
          ) : null}
        </Box>
      );

    case AuthStatus.UNAUTHENTICATED:
      return <Navigate to={redirectTo} state={{ from: location }} replace />;

    case AuthStatus.UNAUTHORIZED:
      // Use custom fallback if provided
      if (fallback !== undefined) {
        return <>{fallback}</>;
      }

      // Redirect if specified
      if (unauthorizedRedirect) {
        return (
          <Navigate
            to={unauthorizedRedirect}
            state={{ from: location, reason: authStatus.reason }}
            replace
          />
        );
      }

      // Default: Show access denied page
      return (
        <AccessDenied
          roles={roles}
          permissions={permissions}
          reason={authStatus.reason}
          details={authStatus.details}
        />
      );

    case AuthStatus.AUTHENTICATED:
      return children === undefined ? <Outlet /> : <>{children}</>;

    default:
      return null;
  }
};

// ============================================================================
// Convenience Components (Aliases)
// ============================================================================

/**
 * Route requiring authentication only (no specific roles/permissions)
 * @deprecated Use PermissionRoute with requireAuth instead
 */
export const PrivateRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, redirectTo }) => (
  <PermissionRoute requireAuth redirectTo={redirectTo}>
    {children}
  </PermissionRoute>
);

/**
 * Admin-only route (Admin or SuperAdmin)
 */
export const AdminRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
  unauthorizedRedirect?: string;
}> = ({ children, redirectTo, unauthorizedRedirect = '/forbidden' }) => (
  <PermissionRoute
    roles={['Admin', 'SuperAdmin']}
    redirectTo={redirectTo}
    unauthorizedRedirect={unauthorizedRedirect}
  >
    {children}
  </PermissionRoute>
);

/**
 * SuperAdmin-only route
 */
export const SuperAdminRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
  unauthorizedRedirect?: string;
}> = ({ children, redirectTo, unauthorizedRedirect = '/forbidden' }) => (
  <PermissionRoute
    roles={['SuperAdmin']}
    redirectTo={redirectTo}
    unauthorizedRedirect={unauthorizedRedirect}
  >
    {children}
  </PermissionRoute>
);

/**
 * Moderator-only route (includes Admin and SuperAdmin)
 */
export const ModeratorRoute: React.FC<{
  children?: React.ReactNode;
  redirectTo?: string;
  unauthorizedRedirect?: string;
}> = ({ children, redirectTo, unauthorizedRedirect = '/forbidden' }) => (
  <PermissionRoute
    roles={['Moderator', 'Admin', 'SuperAdmin']}
    redirectTo={redirectTo}
    unauthorizedRedirect={unauthorizedRedirect}
  >
    {children}
  </PermissionRoute>
);

// ============================================================================
// Exports
// ============================================================================

export default PermissionRoute;
export type { PermissionRouteProps };
