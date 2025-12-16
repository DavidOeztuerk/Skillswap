/**
 * Production-safe logger utility
 *
 * Only logs in development mode. In production, logs are silently ignored
 * unless they are errors (which are always logged).
 */

const isDev = import.meta.env.DEV;

/**
 * Creates a namespaced logger for a specific module
 */
export function createLogger(namespace: string): {
  debug: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  table: (data: unknown) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
} {
  const prefix = `[${namespace}]`;

  return {
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },
    log: (...args: unknown[]) => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (isDev) {
        console.warn(prefix, ...args);
      }
    },
    // Errors are always logged, even in production
    error: (...args: unknown[]) => {
      console.error(prefix, ...args);
    },
    // Group logging for complex debugging
    group: (label: string) => {
      if (isDev) {
        console.debug(`--- ${prefix} ${label} ---`);
      }
    },
    groupEnd: () => {
      if (isDev) {
        console.debug('---');
      }
    },
    // Table logging for arrays/objects
    table: (data: unknown) => {
      if (isDev) {
        console.debug(data);
      }
    },
    // Time tracking
    time: (label: string) => {
      if (isDev) {
        console.debug(`${prefix} ${label} - start`);
      }
    },
    timeEnd: (label: string) => {
      if (isDev) {
        console.debug(`${prefix} ${label} - end`);
      }
    },
  };
}

/**
 * Global logger instance for general use
 */
export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug('[App]', message, ...args);
    }
  },
  log: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug('[App]', message, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug('[App]', message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn('[App]', message, ...args);
    }
  },
  // Errors are always logged
  error: (message: string, ...args: unknown[]) => {
    console.error('[App]', message, ...args);
  },
};

export default logger;
