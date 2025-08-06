import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import errorService from '../services/errorService';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorType: 'NETWORK' | 'SERVER' | 'AUTH' | 'VALIDATION' | 'PERMISSION' | 'UNKNOWN' | null;
}

export interface UseErrorHandlerReturn extends ErrorState {
  handleError: (error: unknown, context?: string) => void;
  clearError: () => void;
  retry: (fn: () => Promise<void> | void) => Promise<void>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const navigate = useNavigate();
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorType: null,
  });

  const determineErrorType = useCallback((error: unknown): ErrorState['errorType'] => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'NETWORK';
    }
    
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      
      if (status === 401) return 'AUTH';
      if (status === 403) return 'PERMISSION';
      if (status >= 400 && status < 500) return 'VALIDATION';
      if (status >= 500) return 'SERVER';
    }
    
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      
      if (code === 'VALIDATION_ERROR') return 'VALIDATION';
      if (code === 'NETWORK_ERROR') return 'NETWORK';
    }
    
    return 'UNKNOWN';
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    const errorType = determineErrorType(error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    setErrorState({
      error: errorObj,
      isError: true,
      errorType,
    });

    errorService.handleError(error, undefined, context);

    if (errorType === 'AUTH') {
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 2000);
    }
  }, [determineErrorType, navigate]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorType: null,
    });
  }, []);

  const retry = useCallback(async (fn: () => Promise<void> | void) => {
    clearError();
    try {
      await fn();
    } catch (error) {
      handleError(error, 'retry-operation');
    }
  }, [clearError, handleError]);

  return {
    ...errorState,
    handleError,
    clearError,
    retry,
  };
}

export default useErrorHandler;