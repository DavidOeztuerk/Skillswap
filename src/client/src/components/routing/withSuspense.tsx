import { 
  lazy, 
  Suspense, 
  ComponentType, 
  ErrorInfo, 
  ReactNode,
  LazyExoticComponent,
  FC,
  memo,
  ReactElement
} from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import PageLoader from '../ui/PageLoader';
import PrivateRoute, { PrivateRouteConfig } from '../../routes/PrivateRoute';
import { withPageErrorBoundary } from './withErrorBoundary';

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
 * Kombinierte Optionen für withSuspense
 */
interface WithSuspenseOptions extends BaseLoadingOptions, ErrorBoundaryOptions {}

/**
 * Kombinierte Optionen für withPrivateRoute
 */
interface WithPrivateRouteOptions extends WithSuspenseOptions, PrivateRouteConfig {
  // PrivateRouteConfig bringt bereits roles, permissions, redirectTo etc. mit
  requireAuth?: boolean; // Explicitly require authentication without specific roles
}

/**
 * Typ für lazy-loaded Components
 */
type LazyComponentModule<T> = { default: T };
type ImportFunction<T> = () => Promise<LazyComponentModule<T>>;

/**
 * Helper: Erstellt die Fallback-Komponente basierend auf Optionen
 */
const createFallback = (options: BaseLoadingOptions): ReactNode => {
  if (options.fallback) {
    return options.fallback;
  }

  const message = options.loadingMessage || "Seite wird geladen...";
  
  if (options.useSkeleton) {
    return (
      <PageLoader
        variant={options.skeletonVariant || 'dashboard'}
        message={message}
      />
    );
  }
  
  return <LoadingSpinner fullPage message={message} />;
};

/**
 * Helper: Wendet Error Boundary an, falls gewünscht
 */
const applyErrorBoundary = <P extends object>(
  Component: ComponentType<P>,
  options: ErrorBoundaryOptions
): ComponentType<P> => {
  if (options.withErrorBoundary === false) {
    return Component;
  }

  // withPageErrorBoundary erwartet möglicherweise andere Props
  const errorBoundaryOptions = {
    onError: options.onError,
    ...(options.errorFallback && { fallback: options.errorFallback }),
  };

  return withPageErrorBoundary(Component, errorBoundaryOptions) as ComponentType<P>;
};

/**
 * Basis HOC für lazy loading mit Suspense
 */
export function withSuspense<T extends ComponentType<any>>(
  importFn: ImportFunction<T>,
  options: WithSuspenseOptions = {}
): FC<React.ComponentProps<T>> {
  // Lazy load einmal erstellen (nicht bei jedem Render)
  const LazyComponent = lazy(importFn) as LazyExoticComponent<T>;
  
  // Wrapper-Komponente mit memo für Performance
  const SuspenseWrapper: FC<React.ComponentProps<T>> = memo((props) => {
    const fallback = createFallback(options);
    
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  });
  
  // Display name für Dev-Tools
  SuspenseWrapper.displayName = `withSuspense(LazyComponent)`;
  
  // Error Boundary anwenden mit korrekten Typen
  return applyErrorBoundary<React.ComponentProps<T>>(
    SuspenseWrapper, 
    options
  ) as FC<React.ComponentProps<T>>;
}

/**
 * HOC für lazy loading mit PrivateRoute
 */
