// src/features/matchmaking/matchmakingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import matchmakingService from '../../api/services/matchmakingService';
import { MatchmakingState } from '../../types/states/MatchmakingState';
// import { MatchFilter } from '../../types/models/MatchFilter';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { Match } from '../../types/models/Match';

// Initialer State für den Matchmaking-Reducer
const initialState: MatchmakingState = {
  matches: [],
  activeMatch: null,
  matchResults: [],
  matchRequestSent: false,
  isLoading: false,
  error: undefined,
};

// Async Thunk für das Laden aller Matches
// export const fetchMatches = createAsyncThunk(
//   'matchmaking/fetchMatches',
//   // async (filter: MatchFilter | null, { rejectWithValue }) => {
//   //   try {
//   //     // const response = await matchmakingService.getMatches(filter);
//   //     // return response;
//   //     // if (response.success && response.data) {
//   //     //   return response.data;
//   //     // }
//   //     // return rejectWithValue(
//   //     //   response.message || 'Matches konnten nicht geladen werden'
//   //     // );
//   //   } catch (error) {
//   //     return rejectWithValue(
//   //       error instanceof Error
//   //         ? error.message
//   //         : 'Matches konnten nicht geladen werden'
//   //     );
//   //    }
//   //  }
// );

// Async Thunk für das Suchen eines Matches
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
      //   response.message || 'Match konnte nicht gefunden werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match konnte nicht gefunden werden'
      );
    }
  }
);

// Async Thunk für das Laden eines einzelnen Matches
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
      //   response.message || 'Match konnte nicht geladen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match konnte nicht geladen werden'
      );
    }
  }
);

// Async Thunk für das Akzeptieren eines Matches
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
      //   response.message || 'Match konnte nicht akzeptiert werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match konnte nicht akzeptiert werden'
      );
    }
  }
);

// Async Thunk für das Ablehnen eines Matches
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
      //   response.message || 'Match konnte nicht abgelehnt werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Match konnte nicht abgelehnt werden'
      );
    }
  }
);

// Async Thunk für die Suche nach potentiellen Matching-Partnern
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
      //   response.message || 'Potentielle Matches konnten nicht gefunden werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Potentielle Matches konnten nicht gefunden werden'
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
      state.error = undefined;
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Matches
      // .addCase(fetchMatches.pending, (state) => {
      //   state.isLoading = true;
      //   state.error = undefined;
      // })
      // // .addCase(fetchMatches.fulfilled, (state, action) => {
      // //   state.isLoading = false;
      // //   // state.matches = action.payload;
      // // })
      // .addCase(fetchMatches.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.error = action.payload as string;
      // })
      // Find Match
      .addCase(findMatch.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(findMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        state.matchRequestSent = true;
        state.matches.push(action.payload);
      })
      .addCase(findMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Match
      .addCase(getMatch.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(getMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
      })
      .addCase(getMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Accept Match
      .addCase(acceptMatch.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(acceptMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        // Aktualisiere auch das Match in der Liste
        const index = state.matches.findIndex(
          (match) => match.id === action.payload.id
        );
        if (index !== -1) {
          state.matches[index] = action.payload;
        }
      })
      .addCase(acceptMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reject Match
      .addCase(rejectMatch.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(rejectMatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        // Aktualisiere auch das Match in der Liste
        const index = state.matches.findIndex(
          (match) => match.id === action.payload.id
        );
        if (index !== -1) {
          state.matches[index] = action.payload;
        }
      })
      .addCase(rejectMatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search Potential Matches
      .addCase(searchPotentialMatches.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(searchPotentialMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchResults = action.payload;
      })
      .addCase(searchPotentialMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setActiveMatch,
  clearMatchResults,
  resetMatchRequestSent,
} = matchmakingSlice.actions;
export default matchmakingSlice.reducer;
