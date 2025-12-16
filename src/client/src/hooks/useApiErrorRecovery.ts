import { useState, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { withDefault } from '../utils/safeAccess';

interface ApiErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

interface ApiErrorRecoveryState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  lastAttempt: Date | null;
}

interface ApiErrorRecoveryReturn extends ApiErrorRecoveryState {
  executeWithRecovery: <T>(
    apiCall: () => Promise<T>,
    options?: ApiErrorRecoveryOptions
  ) => Promise<T>;
  retry: () => Promise<void>;
  reset: () => void;
  getErrorType: () => 'NETWORK' | 'SERVER' | 'CLIENT' | 'VALIDATION' | 'PERMISSION' | 'UNKNOWN';
  getRecoveryMessage: () => string;
  getSuggestedAction: () => string;
}

export function useApiErrorRecovery(): ApiErrorRecoveryReturn {
  const [state, setState] = useState<ApiErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    lastAttempt: null,
  });

  const [lastApiCall, setLastApiCall] = useState<(() => Promise<unknown>) | null>(null);
  const [lastOptions, setLastOptions] = useState<ApiErrorRecoveryOptions>({
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
  });

  const { isOnline, isSlowConnection } = useNetworkStatus();

  const getErrorType = useCallback(():
    | 'NETWORK'
    | 'SERVER'
    | 'CLIENT'
    | 'VALIDATION'
    | 'PERMISSION'
    | 'UNKNOWN' => {
    if (!state.error) return 'UNKNOWN';

    const errorMessage = state.error.message;
    if (!isOnline || errorMessage.includes('fetch')) {
      return 'NETWORK';
    }

    if ('status' in state.error) {
      const status = withDefault((state.error as Error & { status?: number }).status, 0);
      if (status >= 500) return 'SERVER';
      if (status >= 400) return 'CLIENT';
    }

    return 'UNKNOWN';
  }, [state.error, isOnline]);

  const getRecoveryMessage = useCallback((): string => {
    const errorType = getErrorType();

    switch (errorType) {
      case 'NETWORK':
        if (!isOnline) {
          return 'Keine Internetverbindung. Bitte überprüfen Sie Ihre Netzwerkeinstellungen.';
        }
        if (isSlowConnection) {
          return 'Langsame Verbindung erkannt. Der Vorgang kann länger dauern.';
        }
        return 'Netzwerkfehler. Bitte versuchen Sie es erneut.';

      case 'SERVER':
        return 'Server-Fehler. Der Service ist möglicherweise vorübergehend nicht verfügbar.';

      case 'CLIENT':
        return 'Anfrage-Fehler. Bitte überprüfen Sie Ihre Eingaben.';

      default:
        return 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  }, [getErrorType, isOnline, isSlowConnection]);

  const getSuggestedAction = useCallback((): string => {
    const errorType = getErrorType();

    switch (errorType) {
      case 'NETWORK':
        if (!isOnline) {
          return 'Stellen Sie eine Internetverbindung her und versuchen Sie es erneut.';
        }
        return 'Erneut versuchen oder später wiederholen.';

      case 'SERVER':
        return 'In wenigen Minuten erneut versuchen.';

      case 'CLIENT':
        return 'Eingaben überprüfen oder Support kontaktieren.';

      default:
        return 'Seite aktualisieren oder später wiederholen.';
    }
  }, [getErrorType, isOnline]);

  const calculateDelay = (
    attempt: number,
    baseDelay: number,
    exponentialBackoff: boolean
  ): number => {
    const safeAttempt = Math.max(1, withDefault(attempt, 1));
    const safeDelay = Math.max(0, withDefault(baseDelay, 1000));

    if (!exponentialBackoff) return safeDelay;
    return Math.min(safeDelay * Math.pow(2, safeAttempt - 1), 30000); // Max 30 seconds
  };

  const executeWithRecovery = useCallback(
    async <T>(apiCall: () => Promise<T>, options: ApiErrorRecoveryOptions = {}): Promise<T> => {
      const {
        maxRetries = withDefault(options.maxRetries, 3),
        retryDelay = withDefault(options.retryDelay, 1000),
        exponentialBackoff = withDefault(options.exponentialBackoff, true),
        onRetry = options.onRetry,
        onMaxRetriesReached = options.onMaxRetriesReached,
      } = options;

      setLastApiCall(() => apiCall);
      setLastOptions(options);

      let currentError: Error = new Error('Unknown error');

      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          setState((prev) => ({
            ...prev,
            isRetrying: attempt > 1,
            retryCount: attempt - 1,
            lastAttempt: new Date(),
          }));

          const result = await apiCall();

          // Success - reset error state
          setState({
            error: null,
            isRetrying: false,
            retryCount: 0,
            canRetry: true,
            lastAttempt: new Date(),
          });

          return result;
        } catch (error) {
          const caughtError = error instanceof Error ? error : new Error(String(error));
          currentError = caughtError;

          setState((prev) => ({
            ...prev,
            error: caughtError,
            isRetrying: false,
          }));

          // Don't retry on client errors (4xx) unless it's a network issue
          const errorMessage = currentError.message;
          const isNetworkError = !isOnline || errorMessage.includes('fetch');
          const isServerError =
            'status' in currentError &&
            ((currentError as Error & { status?: number }).status ?? 0) >= 500;

          if (!isNetworkError && !isServerError && attempt <= maxRetries) {
            setState((prev) => ({
              ...prev,
              canRetry: false,
            }));
            break;
          }

          // If this was the last attempt, break
          if (attempt > maxRetries) {
            setState((prev) => ({
              ...prev,
              canRetry: false,
            }));
            onMaxRetriesReached?.();
            break;
          }

          // Wait before retry
          if (attempt <= maxRetries) {
            onRetry?.(attempt);
            const delay = calculateDelay(attempt, retryDelay, exponentialBackoff);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw currentError;
    },
    [isOnline]
  );

  const retry = useCallback(async (): Promise<void> => {
    if (!lastApiCall || !state.canRetry) return;

    try {
      await executeWithRecovery(lastApiCall, lastOptions);
    } catch (_error) {
      // Error is already handled in executeWithRecovery
    }
  }, [lastApiCall, lastOptions, state.canRetry, executeWithRecovery]);

  const reset = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
      lastAttempt: null,
    });
    setLastApiCall(null);
    setLastOptions({
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
    });
  }, []);

  return {
    ...state,
    executeWithRecovery,
    retry,
    reset,
    getErrorType,
    getRecoveryMessage,
    getSuggestedAction,
  };
}

export default useApiErrorRecovery;
