import { useState } from 'react';
import LiveRegion from '../components/accessibility/LiveRegion';

/**
 * Hook for managing live region announcements
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

  const announce = (
    text: string,
    announcementLevel: 'polite' | 'assertive' = defaultLevel,
    delay = 100
  ): void => {
    // Clear any existing message first
    setMessage('');

    // Set the level
    setLevel(announcementLevel);

    // Announce after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      setMessage(text);
    }, delay);
  };

  const clear = (): void => {
    setMessage('');
  };

  return {
    message,
    level,
    announce,
    clear,
    LiveRegionComponent: () => (
      <LiveRegion message={message} level={level} id="live-region-announcements" />
    ),
  };
};
