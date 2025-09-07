// src/features/matchmaking/matchmakingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  MatchRequestDisplay,
  MatchDisplay,
  MatchThreadDisplay,
  CreateMatchRequestRequest,
  AcceptMatchRequestRequest,
  RejectMatchRequestRequest,
  CreateCounterOfferRequest,
} from '../../types/display/MatchmakingDisplay';
import { SliceError } from '../../store/types';
import matchmakingService, { GetMatchRequestsParams } from '../../api/services/matchmakingService';

import { serializeError } from '../../utils/reduxHelpers';

// Helper: Fehler normalisieren (deprecated - use serializeError instead)
const parseErr = (e: any): SliceError => serializeError(e);

// Thunks
export const createMatchRequest = createAsyncThunk(
  'matchmaking/createMatchRequest',
  async (req: CreateMatchRequestRequest, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.createMatchRequest(req);
      return { response, originalRequest: req };
    } catch (e) {
      return rejectWithValue(parseErr(e));
    }
  }
);

export const fetchMatches = createAsyncThunk(
  'matchmaking/searchMatches',
  async (req: CreateMatchRequestRequest, { rejectWithValue }) => {
    try {
      return await matchmakingService.searchMatches(req);
    } catch (e) {
      return rejectWithValue(parseErr(e));
    }
  }
);

export const fetchIncomingMatchRequests = createAsyncThunk(
  'matchmaking/fetchIncomingMatchRequests',
  async (params: GetMatchRequestsParams = {}, { rejectWithValue }) => {
    try {
      return await matchmakingService.getIncomingMatchRequests(params);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        console.log('📭 [Matchmaking] No incoming requests endpoint, returning empty');
        return {
          data: [],
          pageNumber: 1,
          pageSize: 20,
          totalRecords: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }
      return rejectWithValue(parseErr(e));
    }
  }
);

export const fetchOutgoingMatchRequests = createAsyncThunk(
  'matchmaking/fetchOutgoingMatchRequests',
  async (params: GetMatchRequestsParams = {}, { rejectWithValue }) => {
    try {
      return await matchmakingService.getOutgoingMatchRequests(params);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        console.log('📭 [Matchmaking] No outgoing requests endpoint, returning empty');
        return {
          data: [],
          pageNumber: 1,
          pageSize: 20,
          totalRecords: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }
      return rejectWithValue(parseErr(e));
    }
  }
);

