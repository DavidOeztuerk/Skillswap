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
  fetchMatchRequestThread,
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
  selectMatchmakingStatistics,
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

// Use type with Record<string, never> instead of empty interface
interface AcceptMatchRequestPayload {
  responseMessage?: string;
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
export const useMatchmaking = (): {
  // === STATE DATA ===
  matches: ReturnType<typeof selectAllMatches>;
  userMatches: ReturnType<typeof selectUserMatches>;
  incomingRequests: ReturnType<typeof selectIncomingRequests>;
  outgoingRequests: ReturnType<typeof selectOutgoingRequests>;
  pendingMatches: ReturnType<typeof selectPendingMatches>;
  activeMatches: ReturnType<typeof selectActiveMatches>;
  completedMatches: ReturnType<typeof selectCompletedMatches>;
  recommendations: never[];
  currentMatch: null;
  statistics: ReturnType<typeof selectMatchmakingStatistics>;
  isLoading: boolean;
  error: string | undefined;
  // === FETCH OPERATIONS ===
  loadMatches: (params?: MatchQueryParams) => void;
  loadIncomingRequests: (params?: MatchRequestParams) => void;
  loadOutgoingRequests: (params?: MatchRequestParams) => void;
  fetchRecommendations: (params?: MatchQueryParams) => void;
  loadUserMatches: (params?: MatchQueryParams) => void;
  loadRecommendations: (params?: MatchQueryParams) => void;
  // === CRUD OPERATIONS ===
  createMatchRequest: (data: CreateMatchRequest) => void;
  acceptMatchRequest: (requestId: string, request?: AcceptMatchRequestPayload) => void;
  rejectMatchRequest: (requestId: string, request?: RejectMatchRequestPayload) => void;
  createCounterOffer: (data: CounterOfferPayload) => void;
  getMatchRequestThread: (threadId: string) => void;
  // === ADDITIONAL OPERATIONS ===
  approveMatch: (matchId: string) => void;
  declineMatch: (matchId: string) => void;
  sendMatchRequest: (data: CreateMatchRequest) => void;
  clearError: () => void;
  dismissError: () => void;
} => {
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
  const actions = useMemo(
    () => ({
      // === FETCH OPERATIONS ===
      loadMatches: (
        params: MatchQueryParams = { pageNumber: 1, pageSize: 12, includeCompleted: true }
      ) => dispatch(fetchMatches(params)),

      loadIncomingRequests: (params: MatchRequestParams = { pageNumber: 1, pageSize: 12 }) =>
        dispatch(fetchIncomingMatchRequests(params)),

      loadOutgoingRequests: (params: MatchRequestParams = { pageNumber: 1, pageSize: 12 }) =>
        dispatch(fetchOutgoingMatchRequests(params)),

      fetchRecommendations: (params: MatchQueryParams = {}) => dispatch(fetchMatches(params)),

      loadUserMatches: (
        params: MatchQueryParams = { pageNumber: 1, pageSize: 12, includeCompleted: true }
      ) => dispatch(fetchUserMatches(params)),

      // === CRUD OPERATIONS ===
      createMatchRequest: (data: CreateMatchRequest) => dispatch(createMatchRequest(data)),

      acceptMatchRequest: (requestId: string, request: AcceptMatchRequestPayload = {}) =>
        dispatch(acceptMatchRequest({ requestId, request })),

      rejectMatchRequest: (requestId: string, request: RejectMatchRequestPayload = {}) =>
        dispatch(rejectMatchRequest({ requestId, request })),

      createCounterOffer: (data: CounterOfferPayload) => dispatch(createCounterOffer(data)),

      getMatchRequestThread: (threadId: string) => dispatch(fetchMatchRequestThread(threadId)),

      // === ADDITIONAL OPERATIONS ===
      approveMatch: (matchId: string) =>
        dispatch(acceptMatchRequest({ requestId: matchId, request: {} })),

      declineMatch: (matchId: string) =>
        dispatch(rejectMatchRequest({ requestId: matchId, request: {} })),

      sendMatchRequest: (data: CreateMatchRequest) => dispatch(createMatchRequest(data)),
    }),
    [dispatch]
  );

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
    recommendations: [] as never[],
    currentMatch: null,
    statistics,

    // === LOADING STATES ===
    isLoading,

    // === ERROR STATES ===
    error,

    // === ACTIONS (memoized) ===
    ...actions,

    // === ADDITIONAL ACTIONS ===
    loadRecommendations: (params?: MatchQueryParams) => {
      void dispatch(fetchMatches(params ?? {}));
    },
    clearError: () => {
      dispatch(clearError());
    },
    dismissError: () => {
      dispatch(clearError());
    },
  };
};

export default useMatchmaking;
