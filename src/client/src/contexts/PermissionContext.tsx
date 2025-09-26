import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect
} from "react";
import { useAuth } from "../hooks/useAuth";
import { withDefault } from "../utils/safeAccess";
import { decodeToken, getToken } from "../utils/authHelpers";
import { apiClient } from "../api/apiClient";
import { ApiResponse, isSuccessResponse } from "../types/api/UnifiedResponse";

// ---- Types ----
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

interface PermissionContextType {
  permissions: string[];
  roles: string[];
  permissionDetails: Permission[];
  permissionsByCategory: Record<string, string[]>;
  loading: boolean;
  error: string | null;

  hasPermission: (permission: string, resourceId?: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  hasAllRoles: (...roles: string[]) => boolean;
  canAccessResource: (resourceType: string, resourceId: string, action: string) => boolean;

  grantPermission: (userId: string, permission: string, options?: GrantPermissionOptions) => Promise<void>;
  revokePermission: (userId: string, permission: string, reason?: string) => Promise<void>;
  assignRole: (userId: string, role: string, reason?: string) => Promise<void>;
  removeRole: (userId: string, role: string, reason?: string) => Promise<void>;

  refreshPermissions: () => Promise<boolean>;

  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
}

// ---- Context + hook ----
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissions must be used within a PermissionProvider");
  return ctx;
};

