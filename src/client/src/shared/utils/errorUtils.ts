// Utility functions for processing and handling API errors

export interface ProcessedError {
  type: 'NETWORK' | 'SERVER' | 'AUTH' | 'VALIDATION' | 'PERMISSION' | 'UNKNOWN';
  message: string;
  code?: string | number;
  errorCode?: string;
  traceId?: string;
  errors?: string[];
}

// Type guards for better error handling - moved outside for reduced complexity
const isErrorWithResponse = (
  err: unknown
): err is { response: { data?: unknown; status?: number } } =>
  typeof err === 'object' && err !== null && 'response' in err;

const isErrorWithData = (err: unknown): err is { data?: unknown } =>
  typeof err === 'object' && err !== null && 'data' in err;

const isErrorWithStatus = (err: unknown): err is { status?: number } =>
  typeof err === 'object' && err !== null && 'status' in err;

const isErrorWithCode = (err: unknown): err is { code?: number | string } =>
  typeof err === 'object' && err !== null && 'code' in err;

const isErrorWithMessage = (err: unknown): err is { message?: string } =>
  typeof err === 'object' && err !== null && 'message' in err;

const isErrorWithErrorCode = (err: unknown): err is { errorCode?: string } =>
  typeof err === 'object' && err !== null && 'errorCode' in err;

const isErrorWithDetails = (
  err: unknown
): err is {
  details?: {
    status?: number;
    success?: boolean;
    errorCode?: string;
    traceId?: string;
    errors?: string[];
  };
} => typeof err === 'object' && err !== null && 'details' in err;

const isErrorDataWithMessage = (data: unknown): data is { message?: string } =>
  typeof data === 'object' && data !== null && 'message' in data;

const isErrorDataWithErrors = (data: unknown): data is { errors?: string[] } =>
  typeof data === 'object' && data !== null && 'errors' in data;

const isErrorDataWithErrorCode = (data: unknown): data is { errorCode?: string } =>
  typeof data === 'object' && data !== null && 'errorCode' in data;

const isErrorDataWithTraceId = (data: unknown): data is { traceId?: string } =>
  typeof data === 'object' && data !== null && 'traceId' in data;

// Map common error codes to HTTP status codes
const ERROR_CODE_TO_STATUS: Record<string, number> = {
  ERR_2006: 401, // InvalidCredentials
  ERR_2001: 400, // ValidationFailed
  ERR_2002: 404, // ResourceNotFound
  ERR_2003: 409, // Conflict/Duplicate
  ERR_2004: 403, // Forbidden
  ERR_2005: 500, // Internal Server Error
};

/**
 * Get default user-friendly error message based on error type
 */
const getDefaultErrorMessage = (
  messageType: ProcessedError['type'],
  messageStatus?: number
): string => {
  switch (messageType) {
    case 'NETWORK':
      return 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.';
    case 'AUTH':
      return messageStatus === 401
        ? 'Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.'
        : 'Sie haben keine Berechtigung für diese Aktion.';
    case 'VALIDATION':
      return 'Eingabedaten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.';
    case 'SERVER':
      return 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
    case 'PERMISSION':
      return 'Sie haben keine Berechtigung für diese Aktion.';
    case 'UNKNOWN':
    default:
      return 'Ein unerwarteter Fehler ist aufgetreten.';
  }
};

/**
 * Extract error data from various possible structures
 */
const extractErrorData = (error: unknown): unknown => {
  if (isErrorWithResponse(error)) return error.response.data;
  if (isErrorWithData(error)) return error.data;
  return error;
};

/**
 * Extract initial status from various possible structures
 */
const extractInitialStatus = (error: unknown): number | undefined => {
  if (isErrorWithResponse(error)) return error.response.status;
  if (isErrorWithStatus(error)) return error.status;
  if (isErrorWithCode(error) && typeof error.code === 'number') return error.code;
  if (isErrorWithDetails(error)) return error.details?.status;
  return undefined;
};

/**
 * Determine error type based on status code
 */
const determineErrorType = (status: number | undefined, error: unknown): ProcessedError['type'] => {
  if (status === 401) return 'AUTH';
  if (status === 403) return 'PERMISSION';
  if (status === 400 || status === 409 || status === 422) return 'VALIDATION';
  if (status !== undefined && status >= 500) return 'SERVER';
  if (status === 0 || status === undefined) return 'NETWORK';
  if (isErrorWithCode(error) && error.code === 'NETWORK_ERROR') return 'NETWORK';
  return 'UNKNOWN';
};

/**
 * Extract message from error data with fallbacks
 */
