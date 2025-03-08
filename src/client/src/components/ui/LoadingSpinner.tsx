// src/components/ui/LoadingSpinner.tsx
import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  SxProps,
  Theme,
} from '@mui/material';

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
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  thickness = 4,
  message,
  fullPage = false,
  overlay = false,
  sx = {},
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        ...sx,
      }}
    >
      <CircularProgress size={size} thickness={thickness} color="primary" />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
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
};

export default LoadingSpinner;
