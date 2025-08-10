import React from 'react';
import { Box, LinearProgress, Fade } from '@mui/material';
import { useLoading } from '../../contexts/LoadingContext';

interface GlobalLoadingIndicatorProps {
  position?: 'top' | 'bottom';
  showKeys?: boolean;
}

export const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({ 
  position = 'top',
  showKeys = false 
}) => {
  const { isAnyLoading, getLoadingStates } = useLoading();
  const isLoading = isAnyLoading();
  const loadingStates = getLoadingStates();

  if (!isLoading) return null;

  return (
    <Fade in={isLoading}>
      <Box
        sx={{
          position: 'fixed',
          [position]: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <LinearProgress 
          sx={{ 
            height: 3,
            '& .MuiLinearProgress-bar': {
              animationDuration: '2s',
            }
          }} 
        />
        {showKeys && process.env.NODE_ENV === 'development' && (
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
            }}
          >
            Loading: {Object.keys(loadingStates).join(', ')}
          </Box>
        )}
      </Box>
    </Fade>
  );
};

export default GlobalLoadingIndicator;