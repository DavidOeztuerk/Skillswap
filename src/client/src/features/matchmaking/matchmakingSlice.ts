import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { isDefined } from '../../utils/safeAccess';
import { initialMatchesState, matchesAdapter } from '../../store/adapters/matchmakingAdapter+State';
import {
  createMatchRequest,
  fetchMatches,
  fetchUserMatches,
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
  acceptMatchRequest,
  rejectMatchRequest,
  fetchMatchRequestThread,
} from './matchmakingThunks';

/**
 * MATCHMAKING SLICE - REFACTORED WITH ENTITY ADAPTER
 *
 * ✅ Pattern: Use EntityAdapter for normalized state (matches)
 * ✅ Removed duplicate arrays: matches[], matchHistory[], acceptedRequests[]
 * ✅ All match operations use adapter methods: setAll, addOne, updateOne, removeOne
 * ✅ Kept separate arrays for requests (different entity type)
 * ✅ Selectors will compute derived data (active/completed matches) from entities
 */

const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState: initialMatchesState,
  reducers: {
    // ==================== BASIC STATE MANAGEMENT ====================
    clearError: (state) => {
      state.errorMessage = undefined;
    },

    resetMatchRequestSent: (state) => {
      state.matchRequestSent = false;
    },

    clearMatchRequests: (state) => {
      state.incomingRequests = [];
      state.outgoingRequests = [];
    },

    clearMatches: (state) => {
      matchesAdapter.removeAll(state);
    },

    clearCurrentThread: (state) => {
      state.currentThread = null;
    },

    setPagination: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // ==================== OPTIMISTIC UPDATES ====================

    /**
     * Optimistically accept match request (remove from incoming, don't update entities yet)
     */
    acceptMatchRequestOptimistic: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const req = state.incomingRequests.find((r) => r.id === id);
      if (!req) return;

      req.status = 'accepted';
      req.isRead = true;
      state.incomingRequests = state.incomingRequests.filter((r) => r.id !== id);
    },

    /**
     * Optimistically reject match request (update status)
     */
    rejectMatchRequestOptimistic: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const req = state.incomingRequests.find((r) => r.id === id);
      if (req) {
        req.status = 'rejected';
      }
    },

    /**
     * Mark request as read
     */
    markRequestAsRead: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const inReq = state.incomingRequests.find((r) => r.id === id);
      if (inReq) inReq.isRead = true;

      const outReq = state.outgoingRequests.find((r) => r.id === id);
      if (outReq) outReq.isRead = true;
    },
  },

  extraReducers: (builder) => {
    builder
      // ==================== CREATE MATCH REQUEST ====================
      .addCase(createMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
        state.matchRequestSent = false;
      })
      .addCase(createMatchRequest.fulfilled, (state) => {
        state.isLoading = false;
        state.matchRequestSent = true;
      })
      .addCase(createMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== FETCH MATCHES (SEARCH BY CRITERIA) ====================
      .addCase(fetchMatches.pending, (state) => {
        state.isLoadingMatches = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.isLoadingMatches = false;

        if (isDefined(action.payload.data)) {
          // Replace all entities with fetched matches
          matchesAdapter.setAll(state, action.payload.data);
        } else {
          matchesAdapter.removeAll(state);
        }

        state.pagination = {
          pageNumber: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalRecords: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
        };
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.isLoadingMatches = false;
        state.errorMessage = action.error.message ?? 'Failed to fetch matches';
      })

      // ==================== FETCH USER MATCHES ====================
      .addCase(fetchUserMatches.pending, (state) => {
        state.isLoadingMatches = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchUserMatches.fulfilled, (state, action) => {
        state.isLoadingMatches = false;

        if (isDefined(action.payload.data)) {
          // Merge user matches into entities (upsertMany)
          matchesAdapter.upsertMany(state, action.payload.data);
        }

        state.pagination = {
          pageNumber: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalRecords: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
        };
      })
      .addCase(fetchUserMatches.rejected, (state, action) => {
        state.isLoadingMatches = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== FETCH INCOMING REQUESTS ====================
      .addCase(fetchIncomingMatchRequests.pending, (state) => {
        state.isLoadingRequests = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchIncomingMatchRequests.fulfilled, (state, action) => {
        state.isLoadingRequests = false;

        if (isDefined(action.payload.data)) {
          state.incomingRequests = action.payload.data;
        } else {
          state.incomingRequests = [];
        }

        state.pagination = {
          pageNumber: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalRecords: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
        };
      })
      .addCase(fetchIncomingMatchRequests.rejected, (state, action) => {
        state.isLoadingRequests = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== FETCH OUTGOING REQUESTS ====================
      .addCase(fetchOutgoingMatchRequests.pending, (state) => {
        state.isLoadingRequests = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchOutgoingMatchRequests.fulfilled, (state, action) => {
        state.isLoadingRequests = false;

        if (isDefined(action.payload.data)) {
          state.outgoingRequests = action.payload.data;
        } else {
          state.outgoingRequests = [];
        }

        state.pagination = {
          pageNumber: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalRecords: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
          hasNextPage: action.payload.hasNextPage,
          hasPreviousPage: action.payload.hasPreviousPage,
        };
      })
      .addCase(fetchOutgoingMatchRequests.rejected, (state, action) => {
        state.isLoadingRequests = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== ACCEPT MATCH REQUEST ====================
      .addCase(acceptMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(acceptMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          const { requestId } = action.payload.data;

          // Remove from incoming requests
          state.incomingRequests = state.incomingRequests.filter((r) => r.id !== requestId);

          // Note: AcceptMatchRequestResponse only contains requestId, matchId, acceptedAt
          // Full match data should be refetched separately via fetchMatches
        }
      })
      .addCase(acceptMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== REJECT MATCH REQUEST ====================
      .addCase(rejectMatchRequest.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(rejectMatchRequest.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isDefined(action.payload.data)) {
          const { requestId } = action.payload.data;
          // Remove from incoming requests
          state.incomingRequests = state.incomingRequests.filter((r) => r.id !== requestId);
        }
      })
      .addCase(rejectMatchRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      // ==================== FETCH MATCH REQUEST THREAD ====================
      .addCase(fetchMatchRequestThread.pending, (state) => {
        state.isLoadingThread = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchMatchRequestThread.fulfilled, (state, action) => {
        state.isLoadingThread = false;

        if (isDefined(action.payload.data)) {
          // Map MatchThreadDisplay to MatchRequestThread
          const threadData = action.payload.data;
          const requesterId = threadData.requesterId || '';
          const requesterName = threadData.requesterName || 'Unknown User';
          const targetUserId = threadData.targetUserId || '';
          const targetUserName = threadData.targetUserName || 'Unknown User';

          state.currentThread = {
            threadId: threadData.threadId,
            skill: {
              id: threadData.skillId || '',
              name: threadData.skillName || 'Unknown Skill',
              category: threadData.skillCategory || 'General',
            },
            participants: {
              requester: {
                id: requesterId,
                name: requesterName,
                rating: threadData.requesterRating || 0,
                avatar: undefined,
              },
              targetUser: {
                id: targetUserId,
                name: targetUserName,
                rating: threadData.targetUserRating || 0,
                avatar: undefined,
              },
            },
            requests: threadData.requests.map((req) => {
              // Derive sender name from requesterId - check if it matches requester or target
              const isRequester = req.requesterId === requesterId;
              const senderName = isRequester ? requesterName : targetUserName;

              return {
                id: req.id,
                senderId: req.requesterId || '',
                senderName,
                message: req.message,
                type: req.type,
                status: req.status,
                requesterId: req.requesterId,
                sessionDuration: req.sessionDuration,
                isSkillExchange: req.isSkillExchange,
                exchangeSkillName: req.exchangeSkillName,
                isMonetary: req.isMonetary,
                offeredAmount: req.offeredAmount,
                currency: req.currency,
                preferredDays: req.preferredDays,
                preferredTimes: req.preferredTimes,
                sessionDurationMinutes: req.sessionDuration || req.sessionDurationMinutes || 0,
                totalSessions: req.totalSessions || 1,
                createdAt: req.createdAt,
                isRead: req.isRead,
              };
            }),
            lastActivity: threadData.lastActivity,
            status: threadData.status,
          };
        } else {
          state.currentThread = null;
        }
      })
      .addCase(fetchMatchRequestThread.rejected, (state, action) => {
        state.isLoadingThread = false;
        state.errorMessage = action.payload?.message;
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
  markRequestAsRead,
} = matchmakingSlice.actions;

export default matchmakingSlice.reducer;
