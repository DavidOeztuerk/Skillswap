import { useEffect, useCallback, useRef } from 'react';
import {
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
  createMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  acceptMatchRequestOptimistic,
  rejectMatchRequestOptimistic,
  fetchUserMatches,
  fetchMatches,
} from '../features/matchmaking/matchmakingSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { MatchStatus, MatchDisplay, AcceptMatchRequestResponse } from '../types/display/MatchmakingDisplay';
import { CreateMatchRequest } from '../types/contracts/requests/CreateMatchRequest';
import { withDefault } from '../utils/safeAccess';
import { withOptimisticUpdate, generateUpdateId, canPerformOptimisticUpdate } from '../utils/optimisticUpdates';
import { ApiResponse } from '../types/common/ApiResponse';
import { serializeError, getErrorMessage } from '../utils/reduxHelpers';

export const useMatchmaking = () => {
  const dispatch = useAppDispatch();
  const didInit = useRef(false);
  const {
    matches, incomingRequests, outgoingRequests,
    isLoading, error, matchRequestSent, currentThread,
  } = useAppSelector((s) => s.matchmaking);

  const loadMatches = useCallback(async (params: { page?: number; limit?: number; status?: string } = {}) => {
    console.log('📥 [useMatchmaking] Loading matches with params:', params);
    
    try {
      const r = await dispatch(fetchUserMatches(params));
      const success = fetchUserMatches.fulfilled.match(r);
      
      if (success) {
        console.log('✅ [useMatchmaking] Matches loaded successfully');
      } else if (process.env.NODE_ENV === 'development') {
        // Keep minimal logging for development debugging
        console.error('❌ [useMatchmaking] Failed to load matches - error handled by slice');
      }
      
      return success;
    } catch (error) {
      // Error is already handled by the Redux slice, just return failure
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Unexpected error:', getErrorMessage(error));
      }
      return false;
    }
  }, [dispatch]);

  const loadIncomingRequests = useCallback(async (params = {}): Promise<boolean> => {
    try {
      const r = await dispatch(fetchIncomingMatchRequests(params));
      return fetchIncomingMatchRequests.fulfilled.match(r);
    } catch (error) {
      // Error is already handled by the Redux slice
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Unexpected error loading incoming requests:', getErrorMessage(error));
      }
      return false;
    }
  }, [dispatch]);

  const loadOutgoingRequests = useCallback(async (params = {}): Promise<boolean> => {
    try {
      const r = await dispatch(fetchOutgoingMatchRequests(params));
      return fetchOutgoingMatchRequests.fulfilled.match(r);
    } catch (error) {
      // Error is already handled by the Redux slice
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Unexpected error loading outgoing requests:', getErrorMessage(error));
      }
      return false;
    }
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    // Guard against duplicate initialization in StrictMode
    if (didInit.current) {
      console.log('⏭️ [useMatchmaking] Already initialized, skipping');
      return;
    }
    didInit.current = true;
    
    console.log('🚀 [useMatchmaking] Initial load of all match data');
    
    const loadInitialData = async () => {
      try {
        if (!isMounted) return;
        
        await Promise.all([
          dispatch(fetchUserMatches({})),
          dispatch(fetchIncomingMatchRequests({})),
          dispatch(fetchOutgoingMatchRequests({})),
        ]);
      } catch (error) {
        // Error is already handled by the Redux slice
        if (isMounted && process.env.NODE_ENV === 'development') {
          console.error('❌ [useMatchmaking] Unexpected error during initial load:', getErrorMessage(error));
        }
      }
    };
    
    loadInitialData();
    
    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
      // Reset for next mount in StrictMode
      didInit.current = false;
    };
  }, [dispatch]);

  const sendMatchRequest = async (req: CreateMatchRequest): Promise<boolean> => {
    console.log('🚀 [useMatchmaking] Sending match request:', req);
    
    try {
      const r = await dispatch(createMatchRequest(req as any));
      const success = createMatchRequest.fulfilled.match(r);
      
      if (success) {
        console.log('✅ [useMatchmaking] Match request sent successfully');
      } else if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Match request failed - error handled by slice');
      }
      
      return success;
    } catch (error) {
      // Error is already handled by the Redux slice
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Unexpected error sending match request:', getErrorMessage(error));
      }
      return false;
    }
  };

  const search = async (req: CreateMatchRequest): Promise<boolean> => {
    try {
      const r = await dispatch(fetchMatches(req as any));
      return fetchMatches.fulfilled.match(r);
    } catch (error) {
      // Error is already handled by the Redux slice
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Unexpected error searching matches:', getErrorMessage(error));
      }
      return false;
    }
  };

  const approveMatchRequest = async (
    requestId: string,
    responseMessage?: string
  ): Promise<ApiResponse<AcceptMatchRequestResponse> | null> => {
    if (!canPerformOptimisticUpdate()) {
      const r = await dispatch(acceptMatchRequest({ requestId, request: { responseMessage } }));
      return acceptMatchRequest.fulfilled.match(r) ? r.payload : null;
    }
    const id = generateUpdateId('accept_match');
    const res = await withOptimisticUpdate(
      id,
      () => dispatch(acceptMatchRequestOptimistic(requestId)),
      async () => {
        const r = await dispatch(acceptMatchRequest({ requestId, request: { responseMessage } }));
        if (!acceptMatchRequest.fulfilled.match(r)) throw new Error('Failed to accept match');
        return r.payload;
      },
      () => {},
      { showSuccess: true, successMessage: 'Match request accepted', errorMessage: 'Failed to accept match request' }
    );
    return res;
  };

  const declineMatchRequest = async (requestId: string, responseMessage?: string): Promise<boolean> => {
    if (!canPerformOptimisticUpdate()) {
      const r = await dispatch(rejectMatchRequest({ requestId, request: { responseMessage } }));
      return rejectMatchRequest.fulfilled.match(r);
    }
    const id = generateUpdateId('reject_match');
    const res = await withOptimisticUpdate(
      id,
      () => dispatch(rejectMatchRequestOptimistic(requestId)),
      async () => {
        const r = await dispatch(rejectMatchRequest({ requestId, request: { responseMessage } }));
        if (!rejectMatchRequest.fulfilled.match(r)) throw new Error('Failed to reject match');
        return r;
      },
      () => {},
      { showSuccess: true, successMessage: 'Match request declined', errorMessage: 'Failed to decline match request' }
    );
    return res !== null;
  };

  const approveMatch = async (matchId: string, reason?: string): Promise<ApiResponse<AcceptMatchRequestResponse> | null> => {
    console.log('✅ [useMatchmaking] Approving match:', matchId, reason);
    
    try {
      const r = await dispatch(acceptMatchRequest({ requestId: matchId, request: { responseMessage: reason }}));
      const result = acceptMatchRequest.fulfilled.match(r) ? r.payload : null;
      
      if (result) {
        console.log('✅ [useMatchmaking] Match approved successfully:', result);
      } else if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Failed to approve match - error handled by slice');
      }
      
      return result;
    } catch (error) {
      // Error is already handled by the Redux slice
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Unexpected error approving match:', getErrorMessage(error));
      }
      return null;
    }
  };

  const declineMatch = async (matchId: string, reason?: string): Promise<any> => {
    try {
      const r = await dispatch(rejectMatchRequest({ requestId: matchId, request: { responseMessage: reason }}));
      return rejectMatchRequest.fulfilled.match(r) ? r.payload : null;
    } catch (error) {
      // Error is already handled by the Redux slice
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [useMatchmaking] Unexpected error declining match:', getErrorMessage(error));
      }
      return null;
    }
  };

  const getMatchesByStatus = (status: MatchStatus): MatchDisplay[] =>
    matches.filter((m) => m?.status === status.toLowerCase());

  const userId = useAppSelector((s) => s.auth.user?.id);
  const getMatchesByRole = (isRequester: boolean): MatchDisplay[] => {
    if (!userId) return [];
    return matches.filter((m) => isRequester ? m.requesterId === userId : m.responderId === userId);
  };

  const getRequestsByStatus = (status: string, incoming = true) =>
    (incoming ? incomingRequests : outgoingRequests).filter((r) => r?.status === status);

  const isMatchPending = (matchId: string) => matches.find((m) => m?.id === matchId)?.status === 'pending';

  return {
    matches, incomingRequests, outgoingRequests, activeMatch: currentThread,
    isLoading: withDefault(isLoading, false), error, matchRequestSent: withDefault(matchRequestSent, false),

    loadMatches, loadIncomingRequests, loadOutgoingRequests,
    sendMatchRequest, 
    submitMatchRequest: sendMatchRequest, // Alias for compatibility
    searchMatches: search,
    approveMatch, declineMatch, approveMatchRequest, declineMatchRequest,

    getMatchesByStatus, getMatchesByRole, getRequestsByStatus, isMatchPending,
  };
};
