import { addNotification } from '../../features/notifications/store/notificationSlice';
import { NotificationType } from '../../features/notifications/types/Notification';
import { errorLogger } from './errorLogger';
import type { AppDispatch, RootState } from '../store/store';

// Store reference pattern to avoid circular dependencies
let storeDispatch: AppDispatch | null = null;
let storeGetState: (() => RootState) | null = null;

export function setErrorServiceStore(dispatch: AppDispatch, getStateFn: () => RootState): void {
  storeDispatch = dispatch;
  storeGetState = getStateFn;
}

function getDispatch(): AppDispatch {
  if (!storeDispatch) {
    console.warn('ErrorService: Store not initialized yet, skipping dispatch');
    return (() => {
      // No-op dispatch
    }) as unknown as AppDispatch;
  }
  return storeDispatch;
}

function getState(): RootState | null {
  if (!storeGetState) {
    return null;
  }
  return storeGetState();
}

export interface ErrorDetails {
  type: 'NETWORK' | 'VALIDATION' | 'AUTH' | 'PERMISSION' | 'SERVER' | 'CLIENT' | 'UNKNOWN';
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
  timestamp: string;
  url: string;
  userId?: string;
  stack?: string;
  componentStack?: string;
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
  status?: number;
}

// ============================================================================
// Helper functions for error type determination (extracted to reduce complexity)
// ============================================================================
function isErrorObject(error: unknown): error is Record<string, unknown> {
  return error !== null && error !== undefined && typeof error === 'object';
}

function getErrorTypeFromStatus(status: number): ErrorDetails['type'] | null {
  if (status === 401) return 'AUTH';
  if (status === 403) return 'PERMISSION';
  if (status >= 400 && status < 500) return 'CLIENT';
  if (status >= 500) return 'SERVER';
  return null;
}

function getErrorTypeFromCode(code: string): ErrorDetails['type'] | null {
  if (code === 'VALIDATION_ERROR') return 'VALIDATION';
  if (code === 'NETWORK_ERROR') return 'NETWORK';
  return null;
}

/**
 * Centralized error handling service
 */
class ErrorService {
  private errorQueue: ErrorDetails[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    void this.processErrorQueue();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
  };

  /**
   * Determines error type based on error object
   */
  private determineErrorType(error: unknown): ErrorDetails['type'] {
    // Check for fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'NETWORK';
    }

    if (!isErrorObject(error)) {
      return 'UNKNOWN';
    }

    // Check HTTP status code
    if ('status' in error) {
      const statusType = getErrorTypeFromStatus(error.status as number);
      if (statusType) return statusType;
    }

    // Check error code
    if ('code' in error) {
      const codeType = getErrorTypeFromCode(error.code as string);
      if (codeType) return codeType;
    }

