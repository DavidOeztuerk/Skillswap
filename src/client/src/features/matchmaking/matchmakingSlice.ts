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
  isLoading: false,
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
      });
  },
});

export const {
  clearError,
  setActiveMatch,
  clearMatchResults,
  resetMatchRequestSent,
  clearMatchRequests,
} = matchmakingSlice.actions;

export default matchmakingSlice.reducer;