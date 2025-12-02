import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
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
  
  // Use useMemo for stable component ID
  const componentId = useMemo(() => 
    `${componentName}-${Math.random().toString(36).substr(2, 9)}`, 
    [componentName]
  );
  
  const trackerKeyRef = useRef('');
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
  });

  // Initialize tracker key once
  if (!trackerKeyRef.current) {
    trackerKeyRef.current = `${componentName}[${componentId}]`;
  }

  // Start timing at the beginning of render (DEV only)
  if (profilerEnabled) {
    renderStartTime.current = performance.now();
  }

  // Track prop changes (DEV only)
  const propsChanged = useMemo(() => {
    if (!profilerEnabled || !props) return false;
    if (previousProps.current === undefined) return true;

    try {
      // Simple shallow comparison for performance
      const currentKeys = Object.keys(props);
      const previousKeys = Object.keys(previousProps.current || {});
      
      if (currentKeys.length !== previousKeys.length) return true;
      
      for (const key of currentKeys) {
        if (props[key] !== (previousProps.current as any)[key]) {
          return true;
        }
      }
      return false;
    } catch {
      // Fallback to JSON comparison if shallow fails
      try {
        return JSON.stringify(props) !== JSON.stringify(previousProps.current);
      } catch {
        return true;
      }
    }
  }, [profilerEnabled, props]);

  // Track render performance
  useEffect(() => {
    if (!profilerEnabled) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current++;
    totalRenderTime.current += renderTime;
    renderTimes.current.push(renderTime);

    // Keep only last 50 renders for average calculation
    if (renderTimes.current.length > 50) {
      renderTimes.current.shift();
    }

    // Update metrics
    const averageRenderTime = renderTimes.current.length > 0
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      : 0;

    metricsRef.current = {
      renderCount: renderCount.current,
      averageRenderTime,
      lastRenderTime: renderTime,
      totalRenderTime: totalRenderTime.current,
    };

    // Track in profiler
    performanceProfiler.trackRender(trackerKeyRef.current, renderTime, propsChanged);

    // Update previous props for next comparison
    previousProps.current = props;

    // Performance warnings (only in development)
    if (import.meta.env.DEV) {
      // Slow render warning
      if (renderTime > 50) {
        console.warn(`🐌 ${componentName}: Slow render ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }

      // Excessive re-renders warning (only every 10 renders after 20)
      if (renderCount.current > 20 && !propsChanged && renderCount.current % 10 === 0) {
        console.warn(`🔄 ${componentName}: ${renderCount.current} renders without prop changes - consider React.memo`);
      }
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    if (!profilerEnabled) return;

    return () => {
      performanceProfiler.remove(trackerKeyRef.current);

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
  const operations = useRef<Map<string, { startTime: number; timeout?: NodeJS.Timeout }>>(new Map());

  const startOperation = useCallback((operationName: string, timeoutMs: number = 30000) => {
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

  const measureOperation = useCallback(async <T>(
    operationName: string, 
    operation: () => Promise<T> | T,
    timeoutMs: number = 30000
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
  }, [startOperation, endOperation]);

  // Cleanup pending operations on unmount
  useEffect(() => {
    return () => {
      operations.current.forEach((operation, name) => {
        if (operation.timeout) {
          clearTimeout(operation.timeout);
        }
        console.warn(`🧹 Pending operation cleaned up: ${name}`);
      });
      operations.current.clear();
    };
  }, []);

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

  const trackChunkLoad = useCallback((chunkName: string) => {
    const startTime = performance.now();
    loadingTimes.current.set(chunkName, startTime);
    
    return () => {
      const loadTime = performance.now() - startTime;
      
      if (import.meta.env.DEV) {
        console.log(`📦 Chunk loaded: ${chunkName} in ${loadTime.toFixed(2)}ms`);
        
        if (loadTime > 1000) {
          console.warn(`🐌 Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`);
        }
      }
      
      loadingTimes.current.delete(chunkName);
      return loadTime;
    };
  }, []);

  return {
    trackChunkLoad
  };
}

/**
 * Hook for detecting memory leaks
 */
export function useMemoryLeakDetection(componentName: string) {
  const mountTime = useRef<number>(Date.now());
  const eventListeners = useRef<Map<EventTarget, { type: string; listener: EventListener }[]>>(new Map());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const trackEventListener = useCallback((target: EventTarget, type: string, listener: EventListener) => {
    if (!eventListeners.current.has(target)) {
      eventListeners.current.set(target, []);
    }
    eventListeners.current.get(target)!.push({ type, listener });
  }, []);

  const trackInterval = useCallback((interval: NodeJS.Timeout) => {
    intervals.current.add(interval);
  }, []);

  const trackTimeout = useCallback((timeout: NodeJS.Timeout) => {
    timeouts.current.add(timeout);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all intervals
    intervals.current.forEach(interval => clearInterval(interval));
    intervals.current.clear();

    // Clear all timeouts
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current.clear();

    // Remove all event listeners
    eventListeners.current.forEach((listeners, target) => {
      listeners.forEach(({ type, listener }) => {
        target.removeEventListener(type, listener);
      });
    });
    eventListeners.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      const componentLifetime = Date.now() - mountTime.current;
      
      // Cleanup all resources
      cleanup();
      
      // Warn about potential memory leaks for long-lived components
      if (import.meta.env.DEV && componentLifetime > 300000) { // 5 minutes
        console.warn(`🧠 ${componentName}: Component unmounted after ${(componentLifetime / 1000).toFixed(0)}s`);
      }
    };
  }, [componentName, cleanup]);

  return {
    trackEventListener,
    trackInterval,
    trackTimeout,
    cleanup
  };
}

/**
 * Enhanced utility functions
 */

/**
 * Debounce utility for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | undefined;
  
  return (...args: Parameters<T>) => {
    const later = () => {
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
export const throttle = <T extends (...args: any[]) => any>(
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
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecution = Date.now();
      }, delay - (now - lastExecution));
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
    
    if (import.meta.env.DEV) {
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
    if (typeof window !== 'undefined' && 'performance' in window && performance.timing) {
      const timing = performance.timing;
      
      const onLoad = () => {
        setTimeout(() => {
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const renderTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
          
          setPageMetrics({
            loadTime,
            renderTime,
            memoryUsage: getMemoryUsage()
          });

          if (import.meta.env.DEV) {
            console.log('📊 Page Load Performance:', {
              loadTime: `${loadTime}ms`,
              renderTime: `${renderTime}ms`,
              memoryUsage: `${(getMemoryUsage() / 1024 / 1024).toFixed(2)}MB`
            });
          }
        }, 0);
      };

      if (document.readyState === 'complete') {
        onLoad();
      } else {
        window.addEventListener('load', onLoad);
        return () => window.removeEventListener('load', onLoad);
      }
    }
  }, []);

  return pageMetrics;
}