import { useState, useCallback } from 'react';
import { withDefault } from '../utils/safeAccess';
import { useNetworkStatus } from './useNetworkStatus';

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

      case 'VALIDATION':
        return 'Validierungsfehler. Bitte überprüfen Sie Ihre Eingaben.';

      case 'PERMISSION':
        return 'Zugriff verweigert. Sie haben keine Berechtigung für diese Aktion.';

      case 'UNKNOWN':
        return 'Ein unerwarteter Fehler ist aufgetreten.';
      default: {
        // Exhaustive check - this should never be reached
        const _exhaustiveCheck: never = errorType;
        return _exhaustiveCheck;
      }
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

      case 'VALIDATION':
        return 'Eingaben korrigieren und erneut versuchen.';

      case 'PERMISSION':
        return 'Wenden Sie sich an einen Administrator.';

      case 'UNKNOWN':
        return 'Seite aktualisieren oder später wiederholen.';
      default: {
        // Exhaustive check - this should never be reached
        const _exhaustiveCheck: never = errorType;
        return _exhaustiveCheck;
      }
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
    return Math.min(safeDelay * 2 ** (safeAttempt - 1), 30000); // Max 30 seconds
  };

  /** Helper to check if error is retryable */
  const isRetryableError = useCallback(
    (error: Error): boolean => {
      const errorMessage = error.message;
      const isNetworkError = !isOnline || errorMessage.includes('fetch');
      const isServerError =
        'status' in error && ((error as Error & { status?: number }).status ?? 0) >= 500;
      return isNetworkError || isServerError;
    },
    [isOnline]
  );

  /** Helper to mark retry as exhausted */
  const markRetryExhausted = useCallback((onMaxRetriesReached?: () => void): void => {
    setState((prev) => ({ ...prev, canRetry: false }));
    onMaxRetriesReached?.();
  }, []);

  /** Helper to determine if retry should continue */
  const shouldContinueRetrying = useCallback(
    (error: Error, attempt: number, maxRetries: number): boolean =>
      isRetryableError(error) && attempt <= maxRetries,
    [isRetryableError]
  );

  const executeWithRecovery = useCallback(
    async <T>(apiCall: () => Promise<T>, options: ApiErrorRecoveryOptions = {}): Promise<T> => {
      const {
        maxRetries = 3,
        retryDelay = 1000,
        exponentialBackoff = true,
        onRetry,
        onMaxRetriesReached,
      } = options;

      setLastApiCall(() => apiCall);
      setLastOptions(options);

      let currentError: Error = new Error('Unknown error');

      // Retry loop requires sequential execution - each attempt must complete before the next
      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          setState((prev) => ({
            ...prev,
            isRetrying: attempt > 1,
            retryCount: attempt - 1,
            lastAttempt: new Date(),
          }));

          // eslint-disable-next-line no-await-in-loop -- Intentional: retry must be sequential
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

          // Check if we should stop retrying
          if (!shouldContinueRetrying(currentError, attempt, maxRetries)) {
            markRetryExhausted(attempt > maxRetries ? onMaxRetriesReached : undefined);
            break;
          }

          // Wait before retry
          onRetry?.(attempt);
          const delay = calculateDelay(attempt, retryDelay, exponentialBackoff);
          // eslint-disable-next-line no-await-in-loop -- Intentional: delay before next retry
          await new Promise<void>((resolve) => {
            setTimeout(resolve, delay);
          });
        }
      }

      throw currentError;
    },
    [shouldContinueRetrying, markRetryExhausted]
  );

  const retry = useCallback(async (): Promise<void> => {
    if (!lastApiCall || !state.canRetry) return;

    try {
      await executeWithRecovery(lastApiCall, lastOptions);
    } catch {
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
