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
  getErrorType: () => 'network' | 'server' | 'client' | 'unknown';
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

  const [lastApiCall, setLastApiCall] = useState<(() => Promise<any>) | null>(null);
  const [lastOptions, setLastOptions] = useState<ApiErrorRecoveryOptions>({});
  
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const getErrorType = useCallback((): 'network' | 'server' | 'client' | 'unknown' => {
    if (!state.error) return 'unknown';

    const errorMessage = state.error?.message;
    if (!isOnline || errorMessage?.includes('fetch')) {
      return 'network';
    }

    if ('status' in state.error) {
      const status = withDefault((state.error as any).status, 0);
      if (status >= 500) return 'server';
      if (status >= 400) return 'client';
    }

    return 'unknown';
  }, [state.error, isOnline]);

  const getRecoveryMessage = useCallback((): string => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        if (!isOnline) {
          return 'Keine Internetverbindung. Bitte überprüfen Sie Ihre Netzwerkeinstellungen.';
        }
        if (isSlowConnection) {
          return 'Langsame Verbindung erkannt. Der Vorgang kann länger dauern.';
        }
        return 'Netzwerkfehler. Bitte versuchen Sie es erneut.';
      
      case 'server':
        return 'Server-Fehler. Der Service ist möglicherweise vorübergehend nicht verfügbar.';
      
      case 'client':
        return 'Anfrage-Fehler. Bitte überprüfen Sie Ihre Eingaben.';
      
      default:
        return 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  }, [getErrorType, isOnline, isSlowConnection]);

  const getSuggestedAction = useCallback((): string => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        if (!isOnline) {
          return 'Stellen Sie eine Internetverbindung her und versuchen Sie es erneut.';
        }
        return 'Erneut versuchen oder später wiederholen.';
      
      case 'server':
        return 'In wenigen Minuten erneut versuchen.';
      
      case 'client':
        return 'Eingaben überprüfen oder Support kontaktieren.';
      
      default:
        return 'Seite aktualisieren oder später wiederholen.';
    }
  }, [getErrorType, isOnline]);

  const calculateDelay = (attempt: number, baseDelay: number, exponentialBackoff: boolean): number => {
    const safeAttempt = Math.max(1, withDefault(attempt, 1));
    const safeDelay = Math.max(0, withDefault(baseDelay, 1000));
    
    if (!exponentialBackoff) return safeDelay;
    return Math.min(safeDelay * Math.pow(2, safeAttempt - 1), 30000); // Max 30 seconds
  };

  const executeWithRecovery = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: ApiErrorRecoveryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = withDefault(options.maxRetries, 3),
      retryDelay = withDefault(options.retryDelay, 1000),
      exponentialBackoff = withDefault(options.exponentialBackoff, true),
      onRetry = options.onRetry,
      onMaxRetriesReached = options.onMaxRetriesReached,
    } = options;

    setLastApiCall(() => apiCall);
    setLastOptions(options);

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        setState(prev => ({
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
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          error: lastError,
          isRetrying: false,
        }));

        // Don't retry on client errors (4xx) unless it's a network issue
        const isNetworkError = !isOnline || lastError.message?.includes('fetch');
        const isServerError = 'status' in lastError && (lastError as any).status >= 500;
        
        if (!isNetworkError && !isServerError && attempt <= maxRetries) {
          setState(prev => ({
            ...prev,
            canRetry: false,
          }));
          break;
        }

        // If this was the last attempt, break
        if (attempt > maxRetries) {
          setState(prev => ({
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
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }, [isOnline]);

  const retry = useCallback(async (): Promise<void> => {
    if (!lastApiCall || !state.canRetry) return;

    try {
      await executeWithRecovery(lastApiCall, lastOptions);
    } catch (error) {
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
    setLastOptions({});
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