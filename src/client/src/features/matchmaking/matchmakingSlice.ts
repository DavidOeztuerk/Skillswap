// src/features/matchmaking/matchmakingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import matchmakingService, { 
  FindMatchRequest
} from '../../api/services/matchmakingService';
import { MatchmakingState } from '../../types/states/MatchmakingState';
import { Match } from '../../types/models/Match';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { SliceError } from '../../store/types';

const initialState: MatchmakingState = {
  matches: [],
  activeMatch: null,
  matchResults: [],
  matchRequestSent: false,
  incomingRequests: [],
  outgoingRequests: [],
  matchHistory: [],
  matchPreferences: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    status: 'all',
    dateRange: null,
    skillCategory: 'all',
    experienceLevel: 'all',
  },
  isLoading: false,
  isLoadingMatches: false,
  isLoadingRequests: false,
  error: null,
};

// Async thunks
export const findMatch = createAsyncThunk(
  'matchmaking/findMatch',
  async (request: FindMatchRequest) => {
    return await matchmakingService.findMatch(request);
  }
);

export const getMatch = createAsyncThunk(
  'matchmaking/getMatch',
  async (matchId: string) => {
    return await matchmakingService.getMatch(matchId);
  }
);

export const acceptMatch = createAsyncThunk(
  'matchmaking/acceptMatch',
  async (matchId: string) => {
    return await matchmakingService.acceptMatch(matchId);
  }
);

export const rejectMatch = createAsyncThunk(
  'matchmaking/rejectMatch',
  async ({ matchId, reason }: { matchId: string; reason?: string }) => {
    return await matchmakingService.rejectMatch(matchId, reason);
  }
);

export const searchPotentialMatches = createAsyncThunk(
  'matchmaking/searchPotentialMatches',
  async (_: { skillId: string; isLearningMode: boolean }) => {
    // This endpoint doesn't exist in backend
    console.warn('searchPotentialMatches: Backend endpoint not implemented');
    return [];
  }
);

export const getUserMatches = createAsyncThunk(
  'matchmaking/getUserMatches',
  async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await matchmakingService.getUserMatches(params);
    // Transform backend response to frontend format
    return {
      data: response.Data.map((item: any) => ({
        id: item.MatchId,
        requesterId: item.IsOffering ? 'current-user' : 'other-user',
        requesterDetails: { id: item.IsOffering ? 'current-user' : 'other-user', name: 'User' } as any,
        responderId: item.IsOffering ? 'other-user' : 'current-user',
        responderDetails: { id: item.IsOffering ? 'other-user' : 'current-user', name: 'Other User' } as any,
        skillId: 'unknown-skill',
        skill: { id: 'unknown-skill', name: item.SkillName } as any,
        isLearningMode: !item.IsOffering,
        status: item.Status as any,
        preferredDays: [],
        preferredTimes: [],
        additionalNotes: '',
        createdAt: new Date(item.CreatedAt).toISOString(),
        updatedAt: new Date(item.CreatedAt).toISOString(),
      })),
      page: response.PageNumber,
      limit: response.PageSize,
      total: response.TotalCount,
      totalPages: response.TotalPages,
    };
  }
);

export const getMatchDetails = createAsyncThunk(
  'matchmaking/getMatchDetails',
  async (matchId: string) => {
    return await matchmakingService.getMatchDetails(matchId);
  }
);

export const cancelMatch = createAsyncThunk(
  'matchmaking/cancelMatch',
  async (_: { matchId: string; reason?: string }) => {
    // This endpoint doesn't exist in backend
    console.warn('cancelMatch: Backend endpoint not implemented');
    throw new Error('Cancel match endpoint not implemented');
  }
);

export const updateMatchPreferences = createAsyncThunk(
  'matchmaking/updateMatchPreferences',
  async (_: {
    availableHours: string[];
    preferredLanguages: string[];
    experienceLevel: string;
    learningGoals: string[];
  }) => {
    // This endpoint doesn't exist in backend
    console.warn('updateMatchPreferences: Backend endpoint not implemented');
    throw new Error('Update match preferences endpoint not implemented');
  }
);

export const rateMatch = createAsyncThunk(
  'matchmaking/rateMatch',
  async (_: { matchId: string; rating: number; feedback?: string }) => {
    // This endpoint doesn't exist in backend
    console.warn('rateMatch: Backend endpoint not implemented');
    throw new Error('Rate match endpoint not implemented');
  }
);

export const createMatchRequest = createAsyncThunk(
  'matchmaking/createMatchRequest',
  async (request: CreateMatchRequest) => {
    return await matchmakingService.createMatchRequest(request);
  }
);

export const fetchIncomingMatchRequests = createAsyncThunk(
  'matchmaking/fetchIncomingMatchRequests',
  async (params?: { page?: number; limit?: number }) => {
    const response = await matchmakingService.getIncomingMatchRequests({
      PageNumber: params?.page || 1,
      PageSize: params?.limit || 20
    });
    // Transform response if it's paginated
    return response.Data || response;
  }
);

