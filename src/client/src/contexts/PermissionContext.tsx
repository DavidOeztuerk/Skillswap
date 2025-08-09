import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import { withDefault } from '../utils/safeAccess';
import { ApiResponse } from '../types/common/ApiResponse';

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

interface PermissionContextType {
  permissions: string[];
  roles: string[];
  permissionDetails: Permission[];
  permissionsByCategory: Record<string, string[]>;
  loading: boolean;
  error: string | null;
  
  // Permission check methods
  hasPermission: (permission: string, resourceId?: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  hasAllRoles: (...roles: string[]) => boolean;
  canAccessResource: (resourceType: string, resourceId: string, action: string) => boolean;
  
  // Permission management (Admin only)
  grantPermission: (userId: string, permission: string, options?: GrantPermissionOptions) => Promise<void>;
  revokePermission: (userId: string, permission: string, reason?: string) => Promise<void>;
  assignRole: (userId: string, role: string, reason?: string) => Promise<void>;
  removeRole: (userId: string, role: string, reason?: string) => Promise<void>;
  
  // Refresh permissions
  refreshPermissions: () => Promise<void>;
  
  // Check if user is admin
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
}

interface GrantPermissionOptions {
  expiresAt?: Date;
  resourceId?: string;
  reason?: string;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Alias for backward compatibility
export const usePermission = usePermissions;

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissionDetails, setPermissionDetails] = useState<Permission[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Cache duration in milliseconds (15 minutes)
  const CACHE_DURATION = 15 * 60 * 1000;

  // Load permissions from localStorage on mount
  useEffect(() => {
    const loadCachedPermissions = () => {
      const cached = localStorage.getItem('userPermissions');
      if (cached) {
        try {
          const data = JSON.parse(cached) as UserPermissions & { timestamp: number };
          const now = Date.now();
          
          // Check if cache is still valid (15 minutes)
          if (data.timestamp && (now - data.timestamp) < CACHE_DURATION) {
            setPermissions(data.permissionNames || []);
            setRoles(data.roles || []);
            setPermissionDetails(data.permissions || []);
            setPermissionsByCategory(data.permissionsByCategory || {});
            setLastFetchTime(new Date(data.timestamp));
          } else {
            // Cache expired, remove it
            localStorage.removeItem('userPermissions');
          }
        } catch (err) {
          console.error('Error loading cached permissions:', err);
          localStorage.removeItem('userPermissions');
        }
      }
    };

    if (isAuthenticated) {
      loadCachedPermissions();
    } else {
      // Clear permissions when not authenticated
      setPermissions([]);
      setRoles([]);
      setPermissionDetails([]);
      setPermissionsByCategory({});
      localStorage.removeItem('userPermissions');
    }
  }, [isAuthenticated, CACHE_DURATION]);

  // Fetch permissions from backend (only when needed)
  const fetchPermissions = useCallback(async (force: boolean = false) => {
    console.log('🔐 fetchPermissions called:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      lastFetchTime: lastFetchTime?.toISOString(),
      force,
      reason: 'Manual refresh or permission change'
    });

    if (!isAuthenticated || !user) {
      console.log('❌ fetchPermissions skipped: not authenticated or no user');
      return;
    }

    // Check if we recently fetched (within 5 minutes to prevent rapid refetches)
    if (!force && lastFetchTime && (Date.now() - lastFetchTime.getTime()) < 300000) {
      console.log('⏰ fetchPermissions skipped: recently fetched');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching permissions from /api/users/permissions/my...');
      // apiClient returns the full ApiResponse, not just the data
      const response = await apiClient.get<ApiResponse<UserPermissions>>('/api/users/permissions/my');
      
      console.log('📥 Permission response received:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        roles: response?.data?.roles,
        permissionCount: response?.data?.permissionNames?.length,
        permissionNames: response?.data?.permissionNames,
        fullResponse: response
      });
      
      // Check if response has data property (it's an ApiResponse)
      if (response?.success && response?.data) {
        const permData = response.data;  // Now this is correct - response is ApiResponse, data is UserPermissions
        setPermissions(withDefault(permData.permissionNames, []));
        setRoles(withDefault(permData.roles, []));
        setPermissionDetails(withDefault(permData.permissions, []));
        setPermissionsByCategory(withDefault(permData.permissionsByCategory, {}));
        setLastFetchTime(new Date());

        console.log('✅ Permissions set in context:', {
          roles: permData.roles,
          permissionCount: permData.permissionNames?.length,
          permissions: permData.permissionNames
        });

        // Cache in localStorage
        localStorage.setItem('userPermissions', JSON.stringify({
          ...permData,
          timestamp: Date.now()
        }));
        console.log('💾 Permissions cached in localStorage');
      } else {
        console.warn('⚠️ No data in permission response or request failed:', {
          success: response?.success,
          message: response?.message
        });
      }
    } catch (err) {
      console.error('❌ Error fetching permissions:', err);
      setError('Failed to load permissions');
      
      // Try to extract permissions from JWT token as fallback
      if (token) {
        console.log('🔍 Attempting to extract permissions from JWT token as fallback...');
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenRoles = payload.role || payload.roles || [];
          const tokenPermissions = payload.permission || payload.permissions || [];
          
          console.log('🎫 Token payload:', {
            roles: tokenRoles,
            permissions: tokenPermissions
          });
          
          setRoles(Array.isArray(tokenRoles) ? tokenRoles : [tokenRoles].filter(Boolean));
          setPermissions(Array.isArray(tokenPermissions) ? tokenPermissions : [tokenPermissions].filter(Boolean));
        } catch (tokenErr) {
          console.error('❌ Error parsing token:', tokenErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, lastFetchTime, token]);

  // Fetch permissions when authentication state changes
  useEffect(() => {
    console.log('🔄 Permission useEffect triggered:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      hasToken: !!token
    });
    
    if (isAuthenticated && user && token) {
      // Check if we have cached permissions from login/register
      const cached = localStorage.getItem('userPermissions');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          const now = Date.now();
          
          // Use cached permissions from login/register (valid for 15 minutes)
          if (data.timestamp && (now - data.timestamp) < CACHE_DURATION) {
            console.log('📦 Using cached permissions from login/register response');
            setPermissions(data.permissionNames || []);
            setRoles(data.roles || []);
            setPermissionsByCategory(data.permissionsByCategory || {});
            setLastFetchTime(new Date(data.timestamp));
            // No need to fetch - we have fresh data from login/register
            return;
          } else {
            console.log('⏰ Cached permissions expired, will fetch fresh ones');
          }
        } catch (err) {
          console.error('Error parsing cached permissions:', err);
        }
      }
      
      // Only fetch if permissions are missing or expired
      console.log('📤 Fetching fresh permissions from server (cache miss or expired)...');
      fetchPermissions(true);
    } else if (!isAuthenticated) {
      // Clear permissions when user logs out
      console.log('🧹 Clearing permissions - user logged out');
      setPermissions([]);
      setRoles([]);
      setPermissionDetails([]);
      setPermissionsByCategory({});
      localStorage.removeItem('userPermissions');
    }
  }, [isAuthenticated, user?.id, token]); // Simple dependencies

  // Permission check methods
  const hasPermission = useCallback((permission: string, resourceId?: string): boolean => {
    if (!permission) return false;
    
    // Check direct permissions
    if (permissions?.includes(permission)) return true;
    
    // Check resource-specific permissions if resourceId provided
    if (resourceId) {
      const resourcePermission = `${permission}:${resourceId}`;
      if (permissions?.includes(resourcePermission)) return true;
    }
    
    // Check wildcard permissions (e.g., "admin.*" covers all admin permissions)
    const permissionParts = permission.split('.');
    for (let i = permissionParts.length - 1; i > 0; i--) {
      const wildcardPermission = permissionParts.slice(0, i).join('.') + '.*';
      if (permissions?.includes(wildcardPermission)) return true;
    }
    
    return false;
  }, [permissions]);

  const hasAnyPermission = useCallback((...perms: string[]): boolean => {
    return perms?.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((...perms: string[]): boolean => {
    return perms.every(p => hasPermission(p));
  }, [hasPermission]);

  const hasRole = useCallback((role: string): boolean => {
    // Case-insensitive role comparison
    const normalizedRole = role.toLowerCase();
    const hasIt = roles?.some(r => r.toLowerCase() === normalizedRole);
    console.log(`🎭 hasRole('${role}'): ${hasIt}, available roles:`, roles);
    return hasIt;
  }, [roles]);

  const hasAnyRole = useCallback((...roleNames: string[]): boolean => {
    return roleNames?.some(r => hasRole(r));
  }, [hasRole]);

  const hasAllRoles = useCallback((...roleNames: string[]): boolean => {
    return roleNames.every(r => hasRole(r));
  }, [hasRole]);

  const canAccessResource = useCallback((resourceType: string, resourceId: string, action: string): boolean => {
    const permission = `${resourceType}.${action}`;
    return hasPermission(permission, resourceId);
  }, [hasPermission]);

  // Permission management methods (Admin only)
  const grantPermission = useCallback(async (
    userId: string,
    permission: string,
    options?: GrantPermissionOptions
  ) => {
    if (!hasRole('Admin') && !hasRole('SuperAdmin')) {
      throw new Error('Insufficient permissions');
    }

    await apiClient.post('/api/permission/grant', {
      userId,
      permissionName: permission,
      expiresAt: options?.expiresAt,
      resourceId: options?.resourceId,
      reason: options?.reason
    });

    // Refresh permissions if granting to self
    if (userId === user?.id) {
      await fetchPermissions();
    }
  }, [hasRole, user, fetchPermissions]);

  const revokePermission = useCallback(async (
    userId: string,
    permission: string,
    reason?: string
  ) => {
    if (!hasRole('Admin') && !hasRole('SuperAdmin')) {
      throw new Error('Insufficient permissions');
    }

    await apiClient.post('/api/permission/revoke', {
      userId,
      permissionName: permission,
      reason
    });

    // Refresh permissions if revoking from self
    if (userId === user?.id) {
      await fetchPermissions();
    }
  }, [hasRole, user, fetchPermissions]);

  const assignRole = useCallback(async (
    userId: string,
    role: string,
    reason?: string
  ) => {
    if (!hasRole('Admin') && !hasRole('SuperAdmin')) {
      throw new Error('Insufficient permissions');
    }

    await apiClient.post('/api/permission/assign-role', {
      userId,
      roleName: role,
      reason
    });

    // Refresh permissions if assigning to self
    if (userId === user?.id) {
      await fetchPermissions();
    }
  }, [hasRole, user, fetchPermissions]);

  const removeRole = useCallback(async (
    userId: string,
    role: string,
    reason?: string
  ) => {
    if (!hasRole('Admin') && !hasRole('SuperAdmin')) {
      throw new Error('Insufficient permissions');
    }

    await apiClient.post('/api/permission/remove-role', {
      userId,
      roleName: role,
      reason
    });

    // Refresh permissions if removing from self
    if (userId === user?.id) {
      await fetchPermissions();
    }
  }, [hasRole, user, fetchPermissions]);

  // Computed properties
  const isAdmin = useMemo(() => {
    const result = hasRole('Admin') || hasRole('SuperAdmin');
    console.log('👑 isAdmin computed:', result, 'roles:', roles);
    return result;
  }, [hasRole, roles]);
  
  const isSuperAdmin = useMemo(() => {
    const result = hasRole('SuperAdmin');
    console.log('🌟 isSuperAdmin computed:', result);
    return result;
  }, [hasRole]);
  
  const isModerator = useMemo(() => {
    const result = hasRole('Moderator') || isAdmin;
    console.log('🛡️ isModerator computed:', result);
    return result;
  }, [hasRole, isAdmin]);

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

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionContext;