// src/hooks/useSkills.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllSkills as fetchAllSkillsAction,
  fetchSkillById as fetchSkillByIdAction,
  fetchUserSkills as fetchUserSkillsAction,
  createSkill as createSkillAction,
  updateSkill as updateSkillAction,
  deleteSkill as deleteSkillAction,
  rateSkill as rateSkillAction,
  endorseSkill as endorseSkillAction,
  fetchSkillStatistics as fetchSkillStatisticsAction,
  fetchPopularTags as fetchPopularTagsAction,
  fetchSkillRecommendations as fetchSkillRecommendationsAction,
  fetchFavoriteSkills as fetchFavoriteSkillsAction,
  addFavoriteSkill as addFavoriteSkillAction,
  removeFavoriteSkill as removeFavoriteSkillAction,
  clearError,
  setError,
  setSelectedSkill,
  clearSelectedSkill,
  setSearchQuery,
  clearSearch,
  setPagination,
  resetPagination,
  setLoading,
  addUserSkill,
  removeUserSkill,
  updateSkillInState,
  clearAllSkills,
  resetState,
} from '../features/skills/skillsSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { CreateSkillRequest } from '../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../types/contracts/requests/UpdateSkillRequest';
import { Skill } from '../types/models/Skill';
import { SkillSearchParams } from '../api/services/skillsService';
import { ensureArray } from '../utils/safeAccess';
import {
  fetchCategories as fetchCategoriesAction,
  createCategory as createCategoryAction,
  updateCategory as updateCategoryAction,
  deleteCategory as deleteCategoryAction,
} from '../features/skills/categorySlice';
import {
  fetchProficiencyLevels as fetchProficiencyLevelsAction,
  createProficiencyLevel as createProficiencyLevelAction,
  updateProficiencyLevel as updateProficiencyLevelAction,
  deleteProficiencyLevel as deleteProficiencyLevelAction,
} from '../features/skills/proficiencyLevelSlice';

// Extended interfaces
interface ExtendedCreateSkillRequest extends CreateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
}

interface ExtendedUpdateSkillRequest extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
}

/**
 * Enhanced Skills Hook with improved state management and simplified logic
 */
