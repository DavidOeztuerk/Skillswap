import { store } from '../store/store';
import { addNotification } from '../features/notifications/notificationSlice';
import { NotificationType } from '../types/models/Notification';
import { errorLogger } from './errorLogger';

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

  private handleOnline = () => {
    this.isOnline = true;
    this.processErrorQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  /**
   * Determines error type based on error object
   */
  private determineErrorType(error: unknown): ErrorDetails['type'] {
    if (error instanceof TypeError && error.message?.includes('fetch')) {
      return 'NETWORK';
    }
    
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      
      if (status === 401) return 'AUTH';
      if (status === 403) return 'PERMISSION';
      if (status >= 400 && status < 500) return 'CLIENT';
      if (status >= 500) return 'SERVER';
    }
    
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      
      if (code === 'VALIDATION_ERROR') return 'VALIDATION';
      if (code === 'NETWORK_ERROR') return 'NETWORK';
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
    if (errorLogger) {
      errorLogger.logError(errorDetails).catch(err => 
        console.error('Failed to log to external service:', err)
      );
    }

    // Add to queue for batch processing
    this.errorQueue.push(errorDetails);

    // Process queue if online
    if (this.isOnline) {
      this.processErrorQueue();
    }
  }

  /**
   * Processes error queue and sends to external service
   */
  private async processErrorQueue(): Promise<void> {
    if (!this.errorQueue || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to error tracking service if available
      if (errorLogger) {
        await errorLogger.logErrors(errors);
        console.log('Errors sent to tracking service:', errors.length);
      } else {
        console.log('No error logger configured, errors logged locally:', errors);
      }
    } catch (error) {
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
      const state = store.getState();
      return state.auth.user?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Handles API errors from HTTP client
   */
  public handleApiError(error: unknown, context?: string): void {
    const errorType = this.determineErrorType(error);
    const originalMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : 'Unknown error';

    const errorDetails: ErrorDetails = {
      type: errorType,
      message: originalMessage,
      code: error && typeof error === 'object' && 'code' in error ? error.code as string | number : undefined,
      details: {
        context,
        ...(error && typeof error === 'object' ? error : {}),
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.logError(errorDetails);

    // Show user notification for certain error types
    if (['NETWORK', 'SERVER', 'AUTH']?.includes(errorType)) {
      const userMessage = this.getUserFriendlyMessage(errorType, originalMessage);
      
      store.dispatch(addNotification({
        id: `error-${Date.now()}`,
        userId: this.getCurrentUserId(),
        type: NotificationType.System,
        title: 'Error',
        message: userMessage,
        createdAt: new Date().toISOString(),
        autoHide: errorType !== 'AUTH', // Keep auth errors visible
        duration: errorType === 'NETWORK' ? 10000 : 5000,
        isRead: false,
      }));
    }
  }

  /**
   * Handles component errors from Error Boundaries
   */
  public handleComponentError(error: Error, errorInfo: { componentStack: string }, context?: string): void {
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
    store.dispatch(addNotification({
      id: `component-error-${Date.now()}`,
      userId: this.getCurrentUserId(),
      type: NotificationType.System,
      title: 'Component Error',
      message: 'A component error occurred. The page may not work correctly.',
      createdAt: new Date().toISOString(),
      autoHide: true,
      duration: 8000,
      isRead: false,
    }));
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
    const message = errorMessages?.length > 0 
      ? errorMessages.join(', ')
      : 'Please check your input and try again.';

    store.dispatch(addNotification({
      id: `validation-error-${Date.now()}`,
      userId: this.getCurrentUserId(),
      type: NotificationType.System,
      title: 'Validation Error',
      message,
      createdAt: new Date().toISOString(),
      autoHide: true,
      duration: 6000,
      isRead: false,
    }));
  }

  /**
   * Handles general errors with custom message
   */
  public handleError(error: unknown, message?: string, context?: string): void {
    const errorType = this.determineErrorType(error);
    const originalMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : 'Unknown error';

    const errorDetails: ErrorDetails = {
      type: errorType,
      message: message || originalMessage,
      details: { context, originalError: error },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    this.logError(errorDetails);

    // Show user notification
    const userMessage = message || this.getUserFriendlyMessage(errorType, originalMessage);
    
    store.dispatch(addNotification({
      id: `error-${Date.now()}`,
      userId: this.getCurrentUserId(),
      type: NotificationType.System,
      title: 'Error',
      message: userMessage,
      createdAt: new Date().toISOString(),
      autoHide: true,
      duration: 5000,
      isRead: false,
    }));
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
    if (errorLogger) {
      errorLogger.addBreadcrumb(message, category, data);
    }
  }

  /**
   * Set user context for error tracking
   */
  public setUserContext(userId: string, email?: string, username?: string): void {
    if (errorLogger) {
      errorLogger.setUser(userId, email, username);
    }
  }

  /**
   * Clear all breadcrumbs
   */
  public clearBreadcrumbs(): void {
    if (errorLogger) {
      errorLogger.clearBreadcrumbs();
    }
  }
}

// Export singleton instance
export const errorService = new ErrorService();
export default errorService;