import React from 'react';
import { Box, Skeleton, Card, CardContent, Stack } from '@mui/material';

// Default empty sx object to avoid re-renders
const DEFAULT_SX: Record<string, unknown> = {};

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'profile' | 'table' | 'text' | 'custom';
  count?: number;
  height?: number | string;
  width?: number | string;
  animation?: 'pulse' | 'wave' | false;
  sx?: Record<string, unknown>;
}

const SkeletonCard: React.FC<{ animation?: 'pulse' | 'wave' | false }> = ({
  animation = 'wave',
}) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Stack spacing={1}>
        <Skeleton variant="text" width="60%" height={24} animation={animation} />
        <Skeleton variant="text" width="100%" height={20} animation={animation} />
        <Skeleton variant="text" width="80%" height={20} animation={animation} />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="rounded" width={80} height={32} animation={animation} />
          <Skeleton variant="rounded" width={60} height={32} animation={animation} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const SkeletonListItem: React.FC<{ animation?: 'pulse' | 'wave' | false }> = ({
  animation = 'wave',
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 1 }}>
    <Skeleton variant="circular" width={40} height={40} animation={animation} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="70%" height={20} animation={animation} />
      <Skeleton variant="text" width="50%" height={16} animation={animation} />
    </Box>
    <Skeleton variant="rounded" width={60} height={24} animation={animation} />
  </Box>
);

const SkeletonProfile: React.FC<{ animation?: 'pulse' | 'wave' | false }> = ({
  animation = 'wave',
}) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={80} height={80} animation={animation} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" height={28} animation={animation} />
          <Skeleton variant="text" width="60%" height={20} animation={animation} />
          <Skeleton variant="text" width="30%" height={16} animation={animation} />
        </Box>
      </Box>

      <Stack spacing={2}>
        <Box>
          <Skeleton variant="text" width="20%" height={20} animation={animation} />
          <Skeleton variant="text" width="100%" height={16} animation={animation} />
          <Skeleton variant="text" width="80%" height={16} animation={animation} />
        </Box>

        <Box>
          <Skeleton variant="text" width="25%" height={20} animation={animation} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Skeleton variant="rounded" width={60} height={24} animation={animation} />
            <Skeleton variant="rounded" width={80} height={24} animation={animation} />
            <Skeleton variant="rounded" width={70} height={24} animation={animation} />
          </Box>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  animation?: 'pulse' | 'wave' | false;
}> = ({ rows = 5, columns = 4, animation = 'wave' }) => (
  <Box>
    {/* Table Header */}
    <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 1, borderBottom: 1, borderColor: 'divider' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          variant="text"
          width={`${100 / columns}%`}
          height={20}
          animation={animation}
        />
      ))}
    </Box>

    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      // eslint-disable-next-line react/no-array-index-key
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1, p: 1 }}>
        {Array.from({ length: columns }).map((__, colIndex) => (
          <Skeleton
            // eslint-disable-next-line react/no-array-index-key
            key={colIndex}
            variant="text"
            width={`${100 / columns}%`}
            height={16}
            animation={animation}
          />
        ))}
      </Box>
    ))}
  </Box>
);

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  count = 1,
  height = 20,
  width = '100%',
  animation = 'wave',
  sx = DEFAULT_SX,
}) => {
  const renderSkeleton = (): React.ReactNode => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <SkeletonCard key={i} animation={animation} />
        ));

      case 'list':
        return Array.from({ length: count }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <SkeletonListItem key={i} animation={animation} />
        ));

      case 'profile':
        return <SkeletonProfile animation={animation} />;

      case 'table':
        return <SkeletonTable rows={count} animation={animation} />;

      case 'custom':
        return Array.from({ length: count }).map((_, i) => (
          <Skeleton
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            variant="rectangular"
            width={width}
            height={height}
            animation={animation}
            sx={sx}
          />
        ));

      case 'text':
      default:
        return Array.from({ length: count }).map((_, i) => (
          <Skeleton
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            variant="text"
            width={width}
            height={height}
            animation={animation}
            sx={{ mb: 0.5, ...sx }}
          />
        ));
    }
  };

  return <Box sx={sx}>{renderSkeleton()}</Box>;
};

export default SkeletonLoader;