export const useSkills = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Skills state
  const {
    allSkills,
    userSkills,
    selectedSkill,
    searchQuery,
    searchResults,
    isSearchActive,
    pagination,
    statistics,
    recommendations,
    popularTags,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    favoriteSkillIds,
    error
  } = useAppSelector((state) => state.skills);

  /** 
   * FAVORITES: Fetch favorite skill IDs for user 
  */
  const fetchFavoriteSkills = useCallback(
    async (): Promise<boolean> => {
      try {
        const resultAction = await dispatch(fetchFavoriteSkillsAction());
        if (fetchFavoriteSkillsAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('❌ Fetch favorite skills failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Fetch favorite skills error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /** FAVORITES: Add a skill to favorites */
  const addFavoriteSkill = useCallback(
    async (skillId: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(addFavoriteSkillAction({ skillId }));
        if (addFavoriteSkillAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('❌ Add favorite skill failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Add favorite skill error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /** FAVORITES: Remove a skill from favorites */
  const removeFavoriteSkill = useCallback(
    async (skillId: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(removeFavoriteSkillAction({ skillId }));
        if (removeFavoriteSkillAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('❌ Remove favorite skill failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Remove favorite skill error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /** FAVORITES: Check if a skill is a favorite */
  const isFavoriteSkill = useCallback(
    (skillId: string): boolean => {
      return favoriteSkillIds.includes(skillId);
    },
    [favoriteSkillIds]
  );

  /** FAVORITES: Get all favorite skills (Skill objects) */
  const getFavoriteSkills = useCallback((): Skill[] | undefined => {
    return allSkills?.filter((skill) => favoriteSkillIds.includes(skill.id));
  }, [allSkills, favoriteSkillIds]);

  // Categories and proficiency levels from separate slices
  const { categories } = useAppSelector((state) => state.category);
  const { proficiencyLevels } = useAppSelector(
    (state) => state.proficiencyLevel
  );

  /**
   * Get the appropriate skills array based on search state
   * @param tab - Tab index (0 = all skills, 1 = user skills)
   * @returns Current skills array to display
   */
  const getCurrentSkills = useCallback(
    (showOnly: string = 'others'): Skill[] | undefined => {
      if (isSearchActive && searchResults?.length > 0) {
        return searchResults;
      }
      return showOnly === 'others' ? allSkills : userSkills;
    },
    [isSearchActive, searchResults, allSkills, userSkills]
  );

  /**
   * Fetch all skills with pagination
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 12)
   * @returns Promise<boolean> - Success status
   */
  const fetchAllSkills = useCallback(
    async (params: SkillSearchParams = {}): Promise<boolean> => {
      try {
        const resultAction = await dispatch(fetchAllSkillsAction(params));

        if (fetchAllSkillsAction.fulfilled.match(resultAction)) {
          console.log('✅ All skills fetched successfully');
          return true;
        } else {
          console.error('❌ Fetch all skills failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Fetch all skills error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Fetch skill by ID with navigation option
   * @param skillId - Skill identifier
   * @param navigateToDetails - Whether to navigate to skill details page
   * @returns Promise<boolean> - Success status
   */
  const fetchSkillById = useCallback(
    async (skillId: string, navigateToDetails = false): Promise<boolean> => {
      try {
        console.log('🎯 Fetching skill by ID:', skillId);
        const resultAction = await dispatch(fetchSkillByIdAction(skillId));

        if (fetchSkillByIdAction.fulfilled.match(resultAction)) {
          if (navigateToDetails) {
            navigate(`/skills/${skillId}`);
          }
          console.log('✅ Skill fetched by ID successfully');
          return true;
        } else {
          console.error('❌ Fetch skill by ID failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Fetch skill by ID error:', error);
        return false;
      }
    },
    [dispatch, navigate]
  );

  /**
   * Search skills by query with validation
   * @param query - Search query
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Promise<boolean> - Success status
   */
  const searchSkillsByQuery = useCallback(
    async (query: string, pageNumber = 1, pageSize = 12): Promise<boolean> => {
      try {
        // Client-side validation
        if (!query?.trim() || query?.length < 2) {
          dispatch(
            setError(['Suchbegriff muss mindestens 2 Zeichen lang sein'])
          );
          return false;
        }

        console.log('🔍 Searching skills by query:', query);

        // Update search query in state
        dispatch(setSearchQuery(query));

        const resultAction = await dispatch(
          fetchAllSkillsAction({
            searchTerm: query.trim(),
            pageNumber,
            pageSize,
          })
        );

        if (fetchAllSkillsAction.fulfilled.match(resultAction)) {
          console.log('✅ Search by query successful');
          return true;
        } else {
          console.error('❌ Search by query failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Search by query error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Fetch user skills with error handling
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Promise<boolean> - Success status
   */
  const fetchUserSkills = useCallback(
    async (page = 1, pageSize = 12): Promise<boolean> => {
      try {
        console.log(
          '👤 Fetching user skills - page:',
          page,
          'pageSize:',
          pageSize
        );
        const resultAction = await dispatch(
          fetchUserSkillsAction({ page, pageSize })
        );

        if (fetchUserSkillsAction.fulfilled.match(resultAction)) {
          console.log('✅ User skills fetched successfully');
          return true;
        } else {
          console.error('❌ Fetch user skills failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Fetch user skills error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Search user skills
   * @param query - Search query
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Promise<boolean> - Success status
   */
  const searchUserSkills = useCallback(
    async (query: string, pageNumber = 1, pageSize = 12): Promise<boolean> => {
      try {
        if (!query?.trim() || query?.length < 2) {
          dispatch(
            setError(['Suchbegriff muss mindestens 2 Zeichen lang sein'])
          );
          return false;
        }

        console.log('🔍 Searching user skills:', query);
        dispatch(setSearchQuery(query));

        // Search in user skills specifically
        const resultAction = await dispatch(
          fetchAllSkillsAction({
            searchTerm: query.trim(),
            pageNumber,
            pageSize,
            // Add parameter to search only user's skills if your API supports it
            // userSkillsOnly: true
          })
        );

        if (fetchAllSkillsAction.fulfilled.match(resultAction)) {
          console.log('✅ User skills search successful');
          return true;
        } else {
          console.error('❌ User skills search failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ User skills search error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Create skill with comprehensive validation and navigation
   * @param skillData - Skill creation data
   * @param navigateToSkills - Whether to navigate to skills page after creation
   * @returns Promise<boolean> - Success status
   */
  const createSkill = useCallback(
    async (
      skillData: ExtendedCreateSkillRequest,
      navigateToSkills = false
    ): Promise<boolean> => {
      try {
        console.log('✨ Creating skill:', skillData);
        const resultAction = await dispatch(createSkillAction(skillData));

        if (createSkillAction.fulfilled.match(resultAction)) {
          console.log('✅ Skill created successfully');

          if (navigateToSkills) {
            navigate('/skills');
          }
          return true;
        } else {
          console.error('❌ Create skill failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Create skill error:', error);
        return false;
      }
    },
    [dispatch, navigate]
  );

  /**
   * Update skill with validation
   * @param skillId - Skill ID
   * @param updateData - Updated skill data
   * @returns Promise<boolean> - Success status
   */
  const updateSkill = useCallback(
    async (
      skillId: string,
      updateData: ExtendedUpdateSkillRequest
    ): Promise<boolean> => {
      try {
        console.log('📝 Updating skill:', skillId, updateData);
        const resultAction = await dispatch(
          updateSkillAction({ skillId, updateData })
        );

        if (updateSkillAction.fulfilled.match(resultAction)) {
          console.log('✅ Skill updated successfully');
          return true;
        } else {
          console.error('❌ Update skill failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Update skill error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Delete skill with confirmation
   * @param skillId - Skill ID
   * @param reason - Optional deletion reason
   * @returns Promise<boolean> - Success status
   */
  const deleteSkill = useCallback(
    async (skillId: string, reason?: string): Promise<boolean> => {
      try {
        console.log('🗑️ Deleting skill:', skillId, reason);
        const resultAction = await dispatch(
          deleteSkillAction({ skillId, reason })
        );

        if (deleteSkillAction.fulfilled.match(resultAction)) {
          console.log('✅ Skill deleted successfully');
          return true;
        } else {
          console.error('❌ Delete skill failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Delete skill error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Rate skill with validation
   * @param skillId - Skill ID
   * @param rating - Rating (1-5)
   * @param review - Optional review text
   * @returns Promise<boolean> - Success status
   */
  const rateSkill = useCallback(
    async (
      skillId: string,
      rating: number,
      review?: string
    ): Promise<boolean> => {
      try {
        // Client-side validation
        if (rating < 1 || rating > 5) {
          dispatch(setError(['Bewertung muss zwischen 1 und 5 liegen']));
          return false;
        }

        const resultAction = await dispatch(
          rateSkillAction({ skillId, rating, review })
        );

        if (rateSkillAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('❌ Rate skill failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Rate skill error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Endorse skill with validation
   * @param skillId - Skill ID
   * @param message - Optional endorsement message
   * @returns Promise<boolean> - Success status
   */
  const endorseSkill = useCallback(
    async (skillId: string, message?: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(
          endorseSkillAction({ skillId, message })
        );

        if (endorseSkillAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('❌ Endorse skill failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('❌ Endorse skill error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Category Management
   */
  const fetchCategories = useCallback(async (): Promise<boolean> => {
    try {
      const resultAction = await dispatch(fetchCategoriesAction());
      return fetchCategoriesAction.fulfilled.match(resultAction);
    } catch (error) {
      console.error('❌ Fetch categories error:', error);
      return false;
    }
  }, [dispatch]);

  const createCategory = useCallback(
    async (name: string, description?: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(
          createCategoryAction({ name, description })
        );
        return createCategoryAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Create category error:', error);
        return false;
      }
    },
    [dispatch]
  );

  const updateCategory = useCallback(
    async (
      id: string,
      name: string,
      description?: string
    ): Promise<boolean> => {
      try {
        const resultAction = await dispatch(
          updateCategoryAction({ id, name, description })
        );
        return updateCategoryAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Update category error:', error);
        return false;
      }
    },
    [dispatch]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(deleteCategoryAction(id));
        return deleteCategoryAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Delete category error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Proficiency Level Management
   */
  const fetchProficiencyLevels = useCallback(async (): Promise<boolean> => {
    try {
      const resultAction = await dispatch(fetchProficiencyLevelsAction());
      return fetchProficiencyLevelsAction.fulfilled.match(resultAction);
    } catch (error) {
      console.error('❌ Fetch proficiency levels error:', error);
      return false;
    }
  }, [dispatch]);

  const createProficiencyLevel = useCallback(
    async (
      level: string,
      rank: number,
      description?: string
    ): Promise<boolean> => {
      try {
        const resultAction = await dispatch(
          createProficiencyLevelAction({ level, rank, description })
        );
        return createProficiencyLevelAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Create proficiency level error:', error);
        return false;
      }
    },
    [dispatch]
  );

  const updateProficiencyLevel = useCallback(
    async (
      id: string,
      level: string,
      rank: number,
      description?: string
    ): Promise<boolean> => {
      try {
        const resultAction = await dispatch(
          updateProficiencyLevelAction({ id, level, rank, description })
        );
        return updateProficiencyLevelAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Update proficiency level error:', error);
        return false;
      }
    },
    [dispatch]
  );

  const deleteProficiencyLevel = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(deleteProficiencyLevelAction(id));
        return deleteProficiencyLevelAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Delete proficiency level error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Analytics and Statistics
   */
  const fetchSkillStatistics = useCallback(async (): Promise<boolean> => {
    try {
      const resultAction = await dispatch(fetchSkillStatisticsAction());
      return fetchSkillStatisticsAction.fulfilled.match(resultAction);
    } catch (error) {
      console.error('❌ Fetch skill statistics error:', error);
      return false;
    }
  }, [dispatch]);

  const fetchPopularTags = useCallback(
    async (limit = 20): Promise<boolean> => {
      try {
        const resultAction = await dispatch(fetchPopularTagsAction({ limit }));
        return fetchPopularTagsAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Fetch popular tags error:', error);
        return false;
      }
    },
    [dispatch]
  );

  const fetchSkillRecommendations = useCallback(
    async (limit = 10): Promise<boolean> => {
      try {
        const resultAction = await dispatch(
          fetchSkillRecommendationsAction({ limit })
        );
        return fetchSkillRecommendationsAction.fulfilled.match(resultAction);
      } catch (error) {
        console.error('❌ Fetch skill recommendations error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * State Management Utilities
   */
  const dismissError = useCallback((): void => {
    dispatch(clearError());
  }, [dispatch]);

  const selectSkill = useCallback(
    (skill: Skill | null): void => {
      dispatch(setSelectedSkill(skill));
    },
    [dispatch]
  );

  const clearSkill = useCallback((): void => {
    dispatch(clearSelectedSkill());
  }, [dispatch]);

  const setQuery = useCallback(
    (query: string): void => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  const clearSearchData = useCallback((): void => {
    dispatch(clearSearch());
  }, [dispatch]);

  const updatePagination = useCallback(
    (paginationData: Partial<typeof pagination>): void => {
      dispatch(setPagination(paginationData));
    },
    [dispatch]
  );

  const resetPaginationData = useCallback((): void => {
    dispatch(resetPagination());
  }, [dispatch]);

  const setLoadingState = useCallback(
    (loading: boolean): void => {
      dispatch(setLoading(loading));
    },
    [dispatch]
  );

  const addSkillToUser = useCallback(
    (skill: Skill): void => {
      dispatch(addUserSkill(skill));
    },
    [dispatch]
  );

  const removeSkillFromUser = useCallback(
    (skillId: string): void => {
      dispatch(removeUserSkill(skillId));
    },
    [dispatch]
  );

  const updateSkillState = useCallback(
    (skill: Skill): void => {
      dispatch(updateSkillInState(skill));
    },
    [dispatch]
  );

  const clearAllSkillsData = useCallback((): void => {
    dispatch(clearAllSkills());
  }, [dispatch]);

  const setErrorMessage = useCallback(
    (errorMessage: string[] | null): void => {
      dispatch(setError(errorMessage));
    },
    [dispatch]
  );

  const resetSkillsState = useCallback((): void => {
    dispatch(resetState());
  }, [dispatch]);

  /**
   * Utility Methods
   */
  const getSkillFromState = useCallback(
    (skillId: string): Skill | undefined => {
      return (
        allSkills?.find((skill) => skill.id === skillId) ||
        userSkills?.find((skill) => skill.id === skillId) ||
        searchResults.find((skill) => skill.id === skillId)
      );
    },
    [allSkills, userSkills, searchResults]
  );

  const getCategoryFromState = useCallback(
    (categoryId: string) => {
      return categories.find((category) => category.id === categoryId);
    },
    [categories]
  );

  const getProficiencyLevelFromState = useCallback(
    (levelId: string) => {
      return proficiencyLevels.find((level) => level.id === levelId);
    },
    [proficiencyLevels]
  );

  const getSkillsByCategory = useCallback(
    (categoryId: string): Skill[] => {
      const currentSkills = isSearchActive ? searchResults : allSkills;
      return currentSkills!.filter(
        (skill) => skill.category?.id === categoryId
      );
    },
    [allSkills, searchResults, isSearchActive]
  );

  const getSkillsByProficiencyLevel = useCallback(
    (levelId: string): Skill[] => {
      const currentSkills = isSearchActive ? searchResults : allSkills;
      return currentSkills!.filter(
        (skill) => skill.proficiencyLevel?.id === levelId
      );
    },
    [allSkills, searchResults, isSearchActive]
  );

  const isUserSkill = useCallback(
    (skillId: string): boolean => {
      return userSkills?.some((skill) => skill.id === skillId) || false;
    },
    [userSkills]
  );

  return {
    // State data
    skills: allSkills, // Backward compatibility
    allSkills,
    userSkills,
    favoriteSkillIds,
    selectedSkill,
    categories,
    proficiencyLevels,
    searchQuery,
    searchResults,
    isSearchActive,
    pagination,
    statistics,
    recommendations,
    popularTags,

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,

    // Core skill operations
    fetchAllSkills,
    fetchSkillById,
    searchSkillsByQuery,
    fetchUserSkills,
    searchUserSkills,
    createSkill,
    updateSkill,
    deleteSkill,

    // Favorites
    fetchFavoriteSkills,
    addFavoriteSkill,
    removeFavoriteSkill,
    isFavoriteSkill,
    getFavoriteSkills,

    // Skill interactions
    rateSkill,
    endorseSkill,

    // Category management
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Proficiency level management
    fetchProficiencyLevels,
    createProficiencyLevel,
    updateProficiencyLevel,
    deleteProficiencyLevel,

    // Analytics and recommendations
    fetchSkillStatistics,
    fetchPopularTags,
    fetchSkillRecommendations,

    // State management
    dismissError,
    selectSkill,
    clearSkill,
    setQuery,
    clearSearch: clearSearchData,
    updatePagination,
    resetPagination: resetPaginationData,
    setLoadingState,
    addSkillToUser,
    removeSkillFromUser,
    updateSkillState,
    clearAllSkillsData,
    setErrorMessage,
    resetSkillsState,

    // Utility methods
    getCurrentSkills,
    getSkillFromState,
    getCategoryFromState,
    getProficiencyLevelFromState,
    getSkillsByCategory,
    getSkillsByProficiencyLevel,
    isUserSkill,
  };
};
