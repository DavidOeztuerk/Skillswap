import React, { useRef, useEffect, useLayoutEffect, useCallback, useId, useState } from 'react';
import { performanceProfiler } from '../utils/performanceProfiler';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
}

/**
 * Hook for tracking component performance
 * Automatically tracks render count, timing, and prop changes
 *
 * NOTE: This hook returns a getter function to access metrics, avoiding
 * direct ref access during render which ESLint flags as problematic.
 * Call getMetrics() in event handlers or effects to get current values.
 */
export function usePerformance(
  componentName: string,
  props?: Record<string, unknown>
): { getMetrics: () => PerformanceMetrics } {
  // Only enable in development and when profiler is enabled
  const profilerEnabled = performanceProfiler.isEnabled() && import.meta.env.DEV;

  // Use lazy initialization to avoid calling performance.now() during render
  const renderStartTime = useRef<number | null>(null);
  const previousProps = useRef(props);
  const renderCountRef = useRef(0);
  const totalRenderTimeRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);

  // Use React's useId for stable component ID - guaranteed unique and pure
  const reactId = useId();
  const componentId = `${componentName}${reactId}`;

  // Derive tracker key from componentId
  const trackerKey = `${componentName}[${componentId}]`;

  // Store latest metrics in a ref (updated in useLayoutEffect)
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
  });

  // Use useLayoutEffect to track render performance (runs synchronously after render)
  // This avoids calling performance.now() during render (which ESLint flags as impure)
  useLayoutEffect(() => {
    if (!profilerEnabled) return;

    const renderEndTime = performance.now();
    const startTime = renderStartTime.current;

    // Calculate render time (if we have a start time)
    const renderTime = startTime === null ? 0 : renderEndTime - startTime;

    // Check if props changed
    const prevProps = previousProps.current;
    const propsChanged =
      prevProps === undefined || JSON.stringify(props) !== JSON.stringify(prevProps);

    renderCountRef.current++;
    totalRenderTimeRef.current += renderTime;
    renderTimesRef.current.push(renderTime);

    // Keep only last 50 renders
    if (renderTimesRef.current.length > 50) {
      renderTimesRef.current.shift();
    }

    // Calculate average
    const averageRenderTime =
      renderTimesRef.current.length > 0
        ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
        : 0;

    // Update metrics ref
    metricsRef.current = {
      renderCount: renderCountRef.current,
      averageRenderTime,
      lastRenderTime: renderTime,
      totalRenderTime: totalRenderTimeRef.current,
    };

    // Track in profiler
    performanceProfiler.trackRender(trackerKey, renderTime, propsChanged);

    // Update previous props
    previousProps.current = props;

    // Performance warnings (throttled to avoid spam)
    if (import.meta.env.DEV) {
      // Slow render warning (only if > 50ms)
      if (renderTime > 50) {
        console.warn(
          `🐌 ${componentName}: Slow render ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`
        );
      }

      // Excessive re-renders warning (only every 50 renders after 100)
      if (renderCountRef.current > 100 && !propsChanged && renderCountRef.current % 50 === 0) {
        console.warn(
          `🔄 ${componentName}: ${renderCountRef.current} renders without prop changes - consider React.memo`
        );
      }
    }

    // Set start time for next render measurement
    renderStartTime.current = performance.now();
  }); // Run on every render to track performance

  // Cleanup on unmount
  useEffect(() => {
    if (!profilerEnabled) return;

    // Capture ref value for use in cleanup
    const currentRenderCount = renderCountRef.current;

    return () => {
      performanceProfiler.remove(trackerKey);

      if (import.meta.env.DEV && currentRenderCount > 50) {
        console.warn(
          `🧹 ${componentName}: Unmounted after ${currentRenderCount} renders (check for memory leaks)`
        );
      }
    };
  }, [componentName, profilerEnabled, trackerKey]);

  // Return a stable getter function - access metrics via getMetrics() in handlers/effects
  const getMetrics = useCallback(() => metricsRef.current, []);

  return { getMetrics };
}

