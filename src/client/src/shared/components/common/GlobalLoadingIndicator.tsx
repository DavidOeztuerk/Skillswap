import React, { memo } from 'react';
import { Box, LinearProgress, Fade } from '@mui/material';
import { useLoading } from '../../../core/contexts/loadingContextHooks';

interface GlobalLoadingIndicatorProps {
  position?: 'top' | 'bottom';
  showKeys?: boolean;
}

export const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = memo(
  ({ position = 'top', showKeys = false }) => {
    const { isAnyLoading, getLoadingStates } = useLoading();
    const isLoading: boolean = isAnyLoading();

    if (!isLoading) return null;

    const loadingStates: Record<string, boolean> = getLoadingStates();
    const loadingKeys: string[] = Object.keys(loadingStates);

    return (
      <Fade in={isLoading} timeout={200}>
        <Box
          sx={{
            position: 'fixed',
            [position]: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          aria-label="Loading indicator"
          aria-live="polite"
        >
          <LinearProgress
            sx={{
              height: 3,
              '& .MuiLinearProgress-bar': {
                animationDuration: '2s',
              },
            }}
          />

          {/* Debug: Show loading keys in development */}
          {showKeys && import.meta.env.DEV && loadingKeys.length > 0 ? (
            <Box
              sx={{
                position: 'absolute',
                top: position === 'top' ? 8 : undefined,
                bottom: position === 'bottom' ? 8 : undefined,
                right: 16,
                bgcolor: 'background.paper',
                px: 2,
                py: 1,
                borderRadius: 1,
                boxShadow: 1,
                fontSize: 12,
                fontFamily: 'monospace',
                pointerEvents: 'auto',
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Loading: {loadingKeys.join(', ')}
            </Box>
          ) : null}
        </Box>
      </Fade>
    );
  }
);

GlobalLoadingIndicator.displayName = 'GlobalLoadingIndicator';

export default GlobalLoadingIndicator;
