import React, { ComponentType, ErrorInfo } from 'react';
import ErrorBoundary from '../error/ErrorBoundary';

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function withErrorBoundary<T extends ComponentType<any>>(
  Component: T,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: any) => {
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
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

export function withPageErrorBoundary<T extends ComponentType<any>>(
  Component: T,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, {
    ...options,
    level: 'page',
  });
}

export function withSectionErrorBoundary<T extends ComponentType<any>>(
  Component: T,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, {
    ...options,
    level: 'section',
  });
}