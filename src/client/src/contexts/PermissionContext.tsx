// src/client/src/contexts/PermissionContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/apiClient";
import { withDefault } from "../utils/safeAccess";
import { decodeToken } from "../utils/authHelpers";
import type { ApiResponse } from "../types/common/ApiResponse";

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
  const { user, isAuthenticated, token } = useAuth();

  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissionDetails, setPermissionDetails] = useState<Permission[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchTime = useRef<number | null>(null);
  const didInitialFetch = useRef(false);

  const RATE_LIMIT_MS = 5 * 60 * 1000; // 5min

  const fetchPermissions = useCallback(async (force = false): Promise<boolean> => {
    if (!isAuthenticated || !token) {
      return false; // gate on token, nicht auf user
    }

    if (!force && lastFetchTime.current && Date.now() - lastFetchTime.current < RATE_LIMIT_MS) {
      return true;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await apiClient.get<ApiResponse<UserPermissions>>("/api/users/permissions/my");
      if (resp?.success && resp?.data) {
        const d = resp.data;
        setPermissions(withDefault(d.permissionNames, []));
        setRoles(withDefault(d.roles, []));
        setPermissionDetails(withDefault(d.permissions, []));
        setPermissionsByCategory(withDefault(d.permissionsByCategory, {}));
        lastFetchTime.current = Date.now();
        return true;
      }
      setError(resp?.message ?? "Failed to load permissions");
      return false;
    } catch (e) {
      // Fallback aus Token (robustes Base64URL-Decoding)
      const payload = token ? decodeToken(token) : null;
      const tokenRoles = (payload?.roles ?? payload?.authorities) ?? [];
      const tokenPerms = (payload?.permissions) ?? [];

      setRoles(Array.isArray(tokenRoles) ? tokenRoles : []);
      setPermissions(Array.isArray(tokenPerms) ? tokenPerms : []);

      setError("Permissions fetched from token fallback");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Initial + on changes
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setPermissions([]);
      setRoles([]);
      setPermissionDetails([]);
      setPermissionsByCategory({});
      didInitialFetch.current = false;
      return;
    }

    if (didInitialFetch.current) return;

    (async () => {
      const ok = await fetchPermissions(true);
      didInitialFetch.current = ok; // nur bei Erfolg latchen
      if (!ok) {
        // erneut versuchen, sobald userId kommt (optional)
        if (user?.id) {
          await fetchPermissions(true);
          didInitialFetch.current = true;
        }
      }
    })();
  }, [isAuthenticated, token, user?.id, fetchPermissions]);

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

  // ---- Derived ----
  const isAdmin = useMemo(() => hasAnyRole("Admin", "SuperAdmin"), [hasAnyRole]);
  const isSuperAdmin = useMemo(() => hasRole("SuperAdmin"), [hasRole]);
  const isModerator = useMemo(() => hasRole("Moderator") || isAdmin, [hasRole, isAdmin]);

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