    return 'UNKNOWN';
  }

  /**
   * Gets user-friendly error message
   */
  private getUserFriendlyMessage(errorType: ErrorDetails['type'], originalMessage: string): string {
    switch (errorType) {
      case 'NETWORK':
        return 'Network connection error. Please check your internet connection.';
      case 'AUTH':
        return 'Authentication required. Please log in again.';
      case 'PERMISSION':
        return 'You do not have permission to perform this action.';
      case 'VALIDATION':
        return 'Please check your input and try again.';
      case 'SERVER':
        return 'Server error. Please try again later.';
      case 'CLIENT':
        return originalMessage || 'Invalid request. Please try again.';
      case 'UNKNOWN':
      default:
        return originalMessage || 'An unexpected error occurred.';
    }
  }

  /**
   * Logs error to console and external service
   */
  private logError(errorDetails: ErrorDetails): void {
    console.error('Error logged:', errorDetails);

    // Log to external service immediately if available
    if (errorLogger !== null) {
      void Promise.resolve(errorLogger.logError(errorDetails));
    }

    // Add to queue for batch processing
    this.errorQueue.push(errorDetails);

    // Process queue if online
    if (this.isOnline) {
      void this.processErrorQueue();
    }
  }

  /**
   * Processes error queue and sends to external service
   */
  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to error tracking service if available
      if (errorLogger === null) {
        console.debug('No error logger configured, errors logged locally:', errors);
      } else {
        await errorLogger.logErrors(errors);
        console.debug('Errors sent to tracking service:', errors.length);
      }
    } catch (error: unknown) {
      // Re-add errors to queue if sending fails
      this.errorQueue.unshift(...errors);
      console.error('Failed to send errors to tracking service:', error);
    }
  }

  /**
   * Gets current user ID from store
   */
  private getCurrentUserId(): string | undefined {
    try {
      const state = getState();
      return state?.auth.user?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Handles API errors from HTTP client
   */
  public handleApiError(error: unknown, context?: string): void {
    const errorType = this.determineErrorType(error);
    const originalMessage =
      error !== null && error !== undefined && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';

    const errorDetails: ErrorDetails = {
      type: errorType,
      message: originalMessage,
      code:
        error !== null && error !== undefined && typeof error === 'object' && 'code' in error
          ? (error.code as string | number)
          : undefined,
      details: {
        context,
        ...(error !== null && error !== undefined && typeof error === 'object' ? error : {}),
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.logError(errorDetails);

    // Show user notification for certain error types
    if (['NETWORK', 'SERVER', 'AUTH'].includes(errorType)) {
      const userMessage = this.getUserFriendlyMessage(errorType, originalMessage);

      getDispatch()(
        addNotification({
          id: `error-${Date.now()}`,
          userId: this.getCurrentUserId(),
          type: NotificationType.System,
          title: 'Error',
          message: userMessage,
          createdAt: new Date().toISOString(),
          autoHide: errorType !== 'AUTH', // Keep auth errors visible
          duration: errorType === 'NETWORK' ? 10000 : 5000,
          isRead: false,
        })
      );
    }
  }

  /**
   * Handles component errors from Error Boundaries
   */
  public handleComponentError(
    error: Error,
    errorInfo: { componentStack: string },
    context?: string
  ): void {
    const errorDetails: ErrorDetails = {
      type: 'CLIENT',
      message: error.message,
      details: { context },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    };

    this.logError(errorDetails);

    // Show notification for component errors
    getDispatch()(
      addNotification({
        id: `component-error-${String(Date.now())}`,
        userId: this.getCurrentUserId(),
        type: NotificationType.System,
        title: 'Component Error',
        message: 'A component error occurred. The page may not work correctly.',
        createdAt: new Date().toISOString(),
        autoHide: true,
        duration: 8000,
        isRead: false,
      })
    );
  }

  /**
   * Handles validation errors
   */
  public handleValidationError(errors: Record<string, string[]>, context?: string): void {
    const errorDetails: ErrorDetails = {
      type: 'VALIDATION',
      message: 'Validation failed',
      details: { errors, context },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.logError(errorDetails);

    // Show notification with validation errors
    const errorMessages = Object.values(errors).flat();
    const message =
      errorMessages.length > 0
        ? errorMessages.join(', ')
        : 'Please check your input and try again.';

    getDispatch()(
      addNotification({
        id: `validation-error-${Date.now()}`,
        userId: this.getCurrentUserId(),
        type: NotificationType.System,
        title: 'Validation Error',
        message,
        createdAt: new Date().toISOString(),
        autoHide: true,
        duration: 6000,
        isRead: false,
      })
    );
  }

  /**
   * Handles general errors with custom message
   */
  public handleError(error: unknown, message?: string, context?: string): void {
    const errorType = this.determineErrorType(error);
    const originalMessage =
      error !== null && error !== undefined && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Unknown error';

    const errorDetails: ErrorDetails = {
      type: errorType,
      message: message ?? originalMessage,
      details: { context, originalError: error },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.logError(errorDetails);

    // Show user notification
    const userMessage = message ?? this.getUserFriendlyMessage(errorType, originalMessage);

    getDispatch()(
      addNotification({
        id: `error-${Date.now()}`,
        userId: this.getCurrentUserId(),
        type: NotificationType.System,
        title: 'Error',
        message: userMessage,
        createdAt: new Date().toISOString(),
        autoHide: true,
        duration: 5000,
        isRead: false,
      })
    );
  }

  /**
   * Clears error queue (useful for testing)
   */
  public clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Add breadcrumb for error tracking
   */
  public addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    if (errorLogger !== null) {
      errorLogger.addBreadcrumb(message, category, data);
    }
  }

  /**
   * Set user context for error tracking
   */
  public setUserContext(userId: string, email?: string, username?: string): void {
    if (errorLogger !== null) {
      errorLogger.setUser(userId, email, username);
    }
  }

  /**
   * Clear all breadcrumbs
   */
  public clearBreadcrumbs(): void {
    if (errorLogger !== null) {
      errorLogger.clearBreadcrumbs();
    }
  }
}

// Export singleton instance
export const errorService = new ErrorService();
export default errorService;
