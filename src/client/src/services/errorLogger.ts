import { ErrorDetails } from './errorService';

/**
 * Error Logger Service for external monitoring integration
 * Supports multiple error tracking services
 */
export interface ErrorLoggerConfig {
  service: 'sentry' | 'logrocket' | 'rollbar' | 'bugsnag' | 'custom';
  apiKey?: string;
  endpoint?: string;
  environment?: string;
  release?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorLoggerService {
  initialize(config: ErrorLoggerConfig): void;
  logError(error: ErrorDetails): Promise<void>;
  logErrors(errors: ErrorDetails[]): Promise<void>;
  setUser(userId: string, email?: string, username?: string): void;
  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void;
  clearBreadcrumbs(): void;
}

/**
 * Sentry Error Logger Implementation
 */
class SentryErrorLogger implements ErrorLoggerService {
  private config?: ErrorLoggerConfig;
  private breadcrumbs: Array<{ message: string; category?: string; data?: Record<string, unknown>; timestamp: Date }> = [];

  initialize(config: ErrorLoggerConfig): void {
    this.config = config;
    
    // In production, you would initialize Sentry here
    // import * as Sentry from '@sentry/react';
    // Sentry.init({
    //   dsn: config.apiKey,
    //   environment: config.environment,
    //   release: config.release,
    // });
    
    console.log('Sentry error logger initialized', config);
  }

  async logError(error: ErrorDetails): Promise<void> {
    if (!this.config) {
      console.warn('Sentry not initialized');
      return;
    }

    // In production:
    // Sentry.captureException(new Error(error.message), {
    //   level: this.getSeverityLevel(error.type),
    //   tags: {
    //     errorType: error.type,
    //     errorCode: error.code,
    //   },
    //   extra: error.details,
    //   contexts: {
    //     error: {
    //       type: error.type,
    //       url: error.url,
    //       userId: error.userId,
    //     },
    //   },
    // });

    console.log('Sentry: Logging error', error);
  }

  async logErrors(errors: ErrorDetails[]): Promise<void> {
    for (const error of errors) {
      await this.logError(error);
    }
  }

  setUser(userId: string, email?: string, username?: string): void {
    // Sentry.setUser({ id: userId, email, username });
    console.log('Sentry: User set', { userId, email, username });
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    const breadcrumb = { message, category, data, timestamp: new Date() };
    this.breadcrumbs.push(breadcrumb);
    
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   level: 'info',
    // });
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
    // Sentry.configureScope(scope => scope.clearBreadcrumbs());
  }

}

/**
 * LogRocket Error Logger Implementation
 */
class LogRocketErrorLogger implements ErrorLoggerService {
  private config?: ErrorLoggerConfig;

  initialize(config: ErrorLoggerConfig): void {
    this.config = config;
    
    // In production:
    // import LogRocket from 'logrocket';
    // LogRocket.init(config.apiKey);
    
    console.log('LogRocket error logger initialized', config);
  }

  async logError(error: ErrorDetails): Promise<void> {
    if (!this.config) {
      console.warn('LogRocket not initialized');
      return;
    }

    // LogRocket.captureException(new Error(error.message), {
    //   extra: error.details,
    // });

    console.log('LogRocket: Logging error', error);
  }

  async logErrors(errors: ErrorDetails[]): Promise<void> {
    for (const error of errors) {
      await this.logError(error);
    }
  }

  setUser(userId: string, email?: string, username?: string): void {
    // LogRocket.identify(userId, { email, username });
    console.log('LogRocket: User identified', { userId, email, username });
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    // LogRocket.track(category || 'breadcrumb', { message, ...data });
    console.log('LogRocket: Breadcrumb added', { message, category, data });
  }

  clearBreadcrumbs(): void {
    console.log('LogRocket: Breadcrumbs cleared');
  }
}

/**
 * Custom Error Logger Implementation (for internal APIs)
 */
class CustomErrorLogger implements ErrorLoggerService {
  private config?: ErrorLoggerConfig;
  private breadcrumbs: Array<{ message: string; category?: string; data?: Record<string, unknown>; timestamp: Date }> = [];

