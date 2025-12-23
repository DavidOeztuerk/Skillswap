import { apiClient } from '../../../core/api/apiClient';
import { MATCHMAKING_ENDPOINTS } from '../../../core/config/endpoints';
import type { ApiResponse, PagedResponse } from '../../../shared/types/api/UnifiedResponse';
import type {
  CreateMatchRequestRequest,
  CreateMatchRequestResponse,
  MatchRequestDisplay,
  MatchDisplay,
  AcceptMatchRequestRequest,
  AcceptMatchRequestResponse,
  RejectMatchRequestRequest,
  RejectMatchRequestResponse,
  CreateCounterOfferRequest,
  MatchThreadDisplay,
} from '../types/MatchmakingDisplay';

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
  async createMatchRequest(
    req: CreateMatchRequestRequest
  ): Promise<ApiResponse<CreateMatchRequestResponse>> {
    if (!req.skillId) throw new Error('Skill-ID ist erforderlich');
    if (!req.targetUserId) throw new Error('Target User-ID ist erforderlich');

    // Use default message if empty - don't block the request!
    const message = req.message.trim() || 'Ich möchte diesen Skill lernen';

    try {
      console.debug('📤 [MatchmakingService] Creating match request:', {
        skillId: req.skillId,
        targetUserId: req.targetUserId,
        message,
      });

      const response = await apiClient.post<CreateMatchRequestResponse>(
        MATCHMAKING_ENDPOINTS.REQUESTS.CREATE,
        { ...req, message }
      );

      console.debug('✅ [MatchmakingService] Match request created successfully');
      return response;
    } catch (error: unknown) {
      console.error('❌ [MatchmakingService] Failed to create match request:', error);
      // Log the actual error response data for debugging
      const apiError = error as APIError;
      if (apiError.response?.data !== undefined) {
        console.error('❌ [MatchmakingService] Error response data:', apiError.response.data);
      }
      throw error;
    }
  },

  async getIncomingMatchRequests(
    params: GetMatchRequestsParams
  ): Promise<PagedResponse<MatchRequestDisplay>> {
    try {
      return await apiClient.getPaged<MatchRequestDisplay>(
        MATCHMAKING_ENDPOINTS.REQUESTS.GET_INCOMING,
        params
      );
    } catch (error) {
      console.error('❌ [MatchmakingService] Failed to fetch incoming requests:', error);
      throw error;
    }
  },

  async getOutgoingMatchRequests(
    params: GetMatchRequestsParams
  ): Promise<PagedResponse<MatchRequestDisplay>> {
    return apiClient.getPaged<MatchRequestDisplay>(
      MATCHMAKING_ENDPOINTS.REQUESTS.GET_OUTGOING,
      params
    );
  },

  async getAcceptedMatchRequests(
    params: GetMatchRequestsParams
  ): Promise<PagedResponse<MatchDisplay>> {
    return apiClient.getPaged<MatchDisplay>(MATCHMAKING_ENDPOINTS.REQUESTS.GET_ACCEPTED, params);
  },

  async acceptMatchRequest(
    requestId: string,
    req: AcceptMatchRequestRequest
  ): Promise<ApiResponse<AcceptMatchRequestResponse>> {
    if (!requestId.trim()) throw new Error('Request-ID ist erforderlich');
    return apiClient.post<AcceptMatchRequestResponse>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT}/${requestId}/accept`,
      req
    );
  },

  async rejectMatchRequest(
    requestId: string,
    req: RejectMatchRequestRequest
  ): Promise<ApiResponse<RejectMatchRequestResponse>> {
    if (!requestId.trim()) throw new Error('Request-ID ist erforderlich');
    return apiClient.post<RejectMatchRequestResponse>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.REJECT}/${requestId}/reject`,
      req
    );
  },

  async createCounterOffer(
    req: CreateCounterOfferRequest
  ): Promise<ApiResponse<CreateMatchRequestResponse>> {
    if (!req.originalRequestId.trim()) throw new Error('Original Request-ID ist erforderlich');
    if (!req.message.trim()) throw new Error('Nachricht ist erforderlich');
    return apiClient.post<CreateMatchRequestResponse>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.COUNTER}/${req.originalRequestId}/counter`,
      req
    );
  },

  async getMatchRequestThread(threadId: string): Promise<ApiResponse<MatchThreadDisplay>> {
    if (!threadId.trim()) throw new Error('Thread-ID ist erforderlich');
    return apiClient.get<MatchThreadDisplay>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_THREAD}/${threadId}`
    );
  },

  async getUserMatches(params: GetMatchRequestsParams): Promise<PagedResponse<MatchDisplay>> {
    return apiClient.getPaged<MatchDisplay>(MATCHMAKING_ENDPOINTS.MATCHES.USER, params);
  },

  async searchMatches(req: CreateMatchRequestRequest): Promise<PagedResponse<MatchDisplay>> {
    // TODO: Backend should return PagedResponse<MatchDisplay> directly
    // Currently returns MatchDisplay[] wrapped in ApiResponse, needs type assertion
    const response = await apiClient.post<MatchDisplay[]>(
      MATCHMAKING_ENDPOINTS.MATCHES.SEARCH,
      req
    );
    return response as unknown as PagedResponse<MatchDisplay>;
  },

  async getMatchDetails(matchId: string): Promise<ApiResponse<MatchDisplay>> {
    if (!matchId.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.get<MatchDisplay>(`${MATCHMAKING_ENDPOINTS.MATCHES.DETAILS}/${matchId}`);
  },

  async dissolveMatch(
    matchId: string,
    reason: string
  ): Promise<ApiResponse<{ matchId: string; status: string; dissolvedAt: string }>> {
    if (!matchId.trim()) throw new Error('Match-ID ist erforderlich');
    if (!reason.trim()) throw new Error('Grund ist erforderlich');

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
    wouldMatchAgain = true
  ): Promise<ApiResponse<{ matchId: string; status: string; completedAt: string }>> {
    if (!matchId.trim()) throw new Error('Match-ID ist erforderlich');
    if (!rating || rating < 1 || rating > 5)
      throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    if (!sessionDurationMinutes || sessionDurationMinutes < 1)
      throw new Error('Session-Dauer ist erforderlich');

    return apiClient.post<{ matchId: string; status: string; completedAt: string }>(
      `${MATCHMAKING_ENDPOINTS.MATCHES.DETAILS}/${matchId}/complete`,
      {
        matchId,
        rating,
        sessionDurationMinutes,
        feedback,
        wouldMatchAgain,
      }
    );
  },
};

export default matchmakingService;
