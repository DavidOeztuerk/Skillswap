import React, { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  RateReview as ReviewIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Rating,
  CircularProgress,
  Divider,
  Pagination,
  Button,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  selectCurrentProfileReviews,
  selectReviewsLoading,
  selectReviewsPagination,
} from '../store/profileSelectors';
import { fetchProfileReviews } from '../store/thunks/profileThunks';
import type { UserReviewResponse } from '../types';

interface ReviewCardProps {
  review: UserReviewResponse;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: de,
  });

  return (
    <Box sx={{ py: 2 }}>
      <Box display="flex" gap={2}>
        {/* Reviewer Avatar */}
        <Avatar src={review.reviewerAvatar} sx={{ width: 48, height: 48 }}>
          <PersonIcon />
        </Avatar>

        {/* Review Content */}
        <Box flex={1}>
          {/* Header: Name, Rating, Date */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={1}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {review.reviewerName}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Rating value={review.rating} readOnly size="small" />
                {review.skillName ? (
                  <Typography variant="caption" color="text.secondary">
                    {review.skillName}
                  </Typography>
                ) : null}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formattedDate}
            </Typography>
          </Box>

          {/* Review Text */}
          {review.reviewText ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, whiteSpace: 'pre-line' }}
            >
              {review.reviewText}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

interface ReviewsSectionProps {
  userId: string;
  totalReviews: number;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ userId, totalReviews }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redux selectors - replaces 4x useState!
  const reviews = useAppSelector(selectCurrentProfileReviews);
  const isLoading = useAppSelector(selectReviewsLoading);
  const pagination = useAppSelector(selectReviewsPagination);

  // Fetch reviews on mount and when page changes - ONLY if authenticated
  useEffect(() => {
    if (totalReviews > 0 && isAuthenticated) {
      void dispatch(
        fetchProfileReviews({
          userId,
          pageNumber: 1,
          pageSize: 5,
        })
      );
    }
  }, [dispatch, userId, totalReviews, isAuthenticated]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number): void => {
    void dispatch(
      fetchProfileReviews({
        userId,
        pageNumber: page,
        pageSize: 5,
      })
    );
  };

  const handleLoginClick = async (): Promise<void> => {
    // Redirect to login with return URL
    await navigate(`/login?returnUrl=/users/${userId}`);
  };

  // Don't render if no reviews
  if (totalReviews === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ReviewIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Bewertungen ({totalReviews})
        </Typography>
      </Box>

      {/* Not authenticated - show login prompt */}
      {isAuthenticated ? (
        isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : reviews.length > 0 ? (
          <>
            {reviews.map((review, index) => (
              <React.Fragment key={review.id}>
                <ReviewCard review={review as UserReviewResponse} />
                {index < reviews.length - 1 && <Divider />}
              </React.Fragment>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.pageNumber}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">Noch keine Bewertungen vorhanden</Typography>
          </Box>
        )
      ) : (
        <Box
          textAlign="center"
          py={4}
          sx={{
            backgroundColor: 'action.hover',
            borderRadius: 2,
          }}
        >
          <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Melde dich an, um Bewertungen zu sehen
          </Typography>
          <Button
            variant="contained"
            onClick={async () => {
              await handleLoginClick();
            }}
            sx={{ mt: 1 }}
          >
            Jetzt anmelden
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ReviewsSection;
