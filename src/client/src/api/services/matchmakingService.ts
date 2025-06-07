// src/api/services/matchmakingService.ts
import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
// import { ApiResponse } from '../../types/common/ApiResponse';
import { User } from '../../types/models/User';
// import { MatchFilter } from '../../types/models/MatchFilter';
import { Match } from '../../types/models/Match';
import apiClient from '../apiClient';

/**
 * Service für Matchmaking-Operationen
 */
const matchmakingService = {
  /**
   * Sucht nach passenden Nutzern für einen Skill
   * @param request - Anfragedaten für das Matching
   * @returns Match-Objekt
   */
  findMatch: async (request: MatchRequest): Promise<Match> => {
    const response = await apiClient.post<Match>(
      MATCHMAKING_ENDPOINTS.FIND_MATCH,
      request
    );
    return response.data;
  },

  /**
   * Holt alle Matches für den aktuellen Benutzer
   * @param filter - Optionaler Filter für Matches
   * @returns Liste von Matches
   */
  // getMatches: async (filter: MatchFilter | null): Promise<Match[]> => {
  //   const params = filter
  //     ? {
  //         status: filter.status,
  //         role: filter.role,
  //       }
  //     : {};

  //   const response = await apiClient.get<Match[]>(
  //     MATCHMAKING_ENDPOINTS.GET_USER_MATCHES,
  //     { params }
  //   );
  //   return response;
  // },

  /**
   * Holt ein spezifisches Match anhand seiner ID
   * @param matchSessionId - ID des Matches
   * @returns Das angeforderte Match
   */
  getMatch: async (matchSessionId: string): Promise<Match> => {
    const response = await apiClient.get<Match>(
      `${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchSessionId}`
    );
    return response.data;
  },

  /**
   * Akzeptiert ein Match
   * @param matchSessionId - ID des zu akzeptierenden Matches
   * @returns Das aktualisierte Match
   */
  acceptMatch: async (matchSessionId: string): Promise<Match> => {
    const response = await apiClient.post<Match>(
      `${MATCHMAKING_ENDPOINTS.ACCEPT_MATCH}/${matchSessionId}`
    );
    return response.data;
  },

  /**
   * Lehnt ein Match ab
   * @param matchSessionId - ID des abzulehnenden Matches
   * @returns Das aktualisierte Match
   */
  rejectMatch: async (matchSessionId: string): Promise<Match> => {
    const response = await apiClient.post<Match>(
      `${MATCHMAKING_ENDPOINTS.REJECT_MATCH}/${matchSessionId}`
    );
    return response.data;
  },

  /**
   * Sucht potentielle Matching-Partner ohne eine formelle Anfrage zu stellen
   * @param skillId - ID des Skills
   * @param isLearningMode - true, wenn der Benutzer lernen möchte
   * @returns Liste potentieller Matching-Partner
   */
  searchPotentialMatches: async (
    skillId: string,
    isLearningMode: boolean
  ): Promise<User[]> => {
    const response = await apiClient.get<User[]>(
      `${MATCHMAKING_ENDPOINTS.FIND_MATCH}/potential?skillId=${encodeURIComponent(skillId)}&isLearningMode=${encodeURIComponent(isLearningMode)}`
    );
    return response.data;
  },
};

export default matchmakingService;
