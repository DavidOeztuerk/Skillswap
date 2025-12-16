import React from 'react';
import { Box, LinearProgress, useTheme } from '@mui/material';
import { useNavigationState } from '../../hooks/useNavigationState';

interface NavigationProgressProps {
  position?: 'top' | 'bottom';
  height?: number;
  color?: 'primary' | 'secondary';
}

/**
 * Navigation progress indicator that shows during route transitions
 */
const NavigationProgress: React.FC<NavigationProgressProps> = ({
  position = 'top',
  height = 3,
  color = 'primary',
}) => {
  const theme = useTheme();
  const { isNavigating } = useNavigationState();

  if (!isNavigating) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar + 1,
        ...(position === 'top' ? { top: 0 } : { bottom: 0 }),
      }}
    >
      <LinearProgress
        color={color}
        sx={{
          height,
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.2s ease-in-out',
          },
        }}
      />
    </Box>
  );
};

export default NavigationProgress;
