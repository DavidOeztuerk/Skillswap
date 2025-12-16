import {
  lazy,
  Suspense,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
  type LazyExoticComponent,
  type FC,
  memo,
  type ReactElement,
} from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import PageLoader from '../ui/PageLoader';
import { withPageErrorBoundary } from './withErrorBoundary';
import { PermissionRoute, type PermissionRouteConfig } from '../auth/PermissionRoute';

// ============================================================================
// Types
// ============================================================================

/**
 * Basis-Optionen für alle HOCs
 */
interface BaseLoadingOptions {
  /** Custom Fallback-Komponente */
  fallback?: ReactNode;
  /** Loading-Nachricht */
  loadingMessage?: string;
  /** Skeleton-Variante für PageLoader */
  skeletonVariant?: 'dashboard' | 'profile' | 'list' | 'details' | 'form';
  /** Verwende Skeleton statt Spinner */
  useSkeleton?: boolean;
}

/**
 * Error Boundary Optionen
 */
interface ErrorBoundaryOptions {
  /** Error Boundary verwenden (default: true) */
  withErrorBoundary?: boolean;
  /** Error Handler */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom Error Fallback - muss als Element übergeben werden */
  errorFallback?: ReactElement;
}

/**
 * Protected Route Configuration
 * Unified config using PermissionRoute for all protection scenarios
 */
type ProtectedRouteConfig = PermissionRouteConfig;
// PermissionRouteConfig already includes:
// - roles?: string[]
// - permissions?: string[]
// - requireAll?: boolean
// - requireAuth?: boolean
// - redirectTo?: string
// - unauthorizedRedirect?: string
// - customCheck?: (permissions) => boolean
// - fallback?: ReactNode

/**
 * Kombinierte Optionen für withSuspense
 */
interface WithSuspenseOptions extends BaseLoadingOptions, ErrorBoundaryOptions {}

/**
 * Kombinierte Optionen für withProtectedRoute
 */
interface WithProtectedRouteOptions extends WithSuspenseOptions, ProtectedRouteConfig {}

/**
 * Typ für lazy-loaded Components
 */
interface LazyComponentModule<T> {
  default: T;
}
type ImportFunction<T> = () => Promise<LazyComponentModule<T>>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper: Erstellt die Fallback-Komponente basierend auf Optionen
 */
const createFallback = (options: BaseLoadingOptions): ReactNode => {
  if (options.fallback !== undefined) {
    return options.fallback;
  }

  const message = options.loadingMessage ?? 'Seite wird geladen...';

  if (options.useSkeleton) {
    return <PageLoader variant={options.skeletonVariant ?? 'dashboard'} message={message} />;
  }

  return <LoadingSpinner fullPage message={message} />;
};

/**
 * Helper: Wendet Error Boundary an, falls gewünscht
 */
const applyErrorBoundary = <P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  options: ErrorBoundaryOptions
): ComponentType<P> => {
  if (options.withErrorBoundary === false) {
    return Component;
  }

  const errorBoundaryOptions = {
    onError: options.onError,
    ...(options.errorFallback !== undefined && { fallback: options.errorFallback }),
  };

  return withPageErrorBoundary(Component, errorBoundaryOptions);
};

/**
 * Helper: Determines if any route protection is needed
 */
const hasProtectionRequirements = (options: ProtectedRouteConfig): boolean => {
  const hasAuth = options.requireAuth === true;
  const hasRoles = Array.isArray(options.roles) && options.roles.length > 0;
  const hasPermissions = Array.isArray(options.permissions) && options.permissions.length > 0;
  const hasCustomCheck = options.customCheck !== undefined;
  return hasAuth || hasRoles || hasPermissions || hasCustomCheck;
};

// ============================================================================
// HOC: withSuspense
// ============================================================================

/**
 * Basis HOC für lazy loading mit Suspense
 *
 * @example
 * const LazyPage = withSuspense(
 *   () => import('./pages/MyPage'),
 *   { useSkeleton: true, skeletonVariant: 'dashboard' }
 * );
 */
