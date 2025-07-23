// src/components/accessibility/LiveRegion.tsx
import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface LiveRegionProps {
  message: string;
  level?: 'polite' | 'assertive' | 'off';
  clearAfter?: number;
  id?: string;
  atomic?: boolean;
}

/**
 * Live region component for announcing dynamic content changes to screen readers
 */
const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  level = 'polite',
  clearAfter = 5000,
  id,
  atomic = true,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (clearAfter > 0 && message) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to clear message
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by parent component state update
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  if (!message) return null;

  return (
    <Box
      id={id}
      aria-live={level}
      aria-atomic={atomic}
      sx={{
        position: 'absolute',
        left: -10000,
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </Box>
  );
};

/**
 * Hook for managing live region announcements
 */
export const useLiveRegion = (defaultLevel: 'polite' | 'assertive' = 'polite') => {
  const [message, setMessage] = React.useState('');
  const [level, setLevel] = React.useState(defaultLevel);

  const announce = (
    text: string, 
    announcementLevel: 'polite' | 'assertive' = defaultLevel,
    delay = 100
  ) => {
    // Clear any existing message first
    setMessage('');
    
    // Set the level
    setLevel(announcementLevel);
    
    // Announce after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      setMessage(text);
    }, delay);
  };

  const clear = () => {
    setMessage('');
  };

  return {
    message,
    level,
    announce,
    clear,
    LiveRegionComponent: () => (
      <LiveRegion 
        message={message} 
        level={level} 
        id="live-region-announcements"
      />
    ),
  };
};

export default LiveRegion;