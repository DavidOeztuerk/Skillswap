// src/utils/errorUtils.ts
export interface ErrorInfo {
  message: string;
  code?: string | number;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Extracts error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  if (typeof error === 'string') return error;

  if (error instanceof Error) return error.message;

  if (typeof error === 'object' && error !== null) {
    // Check for API response format
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    // Check for error details
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }

    // Check for nested message
    if ('data' in error && typeof error.data === 'object' && error.data !== null && 'message' in error.data) {
      return String(error.data.message);
    }
  }

  return 'An unknown error occurred';
}

/**
 * Extracts error code from various error types
 */
export function extractErrorCode(error: unknown): string | number | undefined {
  if (!error || typeof error !== 'object') return undefined;

  if ('code' in error) return error.code as string | number;
  if ('status' in error) return error.status as number;
  if ('statusCode' in error) return error.statusCode as number;

  return undefined;
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message?.includes('fetch')) {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.message?.includes('Network') ||
      error.message?.includes('fetch') ||
      error.message?.includes('timeout') ||
      error.message?.includes('connection')
    );
  }

  return false;
}

/**
 * Checks if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  const code = extractErrorCode(error);
  return code === 401 || code === 'UNAUTHORIZED';
}

/**
 * Checks if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  const code = extractErrorCode(error);
  return code === 403 || code === 'FORBIDDEN';
}

/**
 * Checks if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const code = extractErrorCode(error);
  return code === 400 || code === 422 || code === 'VALIDATION_ERROR';
}

/**
 * Checks if error is a server error
 */
export function isServerError(error: unknown): boolean {
  const code = extractErrorCode(error);
  return typeof code === 'number' && code >= 500;
}

/**
 * Extracts validation errors from API response
 */
export function extractValidationErrors(error: unknown): Record<string, string[]> {
  if (!error || typeof error !== 'object') return {};

  // Check for standard validation error format
  if ('errors' in error && typeof error.errors === 'object' && error.errors !== null) {
    const errors = error.errors as Record<string, unknown>;
    const result: Record<string, string[]> = {};

    for (const [field, messages] of Object.entries(errors)) {
      if (Array.isArray(messages)) {
        result[field] = messages.map(String);
      } else if (typeof messages === 'string') {
        result[field] = [messages];
      }
    }

    return result;
  }

  // Check for nested validation errors
  if ('data' in error && typeof error.data === 'object' && error.data !== null && 'errors' in error.data) {
    return extractValidationErrors(error.data);
  }

  return {};
}

/**
 * Creates a standardized error object
 */
export function createErrorInfo(
  message: string,
  code?: string | number,
  field?: string,
  details?: Record<string, unknown>
): ErrorInfo {
  return {
    message,
    code,
    field,
    details,
  };
}

/**
 * Creates validation error objects
 */
export function createValidationErrors(errors: Record<string, string | string[]>): ValidationError[] {
  const result: ValidationError[] = [];

  for (const [field, messages] of Object.entries(errors)) {
    const messageArray = Array.isArray(messages) ? messages : [messages];
    
    for (const message of messageArray) {
      result.push({
        field,
        message,
      });
    }
  }

  return result;
}

/**
 * Formats error for display
 */
export function formatErrorForDisplay(error: unknown): string {
  const message = extractErrorMessage(error);
  const code = extractErrorCode(error);

  if (code) {
    return `${message} (${code})`;
  }

  return message;
}

/**
 * Checks if error should be retried
 */
export function shouldRetryError(error: unknown): boolean {
  const code = extractErrorCode(error);

  // Don't retry client errors (except 401)
  if (typeof code === 'number' && code >= 400 && code < 500 && code !== 401) {
    return false;
  }

  // Don't retry validation errors
  if (isValidationError(error)) {
    return false;
  }

  // Retry network errors and server errors
  return isNetworkError(error) || isServerError(error);
}

/**
 * Gets user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  if (isAuthError(error)) {
    return 'Authentication required. Please log in again.';
  }

  if (isPermissionError(error)) {
    return 'You do not have permission to perform this action.';
  }

  if (isValidationError(error)) {
    return 'Please check your input and try again.';
  }

  if (isServerError(error)) {
    return 'Server error. Please try again later.';
  }

  const message = extractErrorMessage(error);
  
  // Return original message if it's user-friendly
  if (message && !message.toLowerCase()?.includes('error') && message?.length < 100) {
    return message;
  }

  return 'An unexpected error occurred. Please try again.';
}