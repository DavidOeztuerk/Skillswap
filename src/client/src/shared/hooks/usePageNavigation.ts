/**
 * usePageNavigation Hook
 *
 * Provides navigation logging and tracking for debugging purposes.
 * Logs page mounts, unmounts, and data loading times in development mode.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createLogger } from '../utils/logger';

const navLogger = createLogger('Navigation');

interface PageNavigationOptions {
  /** Name of the page for logging */
  pageName: string;
  /** Enable data load tracking */
  trackDataLoad?: boolean;
}

interface PageNavigationReturn {
  /** Mark when specific data has finished loading */
  markDataLoaded: (dataName: string) => void;
  /** Get time elapsed since page mount */
  getElapsedTime: () => number;
  /** Current pathname */
  pathname: string;
}

/**
 * Hook for tracking page navigation and data loading performance
 *
 * @example
 * ```tsx
 * const { markDataLoaded } = usePageNavigation({
 *   pageName: 'DashboardPage',
 *   trackDataLoad: true
 * });
 *
 * useEffect(() => {
 *   fetchData().then(() => markDataLoaded('dashboard'));
 * }, []);
 * ```
 */
export const usePageNavigation = (options: PageNavigationOptions): PageNavigationReturn => {
  const location = useLocation();
  const mountTimeRef = useRef<number>(Date.now());
  const prevLocationRef = useRef<string>(location.pathname);
  const dataLoadTimesRef = useRef<Record<string, number>>({});

  // Log page mount
  useEffect(() => {
    const mountTime = Date.now();
    mountTimeRef.current = mountTime;
    // Capture ref value for cleanup function
    const dataLoadTimes = dataLoadTimesRef.current;

    navLogger.info(`[PAGE MOUNT] ${options.pageName}`, {
      path: location.pathname,
      search: location.search,
      timestamp: new Date().toISOString(),
    });

    return () => {
      const duration = Date.now() - mountTime;
      navLogger.debug(`[PAGE UNMOUNT] ${options.pageName}`, {
        duration: `${duration}ms`,
        dataLoads: dataLoadTimes,
      });
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log navigation changes within the same page
  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      navLogger.info(`[NAVIGATE] ${prevLocationRef.current} → ${location.pathname}`);
      prevLocationRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Mark when data has loaded
  const markDataLoaded = useCallback(
    (dataName: string) => {
      if (options.trackDataLoad) {
        const elapsed = Date.now() - mountTimeRef.current;
        dataLoadTimesRef.current[dataName] = elapsed;
        navLogger.debug(`[DATA LOADED] ${options.pageName}:${dataName}`, {
          elapsed: `${elapsed}ms`,
        });
      }
    },
    [options.pageName, options.trackDataLoad]
  );

  // Get elapsed time since mount
  const getElapsedTime = useCallback(() => Date.now() - mountTimeRef.current, []);

  return {
    markDataLoaded,
    getElapsedTime,
    pathname: location.pathname,
  };
};

export default usePageNavigation;
