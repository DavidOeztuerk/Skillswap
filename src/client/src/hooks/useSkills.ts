// src/hooks/useSkills.ts
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  fetchSkills,
  fetchUserSkills,
  fetchSkillById,
  fetchUserSkillById,
  searchSkills,
  searchUserSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  fetchCategories,
  fetchProficiencyLevels,
  createCategory,
  updateCategory,
  deleteCategory,
  createProficiencyLevel,
  updateProficiencyLevel,
  deleteProficiencyLevel,
  setSelectedSkill,
  clearSelectedSkill,
  setSearchQuery,
  setPagination,
  resetStatus,
  selectAllSkills,
  selectAllUserSkills,
  selectSkillById,
  selectUserSkillById,
  selectAllCategories,
  selectAllProficiencyLevels,
  selectSelectedSkill,
  selectSkillsStatus,
  selectSkillsError,
  selectSkillsPagination,
  selectSkillsSearchQuery,
} from '../features/skills/skillsSlice';
import { Skill } from '../types/models/Skill';
import { CreateSkillRequest } from '../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../types/contracts/requests/UpdateSkillRequest';

/**
 * Custom-Hook für die Verwaltung von Skills
 * Bietet Zugriff auf Skills, Kategorien und Fertigkeitsstufen sowie alle
 * notwendigen Funktionen für CRUD-Operationen
 */
