import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { selectAuthUser } from './authSelectors';
import { matchesAdapter, type MatchesEntityState } from '../adapters/matchmakingAdapter+State';

/**
 * MATCHMAKING SELECTORS - REFACTORED
 *
 * ✅ Uses EntityAdapter selectors for normalized state
 * ✅ No more duplicate arrays (matches, matchHistory, acceptedRequests)
 * ✅ All derived data computed from entities
 * ✅ Efficient memoization with createSelector
 */

// ==================== BASE SELECTORS ====================

export const selectMatchmakingState = (state: RootState): MatchesEntityState => state.matchmaking;
export const selectMatchesLoading = (state: RootState): boolean => state.matchmaking.isLoading;
export const selectIsLoadingMatches = (state: RootState): boolean =>
  state.matchmaking.isLoadingMatches;
export const selectMatchmakingError = (state: RootState): string | undefined =>
  state.matchmaking.errorMessage;
export const selectIsLoadingRequests = (state: RootState): boolean =>
  state.matchmaking.isLoadingRequests;
export const selectIsLoadingThread = (state: RootState): boolean =>
  state.matchmaking.isLoadingThread;
// ==================== ENTITY ADAPTER SELECTORS ====================

/**
 * Get adapter selectors scoped to matchmaking state
 * These provide efficient access to normalized entities
 */
const adapterSelectors = matchesAdapter.getSelectors<RootState>((state) => state.matchmaking);

// Export adapter selectors
export const {
  selectIds: selectMatchIds,
  selectEntities: selectMatchEntities,
  selectAll: selectAllMatches,
  selectTotal: selectMatchesTotal,
  selectById: selectMatchById,
} = adapterSelectors;

// ==================== DIRECT STATE SELECTORS ====================

export const selectActiveMatch = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.activeMatch
);

export const selectMatchResults = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.matchResults
);

export const selectMatchRequestSent = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.matchRequestSent
);

export const selectMatchmakingFilters = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.filters
);

export const selectMatchmakingPagination = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.pagination
);

export const selectMatchPreferences = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.matchPreferences
);

// ==================== REQUEST SELECTORS ====================

/**
 * Incoming and outgoing requests are kept in separate arrays
 * because they're different entity types from matches
 */
export const selectIncomingRequests = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.incomingRequests
);

export const selectOutgoingRequests = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.outgoingRequests
);

export const selectUnreadIncomingRequests = createSelector(
  [selectIncomingRequests],
  (incomingRequests) => incomingRequests.filter((request) => !request.isRead)
);

export const selectUnreadOutgoingRequests = createSelector(
  [selectOutgoingRequests],
  (outgoingRequests) => outgoingRequests.filter((request) => !request.isRead)
);

export const selectPendingIncomingRequests = createSelector(
  [selectIncomingRequests],
  (incomingRequests) => incomingRequests.filter((request) => request.status === 'pending')
);

export const selectPendingOutgoingRequests = createSelector(
  [selectOutgoingRequests],
  (outgoingRequests) => outgoingRequests.filter((request) => request.status === 'pending')
);

export const selectUnreadRequestsCount = createSelector(
  [selectUnreadIncomingRequests, selectUnreadOutgoingRequests],
  (unreadIncoming, unreadOutgoing) => unreadIncoming.length + unreadOutgoing.length
);

// ==================== USER-SPECIFIC MATCH SELECTORS (FROM ENTITIES) ====================

/**
 * Select all matches for current user
 */
export const selectUserMatches = createSelector(
  [selectAllMatches, selectAuthUser],
  (matches, user) => {
    if (!user?.id) return [];
    return matches.filter(
      (match) =>
        match.requesterId === user.id ||
        match.responderId === user.id ||
        match.partnerId === user.id
    );
  }
);

/**
 * Select matches by status
 */
export const selectPendingMatches = createSelector([selectAllMatches], (matches) =>
  matches.filter((match) => match.status === 'pending')
);

export const selectActiveMatches = createSelector([selectAllMatches], (matches) =>
  matches.filter((match) => match.status === 'accepted' || match.status === 'active')
);

