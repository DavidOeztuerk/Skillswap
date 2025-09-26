// Performance Profiler für Render-Tracking
interface RenderStats {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  propsChanges: number;
}

class PerformanceProfiler {
  private renderStats = new Map<string, RenderStats>();
  private enabled = process.env.NODE_ENV === 'development';
  private listeners: Array<(stats: RenderStats[]) => void> = [];
  private updateTimer: NodeJS.Timeout | null = null;

  trackRender(componentName: string, renderTime: number, propsChanged: boolean = false) {
    if (!this.enabled) return;

    const existing = this.renderStats.get(componentName);
    if (existing) {
      const newCount = existing.renderCount + 1;
      const newAverage = (existing.averageRenderTime * existing.renderCount + renderTime) / newCount;
      
      this.renderStats.set(componentName, {
        ...existing,
        renderCount: newCount,
        averageRenderTime: newAverage,
        lastRenderTime: renderTime,
        propsChanges: existing.propsChanges + (propsChanged ? 1 : 0)
      });
    } else {
      this.renderStats.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        propsChanges: propsChanged ? 1 : 0
      });
    }
    
    // Notify listeners with debouncing
    this.scheduleUpdate();
  }

  getStats(): RenderStats[] {
    return Array.from(this.renderStats.values())
      .sort((a, b) => b.renderCount - a.renderCount);
  }

  getTopRenderComponents(limit = 10): RenderStats[] {
    return this.getStats().slice(0, limit);
  }

  getUnnecessaryRenders(): RenderStats[] {
    return this.getStats().filter(stat => 
      stat.renderCount > 10 && stat.propsChanges < stat.renderCount * 0.3
    );
  }

  logReport() {
    if (!this.enabled) return;

    console.group('🚀 Performance Report');
    console.table(this.getTopRenderComponents());
    
    const unnecessary = this.getUnnecessaryRenders();
    if (unnecessary.length > 0) {
      console.group('⚠️ Components with Unnecessary Renders');
      console.table(unnecessary);
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  reset() {
    this.renderStats.clear();
  }

  exportStats() {
    return {
      timestamp: Date.now(),
      stats: this.getStats(),
      topRenders: this.getTopRenderComponents(),
      unnecessaryRenders: this.getUnnecessaryRenders(),
      totalComponents: this.renderStats.size
    };
  }
  
  // Real-time listeners
  addListener(callback: (stats: RenderStats[]) => void) {
    this.listeners.push(callback);
    // Immediately call with current stats
    callback(this.getStats());
  }

  removeListener(callback: (stats: RenderStats[]) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  remove(componentName: string): void {
    if (!this.enabled) return;
    const removed = this.renderStats.delete(componentName);
    if (removed && this.listeners.length > 0) {
      this.scheduleUpdate();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private scheduleUpdate() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    this.updateTimer = setTimeout(() => {
      const currentStats = this.getStats();
      this.listeners.forEach(listener => {
        try {
          listener(currentStats);
        } catch (error) {
          console.error('Performance profiler listener error:', error);
        }
      });
      this.updateTimer = null;
    }, 100); // Debounce updates
  }
  
  // Real-time stats for dashboard
  getRealTimeStats() {
    return {
      components: this.renderStats.size,
      totalRenders: Array.from(this.renderStats.values()).reduce((sum, s) => sum + s.renderCount, 0),
      averageRenderTime: Array.from(this.renderStats.values()).reduce((sum, s) => sum + s.averageRenderTime, 0) / this.renderStats.size || 0,
      unnecessaryRenders: this.getUnnecessaryRenders().length
    };
  }
}

export const performanceProfiler = new PerformanceProfiler();

// React Hook für Component Tracking
import { useRef, useEffect } from 'react';

export function useRenderTracker(componentName: string, props?: Record<string, unknown>) {
  const renderStartTime = useRef<number>(0);
  const previousProps = useRef(props);
  const renderCount = useRef(0);

  // Start timing
  renderStartTime.current = performance.now();

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    const propsChanged = previousProps.current !== props;
    
    renderCount.current++;
    performanceProfiler.trackRender(componentName, renderTime, propsChanged);
    
    previousProps.current = props;
    
    // Log every 50 renders or in development
    if (renderCount.current % 50 === 0 || process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName}: Render #${renderCount.current} (${renderTime.toFixed(2)}ms)`);
    }
  });

  return {
    renderCount: renderCount.current,
    logStats: () => performanceProfiler.logReport()
  };
}

