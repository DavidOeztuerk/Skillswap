/**
 * SkillDetailLoadingSkeleton Component
 *
 * Displays a skeleton loading state for the skill detail page.
 */

import React from 'react';
import { Box, Container, Paper, Grid } from '@mui/material';
import SkeletonLoader from '../../../../shared/components/ui/SkeletonLoader';

export const SkillDetailLoadingSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
    {/* Navigation skeleton */}
    <Box sx={{ mb: 3 }}>
      <SkeletonLoader variant="text" width={80} height={32} sx={{ mb: 2 }} />
      <SkeletonLoader variant="text" width={300} height={20} />
    </Box>

    <Grid container spacing={3}>
      {/* Main content skeleton */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <SkeletonLoader variant="text" width={80} height={24} />
                <SkeletonLoader variant="text" width={100} height={24} />
              </Box>
              <SkeletonLoader variant="text" width="70%" height={40} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SkeletonLoader variant="text" width={120} height={20} />
                <SkeletonLoader variant="text" width={150} height={20} />
                <SkeletonLoader variant="text" width={80} height={24} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <SkeletonLoader variant="text" width={40} height={40} />
              <SkeletonLoader variant="text" width={40} height={40} />
              <SkeletonLoader variant="text" width={40} height={40} />
            </Box>
          </Box>
          <SkeletonLoader variant="text" width="100%" height={60} sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <SkeletonLoader variant="text" width={120} height={36} />
            <SkeletonLoader variant="text" width={100} height={36} />
            <SkeletonLoader variant="text" width={110} height={36} />
          </Box>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <SkeletonLoader variant="text" width={150} height={24} sx={{ mb: 2 }} />
          <SkeletonLoader variant="text" width="100%" height={100} />
        </Paper>
      </Grid>

      {/* Sidebar skeleton */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <SkeletonLoader variant="text" width={80} height={24} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'grey.300' }} />
            <Box>
              <SkeletonLoader variant="text" width={120} height={20} />
              <SkeletonLoader variant="text" width={100} height={16} />
              <SkeletonLoader variant="text" width={80} height={16} />
            </Box>
          </Box>
          <SkeletonLoader variant="text" width="100%" height={36} />
        </Paper>
        <SkeletonLoader variant="profile" />
      </Grid>
    </Grid>
  </Container>
);

export default SkillDetailLoadingSkeleton;
