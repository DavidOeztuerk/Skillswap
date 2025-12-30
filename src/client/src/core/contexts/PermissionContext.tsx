import React, { useCallback, useRef, useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { isSuccessResponse } from '../../shared/types/api/UnifiedResponse';
import { decodeToken, getToken } from '../../shared/utils/authHelpers';
import { withDefault } from '../../shared/utils/safeAccess';
import { apiClient } from '../api/apiClient';
import {
  PermissionContext,
  type PermissionContextType,
  type Permission,
  type GrantPermissionOptions,
} from './permissionContextValue';

// ============================================================================
// Types (local - API response only)
// ============================================================================

interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: Permission[];
  permissionNames: string[];
  permissionsByCategory: Record<string, string[]>;
  cachedAt: string;
  cacheExpirationMinutes: number;
}

// ============================================================================
// Constants
// ============================================================================

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_PERMISSIONS === 'true';
const log = DEBUG ? console.debug.bind(console) : () => {};
const ADMIN_ROLES: [string, string] = ['Admin', 'SuperAdmin'];
const INSUFFICIENT_PERMISSIONS_ERROR = 'Insufficient permissions';

// Helper to extract permissions from token
interface TokenPayload {
  roles?: string[];
  authorities?: string[];
  permissions?: string[];
}

function extractPermissionsFromToken(): { roles: string[]; permissions: string[] } | null {
  const token = getToken();
  const payload = token ? (decodeToken(token) as TokenPayload | null) : null;

  if (!payload) return null;

  const tokenRoles = payload.roles ?? payload.authorities ?? [];
  const tokenPerms = payload.permissions ?? [];

  return {
    roles: Array.isArray(tokenRoles) ? tokenRoles : [],
    permissions: Array.isArray(tokenPerms) ? tokenPerms : [],
  };
}

