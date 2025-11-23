import { SKILL_ENDPOINTS, FAVORITE_ENDPOINTS } from '../../config/endpoints';
import {
  SkillCategory,
  ProficiencyLevel,
} from '../../types/models/Skill';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { CreateSkillResponse, ProficiencyLevelResponse, SkillCategoryResponse } from '../../types/contracts/responses/CreateSkillResponse';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { UpdateSkillResponse } from '../../types/contracts/responses/UpdateSkillResponse';
import { AddFavoriteSkillRequest } from '../../types/contracts/requests/AddFavoriteSkillRequest';
import { ApiResponse, PagedResponse } from '../../types/api/UnifiedResponse';
import { GetUserSkillResponse, SkillDetailsResponse, SkillRecommendation, SkillSearchParams, SkillSearchResultResponse, SkillStatistics, DeleteSkillResponse, RateSkillResponse, EndorseSkillResponse } from '../../types/contracts/responses/SkillResponses';
import { apiClient } from '../apiClient';

/**
 * Service for skill operations
 */
const skillService = {
  /**
   * Get all skills with search and pagination
   */
  async getAllSkills(params?: SkillSearchParams): Promise<PagedResponse<SkillSearchResultResponse>> {
    return await apiClient.getPaged<SkillSearchResultResponse>(
      SKILL_ENDPOINTS.GET_SKILLS,
      params
    ) as PagedResponse<SkillSearchResultResponse>;
  },

  /**
   * Get skill by ID
   */
  async getSkillById(skillId: string): Promise<ApiResponse<SkillDetailsResponse>> {
    return await apiClient.get<SkillDetailsResponse>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`
    );
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
    if (includeInactive !== undefined) params.IncludeInactive = includeInactive;

    const response = await apiClient.getPaged<GetUserSkillResponse>(
      SKILL_ENDPOINTS.GET_USER_SKILLS,
      params
    );
    return response as PagedResponse<GetUserSkillResponse>;
  },

  /**
   * Create new skill
   */
  async createSkill(skillData: CreateSkillRequest): Promise<ApiResponse<CreateSkillResponse>> {
    return await apiClient.post<CreateSkillResponse>(
      SKILL_ENDPOINTS.CREATE_SKILL,
      skillData
    );
  },

  /**
   * Update skill
   */
  async updateSkill(skillId: string, updateData: UpdateSkillRequest): Promise<ApiResponse<UpdateSkillResponse>> {
    return apiClient.put<UpdateSkillResponse>(`${SKILL_ENDPOINTS.UPDATE_SKILL}/${skillId}`, updateData);
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
  async rateSkill(skillId: string, rating: number, review?: string): Promise<ApiResponse<RateSkillResponse>> {
    if (!skillId?.trim()) throw new Error('Skill-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');

    return apiClient.post<RateSkillResponse>(`${SKILL_ENDPOINTS.RATE_SKILL}/${skillId}/rate`, {
      rating,
      review,
    });
  },

  /**
   * Endorse skill
   */
  async endorseSkill(skillId: string, message?: string): Promise<ApiResponse<EndorseSkillResponse>> {
    return apiClient.post<EndorseSkillResponse>(`${SKILL_ENDPOINTS.ENDORSE_SKILL}/${skillId}/endorse`, { message });
  },

  // Category management
  async getCategories(): Promise<ApiResponse<SkillCategoryResponse[]>> {
    return apiClient.get<SkillCategoryResponse[]>(SKILL_ENDPOINTS.CATEGORIES);
  },

  async createCategory(name: string, description?: string): Promise<ApiResponse<SkillCategory>> {
    return apiClient.post<SkillCategory>(SKILL_ENDPOINTS.CATEGORIES, { name, description });
  },

  async updateCategory(id: string, name: string, description?: string): Promise<ApiResponse<SkillCategory>> {
    return apiClient.put<SkillCategory>(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`, { name, description });
  },

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`);
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
    return apiClient.delete<void>(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
  },

  // Analytics
  async getSkillStatistics(): Promise<ApiResponse<SkillStatistics>> {
    return apiClient.get<SkillStatistics>(`${SKILL_ENDPOINTS.GET_SKILLS}/analytics/statistics`);
  },

  async getPopularTags(limit = 20): Promise<ApiResponse<Array<{ tag: string; count: number }>>> {
    return apiClient.get<Array<{ tag: string; count: number }>>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/popular-tags`,
      { limit }
    );
  },

  async getSkillRecommendations(limit = 10): Promise<ApiResponse<SkillRecommendation[]>> {
    return apiClient.get<SkillRecommendation[]>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/recommendations`,
      { limit }
    );
  },

  // Favorites
  async getFavoriteSkills(pageNumber: number = 1, pageSize: number = 12): Promise<PagedResponse<string>> {
    const params = new URLSearchParams();
    params.append('pageSize', pageSize.toString());
    params.append('pageNumber', pageNumber.toString());
    const url = `${FAVORITE_ENDPOINTS.GET_FAVORITES()}?${params.toString()}`;
    return await apiClient.getPaged<string>(url) as PagedResponse<string>;
  },
  
  async getFavoriteSkillsWithDetails(pageNumber: number = 1, pageSize: number = 20): Promise<PagedResponse<GetUserSkillResponse>> {
    const params = new URLSearchParams();
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());
    return await apiClient.getPaged<GetUserSkillResponse>(`/api/users/favorites/details?${params.toString()}`) as PagedResponse<GetUserSkillResponse>;
  },

  async addFavoriteSkill(skillId: string): Promise<ApiResponse<boolean>> {
    const request: AddFavoriteSkillRequest = { skillId };
    return apiClient.post<boolean>(FAVORITE_ENDPOINTS.ADD_FAVORITE(), request);
  },

  async removeFavoriteSkill(skillId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(FAVORITE_ENDPOINTS.REMOVE_FAVORITE(skillId));
  },
};

export { skillService as SkillService };
export default skillService;



//  type FavoriteSkillDetail = GetUserSkillResponse;
//        42 -  
//        41    const FavoriteSkillsPage: React.FC = () => {
//        42      const navigate = useNavigate();
//        43 -    const [favoriteSkills, setFavoriteSkills] = useState<FavoriteSkillDetail[]>([]);
//    const [loading, setLoading] = useState(true);
//        45      const [removing, setRemoving] = useState<string | null>(null);
//        46      const [page, setPage] = useState(1);

// ⏺ Bash(npm run build 2>&1 | head -100)
//   ⎿  > client@0.0.0 build                                                                                                                                         
//      > tsc -b && vite build


  // ⎿  Updated src/components/routing/withSuspense.tsx with 2 additions and 1 removal                            
  //      198    /**
  //      199     * Erweiterte Version mit Preloading-Support
  //      200     */
  //      201 -  export function withPreloadableSuspense<T extends ComponentType<P>, P = Record<string, unknown>>(
  //      201 +  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //      202 +  export function withPreloadableSuspense<T extends ComponentType<any>>(
  //      203      importFn: ImportFunction<T>,
  //      204      options: WithSuspenseOptions = {}
  //      205    ) {

  