export const useSkills = () => {
  const dispatch = useAppDispatch();

  // Selektierte Daten aus dem Redux-Store
  const state = useAppSelector((state) => state);
  const allSkills = useAppSelector(selectAllSkills);
  const userSkills = useAppSelector(selectAllUserSkills);
  const categories = useAppSelector(selectAllCategories);
  const proficiencyLevels = useAppSelector(selectAllProficiencyLevels);
  const selectedSkill = useAppSelector(selectSelectedSkill);
  const status = useAppSelector(selectSkillsStatus);
  const error = useAppSelector(selectSkillsError);
  const pagination = useAppSelector(selectSkillsPagination);
  const searchQuery = useAppSelector(selectSkillsSearchQuery);

  // Skill-Helferfunktionen
  const getSkills = useCallback(
    (page?: number, pageSize?: number) => {
      dispatch(fetchSkills({ page, pageSize }));
    },
    [dispatch]
  );

  const getUserSkills = useCallback(
    (page?: number, pageSize?: number) => {
      dispatch(fetchUserSkills({ page, pageSize }));
    },
    [dispatch]
  );

  const getSkillById = useCallback(
    (skillId: string) => {
      dispatch(fetchSkillById(skillId));
    },
    [dispatch]
  );

  const getUserSkillById = useCallback(
    (skillId: string) => {
      dispatch(fetchUserSkillById(skillId));
    },
    [dispatch]
  );

  const searchAllSkills = useCallback(
    (query: string, page?: number, pageSize?: number) => {
      dispatch(setSearchQuery(query));
      dispatch(searchSkills({ query, page, pageSize }));
    },
    [dispatch]
  );

  const searchMySkills = useCallback(
    (query: string, page?: number, pageSize?: number) => {
      dispatch(setSearchQuery(query));
      dispatch(searchUserSkills({ query, page, pageSize }));
    },
    [dispatch]
  );

  const addSkill = useCallback(
    async (skillData: CreateSkillRequest) => {
      try {
        const resultAction = await dispatch(createSkill(skillData));
        if (createSkill.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Skill konnte nicht erstellt werden',
          };
        }
      } catch (error) {
        return { success: false, error: error };
      }
    },
    [dispatch]
  );

  const editSkill = useCallback(
    async (skillId: string, updateData: UpdateSkillRequest) => {
      try {
        const resultAction = await dispatch(
          updateSkill({ skillId, updateData })
        );
        if (updateSkill.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Skill konnte nicht aktualisiert werden',
          };
        }
      } catch (error) {
        return { success: false, error: error };
      }
    },
    [dispatch]
  );

  const removeSkill = useCallback(
    async (skillId: string) => {
      try {
        const resultAction = await dispatch(deleteSkill(skillId));
        if (deleteSkill.fulfilled.match(resultAction)) {
          return { success: true };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Skill konnte nicht gelöscht werden',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error,
        };
      }
    },
    [dispatch]
  );

  const setSkill = useCallback(
    (skill: Skill | undefined) => {
      dispatch(setSelectedSkill(skill));
    },
    [dispatch]
  );

  const clearSkill = useCallback(() => {
    dispatch(clearSelectedSkill());
  }, [dispatch]);

  // Kategorie-Helferfunktionen
  const getCategories = useCallback(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const addCategory = useCallback(
    async (name: string) => {
      try {
        const resultAction = await dispatch(createCategory(name));
        if (createCategory.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Kategorie konnte nicht erstellt werden',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error,
        };
      }
    },
    [dispatch]
  );

  const editCategory = useCallback(
    async (id: string, name: string) => {
      try {
        const resultAction = await dispatch(updateCategory({ id, name }));
        if (updateCategory.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Kategorie konnte nicht aktualisiert werden',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error,
        };
      }
    },
    [dispatch]
  );

  const removeCategory = useCallback(
    async (id: string) => {
      try {
        const resultAction = await dispatch(deleteCategory(id));
        if (deleteCategory.fulfilled.match(resultAction)) {
          return { success: true };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Kategorie konnte nicht gelöscht werden',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error,
        };
      }
    },
    [dispatch]
  );

  // Fertigkeitsstufen-Helferfunktionen
  const getProficiencyLevels = useCallback(() => {
    dispatch(fetchProficiencyLevels());
  }, [dispatch]);

  const addProficiencyLevel = useCallback(
    async (level: string, rank: number) => {
      try {
        const resultAction = await dispatch(
          createProficiencyLevel({ level, rank })
        );
        if (createProficiencyLevel.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Fertigkeitsstufe konnte nicht erstellt werden',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error,
        };
      }
    },
    [dispatch]
  );

  const editProficiencyLevel = useCallback(
    async (id: string, level: string, rank: number) => {
      try {
        const resultAction = await dispatch(
          updateProficiencyLevel({ id, level, rank })
        );
        if (updateProficiencyLevel.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Fertigkeitsstufe konnte nicht aktualisiert werden',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error,
        };
      }
    },
    [dispatch]
  );

  const removeProficiencyLevel = useCallback(
    async (id: string) => {
      try {
        const resultAction = await dispatch(deleteProficiencyLevel(id));
        if (deleteProficiencyLevel.fulfilled.match(resultAction)) {
          return { success: true };
        } else {
          return {
            success: false,
            error:
              (resultAction.payload as string) ||
              'Fertigkeitsstufe konnte nicht gelöscht werden',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error,
        };
      }
    },
    [dispatch]
  );

  // Paginierungs-Helferfunktionen
  const changePagination = useCallback(
    (page: number, pageSize: number) => {
      dispatch(setPagination({ page, pageSize }));
    },
    [dispatch]
  );

  // Fehlerverwaltung
  const resetAllStatus = useCallback(() => {
    dispatch(resetStatus());
  }, [dispatch]);

  // Hilfsfunktion zum Abrufen eines Skills (entweder aus dem Store oder vom Server)
  const getSkill = useCallback(
    (
      skillId: string,
      options?: { forceRefresh?: boolean; isUserSkill?: boolean }
    ) => {
      const { forceRefresh = false, isUserSkill = false } = options || {};

      // Skill aus dem Store holen, wenn verfügbar und kein Refresh gefordert wird
      const existingSkill = isUserSkill
        ? selectUserSkillById(state, skillId)
        : selectSkillById(state, skillId);

      if (existingSkill && !forceRefresh) {
        dispatch(setSelectedSkill(existingSkill));
        return;
      }

      // Ansonsten vom Server abrufen
      if (isUserSkill) {
        dispatch(fetchUserSkillById(skillId));
      } else {
        dispatch(fetchSkillById(skillId));
      }
    },
    [dispatch, state]
  );

  // Effekt zum automatischen Laden von Kategorien und Fertigkeitsstufen
  useEffect(() => {
    if (status.categories === 'idle') {
      dispatch(fetchCategories());
    }
    if (status.proficiencyLevels === 'idle') {
      dispatch(fetchProficiencyLevels());
    }
  }, [dispatch, status.categories, status.proficiencyLevels]);

  return {
    // Daten
    skills: allSkills,
    userSkills,
    categories,
    proficiencyLevels,
    selectedSkill,
    status,
    error,
    pagination,
    searchQuery,

    // Allgemeine Skills-Operationen
    getSkills,
    getUserSkills,
    getSkillById,
    getUserSkillById,
    searchAllSkills,
    searchMySkills,
    addSkill,
    editSkill,
    removeSkill,
    setSkill,
    clearSkill,
    getSkill,

    // Kategorie-Operationen
    getCategories,
    addCategory,
    editCategory,
    removeCategory,

    // Fertigkeitsstufen-Operationen
    getProficiencyLevels,
    addProficiencyLevel,
    editProficiencyLevel,
    removeProficiencyLevel,

    // Paginierung
    changePagination,

    // Fehlerverwaltung
    resetAllStatus,

    // Status-Hilfsfunktionen
    isLoading: status.skills === 'loading' || status.userSkills === 'loading',
    hasError: !!error,
    isCreating: status.createSkill === 'loading',
    isUpdating: status.updateSkill === 'loading',
    isDeleting: status.deleteSkill === 'loading',
  };
};
