import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  MatchRequestDisplay,
  MatchDisplay,
  MatchThreadDisplay,
  CreateMatchRequestRequest,
  AcceptMatchRequestRequest,
  RejectMatchRequestRequest,
  CreateCounterOfferRequest,
  Match
} from '../../types/display/MatchmakingDisplay';
import { SliceError } from '../../store/types';
import matchmakingService, { GetMatchRequestsParams } from '../../api/services/matchmakingService';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';

interface MatchmakingState {
  // Match requests
  incomingRequests: MatchRequestDisplay[];
  outgoingRequests: MatchRequestDisplay[];
  // Actual matches
  matches: MatchDisplay[];
  // Thread details
  currentThread: MatchThreadDisplay | null;
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  // Loading states
  isLoading: boolean;
  isLoadingRequests: boolean;
  isLoadingThread: boolean;
  // Success states
  matchRequestSent: boolean;
  // Error
  error: SliceError | null;
}

const initialState: MatchmakingState = {
  incomingRequests: [],
  outgoingRequests: [],
  matches: [],
  currentThread: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingRequests: false,
  isLoadingThread: false,
  matchRequestSent: false,
  error: null,
};

// Async thunks
export const createMatchRequest = createAsyncThunk(
  'matchmaking/createMatchRequest',
  async (request: CreateMatchRequestRequest) => {
    const response = await matchmakingService.createMatchRequest(request);
    return { response, originalRequest: request };
  }
);

export const fetchIncomingMatchRequests = createAsyncThunk(
  'matchmaking/fetchIncomingMatchRequests',
  async (params: GetMatchRequestsParams = {}) => {
    return await matchmakingService.getIncomingMatchRequests(params);
  }
);

export const fetchOutgoingMatchRequests = createAsyncThunk(
  'matchmaking/fetchOutgoingMatchRequests',
  async (params: GetMatchRequestsParams = {}) => {
    return await matchmakingService.getOutgoingMatchRequests(params);
  }
);

export const fetchMatches = createAsyncThunk(
  'matchmaking/fetchMatches',
  async (params: GetMatchRequestsParams = {}) => {
    return await matchmakingService.getUserMatches(params);
  }
);

export const acceptMatchRequest = createAsyncThunk(
  'matchmaking/acceptMatchRequest',
  async ({requestId, request}:  {requestId: string, request: AcceptMatchRequestRequest}) => {
    const response = await matchmakingService.acceptMatchRequest(requestId, request);
    return response;
  }
);

export const rejectMatchRequest = createAsyncThunk(
  'matchmaking/rejectMatchRequest',
  async ({requestId, request}:  {requestId: string,  request: RejectMatchRequestRequest}) => {
    const response = await matchmakingService.rejectMatchRequest(requestId, request);
    return response;
  }
);

export const createCounterOffer = createAsyncThunk(
  'matchmaking/createCounterOffer',
  async (request: CreateCounterOfferRequest) => {
    return await matchmakingService.createCounterOffer(request);
  }
);

export const fetchMatchRequestThread = createAsyncThunk(
  'matchmaking/fetchMatchRequestThread',
  async (threadId: string, { rejectWithValue }) => {
    try {
      return await matchmakingService.getMatchRequestThread(threadId);
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Fehler beim Laden der Thread-Details',
        code: error.code || 'UNKNOWN_ERROR'
      });
    }
  }
);