const extractMessage = (errorData: unknown): string | undefined => {
  if (isErrorDataWithMessage(errorData) && errorData.message) {
    return errorData.message;
  }
  if (isErrorDataWithErrors(errorData) && errorData.errors && errorData.errors.length > 0) {
    return errorData.errors[0];
  }
  return undefined;
};

/**
 * Resolve final status from various fallback sources
 */
const resolveStatus = (error: unknown): number | undefined => {
  // Try initial extraction
  const status = extractInitialStatus(error);
  if (status !== undefined) return status;

  // For serialized error objects that don't have status but have errorCode, try to map to HTTP status
  if (isErrorWithErrorCode(error) && error.errorCode !== undefined) {
    return ERROR_CODE_TO_STATUS[error.errorCode] || 400;
  }

  // Extract status from error message if not found (for processed axios errors)
  if (isErrorWithMessage(error) && error.message !== undefined) {
    const statusMatch = /status code (\d+)/.exec(error.message);
    if (statusMatch) {
      return Number.parseInt(statusMatch[1], 10);
    }
  }

  // If still no status but we have details with success=false, assume it's a 4xx error
  if (isErrorWithDetails(error) && error.details?.success === false) {
    return 400; // Default to 400 for API errors
  }

  return undefined;
};

/**
 * Extract error code from various sources
 */
const extractErrorCode = (errorData: unknown, error: unknown): string | undefined =>
  (isErrorDataWithErrorCode(errorData) ? errorData.errorCode : undefined) ??
  (isErrorWithDetails(error) ? error.details?.errorCode : undefined) ??
  (isErrorWithCode(error) && typeof error.code === 'string' ? error.code : undefined);

/**
 * Extract trace ID from various sources
 */
const extractTraceId = (errorData: unknown, error: unknown): string | undefined =>
  (isErrorDataWithTraceId(errorData) ? errorData.traceId : undefined) ??
  (isErrorWithDetails(error) ? error.details?.traceId : undefined);

/**
 * Extract errors array from various sources
 */
const extractErrors = (errorData: unknown, error: unknown): string[] | undefined =>
  (isErrorDataWithErrors(errorData) ? errorData.errors : undefined) ??
  (isErrorWithDetails(error) ? error.details?.errors : undefined);

/**
 * Check if message needs fallback to default
 */
const needsDefaultMessage = (message: string | undefined): boolean =>
  message === undefined ||
  message.includes('Request failed with status code') ||
  message.includes('Network Error');

/**
 * Process API error response into standardized format
 */
export const processApiError = (error: unknown): ProcessedError => {
  const errorData = extractErrorData(error);
  const status = resolveStatus(error);
  const type = determineErrorType(status, error);
  const rawMessage = extractMessage(errorData);
  const message = needsDefaultMessage(rawMessage)
    ? getDefaultErrorMessage(type, status)
    : (rawMessage ?? getDefaultErrorMessage(type, status));

  return {
    type,
    message,
    code: status,
    errorCode: extractErrorCode(errorData, error),
    traceId: extractTraceId(errorData, error),
    errors: extractErrors(errorData, error),
  };
};

/**
 * Check if error indicates user needs to re-authenticate
 */
export const isAuthError = (error: ProcessedError): boolean =>
  error.type === 'AUTH' && error.code === 401;

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ProcessedError): boolean =>
  error.type === 'NETWORK' || error.type === 'SERVER';

/**
 * Get user-friendly error message based on ErrorCode
 */
export const getUserFriendlyMessage = (errorCode?: string): string | null => {
  if (!errorCode) return null;

  const errorMessages: Record<string, string> = {
    USER_001: 'E-Mail-Adresse ist bereits registriert.',
    USER_002: 'Benutzer wurde nicht gefunden.',
    USER_003: 'Ungültiges Passwort.',
    USER_004: 'E-Mail-Adresse wurde noch nicht bestätigt.',
    USER_005: 'Benutzerkonto ist gesperrt.',
    SKILL_001: 'Skill wurde nicht gefunden.',
    SKILL_002: 'Sie besitzen diesen Skill bereits.',
    MATCH_001: 'Match wurde nicht gefunden.',
    MATCH_002: 'Match ist bereits abgeschlossen.',
    MATCH_003: 'Sie haben bereits eine Anfrage für diesen Skill gesendet.',
    APPOINTMENT_001: 'Termin wurde nicht gefunden.',
    APPOINTMENT_002: 'Termin kann nicht mehr geändert werden.',
    VALIDATION_001: 'Pflichtfeld fehlt.',
    VALIDATION_002: 'Ungültiges Format.',
    PERMISSION_001: 'Zugriff verweigert.',
    PERMISSION_002: 'Administrator-Rechte erforderlich.',
  };

  return errorMessages[errorCode] || null;
};
