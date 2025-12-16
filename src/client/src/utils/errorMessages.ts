/**
 * Error-Message-Mapping-Service
 * Mapped Backend-ErrorCodes zu user-freundlichen deutschen Nachrichten
 */

export interface ErrorDetails {
  code: string;
  title: string;
  message: string;
}

/**
 * Error-Code-Definitionen vom Backend
 */
export const ERROR_CODES = {
  // Authentication & Authorization (2000-2999)
  UNAUTHORIZED: 'ERR_2000',
  INSUFFICIENT_PERMISSIONS: 'ERR_2001',
  TOKEN_EXPIRED: 'ERR_2002',
  INVALID_CREDENTIALS: 'ERR_2003',

  // Validation Errors (3000-3999)
  VALIDATION_ERROR: 'ERR_3000',
  INVALID_INPUT: 'ERR_3001',
  MISSING_REQUIRED_FIELD: 'ERR_3002',
  INVALID_DATE: 'ERR_3003',

  // Resource Errors (4000-4999)
  RESOURCE_NOT_FOUND: 'ERR_4001',
  RESOURCE_ALREADY_EXISTS: 'ERR_4002',
  RESOURCE_DELETED: 'ERR_4003',

  // Business Logic Errors (5000-5999)
  BUSINESS_RULE_VIOLATION: 'ERR_5000',
  APPOINTMENT_ALREADY_ACCEPTED: 'ERR_5001',
  APPOINTMENT_ALREADY_CANCELLED: 'ERR_5002',
  APPOINTMENT_PAST_DATE: 'ERR_5003',
  SCHEDULING_CONFLICT: 'ERR_5004',

  // Network & System Errors (9000-9999)
  NETWORK_ERROR: 'ERR_9000',
  SERVER_ERROR: 'ERR_9001',
  TIMEOUT: 'ERR_9002',
  UNKNOWN: 'ERR_UNKNOWN',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Mapping von Error-Codes zu detaillierten Nachrichten
 */
const ERROR_MESSAGE_MAP: Record<string, (details?: string) => ErrorDetails> = {
  // Authentication & Authorization
  [ERROR_CODES.UNAUTHORIZED]: (details) => ({
    code: ERROR_CODES.UNAUTHORIZED,
    title: 'Nicht angemeldet',
    message:
      details ?? 'Du musst angemeldet sein, um diese Aktion durchzuführen. Bitte melde dich an.',
  }),

  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: (details) => ({
    code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
    title: 'Keine Berechtigung',
    message:
      details ??
      'Du hast keine Berechtigung, diese Aktion durchzuführen. Nur der Empfänger des Termins kann ihn bestätigen.',
  }),

  [ERROR_CODES.TOKEN_EXPIRED]: (details) => ({
    code: ERROR_CODES.TOKEN_EXPIRED,
    title: 'Sitzung abgelaufen',
    message: details ?? 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  }),

  [ERROR_CODES.INVALID_CREDENTIALS]: (details) => ({
    code: ERROR_CODES.INVALID_CREDENTIALS,
    title: 'Ungültige Anmeldedaten',
    message:
      details ??
      'Die eingegebenen Anmeldedaten sind ungültig. Bitte überprüfe deine E-Mail-Adresse und dein Passwort.',
  }),

  // Validation Errors
  [ERROR_CODES.VALIDATION_ERROR]: (details) => ({
    code: ERROR_CODES.VALIDATION_ERROR,
    title: 'Eingabefehler',
    message: details ?? 'Bitte überprüfe deine Eingaben und korrigiere alle Fehler.',
  }),

  [ERROR_CODES.INVALID_INPUT]: (details) => ({
    code: ERROR_CODES.INVALID_INPUT,
    title: 'Ungültige Eingabe',
    message: details ?? 'Die eingegebenen Daten sind ungültig. Bitte überprüfe deine Eingaben.',
  }),

  [ERROR_CODES.MISSING_REQUIRED_FIELD]: (details) => ({
    code: ERROR_CODES.MISSING_REQUIRED_FIELD,
    title: 'Pflichtfeld fehlt',
    message: details ?? 'Bitte fülle alle erforderlichen Felder aus.',
  }),

  [ERROR_CODES.INVALID_DATE]: (details) => ({
    code: ERROR_CODES.INVALID_DATE,
    title: 'Ungültiges Datum',
    message: details ?? 'Das eingegebene Datum ist ungültig oder liegt in der Vergangenheit.',
  }),

  // Resource Errors
  [ERROR_CODES.RESOURCE_NOT_FOUND]: (details) => ({
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    title: 'Nicht gefunden',
    message:
      details ??
      'Die angeforderte Ressource wurde nicht gefunden. Sie wurde möglicherweise gelöscht oder verschoben.',
  }),

  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: (details) => ({
    code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
    title: 'Bereits vorhanden',
    message:
      details ?? 'Diese Ressource existiert bereits. Bitte verwende einen anderen Namen oder ID.',
  }),

  [ERROR_CODES.RESOURCE_DELETED]: (details) => ({
    code: ERROR_CODES.RESOURCE_DELETED,
    title: 'Gelöscht',
    message: details ?? 'Diese Ressource wurde gelöscht und kann nicht mehr bearbeitet werden.',
  }),

  // Business Logic Errors
  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: (details) => ({
    code: ERROR_CODES.BUSINESS_RULE_VIOLATION,
    title: 'Regel verletzt',
    message:
      details ?? 'Diese Aktion verletzt eine Geschäftsregel und kann nicht durchgeführt werden.',
  }),

  [ERROR_CODES.APPOINTMENT_ALREADY_ACCEPTED]: (details) => ({
    code: ERROR_CODES.APPOINTMENT_ALREADY_ACCEPTED,
    title: 'Bereits bestätigt',
    message: details ?? 'Dieser Termin wurde bereits bestätigt.',
  }),

  [ERROR_CODES.APPOINTMENT_ALREADY_CANCELLED]: (details) => ({
    code: ERROR_CODES.APPOINTMENT_ALREADY_CANCELLED,
    title: 'Bereits abgesagt',
    message: details ?? 'Dieser Termin wurde bereits abgesagt.',
  }),

  [ERROR_CODES.APPOINTMENT_PAST_DATE]: (details) => ({
    code: ERROR_CODES.APPOINTMENT_PAST_DATE,
    title: 'Termin in der Vergangenheit',
    message:
      details ?? 'Dieser Termin liegt in der Vergangenheit und kann nicht mehr bearbeitet werden.',
  }),

  [ERROR_CODES.SCHEDULING_CONFLICT]: (details) => ({
    code: ERROR_CODES.SCHEDULING_CONFLICT,
    title: 'Terminkonflikt',
    message:
      details ?? 'Es gibt einen Konflikt mit einem anderen Termin. Bitte wähle eine andere Zeit.',
  }),

  // Network & System Errors
  [ERROR_CODES.NETWORK_ERROR]: (details) => ({
    code: ERROR_CODES.NETWORK_ERROR,
    title: 'Netzwerkfehler',
    message:
      details ??
      'Es gab ein Problem mit der Netzwerkverbindung. Bitte überprüfe deine Internetverbindung und versuche es erneut.',
  }),

  [ERROR_CODES.SERVER_ERROR]: (details) => ({
    code: ERROR_CODES.SERVER_ERROR,
    title: 'Serverfehler',
    message:
      details ?? 'Ein unerwarteter Serverfehler ist aufgetreten. Bitte versuche es später erneut.',
  }),

  [ERROR_CODES.TIMEOUT]: (details) => ({
    code: ERROR_CODES.TIMEOUT,
    title: 'Zeitüberschreitung',
    message: details ?? 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.',
  }),

  [ERROR_CODES.UNKNOWN]: (details) => ({
    code: ERROR_CODES.UNKNOWN,
    title: 'Unbekannter Fehler',
    message:
      details ??
      'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut oder kontaktiere den Support.',
  }),
};

/**
 * Mapped einen Error-Code zu einer detaillierten Fehlernachricht
 *
 * @param errorCode - Der Error-Code vom Backend
 * @param details - Optionale zusätzliche Details vom Backend
 * @returns ErrorDetails mit title und message
 */
export const mapErrorToMessage = (errorCode?: string, details?: string): ErrorDetails => {
  // ESLint: Prüfen, ob errorCode undefined oder null ist
  if (errorCode === undefined || errorCode.trim() === '') {
    return ERROR_MESSAGE_MAP[ERROR_CODES.UNKNOWN](details);
  }

  const mapper = ERROR_MESSAGE_MAP[errorCode];
  return mapper(details);
};

/**
 * Response structure that may contain error information
 */
export interface ApiErrorResponse {
  errorCode?: string;
  errors?: string | string[];
  error?: {
    code?: string;
    message?: string | string[];
  };
}

/**
 * Extrahiert Error-Details aus einer ApiResponse
 *
 * @param response - Die API-Response mit möglichen Fehlern
 * @returns ErrorDetails mit title und message
 */
export const extractErrorFromResponse = (
  response: ApiErrorResponse | null | undefined
): ErrorDetails => {
  const errorCode = response?.errorCode ?? response?.error?.code;
  const errorMessages = response?.errors ?? response?.error?.message;

  // Wenn errors ein Array ist, nehme die erste Nachricht als string
  let details: string | undefined;

  if (Array.isArray(errorMessages)) {
    details = errorMessages.length > 0 ? errorMessages[0] : undefined;
  } else if (typeof errorMessages === 'string') {
    details = errorMessages;
  } else {
    details = undefined;
  }

  return mapErrorToMessage(errorCode, details);
};
