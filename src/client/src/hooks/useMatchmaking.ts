import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  createMatchRequest,
  fetchMatches,
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
  fetchUserMatches,
  acceptMatchRequest,
  rejectMatchRequest,
  createCounterOffer,
  fetchMatchRequestThread
} from '../features/matchmaking/matchmakingThunks';
import {
  selectAllMatches,
  selectIncomingRequests,
  selectOutgoingRequests,
  selectMatchesLoading,
  selectMatchmakingError,
  selectUserMatches,
  selectPendingMatches,
  selectActiveMatches,
  selectCompletedMatches,
  selectMatchmakingStatistics
} from '../store/selectors/matchmakingSelectors';
import { clearError } from '../features/matchmaking/matchmakingSlice';

/**
 * 🚀 ROBUSTE USEMATCHMAKING HOOK 
 * 
 * ✅ KEINE useEffects - prevents infinite loops!
 * ✅ Stateless Design - nur Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 * 
 * CRITICAL: This hook is STATELESS and contains NO useEffects.
 * All data fetching must be initiated from Components!
 */
export const useMatchmaking = () => {
  const dispatch = useAppDispatch();
  
  // ===== SELECTORS =====
  const matches = useAppSelector(selectAllMatches);
  const userMatches = useAppSelector(selectUserMatches);
  const incomingRequests = useAppSelector(selectIncomingRequests);
  const outgoingRequests = useAppSelector(selectOutgoingRequests);
  const pendingMatches = useAppSelector(selectPendingMatches);
  const activeMatches = useAppSelector(selectActiveMatches);
  const completedMatches = useAppSelector(selectCompletedMatches);
  const isLoading = useAppSelector(selectMatchesLoading);
  const error = useAppSelector(selectMatchmakingError);
  const statistics = useAppSelector(selectMatchmakingStatistics);

  // ===== MEMOIZED ACTIONS =====
  const actions = useMemo(() => ({
    
    // === FETCH OPERATIONS ===
    loadMatches: (params: any = {}) => {
      return dispatch(fetchMatches(params));
    },

    loadIncomingRequests: (params: any = {}) => {
      return dispatch(fetchIncomingMatchRequests(params));
    },

    loadOutgoingRequests: (params: any = {}) => {
      return dispatch(fetchOutgoingMatchRequests(params));
    },

    fetchRecommendations: (params: any = {}) => {
      return dispatch(fetchMatches(params));
    },

    loadUserMatches: (params: any = {}) => {
      return dispatch(fetchUserMatches(params));
    },

    // === CRUD OPERATIONS ===
    createMatchRequest: (data: any) => {
      return dispatch(createMatchRequest(data));
    },

    acceptMatchRequest: (requestId: string, request: any) => {
      return dispatch(acceptMatchRequest({ requestId, request }));
    },

    rejectMatchRequest: (requestId: string, request: any) => {
      return dispatch(rejectMatchRequest({ requestId, request }));
    },

    createCounterOffer: (data: any) => {
      return dispatch(createCounterOffer(data));
    },

    getMatchRequestThread: (threadId: string) => {
      return dispatch(fetchMatchRequestThread(threadId));
    },

    // === ADDITIONAL OPERATIONS ===
    approveMatch: (matchId: string) => {
      return dispatch(acceptMatchRequest({ requestId: matchId, request: {} }));
    },

    declineMatch: (matchId: string) => {
      return dispatch(rejectMatchRequest({ requestId: matchId, request: {} }));
    },

    sendMatchRequest: (data: any) => {
      return dispatch(createMatchRequest(data));
    },

  }), [dispatch]);

  // ===== RETURN OBJECT =====
  return {
    // === STATE DATA === 
    matches,
    userMatches,
    incomingRequests,
    outgoingRequests,
    pendingMatches,
    activeMatches,
    completedMatches,
    recommendations: [],
    currentMatch: null,
    statistics,
    
    // === LOADING STATES ===
    isLoading,
    
    // === ERROR STATES ===
    error,
    
    // === ACTIONS ===
    ...actions,

    // === LEGACY COMPATIBILITY ===
    loadMatches: actions.loadMatches,
    loadIncomingRequests: actions.loadIncomingRequests,
    loadOutgoingRequests: actions.loadOutgoingRequests,
    loadRecommendations: actions.fetchRecommendations,
    clearError: () => dispatch(clearError()),
    dismissError: () => dispatch(clearError()),

    // === PROPERTY COMPATIBILITY ===
    errorMessage: error,
  };
};

export default useMatchmaking;