import React, { memo, useMemo } from 'react';
import { Box, CircularProgress, Typography, type SxProps, type Theme } from '@mui/material';
import { spacing } from '../../styles/tokens';

interface LoadingSpinnerProps {
  size?: number;
  thickness?: number;
  message?: string;
  fullPage?: boolean;
  overlay?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Ladeanzeige mit optionalem Text und verschiedenen Anzeigemodi
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(
  ({ size = 40, thickness = 4, message, fullPage = false, overlay = false, sx = {} }) => {
    const content = useMemo(
      () => (
        <Box
          sx={[
            {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: spacing[3] / 8,
            },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <CircularProgress size={size} thickness={thickness} color="primary" />
          {message !== undefined && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: spacing[2] / 8 }}>
              {message}
            </Typography>
          )}
        </Box>
      ),
      [size, thickness, message, sx]
    );

    if (fullPage) {
      return (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: overlay ? 9999 : 'auto',
            bgcolor: overlay ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
          }}
        >
          {content}
        </Box>
      );
    }

    if (overlay) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          {content}
        </Box>
      );
    }

    return content;
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
