import { useRef, useEffect, useCallback, useState } from 'react';

// Performance Profiler für Render-Tracking
export interface RenderStats {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  propsChanges: number;
}

export class PerformanceProfiler {
  private renderStats = new Map<string, RenderStats>();
  private enabled = process.env.NODE_ENV === 'development';
  private listeners: ((stats: RenderStats[]) => void)[] = [];
  private updateTimer: NodeJS.Timeout | null = null;

  public trackRender(componentName: string, renderTime: number, propsChanged = false): void {
    if (!this.enabled) return;

    const existing = this.renderStats.get(componentName);
    if (existing) {
      const newCount = existing.renderCount + 1;
      const newAverage =
        (existing.averageRenderTime * existing.renderCount + renderTime) / newCount;

      this.renderStats.set(componentName, {
        ...existing,
        renderCount: newCount,
        averageRenderTime: newAverage,
        lastRenderTime: renderTime,
        propsChanges: existing.propsChanges + (propsChanged ? 1 : 0),
      });
    } else {
      this.renderStats.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        propsChanges: propsChanged ? 1 : 0,
      });
    }

    // Notify listeners with debouncing
    this.scheduleUpdate();
  }

  public getStats(): RenderStats[] {
    return [...this.renderStats.values()].sort((a, b) => b.renderCount - a.renderCount);
  }

  public getTopRenderComponents(limit = 10): RenderStats[] {
    return this.getStats().slice(0, limit);
  }

  public getUnnecessaryRenders(): RenderStats[] {
    return this.getStats().filter(
      (stat) => stat.renderCount > 10 && stat.propsChanges < stat.renderCount * 0.3
    );
  }

  public logReport(): void {
    if (!this.enabled) return;

    console.debug('🚀 Performance Report');
    console.debug('Top Components:', this.getTopRenderComponents());

    const unnecessary = this.getUnnecessaryRenders();
    if (unnecessary.length > 0) {
      console.debug('⚠️ Components with Unnecessary Renders');
      console.debug('Unnecessary:', unnecessary);
      console.debug('---');
    }

    console.debug('---');
  }

  public reset(): void {
    this.renderStats.clear();
  }

  public exportStats(): {
    timestamp: number;
    stats: RenderStats[];
    topRenders: RenderStats[];
    unnecessaryRenders: RenderStats[];
    totalComponents: number;
  } {
    return {
      timestamp: Date.now(),
      stats: this.getStats(),
      topRenders: this.getTopRenderComponents(),
      unnecessaryRenders: this.getUnnecessaryRenders(),
      totalComponents: this.renderStats.size,
    };
  }

  // Real-time listeners
  public addListener(callback: (stats: RenderStats[]) => void): void {
    this.listeners.push(callback);
    // Immediately call with current stats
    callback(this.getStats());
  }

  public removeListener(callback: (stats: RenderStats[]) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public remove(componentName: string): void {
    if (!this.enabled) return;
    const removed = this.renderStats.delete(componentName);
    if (removed && this.listeners.length > 0) {
      this.scheduleUpdate();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private scheduleUpdate(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      const currentStats = this.getStats();
      this.listeners.forEach((listener) => {
        try {
          listener(currentStats);
        } catch (error: unknown) {
          // Properly type the error before using it
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Performance profiler listener error:', errorMessage);
        }
      });
      this.updateTimer = null;
    }, 100); // Debounce updates
  }

  // Real-time stats for dashboard
  public getRealTimeStats(): {
    components: number;
    totalRenders: number;
    averageRenderTime: number;
    unnecessaryRenders: number;
  } {
    return {
      components: this.renderStats.size,
      totalRenders: [...this.renderStats.values()].reduce((sum, s) => sum + s.renderCount, 0),
      averageRenderTime:
        [...this.renderStats.values()].reduce((sum, s) => sum + s.averageRenderTime, 0) /
          this.renderStats.size || 0,
      unnecessaryRenders: this.getUnnecessaryRenders().length,
    };
  }
}

export const performanceProfiler = new PerformanceProfiler();

// React Hook für Component Tracking
export function useRenderTracker(
  componentName: string,
  props?: Record<string, unknown>
): {
  renderCount: number;
  logStats: () => void;
} {
  const renderStartTime = useRef<number>(0);
  const previousProps = useRef(props);
  const renderCount = useRef(0);
  const [displayCount, setDisplayCount] = useState(0);

  // Start timing - use lazy initialization for the ref to avoid impure call during render
  // The timing will be captured at effect mount instead
  useEffect(() => {
    // Capture render end time at effect mount
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - (renderStartTime.current || renderEndTime);
    const propsChanged = previousProps.current !== props;

    renderCount.current++;
    performanceProfiler.trackRender(componentName, renderTime, propsChanged);
    setDisplayCount(renderCount.current);

    previousProps.current = props;

    // Log every 50 renders or in development
    if (renderCount.current % 50 === 0 || process.env.NODE_ENV === 'development') {
      console.debug(
        `🔄 ${componentName}: Render #${renderCount.current.toString()} (${renderTime.toFixed(2)}ms)`
      );
    }
  }, [componentName, props]);

  const logStats = useCallback(() => {
    performanceProfiler.logReport();
  }, []);

  return {
    renderCount: displayCount,
    logStats,
  };
}

