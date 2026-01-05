import { createSelector } from '@reduxjs/toolkit';
import { type ProfileEntityState, profilesAdapter } from './profileAdapter+State';
import type { RootState } from '../../../core/store/store';

/**
 * Profile Selectors
 * Centralized selectors for profile state and entity operations
 */

// ===== BASE SELECTORS =====

export const selectProfileState = (state: RootState): ProfileEntityState => state.profile;

export const selectProfileLoading = (state: RootState): boolean => state.profile.isLoading;

export const selectProfileError = (state: RootState): string | undefined =>
  state.profile.errorMessage;

export const selectProfileSaving = (state: RootState): boolean => state.profile.isSaving;

export const selectProfileSaveError = (state: RootState): string | undefined =>
  state.profile.saveError;

// ===== ENTITY ADAPTER SELECTORS =====

const adapterSelectors = profilesAdapter.getSelectors<RootState>((state) => state.profile);

// Export EntityAdapter's built-in selectors
export const {
  selectAll: selectAllProfiles,
  selectById: selectProfileByIdFromEntities,
  selectIds: selectProfileIds,
  selectEntities: selectProfileEntities,
} = adapterSelectors;

// ===== SELECTED PROFILE SELECTORS =====

export const selectSelectedProfileId = createSelector(
  [selectProfileState],
  (profileState) => profileState.selectedProfileId
);

export const selectSelectedProfile = createSelector(
  [selectProfileEntities, selectSelectedProfileId],
  (entities, selectedId) => {
    if (selectedId === null) return null;
    return entities[selectedId] ?? null;
  }
);

export const selectProfileById = createSelector(
  [selectProfileEntities, (_: RootState, profileId: string) => profileId],
  (entities, profileId) => entities[profileId] ?? null
);

// ===== REVIEWS SELECTORS =====

export const selectCurrentProfileReviews = createSelector(
  [selectProfileState],
  (profileState) => profileState.currentProfileReviews
);

export const selectReviewsLoading = createSelector(
  [selectProfileState],
  (profileState) => profileState.isReviewsLoading
);

export const selectReviewsPagination = createSelector(
  [selectProfileState],
  (profileState) => profileState.reviewsPagination
);

export const selectReviewsTotalCount = createSelector(
  [selectReviewsPagination],
  (pagination) => pagination.totalRecords
);

// ===== REVIEW STATS SELECTORS =====

export const selectCurrentProfileStats = createSelector(
  [selectProfileState],
  (profileState) => profileState.currentProfileStats
);

export const selectStatsLoading = createSelector(
  [selectProfileState],
  (profileState) => profileState.isStatsLoading
);

export const selectReviewsStarFilter = createSelector(
  [selectProfileState],
  (profileState) => profileState.reviewsStarFilter
);

// ===== OWN PROFILE DATA SELECTORS =====

export const selectOwnExperience = createSelector(
  [selectProfileState],
  (profileState) => profileState.ownExperience
);

export const selectOwnEducation = createSelector(
  [selectProfileState],
  (profileState) => profileState.ownEducation
);

export const selectOwnDataLoading = createSelector(
  [selectProfileState],
  (profileState) => profileState.isOwnDataLoading
);

// ===== COMPUTED SELECTORS =====

/**
 * Get full name of selected profile
 */
export const selectSelectedProfileFullName = createSelector([selectSelectedProfile], (profile) => {
  if (!profile) return null;
  return `${profile.firstName} ${profile.lastName}`.trim();
});

/**
 * Get experience sorted by date (most recent first)
 */
export const selectOwnExperienceSorted = createSelector([selectOwnExperience], (experience) =>
  [...experience].sort((a, b) => {
    // Current jobs first
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    // Then by start date (newest first)
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  })
);

/**
 * Get education sorted by graduation year (most recent first)
 */
export const selectOwnEducationSorted = createSelector([selectOwnEducation], (education) =>
  [...education].sort((a, b) => {
    const yearA = a.graduationYear ?? 0;
    const yearB = b.graduationYear ?? 0;
    return yearB - yearA;
  })
);

/**
 * Get selected profile's experience (from cached profile)
 */
export const selectSelectedProfileExperience = createSelector(
  [selectSelectedProfile],
  (profile) => profile?.experience ?? []
);

/**
 * Get selected profile's education (from cached profile)
 */
export const selectSelectedProfileEducation = createSelector(
  [selectSelectedProfile],
  (profile) => profile?.education ?? []
);

// ===== STATISTICS SELECTORS =====

export const selectSelectedProfileStats = createSelector([selectSelectedProfile], (profile) => {
  if (!profile) return null;
  return {
    skillsOffered: profile.skillsOffered,
    skillsLearned: profile.skillsLearned,
    completedSessions: profile.completedSessions,
    averageRating: profile.averageRating,
    totalReviews: profile.totalReviews,
  };
});

/**
 * Calculate average rating from reviews
 */
export const selectAverageReviewRating = createSelector(
  [selectCurrentProfileReviews],
  (reviews) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }
);

// ===== UTILITY SELECTORS =====

/**
 * Check if profile is blocked
 */
export const selectIsProfileBlocked = createSelector(
  [selectSelectedProfile],
  (profile) => profile?.isBlocked ?? false
);

/**
 * Get member since date as formatted string
 */
export const selectMemberSinceDate = createSelector(
  [selectSelectedProfile],
  (profile) => profile?.memberSince ?? null
);

/**
 * Get profile languages
 */
export const selectProfileLanguages = createSelector(
  [selectSelectedProfile],
  (profile) => profile?.languages ?? []
);

/**
 * Get profile timezone
 */
export const selectProfileTimezone = createSelector(
  [selectSelectedProfile],
  (profile) => profile?.timeZone ?? null
);
