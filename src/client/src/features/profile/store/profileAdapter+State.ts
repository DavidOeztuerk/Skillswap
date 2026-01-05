import { createEntityAdapter, type EntityId, type EntityState } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type {
  PublicProfileResponse,
  UserExperienceResponse,
  UserEducationResponse,
  UserReviewResponse,
  UserReviewStatsResponse,
} from '../types';

// ===== DOMAIN MODELS =====

/**
 * Frontend model for a public profile (other users)
 */
export interface PublicProfile {
  userId: string;
  firstName: string;
  lastName: string;
  userName: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  memberSince: string;
  skillsOffered: number;
  skillsLearned: number;
  completedSessions: number;
  averageRating: number;
  totalReviews: number;
  isBlocked: boolean;
  languages: string[];
  timeZone?: string;
  experience: UserExperience[];
  education: UserEducation[];
}

export interface UserExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrent: boolean;
}

export interface UserEducation {
  id: string;
  degree: string;
  institution: string;
  graduationYear?: number;
  graduationMonth?: number;
  description?: string;
}

export interface UserReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  reviewText?: string;
  skillName?: string;
  createdAt: string;
}

// ===== ENTITY ADAPTER =====

export const profilesAdapter = createEntityAdapter<PublicProfile, EntityId>({
  selectId: (profile) => profile.userId,
  sortComparer: (a, b) => a.userName.localeCompare(b.userName),
});

// ===== STATE INTERFACE =====

export interface ProfileEntityState extends EntityState<PublicProfile, EntityId>, RequestState {
  // Currently viewed profile
  selectedProfileId: string | null;

  // Reviews for currently viewed profile
  currentProfileReviews: UserReview[];
  reviewsPagination: PaginationState;
  isReviewsLoading: boolean;

  // Review stats (histogram data)
  currentProfileStats: UserReviewStatsResponse | null;
  isStatsLoading: boolean;
  reviewsStarFilter: number | null;

  // Own profile data (for editing)
  ownExperience: UserExperience[];
  ownEducation: UserEducation[];
  isOwnDataLoading: boolean;
  isSaving: boolean;
  saveError?: string;
}

export interface PaginationState {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ===== INITIAL STATE =====

export const initialProfileState: ProfileEntityState = profilesAdapter.getInitialState({
  // Currently viewed profile
  selectedProfileId: null,

  // Reviews
  currentProfileReviews: [],
  reviewsPagination: {
    pageNumber: 1,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  isReviewsLoading: false,

  // Review stats (histogram data)
  currentProfileStats: null,
  isStatsLoading: false,
  reviewsStarFilter: null,

  // Own profile data
  ownExperience: [],
  ownEducation: [],
  isOwnDataLoading: false,
  isSaving: false,
  saveError: undefined,

  // From RequestState
  isLoading: false,
  errorMessage: undefined,
});

// ===== ADAPTER SELECTORS =====

export const profileSelectors = profilesAdapter.getSelectors();

// ===== MAPPING FUNCTIONS =====

export const mapExperienceResponse = (response: UserExperienceResponse): UserExperience => ({
  id: response.id,
  title: response.title,
  company: response.company,
  startDate: response.startDate,
  endDate: response.endDate,
  description: response.description,
  isCurrent: response.isCurrent,
});

export const mapEducationResponse = (response: UserEducationResponse): UserEducation => ({
  id: response.id,
  degree: response.degree,
  institution: response.institution,
  graduationYear: response.graduationYear,
  graduationMonth: response.graduationMonth,
  description: response.description,
});

export const mapReviewResponse = (response: UserReviewResponse): UserReview => ({
  id: response.id,
  reviewerId: response.reviewerId,
  reviewerName: response.reviewerName,
  reviewerAvatar: response.reviewerAvatar,
  rating: response.rating,
  reviewText: response.reviewText,
  skillName: response.skillName,
  createdAt: response.createdAt,
});

/**
 * Maps backend PublicProfileResponse to frontend PublicProfile model
 */
export const mapPublicProfileResponse = (response: PublicProfileResponse): PublicProfile => ({
  userId: response.userId,
  firstName: response.firstName,
  lastName: response.lastName,
  userName: response.userName,
  headline: response.headline,
  bio: response.bio,
  avatarUrl: response.avatarUrl,
  memberSince: response.memberSince,
  skillsOffered: response.skillsOffered,
  skillsLearned: response.skillsLearned,
  completedSessions: response.completedSessions ?? 0,
  averageRating: response.averageRating,
  totalReviews: response.totalReviews,
  isBlocked: response.isBlocked,
  languages: response.languages ?? [],
  timeZone: response.timeZone,
  experience: (response.experience ?? []).map(mapExperienceResponse),
  education: (response.education ?? []).map(mapEducationResponse),
});
