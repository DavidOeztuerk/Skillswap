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

// ===== SOCIAL CONNECTIONS =====

// Reducer
export { default as socialConnectionsReducer } from './socialConnectionsSlice';
export {
  clearError as clearSocialConnectionsError,
  clearSyncResult,
  resetOAuthState,
} from './socialConnectionsSlice';

// Thunks
export {
  fetchSocialConnections,
  initiateLinkedInConnect,
  completeLinkedInConnect,
  syncLinkedInProfile,
  disconnectLinkedIn,
  initiateXingConnect,
  completeXingConnect,
  syncXingProfile,
  disconnectXing,
  addImportedSkill,
  updateImportedSkill,
  deleteImportedSkill,
  reorderSkills,
} from './thunks/socialConnectionsThunks';

// Selectors
export {
  // Base selectors
  selectSocialConnectionsState,
  selectSocialConnectionsLoading,
  selectSocialConnectionsError,
  selectSocialConnectionsSyncing,
  selectSocialConnectionsSaving,
  // Connection selectors
  selectLinkedInConnection,
  selectXingConnection,
  selectHasLinkedInConnection,
  selectHasXingConnection,
  selectHasAnyConnection,
  // OAuth state selectors
  selectOAuthState,
  selectOAuthProvider,
  selectOAuthAuthorizationUrl,
  selectOAuthIsInitiating,
  selectOAuthIsCompleting,
  // Imported skills selectors
  selectImportedSkills,
  selectImportedSkillsCount,
  selectVisibleImportedSkills,
  selectImportedSkillsBySource,
  selectLinkedInSkills,
  selectXingSkills,
  selectManualSkills,
  selectImportedSkillsSorted,
  selectImportedSkillById,
  // Summary selectors
  selectSocialConnectionsSummary,
  selectTotalImportedSkills,
  selectLinkedInSkillCount,
  selectXingSkillCount,
  selectManualSkillCount,
  selectTotalImportedExperiences,
  selectTotalImportedEducations,
  // Sync result selectors
  selectSyncResult,
  selectSyncResultSuccess,
  // Computed selectors
  selectSkillsGroupedBySource,
  selectTopSkillsByEndorsements,
  selectLinkedInLastSync,
  selectXingLastSync,
} from './socialConnectionsSelectors';

// Types
export type {
  LinkedInConnection,
  XingConnection,
  ImportedSkill,
  SocialConnectionsSummary,
  OAuthState,
  SocialConnectionsState,
} from './socialConnectionsAdapter+State';
