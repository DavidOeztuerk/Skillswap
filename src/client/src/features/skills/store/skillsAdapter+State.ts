import { createEntityAdapter, type EntityId, type EntityState } from '@reduxjs/toolkit';
import { withDefault } from '../../../shared/utils/safeAccess';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { SkillCategoryResponse } from '../types/CreateSkillResponse';
import type { Skill, SkillCategory } from '../types/Skill';
import type {
  SkillStatistics,
  SkillRecommendation,
  SkillSearchResultResponse,
  GetUserSkillResponse,
} from '../types/SkillResponses';

export const skillsAdapter = createEntityAdapter<Skill, EntityId>({
  selectId: (skill) => skill.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export interface SkillsEntityState extends EntityState<Skill, EntityId>, RequestState {
  allSkillIds: string[];
  userSkillIds: string[];

  // UI State
  favoriteSkillIds: string[];
  selectedSkillId: string | null;
  searchQuery: string;
  searchResults: string[]; // skill IDs
  isSearchActive: boolean;

  // Pagination
  allSkillsPagination: PaginationState;
  userSkillsPagination: PaginationState;
  favoriteSkillsPagination: PaginationState;
  searchResultsPagination: PaginationState;

  // Additional Data
  statistics: SkillStatistics | null;
  recommendations: SkillRecommendation[];
  popularTags: { tag: string; count: number }[];
}

export const initialSkillsState: SkillsEntityState = skillsAdapter.getInitialState({
  // Collection tracking (EntityAdapter provides entities + ids automatically)
  allSkillIds: [],
  userSkillIds: [],

  // UI State
  favoriteSkillIds: [],
  selectedSkillId: null,
  searchQuery: '',
  searchResults: [],
  isSearchActive: false,

  // Pagination
  allSkillsPagination: {
    pageNumber: 1,
    pageSize: 12,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  userSkillsPagination: {
    pageNumber: 1,
    pageSize: 12,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  favoriteSkillsPagination: {
    pageNumber: 1,
    pageSize: 12,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  searchResultsPagination: {
    pageNumber: 1,
    pageSize: 12,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  // Additional Data
  statistics: null,
  recommendations: [],
  popularTags: [],

  isLoading: false,
  errorMessage: undefined,
});

export const skillsSelectors = skillsAdapter.getSelectors();

// ===== PAGINATION STATE =====
export interface PaginationState {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ===== MAPPING FUNCTIONS =====

/**
 * Maps backend SkillSearchResultResponse to frontend Skill model
 */
export const mapSkillResponseToSkill = (response: SkillSearchResultResponse): Skill => ({
  id: response.skillId,
  userId: response.userId,
  name: response.name,
  description: response.description,
  isOffered: response.isOffered,
  category: {
    id: response.category.categoryId,
    name: response.category.name,
    iconName: response.category.iconName,
    color: response.category.color,
  },
  // tagsJson is already a JSON string from the backend - pass it directly
  tagsJson: response.tagsJson,
  averageRating: withDefault(response.averageRating, 0),
  reviewCount: withDefault(response.reviewCount, 0),
  endorsementCount: withDefault(response.endorsementCount, 0),
  estimatedDurationMinutes: withDefault(response.estimatedDurationMinutes, 0),
  createdAt: response.createdAt.toString(),
  lastActiveAt: response.lastActiveAt == null ? undefined : response.lastActiveAt.toString(),
  // Location fields
  locationType: response.locationType,
  locationCity: response.locationCity,
  locationCountry: response.locationCountry,
  maxDistanceKm: response.maxDistanceKm,
  // Owner info
  ownerUserName: response.ownerUserName,
  ownerFirstName: response.ownerFirstName,
  ownerLastName: response.ownerLastName,
});

export const mapUserSkillsResponseToSkill = (response: GetUserSkillResponse): Skill => ({
  id: response.skillId,
  userId: response.userId,
  name: response.name,
  description: response.description,
  isOffered: response.isOffered,
  category: {
    id: response.category.categoryId,
    name: response.category.name,
    iconName: response.category.iconName,
    color: response.category.color,
  },
  // tags is an array, convert to JSON string for consistency
  tagsJson: Array.isArray(response.tags) ? JSON.stringify(response.tags) : '',
  averageRating: withDefault(response.rating, 0),
  reviewCount: withDefault(response.reviewCount, 0),
  endorsementCount: withDefault(response.endorsementCount, 0),
  createdAt: response.createdAt.toString(),
  lastActiveAt: response.updatedAt.toString(),
});

export const mapCategoryResponse = (response: SkillCategoryResponse): SkillCategory => ({
  id: response.categoryId,
  name: response.name,
  iconName: response.iconName,
  color: response.color,
});
