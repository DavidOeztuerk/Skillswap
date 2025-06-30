import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { User } from '../../types/models/User';
import { Match } from '../../types/models/Match';
import apiClient from '../apiClient';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';

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
  getMatches: async (filter?: {
    status?: string;
    role?: string;
  }): Promise<Match[]> => {
    const params = filter
      ? {
          status: filter.status,
          role: filter.role,
        }
      : {};

    const response = await apiClient.get<Match[]>(
      MATCHMAKING_ENDPOINTS.GET_USER_MATCHES,
      { params }
    );
    return response.data;
  },

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
      `${MATCHMAKING_ENDPOINTS.ACCEPT_MATCH}/${matchSessionId}/accept`
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
      `${MATCHMAKING_ENDPOINTS.REJECT_MATCH}/${matchSessionId}/reject`
    );
    return response.data;
  },

  /**
   * ✅ NEU: Erstellt eine manuelle Match-Anfrage an einen bestimmten User
   * @param request - Anfragedaten für die direkte Match-Anfrage
   * @returns MatchRequestRecord
   */
  createMatchRequest: async (
    request: CreateMatchRequest
  ): Promise<MatchRequest> => {
    const response = await apiClient.post<MatchRequest>(
      MATCHMAKING_ENDPOINTS.CREATE_MATCH_REQUEST,
      request
    );
    return response.data;
  },

  /**
   * ✅ NEU: Holt alle eingehenden Match-Anfragen
   * @returns Liste von eingehenden Match-Anfragen
   */
  getIncomingMatchRequests: async (): Promise<MatchRequest[]> => {
    const response = await apiClient.get<MatchRequest[]>(
      MATCHMAKING_ENDPOINTS.GET_INCOMING_REQUESTS
    );
    return response.data;
  },

  /**
   * ✅ NEU: Holt alle ausgehenden Match-Anfragen
   * @returns Liste von ausgehenden Match-Anfragen
   */
  getOutgoingMatchRequests: async (): Promise<MatchRequest[]> => {
    const response = await apiClient.get<MatchRequest[]>(
      MATCHMAKING_ENDPOINTS.GET_OUTGOING_REQUESTS
    );
    return response.data;
  },

  /**
   * ✅ NEU: Akzeptiert eine eingehende Match-Anfrage
   * @param requestId - ID der Match-Anfrage
   * @returns Das resultierende Match
   */
  acceptMatchRequest: async (requestId: string): Promise<Match> => {
    const response = await apiClient.post<Match>(
      `${MATCHMAKING_ENDPOINTS.ACCEPT_MATCH_REQUEST}/${requestId}/accept`
    );
    return response.data;
  },

  /**
   * ✅ NEU: Lehnt eine eingehende Match-Anfrage ab
   * @param requestId - ID der Match-Anfrage
   * @param reason - Optionaler Ablehnungsgrund
   * @returns Bestätigung
   */
  rejectMatchRequest: async (
    requestId: string,
    reason?: string
  ): Promise<void> => {
    await apiClient.post(
      `${MATCHMAKING_ENDPOINTS.REJECT_MATCH_REQUEST}/${requestId}/reject`,
      { reason }
    );
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
      `${MATCHMAKING_ENDPOINTS.FIND_MATCH}/potential`,
      {
        params: {
          skillId: skillId,
          isLearningMode: isLearningMode,
        },
      }
    );
    return response.data;
  },
};

export default matchmakingService;
