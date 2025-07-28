import { Match } from '../models/Match';
import { User } from '../models/User';
import { SliceError } from '../../store/types';

export interface MatchRequestItem {
  matchId: string;
  requesterId: string;
  requesterName: string;
  targetUserId: string;
  skillId: string;
  skillName: string;
  message: string;
  isOffered: boolean;
  status: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
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

export interface MatchmakingState {
  matches: Match[];
  activeMatch: Match | null;
  matchResults: User[];
  matchRequestSent: boolean;
  incomingRequests: MatchRequestItem[];
  outgoingRequests: MatchRequestItem[];
  matchHistory: Match[];
  matchPreferences: MatchPreferences | null;
  pagination: MatchPagination;
  filters: MatchFilters;
  isLoading: boolean;
  isLoadingMatches: boolean;
  isLoadingRequests: boolean;
  error: SliceError | null;
}