// Type for Chrome's non-standard performance.memory API
interface PerformanceMemory {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface JSBundleResource {
  name: string | undefined;
  size: number | undefined;
  loadTime: number;
}

export interface BundleSizeStats {
  totalJS: number;
  totalCSS: number;
  totalBundle: number;
  loadTime: number;
  jsResources: JSBundleResource[];
  cssResources: JSBundleResource[];
}

// Bundle Size Tracker
export class BundleSizeTracker {
  public measureBundleSize(): BundleSizeStats | null {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    if (!navigation) return null;

    const jsResources = resources.filter((r) => r.name.endsWith('.js'));
    const cssResources = resources.filter((r) => r.name.endsWith('.css'));

    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    return {
      totalJS: totalJSSize,
      totalCSS: totalCSSSize,
      totalBundle: totalJSSize + totalCSSSize,
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      jsResources: jsResources.map((r) => ({
        name: r.name.split('/').pop(),
        size: r.transferSize,
        loadTime: r.responseEnd - r.requestStart,
      })),
      cssResources: cssResources.map((r) => ({
        name: r.name.split('/').pop(),
        size: r.transferSize,
        loadTime: r.responseEnd - r.requestStart,
      })),
    };
  }

  public logBundleStats(): void {
    const stats = this.measureBundleSize();
    if (!stats) return;

    console.debug('📦 Bundle Size Analysis');
    console.debug(`Total Bundle Size: ${(stats.totalBundle / 1024).toFixed(2)} KB`);
    console.debug(`JavaScript: ${(stats.totalJS / 1024).toFixed(2)} KB`);
    console.debug(`CSS: ${(stats.totalCSS / 1024).toFixed(2)} KB`);
    console.debug(`Load Time: ${stats.loadTime.toFixed(2)}ms`);

    console.debug(
      'JS Resources:',
      stats.jsResources.sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    );
    console.debug('---');

    console.debug('---');
  }
}

// Memory Usage Tracker
export class MemoryTracker {
  private measurements: { timestamp: number; memory: PerformanceMemory }[] = [];

  public startTracking(): NodeJS.Timeout | undefined {
    const perfWithMemory = performance as PerformanceWithMemory;
    if (!perfWithMemory.memory) {
      console.warn('Memory tracking not available in this browser');
      return;
    }

    const measureMemory = (): void => {
      const { memory } = perfWithMemory;
      if (memory) {
        this.measurements.push({
          timestamp: Date.now(),
          memory,
        });
      }
    };

    measureMemory();
    return setInterval(measureMemory, 5000); // Every 5 seconds
  }

  public getMemoryStats(): {
    current: {
      used: number;
      total: number;
      limit: number;
    };
    growth: {
      used: number;
      total: number;
    };
    measurements: number;
  } | null {
    if (this.measurements.length === 0) return null;

    // eslint-disable-next-line unicorn/prefer-at
    const latestMeasurement = this.measurements[this.measurements.length - 1];
    const latest = latestMeasurement.memory;
    const initial = this.measurements[0].memory;

    return {
      current: {
        used: Math.round(((latest.usedJSHeapSize ?? 0) / 1024 / 1024) * 100) / 100,
        total: Math.round(((latest.totalJSHeapSize ?? 0) / 1024 / 1024) * 100) / 100,
        limit: Math.round(((latest.jsHeapSizeLimit ?? 0) / 1024 / 1024) * 100) / 100,
      },
      growth: {
        used:
          Math.round(
            (((latest.usedJSHeapSize ?? 0) - (initial.usedJSHeapSize ?? 0)) / 1024 / 1024) * 100
          ) / 100,
        total:
          Math.round(
            (((latest.totalJSHeapSize ?? 0) - (initial.totalJSHeapSize ?? 0)) / 1024 / 1024) * 100
          ) / 100,
      },
      measurements: this.measurements.length,
    };
  }

  public logMemoryReport(): void {
    const stats = this.getMemoryStats();
    if (!stats) {
      console.warn('No memory stats available');
      return;
    }

    console.debug('🧠 Memory Usage Report');
    console.debug(`Current Used: ${stats.current.used.toString()} MB`);
    console.debug(`Current Total: ${stats.current.total.toString()} MB`);
    console.debug(`Heap Limit: ${stats.current.limit.toString()} MB`);
    console.debug(`Memory Growth: ${stats.growth.used.toString()} MB`);
    console.debug(`Measurements: ${stats.measurements.toString()}`);
    console.debug('---');
  }
}

export const memoryTracker = new MemoryTracker();
