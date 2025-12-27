// ============================================================================
// Core Contexts - Centralized Exports
// ============================================================================

// ----------------------------------------------------------------------------
// Email Verification Context
// ----------------------------------------------------------------------------
export { EmailVerificationContext } from './emailVerificationContextValue';
export type { EmailVerificationContextType } from './emailVerificationContextValue';
export { useEmailVerificationContext } from './emailVerificationContextHook';
export { EmailVerificationProvider } from './EmailVerificationContext';

// ----------------------------------------------------------------------------
// Loading Context
// ----------------------------------------------------------------------------
export { LoadingContext, LoadingKeys } from './loadingContextValue';
export type { LoadingContextType, LoadingState, LoadingKey } from './loadingContextValue';
export { useLoading, useComponentLoading } from './loadingContextHooks';
export { LoadingProvider } from './LoadingContext';

// ----------------------------------------------------------------------------
// Permission Context
// ----------------------------------------------------------------------------
export { PermissionContext } from './permissionContextValue';
export type {
  PermissionContextType,
  Permission,
  GrantPermissionOptions,
} from './permissionContextValue';
export { usePermissions } from './permissionContextHook';
export { PermissionProvider } from './PermissionContext';

// ----------------------------------------------------------------------------
// Stream Context
// ----------------------------------------------------------------------------
export { default as StreamContext } from './StreamContext';
export type { StreamContextState, StreamContextValue } from './streamContextTypes';
export { useStreams, withStreams } from './streamContextHooks';
export type { WithStreamsProps } from './streamContextHooks';
export { StreamProvider } from './StreamContext';

// ----------------------------------------------------------------------------
// Toast Context
// ----------------------------------------------------------------------------
export { ToastContext } from './toastContextValue';
export type { ToastContextType, ToastMessage } from './toastContextValue';
export { ToastProvider } from './ToastContext';
export { useToast } from '../../shared/hooks/useToast';