// ============================================================================
// Provider
// ============================================================================

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = memo(({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // State
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissionDetails, setPermissionDetails] = useState<Permission[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for preventing loops and rate limiting
  const lastFetchTimeRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const prevAuthStateRef = useRef<{ isAuthenticated: boolean; userId: string | null }>({
    isAuthenticated: false,
    userId: null,
  });

  // =========================================================================
  // Fetch Permissions
  // =========================================================================
  const fetchPermissions = useCallback(
    async (force: boolean): Promise<boolean> => {
      // Gate on authentication
      if (!isAuthenticated || !getToken()) {
        return false;
      }

      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        log('⏳ PermissionContext: Already fetching, skipping...');
        return true;
      }

      // Rate limiting (unless forced)
      if (!force && lastFetchTimeRef.current !== null) {
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        if (timeSinceLastFetch < RATE_LIMIT_MS) {
          log(
            `⏳ PermissionContext: Rate limited, ${Math.round((RATE_LIMIT_MS - timeSinceLastFetch) / 1000)}s remaining`
          );
          return true;
        }
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        log('🚀 PermissionContext: Fetching permissions from API...');

        const resp = await apiClient.get<UserPermissions>('/api/users/permissions/my');

        if (!mountedRef.current) return false;

        if (isSuccessResponse(resp)) {
          const permissionNames = withDefault(resp.data.permissionNames, []);
          const fetchedRoles = withDefault(resp.data.roles, []);

          log('✅ PermissionContext: API fetch successful', {
            permissionCount: permissionNames.length,
            roleCount: fetchedRoles.length,
          });

          setPermissions(permissionNames);
          setRoles(fetchedRoles);
          setPermissionDetails(withDefault(resp.data.permissions, []));
          setPermissionsByCategory(withDefault(resp.data.permissionsByCategory, {}));
          setError(null);
          // eslint-disable-next-line require-atomic-updates
          lastFetchTimeRef.current = Date.now();
          return true;
        }

        console.error('❌ PermissionContext: API returned failure', resp);
        setError(resp.message ?? 'Failed to load permissions');
        return false;
      } catch {
        if (!mountedRef.current) return false;

        console.warn('⚠️ PermissionContext: API call failed, using token fallback');

        // Fallback to token-based permissions
        const tokenData = extractPermissionsFromToken();

        if (tokenData === null) {
          console.error('❌ PermissionContext: No valid token for fallback');
          setRoles([]);
          setPermissions([]);
          setError('Failed to load permissions - no valid token');
        } else {
          log('🔄 PermissionContext: Token fallback', {
            roles: tokenData.roles.length,
            permissions: tokenData.permissions.length,
          });

          setRoles(tokenData.roles);
          setPermissions(tokenData.permissions);
          setError(`API unavailable, using token fallback (${tokenData.roles.length} roles)`);
        }

        return false;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        // eslint-disable-next-line require-atomic-updates
        isFetchingRef.current = false;
      }
    },
    [isAuthenticated]
  );

  // =========================================================================
  // Cleanup on unmount
  // =========================================================================
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =========================================================================
  // Auto-fetch on Authentication Change
  // =========================================================================
  useEffect(() => {
    const executeAuthCheck = async (): Promise<void> => {
      const currentUserId = user?.id ?? null;
      const prevState = prevAuthStateRef.current;

      // Skip if nothing actually changed
      if (prevState.isAuthenticated === isAuthenticated && prevState.userId === currentUserId) {
        return;
      }

      // Update ref before processing
      prevAuthStateRef.current = { isAuthenticated, userId: currentUserId };

      // User logged in
      if (isAuthenticated && currentUserId) {
        if (lastUserIdRef.current !== currentUserId) {
          log('🔑 PermissionContext: User changed, fetching permissions');
          lastUserIdRef.current = currentUserId;
          await fetchPermissions(true);
        }
      }
      // User logged out
      else if (!isAuthenticated && prevState.isAuthenticated) {
        log('🧹 PermissionContext: User logged out, clearing permissions');
        setPermissions([]);
        setRoles([]);
        setPermissionDetails([]);
        setPermissionsByCategory({});
        setError(null);
        lastFetchTimeRef.current = null;
        lastUserIdRef.current = null;
      }
    };

    executeAuthCheck().catch(() => {});
  }, [isAuthenticated, user?.id, fetchPermissions]);

  // =========================================================================
  // Permission Checks (memoized)
  // =========================================================================
  const hasPermission = useCallback(
    (perm: string, resourceId?: string): boolean => {
      if (!perm) return false;

      // Direct match
      if (permissions.includes(perm)) return true;

      // Scoped permission check
      if (resourceId) {
        const scoped = `${perm}:${resourceId}`;
        if (permissions.includes(scoped)) return true;
      }

      // Wildcard check (e.g., "users.*" matches "users.read")
      const parts = perm.split('.');
      for (let i = parts.length - 1; i > 0; i--) {
        const wildcard = `${parts.slice(0, i).join('.')}.*`;
        if (permissions.includes(wildcard)) return true;
      }

      return false;
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...perms: string[]) => perms.some((p) => hasPermission(p)),
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (...perms: string[]) => perms.every((p) => hasPermission(p)),
    [hasPermission]
  );

  // =========================================================================
  // Role Checks (memoized)
  // =========================================================================
  const hasRole = useCallback(
    (role: string): boolean => {
      const normalizedRole = role.toLowerCase();
      return roles.some((r) => r.toLowerCase() === normalizedRole);
    },
    [roles]
  );

  const hasAnyRole = useCallback((...rs: string[]) => rs.some((r) => hasRole(r)), [hasRole]);

  const hasAllRoles = useCallback((...rs: string[]) => rs.every((r) => hasRole(r)), [hasRole]);

  const canAccessResource = useCallback(
    (resourceType: string, resourceId: string, action: string) =>
      hasPermission(`${resourceType}.${action}`, resourceId),
    [hasPermission]
  );

  // =========================================================================
  // Admin Operations (memoized)
  // =========================================================================
  const grantPermission = useCallback(
    async (userId: string, permission: string, options?: GrantPermissionOptions) => {
      if (!hasAnyRole(...ADMIN_ROLES)) {
        throw new Error(INSUFFICIENT_PERMISSIONS_ERROR);
      }
      await apiClient.post('/api/permission/grant', {
        userId,
        permissionName: permission,
        expiresAt: options?.expiresAt,
        resourceId: options?.resourceId,
        reason: options?.reason,
      });
      if (userId === user?.id) await fetchPermissions(true);
    },
    [hasAnyRole, user?.id, fetchPermissions]
  );

  const revokePermission = useCallback(
    async (userId: string, permission: string, reason?: string) => {
      if (!hasAnyRole(...ADMIN_ROLES)) {
        throw new Error(INSUFFICIENT_PERMISSIONS_ERROR);
      }
      await apiClient.post('/api/permission/revoke', {
        userId,
        permissionName: permission,
        reason,
      });
      if (userId === user?.id) await fetchPermissions(true);
    },
    [hasAnyRole, user?.id, fetchPermissions]
  );

  const assignRole = useCallback(
    async (userId: string, role: string, reason?: string) => {
      if (!hasAnyRole(...ADMIN_ROLES)) {
        throw new Error(INSUFFICIENT_PERMISSIONS_ERROR);
      }
      await apiClient.post('/api/permission/assign-role', {
        userId,
        roleName: role,
        reason,
      });
      if (userId === user?.id) await fetchPermissions(true);
    },
    [hasAnyRole, user?.id, fetchPermissions]
  );

  const removeRole = useCallback(
    async (userId: string, role: string, reason?: string) => {
      if (!hasAnyRole(...ADMIN_ROLES)) {
        throw new Error(INSUFFICIENT_PERMISSIONS_ERROR);
      }
      await apiClient.post('/api/permission/remove-role', {
        userId,
        roleName: role,
        reason,
      });
      if (userId === user?.id) await fetchPermissions(true);
    },
    [hasAnyRole, user?.id, fetchPermissions]
  );

  // =========================================================================
  // Refresh wrapper
  // =========================================================================
  const refreshPermissions = useCallback(() => fetchPermissions(true), [fetchPermissions]);

  // =========================================================================
  // Derived State (memoized)
  // =========================================================================
  const isAdmin = useMemo(() => hasAnyRole(...ADMIN_ROLES), [hasAnyRole]);
  const isSuperAdmin = useMemo(() => hasRole('SuperAdmin'), [hasRole]);
  const isModerator = useMemo(() => hasRole('Moderator') || isAdmin, [hasRole, isAdmin]);

  // =========================================================================
  // Context Value (CRITICAL: must be memoized!)
  // =========================================================================
  const value = useMemo<PermissionContextType>(
    () => ({
      // State
      permissions,
      roles,
      permissionDetails,
      permissionsByCategory,
      loading,
      error,

      // Permission checks
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      canAccessResource,

      // Admin operations
      grantPermission,
      revokePermission,
      assignRole,
      removeRole,

      // Refresh
      refreshPermissions,

      // Derived state
      isAdmin,
      isSuperAdmin,
      isModerator,
    }),
    [
      // State
      permissions,
      roles,
      permissionDetails,
      permissionsByCategory,
      loading,
      error,
      // Functions (all are useCallback, so stable)
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      canAccessResource,
      grantPermission,
      revokePermission,
      assignRole,
      removeRole,
      refreshPermissions,
      // Derived (memoized)
      isAdmin,
      isSuperAdmin,
      isModerator,
    ]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
});

PermissionProvider.displayName = 'PermissionProvider';

export default PermissionContext;
