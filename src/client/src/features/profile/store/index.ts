// Store exports
export { default as profileReducer } from './profileSlice';
export {
  setSelectedProfileId,
  clearSelectedProfile,
  clearError,
  clearSaveError,
  setReviewsStarFilter,
  clearReviewsData,
} from './profileSlice';

// Thunks
export {
  fetchPublicProfile,
  fetchProfileReviews,
  fetchProfileReviewStats,
  fetchOwnExperience,
  fetchOwnEducation,
  saveExperience,
  deleteExperience,
  saveEducation,
  deleteEducation,
} from './thunks/profileThunks';

// Selectors
export {
  // Base selectors
  selectProfileState,
  selectProfileLoading,
  selectProfileError,
  selectProfileSaving,
  selectProfileSaveError,
  // Entity selectors
  selectAllProfiles,
  selectProfileByIdFromEntities,
  selectProfileIds,
  selectProfileEntities,
  // Selected profile selectors
  selectSelectedProfileId,
  selectSelectedProfile,
  selectProfileById,
  // Reviews selectors
  selectCurrentProfileReviews,
  selectReviewsLoading,
  selectReviewsPagination,
  selectReviewsTotalCount,
  // Review stats selectors
  selectCurrentProfileStats,
  selectStatsLoading,
  selectReviewsStarFilter,
  // Own data selectors
  selectOwnExperience,
  selectOwnEducation,
  selectOwnDataLoading,
  // Computed selectors
  selectSelectedProfileFullName,
  selectOwnExperienceSorted,
  selectOwnEducationSorted,
  selectSelectedProfileExperience,
  selectSelectedProfileEducation,
  // Statistics selectors
  selectSelectedProfileStats,
  selectAverageReviewRating,
  // Utility selectors
  selectIsProfileBlocked,
  selectMemberSinceDate,
  selectProfileLanguages,
  selectProfileTimezone,
} from './profileSelectors';

// Types
export type {
  PublicProfile,
  UserExperience,
  UserEducation,
  UserReview,
  ProfileEntityState,
  PaginationState,
} from './profileAdapter+State';
