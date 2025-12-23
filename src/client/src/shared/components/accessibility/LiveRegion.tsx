import React, { useEffect, useRef, memo } from 'react';
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
const LiveRegion: React.FC<LiveRegionProps> = memo(
  ({ message, level = 'polite', clearAfter = 5000, id, atomic = true }) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (clearAfter > 0 && message.length > 0) {
        // Clear any existing timeout
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout to clear message
        timeoutRef.current = setTimeout(() => {
          // Message will be cleared by parent component state update
        }, clearAfter);
      }

      return () => {
        if (timeoutRef.current !== null) {
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
  }
);

LiveRegion.displayName = 'LiveRegion';

export default LiveRegion;
