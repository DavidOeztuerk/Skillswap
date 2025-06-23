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
 * Typisiertes Rückgabeformat für CRUD-Aktionen:
 * success: Boolean, data: optionales Ergebnisobjekt, error: optionaler Fehlertext
 */
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
}

/**
 * Custom-Hook für die Verwaltung von Skills, Kategorien und Fertigkeitsstufen.
 * Kapselt sämtliche Redux-Logik (Actions/Selectors) und bietet komfortable
 * Methoden zum Aufruf von CRUD-Operationen.
 */
export const useSkills = () => {
  const dispatch = useAppDispatch();

  // Selektierte Daten aus dem Redux-Store
  const allSkills = useAppSelector(selectAllSkills);
  const userSkills = useAppSelector(selectAllUserSkills);
  const categories = useAppSelector(selectAllCategories);
  const proficiencyLevels = useAppSelector(selectAllProficiencyLevels);
  const selectedSkill = useAppSelector(selectSelectedSkill);
  const status = useAppSelector(selectSkillsStatus);
  const error = useAppSelector(selectSkillsError);
  const pagination = useAppSelector(selectSkillsPagination);
  const searchQuery = useAppSelector(selectSkillsSearchQuery);

  // --------------------------------------------------
  // Skill-Helferfunktionen (Abfragen)
  // --------------------------------------------------
  const getSkills = useCallback(
    (page?: number, pageSize?: number) => {
      dispatch(fetchSkills({ page: page ?? 1, pageSize: pageSize ?? 10 }));
    },
    [dispatch]
  );

  const getUserSkillsCb = useCallback(
    (page?: number, pageSize?: number) => {
      dispatch(fetchUserSkills({ query: '', page: page ?? 1, pageSize: pageSize ?? 10 }));
    },
    [dispatch]
  );

  const getSkillByIdCb = useCallback(
    (skillId: string) => {
      dispatch(fetchSkillById(skillId));
    },
    [dispatch]
  );

  const getUserSkillByIdCb = useCallback(
    (skillId: string) => {
      dispatch(fetchUserSkillById(skillId));
    },
    [dispatch]
  );

  const searchAllSkills = useCallback(
    (query: string, page?: number, pageSize?: number) => {
      dispatch(setSearchQuery(query));
      dispatch(searchSkills({ query, page: page ?? 1, pageSize: pageSize ?? 10 }));
    },
    [dispatch]
  );

  const searchMySkills = useCallback(
    (query: string, page?: number, pageSize?: number) => {
      dispatch(setSearchQuery(query));
      dispatch(searchUserSkills({ query, page: page ?? 1, pageSize: pageSize ?? 10 }));
    },
    [dispatch]
  );

  // --------------------------------------------------
  // Skill-Helferfunktionen (CRUD)
  // --------------------------------------------------
  const addSkill = useCallback(
    async (skillData: CreateSkillRequest): Promise<ActionResult<unknown>> => {
      try {
        const resultAction = await dispatch(createSkill(skillData));
        if (createSkill.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        }
        return {
          success: false,
          error: resultAction.payload || 'Skill konnte nicht erstellt werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  const editSkill = useCallback(
    async (
      skillId: string,
      updateData: UpdateSkillRequest
    ): Promise<ActionResult<unknown>> => {
      try {
        const resultAction = await dispatch(
          updateSkill({ skillId, updateData })
        );
        if (updateSkill.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        }
        return {
          success: false,
          error:
            resultAction.payload || 'Skill konnte nicht aktualisiert werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  const removeSkill = useCallback(
    async (skillId: string): Promise<ActionResult<void>> => {
      try {
        const resultAction = await dispatch(deleteSkill(skillId));
        if (deleteSkill.fulfilled.match(resultAction)) {
          return { success: true };
        }
        return {
          success: false,
          error: resultAction.payload || 'Skill konnte nicht gelöscht werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  // --------------------------------------------------
  // Skill-Auswahl
  // --------------------------------------------------
  const setSkill = useCallback(
    (skill: Skill | undefined) => {
      dispatch(setSelectedSkill(skill));
    },
    [dispatch]
  );

  const clearSkill = useCallback(() => {
    dispatch(clearSelectedSkill());
  }, [dispatch]);

  // --------------------------------------------------
  // Kategorien
  // --------------------------------------------------
  const getCategoriesCb = useCallback(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const addCategory = useCallback(
    async (name: string): Promise<ActionResult<unknown>> => {
      try {
        const resultAction = await dispatch(createCategory(name));
        if (createCategory.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        }
        return {
          success: false,
          error:
            resultAction.payload || 'Kategorie konnte nicht erstellt werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  const editCategory = useCallback(
    async (id: string, name: string): Promise<ActionResult<unknown>> => {
      try {
        const resultAction = await dispatch(updateCategory({ id, name }));
        if (updateCategory.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        }
        return {
          success: false,
          error:
            resultAction.payload ||
            'Kategorie konnte nicht aktualisiert werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  const removeCategory = useCallback(
    async (id: string): Promise<ActionResult<void>> => {
      try {
        const resultAction = await dispatch(deleteCategory(id));
        if (deleteCategory.fulfilled.match(resultAction)) {
          return { success: true };
        }
        return {
          success: false,
          error:
            resultAction.payload || 'Kategorie konnte nicht gelöscht werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  // --------------------------------------------------
  // Fertigkeitsstufen
  // --------------------------------------------------
  const getProficiencyLevelsCb = useCallback(() => {
    dispatch(fetchProficiencyLevels());
  }, [dispatch]);

  const addProficiencyLevel = useCallback(
    async (level: string, rank: number): Promise<ActionResult<unknown>> => {
      try {
        const resultAction = await dispatch(
          createProficiencyLevel({ level, rank })
        );
        if (createProficiencyLevel.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        }
        return {
          success: false,
          error:
            resultAction.payload ||
            'Fertigkeitsstufe konnte nicht erstellt werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  const editProficiencyLevel = useCallback(
    async (
      id: string,
      level: string,
      rank: number
    ): Promise<ActionResult<unknown>> => {
      try {
        const resultAction = await dispatch(
          updateProficiencyLevel({ id, level, rank })
        );
        if (updateProficiencyLevel.fulfilled.match(resultAction)) {
          return { success: true, data: resultAction.payload };
        }
        return {
          success: false,
          error:
            resultAction.payload ||
            'Fertigkeitsstufe konnte nicht aktualisiert werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  const removeProficiencyLevel = useCallback(
    async (id: string): Promise<ActionResult<void>> => {
      try {
        const resultAction = await dispatch(deleteProficiencyLevel(id));
        if (deleteProficiencyLevel.fulfilled.match(resultAction)) {
          return { success: true };
        }
        return {
          success: false,
          error:
            resultAction.payload ||
            'Fertigkeitsstufe konnte nicht gelöscht werden',
        };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [dispatch]
  );

  // --------------------------------------------------
  // Paginierung & Status
  // --------------------------------------------------
  const changePagination = useCallback(
    (page: number, pageSize: number) => {
      dispatch(setPagination({ page, pageSize }));
    },
    [dispatch]
  );

  const resetAllStatus = useCallback(() => {
    dispatch(resetStatus());
  }, [dispatch]);

  // --------------------------------------------------
  // Skill holen (aus Cache oder Server)
  // --------------------------------------------------
  const getSkill = useCallback(
    (
      skillId: string,
      options?: { forceRefresh?: boolean; isUserSkill?: boolean }
    ) => {
      const { forceRefresh = false, isUserSkill = false } = options || {};

      const existingSkill = isUserSkill
        ? userSkills.find((skill) => skill.id === skillId)
        : allSkills.find((skill) => skill.id === skillId);

      if (existingSkill && !forceRefresh) {
        dispatch(setSelectedSkill(existingSkill));
        return;
      }

      if (isUserSkill) {
        dispatch(fetchUserSkillById(skillId));
      } else {
        dispatch(fetchSkillById(skillId));
      }
    },
    [dispatch, userSkills, allSkills]
  );

  // --------------------------------------------------
  // Automatisches Laden von Kategorien & Levels
  // --------------------------------------------------
  useEffect(() => {
    if (status.categories === 'idle') {
      dispatch(fetchCategories());
    }
    if (status.proficiencyLevels === 'idle') {
      dispatch(fetchProficiencyLevels());
    }
  }, [dispatch, status.categories, status.proficiencyLevels]);

  // --------------------------------------------------
  // Export des Hook
  // --------------------------------------------------
  return {
    // State
    skills: allSkills,
    userSkills,
    categories,
    proficiencyLevels,
    selectedSkill,
    status,
    error,
    pagination,
    searchQuery,

    // Skill-Methoden (Abfragen)
    getSkills,
    getUserSkills: getUserSkillsCb,
    getSkillById: getSkillByIdCb,
    getUserSkillById: getUserSkillByIdCb,
    searchAllSkills,
    searchMySkills,

    // Skill-Methoden (CRUD)
    addSkill,
    editSkill,
    removeSkill,
    setSkill,
    clearSkill,
    getSkill,

    // Kategorie-Methoden
    getCategories: getCategoriesCb,
    addCategory,
    editCategory,
    removeCategory,

    // Fertigkeitsstufen-Methoden
    getProficiencyLevels: getProficiencyLevelsCb,
    addProficiencyLevel,
    editProficiencyLevel,
    removeProficiencyLevel,

    // Paginierung & Status
    changePagination,
    resetAllStatus,

    // Hilfsflags
    isLoading: status.skills === 'loading' || status.userSkills === 'loading',
    hasError: !!error,
    isCreating: status.createSkill === 'loading',
    isUpdating: status.updateSkill === 'loading',
    isDeleting: status.deleteSkill === 'loading',
  };
};
