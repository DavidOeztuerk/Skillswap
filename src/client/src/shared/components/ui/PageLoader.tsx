import React, { type JSX } from 'react';
import { Box, Container, Typography } from '@mui/material';
import SkeletonLoader from './SkeletonLoader';

interface PageLoaderProps {
  variant?: 'dashboard' | 'profile' | 'list' | 'details' | 'form';
  message?: string;
  showMessage?: boolean;
}

const DashboardSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 3 }}>
    {/* Header */}
    <Box sx={{ mb: 4 }}>
      <SkeletonLoader variant="text" width="40%" height={32} />
      <SkeletonLoader variant="text" width="60%" height={20} />
    </Box>

    {/* Stats Cards */}
    <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={i} sx={{ flex: 1, minWidth: 200 }}>
          <SkeletonLoader variant="card" />
        </Box>
      ))}
    </Box>

    {/* Content Sections */}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
      <Box>
        <SkeletonLoader variant="text" width="30%" height={24} />
        <SkeletonLoader variant="card" count={3} />
      </Box>
      <Box>
        <SkeletonLoader variant="text" width="40%" height={24} />
        <SkeletonLoader variant="list" count={5} />
      </Box>
    </Box>
  </Container>
);

const ProfileSkeleton: React.FC = () => (
  <Container maxWidth="md" sx={{ py: 3 }}>
    <SkeletonLoader variant="profile" />
    <Box sx={{ mt: 3 }}>
      <SkeletonLoader variant="text" width="25%" height={24} />
      <SkeletonLoader variant="card" count={2} />
    </Box>
  </Container>
);

const ListSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 3 }}>
    {/* Search/Filter Bar */}
    <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
      <SkeletonLoader variant="text" width={200} height={40} />
      <SkeletonLoader variant="text" width={120} height={40} />
      <SkeletonLoader variant="text" width={100} height={40} />
    </Box>

    {/* List Items */}
    <SkeletonLoader variant="card" count={6} />

    {/* Pagination */}
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <SkeletonLoader variant="text" width={200} height={32} />
    </Box>
  </Container>
);

const DetailsSkeleton: React.FC = () => (
  <Container maxWidth="md" sx={{ py: 3 }}>
    {/* Header */}
    <Box sx={{ mb: 3 }}>
      <SkeletonLoader variant="text" width="70%" height={36} />
      <SkeletonLoader variant="text" width="50%" height={20} />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <SkeletonLoader variant="text" width={80} height={24} />
        <SkeletonLoader variant="text" width={60} height={24} />
        <SkeletonLoader variant="text" width={90} height={24} />
      </Box>
    </Box>

    {/* Main Content */}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
      <Box>
        <SkeletonLoader variant="text" width="100%" height={16} count={8} />
      </Box>
      <Box>
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="list" count={3} />
      </Box>
    </Box>
  </Container>
);

const FormSkeleton: React.FC = () => (
  <Container maxWidth="sm" sx={{ py: 3 }}>
    <Box sx={{ mb: 3 }}>
      <SkeletonLoader variant="text" width="60%" height={32} />
      <SkeletonLoader variant="text" width="80%" height={20} />
    </Box>

    {/* Form Fields */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={i}>
          <SkeletonLoader variant="text" width="30%" height={16} />
          <SkeletonLoader variant="text" width="100%" height={56} />
        </Box>
      ))}

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <SkeletonLoader variant="text" width={100} height={36} />
        <SkeletonLoader variant="text" width={80} height={36} />
      </Box>
    </Box>
  </Container>
);

const PageLoader: React.FC<PageLoaderProps> = ({
  variant = 'dashboard',
  message = 'Lade Inhalte...',
  showMessage = true,
}) => {
  const renderSkeleton = (): JSX.Element => {
    switch (variant) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'details':
        return <DetailsSkeleton />;
      case 'form':
        return <FormSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  };

  return (
    <Box>
      {showMessage ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>
      ) : null}
      {renderSkeleton()}
    </Box>
  );
};

export default PageLoader;
