import { useCallback, useMemo } from 'react';
import { processApiError, getUserFriendlyMessage, type ProcessedError } from '../utils/errorUtils';

export interface FormErrorState {
  hasError: boolean;
  errorMessage: string;
  errorCode?: string;
  traceId?: string;
  isRetryable: boolean;
  isAuthError: boolean;
  showRetry: boolean;
}

/**
 * Enhanced hook for handling form errors with API integration
 */
export const useFormError = (
  error: unknown
): {
  hasError: boolean;
  errorMessage: string;
  errorCode?: string;
  traceId?: string;
  isRetryable: boolean;
  isAuthError: boolean;
  showRetry: boolean;
  processedError: ProcessedError | null;
  resetError: () => void;
} => {
  // Process the error into standardized format
  const processedError = useMemo((): ProcessedError | null => {
    if (error === null || error === undefined) return null;
    return processApiError(error);
  }, [error]);

  // Get user-friendly error message
  const errorMessage = useMemo((): string => {
    if (!processedError) return '';

    // Try to get user-friendly message based on ErrorCode first
    const friendlyMessage = getUserFriendlyMessage(processedError.errorCode);
    if (friendlyMessage) return friendlyMessage;

    // Fall back to original message
    return processedError.message;
  }, [processedError]);

  // Determine error state
  const errorState = useMemo((): FormErrorState => {
    if (!processedError) {
      return {
        hasError: false,
        errorMessage: '',
        isRetryable: false,
        isAuthError: false,
        showRetry: false,
      };
    }

    return {
      hasError: true,
      errorMessage,
      errorCode: processedError.errorCode ?? String(processedError.code), // Prefer semantic error code from backend
      traceId: processedError.traceId,
      isRetryable: processedError.type === 'NETWORK' || processedError.type === 'SERVER',
      isAuthError: processedError.type === 'AUTH' && processedError.code === 401,
      showRetry: processedError.type === 'NETWORK' || processedError.type === 'SERVER',
    };
  }, [processedError, errorMessage]);

  // Reset error callback
  const resetError = useCallback(() => {
    // This would typically call the parent's error clearing function
    // The implementation depends on how errors are managed in the parent component
  }, []);

  return {
    ...errorState,
    processedError,
    resetError,
  };
};

export default useFormError;
