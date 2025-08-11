import { useEffect, useCallback } from 'react';
import {
  findMatch,
  acceptMatch,
  rejectMatch,
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
  createMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  getUserMatches,
  acceptMatchRequestOptimistic,
  rejectMatchRequestOptimistic,
} from '../features/matchmaking/matchmakingSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { MatchStatus, MatchDisplay, AcceptMatchRequestResponse, RejectMatchRequestResponse } from '../types/display/MatchmakingDisplay';
import { CreateMatchRequest } from '../types/contracts/requests/CreateMatchRequest';
import { FindMatchRequest } from '../api/services/matchmakingService';
import { withDefault } from '../utils/safeAccess';
import { withOptimisticUpdate, generateUpdateId, canPerformOptimisticUpdate } from '../utils/optimisticUpdates';
import { ApiResponse } from '../types/common/ApiResponse';

/**
 * Hook für Matchmaking-Funktionalität
 * Bietet Methoden für das Suchen und Verwalten von Skill-Matches
 */
export const useMatchmaking = () => {
  const dispatch = useAppDispatch();
  const {
    matches,
    incomingRequests,
    outgoingRequests,
    isLoading,
    error,
    matchRequestSent,
    currentThread,
  } = useAppSelector((state) => state.matchmaking);
  
  // Legacy compatibility
  const matchResults = matches; // Alias for compatibility
  const activeMatch = currentThread; // Alias for compatibility

  /**
   * Lädt alle Matches für den aktuellen Benutzer
   */
  const loadMatches = useCallback(async (params: { page?: number; limit?: number; status?: string } = {}): Promise<boolean> => {
    const resultAction = await dispatch(getUserMatches(params));
    return getUserMatches.fulfilled.match(resultAction);
  }, [dispatch]);

  /**
   * ✅ NEU: Lädt alle eingehenden Match-Anfragen
   */
  const loadIncomingRequests = useCallback(async (params = {}): Promise<boolean> => {
    const resultAction = await dispatch(fetchIncomingMatchRequests(params));
    return fetchIncomingMatchRequests.fulfilled.match(resultAction);
  }, [dispatch]);

  /**
   * ✅ NEU: Lädt alle ausgehenden Match-Anfragen
   */
  const loadOutgoingRequests = useCallback(async (params = {}): Promise<boolean> => {
    const resultAction = await dispatch(fetchOutgoingMatchRequests(params));
    return fetchOutgoingMatchRequests.fulfilled.match(resultAction);
  }, [dispatch]);

  // Lade Matches beim ersten Rendern
  useEffect(() => {
    // Funktionen innerhalb des useEffect aufrufen, um keine Functions als Dependencies zu haben
    const loadInitialData = async () => {
      await Promise.all([
        dispatch(getUserMatches({})),
        dispatch(fetchIncomingMatchRequests({})),
        dispatch(fetchOutgoingMatchRequests({}))
      ]);
    };
    
    void loadInitialData();
  }, [dispatch]); // Nur dispatch als Dependency, welches stabil ist

  /**
   * ✅ NEU: Erstellt eine manuelle Match-Anfrage (das was wir brauchen!)
   * @param matchRequest - Anfragedaten für die direkte Match-Anfrage
   * @returns true bei Erfolg, false bei Fehler
   */
  const sendMatchRequest = async (
    matchRequest: CreateMatchRequest
  ): Promise<boolean> => {
    const resultAction = await dispatch(createMatchRequest(matchRequest));
    return createMatchRequest.fulfilled.match(resultAction);
  };

  /**
   * Sucht nach passenden Nutzern für einen bestimmten Skill (automatisch)
   * @param matchRequest - Anfragedaten für das automatische Matching
   * @returns true bei Erfolg, false bei Fehler
   */
  const searchMatches = async (
    matchRequest: FindMatchRequest
  ): Promise<boolean> => {
    const resultAction = await dispatch(findMatch(matchRequest));
    return findMatch.fulfilled.match(resultAction);
  };

  /**
   * ✅ NEU: Akzeptiert eine eingehende Match-Anfrage
   * @param requestId - ID der zu akzeptierenden Match-Anfrage
   * @param responseMessage - Optionale Antwort-Nachricht
   * @returns Das resultierende Match oder null bei Fehler
   */
  const approveMatchRequest = async (
    requestId: string,
    responseMessage?: string
  ): Promise<ApiResponse<AcceptMatchRequestResponse> | null> => {
    if (!canPerformOptimisticUpdate()) {
      // Fallback to regular update if offline
      const resultAction = await dispatch(acceptMatchRequest({ 
        requestId,
        request: { responseMessage }
      }));
      return acceptMatchRequest.fulfilled.match(resultAction) ? resultAction.payload : null;
    }

    const updateId = generateUpdateId('accept_match');
    
    const result = await withOptimisticUpdate(
      updateId,
      // Optimistic action
      () => dispatch(acceptMatchRequestOptimistic(requestId)),
      // Async action
      async () => {
        const resultAction = await dispatch(acceptMatchRequest({ 
          requestId,
          request: { responseMessage }
        }));
        if (!acceptMatchRequest.fulfilled.match(resultAction)) {
          throw new Error('Failed to accept match');
        }
        return resultAction.payload;
      },
      // Rollback action
      () => {
      },
      // Options
      {
        showSuccess: true,
        successMessage: 'Match request accepted',
        errorMessage: 'Failed to accept match request',
      }
    );
    
    return result;
  };

  /**
   * ✅ NEU: Lehnt eine eingehende Match-Anfrage ab
   * @param requestId - ID der abzulehnenden Match-Anfrage
   * @param responseMessage - Optionale Ablehnungs-Nachricht
   * @returns true bei Erfolg, false bei Fehler
   */
  const declineMatchRequest = async (
    requestId: string,
    responseMessage?: string
  ): Promise<boolean> => {
    if (!canPerformOptimisticUpdate()) {
      // Fallback to regular update if offline
      const resultAction = await dispatch(
        rejectMatchRequest({ 
          requestId,
          request: { responseMessage }
        })
      );
      return rejectMatchRequest.fulfilled.match(resultAction);
    }

    const updateId = generateUpdateId('reject_match');
    
    const result = await withOptimisticUpdate(
      updateId,
      // Optimistic action
      () => dispatch(rejectMatchRequestOptimistic(requestId)),
      // Async action
      async () => {
        const resultAction = await dispatch(
          rejectMatchRequest({ 
            requestId,
            request: { responseMessage }
          })
        );
        if (!rejectMatchRequest.fulfilled.match(resultAction)) {
          throw new Error('Failed to reject match');
        }
        return resultAction;
      },
      // Rollback action
      () =>{},
      // Options
      {
        showSuccess: true,
        successMessage: 'Match request declined',
        errorMessage: 'Failed to decline match request',
      }
    );
    
    return result !== null;
  };

  /**
   * Akzeptiert ein Match (bestehende Funktionalität)
   * @param matchId - ID des zu akzeptierenden Matches
   * @returns Das aktualisierte Match oder null bei Fehler
   */
  const approveMatch = async (matchId: string, reason?: string ): Promise<ApiResponse<AcceptMatchRequestResponse> | null> => {
    const resultAction = await dispatch(acceptMatch({ requestId: matchId, request: { responseMessage: reason }}));

    if (acceptMatch.fulfilled.match(resultAction)) {
      return resultAction.payload;
    }

    return null;
  };

  /**
   * Lehnt ein Match ab (bestehende Funktionalität)
   * @param matchId - ID des abzulehnenden Matches
   * @param reason - Optionaler Ablehnungsgrund
   * @returns Das aktualisierte Match oder null bei Fehler
   */
  const declineMatch = async (matchId: string, reason?: string): Promise<ApiResponse<RejectMatchRequestResponse> | null> => {
    const resultAction = await dispatch(rejectMatch({ requestId: matchId, request: {responseMessage: reason }}));

    if (rejectMatch.fulfilled.match(resultAction)) {
      return resultAction.payload;
    }

    return null;
  };

  /**
   * Filtert Matches nach Status
   * @param status - Zu filternder Status
   * @returns Gefilterte Matches
   */
  const getMatchesByStatus = (status: MatchStatus): MatchDisplay[] => {
    const safeMatches = matches;
    return safeMatches.filter((match) => match?.status === status.toLowerCase() as any);
  };

  /**
   * Filtert Matches nach Rolle (Anforderer oder Antwortender)
   * @param isRequester - true für Anforderer, false für Antwortender
   * @returns Gefilterte Matches
   */
  const userId = useAppSelector((state) => state.auth.user?.id);

  const getMatchesByRole = (isRequester: boolean): MatchDisplay[] => {
    if (!userId) return [];

    const safeMatches = matches;
    return safeMatches.filter((match) =>
      match && (isRequester ? match.requesterId === userId : match.responderId === userId)
    );
  };

  /**
   * ✅ NEU: Filtert Match-Anfragen nach Status
   * @param status - Zu filternder Status
   * @param incoming - true für eingehende, false für ausgehende Anfragen
   * @returns Gefilterte Match-Anfragen
   */
  const getRequestsByStatus = (
    status: string,
    incoming: boolean = true
  ) => {
    const requests = incoming ? incomingRequests : outgoingRequests;
    return requests.filter((request) => request?.status === status);
  };

  /**
   * Prüft, ob ein Match ausstehend ist
   * @param matchId - ID des zu prüfenden Matches
   * @returns true, wenn das Match ausstehend ist, sonst false
   */
  const isMatchPending = (matchId: string): boolean => {
    const safeMatches = matches;
    const match = safeMatches.find((m) => m?.id === matchId);
    return match?.status === 'pending';
  };

  return {
    // Daten
    matches: matches,
    matchResults: matchResults,
    activeMatch,
    incomingRequests: incomingRequests,
    outgoingRequests: outgoingRequests,
    isLoading: withDefault(isLoading, false),
    error,
    matchRequestSent: withDefault(matchRequestSent, false),

    // Aktionen
    loadMatches,
    loadIncomingRequests,
    loadOutgoingRequests,
    sendMatchRequest,
    searchMatches,
    approveMatch,
    declineMatch,
    approveMatchRequest,
    declineMatchRequest,

    // Hilfsfunktionen
    getMatchesByStatus,
    getMatchesByRole,
    getRequestsByStatus,
    isMatchPending,
  };
};
