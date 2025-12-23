/**
 * Common Props - Shared prop types for reusable components
 *
 * Provides type definitions for commonly used props across the application.
 * Import these types to ensure consistency across components.
 */

import type { SxProps, Theme } from '@mui/material';

// ============================================================================
// Base Props
// ============================================================================

/**
 * Base props that all components should support
 */
export interface BaseComponentProps {
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing frameworks */
  testId?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

/**
 * Base props with MUI sx support
 */
export interface BaseMuiProps extends BaseComponentProps {
  /** MUI sx prop for styling */
  sx?: SxProps<Theme>;
}

// ============================================================================
// Loading & Error States
// ============================================================================

/**
 * Props for components with loading state
 */
export interface WithLoadingProps {
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Custom loading text */
  loadingText?: string;
}

/**
 * Props for components with error state
 */
export interface WithErrorProps {
  /** Error message to display */
  error?: string | null;
  /** Error recovery callback */
  onRetry?: () => void;
}

/**
 * Combined loading and error props
 */
export interface AsyncStateProps extends WithLoadingProps, WithErrorProps {}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Common action callback props
 */
export interface ActionCallbackProps<T = void> {
  /** Callback when action is triggered */
  onAction?: (data: T) => void;
  /** Callback when action succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when action fails */
  onError?: (error: Error) => void;
}

/**
 * Props for closeable components (dialogs, drawers, modals)
 */
export interface CloseableProps {
  /** Whether the component is open */
  open: boolean;
  /** Callback when close is requested */
  onClose: () => void;
}

/**
 * Props for selectable items
 */
export interface SelectableProps<T = string> {
  /** Currently selected value */
  selected?: T;
  /** Callback when selection changes */
  onSelect?: (value: T) => void;
}

// ============================================================================
// Data Display Props
// ============================================================================

/**
 * Props for components displaying a single item
 */
export interface ItemDisplayProps<T> {
  /** The item to display */
  item: T;
  /** Whether the item is in a compact view */
  compact?: boolean;
}

/**
 * Props for components displaying a list of items
 */
export interface ListDisplayProps<T> {
  /** Items to display */
  items: T[];
  /** Whether the list is empty */
  isEmpty?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
}

/**
 * Props for paginated lists
 */
export interface PaginatedProps {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalCount: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
}

// ============================================================================
// User Context Props
// ============================================================================

/**
 * Props for components that need the current user ID
 */
export interface WithCurrentUserProps {
  /** Current user's ID */
  currentUserId: string;
}

/**
 * Props for components that show ownership context
 */
export interface WithOwnershipProps {
  /** Whether the current user owns this item */
  isOwn: boolean;
}

// ============================================================================
// Responsive Props
// ============================================================================

/**
 * Props for responsive behavior
 */
export interface ResponsiveProps {
  /** Whether to use compact/mobile layout */
  compact?: boolean;
  /** Whether component is in a narrow container */
  narrow?: boolean;
}

// ============================================================================
// Chat-Specific Props
// ============================================================================

/**
 * Common props for chat components
 */
export interface ChatComponentProps extends BaseMuiProps {
  /** Thread ID for the conversation */
  threadId: string;
  /** Current user's ID */
  currentUserId: string;
}

/**
 * Props for chat message components
 */
export interface ChatMessageProps extends ChatComponentProps {
  /** Whether the message is from the current user */
  isOwn: boolean;
  /** Whether to show the avatar */
  showAvatar?: boolean;
}

// ============================================================================
// Form Props
// ============================================================================

/**
 * Props for form field components
 */
export interface FormFieldProps<T = string> {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Current value */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Validation error message */
  error?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Helper text */
  helperText?: string;
}

// ============================================================================
// Compound Types
// ============================================================================

/**
 * Full props for a typical data display component
 */
export type DataComponentProps<T> = BaseMuiProps &
  ItemDisplayProps<T> &
  AsyncStateProps &
  ResponsiveProps;

/**
 * Full props for a typical list component
 */
export type ListComponentProps<T> = BaseMuiProps &
  ListDisplayProps<T> &
  AsyncStateProps &
  ResponsiveProps &
  Partial<PaginatedProps>;

/**
 * Full props for a modal/drawer component
 */
export type ModalComponentProps = BaseMuiProps & CloseableProps & WithLoadingProps;