export function withSuspense<T extends ComponentType<Record<string, unknown>>>(
  importFn: ImportFunction<T>,
  options: WithSuspenseOptions = {}
): FC<React.ComponentProps<T>> {
  // Lazy load einmal erstellen (nicht bei jedem Render)
  const LazyComponent = lazy(importFn) as ComponentType<React.ComponentProps<T>>;

  // Wrapper-Komponente mit memo für Performance
  const SuspenseWrapper: FC<React.ComponentProps<T>> = memo((props) => {
    const fallback = createFallback(options);

    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  });

  // Display name für Dev-Tools
  SuspenseWrapper.displayName = `withSuspense(LazyComponent)`;

  // Error Boundary anwenden mit korrekten Typen
  return applyErrorBoundary<React.ComponentProps<T>>(SuspenseWrapper, options) as FC<
    React.ComponentProps<T>
  >;
}

// ============================================================================
// HOC: withProtectedRoute (replaces withPrivateRoute)
// ============================================================================

/**
 * HOC für lazy loading mit Route-Protection via PermissionRoute
 *
 * @example
 * // Simple auth (any authenticated user)
 * const ProtectedPage = withProtectedRoute(
 *   () => import('./pages/MyPage'),
 *   { requireAuth: true }
 * );
 *
 * @example
 * // Role-based
 * const AdminPage = withProtectedRoute(
 *   () => import('./pages/AdminPage'),
 *   { roles: ['Admin'] }
 * );
 *
 * @example
 * // Permission-based
 * const UsersPage = withProtectedRoute(
 *   () => import('./pages/UsersPage'),
 *   { permissions: ['users:view_all'] }
 * );
 *
 * @example
 * // Strict mode (ALL roles AND permissions required)
 * const ManagePage = withProtectedRoute(
 *   () => import('./pages/ManagePage'),
 *   { permissions: ['users:view', 'users:edit'], requireAll: true }
 * );
 */
export function withProtectedRoute<T extends ComponentType<Record<string, unknown>>>(
  importFn: ImportFunction<T>,
  options: WithProtectedRouteOptions = {}
): FC<React.ComponentProps<T>> {
  // Lazy load einmal erstellen
  const LazyComponent = lazy(importFn) as ComponentType<React.ComponentProps<T>>;

  // Extrahiere die verschiedenen Option-Gruppen
  const {
    // Loading options
    loadingMessage,
    skeletonVariant,
    useSkeleton,
    // Error boundary options
    withErrorBoundary,
    onError,
    errorFallback,
    // Protected route options
    requireAuth,
    roles,
    permissions,
    requireAll,
    redirectTo,
    unauthorizedRedirect,
    customCheck,
    fallback: accessDeniedFallback, // Renamed for clarity in this context
  } = options;

  const loadingOptions: BaseLoadingOptions = {
    fallback: undefined, // Don't pass accessDeniedFallback to loading
    loadingMessage,
    skeletonVariant,
    useSkeleton,
  };

  const errorOptions: ErrorBoundaryOptions = {
    withErrorBoundary,
    onError,
    errorFallback,
  };

  const protectedConfig: ProtectedRouteConfig = {
    requireAuth,
    roles,
    permissions,
    requireAll,
    redirectTo,
    unauthorizedRedirect,
    customCheck,
    fallback: accessDeniedFallback,
  };

  // Wrapper-Komponente - Verwendet immer PermissionRoute
  const ProtectedRouteWrapper: FC<React.ComponentProps<T>> = memo((props) => {
    const fallbackElement = createFallback(loadingOptions);

    return (
      <PermissionRoute
        requireAuth={protectedConfig.requireAuth}
        roles={protectedConfig.roles}
        permissions={protectedConfig.permissions}
        requireAll={protectedConfig.requireAll}
        redirectTo={protectedConfig.redirectTo ?? '/auth/login'}
        unauthorizedRedirect={protectedConfig.unauthorizedRedirect ?? '/forbidden'}
        fallback={protectedConfig.fallback}
        customCheck={protectedConfig.customCheck}
      >
        <Suspense fallback={fallbackElement}>
          <LazyComponent {...props} />
        </Suspense>
      </PermissionRoute>
    );
  });

  // Display name für Dev-Tools
  ProtectedRouteWrapper.displayName = `withProtectedRoute(LazyComponent)`;

  // Error Boundary anwenden mit korrekten Typen
  return applyErrorBoundary<React.ComponentProps<T>>(ProtectedRouteWrapper, errorOptions) as FC<
    React.ComponentProps<T>
  >;
}

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use withProtectedRoute instead
 */
