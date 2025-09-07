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
export const processApiError = (error: any): ProcessedError => {
  // Extract error data from various possible structures  
  const errorData = error?.response?.data || error?.data || error;
  let status = error?.response?.status || error?.status || error?.code || error?.details?.status;
  
  // For serialized error objects that don't have status but have errorCode, try to map to HTTP status
  if (!status && error?.errorCode) {
    // Map common error codes to HTTP status codes
    const errorCodeToStatus: Record<string, number> = {
      'ERR_2006': 401, // InvalidCredentials
      'ERR_2001': 400, // ValidationFailed  
      'ERR_2002': 404, // ResourceNotFound
      'ERR_2003': 409, // Conflict/Duplicate
      'ERR_2004': 403, // Forbidden
      'ERR_2005': 500, // Internal Server Error
    };
    status = errorCodeToStatus[error.errorCode] || 400;
  }
  
  // Extract status from error message if not found (for processed axios errors)
  if (!status && error?.message) {
    const statusMatch = error.message.match(/status code (\d+)/);
    if (statusMatch) {
      status = parseInt(statusMatch[1]);
    }
  }
  
  // If still no status but we have details with success=false, assume it's a 4xx error
  if (!status && error?.details?.success === false) {
    status = 400; // Default to 400 for API errors
  }
  
  
  // Determine error type based on status code and error data
  let type: ProcessedError['type'] = 'UNKNOWN';
  
  if (status === 401 || status === 403) {
    type = 'AUTH';
  } else if (status === 400 || status === 409 || status === 422) {
    type = 'VALIDATION';
  } else if (status >= 500) {
    type = 'SERVER';
  } else if (status === 0 || !status || error?.code === 'NETWORK_ERROR') {
    type = 'NETWORK';
  }
  
  // Extract message with fallbacks - prefer user-friendly messages
  let message = errorData?.message || errorData?.errors?.[0];
  
  // If no backend message or generic axios error, use user-friendly message
  if (!message || message.includes('Request failed with status code') || message.includes('Network Error')) {
    message = getDefaultErrorMessage(type, status);
  }
  
  return {
    type,
    message,
    code: status,
    errorCode: errorData?.errorCode || error?.details?.errorCode || error?.code,
    traceId: errorData?.traceId || error?.details?.traceId,
    errors: errorData?.errors || error?.details?.errors
  };
};

/**
 * Get default error message based on type and status
 */
const getDefaultErrorMessage = (type: ProcessedError['type'], status?: number): string => {
  switch (type) {
    case 'NETWORK':
      return 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.';
    case 'AUTH':
      return status === 401 
        ? 'Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.'
        : 'Sie haben keine Berechtigung für diese Aktion.';
    case 'VALIDATION':
      return 'Eingabedaten sind ungültig. Bitte überprüfen Sie Ihre Eingaben.';
    case 'SERVER':
      return 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
    default:
      return 'Ein unerwarteter Fehler ist aufgetreten.';
  }
};

/**
 * Check if error indicates user needs to re-authenticate
 */
export const isAuthError = (error: ProcessedError): boolean => {
  return error.type === 'AUTH' && error.code === 401;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ProcessedError): boolean => {
  return error.type === 'NETWORK' || error.type === 'SERVER';
};

/**
 * Get user-friendly error message based on ErrorCode
 */
export const getUserFriendlyMessage = (errorCode?: string): string | null => {
  if (!errorCode) return null;
  
  const errorMessages: Record<string, string> = {
    'USER_001': 'E-Mail-Adresse ist bereits registriert.',
    'USER_002': 'Benutzer wurde nicht gefunden.',
    'USER_003': 'Ungültiges Passwort.',
    'USER_004': 'E-Mail-Adresse wurde noch nicht bestätigt.',
    'USER_005': 'Benutzerkonto ist gesperrt.',
    'SKILL_001': 'Skill wurde nicht gefunden.',
    'SKILL_002': 'Sie besitzen diesen Skill bereits.',
    'MATCH_001': 'Match wurde nicht gefunden.',
    'MATCH_002': 'Match ist bereits abgeschlossen.',
    'MATCH_003': 'Sie haben bereits eine Anfrage für diesen Skill gesendet.',
    'APPOINTMENT_001': 'Termin wurde nicht gefunden.',
    'APPOINTMENT_002': 'Termin kann nicht mehr geändert werden.',
    'VALIDATION_001': 'Pflichtfeld fehlt.',
    'VALIDATION_002': 'Ungültiges Format.',
    'PERMISSION_001': 'Zugriff verweigert.',
    'PERMISSION_002': 'Administrator-Rechte erforderlich.'
  };
  
  return errorMessages[errorCode] || null;
};