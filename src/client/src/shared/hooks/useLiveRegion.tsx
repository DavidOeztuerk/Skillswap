import { useState, useCallback, useRef, useEffect } from 'react';
import LiveRegion from '../components/accessibility/LiveRegion';

/**
 * Hook for managing live region announcements
 *
 * @description Provides screen reader announcements with proper cleanup
 * to prevent memory leaks from orphaned timeouts.
 */
export const useLiveRegion = (
  defaultLevel: 'polite' | 'assertive' = 'polite'
): {
  message: string;
  level: 'polite' | 'assertive';
  announce: (text: string, announcementLevel?: 'polite' | 'assertive', delay?: number) => void;
  clear: () => void;
  LiveRegionComponent: () => React.ReactElement;
} => {
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState(defaultLevel);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const announce = useCallback(
    (text: string, announcementLevel: 'polite' | 'assertive' = 'polite', delay = 100): void => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Clear any existing message first
      setMessage('');

      // Set the level
      setLevel(announcementLevel);

      timeoutRef.current = setTimeout(() => {
        setMessage(text);
        timeoutRef.current = null;
      }, delay);
    },
    []
  );

  const clear = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMessage('');
  }, []);

  const LiveRegionComponent = useCallback(
    () => <LiveRegion message={message} level={level} id="live-region-announcements" />,
    [message, level]
  );

  return {
    message,
    level,
    announce,
    clear,
    LiveRegionComponent,
  };
};

export default useLiveRegion;
