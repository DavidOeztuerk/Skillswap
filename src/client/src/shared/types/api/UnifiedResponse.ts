/**
 * Unified Response System für konsistente API-Kommunikation
 */

// Base Response Interface - für alle API-Responses
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
  traceId?: string;
}

// Success Response mit Daten
export interface SuccessResponse<T> extends BaseResponse {
  data: T;
}

// Error Response ohne Daten
export interface ErrorResponse extends BaseResponse {
  errors: string[];
  errorCode?: string;
  statusCode?: number;
}

// Union Type für alle möglichen Responses
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Paged Response für Listen mit Pagination
// IMPORTANT: Matches backend CQRS.Models.PagedResponse<T> flat structure
export interface PagedSuccessResponse<T> extends SuccessResponse<T[]> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type PagedResponse<T> = PagedSuccessResponse<T> | ErrorResponse;

// Type Guards für Type Safety
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success && 'data' in response;
}

export function isErrorResponse<T>(response: ApiResponse<T>): response is ErrorResponse {
  return !response.success && 'errors' in response;
}

export function isPagedResponse<T>(
  response: ApiResponse<T[]> | PagedResponse<T>
): response is PagedSuccessResponse<T> {
  return isSuccessResponse(response) && 'pageNumber' in response && 'totalRecords' in response;
}

// Data Extractor Helper
export function extractData<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  throw new Error(response.errors[0] ?? 'API request failed');
}

// Safe Data Extractor (returns null on error)
export function safeExtractData<T>(response: ApiResponse<T>): T | null {
  try {
    return extractData(response);
  } catch {
    return null;
  }
}

// Error Extractor Helper
export function extractError<T>(response: ApiResponse<T>): string {
  if (isErrorResponse(response)) {
    return response.errors[0] ?? 'Unknown error';
  }
  return 'Request succeeded but expected error';
}

// ==================== Type Guards for Error Handling ====================

/**
 * Type guard to check if an unknown value is an ErrorResponse
 * Useful for catch blocks and error handling
 */
export function isApiErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return obj.success === false && Array.isArray(obj.errors);
}

/**
 * Type guard to check if an unknown value has error-like properties
 * Works with various error formats from different sources
 */
export interface ErrorLikeObject {
  message?: string;
  errors?: string[];
  errorCode?: string;
  code?: string;
  statusCode?: number;
}

export function isErrorLike(value: unknown): value is ErrorLikeObject {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.message === 'string' ||
    Array.isArray(obj.errors) ||
    typeof obj.errorCode === 'string' ||
    typeof obj.code === 'string'
  );
}

/**
 * Extract error message from any error source
 * Handles: ErrorResponse, Error, unknown objects, strings
 */
export function getErrorMessage(error: unknown): string {
  // String error
  if (typeof error === 'string') return error;

  // Standard Error object
  if (error instanceof Error) return error.message;

  // API ErrorResponse
  if (isApiErrorResponse(error)) {
    const firstError = error.errors[0];
    if (firstError) return firstError;
    return error.message ?? 'API request failed';
  }

  // Error-like object
  if (isErrorLike(error)) {
    return error.message ?? error.errors?.[0] ?? 'Unknown error';
  }

  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Extract error code from any error source
 */
export function getErrorCode(error: unknown): string {
  if (isApiErrorResponse(error)) return error.errorCode ?? 'UNKNOWN_ERROR';
  if (isErrorLike(error)) return error.errorCode ?? error.code ?? 'UNKNOWN_ERROR';
  return 'UNKNOWN_ERROR';
}

/**
 * Create a standardized ErrorResponse from any error
 */
export function createErrorResponse(error: unknown): ErrorResponse {
  const message = getErrorMessage(error);
  const errorCode = getErrorCode(error);

  return {
    success: false,
    message,
    errors: [message],
    errorCode,
  };
}

export interface BaseFilter {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
}
