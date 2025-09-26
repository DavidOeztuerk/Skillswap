import { createSlice } from '@reduxjs/toolkit';
import { withDefault, isDefined } from '../../utils/safeAccess';
import { initialMatchesState } from '../../store/adapters/matchmakingAdapter+State';
import { createMatchRequest, fetchMatches, fetchUserMatches, fetchIncomingMatchRequests, fetchOutgoingMatchRequests, acceptMatchRequest, rejectMatchRequest, fetchMatchRequestThread } from './matchmakingThunks';

const matchmakingSlice = createSlice({
  name: 'matchmaking',
  initialState: initialMatchesState,
  reducers: {
    clearError: (s) => { s.errorMessage = undefined; },
    resetMatchRequestSent: (s) => { s.matchRequestSent = false; },
    clearMatchRequests: (s) => { s.incomingRequests = []; s.outgoingRequests = []; },
    clearMatches: (s) => { s.matches = []; },
    clearCurrentThread: (s) => { s.currentThread = null; },
    setPagination: (s, a) => {
      s.pagination = { ...s.pagination, ...a.payload };
    },
    // Optimistic
    acceptMatchRequestOptimistic: (s, a) => {
      const id = a.payload;
      const req = s.incomingRequests.find(r => r.id === id);
      if (!req) return;
      req.status = 'accepted';
      req.isRead = true;
      s.incomingRequests = s.incomingRequests.filter(r => r.id !== id);
    },
    rejectMatchRequestOptimistic: (s, a) => {
      const id = a.payload;
      const req = s.incomingRequests.find(r => r.id === id);
      if (req) req.status = 'rejected';
    },
    markRequestAsRead: (s, a) => {
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
        s.errorMessage = undefined;
        s.matchRequestSent = false;
      })
      .addCase(createMatchRequest.fulfilled, (s) => {
        s.isLoading = false;
        s.matchRequestSent = true;
      })
      // search matches by criteria
      .addCase(fetchMatches.fulfilled, (s, a) => {
        s.isLoading = false;
        if (isDefined(a.payload.data)) {
          s.matches = a.payload.data;
        } else {
          s.matches = [];
        }
        s.pagination = {
          pageNumber: withDefault(a.payload.pagination.pageNumber, 1),
          pageSize: withDefault(a.payload.pagination.pageSize, 20),
          totalRecords: withDefault(a.payload.pagination.totalRecords, 0),
          totalPages: withDefault(a.payload.pagination.totalPages, 0),
          hasNextPage: withDefault(a.payload.pagination.hasNextPage, false),
          hasPreviousPage: withDefault(a.payload.pagination.hasPreviousPage, false),
        };
      })
      // user matches
      .addCase(fetchUserMatches.pending, (s) => { s.isLoading = true; })
      .addCase(fetchUserMatches.fulfilled, (s, a) => {
        s.isLoading = false;
        if (isDefined(a.payload.data)) {
          s.matches = a.payload.data;
        } else {
          s.matches = [];
        }
        s.pagination = {
          pageNumber: withDefault(a.payload.pagination.pageNumber, 1),
          pageSize: withDefault(a.payload.pagination.pageSize, 20),
          totalRecords: withDefault(a.payload.pagination.totalRecords, 0),
          totalPages: withDefault(a.payload.pagination.totalPages, 0),
          hasNextPage: withDefault(a.payload.pagination.hasNextPage, false),
          hasPreviousPage: withDefault(a.payload.pagination.hasPreviousPage, false),
        };
      })
      // incoming
      .addCase(fetchIncomingMatchRequests.pending, (s) => { s.isLoadingRequests = true; })
      .addCase(fetchIncomingMatchRequests.fulfilled, (s, a) => {
        s.isLoadingRequests = false;
        if (isDefined(a.payload.data)) {
          s.incomingRequests = a.payload.data;
        } else {
          s.incomingRequests = [];
        }
        s.pagination = {
          pageNumber: withDefault(a.payload.pagination.pageNumber, 1),
          pageSize: withDefault(a.payload.pagination.pageSize, 20),
          totalRecords: withDefault(a.payload.pagination.totalRecords, 0),
          totalPages: withDefault(a.payload.pagination.totalPages, 0),
          hasNextPage: withDefault(a.payload.pagination.hasNextPage, false),
          hasPreviousPage: withDefault(a.payload.pagination.hasPreviousPage, false),
        };
      })
      // outgoing
      .addCase(fetchOutgoingMatchRequests.pending, (s) => { s.isLoadingRequests = true; })
      .addCase(fetchOutgoingMatchRequests.fulfilled, (s, a) => {
        s.isLoadingRequests = false;
        if (isDefined(a.payload.data)) {
          s.outgoingRequests = a.payload.data;
        } else {
          s.outgoingRequests = [];
        }
        s.pagination = {
          pageNumber: withDefault(a.payload.pagination.pageNumber, 1),
          pageSize: withDefault(a.payload.pagination.pageSize, 20),
          totalRecords: withDefault(a.payload.pagination.totalRecords, 0),
          totalPages: withDefault(a.payload.pagination.totalPages, 0),
          hasNextPage: withDefault(a.payload.pagination.hasNextPage, false),
          hasPreviousPage: withDefault(a.payload.pagination.hasPreviousPage, false),
        };
      })
      // accept
      .addCase(acceptMatchRequest.fulfilled, (s, a) => {
        s.isLoading = false;
        if (isDefined(a.payload.data)) {
          const id = a.payload.data.requestId;
          s.incomingRequests = s.incomingRequests.filter(r => (r as any).id !== id);
          const match = (a.payload.data as any)?.match;
          if (isDefined(match)) {
            s.matches.unshift(match);
          }
        }
      })
      // reject
      .addCase(rejectMatchRequest.fulfilled, (s, a) => {
        s.isLoading = false;
        if (isDefined(a.payload.data)) {
          const id = a.payload.data.requestId;
          s.incomingRequests = s.incomingRequests.filter(r => (r as any).id !== id);
        }
      })
      // thread
      .addCase(fetchMatchRequestThread.pending, (s) => { s.isLoadingThread = true; })
      .addCase(fetchMatchRequestThread.fulfilled, (s, a) => {
        s.isLoadingThread = false;
        if (isDefined(a.payload.data) && a.payload.data.skill) {
          // Map MatchThreadDisplay to MatchRequestThread
          s.currentThread = {
            threadId: a.payload.data.threadId,
            skill: {
              id: a.payload.data.skillId || '', // Add the required id field
              name: a.payload.data.skill.name,
              category: a.payload.data.skill.category,
            },
            participants: {
              requester: {
                // TODO: - requester Data fetch here!!
                id: a.payload.data.partnerId || '',
                name: a.payload.data.partnerName || '',
                rating: a.payload.data.partnerRating || 0,
                avatar: a.payload.data.partnerAvatar,

              },
              targetUser: {
                id: a.payload.data.partnerId || '',
                name: a.payload.data.partnerName || '',
                rating: a.payload.data.partnerRating || 0,
                avatar: a.payload.data.partnerAvatar,
              },
            },
            requests: a.payload.data.requests?.map(req => ({
              id: req.id,
              requesterId: req.requesterId || '',
              message: req.message,
              type: req.type as 'initial' | 'counter' | 'acceptance' | 'rejection',
              status: req.status as 'pending' | 'accepted' | 'rejected' | 'countered',
              isSkillExchange: req.isSkillExchange ?? false,
              exchangeSkillName: req.exchangeSkillName,
              isMonetary: req.isMonetary ?? false,
              offeredAmount: req.offeredAmount,
              preferredDays: req.preferredDays || [],
              preferredTimes: req.preferredTimes || [],
              sessionDuration: req.sessionDuration || 0,
              totalSessions: req.totalSessions || 1,
              createdAt: req.createdAt || '',
              isRead: req.isRead ?? false,
            })) || [],
            lastActivity: a.payload.data.lastActivity || '',
            status: (a.payload.data.status as 'active' | 'accepted' | 'rejected' | 'expired') || 'active',
          };
        } else {
          s.currentThread = null;
        }
      })
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
