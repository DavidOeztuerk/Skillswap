import React, { ComponentType, ComponentProps, ErrorInfo } from 'react';
import ErrorBoundary from '../error/ErrorBoundary';

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorBoundary<T extends ComponentType<any>>(
  Component: T,
  options: WithErrorBoundaryOptions = {}
): T {
  const WrappedComponent = ((props: ComponentProps<T>) => {
    return (
      <ErrorBoundary
        fallback={options.fallback}
        showDetails={options.showDetails}
        level={options.level || 'component'}
        onError={options.onError}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  }) as unknown as T;

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withPageErrorBoundary<T extends ComponentType<any>>(
  Component: T,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, {
    ...options,
    level: 'page',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSectionErrorBoundary<T extends ComponentType<any>>(
  Component: T,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, {
    ...options,
    level: 'section',
  });
}