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
    return apiClient.post<Match>(MATCHMAKING_ENDPOINTS.FIND_MATCHES, request);
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
    return apiClient.post<MatchRequest>(MATCHMAKING_ENDPOINTS.REQUESTS.CREATE, request);
  },

  /**
   * Get incoming match requests
   */
  async getIncomingMatchRequests(): Promise<MatchRequest[]> {
    return apiClient.get<MatchRequest[]>(MATCHMAKING_ENDPOINTS.REQUESTS.GET_INCOMING);
  },

  /**
   * Get outgoing match requests
   */
  async getOutgoingMatchRequests(): Promise<MatchRequest[]> {
    return apiClient.get<MatchRequest[]>(MATCHMAKING_ENDPOINTS.REQUESTS.GET_OUTGOING);
  },

  /**
   * Accept match request
   */
  async acceptMatchRequest(requestId: string): Promise<Match> {
    if (!requestId?.trim()) throw new Error('Anfrage-ID ist erforderlich');
    return apiClient.post<Match>(`${MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT}/${requestId}/accept`);
  },

  /**
   * Reject match request
   */
  async rejectMatchRequest(requestId: string, reason?: string): Promise<void> {
    if (!requestId?.trim()) throw new Error('Anfrage-ID ist erforderlich');
    return apiClient.post<void>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.REJECT}/${requestId}/reject`,
      { reason }
    );
  },

  /**
   * Search potential matches without creating request
   */
  async searchPotentialMatches(skillId: string, isLearningMode: boolean): Promise<User[]> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.get<User[]>(`${MATCHMAKING_ENDPOINTS.FIND_MATCHES}/potential`, {
      skillId,
      isLearningMode,
    });
  },

  /**
   * Get user matches with pagination
   */
  async getUserMatches(params?: { page?: number; limit?: number; status?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    
    const url = `${MATCHMAKING_ENDPOINTS.GET_USER_MATCHES}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<any>(url);
  },

  /**
   * Get match details by ID
   */
  async getMatchDetails(matchId: string): Promise<Match> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.get<Match>(`${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchId}`);
  },

  /**
   * Cancel a match
   */
  async cancelMatch(matchId: string, reason?: string): Promise<Match> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.post<Match>(`${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchId}/cancel`, {
      reason,
    });
  },

  /**
   * Update match preferences
   */
  async updateMatchPreferences(preferences: {
    availableHours: string[];
    preferredLanguages: string[];
    experienceLevel: string;
    learningGoals: string[];
  }): Promise<any> {
    return apiClient.put<any>(`${MATCHMAKING_ENDPOINTS.GET_USER_MATCHES}/preferences`, preferences);
  },

  /**
   * Rate a completed match
   */
  async rateMatch(matchId: string, rating: number, feedback?: string): Promise<Match> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    return apiClient.post<Match>(`${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchId}/rate`, {
      rating,
      feedback,
    });
  },

  /**
   * Get match statistics
   */
  async getMatchStatistics(): Promise<any> {
    return apiClient.get<any>(`${MATCHMAKING_ENDPOINTS.GET_USER_MATCHES}/statistics`);
  },

  /**
   * Get recommended matches for a skill
   */
  async getRecommendedMatches(skillId: string): Promise<Match[]> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.get<Match[]>(`${MATCHMAKING_ENDPOINTS.FIND_MATCHES}/recommendations?skillId=${skillId}`);
  },

  /**
   * Report a problematic match
   */
  async reportMatch(matchId: string, reason: string, description: string): Promise<void> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    if (!reason?.trim()) throw new Error('Grund ist erforderlich');
    return apiClient.post<void>(`${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchId}/report`, {
      reason,
      description,
    });
  },
};

export default matchmakingService;