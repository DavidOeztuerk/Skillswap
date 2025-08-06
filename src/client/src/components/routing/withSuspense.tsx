import { lazy, Suspense, ComponentType, ErrorInfo } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import PageLoader from '../ui/PageLoader';
import PrivateRoute from '../../routes/PrivateRoute';
import { withPageErrorBoundary } from './withErrorBoundary';

interface WithSuspenseOptions {
  fallback?: React.ReactNode;
  loadingMessage?: string;
  withErrorBoundary?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  skeletonVariant?: 'dashboard' | 'profile' | 'list' | 'details' | 'form';
  useSkeleton?: boolean;
}

interface WithPrivateRouteOptions extends WithSuspenseOptions {
  requiredRoles?: string[];
  requiredRole?: string;
  requiredPermissions?: string[];
  requiredPermission?: string;
  redirectTo?: string;
}

export function withSuspense<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: WithSuspenseOptions = {}
) {
  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: React.ComponentProps<T>) => {
    const fallback = options.fallback || (
      options.useSkeleton ? (
        <PageLoader
          variant={options.skeletonVariant || 'dashboard'}
          message={options.loadingMessage || "Seite wird geladen..."}
        />
      ) : (
        <LoadingSpinner
          fullPage
          message={options.loadingMessage || "Seite wird geladen..."}
        />
      )
    );

    const ComponentWithSuspense = (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );

    if (options.withErrorBoundary !== false) {
      const ComponentWithErrorBoundary = withPageErrorBoundary(
        () => ComponentWithSuspense,
        { onError: options.onError }
      );
      return <ComponentWithErrorBoundary />;
    }

    return ComponentWithSuspense;
  };

  WrappedComponent.displayName = `withSuspense(${LazyComponent.name || 'Component'})`;

  return WrappedComponent;
}

export function withPrivateRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: WithPrivateRouteOptions = {}
) {
  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: React.ComponentProps<T>) => {
    const fallback = options.fallback || (
      options.useSkeleton ? (
        <PageLoader
          variant={options.skeletonVariant || 'dashboard'}
          message={options.loadingMessage || "Seite wird geladen..."}
        />
      ) : (
        <LoadingSpinner
          fullPage
          message={options.loadingMessage || "Seite wird geladen..."}
        />
      )
    );

    const ComponentWithAuth = (
      <PrivateRoute
        requiredRoles={options.requiredRoles}
        requiredRole={options.requiredRole}
        requiredPermissions={options.requiredPermissions}
        requiredPermission={options.requiredPermission}
        redirectTo={options.redirectTo}
      >
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </PrivateRoute>
    );

    if (options.withErrorBoundary !== false) {
      const ComponentWithErrorBoundary = withPageErrorBoundary(
        () => ComponentWithAuth,
        { onError: options.onError }
      );
      return <ComponentWithErrorBoundary />;
    }

    return ComponentWithAuth;
  };

  WrappedComponent.displayName = `withPrivateRoute(${LazyComponent.name || 'Component'})`;

  return WrappedComponent;
}
