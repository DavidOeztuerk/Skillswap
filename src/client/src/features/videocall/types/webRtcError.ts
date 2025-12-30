/**
 * WebRTC Error Types
 *
 * Centralized error handling for WebRTC and E2EE operations.
 * Provides typed errors with error codes and user-friendly messages.
 */

// ============================================================================
// Error Codes
// ============================================================================

export const WebRTCErrorCode = {
  // Connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_CLOSED: 'CONNECTION_CLOSED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',

  // Media errors
  MEDIA_ACCESS_DENIED: 'MEDIA_ACCESS_DENIED',
  MEDIA_NOT_FOUND: 'MEDIA_NOT_FOUND',
  MEDIA_OVERCONSTRAINED: 'MEDIA_OVERCONSTRAINED',
  MEDIA_TRACK_ENDED: 'MEDIA_TRACK_ENDED',

  // ICE errors
  ICE_FAILED: 'ICE_FAILED',
  ICE_DISCONNECTED: 'ICE_DISCONNECTED',
  ICE_GATHERING_TIMEOUT: 'ICE_GATHERING_TIMEOUT',

  // Signaling errors
  SIGNALING_FAILED: 'SIGNALING_FAILED',
  SIGNALING_TIMEOUT: 'SIGNALING_TIMEOUT',
  SIGNALING_DISCONNECTED: 'SIGNALING_DISCONNECTED',

  // E2EE errors
  E2EE_UNSUPPORTED: 'E2EE_UNSUPPORTED',
  E2EE_KEY_EXCHANGE_FAILED: 'E2EE_KEY_EXCHANGE_FAILED',
  E2EE_KEY_EXCHANGE_TIMEOUT: 'E2EE_KEY_EXCHANGE_TIMEOUT',
  E2EE_ENCRYPTION_FAILED: 'E2EE_ENCRYPTION_FAILED',
  E2EE_DECRYPTION_FAILED: 'E2EE_DECRYPTION_FAILED',
  E2EE_WORKER_ERROR: 'E2EE_WORKER_ERROR',
  E2EE_RATE_LIMITED: 'E2EE_RATE_LIMITED',
  E2EE_VERIFICATION_FAILED: 'E2EE_VERIFICATION_FAILED',

  // General errors
  UNKNOWN: 'UNKNOWN',
} as const;

export type WebRTCErrorCodeType = (typeof WebRTCErrorCode)[keyof typeof WebRTCErrorCode];

// ============================================================================
// Error Severity
// ============================================================================

export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverityType = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

// ============================================================================
// WebRTCError Class
// ============================================================================

export class WebRTCError extends Error {
  public readonly code: WebRTCErrorCodeType;
  public readonly severity: ErrorSeverityType;
  public readonly userMessage: string;
  public readonly recoverable: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: WebRTCErrorCodeType,
    message: string,
    options?: {
      severity?: ErrorSeverityType;
      userMessage?: string;
      recoverable?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'WebRTCError';
    this.code = code;
    this.severity = options?.severity ?? getSeverityForCode(code);
    this.userMessage = options?.userMessage ?? getUserMessageForCode(code);
    this.recoverable = options?.recoverable ?? isRecoverable(code);
    this.timestamp = new Date();
    this.context = options?.context;
  }

  /**
   * Creates a string representation of the error for logging
   */
  toLogString(): string {
    return `[${this.code}] ${this.message} (severity: ${this.severity}, recoverable: ${this.recoverable})`;
  }

