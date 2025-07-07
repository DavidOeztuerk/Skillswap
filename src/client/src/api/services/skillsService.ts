// src/api/services/skillsService.ts
import { SKILL_ENDPOINTS } from '../../config/endpoints';
import {
  Skill,
  SkillCategory,
  ProficiencyLevel,
} from '../../types/models/Skill';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { CreateSkillResponse } from '../../types/contracts/responses/CreateSkillResponse';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { UpdateSkillResponse } from '../../types/contracts/responses/UpdateSkillResponse';
import { PaginatedResponse } from '../../types/common/PaginatedResponse';
import apiClient from '../apiClient';
import { FAVORITE_ENDPOINTS } from '../../config/endpoints';

/**
 * Index signature erlaubt flexible Parameter
 */
export interface SkillSearchParams {
  [key: string]: unknown;
  searchTerm?: string;
  categoryId?: string;
  proficiencyLevelId?: string;
  isOffering?: boolean;
  isRequesting?: boolean;
  isRemote?: boolean;
  location?: string;
  tags?: string[];
  minRating?: number;
  sortBy?: 'relevance' | 'popularity' | 'rating' | 'date' | 'name';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface ExtendedCreateSkillRequest extends CreateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}

interface ExtendedUpdateSkillRequest extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}

export interface SkillStatistics {
  totalSkills: number;
  skillsOffered: number;
  skillsRequested: number;
  activeSkills: number;
  topCategories: Array<{ category: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

export interface SkillRecommendation {
  skill: Skill;
  score: number;
  reason: string;
  matchPercentage: number;
}

const skillService = {
  getAllSkills: async (
    params: SkillSearchParams
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      SKILL_ENDPOINTS.GET_SKILLS,
      { ...params }
    );
    return response.data;
  },

  getSkillById: async (skillId: string): Promise<Skill> => {
    if (!skillId.trim()) throw new Error('Skill-ID ist erforderlich');
    const response = await apiClient.get<Skill>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`
    );
    return response.data;
  },

  getUserSkills: async (
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.GET_USER_SKILLS}`,
      { PageNumber: page, PageSize: pageSize }
    );
    return response.data;
  },

  createSkill: async (
    skillData: ExtendedCreateSkillRequest
  ): Promise<CreateSkillResponse> => {
    const response = await apiClient.post<CreateSkillResponse>(
      SKILL_ENDPOINTS.CREATE_SKILL,
      skillData
    );
    return response.data;
  },

  updateSkill: async (
    id: string,
    updateData: ExtendedUpdateSkillRequest
  ): Promise<UpdateSkillResponse> => {
    const response = await apiClient.put<UpdateSkillResponse>(
      `${SKILL_ENDPOINTS.UPDATE_SKILL}/${id}`,
      updateData
    );
    return response.data;
  },

  deleteSkill: async (id: string, reason?: string): Promise<void> => {
    await apiClient.delete(
      `${SKILL_ENDPOINTS.DELETE_SKILL}/${id}`,
      reason ? { params: { reason } } : undefined
    );
  },

  rateSkill: async (
    skillId: string,
    rating: number,
    review?: string
  ): Promise<void> => {
    await apiClient.post(`${SKILL_ENDPOINTS.RATE_SKILL}/${skillId}/rate`, {
      rating,
      review,
    });
  },

  endorseSkill: async (skillId: string, message?: string): Promise<void> => {
    await apiClient.post(
      `${SKILL_ENDPOINTS.ENDORSE_SKILL}/${skillId}/endorse`,
      { message }
    );
  },

  getCategories: async (): Promise<SkillCategory[]> => {
    const response = await apiClient.get<SkillCategory[]>(
      SKILL_ENDPOINTS.CATEGORIES
    );
    return response.data;
  },

  createCategory: async (
    name: string,
    description?: string
  ): Promise<SkillCategory> => {
    const response = await apiClient.post<SkillCategory>(
      SKILL_ENDPOINTS.CATEGORIES,
      { name, description }
    );
    return response.data;
  },

  updateCategory: async (
    id: string,
    name: string,
    description?: string
  ): Promise<SkillCategory> => {
    const response = await apiClient.put<SkillCategory>(
      `${SKILL_ENDPOINTS.CATEGORIES}/${id}`,
      { name, description }
    );
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`);
  },

  getProficiencyLevels: async (): Promise<ProficiencyLevel[]> => {
    const response = await apiClient.get<ProficiencyLevel[]>(
      SKILL_ENDPOINTS.PROFICIENCY_LEVELS
    );
    return response.data;
  },

  createProficiencyLevel: async (
    level: string,
    rank: number,
    description?: string
  ): Promise<ProficiencyLevel> => {
    const response = await apiClient.post<ProficiencyLevel>(
      SKILL_ENDPOINTS.PROFICIENCY_LEVELS,
      { level, rank, description }
    );
    return response.data;
  },

  updateProficiencyLevel: async (
    id: string,
    level: string,
    rank: number,
    description?: string
  ): Promise<ProficiencyLevel> => {
    const response = await apiClient.put<ProficiencyLevel>(
      `${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`,
      { level, rank, description }
    );
    return response.data;
  },

  deleteProficiencyLevel: async (id: string): Promise<void> => {
    await apiClient.delete(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
  },

  getSkillStatistics: async (): Promise<SkillStatistics> => {
    const response = await apiClient.get<SkillStatistics>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/statistics`
    );
    return response.data;
  },

  getPopularTags: async (
    limit = 20
  ): Promise<Array<{ tag: string; count: number }>> => {
    const response = await apiClient.get<Array<{ tag: string; count: number }>>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/popular-tags`,
      { limit }
    );
    return response.data;
  },

  getSkillRecommendations: async (
    limit = 10
  ): Promise<SkillRecommendation[]> => {
    const response = await apiClient.get<SkillRecommendation[]>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/recommendations`,
      { limit }
    );
    return response.data;
  },

  /** FAVORITES API */
  getFavoriteSkills: async (userId: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(FAVORITE_ENDPOINTS.GET_FAVORITES(userId));
    return response.data;
  },

  addFavoriteSkill: async (userId: string, skillId: string): Promise<void> => {
    await apiClient.post(FAVORITE_ENDPOINTS.ADD_FAVORITE(userId, skillId));
  },

  removeFavoriteSkill: async (userId: string, skillId: string): Promise<void> => {
    await apiClient.delete(FAVORITE_ENDPOINTS.REMOVE_FAVORITE(userId, skillId));
  },
};

export { skillService as SkillService };
export default skillService;
