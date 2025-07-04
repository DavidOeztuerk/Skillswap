// src/hooks/useMatchmaking.ts
import { useEffect, useCallback } from 'react';
import {
  // fetchMatches,
  findMatch,
  acceptMatch,
  rejectMatch,
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
  createMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
} from '../features/matchmaking/matchmakingSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { MatchRequest } from '../types/contracts/requests/MatchRequest';
import { Match, MatchStatus } from '../types/models/Match';
import { CreateMatchRequest } from '../types/contracts/requests/CreateMatchRequest';

/**
 * Hook für Matchmaking-Funktionalität
 * Bietet Methoden für das Suchen und Verwalten von Skill-Matches
 */
export const useMatchmaking = () => {
  const dispatch = useAppDispatch();
  const {
    matches,
    matchResults,
    activeMatch,
    incomingRequests,
    outgoingRequests,
    isLoading,
    error,
    matchRequestSent,
  } = useAppSelector((state) => state.matchmaking);

  /**
   * Lädt alle Matches für den aktuellen Benutzer
   */
  const loadMatches = useCallback(async (): Promise<void> => {
    // await dispatch(fetchMatches(null));
  }, []);

  /**
   * ✅ NEU: Lädt alle eingehenden Match-Anfragen
   */
  const loadIncomingRequests = useCallback(async (): Promise<boolean> => {
    const resultAction = await dispatch(fetchIncomingMatchRequests());
    return fetchIncomingMatchRequests.fulfilled.match(resultAction);
  }, [dispatch]);

  /**
   * ✅ NEU: Lädt alle ausgehenden Match-Anfragen
   */
  const loadOutgoingRequests = useCallback(async (): Promise<boolean> => {
    const resultAction = await dispatch(fetchOutgoingMatchRequests());
    return fetchOutgoingMatchRequests.fulfilled.match(resultAction);
  }, [dispatch]);

  // Lade Matches beim ersten Rendern
  useEffect(() => {
    void loadMatches();
    void loadIncomingRequests();
    void loadOutgoingRequests();
  }, [loadMatches, loadIncomingRequests, loadOutgoingRequests]);

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
    matchRequest: MatchRequest
  ): Promise<boolean> => {
    const resultAction = await dispatch(findMatch(matchRequest));
    return findMatch.fulfilled.match(resultAction);
  };

  /**
   * ✅ NEU: Akzeptiert eine eingehende Match-Anfrage
   * @param requestId - ID der zu akzeptierenden Match-Anfrage
   * @returns Das resultierende Match oder null bei Fehler
   */
  const approveMatchRequest = async (
    requestId: string
  ): Promise<Match | null> => {
    const resultAction = await dispatch(acceptMatchRequest(requestId));

    if (acceptMatchRequest.fulfilled.match(resultAction)) {
      return resultAction.payload;
    }

    return null;
  };

  /**
   * ✅ NEU: Lehnt eine eingehende Match-Anfrage ab
   * @param requestId - ID der abzulehnenden Match-Anfrage
   * @param reason - Optionaler Ablehnungsgrund
   * @returns true bei Erfolg, false bei Fehler
   */
  const declineMatchRequest = async (
    requestId: string,
    reason?: string
  ): Promise<boolean> => {
    const resultAction = await dispatch(
      rejectMatchRequest({ requestId, reason })
    );
    return rejectMatchRequest.fulfilled.match(resultAction);
  };

  /**
   * Akzeptiert ein Match (bestehende Funktionalität)
   * @param matchId - ID des zu akzeptierenden Matches
   * @returns Das aktualisierte Match oder null bei Fehler
   */
  const approveMatch = async (matchId: string): Promise<Match | null> => {
    const resultAction = await dispatch(acceptMatch(matchId));

    if (acceptMatch.fulfilled.match(resultAction)) {
      return resultAction.payload;
    }

    return null;
  };

  /**
   * Lehnt ein Match ab (bestehende Funktionalität)
   * @param matchId - ID des abzulehnenden Matches
   * @returns Das aktualisierte Match oder null bei Fehler
   */
  const declineMatch = async (matchId: string): Promise<Match | null> => {
    const resultAction = await dispatch(rejectMatch(matchId));

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
  const getMatchesByStatus = (status: MatchStatus): Match[] => {
    return matches.filter((match) => match.status === status);
  };

  /**
   * Filtert Matches nach Rolle (Anforderer oder Antwortender)
   * @param isRequester - true für Anforderer, false für Antwortender
   * @returns Gefilterte Matches
   */
  const userId = useAppSelector((state) => state.auth.user?.id);

  const getMatchesByRole = (isRequester: boolean): Match[] => {
    if (!userId) return [];

    return matches.filter((match) =>
      isRequester ? match.requesterId === userId : match.responderId === userId
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
  ): MatchRequest[] => {
    const requests = incoming ? incomingRequests : outgoingRequests;
    return requests.filter((request) => request.status === status);
  };

  /**
   * Prüft, ob ein Match ausstehend ist
   * @param matchId - ID des zu prüfenden Matches
   * @returns true, wenn das Match ausstehend ist, sonst false
   */
  const isMatchPending = (matchId: string): boolean => {
    const match = matches.find((m) => m.id === matchId);
    return match?.status === MatchStatus.Pending;
  };

  return {
    // Daten
    matches,
    matchResults,
    activeMatch,
    incomingRequests,
    outgoingRequests,
    isLoading,
    error,
    matchRequestSent,

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