  /**
   * Converts to a plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

export function createConnectionError(
  message: string,
  context?: Record<string, unknown>
): WebRTCError {
  return new WebRTCError(WebRTCErrorCode.CONNECTION_FAILED, message, {
    severity: ErrorSeverity.HIGH,
    context,
  });
}

export function createMediaError(
  code: 'MEDIA_ACCESS_DENIED' | 'MEDIA_NOT_FOUND' | 'MEDIA_OVERCONSTRAINED',
  message: string,
  context?: Record<string, unknown>
): WebRTCError {
  return new WebRTCError(WebRTCErrorCode[code], message, { context });
}

export function createE2EEError(
  code: WebRTCErrorCodeType,
  message: string,
  options?: {
    context?: Record<string, unknown>;
    cause?: Error;
  }
): WebRTCError {
  return new WebRTCError(code, message, {
    ...options,
    severity: getSeverityForCode(code),
  });
}

export function createSignalingError(
  message: string,
  context?: Record<string, unknown>
): WebRTCError {
  return new WebRTCError(WebRTCErrorCode.SIGNALING_FAILED, message, { context });
}

// ============================================================================
// Error Helpers
// ============================================================================

function getSeverityForCode(code: WebRTCErrorCodeType): ErrorSeverityType {
  switch (code) {
    // Critical errors
    case WebRTCErrorCode.E2EE_VERIFICATION_FAILED:
    case WebRTCErrorCode.CONNECTION_FAILED:
      return ErrorSeverity.CRITICAL;

    // High severity errors
    case WebRTCErrorCode.E2EE_KEY_EXCHANGE_FAILED:
    case WebRTCErrorCode.E2EE_ENCRYPTION_FAILED:
    case WebRTCErrorCode.E2EE_DECRYPTION_FAILED:
    case WebRTCErrorCode.E2EE_WORKER_ERROR:
    case WebRTCErrorCode.ICE_FAILED:
    case WebRTCErrorCode.SIGNALING_FAILED:
    case WebRTCErrorCode.SIGNALING_DISCONNECTED:
      return ErrorSeverity.HIGH;

    // Medium severity errors
    case WebRTCErrorCode.E2EE_RATE_LIMITED:
    case WebRTCErrorCode.E2EE_KEY_EXCHANGE_TIMEOUT:
    case WebRTCErrorCode.ICE_DISCONNECTED:
    case WebRTCErrorCode.ICE_GATHERING_TIMEOUT:
    case WebRTCErrorCode.CONNECTION_TIMEOUT:
    case WebRTCErrorCode.SIGNALING_TIMEOUT:
      return ErrorSeverity.MEDIUM;

    // Low severity errors
    case WebRTCErrorCode.CONNECTION_CLOSED:
    case WebRTCErrorCode.MEDIA_ACCESS_DENIED:
    case WebRTCErrorCode.MEDIA_NOT_FOUND:
    case WebRTCErrorCode.MEDIA_OVERCONSTRAINED:
    case WebRTCErrorCode.MEDIA_TRACK_ENDED:
    case WebRTCErrorCode.E2EE_UNSUPPORTED:
    case WebRTCErrorCode.UNKNOWN:
      return ErrorSeverity.LOW;

    default:
      return ErrorSeverity.LOW;
  }
}

function getUserMessageForCode(code: WebRTCErrorCodeType): string {
  switch (code) {
    // Connection errors
    case WebRTCErrorCode.CONNECTION_FAILED:
      return 'Verbindung zum Video-Call fehlgeschlagen. Bitte versuche es erneut.';
    case WebRTCErrorCode.CONNECTION_CLOSED:
      return 'Die Verbindung wurde geschlossen.';
    case WebRTCErrorCode.CONNECTION_TIMEOUT:
      return 'Zeitüberschreitung beim Verbindungsaufbau.';

    // Media errors
    case WebRTCErrorCode.MEDIA_ACCESS_DENIED:
      return 'Zugriff auf Kamera/Mikrofon verweigert. Bitte erteile die Berechtigung.';
    case WebRTCErrorCode.MEDIA_NOT_FOUND:
      return 'Keine Kamera oder Mikrofon gefunden.';
    case WebRTCErrorCode.MEDIA_OVERCONSTRAINED:
      return 'Die angeforderten Medieneinstellungen werden nicht unterstützt.';
    case WebRTCErrorCode.MEDIA_TRACK_ENDED:
      return 'Medienstream wurde beendet.';

    // ICE errors
    case WebRTCErrorCode.ICE_FAILED:
      return 'Peer-to-Peer Verbindung fehlgeschlagen. Prüfe deine Netzwerkeinstellungen.';
    case WebRTCErrorCode.ICE_DISCONNECTED:
      return 'Verbindung unterbrochen. Versuche wiederherzustellen...';
    case WebRTCErrorCode.ICE_GATHERING_TIMEOUT:
      return 'Zeitüberschreitung bei der Netzwerkerkennung.';

    // Signaling errors
    case WebRTCErrorCode.SIGNALING_FAILED:
      return 'Signalisierung fehlgeschlagen. Bitte versuche es erneut.';
    case WebRTCErrorCode.SIGNALING_TIMEOUT:
      return 'Zeitüberschreitung bei der Signalisierung.';
    case WebRTCErrorCode.SIGNALING_DISCONNECTED:
      return 'Verbindung zum Server verloren.';

    // E2EE errors
    case WebRTCErrorCode.E2EE_UNSUPPORTED:
      return 'Ende-zu-Ende-Verschlüsselung wird von deinem Browser nicht unterstützt.';
    case WebRTCErrorCode.E2EE_KEY_EXCHANGE_FAILED:
      return 'Schlüsselaustausch fehlgeschlagen. Bitte starte den Call neu.';
    case WebRTCErrorCode.E2EE_KEY_EXCHANGE_TIMEOUT:
      return 'Zeitüberschreitung beim Schlüsselaustausch.';
    case WebRTCErrorCode.E2EE_ENCRYPTION_FAILED:
      return 'Verschlüsselung fehlgeschlagen.';
    case WebRTCErrorCode.E2EE_DECRYPTION_FAILED:
      return 'Entschlüsselung fehlgeschlagen. Möglicherweise stimmen die Schlüssel nicht überein.';
    case WebRTCErrorCode.E2EE_WORKER_ERROR:
      return 'Verschlüsselungs-Worker Fehler.';
    case WebRTCErrorCode.E2EE_RATE_LIMITED:
      return 'Zu viele Anfragen. Bitte warte einen Moment.';
    case WebRTCErrorCode.E2EE_VERIFICATION_FAILED:
      return 'Sicherheitswarnung: Schlüsselverifizierung fehlgeschlagen!';

    // General errors
    case WebRTCErrorCode.UNKNOWN:
      return 'Ein unbekannter Fehler ist aufgetreten.';

    default:
      return 'Ein unbekannter Fehler ist aufgetreten.';
  }
}

function isRecoverable(code: WebRTCErrorCodeType): boolean {
  switch (code) {
    // Non-recoverable errors
    case WebRTCErrorCode.E2EE_UNSUPPORTED:
    case WebRTCErrorCode.E2EE_VERIFICATION_FAILED:
    case WebRTCErrorCode.MEDIA_ACCESS_DENIED:
    case WebRTCErrorCode.MEDIA_NOT_FOUND:
      return false;

    // Recoverable with retry
    case WebRTCErrorCode.E2EE_RATE_LIMITED:
    case WebRTCErrorCode.E2EE_KEY_EXCHANGE_TIMEOUT:
    case WebRTCErrorCode.E2EE_KEY_EXCHANGE_FAILED:
    case WebRTCErrorCode.E2EE_ENCRYPTION_FAILED:
    case WebRTCErrorCode.E2EE_DECRYPTION_FAILED:
    case WebRTCErrorCode.E2EE_WORKER_ERROR:
    case WebRTCErrorCode.CONNECTION_FAILED:
    case WebRTCErrorCode.CONNECTION_CLOSED:
    case WebRTCErrorCode.CONNECTION_TIMEOUT:
    case WebRTCErrorCode.MEDIA_OVERCONSTRAINED:
    case WebRTCErrorCode.MEDIA_TRACK_ENDED:
    case WebRTCErrorCode.ICE_FAILED:
    case WebRTCErrorCode.ICE_DISCONNECTED:
    case WebRTCErrorCode.ICE_GATHERING_TIMEOUT:
    case WebRTCErrorCode.SIGNALING_FAILED:
    case WebRTCErrorCode.SIGNALING_TIMEOUT:
    case WebRTCErrorCode.SIGNALING_DISCONNECTED:
    case WebRTCErrorCode.UNKNOWN:
      return true;

    default:
      return true;
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

export function isWebRTCError(error: unknown): error is WebRTCError {
  return error instanceof WebRTCError;
}

export function isE2EEError(error: WebRTCError): boolean {
  return error.code.startsWith('E2EE_');
}

export function isCriticalError(error: WebRTCError): boolean {
  return error.severity === ErrorSeverity.CRITICAL;
}

// ============================================================================
// Error from DOMException
// ============================================================================

export function fromDOMException(exception: DOMException): WebRTCError {
  switch (exception.name) {
    case 'NotAllowedError':
      return new WebRTCError(WebRTCErrorCode.MEDIA_ACCESS_DENIED, exception.message, {
        cause: exception,
      });
    case 'NotFoundError':
      return new WebRTCError(WebRTCErrorCode.MEDIA_NOT_FOUND, exception.message, {
        cause: exception,
      });
    case 'OverconstrainedError':
      return new WebRTCError(WebRTCErrorCode.MEDIA_OVERCONSTRAINED, exception.message, {
        cause: exception,
      });
    default:
      return new WebRTCError(WebRTCErrorCode.UNKNOWN, exception.message, { cause: exception });
  }
}
