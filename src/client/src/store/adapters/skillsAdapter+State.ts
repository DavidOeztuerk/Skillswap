import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { ProficiencyLevel, Skill, SkillCategory } from "../../types/models/Skill";
import { RequestState } from "../../types/common/RequestState";
import { SkillStatistics, SkillRecommendation, GetUserSkillResponse, SkillSearchResultResponse } from "../../types/contracts/responses/SkillResponses";
import { SkillCategoryResponse, ProficiencyLevelResponse } from "../../types/contracts/responses/CreateSkillResponse";
import { withDefault } from "../../utils/safeAccess";

export const skillsAdapter = createEntityAdapter<Skill, EntityId>({
    selectId: (skill) => skill.id,
    sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export interface SkillsEntityState extends EntityState<Skill, EntityId>, RequestState {
  // Normalized Entities
  allSkills: NormalizedState<Skill>;
  userSkills: NormalizedState<Skill>;
  
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
  // Normalized Entities
  allSkills: { entities:{}, ids:[] },
  userSkills: { entities:{}, ids:[] },
  
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


// ===== NORMALIZED STATE STRUCTURE =====
export interface NormalizedState<T> {
  entities: Record<string, T>;
  ids: string[];
}

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


// ===== HELPER FUNCTIONS =====

export const normalizeEntities = <T extends { id: string }>(items: T[]): NormalizedState<T> => {
  const entities: Record<string, T> = {};
  const ids: string[] = [];
  
  items.forEach(item => {
    entities[item.id] = item;
    ids.push(item.id);
  });
  
  return { entities, ids };
};

export const updateEntity = <T extends { id: string }>(
  state: NormalizedState<T>,
  entity: T
): NormalizedState<T> => {
  return {
    entities: {
      ...state.entities,
      [entity.id]: entity
    },
    ids: state.ids.includes(entity.id) ? state.ids : [...state.ids, entity.id]
  };
};

export const removeEntity = <T>(state: NormalizedState<T>, entityId: string): NormalizedState<T> => {
  const { [entityId]: removed, ...entities } = state.entities;
  return {
    entities,
    ids: state.ids.filter(id => id !== entityId)
  };
};