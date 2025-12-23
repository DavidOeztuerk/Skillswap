import { createContext } from 'react';

// ============================================================================
// Types
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

interface GrantPermissionOptions {
  expiresAt?: Date;
  resourceId?: string;
  reason?: string;
}

export interface PermissionContextType {
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

  grantPermission: (
    userId: string,
    permission: string,
    options?: GrantPermissionOptions
  ) => Promise<void>;
  revokePermission: (userId: string, permission: string, reason?: string) => Promise<void>;
  assignRole: (userId: string, role: string, reason?: string) => Promise<void>;
  removeRole: (userId: string, role: string, reason?: string) => Promise<void>;

  refreshPermissions: () => Promise<boolean>;

  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
}

// ============================================================================
// Context
// ============================================================================

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export default PermissionContext;
