// Thread status constants matching backend ThreadStatus
export type ThreadStatusType = 'Active' | 'AgreementReached' | 'NoAgreement' | 'Expired';

// Counter-Offer Limit Constants
export const COUNTER_OFFER_LIMITS = {
  /** Max requests for initiator (1 initial + 2 counter-offers) */
  MAX_INITIATOR_REQUESTS: 3,
  /** Max counter-offers for owner */
  MAX_OWNER_REQUESTS: 3,
  /** Max total requests per thread */
  MAX_TOTAL_REQUESTS: 6,
} as const;

export interface MatchRequestThreadResponse {
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
  requests: MatchRequestInThread[];
  lastActivity: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';

  // Counter-Offer Limit Info
  /** Thread status: Active, AgreementReached, NoAgreement, Expired */
  threadStatus: ThreadStatusType;
  /** Remaining requests for initiator (max 3: 1 initial + 2 counter) */
  initiatorRemainingRequests: number;
  /** Remaining requests for owner (max 3 counter-offers) */
  ownerRemainingRequests: number;
  /** Total remaining requests before thread is locked (max 6) */
  totalRemainingRequests: number;
  /** True if thread has reached max 6 requests */
  isLocked: boolean;
}

export interface MatchRequestInThread {
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
}

export interface CounterOfferRequest {
  message: string;
  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  exchangeSkillName?: string;
  isMonetaryOffer?: boolean;
  offeredAmount?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  sessionDurationMinutes?: number;
  totalSessions?: number;
}

export interface CounterOfferResponse {
  id: string;
  requestId: string;
  requesterId: string;
  message: string;
  isSkillExchange: boolean;
  exchangeSkillId?: string;
  exchangeSkillName?: string;
  isMonetaryOffer: boolean;
  offeredAmount?: number;
  preferredDays: string[];
  preferredTimes: string[];
  sessionDurationMinutes: number;
  totalSessions: number;
  status: string;
  createdAt: string;
}

export interface MatchRequestResponse {
  requestId: string;
  requesterId: string;
  requesterName: string;
  targetUserId: string;
  targetUserName: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  description: string;
  message: string;
  status: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
  threadId?: string;
  isSkillExchange: boolean;
  exchangeSkillId?: string;
  exchangeSkillName?: string;
  exchangeSkillCategory?: string;
  isMonetary: boolean;
  offeredAmount?: number;
  currency: string;
  sessionDurationMinutes: number;
  totalSessions: number;
  preferredDays?: string[];
  preferredTimes?: string[];
}

// export interface PagedMatchRequestResponse {
//   data: MatchRequestResponse[];
//   pageNumber: number;
//   pageSize: number;
//   totalCount: number;
//   totalPages: number;
//   hasNextPage: boolean;
//   hasPreviousPage: boolean;
// }

// Backend PagedResponse structure (matches C# PagedResponse<T>)
// export interface BackendPagedResponse<T> {
//   Data: T[];
//   Success: boolean;
//   Message?: string;
//   Errors?: string[];
//   PageNumber: number;
//   PageSize: number;
//   TotalPages: number;
//   TotalRecords: number;
//   HasNextPage: boolean;
//   HasPreviousPage: boolean;
// }

// Dedicated User type for API responses (subset of full User)
export interface ApiUserDetails {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  // Extend User interface for API compatibility
  email?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  phoneNumber?: string;
  bio?: string;
  timeZone?: string;
  roles?: string[];
  emailVerified?: boolean;
  accountStatus?: string;
  createdAt?: string;
  lastLoginAt?: string;
  preferences?: Record<string, string>;
  profilePictureUrl?: string;
}

// Dedicated Skill type for API responses (subset of full Skill)
export interface ApiSkillDetails {
  id: string;
  name: string;
  category: string;
  // Extend Skill interface for API compatibility
  userId?: string;
  description?: string;
  isOffered?: boolean;
  tagsJson?: string;
  averageRating?: number;
  reviewCount?: number;
  endorsementCount?: number;
  estimatedDurationMinutes?: number;
  createdAt?: string;
  lastActiveAt?: string;
  matchRequests?: number;
  activeMatches?: number;
  completionRate?: number;
  isVerified?: boolean;
}

export interface MatchDetailsResponse {
  id: string;
  requesterId: string;
  responderId: string;
  responderDetails: ApiUserDetails;
  requesterDetails: ApiUserDetails;
  skillId: string;
  skill: ApiSkillDetails;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  isLearningMode: boolean;
  preferredDays: string[];
  preferredTimes: string[];
  additionalNotes: string;
  compatibilityScore: number;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
}

export interface GetIncomingMatchRequestsRequest {
  PageNumber?: number;
  PageSize?: number;
}

export interface GetOutgoingMatchRequestsRequest {
  PageNumber?: number;
  PageSize?: number;
}

export interface GetAcceptedMatchRequestsRequest {
  PageNumber?: number;
  PageSize?: number;
}

export interface UserMatchItem {
  MatchId: string;
  IsOffering: boolean;
  SkillName: string;
  Status: string;
  CompatibilityScore?: number;
  CreatedAt: string;
  AcceptedAt?: string;
}

export interface GetUserMatchesResponse {
  Data: UserMatchItem[];
  PageNumber: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
}

export interface CreateMatchRequestResponse {
  RequestId: string;
  Status: string;
  CreatedAt: string;
  ThreadId: string;
}