/**
 * Hook for tracking expensive operations
 */
export function useOperationPerformance(): {
  startOperation: (operationName: string, timeoutMs?: number) => void;
  endOperation: (operationName: string) => number;
  measureOperation: <T>(
    operationName: string,
    operation: () => Promise<T> | T,
    timeoutMs?: number
  ) => Promise<T>;
} {
  const operations = useRef<Map<string, { startTime: number; timeout?: NodeJS.Timeout }>>(
    new Map()
  );

  const startOperation = useCallback((operationName: string, timeoutMs = 30000) => {
    const startTime = performance.now();

    // Auto-cleanup after timeout to prevent memory leaks
    const timeout = setTimeout(() => {
      if (operations.current.has(operationName)) {
        console.warn(`⏰ Operation timeout: ${operationName} exceeded ${timeoutMs}ms`);
        operations.current.delete(operationName);
      }
    }, timeoutMs);

    operations.current.set(operationName, { startTime, timeout });
  }, []);

  const endOperation = useCallback((operationName: string): number => {
    const operation = operations.current.get(operationName);
    if (!operation) return 0;

    const duration = performance.now() - operation.startTime;

    // Clear timeout
    if (operation.timeout) {
      clearTimeout(operation.timeout);
    }

    operations.current.delete(operationName);

    // Log slow operations
    if (duration > 100) {
      console.warn(`⏱️ Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }, []);

  const measureOperation = useCallback(
    async <T>(
      operationName: string,
      operation: () => Promise<T> | T,
      timeoutMs?: number
    ): Promise<T> => {
      startOperation(operationName, timeoutMs);
      try {
        const result = await operation();
        endOperation(operationName);
        return result;
      } catch (error) {
        endOperation(operationName);
        throw error;
      }
    },
    [startOperation, endOperation]
  );

  // Cleanup pending operations on unmount
  useEffect(() => {
    // Capture ref value for use in cleanup
    const currentOperations = operations.current;

    return () => {
      currentOperations.forEach((operation, name) => {
        if (operation.timeout) {
          clearTimeout(operation.timeout);
        }
        console.warn(`🧹 Pending operation cleaned up: ${name}`);
      });
      currentOperations.clear();
    };
  }, []);

  return {
    startOperation,
    endOperation,
    measureOperation,
  };
}

/**
 * Hook for monitoring bundle loading performance
 */
export function useBundlePerformance(): {
  trackChunkLoad: (chunkName: string) => () => number;
} {
  const loadingTimes = useRef<Map<string, number>>(new Map());

  const trackChunkLoad = useCallback((chunkName: string) => {
    const startTime = performance.now();
    loadingTimes.current.set(chunkName, startTime);

    return () => {
      const loadTime = performance.now() - startTime;

      if (import.meta.env.DEV) {
        console.debug(`📦 Chunk loaded: ${chunkName} in ${loadTime.toFixed(2)}ms`);

        if (loadTime > 1000) {
          console.warn(`🐌 Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`);
        }
      }

      loadingTimes.current.delete(chunkName);
      return loadTime;
    };
  }, []);

  return {
    trackChunkLoad,
  };
}

/**
 * Hook for detecting memory leaks
 */
export function useMemoryLeakDetection(componentName: string): {
  trackEventListener: (target: EventTarget, type: string, listener: EventListener) => void;
  trackInterval: (interval: NodeJS.Timeout) => void;
  trackTimeout: (timeout: NodeJS.Timeout) => void;
  cleanup: () => void;
} {
  // Use useState for mount time with lazy initializer (computed once on mount)
  // The setter is intentionally unused as this is constant state
  const [mountTime, setMountTime] = React.useState(() => Date.now());
  void setMountTime; // Suppress unused variable warning

  const eventListeners = useRef<Map<EventTarget, { type: string; listener: EventListener }[]>>(
    new Map()
  );
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const trackEventListener = useCallback(
    (target: EventTarget, type: string, listener: EventListener) => {
      if (!eventListeners.current.has(target)) {
        eventListeners.current.set(target, []);
      }
      const listeners = eventListeners.current.get(target);
      if (listeners) {
        listeners.push({ type, listener });
      }
    },
    []
  );

  const trackInterval = useCallback((interval: NodeJS.Timeout) => {
    intervals.current.add(interval);
  }, []);

  const trackTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeouts.current.add(timeout);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all intervals
    intervals.current.forEach((interval) => {
      clearInterval(interval);
    });
    intervals.current.clear();

    // Clear all timeouts
    timeouts.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeouts.current.clear();

    // Remove all event listeners
    eventListeners.current.forEach((listeners, target) => {
      listeners.forEach(({ type, listener }) => {
        target.removeEventListener(type, listener);
      });
    });
    eventListeners.current.clear();
  }, []);

  useEffect(
    () => () => {
      const componentLifetime = Date.now() - mountTime;

      // Cleanup all resources
      cleanup();

      // Warn about potential memory leaks for long-lived components
      if (import.meta.env.DEV && componentLifetime > 300000) {
        // 5 minutes
        console.warn(
          `🧠 ${componentName}: Component unmounted after ${(componentLifetime / 1000).toFixed(0)}s`
        );
      }
    },
    [componentName, cleanup, mountTime]
  );

  return {
    trackEventListener,
    trackInterval,
    trackTimeout,
    cleanup,
  };
}

/**
 * Enhanced utility functions
 */

/**
 * Debounce utility for performance optimization
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    const later = (): void => {
      timeoutId = undefined;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(later, delay);

    if (callNow) {
      func(...args);
    }
  };
};

/**
 * Throttle utility for performance optimization
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastExecution = 0;
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (!lastExecution || now - lastExecution >= delay) {
      func(...args);
      lastExecution = now;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(
        () => {
          func(...args);
          lastExecution = Date.now();
        },
        delay - (now - lastExecution)
      );
    }
  };
};

/**
 * Utility for measuring async operations with enhanced error handling
 */
export const measureAsync = async <T>(operation: () => Promise<T>, label: string): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (import.meta.env.DEV) {
      if (duration > 1000) {
        console.warn(`🐌 Slow async operation: ${label} took ${duration.toFixed(2)}ms`);
      } else {
        console.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      }
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`❌ ${label} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

/**
 * Extended Performance interface with memory info (Chrome-specific)
 */
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Get memory usage if available
 */
export const getMemoryUsage = (): number => {
  const perfWithMemory = performance as PerformanceWithMemory;
  if (perfWithMemory.memory) {
    return perfWithMemory.memory.usedJSHeapSize;
  }
  return 0;
};

/**
 * Hook for page load performance monitoring
 */
export function usePageLoadPerformance(): {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
} | null {
  const [pageMetrics, setPageMetrics] = useState<{
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const onLoad = (): void => {
      setTimeout(() => {
        // Use modern Navigation Timing API
        const navEntries = performance.getEntriesByType('navigation');
        const navTiming = navEntries[0] as PerformanceNavigationTiming | undefined;

        let loadTime = 0;
        let renderTime = 0;

        if (navTiming) {
          loadTime = navTiming.loadEventEnd - navTiming.startTime;
          renderTime = navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart;
        }

        setPageMetrics({
          loadTime,
          renderTime,
          memoryUsage: getMemoryUsage(),
        });

        if (import.meta.env.DEV) {
          console.debug('📊 Page Load Performance:', {
            loadTime: `${loadTime}ms`,
            renderTime: `${renderTime}ms`,
            memoryUsage: `${(getMemoryUsage() / 1024 / 1024).toFixed(2)}MB`,
          });
        }
      }, 0);
    };

    if (document.readyState === 'complete') {
      onLoad();
      return;
    }

    window.addEventListener('load', onLoad);
    return () => {
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return pageMetrics;
}
