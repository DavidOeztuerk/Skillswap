import type { SkillCategoryResponse } from './CreateSkillResponse';
import type { Skill } from './Skill';

export interface UserSkillResponseData {
  userId: string;
  skillId: string;
  name: string;
  description: string;
  category: {
    categoryId: string;
    name: string;
    iconName?: string;
    color?: string;
    skillCount?: number;
  };
  tags: string[];
  isOffered: boolean;
  averageRating?: number;
  reviewCount: number;
  endorsementCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillDetailsResponse {
  skillId: string;
  userId: string;
  ownerUserName?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerRating?: number;
  ownerMemberSince?: string;
  name: string;
  description: string;
  category: SkillCategoryResponse;
  tags: string[];
  isOffered: boolean;
  rating?: number;
  reviews?: SkillReviewResponse[];
  endorsements?: SkillEndorsementResponse[];
  availableHours?: number;
  preferredSessionDuration?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // Exchange options
  exchangeType?: 'skill_exchange' | 'payment';
  desiredSkillCategoryId?: string;
  desiredSkillDescription?: string;
  hourlyRate?: number;
  currency?: string;
  // Scheduling
  preferredDays?: string[];
  preferredTimes?: string[];
  sessionDurationMinutes?: number;
  totalSessions?: number;
  // Location
  locationType?: 'remote' | 'in_person' | 'both';
  locationAddress?: string;
  locationCity?: string;
  locationPostalCode?: string;
  locationCountry?: string;
  maxDistanceKm?: number;
}

export interface SkillReviewResponse {
  reviewId: string;
  reviewerUserId: string;
  rating: number;
  comment?: string;
  tags: string[];
  createdAt: Date;
}

export interface SkillEndorsementResponse {
  endorsementId: string;
  endorserUserId: string;
  message?: string;
  createdAt: Date;
}

export interface GetUserSkillResponse {
  skillId: string;
  userId: string;
  name: string;
  description: string;
  category: SkillCategoryResponse;
  tags: string[];
  isOffered: boolean;
  rating?: number;
  reviewCount: number;
  endorsementCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional properties for favorites/extended views
  matchCount?: number;
  addedToFavoritesAt?: string;
  ownerId?: string;
  ownerName?: string;
  ownerAvatarUrl?: string;
  thumbnailUrl?: string;
  isFavorite?: boolean;
  price?: number;
  currency?: string;
}

export interface SkillSearchResultResponse {
  skillId: string;
  userId: string;
  name: string;
  description: string;
  isOffered: boolean;
  category: SkillCategoryResponse;
  tagsJson: string; // JSON string like "[\"tag1\",\"tag2\"]"
  averageRating?: number;
  reviewCount: number;
  endorsementCount: number;
  estimatedDurationMinutes?: number;
  createdAt: Date;
  lastActiveAt?: Date;
  // Location fields (from backend)
  locationType?: 'remote' | 'in_person' | 'both';
  locationCity?: string;
  locationCountry?: string;
  maxDistanceKm?: number;
  // Owner info
  ownerUserName?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
}

export interface SkillSearchParams {
  searchTerm?: string;
  categoryId?: string;
  tags?: string[];
  isOffered?: boolean;
  minRating?: number;
  sortBy?:
    | 'relevance'
    | 'popularity'
    | 'rating'
    | 'createdAt'
    | 'updatedAt'
    | 'name'
    | 'category';
  sortDirection?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
  // Location filters
  locationType?: 'remote' | 'in_person' | 'both';
  maxDistanceKm?: number;
  userLatitude?: number;
  userLongitude?: number;
  // User filter (for viewing another user's skills)
  userId?: string;
}

export interface SkillStatistics {
  totalSkills: number;
  skillsOffered: number;
  skillsRequested: number;
  activeSkills: number;
  topCategories: { category: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

export interface SkillRecommendation {
  skill: Skill;
  score: number;
  reason: string;
  matchPercentage: number;
}

// Additional Response Types
export interface DeleteSkillResponse {
  skillId: string;
  success: boolean;
  deletedAt: string;
  apiVersion: string;
}

export interface RateSkillResponse {
  ratingId: string;
  rating: number;
  newAverageRating: number;
  totalRatings: number;
  apiVersion: string;
}

export interface EndorseSkillResponse {
  endorsementId: string;
  totalEndorsements: number;
  apiVersion: string;
}
