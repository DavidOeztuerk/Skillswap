// src/features/matchmaking/matchmakingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import matchmakingService from '../../api/services/matchmakingService';
import { MatchmakingState } from '../../types/states/MatchmakingState';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
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
  async (request: MatchRequest) => {
    return await matchmakingService.findMatch(request);
  }
);

export const getMatch = createAsyncThunk(
  'matchmaking/getMatch',
  async (matchSessionId: string) => {
    return await matchmakingService.getMatch(matchSessionId);
  }
);

export const acceptMatch = createAsyncThunk(
  'matchmaking/acceptMatch',
  async (matchSessionId: string) => {
    return await matchmakingService.acceptMatch(matchSessionId);
  }
);

export const rejectMatch = createAsyncThunk(
  'matchmaking/rejectMatch',
  async (matchSessionId: string) => {
    return await matchmakingService.rejectMatch(matchSessionId);
  }
);

export const searchPotentialMatches = createAsyncThunk(
  'matchmaking/searchPotentialMatches',
  async ({ skillId, isLearningMode }: { skillId: string; isLearningMode: boolean }) => {
    return await matchmakingService.searchPotentialMatches(skillId, isLearningMode);
  }
);

export const getUserMatches = createAsyncThunk(
  'matchmaking/getUserMatches',
  async (params?: { page?: number; limit?: number; status?: string }) => {
    return await matchmakingService.getUserMatches(params);
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
  async ({ matchId, reason }: { matchId: string; reason?: string }) => {
    return await matchmakingService.cancelMatch(matchId, reason);
  }
);

export const updateMatchPreferences = createAsyncThunk(
  'matchmaking/updateMatchPreferences',
  async (preferences: {
    availableHours: string[];
    preferredLanguages: string[];
    experienceLevel: string;
    learningGoals: string[];
  }) => {
    return await matchmakingService.updateMatchPreferences(preferences);
  }
);

export const rateMatch = createAsyncThunk(
  'matchmaking/rateMatch',
  async ({ matchId, rating, feedback }: { matchId: string; rating: number; feedback?: string }) => {
    return await matchmakingService.rateMatch(matchId, rating, feedback);
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
  async () => {
    return await matchmakingService.getIncomingMatchRequests();
  }
);

export const fetchOutgoingMatchRequests = createAsyncThunk(
  'matchmaking/fetchOutgoingMatchRequests',
  async () => {
    return await matchmakingService.getOutgoingMatchRequests();
  }
);

export const acceptMatchRequest = createAsyncThunk(
  'matchmaking/acceptMatchRequest',
  async (requestId: string) => {
    return await matchmakingService.acceptMatchRequest(requestId);
  }
);

export const rejectMatchRequest = createAsyncThunk(
  'matchmaking/rejectMatchRequest',
  async ({ requestId, reason }: { requestId: string; reason?: string }) => {
    await matchmakingService.rejectMatchRequest(requestId, reason);
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
        state.activeMatch = action.payload;
        state.matches.push(action.payload);
        // Remove from incoming requests
        state.incomingRequests = state.incomingRequests.filter(
          req => req.matchId !== action.payload.id
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
      .addCase(cancelMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        updateMatchInList(state, action.payload);
        if (state.activeMatch?.id === action.payload.id) {
          state.activeMatch = action.payload;
        }
      })
      .addCase(cancelMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Update Match Preferences
      .addCase(updateMatchPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMatchPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchPreferences = action.payload;
      })
      .addCase(updateMatchPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Rate Match
      .addCase(rateMatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rateMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        updateMatchInList(state, action.payload);
        if (state.activeMatch?.id === action.payload.id) {
          state.activeMatch = action.payload;
        }
      })
      .addCase(rateMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
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