export function withPrivateRoute<T extends ComponentType<any>>(
  importFn: ImportFunction<T>,
  options: WithPrivateRouteOptions = {}
): FC<React.ComponentProps<T>> {
  // Lazy load einmal erstellen
  const LazyComponent = lazy(importFn) as LazyExoticComponent<T>;
  
  // Extrahiere die verschiedenen Option-Gruppen
  const {
    // Loading options
    fallback,
    loadingMessage,
    skeletonVariant,
    useSkeleton,
    // Error boundary options
    withErrorBoundary,
    onError,
    errorFallback,
    // PrivateRoute options
    ...privateRouteConfig
  } = options;
  
  const loadingOptions: BaseLoadingOptions = {
    fallback,
    loadingMessage,
    skeletonVariant,
    useSkeleton,
  };
  
  const errorOptions: ErrorBoundaryOptions = {
    withErrorBoundary,
    onError,
    errorFallback,
  };
  
  // Wrapper-Komponente
  const PrivateRouteWrapper: FC<React.ComponentProps<T>> = memo((props) => {
    const fallbackElement = createFallback(loadingOptions);
    
    return (
      <PrivateRoute {...privateRouteConfig}>
        <Suspense fallback={fallbackElement}>
          <LazyComponent {...(props as any)} />
        </Suspense>
      </PrivateRoute>
    );
  });
  
  // Display name für Dev-Tools
  PrivateRouteWrapper.displayName = `withPrivateRoute(LazyComponent)`;
  
  // Error Boundary anwenden mit korrekten Typen
  return applyErrorBoundary<React.ComponentProps<T>>(
    PrivateRouteWrapper, 
    errorOptions
  ) as FC<React.ComponentProps<T>>;
}

/**
 * Erweiterte Version mit Preloading-Support
 */
export function withPreloadableSuspense<T extends ComponentType<any>>(
  importFn: ImportFunction<T>,
  options: WithSuspenseOptions = {}
) {
  // Preload-Funktion exponieren
  const preload = () => importFn();
  
  const Component = withSuspense(importFn, options);
  
  // Preload-Methode an die Komponente anhängen
  (Component as any).preload = preload;
  
  return Component as FC<React.ComponentProps<T>> & { preload: () => Promise<LazyComponentModule<T>> };
}

/**
 * Factory für Router-Konfiguration
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: ImportFunction<T>,
  options: WithPrivateRouteOptions = {}
) {
  // Check if authentication is required (special role '*' means any authenticated user)
  const hasAuthRequirements = Boolean(
    options.roles?.length || 
    options.permissions?.length ||
    options.requireAuth
  );
  
  // If roles contain '*', it means any authenticated user
  const modifiedOptions = options.roles?.includes('*') 
    ? { ...options, roles: [], requireAuth: true } // Clear roles but explicitly require auth
    : options;
  
  return {
    component: hasAuthRequirements 
      ? withPrivateRoute(importFn, modifiedOptions)
      : withSuspense(importFn, options),
    preload: () => importFn(),
    isProtected: hasAuthRequirements,
    config: options,
  };
}

/**
 * Batch-Import für mehrere lazy Components
 */
export function createLazyComponents<
  T extends Record<string, ImportFunction<ComponentType<any>>>
>(
  imports: T,
  defaultOptions?: WithSuspenseOptions
): {
  [K in keyof T]: FC<React.ComponentProps<ReturnType<T[K]> extends Promise<infer U> 
    ? U extends LazyComponentModule<infer C> 
      ? C 
      : never 
    : never>>
} {
  const components = {} as any;
  
  for (const [name, importFn] of Object.entries(imports)) {
    components[name] = withSuspense(importFn as any, defaultOptions);
  }
  
  return components;
}

/**
 * Type Guards für Runtime-Checks
 */
export const isLazyComponent = (component: any): component is LazyExoticComponent<any> => {
  return component && component.$$typeof === Symbol.for('react.lazy');
};

export const hasPreload = (component: any): component is { preload: Function } => {
  return component && typeof component.preload === 'function';
};

/**
 * Utility: Preload multiple components
 */
export const preloadComponents = async (
  components: Array<{ preload: () => Promise<any> }>
): Promise<void> => {
  await Promise.all(components.map(c => c.preload()));
};

/**
 * Hook für Preloading on Hover/Focus
 */
export const usePreloadOnInteraction = (
  component: any,
  delay: number = 200
) => {
  let timeoutId: NodeJS.Timeout;
  
  const handleInteraction = () => {
    timeoutId = setTimeout(() => {
      if (hasPreload(component)) {
        component.preload();
      }
    }, delay);
  };
  
  const handleClear = () => {
    if (timeoutId) {
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

// Re-export types
export type { 
  WithSuspenseOptions, 
  WithPrivateRouteOptions,
  BaseLoadingOptions,
  ErrorBoundaryOptions,
  ImportFunction,
  LazyComponentModule
};