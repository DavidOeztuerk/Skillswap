import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useAsyncEffect } from '../hooks/useAsyncEffect';
import { useAuth } from '../hooks/useAuth';
import { withDefault } from '../utils/safeAccess';
import { decodeToken, getToken } from '../utils/authHelpers';
import { apiClient } from '../api/apiClient';
import { isSuccessResponse } from '../types/api/UnifiedResponse';
import { PermissionContext, type PermissionContextType } from './permissionContextValue';

// ============================================================================
// Types (local)
// ============================================================================

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
  resource: string;
  isSystemPermission: boolean;
  isActive: boolean;
  expiresAt?: string;
  resourceId?: string;
  source: string;
}

interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: Permission[];
  permissionNames: string[];
  permissionsByCategory: Record<string, string[]>;
  cachedAt: string;
  cacheExpirationMinutes: number;
}

interface GrantPermissionOptions {
  expiresAt?: Date;
  resourceId?: string;
  reason?: string;
}

// ============================================================================
// Constants
// ============================================================================

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_PERMISSIONS === 'true';

// ============================================================================
// Provider
// ============================================================================

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
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
    async (force = false): Promise<boolean> => {
      // Gate on authentication
      if (!isAuthenticated || !getToken()) {
        return false;
      }

      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        if (DEBUG) console.debug('⏳ PermissionContext: Already fetching, skipping...');
        return true;
      }

      // Rate limiting (unless forced)
      if (!force && lastFetchTimeRef.current !== null) {
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        if (timeSinceLastFetch < RATE_LIMIT_MS) {
          if (DEBUG) {
            console.debug(
              `⏳ PermissionContext: Rate limited, ${String(Math.round((RATE_LIMIT_MS - timeSinceLastFetch) / 1000))}s remaining`
            );
          }
          return true;
        }
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        if (DEBUG) console.debug('🚀 PermissionContext: Fetching permissions from API...');

        const resp = await apiClient.get<UserPermissions>('/api/users/permissions/my');

        if (!mountedRef.current) return false;

        if (isSuccessResponse(resp)) {
          const permissionNames = withDefault(resp.data.permissionNames, []);
          const fetchedRoles = withDefault(resp.data.roles, []);

          if (DEBUG) {
            console.debug('✅ PermissionContext: API fetch successful', {
              permissionCount: permissionNames.length,
              roleCount: fetchedRoles.length,
            });
          }

          setPermissions(permissionNames);
          setRoles(fetchedRoles);
          setPermissionDetails(withDefault(resp.data.permissions, []));
          setPermissionsByCategory(withDefault(resp.data.permissionsByCategory, {}));
          setError(null);
          lastFetchTimeRef.current = Date.now();
          return true;
        }

        console.error('❌ PermissionContext: API returned failure', resp);
        setError(resp.message ?? 'Failed to load permissions');
        return false;
      } catch (e) {
        if (!mountedRef.current) return false;

        console.warn('⚠️ PermissionContext: API call failed, using token fallback', e);

        // Fallback to token-based permissions
        const token = getToken();
        const payload = token ? decodeToken(token) : null;

        if (payload) {
          const tokenRoles = payload.roles ?? payload.authorities ?? [];
          const tokenPerms = payload.permissions ?? [];

          if (DEBUG) {
            console.debug('🔄 PermissionContext: Token fallback', {
              roles: tokenRoles.length,
              permissions: tokenPerms.length,
            });
          }

          setRoles(Array.isArray(tokenRoles) ? tokenRoles : []);
          setPermissions(Array.isArray(tokenPerms) ? tokenPerms : []);
          setError(`API unavailable, using token fallback (${String(tokenRoles.length)} roles)`);
        } else {
          console.error('❌ PermissionContext: No valid token for fallback');
          setRoles([]);
          setPermissions([]);
          setError('Failed to load permissions - no valid token');
        }

        return false;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
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
  useAsyncEffect(async () => {
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
      // Only fetch if user changed or first time
      if (lastUserIdRef.current !== currentUserId) {
        if (DEBUG) console.debug('🔑 PermissionContext: User changed, fetching permissions');
        lastUserIdRef.current = currentUserId;
        await fetchPermissions(true); // Force fetch for new user
      }
    }
    // User logged out
    else if (!isAuthenticated && prevState.isAuthenticated) {
      // Only clear if we were previously authenticated (actual logout)
      if (DEBUG) console.debug('🧹 PermissionContext: User logged out, clearing permissions');
      setPermissions([]);
      setRoles([]);
      setPermissionDetails([]);
      setPermissionsByCategory({});
      setError(null);
      lastFetchTimeRef.current = null;
      lastUserIdRef.current = null;
    }
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
      if (!hasAnyRole('Admin', 'SuperAdmin')) {
        throw new Error('Insufficient permissions');
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
      if (!hasAnyRole('Admin', 'SuperAdmin')) {
        throw new Error('Insufficient permissions');
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
      if (!hasAnyRole('Admin', 'SuperAdmin')) {
        throw new Error('Insufficient permissions');
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
      if (!hasAnyRole('Admin', 'SuperAdmin')) {
        throw new Error('Insufficient permissions');
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
  const isAdmin = useMemo(() => hasAnyRole('Admin', 'SuperAdmin'), [hasAnyRole]);
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
};

export default PermissionContext;
