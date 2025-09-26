import matchmakingService, { GetMatchRequestsParams } from "../../api/services/matchmakingService";
import { createAppAsyncThunk } from "../../store/thunkHelpers";
import { isSuccessResponse, isPagedResponse } from "../../types/api/UnifiedResponse";
import { 
    CreateMatchRequestRequest, 
    AcceptMatchRequestRequest, 
    RejectMatchRequestRequest, 
    CreateCounterOfferRequest 
} from "../../types/contracts/MatchmakingDisplay";

export const createMatchRequest = createAppAsyncThunk(
    'matchmaking/createMatchRequest', 
    async (req: CreateMatchRequestRequest, { rejectWithValue }) => {
        const res = await matchmakingService.createMatchRequest(req);
        return isSuccessResponse(res) ? res : rejectWithValue(res);
});

export const fetchMatches = createAppAsyncThunk(
    'matchmaking/searchMatches', 
    // async (req: CreateMatchRequestRequest, { rejectWithValue }) => {
    async (_, {}) => {
        // ⚠️ TEMPORARY FIX: /api/matches/search endpoint not implemented on backend
        // Return empty paged response with correct structure to prevent 404 errors and TypeErrors
        console.warn('🚧 fetchMatches: search endpoint not implemented, returning empty results');
        const emptyResponse = {
            success: true,
            data: [],
            message: 'Search not implemented',
            pagination: {
                pageNumber: 1,
                pageSize: 10,
                totalRecords: 0,
                totalPages: 0,
                hasPreviousPage: false,
                hasNextPage: false
            }
        };
        return emptyResponse;
        
        // TODO: Uncomment when backend implements /api/matches/search
        // const res = await matchmakingService.searchMatches(req);
        // return isPagedResponse(res) ? res : rejectWithValue(res);
});

export const fetchIncomingMatchRequests = createAppAsyncThunk(
    'matchmaking/fetchIncomingMatchRequests',
    async (params: GetMatchRequestsParams, { rejectWithValue }) => {
        const res = await matchmakingService.getIncomingMatchRequests(params);
        return isPagedResponse(res) ? res : rejectWithValue(res);
});

export const fetchOutgoingMatchRequests = createAppAsyncThunk(
    'matchmaking/fetchOutgoingMatchRequests', 
    async (params: GetMatchRequestsParams, { rejectWithValue }) => {
        const res = await matchmakingService.getOutgoingMatchRequests(params);
        return isPagedResponse(res) ? res : rejectWithValue(res);
});

export const fetchUserMatches = createAppAsyncThunk(
    'matchmaking/fetchMatches',
    async (params: GetMatchRequestsParams, { rejectWithValue }) => {
        const res = await matchmakingService.getUserMatches(params);
        return isPagedResponse(res) ? res : rejectWithValue(res);
});

export const acceptMatchRequest = createAppAsyncThunk(
    'matchmaking/acceptMatchRequest', 
    async ({ requestId, request }: { requestId: string; request: AcceptMatchRequestRequest }, { rejectWithValue }) => {
        const res = await matchmakingService.acceptMatchRequest(requestId, request);
        return isSuccessResponse(res) ? res : rejectWithValue(res);
});

export const rejectMatchRequest = createAppAsyncThunk(
    'matchmaking/rejectMatchRequest', 
    async ({ requestId, request }:  { requestId: string; request: RejectMatchRequestRequest }, { rejectWithValue }) => {
        const res = await matchmakingService.rejectMatchRequest(requestId, request);
        return isSuccessResponse(res) ? res : rejectWithValue(res);
});

export const createCounterOffer = createAppAsyncThunk(
    'matchmaking/createCounterOffer', 
    async (req: CreateCounterOfferRequest, { rejectWithValue }) => {
        const res = await matchmakingService.createCounterOffer(req);
        return isSuccessResponse(res) ? res : rejectWithValue(res);
});

export const fetchMatchRequestThread = createAppAsyncThunk(
    'matchmaking/fetchMatchRequestThread', 
    async (threadId: string, { rejectWithValue }) => {
        const res = await matchmakingService.getMatchRequestThread(threadId);
        return isSuccessResponse(res) ? res : rejectWithValue(res);
});
