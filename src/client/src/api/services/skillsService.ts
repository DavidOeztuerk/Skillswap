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
import { AddFavoriteSkillRequest } from '../../types/contracts/requests/AddFavoriteSkillRequest';
import { PagedResponse } from '../../types/common/PagedResponse';
import { ApiResponse } from '../../types/common/ApiResponse';
import apiClient from '../apiClient';

export interface UserSkillResponseData {
    UserId: string;
    SkillId: string;
    Name: string;
    Description: string;
    Category: {
      CategoryId: string;
      Name: string;
      IconName?: string;
      Color?: string;
      SkillCount?: number;
    };
    ProficiencyLevel: {
      LevelId: string;
      Level: string;
      Rank: number;
      Color?: string;
      SkillCount?: number;
    };
    Tags: string[];
    IsOffered: boolean;
    AverageRating?: number;
    ReviewCount: number;
    EndorsementCount: number;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface SkillDetailsResponse {
  skillId: string;
  userId: string;
  name: string;
  description: string;
  category: SkillCategoryResponse;
  proficiencyLevel: ProficiencyLevelResponse;
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
}

export interface SkillReviewResponse {
  reviewId: string;
  reviewerUserId: string;
  rating: number;
  comment?: string;
  tags: string[];
  createdAt: Date;
};

export interface SkillEndorsementResponse {
  erndorsementId: string;
  endorserUserId: string;
  message?: string;
  createdAt: Date
};

export interface GetUserSkillRespone {
  skillId: string,
  userId: string,
  name: string,
  description: string,
  category : SkillCategoryResponse,
  proficiencyLevel: ProficiencyLevelResponse,
  tags: string[],
  isOffered: boolean,
  rating?: number,
  reviewCount: number,
  endorsementCount: number,
  status: string,
  createdAt: Date,
  updatedAt: Date
}

export interface SkillSearchResultResponse{
  skillId: string;
  userId: string;
  name: string;
  description: string;
  isOffered: boolean; 
  category : SkillCategoryResponse,
  proficiencyLevel: ProficiencyLevelResponse,
  tagsJson: string,
  averageRating?: number,
  reviewCount: number,
  endorsementCount: number,
  estimatedDurationMinutes?: number,
  createdAt: Date,
  lastActiveAt?: Date  // Backend uses 'LastViewedAt' - might need to check this
}

export interface SkillCategoryResponse {
  categoryId: string;
  name: string,
  iconName?: string,
  color?: string,
}

export interface ProficiencyLevelResponse{
  levelId : string;
  level: string;
  rank : number;
  color? : string;
}

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
  async getAllSkills(params?: SkillSearchParams): Promise<PagedResponse<SkillSearchResultResponse>> {
    return apiClient.get<PagedResponse<SkillSearchResultResponse>>(SKILL_ENDPOINTS.GET_SKILLS, { params });
  },

  /**
   * Get skill by ID
   */
  async getSkillById(skillId: string): Promise<ApiResponse<SkillDetailsResponse>> {
    return apiClient.get<ApiResponse<SkillDetailsResponse>>(`${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`);
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
  ): Promise<PagedResponse<GetUserSkillRespone>> {
    const params = new URLSearchParams();
    if (isOffered !== undefined) params.append('IsOffered', isOffered.toString());
    if (categoryId) params.append('CategoryId', categoryId);
    if (proficiencyLevelId) params.append('ProficiencyLevelId', proficiencyLevelId);
    if (includeInactive !== undefined) params.append('IncludeInactive', includeInactive.toString());
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());
    const url = `${SKILL_ENDPOINTS.GET_USER_SKILLS}?${params.toString()}`;

