import type { ReactNode } from 'react';

export interface MenuItem {
  text: string;
  icon: ReactNode;
  path: string;
  authRequired: boolean;
  adminRequired?: boolean;
  permissions?: string[];
  children?: MenuItem[];
}

export interface TabbarMenuItem {
  label: string;
  icon: ReactNode;
  path: string;
  authRequired: boolean;
  permissions?: string[];
  badge?: number;
}
