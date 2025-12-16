import React from 'react';
import { usePermissions } from '../../contexts/permissionContextHook';
import type { PermissionContextType } from '../../contexts/permissionContextValue';
import { useAuth } from '../../hooks/useAuth';

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
  customCheck?: (permissions: PermissionContextType) => boolean;
}> = ({
  children,
  roles = [],
  permissions: requiredPermissions = [],
  requireAll = false,
  fallback = null,
  customCheck,
}) => {
  const permissions: PermissionContextType = usePermissions();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Perform custom check if provided
  if (customCheck !== undefined) {
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