export const fetchUserMatches = createAsyncThunk(
  'matchmaking/fetchMatches',
  async (params: GetMatchRequestsParams = {}, { rejectWithValue }) => {
    try {
      return await matchmakingService.getUserMatches(params);
    } catch (e: any) {
      // Handle 404 as empty data instead of error
      if (e?.response?.status === 404) {
        console.log('📭 [Matchmaking] No matches endpoint yet, returning empty data');
        return {
          data: [],
          pageNumber: 1,
          pageSize: 20,
          totalRecords: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }
      return rejectWithValue(parseErr(e));
    }
  }
);

export const acceptMatchRequest = createAsyncThunk(
  'matchmaking/acceptMatchRequest',
  async ({ requestId, request }: { requestId: string; request: AcceptMatchRequestRequest }, { rejectWithValue }) => {
    try {
      return await matchmakingService.acceptMatchRequest(requestId, request);
    } catch (e) {
      return rejectWithValue(parseErr(e));
    }
  }
);

export const rejectMatchRequest = createAsyncThunk(
  'matchmaking/rejectMatchRequest',
  async ({ requestId, request }: { requestId: string; request: RejectMatchRequestRequest }, { rejectWithValue }) => {
    try {
      return await matchmakingService.rejectMatchRequest(requestId, request);
    } catch (e) {
      return rejectWithValue(parseErr(e));
    }
  }
);

export const createCounterOffer = createAsyncThunk(
  'matchmaking/createCounterOffer',
  async (req: CreateCounterOfferRequest, { rejectWithValue }) => {
    try {
      return await matchmakingService.createCounterOffer(req);
    } catch (e) {
      return rejectWithValue(parseErr(e));
    }
  }
);

export const fetchMatchRequestThread = createAsyncThunk(
  'matchmaking/fetchMatchRequestThread',
  async (threadId: string, { rejectWithValue }) => {
    try {
      return await matchmakingService.getMatchRequestThread(threadId);
    } catch (e: any) {
      return rejectWithValue(parseErr(e));
    }
  }
);

interface MatchmakingState {
  incomingRequests: MatchRequestDisplay[];
  outgoingRequests: MatchRequestDisplay[];
  matches: MatchDisplay[];
  currentThread: MatchThreadDisplay | null;
  pagination: { 
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  isLoading: boolean;
  isLoadingRequests: boolean;
  isLoadingThread: boolean;
  matchRequestSent: boolean;
  error: SliceError | null;
}

const initialState: MatchmakingState = {
  incomingRequests: [],
  outgoingRequests: [],
  matches: [],
  currentThread: null,
  pagination: { pageNumber: 1, pageSize: 20, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  isLoading: false,
  isLoadingRequests: false,
  isLoadingThread: false,
  matchRequestSent: false,
  error: null,
};

const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState,
  reducers: {
    clearError: (s) => { s.error = null; },
    resetMatchRequestSent: (s) => { s.matchRequestSent = false; },
    clearMatchRequests: (s) => { s.incomingRequests = []; s.outgoingRequests = []; },
    clearMatches: (s) => { s.matches = []; },
    clearCurrentThread: (s) => { s.currentThread = null; },
    setPagination: (s, a: PayloadAction<Partial<MatchmakingState['pagination']>>) => {
      s.pagination = { ...s.pagination, ...a.payload };
    },
    // Optimistic
    acceptMatchRequestOptimistic: (s, a: PayloadAction<string>) => {
      const id = a.payload;
      const req = s.incomingRequests.find(r => r.id === id);
      if (!req) return;
      
      // Nur Status ändern, keine neuen Matches erstellen mit falschen Daten
      req.status = 'accepted';
      req.isRead = true;
      
      // Request aus der Liste entfernen
      s.incomingRequests = s.incomingRequests.filter(r => r.id !== id);
    },
    rejectMatchRequestOptimistic: (s, a: PayloadAction<string>) => {
      const id = a.payload;
      const req = s.incomingRequests.find(r => r.id === id);
      if (req) req.status = 'rejected';
    },
    markRequestAsRead: (s, a: PayloadAction<string>) => {
      const id = a.payload;
      const inReq = s.incomingRequests.find(r => r.id === id);
      if (inReq) inReq.isRead = true;
      const outReq = s.outgoingRequests.find(r => r.id === id);
      if (outReq) outReq.isRead = true;
    },
  },
  extraReducers: (b) => {
    b
      // create request
      .addCase(createMatchRequest.pending, (s) => { 
        s.isLoading = true; 
        s.error = null; 
        s.matchRequestSent = false; 
      })
      .addCase(createMatchRequest.fulfilled, (s, _a) => {
        s.isLoading = false; 
        s.matchRequestSent = true;
        // Wir speichern nur minimale Daten, da wir einen Refresh auslösen werden
        // const { response } = a.payload;
        // Optional: Trigger einen Refresh der outgoing requests
        // Das sollte im Component passieren nach erfolgreichem Request
      })
      .addCase(createMatchRequest.rejected, (s, a) => { 
        s.isLoading = false; 
        s.error = a.payload as SliceError; 
      })

      // search matches
      .addCase(fetchUserMatches.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchUserMatches.fulfilled, (s, a) => { s.isLoading = false; s.matches = a.payload.data ?? []; })
      .addCase(fetchUserMatches.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as SliceError; })

      // incoming
      .addCase(fetchIncomingMatchRequests.pending, (s) => { s.isLoadingRequests = true; s.error = null; })
      .addCase(fetchIncomingMatchRequests.fulfilled, (s, a) => {
        s.isLoadingRequests = false;
        s.incomingRequests = a.payload.data ?? [];
        s.pagination = {
          pageNumber: a.payload.pageNumber, pageSize: a.payload.pageSize,
          totalRecords: a.payload.totalRecords, totalPages: a.payload.totalPages,
          hasNextPage: a.payload.hasNextPage, hasPreviousPage: a.payload.hasPreviousPage
        };
      })
      .addCase(fetchIncomingMatchRequests.rejected, (s, a) => { s.isLoadingRequests = false; s.error = a.payload as SliceError; })

      // outgoing
      .addCase(fetchOutgoingMatchRequests.pending, (s) => { s.isLoadingRequests = true; s.error = null; })
      .addCase(fetchOutgoingMatchRequests.fulfilled, (s, a) => {
        s.isLoadingRequests = false;
        s.outgoingRequests = a.payload.data ?? [];
        s.pagination = {
          pageNumber: a.payload.pageNumber, pageSize: a.payload.pageSize,
          totalRecords: a.payload.totalRecords, totalPages: a.payload.totalPages,
          hasNextPage: a.payload.hasNextPage, hasPreviousPage: a.payload.hasPreviousPage
        };
      })
      .addCase(fetchOutgoingMatchRequests.rejected, (s, a) => { s.isLoadingRequests = false; s.error = a.payload as SliceError; })

      // matches
      .addCase(fetchMatches.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchMatches.fulfilled, (s, a) => {
        s.isLoading = false;
        s.matches = a.payload.data ?? [];
        s.pagination = {
          pageNumber: a.payload.pageNumber, pageSize: a.payload.pageSize,
          totalRecords: a.payload.totalRecords, totalPages: a.payload.totalPages,
          hasNextPage: a.payload.hasNextPage, hasPreviousPage: a.payload.hasPreviousPage
        };
      })
      .addCase(fetchMatches.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as SliceError; })

      // accept
      .addCase(acceptMatchRequest.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(acceptMatchRequest.fulfilled, (s, a) => {
        s.isLoading = false;
        const id = a.payload.data.requestId;
        s.incomingRequests = s.incomingRequests.filter(r => r.id !== id);
        // OPTIONAL: a.payload.data.match? dann in matches pushen
        const m = (a.payload.data as any).match as MatchDisplay | undefined;
        if (m) s.matches.unshift(m);
      })
      .addCase(acceptMatchRequest.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as SliceError; })

      // reject
      .addCase(rejectMatchRequest.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(rejectMatchRequest.fulfilled, (s, a) => {
        s.isLoading = false;
        const id = a.payload.data.requestId;
        s.incomingRequests = s.incomingRequests.filter(r => r.id !== id);
      })
      .addCase(rejectMatchRequest.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as SliceError; })

      // thread
      .addCase(fetchMatchRequestThread.pending, (s) => { s.isLoadingThread = true; s.error = null; })
      .addCase(fetchMatchRequestThread.fulfilled, (s, a) => { s.isLoadingThread = false; s.currentThread = a.payload.data ?? null; })
      .addCase(fetchMatchRequestThread.rejected, (s, a) => { s.isLoadingThread = false; s.error = a.payload as SliceError; });
  },
});

export const {
  clearError,
  resetMatchRequestSent,
  clearMatchRequests,
  clearMatches,
  clearCurrentThread,
  setPagination,
  acceptMatchRequestOptimistic,
  rejectMatchRequestOptimistic,
  markRequestAsRead,
} = matchmakingSlice.actions;

export default matchmakingSlice.reducer;
