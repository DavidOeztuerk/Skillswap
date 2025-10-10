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
import type { CreateMatchRequest } from '../types/contracts/requests/CreateMatchRequest';

// Type definitions for hook parameters
interface MatchQueryParams {
  pageNumber?: number;
  pageSize?: number;
  includeCompleted?: boolean;
  status?: string;
  skillId?: string;
}

interface MatchRequestParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
}

interface AcceptMatchRequestPayload {
  // Add properties as needed from backend contract
}

interface RejectMatchRequestPayload {
  responseMessage?: string;
}

interface CounterOfferPayload extends CreateMatchRequest {
  originalRequestId: string;
}

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
    loadMatches: (params: MatchQueryParams = { pageNumber: 1, pageSize: 12, includeCompleted: true }) => {
      return dispatch(fetchMatches(params));
    },

    loadIncomingRequests: (params: MatchRequestParams = { pageNumber: 1, pageSize: 12 }) => {
      return dispatch(fetchIncomingMatchRequests(params));
    },

    loadOutgoingRequests: (params: MatchRequestParams = { pageNumber: 1, pageSize: 12 }) => {
      return dispatch(fetchOutgoingMatchRequests(params));
    },

    fetchRecommendations: (params: MatchQueryParams = {}) => {
      return dispatch(fetchMatches(params));
    },

    loadUserMatches: (params: MatchQueryParams = { pageNumber: 1, pageSize: 12, includeCompleted: true }) => {
      return dispatch(fetchUserMatches(params));
    },

    // === CRUD OPERATIONS ===
    createMatchRequest: (data: CreateMatchRequest) => {
      return dispatch(createMatchRequest(data));
    },

    acceptMatchRequest: (requestId: string, request: AcceptMatchRequestPayload = {}) => {
      return dispatch(acceptMatchRequest({ requestId, request }));
    },

    rejectMatchRequest: (requestId: string, request: RejectMatchRequestPayload = {}) => {
      return dispatch(rejectMatchRequest({ requestId, request }));
    },

    createCounterOffer: (data: CounterOfferPayload) => {
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

    sendMatchRequest: (data: CreateMatchRequest) => {
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