// ---- Provider ----
interface PermissionProviderProps { children: React.ReactNode; }

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissionDetails, setPermissionDetails] = useState<Permission[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchTime = useRef<number | null>(null);

  const RATE_LIMIT_MS = 5 * 60 * 1000; // 5min

  const fetchPermissionsRef = useRef<(force?: boolean) => Promise<boolean>>(() => Promise.resolve(false));
  
  fetchPermissionsRef.current = async (force = false): Promise<boolean> => {
    if (!isAuthenticated || !getToken()) {
      return false; // gate on token, nicht auf user
    }

    if (!force && lastFetchTime.current && Date.now() - lastFetchTime.current < RATE_LIMIT_MS) {
      return true;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 PermissionContext: Fetching permissions from API...');
      const resp = await apiClient.get<UserPermissions>("/api/users/permissions/my");
      
      if (isSuccessResponse(resp)) {
        const permissionNames = withDefault(resp.data.permissionNames, []);
        const roles = withDefault(resp.data.roles, []);
        
        console.log('✅ PermissionContext: API fetch successful', { 
          permissionCount: permissionNames.length, 
          roleCount: roles.length,
          permissions: permissionNames,
          roles: roles 
        });
        
        setPermissions(permissionNames);
        setRoles(roles);
        setPermissionDetails(withDefault(resp.data.permissions, []));
        setPermissionsByCategory(withDefault(resp.data.permissionsByCategory, {}));
        setError(null);
        lastFetchTime.current = Date.now();
        return true;
      }
      
      console.error('❌ PermissionContext: API returned failure', resp);
      setError(resp?.message ?? "Failed to load permissions");
      return false;
    } catch (e) {
      console.warn('⚠️ PermissionContext: API call failed, using token fallback', e);
      
      const token = getToken();
      const payload = token ? decodeToken(token) : null;
      
      if (payload) {
        const tokenRoles = (payload?.roles ?? payload?.authorities) ?? [];
        const tokenPerms = (payload?.permissions) ?? [];
        
        console.log('🔄 PermissionContext: Token fallback data', { 
          tokenRoles, 
          tokenPerms,
          hasRoles: Array.isArray(tokenRoles) && tokenRoles.length > 0,
          hasPerms: Array.isArray(tokenPerms) && tokenPerms.length > 0
        });
        
        setRoles(Array.isArray(tokenRoles) ? tokenRoles : []);
        setPermissions(Array.isArray(tokenPerms) ? tokenPerms : []);
        setError(`API unavailable, using token fallback (${tokenRoles.length} roles)`);
      } else {
        console.error('❌ PermissionContext: No valid token for fallback');
        setRoles([]);
        setPermissions([]);
        setError('Failed to load permissions - no valid token');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = useCallback((force = false) => {
    return fetchPermissionsRef.current?.(force) ?? Promise.resolve(false);
  }, []); 

  // ---- Auto-fetch permissions on authentication ----
  useEffect(() => {
    console.log('🔐 PermissionContext: Authentication state changed', { 
      isAuthenticated, 
      hasUser: !!user,
      loading 
    });

    if (isAuthenticated && user && !loading) {
      console.log('🚀 PermissionContext: Auto-fetching permissions for authenticated user');
      fetchPermissions(false).then((success) => {
        if (success) {
          console.log('✅ PermissionContext: Permissions loaded successfully');
        } else {
          console.warn('⚠️ PermissionContext: Failed to load permissions, using token fallback');
        }
      });
    } else if (!isAuthenticated) {
      console.log('🧹 PermissionContext: User not authenticated, clearing permissions');
      setPermissions([]);
      setRoles([]);
      setPermissionDetails([]);
      setPermissionsByCategory({});
      setError(null);
      lastFetchTime.current = null;
    }
  }, [isAuthenticated, user, loading, fetchPermissions]);

  // ---- Checks ----
  const hasPermission = useCallback((perm: string, resourceId?: string): boolean => {
    if (!perm) return false;
    if (permissions.includes(perm)) return true;

    if (resourceId) {
      const scoped = `${perm}:${resourceId}`;
      if (permissions.includes(scoped)) return true;
    }

    const parts = perm.split(".");
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcard = parts.slice(0, i).join(".") + ".*";
      if (permissions.includes(wildcard)) return true;
    }
    return false;
  }, [permissions]);

  const hasAnyPermission = useCallback((...perms: string[]) => perms.some(p => hasPermission(p)), [hasPermission]);
  const hasAllPermissions = useCallback((...perms: string[]) => perms.every(p => hasPermission(p)), [hasPermission]);

  const hasRole = useCallback((role: string) => {
    const n = role.toLowerCase();
    return roles.some(r => r.toLowerCase() === n);
  }, [roles]);

  const hasAnyRole = useCallback((...rs: string[]) => rs.some(r => hasRole(r)), [hasRole]);
  const hasAllRoles = useCallback((...rs: string[]) => rs.every(r => hasRole(r)), [hasRole]);

  const canAccessResource = useCallback((resourceType: string, resourceId: string, action: string) => {
    return hasPermission(`${resourceType}.${action}`, resourceId);
  }, [hasPermission]);

  // ---- Admin ops ----
  const grantPermission = useCallback(async (userId: string, permission: string, options?: GrantPermissionOptions) => {
    if (!hasAnyRole("Admin", "SuperAdmin")) throw new Error("Insufficient permissions");
    await apiClient.post<ApiResponse<void>>("/api/permission/grant", {
      userId,
      permissionName: permission,
      expiresAt: options?.expiresAt,
      resourceId: options?.resourceId,
      reason: options?.reason
    });
    if (userId === user?.id) await fetchPermissions(true);
  }, [hasAnyRole, user?.id, fetchPermissions]);

  const revokePermission = useCallback(async (userId: string, permission: string, reason?: string) => {
    if (!hasAnyRole("Admin", "SuperAdmin")) throw new Error("Insufficient permissions");
    await apiClient.post<ApiResponse<void>>("/api/permission/revoke", { userId, permissionName: permission, reason });
    if (userId === user?.id) await fetchPermissions(true);
  }, [hasAnyRole, user?.id, fetchPermissions]);

  const assignRole = useCallback(async (userId: string, role: string, reason?: string) => {
    if (!hasAnyRole("Admin", "SuperAdmin")) throw new Error("Insufficient permissions");
    await apiClient.post<ApiResponse<void>>("/api/permission/assign-role", { userId, roleName: role, reason });
    if (userId === user?.id) await fetchPermissions(true);
  }, [hasAnyRole, user?.id, fetchPermissions]);

  const removeRole = useCallback(async (userId: string, role: string, reason?: string) => {
    if (!hasAnyRole("Admin", "SuperAdmin")) throw new Error("Insufficient permissions");
    await apiClient.post<ApiResponse<void>>("/api/permission/remove-role", { userId, roleName: role, reason });
    if (userId === user?.id) await fetchPermissions(true);
  }, [hasAnyRole, user?.id, fetchPermissions]);

  // ---- Derived - REMOVED useMemo to prevent loops ----
  const isAdmin = hasAnyRole("Admin", "SuperAdmin");
  const isSuperAdmin = hasRole("SuperAdmin");
  const isModerator = hasRole("Moderator") || isAdmin;

  // REMOVED PROBLEMATIC useMemo - was causing infinite re-renders!
  const value: PermissionContextType = {
    permissions,
    roles,
    permissionDetails,
    permissionsByCategory,
    loading,
    error,

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

    refreshPermissions: () => fetchPermissions(true),

    isAdmin,
    isSuperAdmin,
    isModerator
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export default PermissionContext;
