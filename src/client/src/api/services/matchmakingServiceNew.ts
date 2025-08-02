// New matchmaking service - display-focused, no transformations
import { MATCHMAKING_ENDPOINTS } from '../../config/endpoints';
import apiClient from '../apiClient';
import {
  MatchThreadDisplay,
  CreateMatchRequestRequest,
  CreateMatchRequestResponse,
  AcceptMatchRequestRequest,
  RejectMatchRequestRequest,
  CreateCounterOfferRequest,
  MatchRequestListResponse,
  MatchListResponse
} from '../../types/display/MatchmakingDisplay';

export interface GetMatchRequestsParams {
  pageNumber?: number;
  pageSize?: number;
}

/**
 * New matchmaking service - direct display data, no transformations
 */
const matchmakingService = {
  /**
   * Create a match request
   */
  async createMatchRequest(request: CreateMatchRequestRequest): Promise<CreateMatchRequestResponse> {
    if (!request.skillId) throw new Error('Skill-ID ist erforderlich');
    if (!request.targetUserId) throw new Error('Target User-ID ist erforderlich');
    if (!request.message?.trim()) throw new Error('Nachricht ist erforderlich');
    
    return apiClient.post<CreateMatchRequestResponse>(MATCHMAKING_ENDPOINTS.REQUESTS.CREATE, request);
  },

  /**
   * Get incoming match requests - returns display-ready data
   */
  async getIncomingMatchRequests(params: GetMatchRequestsParams = {}): Promise<MatchRequestListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || 1).toString());
    queryParams.append('PageSize', (params.pageSize || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_INCOMING}?${queryParams.toString()}`;
    return apiClient.get<MatchRequestListResponse>(url);
  },

  /**
   * Get outgoing match requests - returns display-ready data
   */
  async getOutgoingMatchRequests(params: GetMatchRequestsParams = {}): Promise<MatchRequestListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || 1).toString());
    queryParams.append('PageSize', (params.pageSize || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_OUTGOING}?${queryParams.toString()}`;
    return apiClient.get<MatchRequestListResponse>(url);
  },

  /**
   * Get accepted match requests (actual matches) - returns display-ready data
   */
  async getAcceptedMatchRequests(params: GetMatchRequestsParams = {}): Promise<MatchListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || 1).toString());
    queryParams.append('PageSize', (params.pageSize || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.REQUESTS.GET_ACCEPTED}?${queryParams.toString()}`;
    return apiClient.get<MatchListResponse>(url);
  },

  /**
   * Accept a match request
   */
  async acceptMatchRequest(request: AcceptMatchRequestRequest): Promise<void> {
    if (!request.requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    
    await apiClient.post<void>(MATCHMAKING_ENDPOINTS.REQUESTS.ACCEPT, request);
  },

  /**
   * Reject a match request
   */
  async rejectMatchRequest(request: RejectMatchRequestRequest): Promise<void> {
    if (!request.requestId?.trim()) throw new Error('Request-ID ist erforderlich');
    
    await apiClient.post<void>(MATCHMAKING_ENDPOINTS.REQUESTS.REJECT, request);
  },

  /**
   * Create a counter offer
   */
  async createCounterOffer(request: CreateCounterOfferRequest): Promise<CreateMatchRequestResponse> {
    if (!request.originalRequestId?.trim()) throw new Error('Original Request-ID ist erforderlich');
    if (!request.message?.trim()) throw new Error('Nachricht ist erforderlich');
    
    return apiClient.post<CreateMatchRequestResponse>(`${MATCHMAKING_ENDPOINTS.REQUESTS.COUNTER}/${request.originalRequestId}/counter`, request);
  },

  /**
   * Get match request thread - returns display-ready data
   */
  async getMatchRequestThread(threadId: string): Promise<MatchThreadDisplay> {
    if (!threadId?.trim()) throw new Error('Thread-ID ist erforderlich');
    
    return apiClient.get<MatchThreadDisplay>(`${MATCHMAKING_ENDPOINTS.REQUESTS.GET_THREAD}/${threadId}`);
  },

  /**
   * Get user matches - returns display-ready data
   */
  async getUserMatches(params: GetMatchRequestsParams = {}): Promise<MatchListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('PageNumber', (params.pageNumber || 1).toString());
    queryParams.append('PageSize', (params.pageSize || 20).toString());
    
    const url = `${MATCHMAKING_ENDPOINTS.GET_USER_MATCHES}?${queryParams.toString()}`;
    return apiClient.get<MatchListResponse>(url);
  }
};

export default matchmakingService;