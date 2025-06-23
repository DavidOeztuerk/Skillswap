// src/api/services/skillsService.ts
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
import { PaginatedResponse } from '../../types/common/PaginatedResponse';
import apiClient from '../apiClient';

// Enhanced search parameters interface
interface SkillSearchParams {
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

// Skill statistics interface
interface SkillStatistics {
  totalSkills: number;
  skillsOffered: number;
  skillsRequested: number;
  activeSkills: number;
  topCategories: Array<{ category: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

// Skill recommendations interface
interface SkillRecommendation {
  skill: Skill;
  score: number;
  reason: string;
}

/**
 * Enhanced Skills Service with comprehensive functionality
 */
const skillsService = {
  /**
   * Sucht nach Skills mit erweiterten Filteroptionen
   * @param params - Suchparameter
   * @returns Paginierte Skill-Liste
   */
  searchSkills: async (params: SkillSearchParams = {}): Promise<PaginatedResponse<Skill>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Skill>>(
        SKILL_ENDPOINTS.GET_SKILLS,
        { params: params as Record<string, unknown> }
      );
      return response.data;
    } catch (error) {
      console.error('Skill search failed:', error);
      throw new Error('Skills konnten nicht geladen werden.');
    }
  },

  /**
   * Holt alle Skills mit Caching
   * @param page - Seitenzahl
   * @param pageSize - Anzahl pro Seite
   * @returns Paginierte Skill-Liste
   */
  getAllSkills: async (
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    try {
      const response = await apiClient.getWithCache<PaginatedResponse<Skill>>(
        SKILL_ENDPOINTS.GET_SKILLS,
        5 * 60 * 1000, // 5 minutes cache
        { params: { page, pageSize } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      throw new Error('Skills konnten nicht geladen werden.');
    }
  },

  /**
   * Holt einen einzelnen Skill
   * @param skillId - Skill-ID
   * @returns Skill-Details
   */
  getSkillById: async (skillId: string): Promise<Skill> => {
    try {
      const response = await apiClient.get<Skill>(
        `${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch skill:', error);
      throw new Error('Skill konnte nicht geladen werden.');
    }
  },

  /**
   * Sucht Skills nach Suchbegriff
   * @param query - Suchbegriff
   * @param page - Seitenzahl
   * @param pageSize - Anzahl pro Seite
   * @returns Paginierte Skill-Liste
   */
  getSkillsBySearch: async (
    query: string,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.GET_SKILLS}?searchTerm=${query}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  /**
   * Holt Benutzer-Skills
   * @param page - Seitenzahl
   * @param pageSize - Anzahl pro Seite
   * @returns Paginierte User-Skill-Liste
   */
  getUserSkills: async (
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.GET_MY_SKILLS}?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  /**
   * Holt einen einzelnen Benutzer-Skill
   * @param skillId - Skill-ID
   * @returns Skill-Details
   */
  getUserSkillById: async (skillId: string): Promise<Skill> => {
    const response = await apiClient.get<Skill>(
      `${SKILL_ENDPOINTS.GET_MY_SKILLS}/${skillId}`
    );
    return response.data;
  },

  /**
   * Sucht in Benutzer-Skills
   * @param query - Suchbegriff
   * @param page - Seitenzahl
   * @param pageSize - Anzahl pro Seite
   * @returns Paginierte User-Skill-Liste
   */
  getUserSkillsBySearch: async (
    query: string,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResponse<Skill>> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>(
      `${SKILL_ENDPOINTS.GET_MY_SKILLS}?searchTerm=${query}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  /**
   * Erstellt einen neuen Skill
   * @param skillData - Skill-Daten
   * @returns Erstellter Skill
   */
  createSkill: async (skillData: CreateSkillRequest): Promise<CreateSkillResponse> => {
    try {
      const response = await apiClient.post<CreateSkillResponse>(
        SKILL_ENDPOINTS.CREATE_SKILL,
        skillData
      );
      
      // Clear related cache
      apiClient.clearCache('skills');
      apiClient.clearCache('user/skills');
      
      return response.data;
    } catch (error) {
      console.error('Skill creation failed:', error);
      throw new Error('Skill konnte nicht erstellt werden.');
    }
  },

  /**
   * Aktualisiert einen Skill
   * @param id - Skill-ID
   * @param updateSkillData - Aktualisierte Skill-Daten
   * @returns Aktualisierter Skill
   */
  updateSkill: async (
    id: string,
    updateSkillData: UpdateSkillRequest
  ): Promise<UpdateSkillResponse> => {
    try {
      const response = await apiClient.put<UpdateSkillResponse>(
        `${SKILL_ENDPOINTS.UPDATE_SKILL}/${id}`,
        updateSkillData
      );
      
      // Clear related cache
      apiClient.clearCache('skills');
      apiClient.clearCache('user/skills');
      
      return response.data;
    } catch (error) {
      console.error('Skill update failed:', error);
      throw new Error('Skill konnte nicht aktualisiert werden.');
    }
  },

  /**
   * Löscht einen Skill
   * @param id - Skill-ID
   */
  deleteSkill: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${SKILL_ENDPOINTS.DELETE_SKILL}/${id}`);
      
      // Clear related cache
      apiClient.clearCache('skills');
      apiClient.clearCache('user/skills');
    } catch (error) {
      console.error('Skill deletion failed:', error);
      throw new Error('Skill konnte nicht gelöscht werden.');
    }
  },

  /**
   * Bewertet einen Skill
   * @param skillId - Skill-ID
   * @param rating - Bewertung (1-5)
   * @param review - Optionale Rezension
   * @returns Erfolg-Status
   */
  rateSkill: async (skillId: string, rating: number, review?: string): Promise<void> => {
    try {
      await apiClient.post(`${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}/rate`, {
        rating,
        review,
      });
      
      // Clear skill cache to refresh ratings
      apiClient.clearCache(`skills/${skillId}`);
    } catch (error) {
      console.error('Skill rating failed:', error);
      throw new Error('Skill-Bewertung fehlgeschlagen.');
    }
  },

  /**
   * Empfiehlt einen Skill
   * @param skillId - Skill-ID
   * @param message - Empfehlungsnachricht
   * @returns Erfolg-Status
   */
  endorseSkill: async (skillId: string, message?: string): Promise<void> => {
    try {
      await apiClient.post(`${SKILL_ENDPOINTS.GET_SKILLS}/${skillId}/endorse`, {
        message,
      });
      
      // Clear skill cache to refresh endorsements
      apiClient.clearCache(`skills/${skillId}`);
    } catch (error) {
      console.error('Skill endorsement failed:', error);
      throw new Error('Skill-Empfehlung fehlgeschlagen.');
    }
  },

  /**
   * Holt Skill-Kategorien mit Caching
   * @returns Liste der Kategorien
   */
  getCategories: async (): Promise<SkillCategory[]> => {
    try {
      const response = await apiClient.getWithCache<SkillCategory[]>(
        SKILL_ENDPOINTS.CATEGORIES,
        15 * 60 * 1000 // 15 minutes cache
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw new Error('Kategorien konnten nicht geladen werden.');
    }
  },

  /**
   * Erstellt eine neue Kategorie (Admin)
   * @param name - Kategoriename
   * @param description - Kategoriebeschreibung
   * @returns Erstellte Kategorie
   */
  createCategory: async (name: string, description?: string): Promise<SkillCategory> => {
    try {
      const response = await apiClient.post<SkillCategory>(
        SKILL_ENDPOINTS.CATEGORIES,
        { name, description }
      );
      
      // Clear categories cache
      apiClient.clearCache(SKILL_ENDPOINTS.CATEGORIES);
      
      return response.data;
    } catch (error) {
      console.error('Category creation failed:', error);
      throw new Error('Kategorie konnte nicht erstellt werden.');
    }
  },

  /**
   * Aktualisiert eine Kategorie (Admin)
   * @param id - Kategorie-ID
   * @param name - Neuer Name
   * @param description - Neue Beschreibung
   * @returns Aktualisierte Kategorie
   */
  updateCategory: async (
    id: string,
    name: string,
    description?: string
  ): Promise<SkillCategory> => {
    try {
      const response = await apiClient.put<SkillCategory>(
        `${SKILL_ENDPOINTS.CATEGORIES}/${id}`,
        { name, description }
      );
      
      // Clear categories cache
      apiClient.clearCache(SKILL_ENDPOINTS.CATEGORIES);
      
      return response.data;
    } catch (error) {
      console.error('Category update failed:', error);
      throw new Error('Kategorie konnte nicht aktualisiert werden.');
    }
  },

  /**
   * Löscht eine Kategorie (Admin)
   * @param id - Kategorie-ID
   */
  deleteCategory: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${SKILL_ENDPOINTS.CATEGORIES}/${id}`);
      
      // Clear categories cache
      apiClient.clearCache(SKILL_ENDPOINTS.CATEGORIES);
    } catch (error) {
      console.error('Category deletion failed:', error);
      throw new Error('Kategorie konnte nicht gelöscht werden.');
    }
  },

  /**
   * Holt Kompetenzlevel mit Caching
   * @returns Liste der Kompetenzlevel
   */
  getProficiencyLevels: async (): Promise<ProficiencyLevel[]> => {
    try {
      const response = await apiClient.getWithCache<ProficiencyLevel[]>(
        SKILL_ENDPOINTS.PROFICIENCY_LEVELS,
        15 * 60 * 1000 // 15 minutes cache
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch proficiency levels:', error);
      throw new Error('Kompetenzlevel konnten nicht geladen werden.');
    }
  },

  /**
   * Erstellt ein neues Kompetenzlevel (Admin)
   * @param level - Level-Name
   * @param rank - Level-Rang
   * @param description - Level-Beschreibung
   * @returns Erstelltes Kompetenzlevel
   */
  createProficiencyLevel: async (
    level: string,
    rank: number,
    description?: string
  ): Promise<ProficiencyLevel> => {
    try {
      const response = await apiClient.post<ProficiencyLevel>(
        SKILL_ENDPOINTS.PROFICIENCY_LEVELS,
        { level, rank, description }
      );
      
      // Clear proficiency levels cache
      apiClient.clearCache(SKILL_ENDPOINTS.PROFICIENCY_LEVELS);
      
      return response.data;
    } catch (error) {
      console.error('Proficiency level creation failed:', error);
      throw new Error('Kompetenzlevel konnte nicht erstellt werden.');
    }
  },

  /**
   * Aktualisiert ein Kompetenzlevel (Admin)
   * @param id - Level-ID
   * @param level - Neuer Level-Name
   * @param rank - Neuer Level-Rang
   * @param description - Neue Beschreibung
   * @returns Aktualisiertes Kompetenzlevel
   */
  updateProficiencyLevel: async (
    id: string,
    level: string,
    rank: number,
    description?: string
  ): Promise<ProficiencyLevel> => {
    try {
      const response = await apiClient.put<ProficiencyLevel>(
        `${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`,
        { level, rank, description }
      );
      
      // Clear proficiency levels cache
      apiClient.clearCache(SKILL_ENDPOINTS.PROFICIENCY_LEVELS);
      
      return response.data;
    } catch (error) {
      console.error('Proficiency level update failed:', error);
      throw new Error('Kompetenzlevel konnte nicht aktualisiert werden.');
    }
  },

  /**
   * Löscht ein Kompetenzlevel (Admin)
   * @param id - Level-ID
   */
  deleteProficiencyLevel: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${SKILL_ENDPOINTS.PROFICIENCY_LEVELS}/${id}`);
      
      // Clear proficiency levels cache
      apiClient.clearCache(SKILL_ENDPOINTS.PROFICIENCY_LEVELS);
    } catch (error) {
      console.error('Proficiency level deletion failed:', error);
      throw new Error('Kompetenzlevel konnte nicht gelöscht werden.');
    }
  },

  /**
   * Holt Skill-Statistiken
   * @returns Skill-Statistiken
   */
  getSkillStatistics: async (): Promise<SkillStatistics> => {
    try {
      const response = await apiClient.getWithCache<SkillStatistics>(
        `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/statistics`,
        10 * 60 * 1000 // 10 minutes cache
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch skill statistics:', error);
      throw new Error('Skill-Statistiken konnten nicht geladen werden.');
    }
  },

  /**
   * Holt beliebte Tags
   * @param limit - Anzahl der Tags
   * @returns Liste beliebter Tags
   */
  getPopularTags: async (limit = 20): Promise<Array<{ tag: string; count: number }>> => {
    try {
      const response = await apiClient.getWithCache<Array<{ tag: string; count: number }>>(
        `${SKILL_ENDPOINTS.GET_SKILLS}/analytics/popular-tags`,
        5 * 60 * 1000, // 5 minutes cache
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch popular tags:', error);
      throw new Error('Beliebte Tags konnten nicht geladen werden.');
    }
  },

  /**
   * Holt personalisierte Skill-Empfehlungen
   * @param limit - Anzahl der Empfehlungen
   * @returns Liste von Skill-Empfehlungen
   */
  getSkillRecommendations: async (limit = 10): Promise<SkillRecommendation[]> => {
    try {
      const response = await apiClient.get<SkillRecommendation[]>(
        `${SKILL_ENDPOINTS.GET_SKILLS}/recommendations`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch skill recommendations:', error);
      throw new Error('Skill-Empfehlungen konnten nicht geladen werden.');
    }
  },

  /**
   * Bulk-Import von Skills
   * @param skills - Array von Skills zum Import
   * @returns Import-Ergebnis
   */
  bulkImportSkills: async (skills: CreateSkillRequest[]): Promise<{ success: number; failed: number; errors: string[] }> => {
    try {
      const response = await apiClient.post<{ success: number; failed: number; errors: string[] }>(
        `${SKILL_ENDPOINTS.CREATE_SKILL}/bulk`,
        { skills }
      );
      
      // Clear all skill caches after bulk import
      apiClient.clearCache('skills');
      apiClient.clearCache('user/skills');
      
      return response.data;
    } catch (error) {
      console.error('Bulk skill import failed:', error);
      throw new Error('Bulk-Import von Skills fehlgeschlagen.');
    }
  },

  /**
   * Exportiert Benutzer-Skills
   * @param format - Export-Format ('csv' | 'json' | 'xlsx')
   * @returns Export-Datei als Blob
   */
  exportUserSkills: async (format: 'csv' | 'json' | 'xlsx' = 'csv'): Promise<void> => {
    try {
      await apiClient.downloadFile(
        `${SKILL_ENDPOINTS.GET_USER_SKILLS}/export?format=${format}`,
        `my-skills.${format}`
      );
    } catch (error) {
      console.error('Skill export failed:', error);
      throw new Error('Skill-Export fehlgeschlagen.');
    }
  },
};

export { skillsService as SkillService };
export default skillsService;