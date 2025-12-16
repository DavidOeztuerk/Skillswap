import React, { type ErrorInfo } from 'react';
import ErrorBoundary from '../error/ErrorBoundary';

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// The simplest variant - should work in 99% of cases
export function withErrorBoundary<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.ComponentType<P> {
  const WrappedComponent = (props: P): React.ReactElement => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  const componentName = Component.displayName ?? Component.name;
  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

  return WrappedComponent;
}

export function withPageErrorBoundary<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
): React.ComponentType<P> {
  return withErrorBoundary(Component, {
    ...options,
    level: 'page' as const,
  });
}

export function withSectionErrorBoundary<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
): React.ComponentType<P> {
  return withErrorBoundary(Component, {
    ...options,
    level: 'section' as const,
  });
}
