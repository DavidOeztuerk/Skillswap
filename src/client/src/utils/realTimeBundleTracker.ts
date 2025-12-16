export type ResourceType = 'javascript' | 'stylesheet' | 'font' | 'image' | 'json' | 'other';
export type ResourceCategory = 'vendor' | 'mui' | 'main' | 'webrtc' | 'react' | 'chunk' | 'other';

export interface TrackedResource {
  name: string;
  fullUrl: string;
  type: ResourceType;
  size: number;
  loadTime: number;
  startTime: number;
  category: ResourceCategory;
  cached: boolean;
}

interface ByAgg {
  count: number;
  size: number;
}

export interface BundleSummary {
  totalSize: number;
  totalResources: number;
  byType: Record<string, ByAgg>;
  byCategory: Record<string, ByAgg>;
  slowestResources: TrackedResource[];
  largestResources: TrackedResource[];
  cachedResources: number;
  averageLoadTime: number;
}

export interface BundleStats {
  resources: TrackedResource[];
  summary: BundleSummary;
}

export interface BundleRecommendation {
  type: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

// Real-time Bundle & Resource Tracker
export class RealTimeBundleTracker {
  private resourceStats = new Map<string, TrackedResource>();
  private listeners: ((stats: BundleStats) => void)[] = [];
  private observer: PerformanceObserver | null = null;
  private initialized = false;

  public init(): void {
    if (
      this.initialized ||
      typeof window === 'undefined' ||
      typeof PerformanceObserver === 'undefined'
    ) {
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.trackResource(entry as PerformanceResourceTiming);
        }
      }
    });

    this.observer.observe({ entryTypes: ['resource'] });
    this.scanExistingResources();
    this.initialized = true;
  }

  private scanExistingResources(): void {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    entries.forEach((entry) => {
      this.trackResource(entry);
    });
  }

  private trackResource(entry: PerformanceResourceTiming): void {
    const { filename, fullUrl } = this.extractNames(entry.name);
    const type = this.getResourceType(filename);
    if (type === 'other') return;

    const info: TrackedResource = {
      name: filename,
      fullUrl,
      type,
      size: entry.transferSize || entry.encodedBodySize || 0,
      loadTime: entry.responseEnd - entry.requestStart,
      startTime: entry.startTime,
      category: this.categorizeResource(filename),
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
    };

    // key by fullUrl to avoid collisions on same filename
    this.resourceStats.set(fullUrl, info);
    this.notifyListeners();
  }

  private extractNames(name: string): { filename: string; fullUrl: string } {
    try {
      const u = new URL(name, window.location.href);
      const filename = u.pathname.split('/').pop() ?? name;
      return { filename, fullUrl: u.toString() };
    } catch {
      const filename = name.split('?')[0].split('#')[0].split('/').pop() ?? name;
      return { filename, fullUrl: name };
    }
  }

  private getResourceType(filename: string): ResourceType {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'mjs':
        return 'javascript';
      case 'css':
        return 'stylesheet';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'svg':
      case 'webp':
        return 'image';
      case 'json':
        return 'json';
      default:
        if (filename.includes('chunk') || filename.includes('vendor')) return 'javascript';
        return 'other';
    }
  }

  private categorizeResource(filename: string): ResourceCategory {
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('mui')) return 'mui';
    if (filename.includes('index')) return 'main';
    if (filename.includes('webrtc')) return 'webrtc';
    if (filename.includes('react')) return 'react';
    if (filename.includes('chunk')) return 'chunk';
    return 'other';
  }

  public getCurrentStats(): BundleStats {
    const stats = Array.from(this.resourceStats.values());

    const summary: BundleSummary = {
      totalSize: stats.reduce((sum, s) => sum + s.size, 0),
      totalResources: stats.length,
      byType: {},
      byCategory: {},
      slowestResources: stats
        .filter((s) => s.loadTime > 0)
        .sort((a, b) => b.loadTime - a.loadTime)
        .slice(0, 5),
      largestResources: [...stats].sort((a, b) => b.size - a.size).slice(0, 5),
      cachedResources: stats.filter((s) => s.cached).length,
      averageLoadTime:
        stats.length > 0 ? stats.reduce((sum, s) => sum + s.loadTime, 0) / stats.length : 0,
    };

    // Group by type
    stats.forEach((r) => {
      summary.byType[r.type] ??= { count: 0, size: 0 };
      summary.byType[r.type].count++;
      summary.byType[r.type].size += r.size;
    });

    // Group by category
    stats.forEach((r) => {
      summary.byCategory[r.category] ??= { count: 0, size: 0 };
      summary.byCategory[r.category].count++;
      summary.byCategory[r.category].size += r.size;
    });

    return { resources: stats, summary };
  }

  public addListener(callback: (stats: BundleStats) => void): void {
    this.listeners.push(callback);
    callback(this.getCurrentStats());
  }

  public removeListener(callback: (stats: BundleStats) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) this.listeners.splice(index, 1);
  }

  private notifyListeners(): void {
    const current = this.getCurrentStats();
    this.listeners.forEach((fn) => {
      try {
        fn(current);
      } catch (e) {
        console.error('Bundle tracker listener error:', e);
      }
    });
  }

  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.listeners = [];
    this.resourceStats.clear();
    this.initialized = false;
  }

  public getRecommendations(): BundleRecommendation[] {
    const stats = this.getCurrentStats();
    const recs: BundleRecommendation[] = [];

    const mainResources = stats.resources.filter((r) => r.category === 'main');
    const mainSize = mainResources.reduce((sum, r) => sum + r.size, 0);
    if (mainSize > 500 * 1024) {
      recs.push({
        type: 'warning',
        category: 'main-bundle',
        message: `Main bundle is ${(mainSize / 1024).toFixed(0)}KB. Consider code splitting.`,
        impact: 'high',
      });
    }

    const slowResources = stats.resources.filter((r) => r.loadTime > 1000);
    if (slowResources.length > 0) {
      recs.push({
        type: 'error',
        category: 'slow-loading',
        message: `${slowResources.length.toString()} resources loading slower than 1s.`,
        impact: 'high',
      });
    }

    const uncached = stats.resources.filter((r) => !r.cached && r.size > 10 * 1024);
    if (uncached.length > 5) {
      recs.push({
        type: 'info',
        category: 'caching',
        message: `${uncached.length.toString()} large resources not cached.`,
        impact: 'medium',
      });
    }

    if (stats.summary.totalSize > 2 * 1024 * 1024) {
      recs.push({
        type: 'warning',
        category: 'total-size',
        message: `Total bundle size is ${(stats.summary.totalSize / 1024 / 1024).toFixed(1)}MB.`,
        impact: 'high',
      });
    }

    return recs;
  }
}

export const realTimeBundleTracker = new RealTimeBundleTracker();