export const withPrivateRoute = withProtectedRoute;

// ============================================================================
// HOC: withPreloadableSuspense
// ============================================================================

/**
 * Erweiterte Version mit Preloading-Support
 *
 * @example
 * const PreloadablePage = withPreloadableSuspense(
 *   () => import('./pages/MyPage'),
 *   { useSkeleton: true }
 * );
 *
 * // Preload on hover
 * <Link onMouseEnter={() => PreloadablePage.preload()}>
 *   Go to Page
 * </Link>
 */
export function withPreloadableSuspense<T extends ComponentType<Record<string, unknown>>>(
  importFn: ImportFunction<T>,
  options: WithSuspenseOptions = {}
): FC<React.ComponentProps<T>> & { preload: () => Promise<LazyComponentModule<T>> } {
  // Preload-Funktion exponieren
  const preload = (): Promise<LazyComponentModule<T>> => importFn();

  const Component = withSuspense(importFn, options);

  // Preload-Methode an die Komponente anhängen
  const PreloadableComponent = Component as FC<React.ComponentProps<T>> & {
    preload: () => Promise<LazyComponentModule<T>>;
  };
  PreloadableComponent.preload = preload;

  return PreloadableComponent;
}

// ============================================================================
// Factory: createLazyRoute
// ============================================================================

/**
 * Route info returned by createLazyRoute
 */
interface LazyRouteInfo<T extends ComponentType<Record<string, unknown>>> {
  /** The wrapped component */
  component: FC<React.ComponentProps<T>>;
  /** Preload function */
  preload: () => Promise<LazyComponentModule<T>>;
  /** Whether the route is protected (requires authentication/roles/permissions) */
  isProtected: boolean;
  /** Original config */
  config: WithProtectedRouteOptions;
}

/**
 * Factory für Router-Konfiguration
 * Automatische Auswahl zwischen public und protected (PermissionRoute)
 *
 * @example
 * // Public route (no protection)
 * const homeRoute = createLazyRoute(
 *   () => import('./pages/HomePage'),
 *   { useSkeleton: true }
 * );
 *
 * @example
 * // Protected route (any authenticated user)
 * const dashboardRoute = createLazyRoute(
 *   () => import('./pages/Dashboard'),
 *   { roles: ['*'], useSkeleton: true }
 * );
 *
 * @example
 * // Admin route with specific roles
 * const adminRoute = createLazyRoute(
 *   () => import('./pages/AdminDashboard'),
 *   { roles: ['Admin', 'SuperAdmin'], permissions: ['admin:access_dashboard'] }
 * );
 *
 * @example
 * // Advanced permission route with requireAll
 * const manageRoute = createLazyRoute(
 *   () => import('./pages/UserManagement'),
 *   { permissions: ['users:view', 'users:manage'], requireAll: true }
 * );
 */
export function createLazyRoute<T extends ComponentType<Record<string, unknown>>>(
  importFn: ImportFunction<T>,
  options: WithProtectedRouteOptions = {}
): LazyRouteInfo<T> {
  // Handle special role '*' which means "any authenticated user"
  // This is a legacy pattern - prefer using requireAuth: true instead
  const hasWildcardRole = (options.roles as string[] | undefined)?.includes('*');

  // Normalize options
  const normalizedOptions: WithProtectedRouteOptions = hasWildcardRole
    ? {
        ...options,
        roles: [], // Clear the wildcard
        requireAuth: true, // Explicitly require auth
      }
    : options;

  // Determine if route protection is needed
  const isProtected = hasProtectionRequirements(normalizedOptions);

  // Create the component (protected uses PermissionRoute, public uses just Suspense)
  const component = isProtected
    ? withProtectedRoute(importFn, normalizedOptions)
    : withSuspense(importFn, options);

  return {
    component,
    preload: () => importFn(),
    isProtected,
    config: options,
  };
}

