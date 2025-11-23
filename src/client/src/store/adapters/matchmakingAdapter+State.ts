import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { RequestState } from "../../types/common/RequestState";
import { MatchDisplay, MatchRequestDisplay, MatchRequestInThreadDisplay } from "../../types/contracts/MatchmakingDisplay";
import { User } from "../../types/models/User";

/**
 * ✅ REFACTORED: Use MatchDisplay in EntityAdapter (not Match domain model)
 * Backend returns MatchDisplay, so we store that directly in normalized state
 */
export const matchesAdapter = createEntityAdapter<MatchDisplay, EntityId>({
  selectId: (match) => {
    if (!match?.id) {
      console.error('Match without ID detected:', match);
      return `temp-${Date.now()}-${Math.random()}`;
    }
    return match.id;
  },
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

/**
 * ✅ REFACTORED: Removed duplicate state arrays
 *
 * EntityAdapter provides: entities + ids (normalized state for matches)
 * No need for: matches[], matchHistory[], acceptedRequests[]
 *
 * Kept separate arrays for requests (incoming/outgoing) because:
 * - They're different entity types (MatchRequestDisplay vs MatchDisplay)
 * - They have separate pagination/loading states
 * - They're managed independently from matches
 */
export interface MatchesEntityState extends EntityState<MatchDisplay, EntityId>, RequestState {
  activeMatch: MatchDisplay | null;
  matchResults: User[];
  matchRequestSent: boolean;
  incomingRequests: MatchRequestDisplay[];
  outgoingRequests: MatchRequestDisplay[];
  matchPreferences: MatchPreferences | null;
  currentThread: MatchRequestThread | null;
  pagination: MatchPagination;
  filters: MatchFilters;
  isLoadingMatches: boolean;
  isLoadingRequests: boolean;
  isLoadingThread: boolean;
}

export const initialMatchesState: MatchesEntityState = matchesAdapter.getInitialState({
  incomingRequests: [],
  outgoingRequests: [],
  activeMatch: null,
  matchResults: [],
  currentThread: null,
  filters: {
    status: 'all',
    dateRange: null,
    skillCategory: 'all',
    experienceLevel: 'all',
  },
  isLoadingMatches: false,
  matchPreferences: null,
  pagination: {
    pageNumber: 1,
    pageSize: 20,
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  isLoading: false,
  isLoadingRequests: false,
  isLoadingThread: false,
  matchRequestSent: false,
  errorMessage: undefined,
});

export const matchesSelectors = matchesAdapter.getSelectors();

export interface MatchRequestItem {
  id: string;
  requesterId: string;
  targetUserId: string;
  skillId: string;
  description?: string;
  message: string;
  status: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
  threadId?: string;
  isOffered?: boolean;
  isSkillExchange: boolean;
  exchangeSkillId?: string;
  isMonetary?: boolean;
  offeredAmount?: number;
  currency: string;
  sessionDurationMinutes: number;
  totalSessions?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  // UI-specific properties
  type?: 'incoming' | 'outgoing';
  isRead: boolean;
  user: {
    name: string;
    avatar?: string;
    rating: number;
  };
  skill: {
    name: string;
    category: string;
    isOffered: boolean;
  };
  exchangeSkill?: {
    name: string;
  };
}

export interface MatchPreferences {
  availableHours: string[];
  preferredLanguages: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningGoals: string[];
  maxDistance?: number;
  onlineOnly: boolean;
  preferredCommunication: ('video' | 'audio' | 'text')[];
}

export interface MatchFilters {
  status: 'all' | 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  dateRange: { start: string; end: string } | null;
  skillCategory: string;
  experienceLevel: 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface MatchPagination {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MatchRequestThread {
  threadId: string;
  skill: {
    id: string;
    name: string;
    category: string;
  };
  participants: {
    requester: {
      id: string;
      name: string;
      rating: number;
      avatar?: string;
    };
    targetUser: {
      id: string;
      name: string;
      rating: number;
      avatar?: string;
    };
  };
  requests: MatchRequestInThreadDisplay[];
  lastActivity: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
}
