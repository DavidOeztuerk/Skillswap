// src/hooks/useSkills.ts
import { useState, useEffect, useCallback } from 'react';
import {
  fetchSkills,
  fetchUserSkills, 
  addUserSkill,
  removeUserSkill,
} from '../features/skills/skillsSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { Skill, SkillCategory } from '../types/models/Skill';
import { AddUserSkillRequest } from '../types/contracts/requests/AddUserSkillRequest';
import { ProficiencyLevel, UserSkill } from '../types/models/UserSkill';

/**
 * Hook für die Verwaltung von Skills
 * Bietet Methoden zum Laden, Hinzufügen und Entfernen von Skills
 */
export const useSkills = () => {
  const dispatch = useAppDispatch();
  const { skills, userSkills, isLoading, error } = useAppSelector(
    (state) => state.skills
  );
  const [filter, setFilter] = useState<{
    category: SkillCategory | null;
    searchTerm: string;
  }>({
    category: null,
    searchTerm: '',
  });

  /**
   * Lädt alle verfügbaren Skills
   */
  const loadSkills = useCallback(async (): Promise<void> => {
    await dispatch(fetchSkills());
  }, [dispatch]);

  /**
   * Lädt alle Skills des aktuellen Benutzers
   */
  const loadUserSkills = useCallback(async (): Promise<void> => {
    await dispatch(fetchUserSkills());
  }, [dispatch]);

  // Lade Skills beim ersten Rendern
  useEffect(() => {
    void loadSkills();
    void loadUserSkills();
  }, [loadSkills, loadUserSkills]);

  /**
   * Fügt einen Skill zum Benutzerprofil hinzu
   * @param skillData - Daten für den hinzuzufügenden Skill
   * @returns Der hinzugefügte UserSkill oder null bei Fehler
   */
  const addSkillToProfile = async (
    skillData: AddUserSkillRequest
  ): Promise<UserSkill | null> => {
    const resultAction = await dispatch(addUserSkill(skillData));

    if (addUserSkill.fulfilled.match(resultAction)) {
      return resultAction.payload;
    }

    return null;
  };

  /**
   * Entfernt einen Skill vom Benutzerprofil
   * @param skillId - ID des zu entfernenden Skills
   * @returns true bei Erfolg, false bei Fehler
   */
  const removeSkillFromProfile = async (skillId: string): Promise<boolean> => {
    const resultAction = await dispatch(removeUserSkill(skillId));
    return removeUserSkill.fulfilled.match(resultAction);
  };

  /**
   * Filtert verfügbare Skills basierend auf Kategorie und Suchbegriff
   * @returns Gefilterte Skills
   */
  const getFilteredSkills = (): Skill[] => {
    return skills.filter((skill) => {
      // Kategorie-Filter
      if (filter.category && skill.category !== filter.category) {
        return false;
      }

      // Suchbegriff-Filter
      if (
        filter.searchTerm &&
        !skill.name.toLowerCase().includes(filter.searchTerm.toLowerCase()) &&
        !skill.description
          .toLowerCase()
          .includes(filter.searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  };

  /**
   * Gruppiert Skills nach Kategorie
   * @returns Objekt mit Skills gruppiert nach Kategorie
   */
  const getSkillsByCategory = (): Record<SkillCategory, Skill[]> => {
    const result: Partial<Record<SkillCategory, Skill[]>> = {};

    // Initialisiere Kategorien
    Object.values(SkillCategory).forEach((category) => {
      result[category] = [];
    });

    // Fülle Kategorien mit Skills
    skills.forEach((skill) => {
      if (result[skill.category]) {
        result[skill.category]?.push(skill);
      }
    });

    return result as Record<SkillCategory, Skill[]>;
  };

  /**
   * Filtert Benutzer-Skills nach lehrbar/lernbar
   * @param isTeachable - true für lehrbare Skills, false für lernbare Skills
   * @returns Gefilterte Benutzer-Skills
   */
  const getUserSkillsByType = (isTeachable: boolean): UserSkill[] => {
    return userSkills.filter((userSkill) =>
      isTeachable ? userSkill.isTeachable : userSkill.isLearnable
    );
  };

  /**
   * Filtert Benutzer-Skills nach Kompetenzstufe
   * @param level - Zu filternde Kompetenzstufe
   * @returns Gefilterte Benutzer-Skills
   */
  const getUserSkillsByLevel = (level: ProficiencyLevel): UserSkill[] => {
    return userSkills.filter(
      (userSkill) => userSkill.proficiencyLevel === level
    );
  };

  /**
   * Prüft, ob ein Skill bereits im Benutzerprofil ist
   * @param skillId - ID des zu prüfenden Skills
   * @returns true, wenn der Skill im Profil vorhanden ist, sonst false
   */
  const hasSkill = (skillId: string): boolean => {
    return userSkills.some((userSkill) => userSkill.skillId === skillId);
  };

  /**
   * Aktualisiert den Filter
   * @param newFilter - Neuer Filter oder Teilobjekt
   */
  const updateFilter = (newFilter: Partial<typeof filter>): void => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  return {
    // Daten
    skills,
    userSkills,
    isLoading,
    error,
    filter,
    filteredSkills: getFilteredSkills(),

    // Aktionen
    loadSkills,
    loadUserSkills,
    addSkillToProfile,
    removeSkillFromProfile,
    updateFilter,

    // Hilfsfunktionen
    getSkillsByCategory,
    getUserSkillsByType,
    getUserSkillsByLevel,
    hasSkill,
  };
};
