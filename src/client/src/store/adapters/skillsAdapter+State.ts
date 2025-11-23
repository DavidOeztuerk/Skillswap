import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { ProficiencyLevel, Skill, SkillCategory } from "../../types/models/Skill";
import { RequestState } from "../../types/common/RequestState";
import { SkillStatistics, SkillRecommendation, GetUserSkillResponse, SkillSearchResultResponse } from "../../types/contracts/responses/SkillResponses";
import { SkillCategoryResponse, ProficiencyLevelResponse } from "../../types/contracts/responses/CreateSkillResponse";
import { withDefault } from "../../utils/safeAccess";

export const skillsAdapter = createEntityAdapter<Skill, EntityId>({
    selectId: (skill) => {
        if (!skill?.id) {
            console.error('Skill without ID detected:', skill);
            return `temp-${Date.now()}-${Math.random()}`;
        }
        return skill.id;
    },
    sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export interface SkillsEntityState extends EntityState<Skill, EntityId>, RequestState {
  // Collection tracking (using EntityAdapter's entities + ids)
  // Instead of duplicating normalized state, track which skills belong to which collection
  allSkillIds: string[];      // IDs of skills from "all skills" endpoint
  userSkillIds: string[];     // IDs of user's skills

  // UI State
  favoriteSkillIds: string[];
  selectedSkillId: string | null;
  searchQuery: string;
  searchResults: string[]; // skill IDs
  isSearchActive: boolean;

  // Pagination
  allSkillsPagination: PaginationState;
  userSkillsPagination: PaginationState;
  searchResultsPagination: PaginationState;

  // Additional Data
  statistics: SkillStatistics | null;
  recommendations: SkillRecommendation[];
  popularTags: Array<{ tag: string; count: number }>;
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
  errorMessage: undefined
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
export const mapSkillResponseToSkill = (response: SkillSearchResultResponse): Skill => {
  return {
    id: response.skillId,
    userId: response.userId,
    name: response.name,
    description: response.description,
    isOffered: response.isOffered,
    category: {
      id: response.category?.categoryId || '',
      name: response.category?.name,
      iconName: response.category?.iconName,
      color: response.category?.color,
    },
    proficiencyLevel: {
      id: response.proficiencyLevel?.levelId || '',
      level: response.proficiencyLevel?.level,
      rank: withDefault(response.proficiencyLevel?.rank, 0),
      color: response.proficiencyLevel?.color,
    },
    tagsJson: Array.isArray(response.tagsJson) ? response.tagsJson.join(',') : (response.tagsJson || ''),
    averageRating: withDefault(response.averageRating, 0),
    reviewCount: withDefault(response.reviewCount, 0),
    endorsementCount: withDefault(response.endorsementCount, 0),
    estimatedDurationMinutes: withDefault(response.estimatedDurationMinutes, 0),
    createdAt: response.createdAt?.toString(),
    lastActiveAt: response.lastActiveAt ? response.lastActiveAt.toString() : undefined,
  };
};

export const mapUserSkillsResponseToSkill = (response: GetUserSkillResponse): Skill => {
  return {
    id: response.skillId,
    userId: response.userId,
    name: response.name,
    description: response.description,
    isOffered: response.isOffered,
    category: {
      id: response.category?.categoryId || '',
      name: response.category?.name,
      iconName: response.category?.iconName,
      color: response.category?.color,
    },
    proficiencyLevel: {
      id: response.proficiencyLevel?.levelId || '',
      level: response.proficiencyLevel?.level,
      rank: withDefault(response.proficiencyLevel?.rank, 0),
      color: response.proficiencyLevel?.color,
    },
    tagsJson: Array.isArray(response.tags) ? response.tags.join(',') : (response.tags || ''),
    averageRating: withDefault(response.rating, 0),
    reviewCount: withDefault(response.reviewCount, 0),
    endorsementCount: withDefault(response.endorsementCount, 0),
    createdAt: response.createdAt?.toString(),
    lastActiveAt: response.updatedAt ? response.updatedAt.toString() : undefined,
  };
};

export const mapCategoryResponse = (response: SkillCategoryResponse): SkillCategory => ({
  id: response.categoryId,
  name: response.name,
  iconName: response.iconName,
  color: response.color,
});

export const mapProficiencyLevelResponse = (response: ProficiencyLevelResponse): ProficiencyLevel => ({
  id: response.levelId,
  level: response.level,
  rank: response.rank,
  color: response.color,
});
