// Utility functions for processing and handling API errors

export interface ProcessedError {
  type: 'NETWORK' | 'SERVER' | 'AUTH' | 'VALIDATION' | 'PERMISSION' | 'UNKNOWN';
  message: string;
  code?: string | number;
  errorCode?: string;
  traceId?: string;
  errors?: string[];
}

/**
 * Process API error response into standardized format
 */
export const processApiError = (error: unknown): ProcessedError => {
  // Type guards for better error handling
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

  // Extract error data from various possible structures
  const errorData = isErrorWithResponse(error)
    ? error.response.data
    : isErrorWithData(error)
      ? error.data
      : error;

  let status = isErrorWithResponse(error)
    ? error.response.status
    : isErrorWithStatus(error)
      ? error.status
      : isErrorWithCode(error) && typeof error.code === 'number'
        ? error.code
        : isErrorWithDetails(error)
          ? error.details?.status
          : undefined;

  // For serialized error objects that don't have status but have errorCode, try to map to HTTP status
  if (status === undefined && isErrorWithErrorCode(error) && error.errorCode !== undefined) {
    // Map common error codes to HTTP status codes
    const errorCodeToStatus: Record<string, number> = {
      ERR_2006: 401, // InvalidCredentials
      ERR_2001: 400, // ValidationFailed
      ERR_2002: 404, // ResourceNotFound
      ERR_2003: 409, // Conflict/Duplicate
      ERR_2004: 403, // Forbidden
      ERR_2005: 500, // Internal Server Error
    };
    status = errorCodeToStatus[error.errorCode] || 400;
  }

  // Extract status from error message if not found (for processed axios errors)
  if (status === undefined && isErrorWithMessage(error) && error.message !== undefined) {
    const statusMatch = /status code (\d+)/.exec(error.message);
    if (statusMatch) {
      status = parseInt(statusMatch[1], 10);
    }
  }

  // If still no status but we have details with success=false, assume it's a 4xx error
  if (status === undefined && isErrorWithDetails(error) && error.details?.success === false) {
    status = 400; // Default to 400 for API errors
  }

  // Determine error type based on status code and error data
  let type: ProcessedError['type'] = 'UNKNOWN';

  if (status === 401 || status === 403) {
    type = 'AUTH';
  } else if (status === 400 || status === 409 || status === 422) {
    type = 'VALIDATION';
  } else if (status !== undefined && status >= 500) {
    type = 'SERVER';
  } else if (
    status === 0 ||
    status === undefined ||
    (isErrorWithCode(error) && error.code === 'NETWORK_ERROR')
  ) {
    type = 'NETWORK';
  }

  // Extract message with fallbacks - prefer user-friendly messages
  const isErrorDataWithMessage = (data: unknown): data is { message?: string } =>
    typeof data === 'object' && data !== null && 'message' in data;

  const isErrorDataWithErrors = (data: unknown): data is { errors?: string[] } =>
    typeof data === 'object' && data !== null && 'errors' in data;

  let message =
    (isErrorDataWithMessage(errorData) ? errorData.message : undefined) ??
    (isErrorDataWithErrors(errorData) &&
    errorData.errors !== undefined &&
    errorData.errors.length > 0
      ? errorData.errors[0]
      : undefined);

  // If no backend message or generic axios error, use user-friendly message
  if (
    message === undefined ||
    message.includes('Request failed with status code') ||
    message.includes('Network Error')
  ) {
    message = getDefaultErrorMessage(type, status);
  }

  // Move function definition before first use
  function getDefaultErrorMessage(
    messageType: ProcessedError['type'],
    messageStatus?: number
  ): string {
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
      default:
        return 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  }

  const isErrorDataWithErrorCode = (data: unknown): data is { errorCode?: string } =>
    typeof data === 'object' && data !== null && 'errorCode' in data;

  const isErrorDataWithTraceId = (data: unknown): data is { traceId?: string } =>
    typeof data === 'object' && data !== null && 'traceId' in data;

  return {
    type,
    message,
    code: status,
    errorCode:
      (isErrorDataWithErrorCode(errorData) ? errorData.errorCode : undefined) ??
      (isErrorWithDetails(error) ? error.details?.errorCode : undefined) ??
      (isErrorWithCode(error) && typeof error.code === 'string' ? error.code : undefined),
    traceId:
      (isErrorDataWithTraceId(errorData) ? errorData.traceId : undefined) ??
      (isErrorWithDetails(error) ? error.details?.traceId : undefined),
    errors:
      (isErrorDataWithErrors(errorData) ? errorData.errors : undefined) ??
      (isErrorWithDetails(error) ? error.details?.errors : undefined),
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
