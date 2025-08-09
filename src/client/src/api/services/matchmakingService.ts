import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import httpClient from '../httpClient';
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
  MatchDisplay
} from '../../types/display/MatchmakingDisplay';

export interface GetMatchRequestsParams {
  pageNumber?: number;
  pageSize?: number;
  page?: number;
  limit?: number;
  status?: string;
}

// Legacy alias for backwards compatibility
export type FindMatchRequest = CreateMatchRequestRequest;

/**
 * New matchmaking service - direct display data, no transformations
 */
const matchmakingService = {
  /**
   * Create a match request
   */
  async createMatchRequest(request: CreateMatchRequestRequest): Promise<ApiResponse<CreateMatchRequestResponse>> {
    if (!request.skillId) throw new Error('Skill-ID ist erforderlich');
    if (!request.targetUserId) throw new Error('Target User-ID ist erforderlich');
    if (!request.message?.trim()) throw new Error('Nachricht ist erforderlich');
    
    return httpClient.post<ApiResponse<CreateMatchRequestResponse>>(MATCHMAKING_ENDPOINTS.REQUESTS.CREATE, request);
  },

  /**
   * Get incoming match requests - returns display-ready data
   */
  async getIncomingMatchRequests(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchRequestDisplay[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || params.page || 1).toString());
    queryParams.append('PageSize', (params.pageSize || params.limit || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_INCOMING}?${queryParams.toString()}`;
    return httpClient.get<PagedResponse<MatchRequestDisplay[]>>(url);
  },

  /**
   * Get outgoing match requests - returns display-ready data
   */
  async getOutgoingMatchRequests(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchRequestDisplay[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || params.page || 1).toString());
    queryParams.append('PageSize', (params.pageSize || params.limit || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_OUTGOING}?${queryParams.toString()}`;
    return httpClient.get<PagedResponse<MatchRequestDisplay[]>>(url);
  },

  /**
   * Get accepted match requests (actual matches) - returns display-ready data
   */
  async getAcceptedMatchRequests(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchDisplay[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || params.page || 1).toString());
    queryParams.append('PageSize', (params.pageSize || params.limit || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_ACCEPTED}?${queryParams.toString()}`;
    return httpClient.get<PagedResponse<MatchDisplay[]>>(url);
  },

  /**
   * Accept a match request
   */
  async acceptMatchRequest(request: AcceptMatchRequestRequest): Promise<ApiResponse<string>> {
    if (!request.requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    
    const response = await httpClient.post<ApiResponse<string>>(MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT, request);
    // Return the request ID if successful
    if (response.success) {
      return { ...response, data: request.requestId };
    }
    return response;
  },

  /**
   * Reject a match request
   */
  async rejectMatchRequest(request: RejectMatchRequestRequest): Promise<ApiResponse<string>> {
    if (!request.requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    
    const response = await httpClient.post<ApiResponse<string>>(MATCHMAKING_ENDPOINTS.REQUESTS.REJECT, request);
    // Return the request ID if successful
    if (response.success) {
      return { ...response, data: request.requestId };
    }
    return response;
  },

  /**
   * Create a counter offer
   */
  async createCounterOffer(request: CreateCounterOfferRequest): Promise<ApiResponse<CreateMatchRequestResponse>> {
    if (!request.originalRequestId?.trim()) throw new Error('Original Request-ID ist erforderlich');
    if (!request.message?.trim()) throw new Error('Nachricht ist erforderlich');
    
    return httpClient.post<ApiResponse<CreateMatchRequestResponse>>(`${MATCHMAKING_ENDPOINTS.REQUESTS.COUNTER}/${request.originalRequestId}/counter`, request);
  },

  /**
   * Get match request thread - returns display-ready data
   */
  async getMatchRequestThread(threadId: string): Promise<ApiResponse<MatchThreadDisplay>> {
    if (!threadId?.trim()) throw new Error('Thread-ID ist erforderlich');
    
    return httpClient.get<ApiResponse<MatchThreadDisplay>>(`${MATCHMAKING_ENDPOINTS.REQUESTS.GET_THREAD}/${threadId}`);
  },

  /**
   * Get user matches - returns display-ready data
   */
  async getUserMatches(params: GetMatchRequestsParams = {}): Promise<PagedResponse<MatchDisplay[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || params.page || 1).toString());
    queryParams.append('PageSize', (params.pageSize || params.limit || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.GET_USER_MATCHES}?${queryParams.toString()}`;
    return httpClient.get<PagedResponse<MatchDisplay[]>>(url);
  },

  /**
   * Search for matches
   */
  async searchMatches(request: CreateMatchRequestRequest): Promise<ApiResponse<MatchDisplay[]>> {
    return httpClient.post<ApiResponse<MatchDisplay[]>>(MATCHMAKING_ENDPOINTS.FIND_MATCHES, request);
  },

  /**
   * Get match details
   */
  async getMatchDetails(matchId: string): Promise<ApiResponse<MatchDisplay>> {
    if (!matchId?.trim()) throw new Error('Match-ID ist erforderlich');
    
    return httpClient.get<ApiResponse<MatchDisplay>>(`${MATCHMAKING_ENDPOINTS.GET_MATCH}/${matchId}`);
  },

  /**
   * Legacy alias for findMatch
   */
  async findMatch(request: FindMatchRequest): Promise<ApiResponse<MatchDisplay[]>> {
    return this.searchMatches(request);
  }
};

export default matchmakingService;