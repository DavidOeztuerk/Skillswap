import { apiClient } from '../../../core/api/apiClient';
import { SKILL_ENDPOINTS, FAVORITE_ENDPOINTS } from '../../../core/config/endpoints';
import type { PagedResponse, ApiResponse } from '../../../shared/types/api/UnifiedResponse';
import type { CreateSkillRequest } from '../types/CreateSkillRequest';
import type { CreateSkillResponse, SkillCategoryResponse } from '../types/CreateSkillResponse';
import type { SkillCategory } from '../types/Skill';
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
    locationType?: string,
    includeInactive = false
  ): Promise<PagedResponse<GetUserSkillResponse>> {
    const params: Record<string, unknown> = {
      PageNumber: pageNumber,
      PageSize: pageSize,
    };

    if (isOffered !== undefined) params.IsOffered = isOffered;
    if (categoryId) params.CategoryId = categoryId;
    if (locationType) params.LocationType = locationType;
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

  // Favorites (SkillService endpoints)
  // Note: Backend returns SkillSearchResultResponse (same format as /skills endpoint)
  async getFavoriteSkills(
    pageNumber = 1,
    pageSize = 12
  ): Promise<PagedResponse<SkillSearchResultResponse>> {
    return apiClient.getPaged<SkillSearchResultResponse>(FAVORITE_ENDPOINTS.GET_FAVORITES, {
      PageNumber: pageNumber,
      PageSize: pageSize,
    });
  },

  async addFavoriteSkill(
    skillId: string
  ): Promise<ApiResponse<{ skillId: string; addedAt: string }>> {
    return apiClient.post<{ skillId: string; addedAt: string }>(
      FAVORITE_ENDPOINTS.ADD_FAVORITE(skillId)
    );
  },

  async removeFavoriteSkill(
    skillId: string
  ): Promise<ApiResponse<{ skillId: string; removedAt: string }>> {
    return apiClient.delete<{ skillId: string; removedAt: string }>(
      FAVORITE_ENDPOINTS.REMOVE_FAVORITE(skillId)
    );
  },

  async isFavorite(
    skillId: string
  ): Promise<ApiResponse<{ skillId: string; isFavorite: boolean }>> {
    return apiClient.get<{ skillId: string; isFavorite: boolean }>(
      FAVORITE_ENDPOINTS.IS_FAVORITE(skillId)
    );
  },
};