// Bundle Size Tracker
export class BundleSizeTracker {
  static measureBundleSize() {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    
    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    return {
      totalJS: totalJSSize,
      totalCSS: totalCSSSize,
      totalBundle: totalJSSize + totalCSSSize,
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      jsResources: jsResources.map(r => ({
        name: r.name.split('/').pop(),
        size: r.transferSize,
        loadTime: r.responseEnd - r.requestStart
      })),
      cssResources: cssResources.map(r => ({
        name: r.name.split('/').pop(),
        size: r.transferSize,
        loadTime: r.responseEnd - r.requestStart
      }))
    };
  }

  static logBundleStats() {
    const stats = this.measureBundleSize();
    if (!stats) return;

    console.group('📦 Bundle Size Analysis');
    console.log(`Total Bundle Size: ${(stats.totalBundle / 1024).toFixed(2)} KB`);
    console.log(`JavaScript: ${(stats.totalJS / 1024).toFixed(2)} KB`);
    console.log(`CSS: ${(stats.totalCSS / 1024).toFixed(2)} KB`);
    console.log(`Load Time: ${stats.loadTime.toFixed(2)}ms`);
    
    console.group('JS Resources');
    console.table(stats.jsResources.sort((a, b) => (b.size || 0) - (a.size || 0)));
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Memory Usage Tracker
export class MemoryTracker {
  private measurements: Array<{timestamp: number, memory: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } }> = [];

  startTracking() {
    if (!('memory' in performance)) {
      console.warn('Memory tracking not available in this browser');
      return;
    }

    const measureMemory = () => {
      this.measurements.push({
        timestamp: Date.now(),
        memory: (performance as any).memory
      });
    };

    measureMemory();
    return setInterval(measureMemory, 5000); // Every 5 seconds
  }

  getMemoryStats() {
    if (this.measurements.length === 0) return null;

    const latest = this.measurements[this.measurements.length - 1].memory;
    const initial = this.measurements[0].memory;

    return {
      current: {
        used: Math.round(latest.usedJSHeapSize || 0 / 1024 / 1024 * 100) / 100,
        total: Math.round(latest.totalJSHeapSize || 0 / 1024 / 1024 * 100) / 100,
        limit: Math.round(latest.jsHeapSizeLimit || 0 / 1024 / 1024 * 100) / 100
      },
      growth: {
        used: Math.round((latest.usedJSHeapSize || 0 - (initial.usedJSHeapSize || 0)) / 1024 / 1024 * 100) / 100,
        total: Math.round((latest.totalJSHeapSize || 0 - (initial.totalJSHeapSize || 0)) / 1024 / 1024 * 100) / 100
      },
      measurements: this.measurements.length
    };
  }

  logMemoryReport() {
    const stats = this.getMemoryStats();
    if (!stats) {
      console.warn('No memory stats available');
      return;
    }

    console.group('🧠 Memory Usage Report');
    console.log(`Current Used: ${stats.current.used} MB`);
    console.log(`Current Total: ${stats.current.total} MB`);
    console.log(`Heap Limit: ${stats.current.limit} MB`);
    console.log(`Memory Growth: ${stats.growth.used} MB`);
    console.log(`Measurements: ${stats.measurements}`);
    console.groupEnd();
  }
}

export const memoryTracker = new MemoryTracker();
