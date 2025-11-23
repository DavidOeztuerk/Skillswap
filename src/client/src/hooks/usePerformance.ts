import { useRef, useEffect, useMemo, useState } from 'react';
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
 */
export function usePerformance(componentName: string, props?: Record<string, unknown>): PerformanceMetrics {
  // Only enable in development and when profiler is enabled
  const profilerEnabled = performanceProfiler.isEnabled() && import.meta.env.DEV;
  const renderStartTime = useRef<number>(0);
  const previousProps = useRef(props);
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const componentId = useRef(`${componentName}-${Math.random().toString(36).substr(2, 9)}`);
  const trackerKeyRef = useRef('');
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
  });

  if (!trackerKeyRef.current) {
    trackerKeyRef.current = `${componentName}[${componentId.current}]`;
  }

  // Start timing at the beginning of render (DEV only)
  if (profilerEnabled) {
    renderStartTime.current = performance.now();
  }

  // Track prop changes (DEV only)
  const propsChanged = useMemo(() => {
    if (!profilerEnabled) return false;
    if (previousProps.current === undefined) return false;

    if (typeof props === 'object' && typeof previousProps.current === 'object') {
      try {
        return JSON.stringify(props) !== JSON.stringify(previousProps.current);
      } catch {
        return true;
      }
    }

    return props !== previousProps.current;
  }, [profilerEnabled, props]);

  useEffect(() => {
    if (!profilerEnabled) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current++;
    totalRenderTime.current += renderTime;
    renderTimes.current.push(renderTime);

    if (renderTimes.current.length > 100) {
      renderTimes.current.shift();
    }

    performanceProfiler.trackRender(trackerKeyRef.current, renderTime, propsChanged);

    metricsRef.current = {
      renderCount: renderCount.current,
      averageRenderTime:
        renderTimes.current.length > 0
          ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
          : 0,
      lastRenderTime: renderTime,
      totalRenderTime: totalRenderTime.current,
    };

    previousProps.current = props;

    // Only log critical performance issues (slow renders > 50ms)
    if (import.meta.env.DEV && renderTime > 50) {
      console.warn(`🐌 ${componentName}: Slow render ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
    }

    // Only warn about excessive re-renders without prop changes (> 20 renders)
    if (import.meta.env.DEV && renderCount.current > 20 && !propsChanged && renderCount.current % 10 === 0) {
      console.warn(`🔄 ${componentName}: ${renderCount.current} renders without prop changes - consider React.memo`);
    }
  }, [componentName, profilerEnabled, props, propsChanged]);

  useEffect(() => {
    if (!profilerEnabled) return;

    return () => {
      performanceProfiler.remove(trackerKeyRef.current);

      // Only log unmounts for components with excessive renders (potential memory leak indicator)
      if (import.meta.env.DEV && renderCount.current > 50) {
        console.warn(`🧹 ${componentName}: Unmounted after ${renderCount.current} renders (check for memory leaks)`);
      }
    };
  }, [componentName, profilerEnabled]);

  return metricsRef.current;
}

/**
 * Hook for tracking expensive operations
 */
export function useOperationPerformance() {
  const operations = useRef<Map<string, number>>(new Map());

  const startOperation = (operationName: string) => {
    operations.current.set(operationName, performance.now());
  };

  const endOperation = (operationName: string) => {
    const startTime = operations.current.get(operationName);
    if (startTime) {
      const duration = performance.now() - startTime;
      operations.current.delete(operationName);
      
      // Log slow operations
      if (duration > 100) {
        console.warn(`⏱️ Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    return 0;
  };

  const measureOperation = async <T>(operationName: string, operation: () => Promise<T> | T): Promise<T> => {
    startOperation(operationName);
    try {
      const result = await operation();
      endOperation(operationName);
      return result;
    } catch (error) {
      endOperation(operationName);
      throw error;
    }
  };

  return {
    startOperation,
    endOperation,
    measureOperation
  };
}

/**
 * Hook for monitoring bundle loading performance
 */
export function useBundlePerformance() {
  const loadingTimes = useRef<Map<string, number>>(new Map());

  const trackChunkLoad = (chunkName: string) => {
    const startTime = performance.now();
    loadingTimes.current.set(chunkName, startTime);
    
    return () => {
      const loadTime = performance.now() - startTime;
      console.log(`📦 Chunk loaded: ${chunkName} in ${loadTime.toFixed(2)}ms`);
      
      // Warn about slow chunk loads
      if (loadTime > 1000) {
        console.warn(`🐌 Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`);
      }
      
      return loadTime;
    };
  };

  return {
    trackChunkLoad
  };
}

/**
 * Hook for detecting memory leaks
 */
export function useMemoryLeak(componentName: string) {
  const mountTime = useRef<number>(Date.now());
  const eventListeners = useRef<Set<string>>(new Set());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const trackEventListener = (eventType: string) => {
    eventListeners.current.add(eventType);
  };

  const trackInterval = (interval: NodeJS.Timeout) => {
    intervals.current.add(interval);
  };

  const trackTimeout = (timeout: NodeJS.Timeout) => {
    timeouts.current.add(timeout);
  };

  useEffect(() => {
    return () => {
      const componentLifetime = Date.now() - mountTime.current;
      
      // Warn about long-lived components with potential memory leaks
      if (componentLifetime > 300000 && (eventListeners.current.size > 0 || intervals.current.size > 0)) { // 5 minutes
        console.warn(`🧠 Potential memory leak in ${componentName}:`, {
          lifetime: `${(componentLifetime / 1000).toFixed(0)}s`,
          eventListeners: Array.from(eventListeners.current),
          intervals: intervals.current.size,
          timeouts: timeouts.current.size
        });
      }
    };
  }, [componentName]);

  return {
    trackEventListener,
    trackInterval,
    trackTimeout
  };
}

/**
 * Enhanced utility functions from legacy performance.ts
 */

/**
 * Debounce utility for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle utility for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastExecution = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      func(...args);
      lastExecution = now;
    }
  };
};

/**
 * Utility for measuring async operations with enhanced error handling
 */
export const measureAsync = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      if (duration > 1000) {
        console.warn(`🐌 Slow async operation: ${label} took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
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
 * Get memory usage if available
 */
export const getMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

/**
 * Hook for page load performance monitoring
 */
export function usePageLoadPerformance() {
  const [pageMetrics, setPageMetrics] = useState<{
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const renderTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
      
      setPageMetrics({
        loadTime,
        renderTime,
        memoryUsage: getMemoryUsage()
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Page Load Performance:', {
          loadTime: `${loadTime}ms`,
          renderTime: `${renderTime}ms`,
          memoryUsage: `${(getMemoryUsage() / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }
  }, []);

  return pageMetrics;
}
