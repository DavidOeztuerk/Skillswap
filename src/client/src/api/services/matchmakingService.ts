// src/api/services/matchmakingService.ts
import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { User } from '../../types/models/User';
import apiClient from '../apiClient';

// Backend request interfaces matching backend contracts
export interface FindMatchRequest {
  SkillId: string;
  SkillName: string;
  IsOffering: boolean;
  PreferredTags?: string[];
  PreferredLocation?: string;
  RemoteOnly?: boolean;
  MaxDistanceKm?: number;
}

export interface GetUserMatchesRequest {
  Status?: string;
  IncludeCompleted?: boolean;
  PageNumber?: number;
  PageSize?: number;
}

export interface GetIncomingMatchRequestsRequest {
  PageNumber?: number;
  PageSize?: number;
}

export interface GetOutgoingMatchRequestsRequest {
  PageNumber?: number;
  PageSize?: number;
}

export interface UserMatchResponse {
  MatchId: string;
  SkillName: string;
  Status: string;
  CompatibilityScore: number;
  IsOffering: boolean;
  CreatedAt: Date;
  AcceptedAt?: Date;
}

export interface PagedUserMatchesResponse {
  Data: UserMatchResponse[];
  PageNumber: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
  HasNextPage: boolean;
  HasPreviousPage: boolean;
}


/**
 * Service for matchmaking operations
 */
const matchmakingService = {
  /**
   * Find matches for a skill
   */
  async findMatch(request: FindMatchRequest): Promise<any> {
    if (!request.SkillId) throw new Error('Skill-ID ist erforderlich');
    return apiClient.post<any>(MATCHMAKING_ENDPOINTS.FIND_MATCHES, request);
  },

  /**
   * Get all matches for current user
   */
  async getMatches(request: GetUserMatchesRequest = {}): Promise<PagedUserMatchesResponse> {
    const params = new URLSearchParams();
    if (request.Status) params.append('Status', request.Status);
    if (request.IncludeCompleted !== undefined) params.append('IncludeCompleted', request.IncludeCompleted.toString());
    if (request.PageNumber) params.append('PageNumber', request.PageNumber.toString());
    if (request.PageSize) params.append('PageSize', request.PageSize.toString());
    
    const url = params.toString() ? `${MATCHMAKING_ENDPOINTS.GET_USER_MATCHES}?${params.toString()}` : MATCHMAKING_ENDPOINTS.GET_USER_MATCHES;
    return apiClient.get<PagedUserMatchesResponse>(url);
  },

  /**
   * Get specific match by ID
   */
  async getMatch(matchId: string): Promise<any> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.post<any>(`${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchId}`, { MatchId: matchId });
  },

  /**
   * Accept a match
   */
  async acceptMatch(matchId: string): Promise<any> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.post<any>(`${MATCHMAKING_ENDPOINTS.ACCEPT_MATCH}/${matchId}/accept`, { MatchId: matchId });
  },

  /**
   * Reject a match
   */
  async rejectMatch(matchId: string, reason?: string): Promise<any> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.post<any>(`${MATCHMAKING_ENDPOINTS.REJECT_MATCH}/${matchId}/reject`, { MatchId: matchId, Reason: reason });
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
  async getIncomingMatchRequests(request: GetIncomingMatchRequestsRequest = {}): Promise<any> {
    const params = new URLSearchParams();
    params.append('PageNumber', (request.PageNumber || 1).toString());
    params.append('PageSize', (request.PageSize || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_INCOMING}?${params.toString()}`;
    return apiClient.get<any>(url);
  },

  /**
   * Get outgoing match requests
   */
  async getOutgoingMatchRequests(request: GetOutgoingMatchRequestsRequest = {}): Promise<any> {
    const params = new URLSearchParams();
    params.append('PageNumber', (request.PageNumber || 1).toString());
    params.append('PageSize', (request.PageSize || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_OUTGOING}?${params.toString()}`;
    return apiClient.get<any>(url);
  },

  /**
   * Accept match request
   */
  async acceptMatchRequest(requestId: string, responseMessage?: string): Promise<any> {
    if (!requestId?.trim()) throw new Error('Anfrage-ID ist erforderlich');
    return apiClient.post<any>(MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT, {
      RequestId: requestId,
      ResponseMessage: responseMessage
    });
  },

  /**
   * Reject match request
   */
  async rejectMatchRequest(requestId: string, responseMessage?: string): Promise<any> {
    if (!requestId?.trim()) throw new Error('Anfrage-ID ist erforderlich');
    return apiClient.post<any>(MATCHMAKING_ENDPOINTS.REQUESTS.REJECT, {
      RequestId: requestId,
      ResponseMessage: responseMessage
    });
  },

  /**
   * Search potential matches without creating request - Note: This endpoint may not exist in backend
   */
  async searchPotentialMatches(skillId: string, _: boolean): Promise<User[]> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Search potential matches endpoint not implemented in backend');
  },

  /**
   * Get user matches with pagination (uses getMatches internally)
   */
  async getUserMatches(params?: { page?: number; limit?: number; status?: string }): Promise<PagedUserMatchesResponse> {
    const request: GetUserMatchesRequest = {
      PageNumber: params?.page || 1,
      PageSize: params?.limit || 20,
      Status: params?.status && params.status !== 'all' ? params.status : undefined,
      IncludeCompleted: true
    };
    return this.getMatches(request);
  },

  /**
   * Get match details by ID (uses getMatch internally)
   */
  async getMatchDetails(matchId: string): Promise<any> {
    return this.getMatch(matchId);
  },

  /**
   * Cancel a match - Note: This endpoint may not exist in backend
   */
  async cancelMatch(matchId: string, _reason?: string): Promise<any> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Cancel match endpoint not implemented in backend');
  },

  /**
   * Update match preferences - Note: This endpoint may not exist in backend
   */
  async updateMatchPreferences(_: {
    availableHours: string[];
    preferredLanguages: string[];
    experienceLevel: string;
    learningGoals: string[];
  }): Promise<any> {
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Update match preferences endpoint not implemented in backend');
  },

  /**
   * Rate a completed match - Note: This endpoint may not exist in backend
   */
  async rateMatch(matchId: string, rating: number, _?: string): Promise<any> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Rate match endpoint not implemented in backend');
  },

  /**
   * Get match statistics
   */
  async getMatchStatistics(fromDate?: Date, toDate?: Date): Promise<any> {
    const request = {
      FromDate: fromDate,
      ToDate: toDate
    };
    return apiClient.post<any>('/analytics/statistics', request);
  },

  /**
   * Get recommended matches for a skill - Note: This endpoint may not exist in backend
   */
  async getRecommendedMatches(skillId: string): Promise<any[]> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Recommended matches endpoint not implemented in backend');
  },

  /**
   * Report a problematic match - Note: This endpoint may not exist in backend
   */
  async reportMatch(matchId: string, reason: string, _description: string): Promise<void> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    if (!reason?.trim()) throw new Error('Grund ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Report match endpoint not implemented in backend');
  },
};

export default matchmakingService;