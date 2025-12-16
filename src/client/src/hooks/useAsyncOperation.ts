import { useState, useCallback } from 'react';
import errorService from '../services/errorService';
import { useLoading } from '../contexts/loadingContextHooks';

interface UseAsyncOperationOptions {
  // Key for loading state tracking
  loadingKey?: string;
  // Success callback
  onSuccess?: (data: unknown) => void;
  // Error callback
  onError?: (error: unknown) => void;
  // Whether to show error notification
  showErrorNotification?: boolean;
  // Custom error message
  errorMessage?: string;
}

interface UseAsyncOperationResult<T> {
  // Execute the async operation
  execute: (operation: () => Promise<T>) => Promise<T | undefined>;
  // Loading state
  isLoading: boolean;
  // Error state
  error: Error | null;
  // Success state
  isSuccess: boolean;
  // Data from last successful operation
  data: T | null;
  // Reset all states
  reset: () => void;
}

export function useAsyncOperation<T = unknown>(
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationResult<T> {
  const {
    loadingKey,
    onSuccess,
    onError,
    showErrorNotification = true,
    errorMessage = 'Operation failed',
  } = options;

  const { withLoading, isLoading: contextIsLoading } = useLoading();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const isLoading = loadingKey !== undefined ? contextIsLoading(loadingKey) : localLoading;

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | undefined> => {
      try {
        setError(null);
        setIsSuccess(false);

        let result: T;

        if (loadingKey !== undefined) {
          // Use context loading if key is provided
          result = await withLoading(loadingKey, operation);
        } else {
          // Use local loading state
          setLocalLoading(true);
          try {
            result = await operation();
          } finally {
            setLocalLoading(false);
          }
        }

        setData(result);
        setIsSuccess(true);
        onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsSuccess(false);

        if (showErrorNotification) {
          errorService.handleError(
            err instanceof Error ? err : new Error(String(err)),
            errorMessage
          );
        }

        onError?.(err);
        return undefined;
      }
    },
    [loadingKey, withLoading, onSuccess, onError, showErrorNotification, errorMessage]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsSuccess(false);
    setData(null);
    setLocalLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    error,
    isSuccess,
    data,
    reset,
  };
}

// Hook for form submissions
export function useFormSubmit<T = unknown>(
  loadingKey?: string,
  options?: Omit<UseAsyncOperationOptions, 'loadingKey'>
): UseAsyncOperationResult<T> {
  return useAsyncOperation<T>({
    loadingKey,
    showErrorNotification: true,
    ...options,
  });
}

// Hook for data fetching
export function useDataFetch<T = unknown>(
  loadingKey?: string,
  options?: Omit<UseAsyncOperationOptions, 'loadingKey'>
): UseAsyncOperationResult<T> {
  return useAsyncOperation<T>({
    loadingKey,
    showErrorNotification: false,
    ...options,
  });
}