// Slice
const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    resetMatchRequestSent: (state) => {
      state.matchRequestSent = false;
    },
    
    clearMatchRequests: (state) => {
      state.incomingRequests = [];
      state.outgoingRequests = [];
    },
    
    clearMatches: (state) => {
      state.matches = [];
    },
    
    clearCurrentThread: (state) => {
      state.currentThread = null;
    },
    
    setPagination: (state, action: PayloadAction<Partial<MatchmakingState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Optimistic updates
    acceptMatchRequestOptimistic: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      const request = state.incomingRequests.find(r => r.id === requestId);
      if (request) {
        request.status = 'accepted';
        // Move to matches
        state.matches.push({
          ...request,
          matchedAt: new Date().toISOString(),
        } as any);
        // Remove from incoming
        state.incomingRequests = state.incomingRequests.filter(r => r.id !== requestId);
      }
    },
    
    rejectMatchRequestOptimistic: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      const request = state.incomingRequests.find(r => r.id === requestId);
      if (request) {
        request.status = 'rejected';
      }
    },
    
    // Rollback actions
    setIncomingRequests: (_state, _action: PayloadAction<MatchRequest[]>) => {
      // state.incomingRequests = action.payload as MatchRequestDisplay[]
    },
    
    setMatches: (_state, _action: PayloadAction<Match[]>) => {
      // state.matches = action.payload as MatchDisplay[];
    },
    
    markRequestAsRead: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      
      // Mark in incoming requests
      const incomingRequest = state.incomingRequests.find(r => r.id === requestId);
      if (incomingRequest) {
        incomingRequest.isRead = true;
      }
      
      // Mark in outgoing requests
      const outgoingRequest = state.outgoingRequests.find(r => r.id === requestId);
      if (outgoingRequest) {
        outgoingRequest.isRead = true;
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Create Match Request
      .addCase(createMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.matchRequestSent = false;
      })
      .addCase(createMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchRequestSent = true;
        
        // Add to outgoing requests immediately for optimistic UI
        const { response, originalRequest } = action.payload;
        const newRequest: MatchRequestDisplay = {
          id: response.data.requestId,
          skillId: originalRequest.skillId,
          skillName: 'Loading...', // Will be populated when refreshing
          skillCategory: 'Loading...',
          message: originalRequest.message,
          status: 'pending',
          type: 'outgoing',
          otherUserId: originalRequest.targetUserId,
          otherUserName: 'Loading...',
          otherUserRating: 0,
          isSkillExchange: originalRequest.isSkillExchange || false,
          exchangeSkillId: originalRequest.exchangeSkillId,
          exchangeSkillName: undefined,
          isMonetary: originalRequest.isMonetary || false,
          offeredAmount: originalRequest.offeredAmount,
          currency: originalRequest.currency,
          sessionDurationMinutes: originalRequest.sessionDurationMinutes || 60,
          totalSessions: originalRequest.totalSessions || 1,
          preferredDays: originalRequest.preferredDays || [],
          preferredTimes: originalRequest.preferredTimes || [],
          createdAt: response.data.createdAt,
          threadId: response.data.threadId,
          isRead: true,
        };
        
        state.outgoingRequests.unshift(newRequest);
      })
      .addCase(createMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.matchRequestSent = false;
      })

      // Fetch Incoming Requests
      .addCase(fetchIncomingMatchRequests.pending, (state) => {
        state.isLoadingRequests = true;
        state.error = null;
      })
      .addCase(fetchIncomingMatchRequests.fulfilled, (state, action) => {
        state.isLoadingRequests = false;
        // Handle PagedResponse - data is an array
        state.incomingRequests = action.payload.data || [];
        state.pagination = {
          page: action.payload.pageNumber,
          limit: action.payload.pageSize,
          total: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchIncomingMatchRequests.rejected, (state, action) => {
        state.isLoadingRequests = false;
        state.error = action.error as SliceError;
      })

      // Fetch Outgoing Requests
      .addCase(fetchOutgoingMatchRequests.pending, (state) => {
        state.isLoadingRequests = true;
        state.error = null;
      })
      .addCase(fetchOutgoingMatchRequests.fulfilled, (state, action) => {
        state.isLoadingRequests = false;
        // Handle PagedResponse - data is an array
        state.outgoingRequests = action.payload.data || [];
        state.pagination = {
          page: action.payload.pageNumber,
          limit: action.payload.pageSize,
          total: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchOutgoingMatchRequests.rejected, (state, action) => {
        state.isLoadingRequests = false;
        state.error = action.error as SliceError;
      })

      // Fetch Matches
      .addCase(fetchMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle PagedResponse - data is an array
        state.matches = action.payload.data || [];
        state.pagination = {
          page: action.payload.pageNumber,
          limit: action.payload.pageSize,
          total: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Accept Match Request
      .addCase(acceptMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove from incoming requests
        state.incomingRequests = state.incomingRequests.filter(
          req => req.id !== action.payload.data.requestId
        );
      })
      .addCase(acceptMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Reject Match Request
      .addCase(rejectMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove from incoming requests
        state.incomingRequests = state.incomingRequests.filter(
          req => req.id !== action.payload.data.requestId
        );
      })
      .addCase(rejectMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Create Counter Offer
      .addCase(createCounterOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCounterOffer.fulfilled, (state) => {
        state.isLoading = false;
        // Thread will be updated when user navigates to it
      })
      .addCase(createCounterOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Fetch Match Request Thread
      .addCase(fetchMatchRequestThread.pending, (state) => {
        state.isLoadingThread = true;
        state.error = null;
      })
      .addCase(fetchMatchRequestThread.fulfilled, (state, action) => {
        state.isLoadingThread = false;
        // Handle ApiResponse - extract data
        state.currentThread = action.payload.data || null;
      })
      .addCase(fetchMatchRequestThread.rejected, (state, action) => {
        state.isLoadingThread = false;
        state.error = action.payload as SliceError;
      });
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
  setIncomingRequests,
  setMatches,
  markRequestAsRead,
} = matchmakingSlice.actions;

// Legacy exports for backward compatibility
export const findMatch = createMatchRequest; // Alias
export const acceptMatch = acceptMatchRequest; // Alias
export const rejectMatch = rejectMatchRequest; // Alias
export const getUserMatches = fetchMatches; // Alias

export default matchmakingSlice.reducer;