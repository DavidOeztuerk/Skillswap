/**
 * Video Call Error Handling
 * Provides structured error types with recovery suggestions
 */

// ============================================================================
// Error Codes
// ============================================================================

export type VideoCallErrorCode =
  // Permission Errors
  | 'PERMISSION_DENIED'
  | 'PERMISSION_DISMISSED'
  // Device Errors
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_IN_USE'
  | 'DEVICE_OVERCONSTRAINED'
  // Connection Errors
  | 'SIGNALR_CONNECTION_FAILED'
  | 'SIGNALR_DISCONNECTED'
  | 'SIGNALR_RECONNECT_FAILED'
  | 'WEBRTC_CONNECTION_FAILED'
  | 'ICE_CONNECTION_FAILED'
  | 'PEER_CONNECTION_FAILED'
  // E2EE Errors
  | 'E2EE_NOT_SUPPORTED'
  | 'E2EE_KEY_EXCHANGE_FAILED'
  | 'E2EE_KEY_EXCHANGE_TIMEOUT'
  | 'E2EE_SIGNATURE_VERIFICATION_FAILED'
  | 'E2EE_ENCRYPTION_FAILED'
  | 'E2EE_DECRYPTION_FAILED'
  | 'E2EE_WORKER_ERROR'
  // Media Errors
  | 'SCREEN_SHARE_CANCELLED'
  | 'SCREEN_SHARE_FAILED'
  | 'TRACK_ENDED_UNEXPECTEDLY'
  // Session Errors
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'ROOM_FULL'
  // Generic
  | 'UNKNOWN_ERROR';

// ============================================================================
// Error Severity
// ============================================================================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

// ============================================================================
// Recovery Actions
// ============================================================================

export type RecoveryAction =
  | 'RETRY'
  | 'REFRESH_PAGE'
  | 'CHECK_PERMISSIONS'
  | 'CHECK_DEVICES'
  | 'RECONNECT'
  | 'REJOIN_ROOM'
  | 'RESTART_CALL'
  | 'CONTACT_SUPPORT'
  | 'NONE';

// ============================================================================
// Error Context
// ============================================================================

export interface VideoCallErrorContext {
  // Device info
  deviceId?: string;
  deviceLabel?: string;
  constraint?: string;

  // Connection info
  connectionId?: string;
  roomId?: string;
  peerId?: string;

  // WebRTC info
  iceConnectionState?: RTCIceConnectionState;
  connectionState?: RTCPeerConnectionState;
  signalingState?: RTCSignalingState;

  // E2EE info
  keyGeneration?: number;
  e2eeMethod?: string;

  // Original error
  originalError?: unknown;

  // Additional data
  [key: string]: unknown;
}

// ============================================================================
// Error Metadata
// ============================================================================

interface ErrorMetadata {
  severity: ErrorSeverity;
  recoverable: boolean;
  suggestedAction: RecoveryAction;
  userMessage: string;
  technicalMessage: string;
}

