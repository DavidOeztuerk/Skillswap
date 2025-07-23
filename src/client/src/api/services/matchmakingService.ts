// src/api/services/matchmakingService.ts
import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { User } from '../../types/models/User';
import { Match } from '../../types/models/Match';
import apiClient from '../apiClient';

interface MatchFilter {
  status?: string;
  role?: string;
}

/**
 * Service for matchmaking operations
 */
const matchmakingService = {
  /**
   * Find matches for a skill
   */
  async findMatch(request: MatchRequest): Promise<Match> {
    if (!request.skillId) throw new Error('Skill-ID ist erforderlich');
    return apiClient.post<Match>(MATCHMAKING_ENDPOINTS.FIND_MATCH, request);
  },

  /**
   * Get all matches for current user
   */
  async getMatches(filter?: MatchFilter): Promise<Match[]> {
    return apiClient.get<Match[]>(MATCHMAKING_ENDPOINTS.GET_USER_MATCHES, { filter });
  },

  /**
   * Get specific match by ID
   */
  async getMatch(matchSessionId: string): Promise<Match> {
    if (!matchSessionId?.trim()) throw new Error('Match-Session-ID ist erforderlich');
    return apiClient.get<Match>(`${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchSessionId}`);
  },

  /**
   * Accept a match
   */
  async acceptMatch(matchSessionId: string): Promise<Match> {
    if (!matchSessionId?.trim()) throw new Error('Match-Session-ID ist erforderlich');
    return apiClient.post<Match>(`${MATCHMAKING_ENDPOINTS.ACCEPT_MATCH}/${matchSessionId}/accept`);
  },

  /**
   * Reject a match
   */
  async rejectMatch(matchSessionId: string): Promise<Match> {
    if (!matchSessionId?.trim()) throw new Error('Match-Session-ID ist erforderlich');
    return apiClient.post<Match>(`${MATCHMAKING_ENDPOINTS.REJECT_MATCH}/${matchSessionId}/reject`);
  },

  /**
   * Create direct match request to specific user
   */
  async createMatchRequest(request: CreateMatchRequest): Promise<MatchRequest> {
    if (!request.targetUserId) throw new Error('Ziel-User-ID ist erforderlich');
    if (!request.skillId) throw new Error('Skill-ID ist erforderlich');
    return apiClient.post<MatchRequest>(MATCHMAKING_ENDPOINTS.CREATE_MATCH_REQUEST, request);
  },

  /**
   * Get incoming match requests
   */
  async getIncomingMatchRequests(): Promise<MatchRequest[]> {
    return apiClient.get<MatchRequest[]>(MATCHMAKING_ENDPOINTS.GET_INCOMING_REQUESTS);
  },

  /**
   * Get outgoing match requests
   */
  async getOutgoingMatchRequests(): Promise<MatchRequest[]> {
    return apiClient.get<MatchRequest[]>(MATCHMAKING_ENDPOINTS.GET_OUTGOING_REQUESTS);
  },

  /**
   * Accept match request
   */
  async acceptMatchRequest(requestId: string): Promise<Match> {
    if (!requestId?.trim()) throw new Error('Anfrage-ID ist erforderlich');
    return apiClient.post<Match>(`${MATCHMAKING_ENDPOINTS.ACCEPT_MATCH_REQUEST}/${requestId}/accept`);
  },

  /**
   * Reject match request
   */
  async rejectMatchRequest(requestId: string, reason?: string): Promise<void> {
    if (!requestId?.trim()) throw new Error('Anfrage-ID ist erforderlich');
    return apiClient.post<void>(
      `${MATCHMAKING_ENDPOINTS.REJECT_MATCH_REQUEST}/${requestId}/reject`,
      { reason }
    );
  },

  /**
   * Search potential matches without creating request
   */
  async searchPotentialMatches(skillId: string, isLearningMode: boolean): Promise<User[]> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.get<User[]>(`${MATCHMAKING_ENDPOINTS.FIND_MATCH}/potential`, {
      skillId,
      isLearningMode,
    });
  },
};

export default matchmakingService;