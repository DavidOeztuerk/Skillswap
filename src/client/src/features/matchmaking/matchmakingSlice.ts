import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import matchmakingService from '../../api/services/matchmakingService';
import { MatchmakingState } from '../../types/states/MatchmakingState';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { Match } from '../../types/models/Match';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { SliceError } from '../../store/types';

// Initial state for the Matchmaking reducer
const initialState: MatchmakingState = {
  matches: [],
  activeMatch: null,
  matchResults: [],
  matchRequestSent: false,
  incomingRequests: [], // ✅ NEW
  outgoingRequests: [], // ✅ NEW
  isLoading: false,
  error: null,
};

// Async thunk for loading all matches (implementation pending)

// Async thunk for finding a match
export const findMatch = createAsyncThunk(
  'matchmaking/findMatch',
  async (request: MatchRequest, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.findMatch(request);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Match could not be found'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match could not be found'
      );
    }
  }
);

// Async Thunk for loading a single match
export const getMatch = createAsyncThunk(
  'matchmaking/getMatch',
  async (matchSessionId: string, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.getMatch(matchSessionId);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Match could not be loaded'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match could not be loaded'
      );
    }
  }
);

// Async Thunk for accepting a match
export const acceptMatch = createAsyncThunk(
  'matchmaking/acceptMatch',
  async (matchSessionId: string, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.acceptMatch(matchSessionId);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Match could not be accepted'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match could not be accepted'
      );
    }
  }
);

// Async Thunk for rejecting a match
export const rejectMatch = createAsyncThunk(
  'matchmaking/rejectMatch',
  async (matchSessionId: string, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.rejectMatch(matchSessionId);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Match could not be rejected'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match could not be rejected'
      );
    }
  }
);

// Async Thunk for searching potential matching partners
export const searchPotentialMatches = createAsyncThunk(
  'matchmaking/searchPotentialMatches',
  async (
    { skillId, isLearningMode }: { skillId: string; isLearningMode: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await matchmakingService.searchPotentialMatches(
        skillId,
        isLearningMode
      );
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Potential matches could not be found'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Potential matches could not be found'
      );
    }
  }
);

export const createMatchRequest = createAsyncThunk(
  'matchmaking/createMatchRequest',
  async (request: CreateMatchRequest, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.createMatchRequest(request);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match request could not be created'
      );
    }
  }
);

// ✅ NEW: Load incoming match requests
export const fetchIncomingMatchRequests = createAsyncThunk(
  'matchmaking/fetchIncomingMatchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.getIncomingMatchRequests();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Incoming requests could not be loaded'
      );
    }
  }
);

// ✅ NEW: Load outgoing match requests
export const fetchOutgoingMatchRequests = createAsyncThunk(
  'matchmaking/fetchOutgoingMatchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.getOutgoingMatchRequests();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Outgoing requests could not be loaded'
      );
    }
  }
);

// ✅ NEW: Accept match request
export const acceptMatchRequest = createAsyncThunk(
  'matchmaking/acceptMatchRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const response = await matchmakingService.acceptMatchRequest(requestId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match request could not be accepted'
      );
    }
  }
);

// ✅ NEW: Reject match request
export const rejectMatchRequest = createAsyncThunk(
  'matchmaking/rejectMatchRequest',
  async (
    { requestId, reason }: { requestId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      await matchmakingService.rejectMatchRequest(requestId, reason);
      return requestId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match request could not be rejected'
      );
    }
  }
);

// Matchmaking Slice
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Matches
      // .addCase(fetchMatches.pending, (state) => {
      //   state.isLoading = true;
      //   state.error = undefined;
      // })
      // .addCase(fetchMatches.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   // state.matches = action.payload;
      // })
      // .addCase(fetchMatches.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.error = action.payload as string;
      // })
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
        // Also update the match in the list
        const index = state.matches.findIndex(
          (match) => match.id === action.payload.id
        );
        if (index !== -1) {
          state.matches[index] = action.payload;
        }
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
        // Also update the match in the list
        const index = state.matches.findIndex(
          (match) => match.id === action.payload.id
        );
        if (index !== -1) {
          state.matches[index] = action.payload;
        }
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

      // ✅ NEW: Fetch Incoming Requests Cases
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

      // ✅ NEW: Fetch Outgoing Requests Cases
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

      // ✅ NEW: Accept Match Request Cases
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
          (req) => req.matchId !== action.payload.id
        );
      })
      .addCase(acceptMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // ✅ NEW: Reject Match Request Cases
      .addCase(rejectMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove from incoming requests
        state.incomingRequests = state.incomingRequests.filter(
          (req) => req.matchId !== action.payload
        );
      })
      .addCase(rejectMatchRequest.rejected, (state, action) => {
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
  clearMatchRequests, // ✅ NEW
} = matchmakingSlice.actions;
export default matchmakingSlice.reducer;