export const fetchOutgoingMatchRequests = createAsyncThunk(
  'matchmaking/fetchOutgoingMatchRequests',
  async (params?: { page?: number; limit?: number }) => {
    const response = await matchmakingService.getOutgoingMatchRequests({
      PageNumber: params?.page || 1,
      PageSize: params?.limit || 20
    });
    // Transform response if it's paginated
    return response.Data || response;
  }
);

export const acceptMatchRequest = createAsyncThunk(
  'matchmaking/acceptMatchRequest',
  async ({ requestId, responseMessage }: { requestId: string; responseMessage?: string }) => {
    return await matchmakingService.acceptMatchRequest(requestId, responseMessage);
  }
);

export const rejectMatchRequest = createAsyncThunk(
  'matchmaking/rejectMatchRequest',
  async ({ requestId, responseMessage }: { requestId: string; responseMessage?: string }) => {
    await matchmakingService.rejectMatchRequest(requestId, responseMessage);
    return requestId;
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
    setActiveMatch: (state, action: PayloadAction<Match | null>) => {
      state.activeMatch = action.payload;
    },
    clearMatchResults: (state) => {
      state.matchResults = [];
    },
    resetMatchRequestSent: (state) => {
      state.matchRequestSent = false;
    },
    clearMatchRequests: (state) => {
      state.incomingRequests = [];
      state.outgoingRequests = [];
    },
    setMatchFilters: (state, action: PayloadAction<Partial<MatchmakingState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<MatchmakingState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateMatchInList: (state, action: PayloadAction<Match>) => {
      const index = state.matches.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.matches[index] = action.payload;
      }
    },
    removeMatchFromList: (state, action: PayloadAction<string>) => {
      state.matches = state.matches.filter(m => m.id !== action.payload);
      state.matchHistory = state.matchHistory.filter(m => m.id !== action.payload);
    },
    setMatchPreferences: (state, action: PayloadAction<any>) => {
      state.matchPreferences = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Helper function to update match in list
    const updateMatchInList = (state: MatchmakingState, match: Match) => {
      const index = state.matches.findIndex(m => m.id === match.id);
      if (index !== -1) {
        state.matches[index] = match;
      }
    };

    builder
      // Find Match
      .addCase(findMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        state.matchRequestSent = true;
        state.matches.push(action.payload);
      })
      .addCase(findMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Get Match
      .addCase(getMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
      })
      .addCase(getMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Accept Match
      .addCase(acceptMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        updateMatchInList(state, action.payload);
      })
      .addCase(acceptMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Reject Match
      .addCase(rejectMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        updateMatchInList(state, action.payload);
      })
      .addCase(rejectMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Search Potential Matches
      .addCase(searchPotentialMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchPotentialMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchResults = action.payload;
      })
      .addCase(searchPotentialMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Create Match Request
      .addCase(createMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchRequestSent = true;
        state.outgoingRequests.push(action.payload);
      })
      .addCase(createMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Fetch Incoming Requests
      .addCase(fetchIncomingMatchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncomingMatchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incomingRequests = action.payload;
      })
      .addCase(fetchIncomingMatchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Fetch Outgoing Requests
      .addCase(fetchOutgoingMatchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOutgoingMatchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.outgoingRequests = action.payload;
      })
      .addCase(fetchOutgoingMatchRequests.rejected, (state, action) => {
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
        if (action.payload) {
          state.activeMatch = action.payload;
          state.matches.push(action.payload);
          // Remove from incoming requests (assuming we have requestId)
          state.incomingRequests = state.incomingRequests.filter(
            req => req.matchId !== action.payload.id
          );
        }
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
          req => req.matchId !== action.payload
        );
      })
      .addCase(rejectMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Get User Matches
      .addCase(getUserMatches.pending, (state) => {
        state.isLoadingMatches = true;
        state.error = null;
      })
      .addCase(getUserMatches.fulfilled, (state, action) => {
        state.isLoadingMatches = false;
        state.matches = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(getUserMatches.rejected, (state, action) => {
        state.isLoadingMatches = false;
        state.error = action.error as SliceError;
      })

      // Get Match Details
      .addCase(getMatchDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMatchDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        updateMatchInList(state, action.payload);
      })
      .addCase(getMatchDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Cancel Match
      .addCase(cancelMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = { message: action.error.message || 'Cancel match failed' } as SliceError;
      })

      // Update Match Preferences
      .addCase(updateMatchPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMatchPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = { message: action.error.message || 'Update preferences failed' } as SliceError;
      })

      // Rate Match
      .addCase(rateMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rateMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = { message: action.error.message || 'Rate match failed' } as SliceError;
      });
  },
});

export const {
  clearError,
  setActiveMatch,
  clearMatchResults,
  resetMatchRequestSent,
  clearMatchRequests,
  setMatchFilters,
  setPagination,
  updateMatchInList,
  removeMatchFromList,
  setMatchPreferences,
} = matchmakingSlice.actions;

export default matchmakingSlice.reducer;