const ERROR_METADATA: Record<VideoCallErrorCode, ErrorMetadata> = {
  // Permission Errors
  PERMISSION_DENIED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'CHECK_PERMISSIONS',
    userMessage:
      'Kamera- oder Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.',
    technicalMessage: 'getUserMedia permission denied by user',
  },
  PERMISSION_DISMISSED: {
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'CHECK_PERMISSIONS',
    userMessage:
      'Die Berechtigungsanfrage wurde geschlossen. Bitte erlaube den Zugriff auf Kamera und Mikrofon.',
    technicalMessage: 'getUserMedia permission prompt was dismissed',
  },

  // Device Errors
  DEVICE_NOT_FOUND: {
    severity: 'error',
    recoverable: false,
    suggestedAction: 'CHECK_DEVICES',
    userMessage: 'Keine Kamera oder kein Mikrofon gefunden. Bitte schließe ein Gerät an.',
    technicalMessage: 'No media devices found (NotFoundError)',
  },
  DEVICE_IN_USE: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'CHECK_DEVICES',
    userMessage: 'Kamera oder Mikrofon wird von einer anderen Anwendung verwendet.',
    technicalMessage: 'Media device is in use by another application',
  },
  DEVICE_OVERCONSTRAINED: {
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'RETRY',
    userMessage:
      'Die angeforderten Medieneinstellungen werden nicht unterstützt. Es wird mit niedrigeren Einstellungen versucht.',
    technicalMessage: 'Media constraints cannot be satisfied (OverconstrainedError)',
  },

  // Connection Errors
  SIGNALR_CONNECTION_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'RETRY',
    userMessage: 'Verbindung zum Server fehlgeschlagen. Bitte überprüfe deine Internetverbindung.',
    technicalMessage: 'SignalR connection failed to establish',
  },
  SIGNALR_DISCONNECTED: {
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'RECONNECT',
    userMessage: 'Verbindung zum Server verloren. Versuche erneut zu verbinden...',
    technicalMessage: 'SignalR connection was disconnected',
  },
  SIGNALR_RECONNECT_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'REFRESH_PAGE',
    userMessage: 'Wiederverbindung fehlgeschlagen. Bitte lade die Seite neu.',
    technicalMessage: 'SignalR reconnection attempts exhausted',
  },
  WEBRTC_CONNECTION_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'RESTART_CALL',
    userMessage: 'Peer-to-Peer Verbindung fehlgeschlagen. Bitte starte den Anruf neu.',
    technicalMessage: 'WebRTC peer connection failed',
  },
  ICE_CONNECTION_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'RESTART_CALL',
    userMessage:
      'Netzwerkverbindung konnte nicht hergestellt werden. Möglicherweise blockiert eine Firewall die Verbindung.',
    technicalMessage: 'ICE connection state failed',
  },
  PEER_CONNECTION_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'RESTART_CALL',
    userMessage: 'Verbindung zum anderen Teilnehmer fehlgeschlagen.',
    technicalMessage: 'RTCPeerConnection entered failed state',
  },

  // E2EE Errors
  E2EE_NOT_SUPPORTED: {
    severity: 'warning',
    recoverable: false,
    suggestedAction: 'NONE',
    userMessage: 'Ende-zu-Ende-Verschlüsselung wird von deinem Browser nicht unterstützt.',
    technicalMessage: 'Browser does not support Insertable Streams or RTCRtpScriptTransform',
  },
  E2EE_KEY_EXCHANGE_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'RESTART_CALL',
    userMessage:
      'Schlüsselaustausch fehlgeschlagen. Die Verschlüsselung konnte nicht eingerichtet werden.',
    technicalMessage: 'E2EE key exchange failed',
  },
  E2EE_KEY_EXCHANGE_TIMEOUT: {
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'RETRY',
    userMessage: 'Schlüsselaustausch hat zu lange gedauert. Ein erneuter Versuch wird unternommen.',
    technicalMessage: 'E2EE key exchange timed out',
  },
  E2EE_SIGNATURE_VERIFICATION_FAILED: {
    severity: 'critical',
    recoverable: false,
    suggestedAction: 'RESTART_CALL',
    userMessage:
      'Sicherheitswarnung: Die Identität des anderen Teilnehmers konnte nicht verifiziert werden!',
    technicalMessage: 'E2EE signature verification failed - possible MITM attack',
  },
  E2EE_ENCRYPTION_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'RETRY',
    userMessage: 'Verschlüsselung fehlgeschlagen. Frames werden unverschlüsselt gesendet.',
    technicalMessage: 'E2EE frame encryption failed',
  },
  E2EE_DECRYPTION_FAILED: {
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'NONE',
    userMessage: 'Entschlüsselung einiger Frames fehlgeschlagen.',
    technicalMessage: 'E2EE frame decryption failed',
  },
  E2EE_WORKER_ERROR: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'REFRESH_PAGE',
    userMessage: 'E2EE-Worker-Fehler. Bitte lade die Seite neu.',
    technicalMessage: 'E2EE Web Worker encountered an error',
  },

  // Media Errors
  SCREEN_SHARE_CANCELLED: {
    severity: 'info',
    recoverable: true,
    suggestedAction: 'NONE',
    userMessage: 'Bildschirmfreigabe wurde abgebrochen.',
    technicalMessage: 'User cancelled screen share picker',
  },
  SCREEN_SHARE_FAILED: {
    severity: 'error',
    recoverable: true,
    suggestedAction: 'RETRY',
    userMessage: 'Bildschirmfreigabe fehlgeschlagen.',
    technicalMessage: 'getDisplayMedia failed',
  },
  TRACK_ENDED_UNEXPECTEDLY: {
    severity: 'warning',
    recoverable: true,
    suggestedAction: 'RETRY',
    userMessage: 'Mediengerät wurde getrennt.',
    technicalMessage: 'MediaStreamTrack ended unexpectedly',
  },

  // Session Errors
  SESSION_NOT_FOUND: {
    severity: 'error',
    recoverable: false,
    suggestedAction: 'NONE',
    userMessage: 'Die Sitzung wurde nicht gefunden oder ist abgelaufen.',
    technicalMessage: 'Video call session not found',
  },
  SESSION_EXPIRED: {
    severity: 'error',
    recoverable: false,
    suggestedAction: 'NONE',
    userMessage: 'Die Sitzung ist abgelaufen.',
    technicalMessage: 'Video call session has expired',
  },
  UNAUTHORIZED: {
    severity: 'error',
    recoverable: false,
    suggestedAction: 'NONE',
    userMessage: 'Du bist nicht berechtigt, diesem Anruf beizutreten.',
    technicalMessage: 'User is not authorized for this call',
  },
  ROOM_FULL: {
    severity: 'error',
    recoverable: false,
    suggestedAction: 'NONE',
    userMessage: 'Der Anruf ist bereits voll.',
    technicalMessage: 'Video call room has reached maximum participants',
  },

  // Generic
  UNKNOWN_ERROR: {
    severity: 'error',
    recoverable: false,
    suggestedAction: 'CONTACT_SUPPORT',
    userMessage: 'Ein unbekannter Fehler ist aufgetreten.',
    technicalMessage: 'Unknown error occurred',
  },
};

