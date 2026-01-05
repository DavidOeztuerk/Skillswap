/**
 * usePublicProfile Hook
 *
 * Custom hook that manages state and logic for viewing public profiles.
 * Uses Redux store for state management and provides memoized actions.
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { selectUserId } from '../../auth/store/authSelectors';
import {
  selectSelectedProfile,
  selectProfileLoading,
  selectProfileError,
  selectCurrentProfileReviews,
  selectReviewsLoading,
  selectReviewsPagination,
} from '../store/profileSelectors';
import { setSelectedProfileId, clearSelectedProfile, clearError } from '../store/profileSlice';
import { fetchPublicProfile, fetchProfileReviews } from '../store/thunks/profileThunks';
import type { PublicProfile, UserReview, PaginationState } from '../store/profileAdapter+State';

// ===== RETURN TYPE =====

interface UsePublicProfileReturn {
  // === PROFILE DATA ===
  profile: PublicProfile | null;
  reviews: UserReview[];

  // === UI STATE ===
  isOwnProfile: boolean;
  isAuthenticated: boolean;

  // === LOADING STATES ===
  isLoading: boolean;
  isReviewsLoading: boolean;

  // === ERROR STATE ===
  error: string | undefined;

  // === PAGINATION ===
  reviewsPagination: PaginationState;

  // === ACTIONS ===
  fetchReviews: (pageNumber?: number, pageSize?: number) => void;
  clearProfileError: () => void;
}

// ===== HOOK IMPLEMENTATION =====

export const usePublicProfile = (userId: string | undefined): UsePublicProfileReturn => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // === REDUX SELECTORS ===
  const currentUserId = useAppSelector(selectUserId);
  const profile = useAppSelector(selectSelectedProfile);
  const isLoading = useAppSelector(selectProfileLoading);
  const error = useAppSelector(selectProfileError);
  const reviews = useAppSelector(selectCurrentProfileReviews);
  const isReviewsLoading = useAppSelector(selectReviewsLoading);
  const reviewsPagination = useAppSelector(selectReviewsPagination);

  // === COMPUTED VALUES ===
  const isAuthenticated = useMemo(() => Boolean(currentUserId), [currentUserId]);
  const isOwnProfile = useMemo(() => currentUserId === userId, [currentUserId, userId]);

  // === EFFECTS ===

  // Redirect if viewing own profile
  useEffect(() => {
    if (isOwnProfile && userId) {
      void navigate('/profile', { replace: true });
    }
  }, [isOwnProfile, userId, navigate]);

  // Fetch profile on mount/userId change
  useEffect(() => {
    if (!userId || isOwnProfile) return;

    // Set selected profile ID and fetch
    dispatch(setSelectedProfileId(userId));
    void dispatch(fetchPublicProfile(userId));

    // Cleanup on unmount
    return () => {
      dispatch(clearSelectedProfile());
    };
  }, [userId, isOwnProfile, dispatch]);

  // === MEMOIZED ACTIONS ===
  const actions = useMemo(
    () => ({
      fetchReviews: (pageNumber = 1, pageSize = 5): void => {
        if (!userId) return;
        void dispatch(fetchProfileReviews({ userId, pageNumber, pageSize }));
      },

      clearProfileError: (): void => {
        dispatch(clearError());
      },
    }),
    [userId, dispatch]
  );

  // === RETURN ===
  return {
    // Profile data
    profile,
    reviews,

    // UI state
    isOwnProfile,
    isAuthenticated,

    // Loading states
    isLoading,
    isReviewsLoading,

    // Error state
    error,

    // Pagination
    reviewsPagination,

    // Actions
    fetchReviews: actions.fetchReviews,
    clearProfileError: actions.clearProfileError,
  };
};

export default usePublicProfile;
