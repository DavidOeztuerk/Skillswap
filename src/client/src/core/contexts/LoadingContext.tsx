import React, { useState, useCallback, useRef, useMemo, memo } from 'react';
import { LoadingContext, type LoadingContextType, type LoadingState } from './loadingContextValue';

// ============================================================================
// Provider
// ============================================================================

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = memo(({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  // Refs for stable callback references
  const loadingCountRef = useRef<Record<string, number>>({});
  const loadingStatesRef = useRef<LoadingState>(loadingStates);
  loadingStatesRef.current = loadingStates;

  const startLoading = useCallback((key: string) => {
    loadingCountRef.current[key] = (loadingCountRef.current[key] || 0) + 1;

    setLoadingStates((prev) => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    if (loadingCountRef.current[key]) {
      loadingCountRef.current[key]--;

      if (loadingCountRef.current[key] === 0) {
        // Remove key by creating new object without it (avoids dynamic delete)
        const { [key]: _, ...rest } = loadingCountRef.current;
        loadingCountRef.current = rest;

        setLoadingStates((prev) => {
          if (!prev[key]) return prev;
          // Remove key by destructuring (avoids dynamic delete)
          const { [key]: __, ...remaining } = prev;
          return remaining;
        });
      }
    }
  }, []);

  // STABLE: Uses ref instead of state dependency
  const isLoading = useCallback((key?: string): boolean => {
    if (key !== undefined) {
      return loadingStatesRef.current[key] ?? false;
    }
    return Object.keys(loadingStatesRef.current).length > 0;
  }, []);

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

  const getLoadingStates = useCallback((): LoadingState => ({ ...loadingStatesRef.current }), []);

  const isAnyLoading = useCallback(
    (): boolean => Object.keys(loadingStatesRef.current).length > 0,
    []
  );

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    loadingCountRef.current = {};
  }, []);

  // STABLE: All callbacks have empty or stable dependencies
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
});

LoadingProvider.displayName = 'LoadingProvider';
