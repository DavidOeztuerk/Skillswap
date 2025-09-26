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
export interface PagedSuccessResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export type PagedResponse<T> = PagedSuccessResponse<T> | ErrorResponse;

// Type Guards für Type Safety
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true && 'data' in response;
}

export function isErrorResponse<T>(response: ApiResponse<T>): response is ErrorResponse {
  return response.success === false && 'errors' in response;
}

export function isPagedResponse<T>(response: ApiResponse<T[]> | PagedResponse<T>): response is PagedSuccessResponse<T> {
  return isSuccessResponse(response) && 'pagination' in response;
}

// Data Extractor Helper
export function extractData<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  throw new Error(response.errors?.[0] || 'API request failed');
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
    return response.errors?.[0] || 'Unknown error';
  }
  return 'Request succeeded but expected error';
}

export interface BaseFilter {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
}
