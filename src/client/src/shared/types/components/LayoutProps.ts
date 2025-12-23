/**
 * Layout Component Props
 *
 * Standardized prop types for layout-related components.
 * Ensures consistency across all layout components.
 */

import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';

// ============================================================================
// Common Layout Types
// ============================================================================

/**
 * Container max width options
 */
export type ContainerMaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;

/**
 * Breakpoint keys for responsive design
 */
export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Responsive value type for props that vary by breakpoint
 */
export type ResponsiveValue<T> = T | Partial<Record<BreakpointKey, T>>;

// ============================================================================
// Page Layout Props
// ============================================================================

/**
 * Props for page container component
 */
export interface PageContainerProps {
  /** Page content */
  children: ReactNode;
  /** Maximum container width */
  maxWidth?: ContainerMaxWidth;
  /** Disable default padding */
  disablePadding?: boolean;
  /** Paper elevation */
  elevation?: number;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Breadcrumb item structure
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link path */
  path?: string;
  /** Icon component */
  icon?: ReactNode;
}

/**
 * Props for page header component
 */
export interface PageHeaderProps {
  /** Page title (auto-generated from breadcrumbs if not provided) */
  title?: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons/elements */
  actions?: ReactNode;
  /** Show breadcrumb trail */
  showBreadcrumbs?: boolean;
  /** Use automatic breadcrumb generation */
  useAutoBreadcrumbs?: boolean;
  /** Header icon */
  icon?: ReactNode;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for main layout wrapper
 */
export interface MainLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Show header */
  showHeader?: boolean;
  /** Show bottom navigation (mobile) */
  showTabbar?: boolean;
  /** Full width layout (no sidebar) */
  fullWidth?: boolean;
}

// ============================================================================
// Navigation Props
// ============================================================================

/**
 * Navigation item structure
 */
export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Route path */
  path: string;
  /** Icon component */
  icon?: ReactNode;
  /** Badge count */
  badge?: number;
  /** Whether item is active */
  active?: boolean;
  /** Child items for nested navigation */
  children?: NavItem[];
  /** Required permissions to view */
  permissions?: string[];
  /** Whether item is disabled */
  disabled?: boolean;
}

/**
 * Props for sidebar component
 */
export interface SidebarProps {
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Toggle collapse handler */
  onToggleCollapse?: () => void;
  /** Navigation items */
  navItems?: NavItem[];
  /** Custom footer content */
  footer?: ReactNode;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for header component
 */
export interface HeaderProps {
  /** Show search bar */
  showSearch?: boolean;
  /** Show notifications */
  showNotifications?: boolean;
  /** Show user menu */
  showUserMenu?: boolean;
  /** Custom actions */
  actions?: ReactNode;
  /** Mobile menu toggle handler */
  onMenuToggle?: () => void;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for bottom tab bar (mobile)
 */
export interface TabbarProps {
  /** Navigation items */
  items: NavItem[];
  /** Currently active item ID */
  activeId?: string;
  /** Item click handler */
  onItemClick?: (item: NavItem) => void;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

// ============================================================================
// Grid Props
// ============================================================================

/**
 * Props for responsive grid component
 */
export interface ResponsiveGridProps {
  /** Grid items */
  children: ReactNode;
  /** Number of columns per breakpoint */
  columns?: ResponsiveValue<number>;
  /** Gap between items */
  spacing?: number;
  /** Item minimum width */
  minItemWidth?: number;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for grid item wrapper
 */
export interface GridItemProps {
  /** Item content */
  children: ReactNode;
  /** Column span */
  span?: ResponsiveValue<number>;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

// ============================================================================
// Container Props
// ============================================================================

/**
 * Props for mobile container
 */
export interface MobileContainerProps {
  /** Container content */
  children: ReactNode;
  /** Show back button */
  showBack?: boolean;
  /** Back button handler */
  onBack?: () => void;
  /** Page title */
  title?: string;
  /** Header actions */
  actions?: ReactNode;
  /** Full height container */
  fullHeight?: boolean;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for card container
 */
export interface CardContainerProps {
  /** Card content */
  children: ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Header actions */
  actions?: ReactNode;
  /** Paper elevation */
  elevation?: number;
  /** Whether card is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

// ============================================================================
// Search Props
// ============================================================================

/**
 * Props for search bar component
 */
export interface SearchbarProps {
  /** Current search value */
  value?: string;
  /** Value change handler */
  onChange?: (value: string) => void;
  /** Search submit handler */
  onSearch?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show clear button */
  showClear?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for mobile search bar
 */
export interface MobileSearchbarProps extends SearchbarProps {
  /** Whether search is expanded */
  expanded?: boolean;
  /** Toggle expand handler */
  onToggleExpand?: () => void;
}

// ============================================================================
// Empty State Props
// ============================================================================

/**
 * Props for empty state component
 */
export interface EmptyStateProps {
  /** Main message */
  title: string;
  /** Description text */
  description?: string;
  /** Icon component */
  icon?: ReactNode;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for loading state component
 */
export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Full page overlay */
  fullPage?: boolean;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

/**
 * Props for error state component
 */
export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Custom styles */
  sx?: SxProps<Theme>;
}

// ============================================================================
// Tab Props
// ============================================================================

/**
 * Props for tab panel component
 * Standard interface for MUI Tab panels across the application
 */
export interface TabPanelProps {
  /** Panel content */
  children?: ReactNode;
  /** Tab index this panel corresponds to */
  index: number;
  /** Currently selected tab value */
  value: number;
}
