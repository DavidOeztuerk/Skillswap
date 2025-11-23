import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import { ApiResponse, PagedResponse } from '../../types/api/UnifiedResponse';
import { apiClient } from '../apiClient';
import {
  MatchThreadDisplay,
  CreateMatchRequestRequest,
  CreateMatchRequestResponse,
  AcceptMatchRequestRequest,
  RejectMatchRequestRequest,
  CreateCounterOfferRequest,
  MatchRequestDisplay,
  MatchDisplay,
  AcceptMatchRequestResponse,
  RejectMatchRequestResponse,
} from '../../types/contracts/MatchmakingDisplay';

interface APIError {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
}

export interface GetMatchRequestsParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  includeCompleted?: boolean;
}

const matchmakingService = {
  async createMatchRequest(req: CreateMatchRequestRequest): Promise<ApiResponse<CreateMatchRequestResponse>> {
    
    if (!req.skillId) throw new Error('Skill-ID ist erforderlich');
    if (!req.targetUserId) throw new Error('Target User-ID ist erforderlich');
    if (!req.message?.trim()) throw new Error('Nachricht ist erforderlich');
    
    try {
      const response = await apiClient.post<CreateMatchRequestResponse>(MATCHMAKING_ENDPOINTS.REQUESTS.CREATE, req);
      return response;
    } catch (error: unknown) {
      console.error('❌ [MatchmakingService] Failed to create match request:', error);
      // Log the actual error response data for debugging
      if ((error as APIError)?.response?.data) {
        console.error('❌ [MatchmakingService] Error response data:', (error as APIError).response?.data);
      }
      throw error;
    }
  },

  async getIncomingMatchRequests(params: GetMatchRequestsParams): Promise<PagedResponse<MatchRequestDisplay>> {
    try {
      const response = await apiClient.getPaged<MatchRequestDisplay>(
        MATCHMAKING_ENDPOINTS.REQUESTS.GET_INCOMING,
        params
      ) as PagedResponse<MatchRequestDisplay>;
      return response;
    } catch (error) {
      console.error('❌ [MatchmakingService] Failed to fetch incoming requests:', error);
      throw error;
    }
  },

  async getOutgoingMatchRequests(params: GetMatchRequestsParams): Promise<PagedResponse<MatchRequestDisplay>> {
    return await apiClient.getPaged<MatchRequestDisplay>(
      MATCHMAKING_ENDPOINTS.REQUESTS.GET_OUTGOING,
      params
    ) as PagedResponse<MatchRequestDisplay>;
  },

  async getAcceptedMatchRequests(params: GetMatchRequestsParams): Promise<PagedResponse<MatchDisplay>> {
    return await apiClient.getPaged<MatchDisplay>(
      MATCHMAKING_ENDPOINTS.REQUESTS.GET_ACCEPTED,
      params
    ) as PagedResponse<MatchDisplay>;
  },

  async acceptMatchRequest(requestId: string, req: AcceptMatchRequestRequest): Promise<ApiResponse<AcceptMatchRequestResponse>> {
    if (!requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    return apiClient.post<AcceptMatchRequestResponse>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT}/${requestId}/accept`,
      req
    );
  },

  async rejectMatchRequest(requestId: string, req: RejectMatchRequestRequest): Promise<ApiResponse<RejectMatchRequestResponse>> {
    if (!requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    return apiClient.post<RejectMatchRequestResponse>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.REJECT}/${requestId}/reject`,
      req
    );
  },

  async createCounterOffer(req: CreateCounterOfferRequest): Promise<ApiResponse<CreateMatchRequestResponse>> {
    if (!req.originalRequestId?.trim()) throw new Error('Original Request-ID ist erforderlich');
    if (!req.message?.trim()) throw new Error('Nachricht ist erforderlich');
    return apiClient.post<CreateMatchRequestResponse>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.COUNTER}/${req.originalRequestId}/counter`,
      req
    );
  },

  async getMatchRequestThread(threadId: string): Promise<ApiResponse<MatchThreadDisplay>> {
    if (!threadId?.trim()) throw new Error('Thread-ID ist erforderlich');
    return apiClient.get<MatchThreadDisplay>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_THREAD}/${threadId}`
    );
  },

  async getUserMatches(params: GetMatchRequestsParams): Promise<PagedResponse<MatchDisplay>> {
    return await apiClient.getPaged<MatchDisplay>(
      MATCHMAKING_ENDPOINTS.MATCHES.USER,
      params
    ) as PagedResponse<MatchDisplay>;
  },

  async searchMatches(req: CreateMatchRequestRequest): Promise<PagedResponse<MatchDisplay>> {
    // TODO: Backend should return PagedResponse<MatchDisplay> directly
    // Currently returns MatchDisplay[] wrapped in ApiResponse, needs type assertion
    const response = await apiClient.post<MatchDisplay[]>(MATCHMAKING_ENDPOINTS.MATCHES.SEARCH, req);
    return response as unknown as PagedResponse<MatchDisplay>;
  },

  async getMatchDetails(matchId: string): Promise<ApiResponse<MatchDisplay>> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.get<MatchDisplay>(`${MATCHMAKING_ENDPOINTS.MATCHES.DETAILS}/${matchId}`);
  },

  async dissolveMatch(matchId: string, reason: string): Promise<ApiResponse<{ matchId: string; status: string; dissolvedAt: string }>> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    if (!reason?.trim()) throw new Error('Grund ist erforderlich');
    
    
    return apiClient.post<{ matchId: string; status: string; dissolvedAt: string }>(
      `${MATCHMAKING_ENDPOINTS.MATCHES.DETAILS}/${matchId}/dissolve`,
      { reason }
    );
  },

  async completeMatch(
    matchId: string, 
    rating: number, 
    sessionDurationMinutes: number,
    feedback?: string,
    wouldMatchAgain: boolean = true
  ): Promise<ApiResponse<{ matchId: string; status: string; completedAt: string }>> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    if (!rating || rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    if (!sessionDurationMinutes || sessionDurationMinutes < 1) throw new Error('Session-Dauer ist erforderlich');
    
    
    return apiClient.post<{ matchId: string; status: string; completedAt: string }>(
      `${MATCHMAKING_ENDPOINTS.MATCHES.DETAILS}/${matchId}/complete`,
      { 
        matchId,
        rating, 
        sessionDurationMinutes,
        feedback,
        wouldMatchAgain
      }
    );
  },
};

export default matchmakingService;
