import { useContext } from 'react';
import { PermissionContext, type PermissionContextType } from './permissionContextValue';

/**
 * Hook to access permission context
 * @throws Error if used outside PermissionProvider
 */
export const usePermissions = (): PermissionContextType => {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return ctx;
};
