// src/utils/performance.ts
import React from 'react';

/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  timestamp: number;
}

export interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private componentMetrics = new Map<string, ComponentMetrics>();
  private apiMetrics = new Map<string, number[]>();

  /**
   * Measure page load performance
   */
  measurePageLoad(): PerformanceMetrics | null {
    if (!window.performance || !window.performance.timing) {
      return null;
    }

    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const renderTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      apiResponseTime: 0,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    return metrics;
  }

  /**
   * Measure component render performance
   */
  measureComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.averageRenderTime = 
        (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.componentMetrics.set(componentName, {
        name: componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
      });
    }
  }

  /**
   * Measure API response time
   */
  measureApiResponse(endpoint: string, responseTime: number): void {
    const existing = this.apiMetrics.get(endpoint) || [];
    existing.push(responseTime);
    
    // Keep only last 100 measurements per endpoint
    if (existing?.length > 100) {
      existing.shift();
    }
    
    this.apiMetrics.set(endpoint, existing);
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    pageLoad: PerformanceMetrics | null;
    components: ComponentMetrics[];
    apiPerformance: Array<{ endpoint: string; averageTime: number; requestCount: number }>;
    recommendations: string[];
  } {
    const latestPageLoad = this.metrics[this.metrics?.length - 1] || null;
    const components = Array.from(this.componentMetrics.values());
    const apiPerformance = Array.from(this.apiMetrics.entries()).map(([endpoint, times]) => ({
      endpoint,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      requestCount: times.length,
    }));

    const recommendations = this.generateRecommendations(latestPageLoad, components, apiPerformance);

    return {
      pageLoad: latestPageLoad,
      components,
      apiPerformance,
      recommendations,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    pageLoad: PerformanceMetrics | null,
    components: ComponentMetrics[],
    apiPerformance: Array<{ endpoint: string; averageTime: number; requestCount: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Page load recommendations
    if (pageLoad) {
      if (pageLoad.loadTime > 3000) {
        recommendations.push('Seitenladezeit ist hoch (>3s). Code-Splitting und Lazy Loading implementieren.');
      }
      if (pageLoad.renderTime > 1000) {
        recommendations.push('DOM-Renderzeit ist hoch (>1s). Komponenten-Performance optimieren.');
      }
      if (pageLoad.memoryUsage > 50 * 1024 * 1024) { // 50MB
        recommendations.push('Hoher Speicherverbrauch. Memory Leaks prüfen.');
      }
    }

    // Component recommendations
    const slowComponents = components.filter(c => c.averageRenderTime > 100);
    if (slowComponents?.length > 0) {
      recommendations.push(
        `Langsame Komponenten gefunden: ${slowComponents.map(c => c.name).join(', ')}. React.memo() verwenden.`
      );
    }

    // API recommendations
    const slowApis = apiPerformance.filter(api => api.averageTime > 2000);
    if (slowApis?.length > 0) {
      recommendations.push(
        `Langsame API-Endpunkte: ${slowApis.map(api => api.endpoint).join(', ')}. Caching implementieren.`
      );
    }

    return recommendations;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.componentMetrics.clear();
    this.apiMetrics.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      pageMetrics: this.metrics,
      componentMetrics: Array.from(this.componentMetrics.entries()),
      apiMetrics: Array.from(this.apiMetrics.entries()),
      timestamp: Date.now(),
    }, null, 2);
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook for measuring component render time
 */
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();

  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    performanceMonitor.measureComponentRender(componentName, renderTime);
  });
};

/**
 * HOC for measuring component performance
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const Component = (props: P) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    usePerformanceMonitor(name);
    return React.createElement(WrappedComponent, props);
  };

  Component.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;
  return Component;
};

/**
 * Utility for measuring async operations
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
    
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    
    // If it's an API call, record it
    if (label.includes('API') || label.includes('api')) {
      performanceMonitor.measureApiResponse(label, duration);
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
 * Intersection Observer utility for lazy loading
 */
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

/**
 * Image lazy loading utility
 */
export const lazyLoadImage = (
  img: HTMLImageElement,
  src: string,
  placeholder?: string
): void => {
  if (placeholder) {
    img.src = placeholder;
  }

  const observer = createIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '50px' }
  );

  observer.observe(img);
};

export default performanceMonitor;