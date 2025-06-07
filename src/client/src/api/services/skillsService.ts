import { SKILL_ENDPOINTS } from '../../config/endpoints';
import {
  ProficiencyLevel,
  Skill,
  SkillCategory,
} from '../../types/models/Skill';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { CreateSkillResponse } from '../../types/contracts/responses/CreateSkillResponse';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { UpdateSkillResponse } from '../../types/contracts/responses/UpdateSkillResponse';
import apiClient from '../apiClient';

// Beispiel: einheitliche Paging-Antwortstruktur, um "totalCount", "page" etc. abzugreifen.
interface PaginatedResponse<T> {
  totalCount: number;
  page: number;
  pageSize: number;
  data: T[];
}

const SkillService = {
  // GET /skills
  getAllSkills: async (
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.GET_SKILLS}?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // GET /skills/{id}
  getSkillById: async (skillId: string): Promise<Skill> => {
    const response = await apiClient.get<Skill>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`
    );
    return response.data;
  },

  // GET /skills/search?query=...
  getSkillsBySearch: async (
    query: string,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.SEARCH_SKILLS}?query=${query}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // GET /user/skills
  getUserSkills: async (
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.GET_USER_SKILLS}?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // GET /user/skills/{id}
  getUserSkillById: async (skillId: string): Promise<Skill> => {
    const response = await apiClient.get<Skill>(
      `${SKILL_ENDPOINTS.GET_USER_SKILLS}/${skillId}`
    );
    return response.data;
  },

  // GET /user/skills/search?query=...
  getUserSkillsBySearch: async (
    query: string,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.SEARCH_USER_SKILLS}?query=${query}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // POST /skills
  createSkill: async (
    skillData: CreateSkillRequest
  ): Promise<CreateSkillResponse> => {
    const response = await apiClient.post<CreateSkillResponse>(
      SKILL_ENDPOINTS.CREATE_SKILL,
      skillData
    );
    return response.data;
  },

  // PUT /user/skills/{id}
  updateSkill: async (
    id: string,
    updateSkillData: UpdateSkillRequest
  ): Promise<UpdateSkillResponse> => {
    const response = await apiClient.put<UpdateSkillResponse>(
      `${SKILL_ENDPOINTS.UPDATE_SKILL}/${id}`,
      updateSkillData
    );
    return response.data;
  },

  // DELETE /user/skills/{id}
  deleteSkill: async (id: string): Promise<void> => {
    await apiClient.delete(`${SKILL_ENDPOINTS.DELETE_SKILL}/${id}`);
  },

  // GET /categories
  getCategories: async (): Promise<SkillCategory[]> => {
    const response = await apiClient.get<SkillCategory[]>(
      SKILL_ENDPOINTS.CATEGORIES
    );
    return response.data;
  },

  // POST /categories
  createCategory: async (name: string): Promise<SkillCategory> => {
    const response = await apiClient.post<SkillCategory>(
      SKILL_ENDPOINTS.CATEGORIES,
      { name }
    );
    return response.data;
  },

  // PUT /categories/{id}
  updateCategory: async (id: string, name: string): Promise<SkillCategory> => {
    const response = await apiClient.put<SkillCategory>(
      `${SKILL_ENDPOINTS.CATEGORIES}/${id}`,
      { name }
    );
    return response.data;
  },

  // DELETE /categories/{id}
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`);
  },

  // GET /proficiencylevels
  getProficiencyLevels: async (): Promise<ProficiencyLevel[]> => {
    const response = await apiClient.get<ProficiencyLevel[]>(
      SKILL_ENDPOINTS.PROFICIENCY_LEVELS
    );
    return response.data;
  },

  // POST /proficiencylevels
  createProficiencyLevel: async (
    level: string,
    rank: number
  ): Promise<ProficiencyLevel> => {
    const response = await apiClient.post<ProficiencyLevel>(
      SKILL_ENDPOINTS.PROFICIENCY_LEVELS,
      { level, rank }
    );
    return response.data;
  },

  // PUT /proficiencylevels/{id}
  updateProficiencyLevel: async (
    id: string,
    level: string,
    rank: number
  ): Promise<ProficiencyLevel> => {
    const response = await apiClient.put<ProficiencyLevel>(
      `${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`,
      { level, rank }
    );
    return response.data;
  },

  // DELETE /proficiencylevels/{id}
  deleteProficiencyLevel: async (id: string): Promise<void> => {
    await apiClient.delete(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
  },
};

export { SkillService };
