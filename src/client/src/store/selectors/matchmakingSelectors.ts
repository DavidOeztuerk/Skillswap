import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { selectAuthUser } from './authSelectors';
import { MatchStatus } from '../../types/models/Match';

/**
 * Matchmaking Selectors
 * Centralized selectors for matchmaking state and entity operations
 */

// Base selectors
export const selectMatchmakingState = (state: RootState) => state.matchmaking;
export const selectMatchesLoading = (state: RootState) => state.matchmaking.isLoading;
export const selectMatchmakingError = (state: RootState) => state.matchmaking.errorMessage;
export const selectIsLoadingRequests = (state: RootState) => state.matchmaking.isLoadingRequests;
export const selectIsLoadingThread = (state: RootState) => state.matchmaking.isLoadingThread;

// Entity selectors using the normalized structure
export const selectAllMatches = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => Object.values(matchmakingState.entities).filter(Boolean)
);

export const selectMatchById = createSelector(
  [selectMatchmakingState, (_: RootState, matchId: string) => matchId],
  (matchmakingState, matchId) => 
    matchmakingState.entities[matchId] || null
);

// Direct state selectors
export const selectMatches = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.matches
);

export const selectActiveMatch = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.activeMatch
);

export const selectMatchResults = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.matchResults
);

// Request selectors
export const selectIncomingRequests = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.incomingRequests
);

export const selectOutgoingRequests = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.outgoingRequests
);

export const selectAcceptedRequests = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.acceptedRequests
);

export const selectMatchHistory = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.matchHistory
);

export const selectCurrentThread = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.currentThread
);

export const selectMatchRequestSent = createSelector(
  [selectMatchmakingState],
  (matchmakingState) => matchmakingState.matchRequestSent
);

// Computed selectors
export const selectUnreadIncomingRequests = createSelector(
  [selectIncomingRequests],
  (incomingRequests) => 
    incomingRequests.filter(request => !request.isRead)
);

export const selectUnreadOutgoingRequests = createSelector(
  [selectOutgoingRequests],
  (outgoingRequests) => 
    outgoingRequests.filter(request => !request.isRead)
);

export const selectPendingIncomingRequests = createSelector(
  [selectIncomingRequests],
  (incomingRequests) => 
    incomingRequests.filter(request => request.status === 'pending')
);

export const selectPendingOutgoingRequests = createSelector(
  [selectOutgoingRequests],
  (outgoingRequests) => 
    outgoingRequests.filter(request => request.status === 'pending')
);

// User-specific selectors
export const selectUserMatches = createSelector(
  [selectAllMatches, selectAuthUser],
  (matches, user) => {
    if (!user?.id) return [];
    return matches.filter(match => 
      match.requesterId === user.id || 
      match.responderId === user.id
    );
  }
);

export const selectPendingMatches = createSelector(
  [selectUserMatches],
  (userMatches) => 
    userMatches.filter(match => match.status === MatchStatus.Pending)
);

export const selectActiveMatches = createSelector(
  [selectUserMatches],
  (userMatches) => 
    userMatches.filter(match => match.status === MatchStatus.Accepted)
);

export const selectCompletedMatches = createSelector(
  [selectUserMatches],
  (userMatches) => 
    userMatches.filter(match => match.status === MatchStatus.Completed
    )
);

// Request filtering by skill
export const selectRequestsBySkill = createSelector(
  [selectIncomingRequests, selectOutgoingRequests, (_: RootState, skillId: string) => skillId],
  (incomingRequests, outgoingRequests, skillId) => {
    const incoming = incomingRequests.filter(request => request.skillId === skillId);
    const outgoing = outgoingRequests.filter(request => request.skillId === skillId);
    return { incoming, outgoing };
  }
);

// Statistics selectors
export const selectMatchmakingStatistics = createSelector(
  [
    selectUserMatches,
    selectIncomingRequests,
    selectOutgoingRequests,
    selectPendingMatches,
    selectActiveMatches,
    selectCompletedMatches
  ],
  (userMatches, incomingRequests, outgoingRequests, pending, active, completed) => ({
    totalMatches: userMatches.length,
    incomingRequestsCount: incomingRequests.length,
    outgoingRequestsCount: outgoingRequests.length,
    pendingMatchesCount: pending.length,
    activeMatchesCount: active.length,
    completedMatchesCount: completed.length,
    matchSuccessRate: userMatches.length > 0 
      ? Math.round((completed.length / userMatches.length) * 100) 
      : 0
  })
);

export const selectUnreadRequestsCount = createSelector(
  [selectUnreadIncomingRequests, selectUnreadOutgoingRequests],
  (unreadIncoming, unreadOutgoing) => 
    unreadIncoming.length + unreadOutgoing.length
);

// Filters and pagination
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

// Thread selectors
export const selectCurrentThreadRequests = createSelector(
  [selectCurrentThread],
  (currentThread) => currentThread?.requests || []
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
  (currentThread) => currentThread?.status || 'active'
);

// Recent activity selectors
export const selectRecentMatches = createSelector(
  [selectUserMatches],
  (userMatches) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return userMatches
      .filter(match => new Date(match.createdAt).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
);

export const selectRecentRequests = createSelector(
  [selectIncomingRequests, selectOutgoingRequests],
  (incoming, outgoing) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const allRequests = [...incoming, ...outgoing];
    return allRequests
      .filter(request => new Date(request.createdAt).getTime() > sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
);