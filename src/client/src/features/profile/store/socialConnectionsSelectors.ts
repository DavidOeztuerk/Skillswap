import { createSelector } from '@reduxjs/toolkit';
import type { SocialConnectionsState } from './socialConnectionsAdapter+State';
import type { RootState } from '../../../core/store/store';

/**
 * Social Connections Selectors
 * Centralized selectors for social connections state
 */

// ===== BASE SELECTORS =====

export const selectSocialConnectionsState = (state: RootState): SocialConnectionsState =>
  state.socialConnections;

export const selectSocialConnectionsLoading = (state: RootState): boolean =>
  state.socialConnections.isLoading;

export const selectSocialConnectionsError = (state: RootState): string | undefined =>
  state.socialConnections.errorMessage;

export const selectSocialConnectionsSyncing = (state: RootState): boolean =>
  state.socialConnections.isSyncing;

export const selectSocialConnectionsSaving = (state: RootState): boolean =>
  state.socialConnections.isSaving;

// ===== CONNECTION SELECTORS =====

export const selectLinkedInConnection = createSelector(
  [selectSocialConnectionsState],
  (state) => state.linkedIn
);

export const selectXingConnection = createSelector(
  [selectSocialConnectionsState],
  (state) => state.xing
);

export const selectHasLinkedInConnection = createSelector(
  [selectLinkedInConnection],
  (linkedIn) => linkedIn !== null
);

export const selectHasXingConnection = createSelector(
  [selectXingConnection],
  (xing) => xing !== null
);

export const selectHasAnyConnection = createSelector(
  [selectHasLinkedInConnection, selectHasXingConnection],
  (hasLinkedIn, hasXing) => hasLinkedIn || hasXing
);

// ===== OAUTH STATE SELECTORS =====

export const selectOAuthState = createSelector(
  [selectSocialConnectionsState],
  (state) => state.oauthState
);

export const selectOAuthProvider = createSelector(
  [selectOAuthState],
  (oauthState) => oauthState.provider
);

export const selectOAuthAuthorizationUrl = createSelector(
  [selectOAuthState],
  (oauthState) => oauthState.authorizationUrl
);

export const selectOAuthIsInitiating = createSelector(
  [selectOAuthState],
  (oauthState) => oauthState.isInitiating
);

export const selectOAuthIsCompleting = createSelector(
  [selectOAuthState],
  (oauthState) => oauthState.isCompleting
);

// ===== IMPORTED SKILLS SELECTORS =====

export const selectImportedSkills = createSelector(
  [selectSocialConnectionsState],
  (state) => state.importedSkills
);

export const selectImportedSkillsCount = createSelector(
  [selectImportedSkills],
  (skills) => skills.length
);

export const selectVisibleImportedSkills = createSelector([selectImportedSkills], (skills) =>
  skills.filter((skill) => skill.isVisible)
);

export const selectImportedSkillsBySource = createSelector(
  [selectImportedSkills, (_: RootState, source: 'manual' | 'linkedin' | 'xing') => source],
  (skills, source) => skills.filter((skill) => skill.source === source)
);

export const selectLinkedInSkills = createSelector([selectImportedSkills], (skills) =>
  skills.filter((skill) => skill.source === 'linkedin')
);

export const selectXingSkills = createSelector([selectImportedSkills], (skills) =>
  skills.filter((skill) => skill.source === 'xing')
);

export const selectManualSkills = createSelector([selectImportedSkills], (skills) =>
  skills.filter((skill) => skill.source === 'manual')
);

export const selectImportedSkillsSorted = createSelector([selectImportedSkills], (skills) =>
  [...skills].sort((a, b) => a.sortOrder - b.sortOrder)
);

export const selectImportedSkillById = createSelector(
  [selectImportedSkills, (_: RootState, skillId: string) => skillId],
  (skills, skillId) => skills.find((skill) => skill.id === skillId) ?? null
);

// ===== SUMMARY SELECTORS =====

export const selectSocialConnectionsSummary = createSelector(
  [selectSocialConnectionsState],
  (state) => state.summary
);

export const selectTotalImportedSkills = createSelector(
  [selectSocialConnectionsSummary],
  (summary) => summary?.totalImportedSkills ?? 0
);

export const selectLinkedInSkillCount = createSelector(
  [selectSocialConnectionsSummary],
  (summary) => summary?.linkedInSkillCount ?? 0
);

export const selectXingSkillCount = createSelector(
  [selectSocialConnectionsSummary],
  (summary) => summary?.xingSkillCount ?? 0
);

export const selectManualSkillCount = createSelector(
  [selectSocialConnectionsSummary],
  (summary) => summary?.manualSkillCount ?? 0
);

export const selectTotalImportedExperiences = createSelector(
  [selectSocialConnectionsSummary],
  (summary) => summary?.totalImportedExperiences ?? 0
);

export const selectTotalImportedEducations = createSelector(
  [selectSocialConnectionsSummary],
  (summary) => summary?.totalImportedEducations ?? 0
);

// ===== SYNC RESULT SELECTORS =====

export const selectSyncResult = createSelector(
  [selectSocialConnectionsState],
  (state) => state.syncResult
);

export const selectSyncResultSuccess = createSelector(
  [selectSyncResult],
  (syncResult) => syncResult?.success ?? false
);

// ===== COMPUTED SELECTORS =====

/**
 * Get skills grouped by source
 */
export const selectSkillsGroupedBySource = createSelector([selectImportedSkills], (skills) => ({
  linkedin: skills.filter((s) => s.source === 'linkedin'),
  xing: skills.filter((s) => s.source === 'xing'),
  manual: skills.filter((s) => s.source === 'manual'),
}));

/**
 * Get top skills by endorsement count
 */
export const selectTopSkillsByEndorsements = createSelector(
  [selectImportedSkills, (_: RootState, limit: number) => limit],
  (skills, limit) =>
    [...skills].sort((a, b) => b.endorsementCount - a.endorsementCount).slice(0, limit)
);

/**
 * Get LinkedIn connection last sync info
 */
export const selectLinkedInLastSync = createSelector([selectLinkedInConnection], (linkedIn) => {
  if (!linkedIn) return null;
  return {
    lastSyncAt: linkedIn.lastSyncAt,
    importedExperienceCount: linkedIn.importedExperienceCount,
    importedEducationCount: linkedIn.importedEducationCount,
  };
});

/**
 * Get Xing connection last sync info
 */
export const selectXingLastSync = createSelector([selectXingConnection], (xing) => {
  if (!xing) return null;
  return {
    lastSyncAt: xing.lastSyncAt,
    importedExperienceCount: xing.importedExperienceCount,
    importedEducationCount: xing.importedEducationCount,
  };
});