    return apiClient.get<PagedResponse<GetUserSkillRespone>>(url);
  },

  /**
   * Create new skill
   */
  async createSkill(skillData: CreateSkillRequest): Promise<ApiResponse<CreateSkillResponse>> {
    return apiClient.post<ApiResponse<CreateSkillResponse>>(SKILL_ENDPOINTS.CREATE_SKILL, skillData);
  },

  /**
   * Update skill
   */
  async updateSkill(skillId: string, updateData: UpdateSkillRequest): Promise<ApiResponse<UpdateSkillResponse>> {
    return apiClient.put<ApiResponse<UpdateSkillResponse>>(`${SKILL_ENDPOINTS.UPDATE_SKILL}/${skillId}`, updateData);
  },

  /**
   * Delete skill
   */
  async deleteSkill(skillId: string, reason?: string): Promise<ApiResponse<any>> {
    return apiClient.delete<ApiResponse<any>>(`${SKILL_ENDPOINTS.DELETE_SKILL}/${skillId}`, { params: { reason } });
  },

  /**
   * Rate skill
   */
  async rateSkill(skillId: string, rating: number, review?: string): Promise<ApiResponse<any>> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    
    return apiClient.post<ApiResponse<any>>(`${SKILL_ENDPOINTS.RATE_SKILL}/${skillId}/rate`, {
      rating,
      review,
    });
  },

  /**
   * Endorse skill
   */
  async endorseSkill(skillId: string, message?: string): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`${SKILL_ENDPOINTS.ENDORSE_SKILL}/${skillId}/endorse`, { message });
  },

  // Category management
  async getCategories(): Promise<ApiResponse<SkillCategoryResponse[]>> {
    return apiClient.get<ApiResponse<SkillCategoryResponse[]>>(SKILL_ENDPOINTS.CATEGORIES);
  },

  async createCategory(name: string, description?: string): Promise<ApiResponse<SkillCategory>> {
    return apiClient.post<ApiResponse<SkillCategory>>(SKILL_ENDPOINTS.CATEGORIES, { name, description });
  },

  async updateCategory(id: string, name: string, description?: string): Promise<SkillCategory> {
    return apiClient.put<SkillCategory>(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`, { name, description });
  },

  async deleteCategory(id: string): Promise<void> {
    return apiClient.delete<void>(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`);
  },

  // Proficiency level management
  async getProficiencyLevels(): Promise<ApiResponse<ProficiencyLevelResponse[]>> {
    return apiClient.get<ApiResponse<ProficiencyLevelResponse[]>>(SKILL_ENDPOINTS.PROFICIENCY_LEVELS);
  },

  async createProficiencyLevel(
    level: string,
    rank: number,
    description?: string
  ): Promise<ProficiencyLevel> {
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
    return apiClient.put<ProficiencyLevel>(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`, {
      level,
      rank,
      description,
    });
  },

  async deleteProficiencyLevel(id: string): Promise<void> {
    return apiClient.delete<void>(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
  },

  // Analytics
  async getSkillStatistics(): Promise<ApiResponse<SkillStatistics>> {
    return apiClient.get<ApiResponse<SkillStatistics>>(`${SKILL_ENDPOINTS.GET_SKILLS}/analytics/statistics`);
  },

  async getPopularTags(limit = 20): Promise<ApiResponse<Array<{ tag: string; count: number }>>> {
    return apiClient.get<ApiResponse<Array<{ tag: string; count: number }>>>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/popular-tags`,
      { params: { limit } }
    );
  },

  async getSkillRecommendations(limit = 10): Promise<ApiResponse<SkillRecommendation[]>> {
    return apiClient.get<ApiResponse<SkillRecommendation[]>>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/recommendations`,
      { params: { limit } }
    );
  },

  // Favorites
  async getFavoriteSkills(pageNumber: number = 1, pageSize: number = 12): Promise<ApiResponse<string[]>> {
    const params = new URLSearchParams();
    params.append('pageSize', pageSize.toString());
    params.append('pageNumber', pageNumber.toString());
    const url = `${FAVORITE_ENDPOINTS.GET_FAVORITES()}?${params.toString()}`;
    return apiClient.get<ApiResponse<string[]>>(url);
  },
  
  async getFavoriteSkillsWithDetails(pageNumber: number = 1, pageSize: number = 20): Promise<PagedResponse<any>> {
    const params = new URLSearchParams();
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());
    return apiClient.get<PagedResponse<any>>(`/api/users/favorites/details?${params.toString()}`);
  },

  async addFavoriteSkill(skillId: string): Promise<ApiResponse<boolean>> {
    const request: AddFavoriteSkillRequest = { skillId };
    return apiClient.post<ApiResponse<boolean>>(FAVORITE_ENDPOINTS.ADD_FAVORITE(), request);
  },

  async removeFavoriteSkill(skillId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<ApiResponse<boolean>>(FAVORITE_ENDPOINTS.REMOVE_FAVORITE(skillId));
  },
};

export { skillService as SkillService };
export default skillService;

