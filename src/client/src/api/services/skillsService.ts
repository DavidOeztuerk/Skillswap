// src/api/services/skillsService.ts
import { SKILL_ENDPOINTS, FAVORITE_ENDPOINTS } from '../../config/endpoints';
import {
  Skill,
  SkillCategory,
  ProficiencyLevel,
} from '../../types/models/Skill';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { CreateSkillResponse } from '../../types/contracts/responses/CreateSkillResponse';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { UpdateSkillResponse } from '../../types/contracts/responses/UpdateSkillResponse';
import { PagedResponse } from '../../types/common/PagedResponse';
import apiClient from '../apiClient';

export interface SkillSearchParams {
  searchTerm?: string;
  categoryId?: string;
  proficiencyLevelId?: string;
  tags?: string[];
  isOffered?: boolean;
  minRating?: number;
  sortBy?: 'relevance' | 'popularity' | 'rating' | 'createat' | 'updateat' | 'name';
  sortDirection?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
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

/**
 * Service for skill operations
 */
const skillService = {
  /**
   * Get all skills with search and pagination
   */
  async getAllSkills(params?: SkillSearchParams): Promise<PagedResponse<Skill[]>> {
    return apiClient.get<PagedResponse<Skill[]>>(SKILL_ENDPOINTS.GET_SKILLS, { params });;
  },

  /**
   * Get skill by ID
   */
  async getSkillById(skillId: string): Promise<Skill> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.get<Skill>(`${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`);
  },

  /**
   * Get current user's skills
   */
  async getUserSkills(pageNumber = 1, pageSize = 12, isOffered?: boolean, categoryId?: number, includeInactive = false): Promise<PagedResponse<Skill[]>> {
    const params = new URLSearchParams();
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());
    if (isOffered !== undefined) params.append('IsOffered', isOffered.toString());
    if (categoryId !== undefined) params.append('CategoryId', categoryId.toString());
    if (includeInactive !== undefined) params.append('IncludeInactive', includeInactive.toString());
    
    const url = `${SKILL_ENDPOINTS.GET_USER_SKILLS}?${params.toString()}`;
    return apiClient.get<PagedResponse<Skill[]>>(url);
  },

  /**
   * Create new skill
   */
  async createSkill(skillData: CreateSkillRequest): Promise<CreateSkillResponse> {
    return apiClient.post<CreateSkillResponse>(SKILL_ENDPOINTS.CREATE_SKILL, skillData);
  },

  /**
   * Update skill
   */
  async updateSkill(id: string, updateData: UpdateSkillRequest): Promise<UpdateSkillResponse> {
    if (!id?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.put<UpdateSkillResponse>(`${SKILL_ENDPOINTS.UPDATE_SKILL}/${id}`, updateData);
  },

  /**
   * Delete skill
   */
  async deleteSkill(id: string, reason?: string): Promise<void> {
    if (!id?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.delete<void>(`${SKILL_ENDPOINTS.DELETE_SKILL}/${id}`, { params: { reason } });
  },

  /**
   * Rate skill
   */
  async rateSkill(skillId: string, rating: number, review?: string): Promise<void> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    
    return apiClient.post<void>(`${SKILL_ENDPOINTS.RATE_SKILL}/${skillId}/rate`, {
      rating,
      review,
    });
  },

  /**
   * Endorse skill
   */
  async endorseSkill(skillId: string, message?: string): Promise<void> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.post<void>(`${SKILL_ENDPOINTS.ENDORSE_SKILL}/${skillId}/endorse`, { message });
  },

  // Category management
  async getCategories(): Promise<SkillCategory[]> {
    return apiClient.get<SkillCategory[]>(SKILL_ENDPOINTS.CATEGORIES);
  },

  async createCategory(name: string, description?: string): Promise<SkillCategory> {
    if (!name?.trim()) throw new Error('Kategoriename ist erforderlich');
    return apiClient.post<SkillCategory>(SKILL_ENDPOINTS.CATEGORIES, { name, description });
  },

  async updateCategory(id: string, name: string, description?: string): Promise<SkillCategory> {
    if (!id?.trim()) throw new Error('Kategorie-ID ist erforderlich');
    if (!name?.trim()) throw new Error('Kategoriename ist erforderlich');
    return apiClient.put<SkillCategory>(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`, { name, description });
  },

  async deleteCategory(id: string): Promise<void> {
    if (!id?.trim()) throw new Error('Kategorie-ID ist erforderlich');
    return apiClient.delete<void>(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`);
  },

  // Proficiency level management
  async getProficiencyLevels(): Promise<ProficiencyLevel[]> {
    return apiClient.get<ProficiencyLevel[]>(SKILL_ENDPOINTS.PROFICIENCY_LEVELS);
  },

  async createProficiencyLevel(
    level: string,
    rank: number,
    description?: string
  ): Promise<ProficiencyLevel> {
    if (!level?.trim()) throw new Error('Level ist erforderlich');
    if (rank < 0) throw new Error('Rang muss positiv sein');
    return apiClient.post<ProficiencyLevel>(SKILL_ENDPOINTS.PROFICIENCY_LEVELS, {
      level,
      rank,
      description,
    });
  },

  async updateProficiencyLevel(
    id: string,
    level: string,
    rank: number,
    description?: string
  ): Promise<ProficiencyLevel> {
    if (!id?.trim()) throw new Error('Level-ID ist erforderlich');
    if (!level?.trim()) throw new Error('Level ist erforderlich');
    if (rank < 0) throw new Error('Rang muss positiv sein');
    return apiClient.put<ProficiencyLevel>(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`, {
      level,
      rank,
      description,
    });
  },

  async deleteProficiencyLevel(id: string): Promise<void> {
    if (!id?.trim()) throw new Error('Level-ID ist erforderlich');
    return apiClient.delete<void>(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
  },

  // Analytics
  async getSkillStatistics(): Promise<SkillStatistics> {
    return apiClient.get<SkillStatistics>(`${SKILL_ENDPOINTS.GET_SKILLS}/analytics/statistics`);
  },

  async getPopularTags(limit = 20): Promise<Array<{ tag: string; count: number }>> {
    if (limit < 1) throw new Error('Limit muss größer als 0 sein');
    return apiClient.get<Array<{ tag: string; count: number }>>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/popular-tags`,
      { limit }
    );
  },

  async getSkillRecommendations(limit = 10): Promise<SkillRecommendation[]> {
    if (limit < 1) throw new Error('Limit muss größer als 0 sein');
    return apiClient.get<SkillRecommendation[]>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/recommendations`,
      { limit }
    );
  },

  // Favorites
  async getFavoriteSkills(): Promise<string[]> {
    // userId wird nicht mehr benötigt da es vom JWT-Token extrahiert wird
    const params = new URLSearchParams();
    params.append('pageSize', '100');
    params.append('pageNumber', '1');
    const url = `${FAVORITE_ENDPOINTS.GET_FAVORITES()}?${params.toString()}`;
    return apiClient.get<string[]>(url);
  },

  async addFavoriteSkill(skillId: string): Promise<void> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.post<void>(FAVORITE_ENDPOINTS.ADD_FAVORITE(skillId));
  },

  async removeFavoriteSkill(skillId: string): Promise<void> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    return apiClient.delete<void>(FAVORITE_ENDPOINTS.REMOVE_FAVORITE(skillId));
  },
};

export { skillService as SkillService };
export default skillService;