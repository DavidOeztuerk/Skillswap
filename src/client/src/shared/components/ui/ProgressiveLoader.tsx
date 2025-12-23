import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import SkeletonLoader from './SkeletonLoader';

interface ProgressiveLoaderProps {
  isLoading: boolean;
  hasError?: boolean;
  isEmpty?: boolean;
  loadingText?: string;
  emptyText?: string;
  errorText?: string;
  children: React.ReactNode;
  skeletonVariant?: 'card' | 'list' | 'profile' | 'table' | 'text';
  skeletonCount?: number;
  showProgress?: boolean;
  delay?: number;
}

const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  isLoading,
  hasError = false,
  isEmpty = false,
  loadingText,
  emptyText = 'Keine Daten verfügbar',
  errorText = 'Fehler beim Laden der Daten',
  children,
  skeletonVariant = 'card',
  skeletonCount = 3,
  showProgress = false,
  delay = 0,
}) => {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading && delay > 0) {
      timeoutId = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowSkeleton(true);
      }, 0);
    } else {
      timeoutId = setTimeout(() => {
        setShowSkeleton(false);
      }, 0);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, delay]);

  if (isLoading && showSkeleton) {
    return (
      <Box>
        {showProgress ? (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            {loadingText ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, textAlign: 'center' }}
              >
                {loadingText}
              </Typography>
            ) : null}
          </Box>
        ) : null}
        <SkeletonLoader variant={skeletonVariant} count={skeletonCount} />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="error">
          {errorText}
        </Typography>
      </Box>
    );
  }

  if (isEmpty) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyText}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProgressiveLoader;
