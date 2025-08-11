// Display-focused interfaces for matchmaking - no transformations needed
// These match exactly what the UI needs

// Legacy compatibility imports
export type { Match } from '../models/Match';
export { MatchStatus } from '../models/Match';

export interface MatchRequestDisplay {
  id: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  type: 'incoming' | 'outgoing';
  
  // User info (requester or target based on type)
  otherUserId: string;
  otherUserName: string;
  otherUserRating: number;
  otherUserAvatar?: string;
  
  // Exchange info (if applicable)
  isSkillExchange: boolean;
  exchangeSkillId?: string;
  exchangeSkillName?: string;
  
  // Monetary info (if applicable)  
  isMonetary: boolean;
  offeredAmount?: number;
  currency?: string;
  
  // Session details
  sessionDurationMinutes: number;
  totalSessions: number;
  preferredDays: string[];
  preferredTimes: string[];
  
  // Timestamps
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
  
  // Thread info
  threadId?: string;
  
  // UI state
  isRead: boolean;
}

export interface MatchDisplay {
  id: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  
  // Partner info
  partnerId: string;
  partnerName: string;
  partnerRating: number;
  partnerAvatar?: string;
  
  // Legacy compatibility properties
  requesterId: string;
  requesterDetails?: {
    name: string;
    rating: number;
    avatar?: string;
  };
  responderId: string;
  responderDetails?: {
    name: string;
    rating: number;
    avatar?: string;
  };
  skill?: {
    name: string;
    category: string;
  };
  
  // Match details
  isOffering: boolean; // Am I offering this skill?
  compatibilityScore?: number;
  
  // Timestamps
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface MatchThreadDisplay {
  threadId: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  
  // Participants
  partnerId: string;
  partnerName: string;
  partnerRating: number;
  partnerAvatar?: string;
  
  // Legacy compatibility
  skill?: {
    name: string;
    category: string;
  };
  participants?: Array<{
    id: string;
    name: string;
    rating: number;
    avatar?: string;
  }>;
  
  // Requests in thread
  requests: MatchRequestInThreadDisplay[];
  
  // Meta
  lastActivity: string;
}

export interface MatchRequestInThreadDisplay {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  type: 'initial' | 'counter' | 'acceptance' | 'rejection';
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  
  // Legacy compatibility
  requesterId?: string;
  sessionDuration?: number;
  
  // Offer details
  isSkillExchange: boolean;
  exchangeSkillName?: string;
  isMonetary: boolean;
  offeredAmount?: number;
  currency?: string;
  
  // Session details
  sessionDurationMinutes: number;
  totalSessions: number;
  preferredDays: string[];
  preferredTimes: string[];
  
  // Meta
  createdAt: string;
  isRead: boolean;
}

// Request interfaces for API calls
export interface CreateMatchRequestRequest {
  skillId: string;
  targetUserId: string;
  message: string;
  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  isMonetary?: boolean;
  offeredAmount?: number;
  currency?: string;
  sessionDurationMinutes?: number;
  totalSessions?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
}

export interface AcceptMatchRequestRequest {
  responseMessage?: string;
}

export interface AcceptMatchRequestResponse { 
  requestId: string;
  matchId: string;
  acceptedAt: Date;
}

export interface RejectMatchRequestRequest {
  responseMessage?: string;
}

export interface RejectMatchRequestResponse { 
  requestId: string;
  success: boolean;
  rejectedAt: Date;
}

export interface CreateCounterOfferRequest {
  originalRequestId: string;
  message: string;
  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  isMonetary?: boolean;
  offeredAmount?: number;
  currency?: string;
  sessionDurationMinutes?: number;
  totalSessions?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
}

// Response interfaces 
export interface CreateMatchRequestResponse {
  requestId: string;
  status: string;
  createdAt: string;
  threadId: string;
}

export interface MatchRequestListResponse {
  data: MatchRequestDisplay[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MatchListResponse {
  data: MatchDisplay[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}