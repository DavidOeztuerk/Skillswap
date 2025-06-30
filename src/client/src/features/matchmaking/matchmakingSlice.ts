import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import matchmakingService from '../../api/services/matchmakingService';
import { MatchmakingState } from '../../types/states/MatchmakingState';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
import { Match } from '../../types/models/Match';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';

// Initialer State für den Matchmaking-Reducer
const initialState: MatchmakingState = {
  matches: [],
  activeMatch: null,
  matchResults: [],
  matchRequestSent: false,
  incomingRequests: [], // ✅ NEU
  outgoingRequests: [], // ✅ NEU
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
          : 'Match-Anfrage konnte nicht erstellt werden'
      );
    }
  }
);

// ✅ NEU: Eingehende Match-Anfragen laden
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
          : 'Eingehende Anfragen konnten nicht geladen werden'
      );
    }
  }
);

// ✅ NEU: Ausgehende Match-Anfragen laden
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
          : 'Ausgehende Anfragen konnten nicht geladen werden'
      );
    }
  }
);

// ✅ NEU: Match-Anfrage akzeptieren
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
          : 'Match-Anfrage konnte nicht akzeptiert werden'
      );
    }
  }
);

// ✅ NEU: Match-Anfrage ablehnen
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
          : 'Match-Anfrage konnte nicht abgelehnt werden'
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
      })
      .addCase(createMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(createMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchRequestSent = true;
        state.outgoingRequests.push(action.payload);
      })
      .addCase(createMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ✅ NEU: Fetch Incoming Requests Cases
      .addCase(fetchIncomingMatchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchIncomingMatchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incomingRequests = action.payload;
      })
      .addCase(fetchIncomingMatchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ✅ NEU: Fetch Outgoing Requests Cases
      .addCase(fetchOutgoingMatchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(fetchOutgoingMatchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.outgoingRequests = action.payload;
      })
      .addCase(fetchOutgoingMatchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ✅ NEU: Accept Match Request Cases
      .addCase(acceptMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(acceptMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeMatch = action.payload;
        state.matches.push(action.payload);
        // Entferne aus eingehenden Anfragen
        state.incomingRequests = state.incomingRequests.filter(
          (req) => req.matchId !== action.payload.id
        );
      })
      .addCase(acceptMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ✅ NEU: Reject Match Request Cases
      .addCase(rejectMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(rejectMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        // Entferne aus eingehenden Anfragen
        state.incomingRequests = state.incomingRequests.filter(
          (req) => req.matchId !== action.payload
        );
      })
      .addCase(rejectMatchRequest.rejected, (state, action) => {
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
  clearMatchRequests, // ✅ NEU
} = matchmakingSlice.actions;
export default matchmakingSlice.reducer;
