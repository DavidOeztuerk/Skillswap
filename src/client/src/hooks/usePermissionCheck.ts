import { usePermissions } from '../contexts/permissionContextHook';
import { useAuth } from './useAuth';

/**
 * Hook to check if the current user has specific roles/permissions
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
    customCheck,
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
