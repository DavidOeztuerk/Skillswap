import { useCallback, useRef } from 'react';
import { withDefault } from '../utils/safeAccess';

interface AnnouncementOptions {
  priority: 'polite' | 'assertive';
  delay?: number;
  clear?: boolean;
}

/**
 * Hook for managing screen reader announcements
 * Provides a centralized way to announce dynamic content changes
 */
export const useAnnouncements = () => {
  const politeRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);

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
      politeRegion.style.clip = 'rect(0, 0, 0, 0)';
      politeRegion.style.whiteSpace = 'nowrap';
      document.body.appendChild(politeRegion);
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
      assertiveRegion.style.clip = 'rect(0, 0, 0, 0)';
      assertiveRegion.style.whiteSpace = 'nowrap';
      document.body.appendChild(assertiveRegion);
      assertiveRegionRef.current = assertiveRegion;
    }
  }, []);

  const announce = useCallback(
    (
      message: string,
      options: AnnouncementOptions = { priority: 'polite', delay: 100 }
    ) => {
      const safeMessage = message;
      if (!safeMessage.trim()) return;

      ensureLiveRegions();

      const region =
        options.priority === 'assertive'
          ? assertiveRegionRef.current
          : politeRegionRef.current;

      if (!region) return;

      // Clear existing content if requested
      if (options.clear) {
        region.textContent = '';
      }

      // Announce after delay to ensure screen readers pick it up
      const safeDelay = Math.max(0, withDefault(options.delay, 100));
      setTimeout(() => {
        region.textContent = safeMessage;

        // Auto-clear after 5 seconds
        setTimeout(() => {
          if (region.textContent === safeMessage) {
            region.textContent = '';
          }
        }, 5000);
      }, safeDelay);
    },
    [ensureLiveRegions]
  );

  const announcePolite = useCallback(
    (message: string, delay = 100) => {
      announce(message, { priority: 'polite', delay });
    },
    [announce]
  );

  const announceAssertive = useCallback(
    (message: string, delay = 100) => {
      announce(message, { priority: 'assertive', delay });
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