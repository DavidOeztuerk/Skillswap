import type { ErrorDetails } from './errorService';

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

// ============================================================================
// Shared helper for sequential error logging (to avoid duplicate implementations)
// ============================================================================
async function logErrorsSequentially(
  errors: ErrorDetails[],
  logFn: (error: ErrorDetails) => Promise<void>
): Promise<void> {
  // Use Promise.all for parallel logging instead of sequential await in loop
  await Promise.all(errors.map((error) => logFn(error)));
}

/**
 * Sentry Error Logger Implementation
 */
class SentryErrorLogger implements ErrorLoggerService {
  private config?: ErrorLoggerConfig;
  private breadcrumbs: {
    message: string;
    category?: string;
    data?: Record<string, unknown>;
    timestamp: Date;
  }[] = [];

  initialize(config: ErrorLoggerConfig): void {
    this.config = config;

    // In production, you would initialize Sentry here
    // import * as Sentry from '@sentry/react';
    // Sentry.init({
    //   dsn: config.apiKey,
    //   environment: config.environment,
    //   release: config.release,
    // });

    console.debug('Sentry error logger initialized', config);
  }

  logError(error: ErrorDetails): Promise<void> {
    if (!this.config) {
      console.warn('Sentry not initialized');
      return Promise.resolve();
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

    console.debug('Sentry: Logging error', error);
    return Promise.resolve();
  }

  logErrors(errors: ErrorDetails[]): Promise<void> {
    return logErrorsSequentially(errors, (error) => this.logError(error));
  }

  setUser(userId: string, email?: string, username?: string): void {
    // Sentry.setUser({ id: userId, email, username });
    console.debug('Sentry: User set', { userId, email, username });
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

    console.debug('LogRocket error logger initialized', config);
  }

  logError(error: ErrorDetails): Promise<void> {
    if (!this.config) {
      console.warn('LogRocket not initialized');
      return Promise.resolve();
    }

    // LogRocket.captureException(new Error(error.message), {
    //   extra: error.details,
    // });

    console.debug('LogRocket: Logging error', error);
    return Promise.resolve();
  }

  logErrors(errors: ErrorDetails[]): Promise<void> {
    return logErrorsSequentially(errors, (error) => this.logError(error));
  }

  setUser(userId: string, email?: string, username?: string): void {
    // LogRocket.identify(userId, { email, username });
    console.debug('LogRocket: User identified', { userId, email, username });
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
    // LogRocket.track(category || 'breadcrumb', { message, ...data });
    console.debug('LogRocket: Breadcrumb added', { message, category, data });
  }

  clearBreadcrumbs(): void {
    console.debug('LogRocket: Breadcrumbs cleared');
  }
}

/**
 * Custom Error Logger Implementation (for internal APIs)
 */
class CustomErrorLogger implements ErrorLoggerService {
  private config?: ErrorLoggerConfig;
  private breadcrumbs: {
    message: string;
    category?: string;
    data?: Record<string, unknown>;
    timestamp: Date;
  }[] = [];

  initialize(config: ErrorLoggerConfig): void {
    this.config = config;
    console.debug('Custom error logger initialized', config);
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
          'X-Environment': this.config.environment ?? 'production',
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
          'X-Environment': this.config.environment ?? 'production',
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
    if (!this.config) return;
    this.config = {
      ...this.config,
      metadata: {
        ...this.config.metadata,
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

// ============================================================================
// Error Logger Factory (module pattern to avoid class with only static members)
// ============================================================================
let errorLoggerInstance: ErrorLoggerService | null = null;

function createLogger(service: ErrorLoggerConfig['service']): ErrorLoggerService {
  switch (service) {
    case 'sentry':
      return new SentryErrorLogger();
    case 'logrocket':
      return new LogRocketErrorLogger();
    case 'rollbar':
    case 'bugsnag':
      // Not implemented - fallback to custom logger
      console.warn(`${service} not implemented, using custom logger`);
      return new CustomErrorLogger();
    case 'custom':
    default:
      return new CustomErrorLogger();
  }
}

export const ErrorLoggerFactory = {
  create(config: ErrorLoggerConfig): ErrorLoggerService {
    const logger = createLogger(config.service);
    logger.initialize(config);
    errorLoggerInstance = logger;
    return logger;
  },

  getInstance(): ErrorLoggerService | null {
    return errorLoggerInstance;
  },
};

/**
 * Initialize error logger based on environment.
 * Set the following environment variables in .env file to enable:
 * - VITE_ERROR_LOGGER_SERVICE=sentry|logrocket|custom
 * - VITE_ERROR_LOGGER_API_KEY=your-api-key (for sentry/logrocket)
 * - VITE_ERROR_LOGGER_ENDPOINT=your-endpoint (for custom)
 */
export function initializeErrorLogger(): ErrorLoggerService | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  const env = import.meta.env.MODE || 'production';
  const service = import.meta.env.VITE_ERROR_LOGGER_SERVICE as string | undefined;
  const apiKey = import.meta.env.VITE_ERROR_LOGGER_API_KEY as string | undefined;
  const endpoint = import.meta.env.VITE_ERROR_LOGGER_ENDPOINT as string | undefined;

  // Check if error logger is configured
  if (!service) {
    if (env === 'development') {
      console.debug('Error logger not configured - using console only');
    }
    return null;
  }

  // Validate configuration based on service type
  const needsApiKey = service !== 'custom' && !apiKey;
  const needsEndpoint = service === 'custom' && !endpoint;

  if (needsApiKey || needsEndpoint) {
    console.warn('Error logger misconfigured - missing required credentials');
    return null;
  }

  try {
    const config: ErrorLoggerConfig = {
      service: service as ErrorLoggerConfig['service'],
      apiKey,
      endpoint,
      environment: env,
      release: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '1.0.0',
    };

    return ErrorLoggerFactory.create(config);
  } catch (error) {
    // If initialization fails, continue without error logging
    console.debug('Error logger initialization failed:', error);
    return null;
  }
}

// Export default logger instance
export const errorLogger = initializeErrorLogger();
