/**
 * useProfileReviews Hook
 *
 * Custom hook that manages state and logic for viewing profile reviews.
 * Uses Redux store for state management and provides memoized actions.
 * Replaces local useState in ReviewsPage and ReviewsSection.
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import {
  selectCurrentProfileReviews,
  selectReviewsLoading,
  selectReviewsPagination,
  selectCurrentProfileStats,
  selectStatsLoading,
  selectReviewsStarFilter,
} from '../store/profileSelectors';
import { setReviewsStarFilter, clearReviewsData } from '../store/profileSlice';
import { fetchProfileReviews, fetchProfileReviewStats } from '../store/thunks/profileThunks';
import type { UserReview, PaginationState } from '../store/profileAdapter+State';
import type { UserReviewStatsResponse } from '../types';

// ===== RETURN TYPE =====

interface UseProfileReviewsReturn {
  // === DATA ===
  reviews: UserReview[];
  stats: UserReviewStatsResponse | null;
  pagination: PaginationState;
  starFilter: number | null;

  // === LOADING STATES ===
  isLoadingReviews: boolean;
  isLoadingStats: boolean;

  // === ACTIONS ===
  loadReviews: (page: number) => void;
  loadStats: () => void;
  setStarFilter: (stars: number | null) => void;
}

// ===== HOOK IMPLEMENTATION =====

export const useProfileReviews = (userId: string | undefined): UseProfileReviewsReturn => {
  const dispatch = useAppDispatch();

  // === REDUX SELECTORS ===
  const reviews = useAppSelector(selectCurrentProfileReviews);
  const isLoadingReviews = useAppSelector(selectReviewsLoading);
  const pagination = useAppSelector(selectReviewsPagination);
  const stats = useAppSelector(selectCurrentProfileStats);
  const isLoadingStats = useAppSelector(selectStatsLoading);
  const starFilter = useAppSelector(selectReviewsStarFilter);

  // === MEMOIZED ACTIONS ===

  const loadReviews = useCallback(
    (page: number): void => {
      if (!userId) return;
      void dispatch(
        fetchProfileReviews({
          userId,
          pageNumber: page,
          pageSize: pagination.pageSize,
          starFilter: starFilter ?? undefined,
        })
      );
    },
    [dispatch, userId, pagination.pageSize, starFilter]
  );

  const loadStats = useCallback((): void => {
    if (!userId) return;
    void dispatch(fetchProfileReviewStats(userId));
  }, [dispatch, userId]);

  const handleSetStarFilter = useCallback(
    (stars: number | null): void => {
      dispatch(setReviewsStarFilter(stars));
    },
    [dispatch]
  );

  const cleanup = useCallback((): void => {
    dispatch(clearReviewsData());
  }, [dispatch]);

  // === EFFECTS ===

  // Initial load - stats and first page of reviews
  useEffect(() => {
    if (!userId) return;

    loadStats();
    void dispatch(
      fetchProfileReviews({
        userId,
        pageNumber: 1,
        pageSize: pagination.pageSize,
      })
    );

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Refetch reviews when star filter changes
  useEffect(() => {
    if (!userId) return;

    void dispatch(
      fetchProfileReviews({
        userId,
        pageNumber: 1,
        pageSize: pagination.pageSize,
        starFilter: starFilter ?? undefined,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starFilter]);

  // === RETURN ===
  return {
    // Data
    reviews,
    stats,
    pagination,
    starFilter,

    // Loading states
    isLoadingReviews,
    isLoadingStats,

    // Actions
    loadReviews,
    loadStats,
    setStarFilter: handleSetStarFilter,
  };
};

export default useProfileReviews;