// ============================================================================
// VideoCallError Class
// ============================================================================

export class VideoCallError extends Error {
  public readonly code: VideoCallErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly suggestedAction: RecoveryAction;
  public readonly userMessage: string;
  public readonly context: VideoCallErrorContext;
  public readonly timestamp: Date;

  constructor(
    code: VideoCallErrorCode,
    context: VideoCallErrorContext = {},
    customMessage?: string
  ) {
    const metadata = ERROR_METADATA[code];
    super(customMessage ?? metadata.technicalMessage);

    this.name = 'VideoCallError';
    this.code = code;
    this.severity = metadata.severity;
    this.recoverable = metadata.recoverable;
    this.suggestedAction = metadata.suggestedAction;
    this.userMessage = metadata.userMessage;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (V8 engines only)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, VideoCallError);
    }
  }

  /**
   * Convert to a plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      recoverable: this.recoverable,
      suggestedAction: this.suggestedAction,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Log the error with appropriate level
   */
  log(): void {
    const logData = this.toJSON();

    switch (this.severity) {
      case 'critical':
      case 'error':
        console.error(`[VideoCallError:${this.code}]`, logData);
        break;
      case 'warning':
        console.warn(`[VideoCallError:${this.code}]`, logData);
        break;
      case 'info':
        console.debug(`[VideoCallError:${this.code}]`, logData);
        break;
      default:
        // Exhaustive check - all ErrorSeverity cases handled above
        console.debug(`[VideoCallError:${this.code}]`, logData);
    }
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create VideoCallError from WebRTC/Media errors
 */
export function fromWebRTCError(
  error: unknown,
  context: VideoCallErrorContext = {}
): VideoCallError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return new VideoCallError('PERMISSION_DENIED', {
          ...context,
          constraint: (error as DOMException & { constraint?: string }).constraint,
          originalError: error,
        });

      case 'NotFoundError':
        return new VideoCallError('DEVICE_NOT_FOUND', {
          ...context,
          originalError: error,
        });

      case 'NotReadableError':
      case 'AbortError':
        return new VideoCallError('DEVICE_IN_USE', {
          ...context,
          originalError: error,
        });

      case 'OverconstrainedError':
        return new VideoCallError('DEVICE_OVERCONSTRAINED', {
          ...context,
          constraint: (error as DOMException & { constraint?: string }).constraint,
          originalError: error,
        });

      case 'SecurityError':
        return new VideoCallError('PERMISSION_DENIED', {
          ...context,
          originalError: error,
        });

      default:
        return new VideoCallError(
          'UNKNOWN_ERROR',
          {
            ...context,
            originalError: error,
          },
          error.message
        );
    }
  }

  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('Permission denied')) {
      return new VideoCallError('PERMISSION_DENIED', { ...context, originalError: error });
    }
    if (error.message.includes('Could not start video source')) {
      return new VideoCallError('DEVICE_IN_USE', { ...context, originalError: error });
    }

    return new VideoCallError('UNKNOWN_ERROR', { ...context, originalError: error }, error.message);
  }

  return new VideoCallError('UNKNOWN_ERROR', { ...context, originalError: error });
}