export const selectCompletedMatches = createSelector([selectAllMatches], (matches) =>
  matches.filter((match) => match.status === 'completed')
);

export const selectCancelledMatches = createSelector([selectAllMatches], (matches) =>
  matches.filter((match) => match.status === 'cancelled')
);

export const selectRejectedMatches = createSelector([selectAllMatches], (matches) =>
  matches.filter((match) => match.status === 'rejected')
);

// ==================== MATCH HISTORY (COMPUTED FROM ENTITIES) ====================

/**
 * Match history = completed or cancelled matches
 * REPLACES: state.matchHistory
 */
export const selectMatchHistory = createSelector([selectAllMatches], (matches) =>
  matches
    .filter((match) => match.status === 'completed' || match.status === 'cancelled')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

// ==================== REQUEST FILTERING ====================

/**
 * Select requests by skill
 */
export const selectRequestsBySkill = createSelector(
  [selectIncomingRequests, selectOutgoingRequests, (_: RootState, skillId: string) => skillId],
  (incomingRequests, outgoingRequests, skillId) => {
    const incoming = incomingRequests.filter((request) => request.skillId === skillId);
    const outgoing = outgoingRequests.filter((request) => request.skillId === skillId);
    return { incoming, outgoing };
  }
);

// ==================== THREAD SELECTORS ====================

export const selectCurrentThread = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.currentThread
);

export const selectCurrentThreadRequests = createSelector(
  [selectCurrentThread],
  (currentThread) => currentThread?.requests
);

export const selectCurrentThreadParticipants = createSelector(
  [selectCurrentThread],
  (currentThread) => currentThread?.participants
);

export const selectCurrentThreadSkill = createSelector(
  [selectCurrentThread],
  (currentThread) => currentThread?.skill
);

export const selectCurrentThreadStatus = createSelector(
  [selectCurrentThread],
  (currentThread) => currentThread?.status
);

// ==================== STATISTICS SELECTORS ====================

/**
 * Matchmaking statistics
 */
export const selectMatchmakingStatistics = createSelector(
  [
    selectUserMatches,
    selectIncomingRequests,
    selectOutgoingRequests,
    selectPendingMatches,
    selectActiveMatches,
    selectCompletedMatches,
  ],
  (userMatches, incomingRequests, outgoingRequests, pending, active, completed) => ({
    totalMatches: userMatches.length,
    incomingRequestsCount: incomingRequests.length,
    outgoingRequestsCount: outgoingRequests.length,
    pendingMatchesCount: pending.length,
    activeMatchesCount: active.length,
    completedMatchesCount: completed.length,
    matchSuccessRate:
      userMatches.length > 0 ? Math.round((completed.length / userMatches.length) * 100) : 0,
  })
);

// ==================== RECENT ACTIVITY SELECTORS ====================

/**
 * Recent matches (last 7 days)
 */
export const selectRecentMatches = createSelector([selectUserMatches], (userMatches) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return userMatches
    .filter((match) => new Date(match.createdAt).getTime() > sevenDaysAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

/**
 * Recent requests (last 7 days)
 */
export const selectRecentRequests = createSelector(
  [selectIncomingRequests, selectOutgoingRequests],
  (incoming, outgoing) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const allRequests = [...incoming, ...outgoing];
    return allRequests
      .filter((request) => new Date(request.createdAt).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
);

// ==================== UTILITY SELECTORS ====================

/**
 * Check if user has any active matches
 */
export const selectHasActiveMatches = createSelector(
  [selectActiveMatches],
  (activeMatches) => activeMatches.length > 0
);

/**
 * Check if user has any pending requests
 */
export const selectHasPendingRequests = createSelector(
  [selectPendingIncomingRequests],
  (pendingRequests) => pendingRequests.length > 0
);

/**
 * Select next match requiring action
 */
export const selectNextMatchRequiringAction = createSelector(
  [selectPendingIncomingRequests],
  (pendingRequests) => pendingRequests[0]
);
