// src/hooks/useMatchmaking.ts
import { useEffect, useCallback } from 'react';
import {
  fetchMatches,
  findMatch,
  acceptMatch,
  rejectMatch,
} from '../features/matchmaking/matchmakingSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { MatchRequest } from '../types/contracts/requests/MatchRequest';
import { Match, MatchStatus } from '../types/models/Match';

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
    isLoading,
    error,
    matchRequestSent,
  } = useAppSelector((state) => state.matchmaking);

  /**
   * Lädt alle Matches für den aktuellen Benutzer
   */
  const loadMatches = useCallback(async (): Promise<void> => {
    await dispatch(fetchMatches(null));
  }, [dispatch]);

  // Lade Matches beim ersten Rendern
  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  /**
   * Sucht nach passenden Nutzern für einen bestimmten Skill
   * @param matchRequest - Anfragedaten für das Matching
   * @returns true bei Erfolg, false bei Fehler
   */
  const searchMatches = async (
    matchRequest: MatchRequest
  ): Promise<boolean> => {
    const resultAction = await dispatch(findMatch(matchRequest));
    return findMatch.fulfilled.match(resultAction);
  };

  /**
   * Akzeptiert ein Match
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
   * Lehnt ein Match ab
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
    isLoading,
    error,
    matchRequestSent,

    // Aktionen
    loadMatches,
    searchMatches,
    approveMatch,
    declineMatch,

    // Hilfsfunktionen
    getMatchesByStatus,
    getMatchesByRole,
    isMatchPending,
  };
};
