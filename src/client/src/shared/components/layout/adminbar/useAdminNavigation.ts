import React from 'react';
import type { NavMenuItem } from './AdminNavigationbar';
import type { MenuItem } from '../../../types/layout/types';

interface UseAdminNavigationResult {
  adminMenuItems: MenuItem[];
  adminTabItem: NavMenuItem | null;
  isLoading: boolean;
}

export const useAdminNavigation = (hasAdminAccess: boolean): UseAdminNavigationResult => {
  const [adminMenuItems, setAdminMenuItems] = React.useState<MenuItem[]>([]);
  const [adminTabItem, setAdminTabItem] = React.useState<NavMenuItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!hasAdminAccess) {
      setAdminMenuItems([]);
      setAdminTabItem(null);
      return;
    }

    const loadAdminNavigation = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // This import will create a separate chunk for admin navigation
        const module = await import('./AdminNavigationbar');
        setAdminMenuItems(module.getAdminMenuItems());
        setAdminTabItem(module.getAdminTabMenuItem());
      } catch (error) {
        console.error('Failed to load admin navigation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAdminNavigation();
  }, [hasAdminAccess]);

  return { adminMenuItems, adminTabItem, isLoading };
};

// ============================================================================
// Types Export
// ============================================================================

export type { MenuItem } from '../../../types/layout/types';
