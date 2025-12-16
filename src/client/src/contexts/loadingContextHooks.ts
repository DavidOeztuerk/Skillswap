import { useContext, useMemo } from 'react';
import { LoadingContext, type LoadingContextType } from './loadingContextValue';

/** Main hook to access loading context */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

/** Hook for component-specific loading with namespaced keys */
export const useComponentLoading = (
  componentName: string
): {
  isLoading: (operation?: string) => boolean;
  startLoading: (operation: string) => void;
  stopLoading: (operation: string) => void;
  withLoading: <T>(operation: string, fn: () => Promise<T>) => Promise<T>;
} => {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

  return useMemo(
    () => ({
      isLoading: (operation?: string) =>
        isLoading(operation ? `${componentName}.${operation}` : componentName),
      startLoading: (operation: string) => {
        startLoading(`${componentName}.${operation}`);
      },
      stopLoading: (operation: string) => {
        stopLoading(`${componentName}.${operation}`);
      },
      withLoading: <T>(operation: string, fn: () => Promise<T>) =>
        withLoading(`${componentName}.${operation}`, fn),
    }),
    [componentName, isLoading, startLoading, stopLoading, withLoading]
  );
};