// ============================================================================
// Batch Import: createLazyComponents
// ============================================================================

/**
 * Batch-Import für mehrere lazy Components
 *
 * @example
 * const errorPages = createLazyComponents({
 *   notFound: () => import('./pages/NotFound'),
 *   forbidden: () => import('./pages/Forbidden'),
 * }, { withErrorBoundary: false });
 *
 * // Usage: <errorPages.notFound />
 */
export function createLazyComponents<
  T extends Record<string, ImportFunction<ComponentType<Record<string, unknown>>>>,
>(
  imports: T,
  defaultOptions?: WithSuspenseOptions
): {
  [K in keyof T]: FC<
    React.ComponentProps<
      ReturnType<T[K]> extends Promise<infer U>
        ? U extends LazyComponentModule<infer C>
          ? C
          : never
        : never
    >
  >;
} {
  type ResultType = {
    [K in keyof T]: FC<
      React.ComponentProps<
        ReturnType<T[K]> extends Promise<infer U>
          ? U extends LazyComponentModule<infer C>
            ? C
            : never
          : never
      >
    >;
  };

  const components = {} as ResultType;

  for (const [name, importFn] of Object.entries(imports)) {
    (components as Record<string, FC>)[name] = withSuspense(importFn, defaultOptions);
  }

  return components;
}

// ============================================================================
// Batch Import: createProtectedRoutes
// ============================================================================

/**
 * Batch-Import für mehrere protected Routes
 *
 * @example
 * const adminRoutes = createProtectedRoutes({
 *   dashboard: () => import('./pages/admin/Dashboard'),
 *   users: () => import('./pages/admin/Users'),
 * }, {
 *   roles: ['Admin', 'SuperAdmin'],
 *   useSkeleton: true
 * });
 */
export function createProtectedRoutes<
  T extends Record<string, ImportFunction<ComponentType<Record<string, unknown>>>>,
>(
  imports: T,
  defaultOptions: WithProtectedRouteOptions
): Record<keyof T, LazyRouteInfo<ComponentType<Record<string, unknown>>>> {
  const routes = {} as Record<keyof T, LazyRouteInfo<ComponentType<Record<string, unknown>>>>;

  for (const [name, importFn] of Object.entries(imports)) {
    routes[name as keyof T] = createLazyRoute(importFn, defaultOptions);
  }

  return routes;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type Guards für Runtime-Checks
 */
export const isLazyComponent = (
  component: unknown
): component is LazyExoticComponent<ComponentType> =>
  component !== null &&
  typeof component === 'object' &&
  (component as { $$typeof?: symbol }).$$typeof === Symbol.for('react.lazy');

export const hasPreload = (component: unknown): component is { preload: () => Promise<unknown> } =>
  component !== null &&
  typeof component === 'object' &&
  typeof (component as { preload?: unknown }).preload === 'function';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Utility: Preload multiple components
 *
 * @example
 * await preloadComponents([
 *   dashboardRoute,
 *   profileRoute,
 *   settingsRoute,
 * ]);
 */
export const preloadComponents = async (
  components: { preload: () => Promise<unknown> }[]
): Promise<void> => {
  await Promise.all(components.map((c) => c.preload()));
};

/**
 * Hook für Preloading on Hover/Focus
 *
 * @example
 * const preloadHandlers = usePreloadOnInteraction(dashboardRoute);
 * <Link {...preloadHandlers} to="/dashboard">Dashboard</Link>
 */
interface PreloadInteractionHandlers {
  onMouseEnter: () => void;
  onFocus: () => void;
  onMouseLeave: () => void;
  onBlur: () => void;
}

export const usePreloadOnInteraction = (
  component: unknown,
  delay = 200
): PreloadInteractionHandlers => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const handleInteraction = (): void => {
    timeoutId = setTimeout(() => {
      if (hasPreload(component)) {
        void component.preload();
      }
    }, delay);
  };

  const handleClear = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };

  return {
    onMouseEnter: handleInteraction,
    onFocus: handleInteraction,
    onMouseLeave: handleClear,
    onBlur: handleClear,
  };
};
