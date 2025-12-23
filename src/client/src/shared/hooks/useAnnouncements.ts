import { useCallback, useRef, useEffect } from 'react';
import { withDefault } from '../utils/safeAccess';

interface AnnouncementOptions {
  priority: 'polite' | 'assertive';
  delay?: number;
  clear?: boolean;
}

// Default options
const DEFAULT_OPTIONS: AnnouncementOptions = { priority: 'polite', delay: 100 };

/**
 * Hook for managing screen reader announcements
 * Provides a centralized way to announce dynamic content changes
 */
export const useAnnouncements = (): {
  announce: (message: string, options?: AnnouncementOptions) => void;
  announcePolite: (message: string, delay?: number) => void;
  announceAssertive: (message: string, delay?: number) => void;
  announceFormError: (fieldName: string, errorMessage: string) => void;
  announceSuccess: (message: string) => void;
  announceNavigation: (pageName: string) => void;
  announceLoading: (action: string) => void;
  announceLoadingComplete: (action: string) => void;
  clear: () => void;
} => {
  const politeRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Initialize live regions if they don't exist
  const ensureLiveRegions = useCallback(() => {
    if (!politeRegionRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.setAttribute('id', 'polite-announcements');
      politeRegion.style.position = 'absolute';
      politeRegion.style.left = '-10000px';
      politeRegion.style.width = '1px';
      politeRegion.style.height = '1px';
      politeRegion.style.overflow = 'hidden';
      politeRegion.style.clipPath = 'inset(50%)';
      politeRegion.style.whiteSpace = 'nowrap';
      document.body.append(politeRegion);
      politeRegionRef.current = politeRegion;
    }

    if (!assertiveRegionRef.current) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.setAttribute('id', 'assertive-announcements');
      assertiveRegion.style.position = 'absolute';
      assertiveRegion.style.left = '-10000px';
      assertiveRegion.style.width = '1px';
      assertiveRegion.style.height = '1px';
      assertiveRegion.style.overflow = 'hidden';
      assertiveRegion.style.clipPath = 'inset(50%)';
      assertiveRegion.style.whiteSpace = 'nowrap';
      document.body.append(assertiveRegion);
      assertiveRegionRef.current = assertiveRegion;
    }
  }, []);

  const announce = useCallback(
    (message: string, options?: AnnouncementOptions) => {
      const opts = options ?? DEFAULT_OPTIONS;
      const safeMessage = message;
      if (!safeMessage.trim()) return;

      ensureLiveRegions();

      const region =
        opts.priority === 'assertive' ? assertiveRegionRef.current : politeRegionRef.current;

      if (!region) return;

      // Clear existing content if requested
      if (opts.clear) {
        region.textContent = '';
      }

      // Announce after delay to ensure screen readers pick it up
      const safeDelay = Math.max(0, withDefault(opts.delay, 100));
      (() => {
        const __id = setTimeout(() => {
          region.textContent = safeMessage;

          // Auto-clear after 5 seconds
          const __id2 = setTimeout(() => {
            if (region.textContent === safeMessage) {
              region.textContent = '';
            }
          }, 5000);
          timersRef.current.push(__id2);
        }, safeDelay);
        timersRef.current.push(__id);
      })();
    },
    [ensureLiveRegions]
  );

  useEffect(
    () => () => {
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current = [];
    },
    []
  );

  const announcePolite = useCallback(
    (message: string, delay?: number) => {
      announce(message, { priority: 'polite', delay: delay ?? 100 });
    },
    [announce]
  );

  const announceAssertive = useCallback(
    (message: string, delay?: number) => {
      announce(message, { priority: 'assertive', delay: delay ?? 100 });
    },
    [announce]
  );

  const announceFormError = useCallback(
    (fieldName: string, errorMessage: string) => {
      const safeFieldName = fieldName;
      const safeErrorMessage = errorMessage;
      announceAssertive(`Error in ${safeFieldName}: ${safeErrorMessage}`);
    },
    [announceAssertive]
  );

  const announceSuccess = useCallback(
    (message: string) => {
      announcePolite(`Success: ${message}`);
    },
    [announcePolite]
  );

  const announceNavigation = useCallback(
    (pageName: string) => {
      announcePolite(`Navigated to ${pageName} page`);
    },
    [announcePolite]
  );

  const announceLoading = useCallback(
    (action: string) => {
      announcePolite(`Loading ${action}, please wait`);
    },
    [announcePolite]
  );

  const announceLoadingComplete = useCallback(
    (action: string) => {
      announcePolite(`${action} loaded successfully`);
    },
    [announcePolite]
  );

  const clear = useCallback(() => {
    if (politeRegionRef.current) {
      politeRegionRef.current.textContent = '';
    }
    if (assertiveRegionRef.current) {
      assertiveRegionRef.current.textContent = '';
    }
  }, []);

  return {
    announce,
    announcePolite,
    announceAssertive,
    announceFormError,
    announceSuccess,
    announceNavigation,
    announceLoading,
    announceLoadingComplete,
    clear,
  };
};

export default useAnnouncements;
