// src/api/services/skillsService.ts
import apiClient from '../apiClient';
import { SKILL_ENDPOINTS } from '../../config/endpoints';
import { SkillFilter } from '../../types/models/SkillFilter';
// import { ApiResponse } from '../../types/common/ApiResponse';
import { Skill } from '../../types/models/Skill';
import { UserSkill } from '../../types/models/UserSkill';
import { AddUserSkillRequest } from '../../types/contracts/requests/AddUserSkillRequest';

/**
 * Service für Skill-Operationen
 */
const skillsService = {
  /**
   * Holt alle verfügbaren Skills
   * @param filter - Optionaler Filter für Skills
   * @returns Liste von Skills
   */
  getSkills: async (filter?: SkillFilter): Promise<Skill[]> => {
    const params = filter
      ? {
          category: filter.category,
          searchTerm: filter.searchTerm,
        }
      : {};

    const response = await apiClient.get<Skill[]>(
      SKILL_ENDPOINTS.GET_ALL,
      { params }
    );
    return response.data;
  },

  /**
   * Sucht nach Skills
   * @param query - Suchbegriff
   * @returns Liste von Skills, die dem Suchbegriff entsprechen
   */
  searchSkills: async (query: string): Promise<Skill[]> => {
    const response = await apiClient.get<Skill[]>(
      SKILL_ENDPOINTS.SEARCH_SKILLS,
      {
        params: { query },
      }
    );
    return response.data;
  },

  /**
   * Holt alle Skills des aktuellen Benutzers
   * @returns Liste von Benutzer-Skills
   */
  getUserSkills: async (): Promise<UserSkill[]> => {
    const response = await apiClient.get<UserSkill[]>(
      SKILL_ENDPOINTS.GET_USER_SKILLS
    );
    return response.data;
  },

  /**
   * Fügt einen Skill zum Benutzerprofil hinzu
   * @param skillData - Daten für den hinzuzufügenden Skill
   * @returns Der hinzugefügte Benutzer-Skill
   */
  addUserSkill: async (
    skillData: AddUserSkillRequest
  ): Promise<UserSkill> => {
    const response = await apiClient.post<UserSkill>(
      SKILL_ENDPOINTS.ADD_USER_SKILL,
      skillData
    );
    return response.data;
  },

  /**
   * Aktualisiert einen Benutzer-Skill
   * @param userSkillId - ID des zu aktualisierenden Benutzer-Skills
   * @param skillData - Neue Daten für den Skill
   * @returns Der aktualisierte Benutzer-Skill
   */
  updateUserSkill: async (
    userSkillId: string,
    skillData: Partial<AddUserSkillRequest>
  ): Promise<UserSkill> => {
    const response = await apiClient.put<UserSkill>(
      `${SKILL_ENDPOINTS.ADD_USER_SKILL}/${userSkillId}`,
      skillData
    );
    return response.data;
  },

  /**
   * Entfernt einen Skill vom Benutzerprofil
   * @param skillId - ID des zu entfernenden Skills
   * @returns Erfolg-/Fehlermeldung
   */
  removeUserSkill: async (skillId: string): Promise<void> => {
    const response = await apiClient.delete<void>(
      `${SKILL_ENDPOINTS.REMOVE_USER_SKILL}`,
      {
        params: { skillId },
      }
    );
    return response.data;
  },
};

export default skillsService;
