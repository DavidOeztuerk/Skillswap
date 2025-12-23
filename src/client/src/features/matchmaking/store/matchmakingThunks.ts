import { createAppAsyncThunk } from '../../../core/store/thunkHelpers';
import {
  isSuccessResponse,
  isPagedResponse,
  createErrorResponse,
} from '../../../shared/types/api/UnifiedResponse';
import type { GetMatchRequestsParams } from '../services/matchmakingService';
import type {
  CreateMatchRequestRequest,
  AcceptMatchRequestRequest,
  RejectMatchRequestRequest,
  CreateCounterOfferRequest,
} from '../types/MatchmakingDisplay';

// Helper für dynamischen Import des Services
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Dynamic import type inference
const getMatchmakingService = async () => {
  const module = await import('../services/matchmakingService');
  return module.default;
};

export const createMatchRequest = createAppAsyncThunk(
  'matchmaking/createMatchRequest',
  async (req: CreateMatchRequestRequest, { rejectWithValue }) => {
    const service = await getMatchmakingService();
    const res = await service.createMatchRequest(req);
    return isSuccessResponse(res) ? res : rejectWithValue(res);
  }
);

export const fetchMatches = createAppAsyncThunk(
  'matchmaking/searchMatches',
  async (params: GetMatchRequestsParams, { rejectWithValue }) => {
    try {
      const service = await getMatchmakingService();
      const res = await service.getUserMatches(params);
      return isPagedResponse(res) ? res : rejectWithValue(res);
    } catch (error) {
      console.error('❌ fetchMatches error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

export const fetchIncomingMatchRequests = createAppAsyncThunk(
  'matchmaking/fetchIncomingMatchRequests',
  async (params: GetMatchRequestsParams, { rejectWithValue }) => {
    const service = await getMatchmakingService();
    const res = await service.getIncomingMatchRequests(params);
    return isPagedResponse(res) ? res : rejectWithValue(res);
  }
);

export const fetchOutgoingMatchRequests = createAppAsyncThunk(
  'matchmaking/fetchOutgoingMatchRequests',
  async (params: GetMatchRequestsParams, { rejectWithValue }) => {
    const service = await getMatchmakingService();
    const res = await service.getOutgoingMatchRequests(params);
    return isPagedResponse(res) ? res : rejectWithValue(res);
  }
);

export const fetchUserMatches = createAppAsyncThunk(
  'matchmaking/fetchMatches',
  async (params: GetMatchRequestsParams, { rejectWithValue }) => {
    const service = await getMatchmakingService();
    const res = await service.getUserMatches(params);
    return isPagedResponse(res) ? res : rejectWithValue(res);
  }
);

export const acceptMatchRequest = createAppAsyncThunk(
  'matchmaking/acceptMatchRequest',
  async (
    { requestId, request }: { requestId: string; request: AcceptMatchRequestRequest },
    { rejectWithValue }
  ) => {
    const service = await getMatchmakingService();
    const res = await service.acceptMatchRequest(requestId, request);
    return isSuccessResponse(res) ? res : rejectWithValue(res);
  }
);

export const rejectMatchRequest = createAppAsyncThunk(
  'matchmaking/rejectMatchRequest',
  async (
    { requestId, request }: { requestId: string; request: RejectMatchRequestRequest },
    { rejectWithValue }
  ) => {
    const service = await getMatchmakingService();
    const res = await service.rejectMatchRequest(requestId, request);
    return isSuccessResponse(res) ? res : rejectWithValue(res);
  }
);

export const createCounterOffer = createAppAsyncThunk(
  'matchmaking/createCounterOffer',
  async (req: CreateCounterOfferRequest, { rejectWithValue }) => {
    const service = await getMatchmakingService();
    const res = await service.createCounterOffer(req);
    return isSuccessResponse(res) ? res : rejectWithValue(res);
  }
);

export const fetchMatchRequestThread = createAppAsyncThunk(
  'matchmaking/fetchMatchRequestThread',
  async (threadId: string, { rejectWithValue }) => {
    const service = await getMatchmakingService();
    const res = await service.getMatchRequestThread(threadId);
    return isSuccessResponse(res) ? res : rejectWithValue(res);
  }
);
