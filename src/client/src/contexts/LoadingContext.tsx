import React, { useState, useCallback, useRef, useMemo } from 'react';
import { LoadingContext, type LoadingContextType, type LoadingState } from './loadingContextValue';

// ============================================================================
// Provider
// ============================================================================

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  // Track nested loading calls (for operations that might overlap)
  const loadingCountRef = useRef<Record<string, number>>({});

  const startLoading = useCallback((key: string) => {
    // Increment count for nested operations
    loadingCountRef.current[key] = (loadingCountRef.current[key] || 0) + 1;

    setLoadingStates((prev) => {
      // Only update if not already loading
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    // Decrement count
    if (loadingCountRef.current[key]) {
      loadingCountRef.current[key]--;

      // Only stop when count reaches 0
      if (loadingCountRef.current[key] === 0) {
        // Remove from count tracking
        const currentKey = key;
        loadingCountRef.current = Object.fromEntries(
          Object.entries(loadingCountRef.current).filter(([k]) => k !== currentKey)
        );

        setLoadingStates((prev) => {
          if (!prev[key]) return prev;
          // Remove from loading states
          return Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key));
        });
      }
    }
  }, []);

  const isLoading = useCallback(
    (key?: string): boolean => {
      if (key !== undefined) {
        return loadingStates[key] ?? false;
      }
      return Object.keys(loadingStates).length > 0;
    },
    [loadingStates]
  );

  const withLoading = useCallback(
    async <T,>(key: string, operation: () => Promise<T>): Promise<T> => {
      startLoading(key);
      try {
        return await operation();
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  const getLoadingStates = useCallback((): LoadingState => ({ ...loadingStates }), [loadingStates]);

  const isAnyLoading = useCallback(
    (): boolean => Object.keys(loadingStates).length > 0,
    [loadingStates]
  );

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    loadingCountRef.current = {};
  }, []);

  // Memoize value to prevent unnecessary re-renders
  // Functions are stable due to useCallback
  const value = useMemo<LoadingContextType>(
    () => ({
      isLoading,
      startLoading,
      stopLoading,
      withLoading,
      getLoadingStates,
      isAnyLoading,
      clearAllLoading,
    }),
    [
      isLoading,
      startLoading,
      stopLoading,
      withLoading,
      getLoadingStates,
      isAnyLoading,
      clearAllLoading,
    ]
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};
