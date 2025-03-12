import apiClient from '../apiClient';
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

const SkillService = {
  getAllSkills: async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<Skill[]> => {
    const response = await apiClient.get<Skill[]>(
      `${SKILL_ENDPOINTS.GET_SKILLS}?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  getSkillById: async (skillId: string): Promise<Skill> => {
    const response = await apiClient.get<Skill>(
      `${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`
    );
    return response.data;
  },

  getSkillsBySearch: async (
    query: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<Skill[]> => {
    const response = await apiClient.get<Skill[]>(
      `${SKILL_ENDPOINTS.SEARCH_SKILLS}?query=${query}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  getUserSkills: async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<Skill[]> => {
    const response = await apiClient.get<Skill[]>(
      `${SKILL_ENDPOINTS.GET_USER_SKILLS}?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  getUserSkillById: async (skillId: string): Promise<Skill> => {
    const response = await apiClient.get<Skill>(
      `${SKILL_ENDPOINTS.GET_USER_SKILLS}/${skillId}`
    );
    return response.data;
  },

  getUserSkillsBySearch: async (
    query: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<Skill[]> => {
    const response = await apiClient.get<Skill[]>(
      `${SKILL_ENDPOINTS.SEARCH_USER_SKILLS}?query=${query}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  createSkill: async (
    skillData: CreateSkillRequest
  ): Promise<CreateSkillResponse> => {
    const response = await apiClient.post<CreateSkillResponse>(
      SKILL_ENDPOINTS.CREATE_SKILL,
      skillData
    );
    return response.data;
  },

  updateSkill: async (
    skillId: string,
    updateSkillData: UpdateSkillRequest
  ): Promise<UpdateSkillResponse> => {
    const response = await apiClient.put<UpdateSkillResponse>(
      `${SKILL_ENDPOINTS.UPDATE_SKILL}/${skillId}`,
      updateSkillData
    );
    return response.data;
  },

  deleteSkill: async (skillId: string): Promise<void> => {
    await apiClient.delete(`${SKILL_ENDPOINTS.DELETE_SKILL}/${skillId}`);
  },

  getCategories: async (): Promise<SkillCategory[]> => {
    const response = await apiClient.get<SkillCategory[]>(
      SKILL_ENDPOINTS.CATEGORIES
    );
    return response.data;
  },

  createCategory: async (name: string): Promise<SkillCategory> => {
    const response = await apiClient.post<SkillCategory>(
      SKILL_ENDPOINTS.CATEGORIES,
      { name }
    );
    return response.data;
  },

  updateCategory: async (id: string, name: string): Promise<SkillCategory> => {
    const response = await apiClient.put<SkillCategory>(
      `${SKILL_ENDPOINTS.CATEGORIES}/${id}`,
      { name }
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
    rank: number
  ): Promise<ProficiencyLevel> => {
    const response = await apiClient.post<ProficiencyLevel>(
      SKILL_ENDPOINTS.PROFICIENCY_LEVELS,
      { level, rank }
    );
    return response.data;
  },

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

  deleteProficiencyLevel: async (id: string): Promise<void> => {
    await apiClient.delete(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
  },
};

export { SkillService };
