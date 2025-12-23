import { apiClient } from '../../../core/api/apiClient';
import { SKILL_ENDPOINTS, FAVORITE_ENDPOINTS } from '../../../core/config/endpoints';
import type { PagedResponse, ApiResponse } from '../../../shared/types/api/UnifiedResponse';
import type { AddFavoriteSkillRequest } from '../types/AddFavoriteSkillRequest';
import type { CreateSkillRequest } from '../types/CreateSkillRequest';
import type {
  CreateSkillResponse,
  SkillCategoryResponse,
  ProficiencyLevelResponse,
} from '../types/CreateSkillResponse';
import type { SkillCategory, ProficiencyLevel } from '../types/Skill';
import type {
  SkillSearchParams,
  SkillSearchResultResponse,
  SkillDetailsResponse,
  GetUserSkillResponse,
  DeleteSkillResponse,
  RateSkillResponse,
  EndorseSkillResponse,
  SkillStatistics,
  SkillRecommendation,
} from '../types/SkillResponses';
import type { UpdateSkillRequest } from '../types/UpdateSkillRequest';
import type { UpdateSkillResponse } from '../types/UpdateSkillResponse';

/**
 * Service for skill operations
 */
export const skillService = {
  /**
   * Get all skills with search and pagination
   */
  async getAllSkills(
    params?: SkillSearchParams
  ): Promise<PagedResponse<SkillSearchResultResponse>> {
    return apiClient.getPaged<SkillSearchResultResponse>(SKILL_ENDPOINTS.GET_SKILLS, params);
  },

  /**
   * Get skill by ID
   */
  async getSkillById(skillId: string): Promise<ApiResponse<SkillDetailsResponse>> {
    return apiClient.get<SkillDetailsResponse>(`${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`);
  },

  /**
   * Get current user's skills
   */
  async getUserSkills(
    pageNumber = 1,
    pageSize = 12,
    isOffered?: boolean,
    categoryId?: string,
    proficiencyLevelId?: string,
    includeInactive = false
  ): Promise<PagedResponse<GetUserSkillResponse>> {
    const params: Record<string, unknown> = {
      PageNumber: pageNumber,
      PageSize: pageSize,
    };

    if (isOffered !== undefined) params.IsOffered = isOffered;
    if (categoryId) params.CategoryId = categoryId;
    if (proficiencyLevelId) params.ProficiencyLevelId = proficiencyLevelId;
    if (includeInactive) params.IncludeInactive = includeInactive;

    return apiClient.getPaged<GetUserSkillResponse>(SKILL_ENDPOINTS.GET_USER_SKILLS, params);
  },

  /**
   * Create new skill
   */
  async createSkill(skillData: CreateSkillRequest): Promise<ApiResponse<CreateSkillResponse>> {
    return apiClient.post<CreateSkillResponse>(SKILL_ENDPOINTS.CREATE_SKILL, skillData);
  },

  /**
   * Update skill
   */
  async updateSkill(
    skillId: string,
    updateData: UpdateSkillRequest
  ): Promise<ApiResponse<UpdateSkillResponse>> {
    return apiClient.put<UpdateSkillResponse>(
      `${SKILL_ENDPOINTS.UPDATE_SKILL}/${skillId}`,
      updateData
    );
  },

  /**
   * Delete skill
   */
  async deleteSkill(skillId: string, reason?: string): Promise<ApiResponse<DeleteSkillResponse>> {
    // Backend expects DeleteSkillRequest in body: { SkillId, Reason }
    return apiClient.delete<DeleteSkillResponse>(
      `${SKILL_ENDPOINTS.DELETE_SKILL}/${skillId}`,
      undefined,
      { SkillId: skillId, Reason: reason }
    );
  },

  /**
   * Rate skill
   */
  async rateSkill(
    skillId: string,
    rating: number,
    review?: string
  ): Promise<ApiResponse<RateSkillResponse>> {
    if (!skillId.trim()) throw new Error('Skill-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');

    return apiClient.post<RateSkillResponse>(`${SKILL_ENDPOINTS.RATE_SKILL}/${skillId}/rate`, {
      rating,
      review,
    });
  },

  /**
   * Endorse skill
   */
  async endorseSkill(
    skillId: string,
    message?: string
  ): Promise<ApiResponse<EndorseSkillResponse>> {
    return apiClient.post<EndorseSkillResponse>(
      `${SKILL_ENDPOINTS.ENDORSE_SKILL}/${skillId}/endorse`,
      { message }
    );
  },

  // Category management
  async getCategories(): Promise<ApiResponse<SkillCategoryResponse[]>> {
    return apiClient.get<SkillCategoryResponse[]>(SKILL_ENDPOINTS.CATEGORIES);
  },

  async createCategory(name: string, description?: string): Promise<ApiResponse<SkillCategory>> {
    return apiClient.post<SkillCategory>(SKILL_ENDPOINTS.CATEGORIES, { name, description });
  },

  async updateCategory(
    id: string,
    name: string,
    description?: string
  ): Promise<ApiResponse<SkillCategory>> {
    return apiClient.put<SkillCategory>(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`, {
      name,
      description,
    });
  },

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`);
  },

  // Proficiency level management
  async getProficiencyLevels(): Promise<ApiResponse<ProficiencyLevelResponse[]>> {
    return apiClient.get<ProficiencyLevelResponse[]>(SKILL_ENDPOINTS.PROFICIENCY_LEVELS);
  },

  async createProficiencyLevel(
    level: string,
    rank: number,
    description?: string
  ): Promise<ApiResponse<ProficiencyLevel>> {
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
  ): Promise<ApiResponse<ProficiencyLevel>> {
    return apiClient.put<ProficiencyLevel>(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`, {
      level,
      rank,
      description,
    });
  },

  async deleteProficiencyLevel(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
  },

  // Analytics
  async getSkillStatistics(): Promise<ApiResponse<SkillStatistics>> {
    return apiClient.get<SkillStatistics>(`${SKILL_ENDPOINTS.GET_SKILLS}/analytics/statistics`);
  },

  async getPopularTags(limit = 20): Promise<ApiResponse<{ tag: string; count: number }[]>> {
    return apiClient.get<{ tag: string; count: number }[]>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/popular-tags`,
      { limit }
    );
  },

  async getSkillRecommendations(limit = 10): Promise<ApiResponse<SkillRecommendation[]>> {
    return apiClient.get<SkillRecommendation[]>(`${SKILL_ENDPOINTS.GET_SKILLS}/recommendations`, {
      limit,
    });
  },

  // Favorites
  async getFavoriteSkills(pageNumber = 1, pageSize = 12): Promise<PagedResponse<string>> {
    const params = new URLSearchParams();
    params.append('pageSize', pageSize.toString());
    params.append('pageNumber', pageNumber.toString());
    const url = `${FAVORITE_ENDPOINTS.GET_FAVORITES()}?${params.toString()}`;
    return apiClient.getPaged<string>(url);
  },

  async getFavoriteSkillsWithDetails(
    pageNumber = 1,
    pageSize = 20
  ): Promise<PagedResponse<GetUserSkillResponse>> {
    const params = new URLSearchParams();
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());
    return apiClient.getPaged<GetUserSkillResponse>(
      `/api/users/favorites/details?${params.toString()}`
    );
  },

  async addFavoriteSkill(skillId: string): Promise<ApiResponse<boolean>> {
    const request: AddFavoriteSkillRequest = { skillId };
    return apiClient.post<boolean>(FAVORITE_ENDPOINTS.ADD_FAVORITE(), request);
  },

  async removeFavoriteSkill(skillId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(FAVORITE_ENDPOINTS.REMOVE_FAVORITE(skillId));
  },
};