/**
 * Create VideoCallError from SignalR errors
 */
export function fromSignalRError(
  error: unknown,
  context: VideoCallErrorContext = {}
): VideoCallError {
  if (error instanceof Error) {
    if (error.message.includes('reconnect')) {
      return new VideoCallError('SIGNALR_RECONNECT_FAILED', { ...context, originalError: error });
    }
    if (error.message.includes('disconnect') || error.message.includes('closed')) {
      return new VideoCallError('SIGNALR_DISCONNECTED', { ...context, originalError: error });
    }
    return new VideoCallError('SIGNALR_CONNECTION_FAILED', { ...context, originalError: error });
  }

  return new VideoCallError('SIGNALR_CONNECTION_FAILED', { ...context, originalError: error });
}

/**
 * Create VideoCallError from E2EE errors
 */
export function fromE2EEError(
  type: 'key_exchange' | 'encryption' | 'decryption' | 'signature' | 'worker',
  error: unknown,
  context: VideoCallErrorContext = {}
): VideoCallError {
  const errorContext = { ...context, originalError: error };

  switch (type) {
    case 'key_exchange':
      if (error instanceof Error && error.message.includes('timeout')) {
        return new VideoCallError('E2EE_KEY_EXCHANGE_TIMEOUT', errorContext);
      }
      return new VideoCallError('E2EE_KEY_EXCHANGE_FAILED', errorContext);

    case 'encryption':
      return new VideoCallError('E2EE_ENCRYPTION_FAILED', errorContext);

    case 'decryption':
      return new VideoCallError('E2EE_DECRYPTION_FAILED', errorContext);

    case 'signature':
      return new VideoCallError('E2EE_SIGNATURE_VERIFICATION_FAILED', errorContext);

    case 'worker':
      return new VideoCallError('E2EE_WORKER_ERROR', errorContext);

    default:
      return new VideoCallError('UNKNOWN_ERROR', errorContext);
  }
}

/**
 * Check if an error is a VideoCallError
 */
export function isVideoCallError(error: unknown): error is VideoCallError {
  return error instanceof VideoCallError;
}

/**
 * Get recovery action description
 */
export function getRecoveryActionDescription(action: RecoveryAction): string {
  switch (action) {
    case 'RETRY':
      return 'Erneut versuchen';
    case 'REFRESH_PAGE':
      return 'Seite neu laden';
    case 'CHECK_PERMISSIONS':
      return 'Berechtigungen in den Browser-Einstellungen prüfen';
    case 'CHECK_DEVICES':
      return 'Geräteverbindungen prüfen';
    case 'RECONNECT':
      return 'Verbindung wiederherstellen';
    case 'REJOIN_ROOM':
      return 'Raum erneut beitreten';
    case 'RESTART_CALL':
      return 'Anruf neu starten';
    case 'CONTACT_SUPPORT':
      return 'Support kontaktieren';
    case 'NONE':
    default:
      return '';
  }
}