  initialize(config: ErrorLoggerConfig): void {
    this.config = config;
    console.log('Custom error logger initialized', config);
  }

  async logError(error: ErrorDetails): Promise<void> {
    if (!this.config?.endpoint) {
      console.warn('Custom logger endpoint not configured');
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Environment': this.config.environment || 'production',
        },
        body: JSON.stringify({
          error,
          breadcrumbs: this.breadcrumbs,
          metadata: this.config.metadata,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log error to custom endpoint', response.status);
      }
    } catch (err) {
      console.error('Error sending to custom logger:', err);
    }
  }

  async logErrors(errors: ErrorDetails[]): Promise<void> {
    if (!this.config?.endpoint) {
      console.warn('Custom logger endpoint not configured');
      return;
    }

    try {
      const response = await fetch(`${this.config.endpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Environment': this.config.environment || 'production',
        },
        body: JSON.stringify({
          errors,
          breadcrumbs: this.breadcrumbs,
          metadata: this.config.metadata,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log errors to custom endpoint', response.status);
      }
    } catch (err) {
      console.error('Error sending batch to custom logger:', err);
    }
  }

  setUser(userId: string, email?: string, username?: string): void {
    this.config = {
      ...this.config!,
      metadata: {
        ...this.config?.metadata,
        user: { id: userId, email, username },
      },
    };
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    this.breadcrumbs.push({
      message,
      category,
      data,
      timestamp: new Date(),
    });

    // Keep only last 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs = this.breadcrumbs.slice(-100);
    }
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

/**
 * Error Logger Factory
 */
export class ErrorLoggerFactory {
  private static instance: ErrorLoggerService | null = null;

  static create(config: ErrorLoggerConfig): ErrorLoggerService {
    let logger: ErrorLoggerService;

    switch (config.service) {
      case 'sentry':
        logger = new SentryErrorLogger();
        break;
      case 'logrocket':
        logger = new LogRocketErrorLogger();
        break;
      case 'custom':
        logger = new CustomErrorLogger();
        break;
      default:
        logger = new CustomErrorLogger();
    }

    logger.initialize(config);
    this.instance = logger;
    return logger;
  }

  static getInstance(): ErrorLoggerService | null {
    return this.instance;
  }
}

/**
 * Initialize error logger based on environment
 */
export function initializeErrorLogger(): ErrorLoggerService | null {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return null;
    }

    // For now, just return null - external error logging is optional
    // When you want to enable it, set the environment variables in .env file:
    // VITE_ERROR_LOGGER_SERVICE=sentry
    // VITE_ERROR_LOGGER_API_KEY=your-api-key
    // VITE_ERROR_LOGGER_ENDPOINT=your-endpoint
    
    // Uncomment this block when you have environment variables configured:
    /*
    const env = import.meta.env.MODE || 'production';
    const service = import.meta.env.VITE_ERROR_LOGGER_SERVICE;
    const apiKey = import.meta.env.VITE_ERROR_LOGGER_API_KEY;
    const endpoint = import.meta.env.VITE_ERROR_LOGGER_ENDPOINT;

    if (!service || (service !== 'custom' && !apiKey) || (service === 'custom' && !endpoint)) {
      if (env === 'development') {
        console.log('Error logger not configured - using console only');
      }
      return null;
    }

    const config: ErrorLoggerConfig = {
      service: service as ErrorLoggerConfig['service'],
      apiKey,
      endpoint,
      environment: env,
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };

    return ErrorLoggerFactory.create(config);
    */
    
    return null;
  } catch (error) {
    // If anything fails, just return null - error logging is optional
    console.log('Error logger initialization skipped:', error);
    return null;
  }
}

// Export default logger instance
export const errorLogger = initializeErrorLogger();