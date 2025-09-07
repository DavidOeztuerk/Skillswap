import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import { ApiResponse } from '../../types/common/ApiResponse';
import { PagedResponse } from '../../types/common/PagedResponse';
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
} from '../../types/display/MatchmakingDisplay';
import apiClient from '../apiClient';

export interface GetMatchRequestsParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
}

const qp = (p: GetMatchRequestsParams = {}) => {
  const pageNumber = (p.pageNumber ?? 1).toString();
  const pageSize = (p.pageSize ?? 12).toString();
  const q = new URLSearchParams();
  q.append('pageNumber', pageNumber);
  q.append('pageSize', pageSize);
  if (p.status) q.append('status', p.status);
  return `?${q.toString()}`;
};

const matchmakingService = {
  async createMatchRequest(req: CreateMatchRequestRequest): Promise<ApiResponse<CreateMatchRequestResponse>> {
    console.log('🚀 [MatchmakingService] Creating match request:', req);
    
    if (!req.skillId) throw new Error('Skill-ID ist erforderlich');
    if (!req.targetUserId) throw new Error('Target User-ID ist erforderlich');
    if (!req.message?.trim()) throw new Error('Nachricht ist erforderlich');
    
    try {
      const response = await apiClient.post<ApiResponse<CreateMatchRequestResponse>>(MATCHMAKING_ENDPOINTS.REQUESTS.CREATE, req);
      console.log('✅ [MatchmakingService] Match request created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ [MatchmakingService] Failed to create match request:', error);
      // Log the actual error response data for debugging
      if (error?.response?.data) {
        console.error('❌ [MatchmakingService] Error response data:', error.response.data);
      }
      throw error;
    }
  },

  async getIncomingMatchRequests(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchRequestDisplay>> {
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_INCOMING}${qp(params)}`;
    console.log('📥 [MatchmakingService] Fetching incoming requests:', url);
    
    try {
      const response = await apiClient.get<PagedResponse<MatchRequestDisplay>>(url);
      console.log('✅ [MatchmakingService] Incoming requests fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ [MatchmakingService] Failed to fetch incoming requests:', error);
      throw error;
    }
  },

  async getOutgoingMatchRequests(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchRequestDisplay>> {
    return apiClient.get<PagedResponse<MatchRequestDisplay>>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_OUTGOING}${qp(params)}`
    );
  },

  async getAcceptedMatchRequests(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchDisplay>> {
    return apiClient.get<PagedResponse<MatchDisplay>>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT}${qp(params)}`
    );
  },

  async acceptMatchRequest(requestId: string, req: AcceptMatchRequestRequest): Promise<ApiResponse<AcceptMatchRequestResponse>> {
    if (!requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    return apiClient.post<ApiResponse<AcceptMatchRequestResponse>>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT}/${requestId}/accept`,
      req
    );
  },

  async rejectMatchRequest(requestId: string, req: RejectMatchRequestRequest): Promise<ApiResponse<RejectMatchRequestResponse>> {
    if (!requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    return apiClient.post<ApiResponse<RejectMatchRequestResponse>>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.REJECT}/${requestId}/reject`,
      req
    );
  },

  async createCounterOffer(req: CreateCounterOfferRequest): Promise<ApiResponse<CreateMatchRequestResponse>> {
    if (!req.originalRequestId?.trim()) throw new Error('Original Request-ID ist erforderlich');
    if (!req.message?.trim()) throw new Error('Nachricht ist erforderlich');
    return apiClient.post<ApiResponse<CreateMatchRequestResponse>>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.COUNTER}/${req.originalRequestId}/counter`,
      req
    );
  },

  async getMatchRequestThread(threadId: string): Promise<ApiResponse<MatchThreadDisplay>> {
    if (!threadId?.trim()) throw new Error('Thread-ID ist erforderlich');
    return apiClient.get<ApiResponse<MatchThreadDisplay>>(
      `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_THREAD}/${threadId}`
    );
  },

  async getUserMatches(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchDisplay>> {
    return apiClient.get<PagedResponse<MatchDisplay>>(
      `${MATCHMAKING_ENDPOINTS.MATCHES.USER}${qp(params)}`
    );
  },

  async searchMatches(req: CreateMatchRequestRequest): Promise<PagedResponse<MatchDisplay>> {
    return apiClient.post<PagedResponse<MatchDisplay>>(MATCHMAKING_ENDPOINTS.MATCHES.SEARCH, req);
  },

  async getMatchDetails(matchId: string): Promise<ApiResponse<MatchDisplay>> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    return apiClient.get<ApiResponse<MatchDisplay>>(`${MATCHMAKING_ENDPOINTS.MATCHES.DETAILS}/${matchId}`);
  },

  async dissolveMatch(matchId: string, reason: string): Promise<ApiResponse<{ matchId: string; status: string; dissolvedAt: string }>> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    if (!reason?.trim()) throw new Error('Grund ist erforderlich');
    
    console.log('🔚 [MatchmakingService] Dissolving match:', matchId);
    
    return apiClient.post<ApiResponse<{ matchId: string; status: string; dissolvedAt: string }>>(
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
    
    console.log('✅ [MatchmakingService] Completing match:', matchId);
    
    return apiClient.post<ApiResponse<{ matchId: string; status: string; completedAt: string }>>(
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
