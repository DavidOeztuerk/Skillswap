import React, { useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import {
  Person as PersonIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  ThumbUp as ThumbUpIcon,
} from '@mui/icons-material';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Rating,
  CircularProgress,
  Alert,
  Pagination,
  LinearProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  useTheme,
  alpha,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useNavigation } from '../../../shared/hooks/useNavigation';
import { useProfileReviews } from '../hooks/useProfileReviews';
import type { UserReviewResponse, UserReviewStatsResponse } from '../types';

// ============================================================================
// RATING HISTOGRAM COMPONENT
// ============================================================================

interface RatingHistogramProps {
  stats: UserReviewStatsResponse;
  selectedFilter: number | null;
  onFilterClick: (stars: number | null) => void;
}

const RatingHistogram: React.FC<RatingHistogramProps> = ({
  stats,
  selectedFilter,
  onFilterClick,
}) => {
  const theme = useTheme();

  const maxCount = useMemo(
    () => Math.max(...Object.values(stats.ratingDistribution), 1),
    [stats.ratingDistribution]
  );

  const starRows = [5, 4, 3, 2, 1];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Overall Rating Header */}
      <Box display="flex" alignItems="center" gap={3} mb={3}>
        <Box textAlign="center">
          <Typography variant="h2" fontWeight="bold" color="primary">
            {stats.averageRating.toFixed(1)}
          </Typography>
          <Rating value={stats.averageRating} readOnly precision={0.1} size="small" />
          <Typography variant="body2" color="text.secondary">
            {stats.totalReviews} {stats.totalReviews === 1 ? 'Bewertung' : 'Bewertungen'}
          </Typography>
        </Box>

        {/* Histogram Bars */}
        <Box flex={1}>
          {starRows.map((stars) => {
            const count = stats.ratingDistribution[stars] ?? 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            const isSelected = selectedFilter === stars;

            return (
              <Box
                key={stars}
                onClick={() => onFilterClick(isSelected ? null : stars)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  px: 1,
                  mx: -1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Typography variant="body2" sx={{ minWidth: 60 }}>
                  {stars} {stars === 1 ? 'Stern' : 'Sterne'}
                </Typography>
                <Box sx={{ flex: 1, height: 16, position: 'relative' }}>
                  <LinearProgress
                    variant="determinate"
                    value={(count / maxCount) * 100}
                    sx={{
                      height: '100%',
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: isSelected ? 'primary.main' : 'warning.main',
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 50, textAlign: 'right' }}
                >
                  {count} ({percentage.toFixed(0)}%)
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Section Averages */}
      {stats.averageKnowledge !== undefined ||
      stats.averageTeaching !== undefined ||
      stats.averageCommunication !== undefined ||
      stats.averageReliability !== undefined ? (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Bewertung nach Kategorien
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {stats.averageKnowledge === undefined ? null : (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body2">Wissen:</Typography>
                <Rating value={stats.averageKnowledge} readOnly precision={0.1} size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({stats.averageKnowledge.toFixed(1)})
                </Typography>
              </Box>
            )}
            {stats.averageTeaching === undefined ? null : (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body2">Unterricht:</Typography>
                <Rating value={stats.averageTeaching} readOnly precision={0.1} size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({stats.averageTeaching.toFixed(1)})
                </Typography>
              </Box>
            )}
            {stats.averageCommunication === undefined ? null : (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body2">Kommunikation:</Typography>
                <Rating value={stats.averageCommunication} readOnly precision={0.1} size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({stats.averageCommunication.toFixed(1)})
                </Typography>
              </Box>
            )}
            {stats.averageReliability === undefined ? null : (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="body2">Zuverl.:</Typography>
                <Rating value={stats.averageReliability} readOnly precision={0.1} size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({stats.averageReliability.toFixed(1)})
                </Typography>
              </Box>
            )}
          </Box>
        </>
      ) : null}

      {/* Clear Filter Button */}
      {selectedFilter !== null && (
        <Box mt={2}>
          <Chip
            label={`Filter: ${selectedFilter} Sterne`}
            onDelete={() => onFilterClick(null)}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Paper>
  );
};

// ============================================================================
// REVIEW CARD COMPONENT
// ============================================================================

interface ReviewCardProps {
  review: UserReviewResponse;
}

const SECTION_LABELS = {
  knowledge: 'Wissen & Fachkompetenz',
  teaching: 'Unterrichtsqualität',
  communication: 'Kommunikation',
  reliability: 'Zuverlässigkeit',
};

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: de,
  });

  const hasSectionRatings =
    review.knowledgeRating !== undefined ||
    review.teachingRating !== undefined ||
    review.communicationRating !== undefined ||
    review.reliabilityRating !== undefined;

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box display="flex" gap={2}>
        {/* Reviewer Avatar */}
        <Avatar src={review.reviewerAvatar} sx={{ width: 56, height: 56 }}>
          <PersonIcon />
        </Avatar>

        {/* Review Content */}
        <Box flex={1}>
          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={1}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {review.reviewerName}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="body2" fontWeight="medium">
                  {review.rating.toFixed(1)}
                </Typography>
                {review.skillName ? (
                  <Chip label={review.skillName} size="small" variant="outlined" />
                ) : null}
                {review.wouldRecommend ? (
                  <Chip
                    icon={<ThumbUpIcon sx={{ fontSize: 14 }} />}
                    label="Empfohlen"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ) : null}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formattedDate}
            </Typography>
          </Box>

          {/* Main Review Text */}
          {review.reviewText ? (
            <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
              {review.reviewText}
            </Typography>
          ) : null}

          {/* Section Ratings (Expandable) */}
          {hasSectionRatings ? (
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                mt: 2,
                '&:before': { display: 'none' },
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2" fontWeight="medium">
                  Detaillierte Bewertungen anzeigen
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {review.knowledgeRating !== undefined && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 180 }}>
                          {SECTION_LABELS.knowledge}:
                        </Typography>
                        <Rating value={review.knowledgeRating} readOnly size="small" />
                      </Box>
                      {review.knowledgeComment ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: '180px', mt: 0.5 }}
                        >
                          {review.knowledgeComment}
                        </Typography>
                      ) : null}
                    </Box>
                  )}
                  {review.teachingRating !== undefined && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 180 }}>
                          {SECTION_LABELS.teaching}:
                        </Typography>
                        <Rating value={review.teachingRating} readOnly size="small" />
                      </Box>
                      {review.teachingComment ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: '180px', mt: 0.5 }}
                        >
                          {review.teachingComment}
                        </Typography>
                      ) : null}
                    </Box>
                  )}
                  {review.communicationRating !== undefined && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 180 }}>
                          {SECTION_LABELS.communication}:
                        </Typography>
                        <Rating value={review.communicationRating} readOnly size="small" />
                      </Box>
                      {review.communicationComment ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: '180px', mt: 0.5 }}
                        >
                          {review.communicationComment}
                        </Typography>
                      ) : null}
                    </Box>
                  )}
                  {review.reliabilityRating !== undefined && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 180 }}>
                          {SECTION_LABELS.reliability}:
                        </Typography>
                        <Rating value={review.reliabilityRating} readOnly size="small" />
                      </Box>
                      {review.reliabilityComment ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: '180px', mt: 0.5 }}
                        >
                          {review.reliabilityComment}
                        </Typography>
                      ) : null}
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ) : null}

          {/* Ratee Response */}
          {review.rateeResponse ? (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                borderLeft: 3,
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Antwort des Lehrers:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {review.rateeResponse}
              </Typography>
              {review.rateeResponseAt ? (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  {formatDistanceToNow(new Date(review.rateeResponseAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================================================
// MAIN REVIEWS PAGE
// ============================================================================

const ReviewsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { contextualBreadcrumbs, navigateWithContext, navigationContext } = useNavigation();

  // Redux Hook - replaces 7x useState + 2x useEffect!
  const {
    reviews,
    stats,
    pagination,
    starFilter,
    isLoadingReviews,
    isLoadingStats,
    loadReviews,
    setStarFilter,
  } = useProfileReviews(userId);

  // Handlers
  const handleFilterClick = (stars: number | null): void => {
    setStarFilter(stars);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number): void => {
    loadReviews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle breadcrumb navigation with context preservation
  const handleBreadcrumbClick = useCallback(
    (href: string, label: string) => {
      if (href === '/') {
        void navigateWithContext(href);
      } else if (href.startsWith('/skills/') && href !== '/skills') {
        void navigateWithContext(href, {
          from: 'home',
          skillName: label,
        });
      } else if (href.startsWith('/users/') && href.includes('/profile')) {
        // Navigating back to profile - use 'skill' context so profile shows normal breadcrumbs
        // (Startseite > Skill Name > Profil) instead of (Startseite > Skill Name > User Name > Profil)
        void navigateWithContext(href, {
          from: 'skill',
          skillId: navigationContext.skillId,
          skillName: navigationContext.skillName,
        });
      } else {
        void navigateWithContext(href, navigationContext);
      }
    },
    [navigateWithContext, navigationContext]
  );

  // Loading state
  if (isLoadingStats) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Breadcrumb rendering helper
  const renderBreadcrumbs = (): React.ReactNode => (
    <Breadcrumbs sx={{ mb: 2 }}>
      {contextualBreadcrumbs.map((item, index) => {
        const isLast = index === contextualBreadcrumbs.length - 1;

        if (isLast || item.isActive === true) {
          return (
            <Typography key={item.label} color="text.primary">
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={item.label}
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => {
              if (item.href) {
                handleBreadcrumbClick(item.href, item.label);
              }
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );

  // Error state - no stats loaded
  if (!stats) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {renderBreadcrumbs()}
        <Alert severity="error">Bewertungen konnten nicht geladen werden</Alert>
      </Container>
    );
  }

  // No reviews state
  if (stats.totalReviews === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {renderBreadcrumbs()}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <StarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Noch keine Bewertungen vorhanden
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Dieser Benutzer hat noch keine Bewertungen erhalten.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Breadcrumb Navigation */}
      {renderBreadcrumbs()}

      {/* Page Title */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Bewertungen
      </Typography>

      {/* Histogram */}
      <RatingHistogram
        stats={stats}
        selectedFilter={starFilter}
        onFilterClick={handleFilterClick}
      />

      {/* Reviews List */}
      {isLoadingReviews ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : reviews.length > 0 ? (
        <>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review as UserReviewResponse} />
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.pageNumber}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {starFilter === null
              ? 'Keine Bewertungen gefunden'
              : `Keine Bewertungen mit ${starFilter} ${starFilter === 1 ? 'Stern' : 'Sternen'} gefunden`}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ReviewsPage;
