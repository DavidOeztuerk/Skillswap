// src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { errorService } from '../services/errorService';
import { ensureString, withDefault } from '../utils/safeAccess';

export interface UseErrorHandlerReturn {
  handleError: (error: unknown, message?: string, context?: string) => void;
  handleApiError: (error: unknown, context?: string) => void;
  handleValidationError: (errors: Record<string, string[]>, context?: string) => void;
  handleComponentError: (error: Error, errorInfo: { componentStack: string }, context?: string) => void;
}

/**
 * Custom hook for centralized error handling in React components
 */
export const useErrorHandler = (defaultContext?: string): UseErrorHandlerReturn => {
  const handleError = useCallback((error: unknown, message?: string, context?: string) => {
    errorService.handleError(
      error, 
      ensureString(message), 
      withDefault(context, defaultContext)
    );
  }, [defaultContext]);

  const handleApiError = useCallback((error: unknown, context?: string) => {
    errorService.handleApiError(
      error, 
      withDefault(context, defaultContext)
    );
  }, [defaultContext]);

  const handleValidationError = useCallback((errors: Record<string, string[]>, context?: string) => {
    errorService.handleValidationError(
      withDefault(errors, {}), 
      withDefault(context, defaultContext)
    );
  }, [defaultContext]);

  const handleComponentError = useCallback((error: Error, errorInfo: { componentStack: string }, context?: string) => {
    errorService.handleComponentError(
      error, 
      withDefault(errorInfo, { componentStack: '' }), 
      withDefault(context, defaultContext)
    );
  }, [defaultContext]);

  return {
    handleError,
    handleApiError,
    handleValidationError,
    handleComponentError,
  };
};

export default useErrorHandler;