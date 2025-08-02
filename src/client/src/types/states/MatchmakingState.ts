import { Match } from '../models/Match';
import { User } from '../models/User';
import { SliceError } from '../../store/types';

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
  dateRange: { start: Date; end: Date } | null;
  skillCategory: string;
  experienceLevel: 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface MatchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  requests: Array<{
    id: string;
    requesterId: string;
    message: string;
    type: 'initial' | 'counter' | 'acceptance' | 'rejection';
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
    isSkillExchange: boolean;
    exchangeSkillName?: string;
    isMonetary: boolean;
    offeredAmount?: number;
    preferredDays: string[];
    preferredTimes: string[];
    sessionDuration: number;
    totalSessions: number;
    createdAt: string;
    isRead: boolean;
  }>;
  lastActivity: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
}

export interface MatchmakingState {
  matches: Match[];
  activeMatch: Match | null;
  matchResults: User[];
  matchRequestSent: boolean;
  incomingRequests: MatchRequestItem[];
  outgoingRequests: MatchRequestItem[];
  acceptedRequests: MatchRequestItem[];
  matchHistory: Match[];
  matchPreferences: MatchPreferences | null;
  currentThread: MatchRequestThread | null;
  pagination: MatchPagination;
  filters: MatchFilters;
  isLoading: boolean;
  isLoadingMatches: boolean;
  isLoadingRequests: boolean;
  isLoadingThread: boolean;
  error: SliceError | null;
}
