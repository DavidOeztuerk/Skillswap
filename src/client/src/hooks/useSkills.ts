import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { 
  fetchAllSkills, 
  fetchUserSkills, 
  fetchSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  fetchFavoriteSkills,
  toggleFavoriteSkill,
  createProficiencyLevel,
  updateProficiencyLevel,
  deleteProficiencyLevel,
  createCategory,
  updateCategory,
  deleteCategory,
  rateSkill,
  endorseSkill,
} from '../features/skills/thunks/skillsThunks';
import {
  fetchCategories,
} from '../features/skills/thunks/categoryThunks';
import {
  fetchProficiencyLevels,
} from '../features/skills/thunks/proficiencyLevelThunks';
import {
  setSearchQuery,
  clearSearchQuery,
  setSelectedSkillId,
  clearError,
  setSearchResults
} from '../features/skills/skillsSlice';
import {
  selectSkillsState,
  selectAllSkills,
  selectUserSkills,
  selectSelectedSkill,
  selectSkillSearchResults,
  selectFavoriteSkills,
  selectSkillsStatistics
} from '../store/selectors/skillsSelectors';
import {
  selectAllCategories
} from '../store/selectors/categoriesSelectors';
import {
  selectAllProficiencyLevels
} from '../store/selectors/proficiencyLevelSelectors';
import { SkillSearchParams } from '../types/contracts/responses/SkillResponses';
import { CreateSkillRequest } from '../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../types/contracts/requests/UpdateSkillRequest';

/**
 * 🚀 NEUE ROBUSTE USESKILLS HOOK 
 * 
 * ✅ KEINE useEffects - prevents infinite loops!
 * ✅ Stateless Design - nur Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 * ✅ Type-Safe throughout - compile-time safety
 * ✅ Granular Loading States - better UX
 * ✅ Error Management - per operation
 * 
 * CRITICAL: This hook is STATELESS and contains NO useEffects.
 * All data fetching must be initiated from Components!
 */
export const useSkills = () => {
  const dispatch = useAppDispatch();
  const skillsState = useAppSelector(selectSkillsState);

  // ===== SELECTORS (with memoization) =====
  const allSkills = useAppSelector(selectAllSkills);
  const userSkills = useAppSelector(selectUserSkills);  
  const categories = useAppSelector(selectAllCategories);
  const proficiencyLevels = useAppSelector(selectAllProficiencyLevels);
  const favoriteSkills = useAppSelector(selectFavoriteSkills);
  const selectedSkill = useAppSelector(selectSelectedSkill);
  const searchResults = useAppSelector(selectSkillSearchResults);
  const skillsStatistics = useAppSelector(selectSkillsStatistics);

  // ===== MEMOIZED ACTIONS =====
  // These are the ONLY functions that Components should call
  // They are memoized to prevent unnecessary re-renders
  
  const actions = useMemo(() => ({
    
    // === FETCH OPERATIONS ===
    fetchAllSkills: (params?: SkillSearchParams) => {
      return dispatch(fetchAllSkills(params || {}));
    },

    fetchUserSkills: (params?: {
      pageNumber?: number;
      pageSize?: number;
      isOffered?: boolean;
      categoryId?: string;
      proficiencyLevelId?: string;
      includeInactive?: boolean;
    }) => {
      return dispatch(fetchUserSkills(params || {}));
    },

    fetchSkillById: (skillId: string) => {
      return dispatch(fetchSkillById(skillId));
    },

    fetchCategories: () => {
      return dispatch(fetchCategories());
    },

    fetchProficiencyLevels: () => {
      return dispatch(fetchProficiencyLevels());
    },

    fetchFavoriteSkills: () => {
      return dispatch(fetchFavoriteSkills());
    },

    // === CRUD OPERATIONS ===
    createSkill: (skillData: CreateSkillRequest) => {
      return dispatch(createSkill(skillData));
    },

    updateSkill: (skillId: string, updateData: UpdateSkillRequest) => {
      return dispatch(updateSkill({ skillId, updateData }));
    },

    deleteSkill: (skillId: string, reason?: string) => {
      return dispatch(deleteSkill({ skillId, reason }));
    },

    // === FAVORITE OPERATIONS ===  
    toggleFavoriteSkill: (skillId: string, isFavorite: boolean) => {
      return dispatch(toggleFavoriteSkill({ skillId, isFavorite }));
    },

    addToFavorites: (skillId: string) => {
      return dispatch(toggleFavoriteSkill({ skillId, isFavorite: true }));
    },

    removeFromFavorites: (skillId: string) => {
      return dispatch(toggleFavoriteSkill({ skillId, isFavorite: false }));
    },

    // === UI STATE OPERATIONS ===
    setSearchQuery: (query: string) => {
      dispatch(setSearchQuery(query));
    },

    clearSearchQuery: () => {
      dispatch(clearSearchQuery());
    },

    setSelectedSkillId: (skillId: string | null) => {
      dispatch(setSelectedSkillId(skillId));
    },

    setSearchResults: (skillIds: string[]) => {
      dispatch(setSearchResults(skillIds));
    },

    // === ERROR MANAGEMENT ===
    clearError: (errorKey: 'fetchAll' | 'fetchUser' | 'fetchById' | 'fetchFavorites' | 'fetchCategories' | 'fetchProficiencyLevels' | 'create' | 'update' | 'delete' | 'toggleFavorite') => {
      dispatch(clearError(errorKey));
    },

    clearAllErrors: () => {
      dispatch(clearError(null));
    },

    // === ADMIN OPERATIONS ===
    createProficiencyLevel: (data: any) => {
      return dispatch(createProficiencyLevel(data));
    },

    updateProficiencyLevel: (id: string, updates: any) => {
      return dispatch(updateProficiencyLevel({ id, updates }));
    },

    deleteProficiencyLevel: (id: string) => {
      return dispatch(deleteProficiencyLevel(id));
    },

    createCategory: (data: any) => {
      return dispatch(createCategory(data));
    },

    updateCategory: (id: string, updates: any) => {
      return dispatch(updateCategory({ id, updates }));
    },

    deleteCategory: (id: string) => {
      return dispatch(deleteCategory(id));
    },

    // === RATING & ENDORSEMENT OPERATIONS ===
    rateSkill: (skillId: string, rating: number, feedback?: string) => {
      return dispatch(rateSkill({ skillId, rating, feedback }));
    },

    endorseSkill: (skillId: string, endorsement?: string) => {
      return dispatch(endorseSkill({ skillId, endorsement }));
    },

    // === ERROR HANDLING ===
    dismissError: () => {
      dispatch(clearError(null));
    },

  }), [dispatch]);

  // ===== COMPUTED VALUES (memoized) =====
  const computedValues = useMemo(() => ({
    
    // Get skill by ID helper
    getSkillById: (skillId: string) => {
      return allSkills.find(skill => skill.id === skillId) || 
             userSkills.find(skill => skill.id === skillId) || 
             null;
    },

    // Check if skill is favorite
    isSkillFavorite: (skillId: string) => {
      return skillsState.favoriteSkillIds.includes(skillId);
    },

    // Get category by ID
    getCategoryById: (categoryId: string) => {
      return categories.find(cat => cat.id === categoryId) || null;
    },

    // Get proficiency level by ID  
    getProficiencyLevelById: (levelId: string) => {
      return proficiencyLevels.find(level => level.id === levelId) || null;
    },

    // Filter skills by category
    getSkillsByCategory: (categoryId: string, from: 'all' | 'user' | 'favorites' = 'all') => {
      const sourceSkills = from === 'all' ? allSkills : from === 'user' ? userSkills : favoriteSkills;
      return sourceSkills.filter(skill => skill.category.id === categoryId);
    },

    // Filter skills by proficiency level
    getSkillsByProficiencyLevel: (levelId: string, from: 'all' | 'user' | 'favorites' = 'all') => {
      const sourceSkills = from === 'all' ? allSkills : from === 'user' ? userSkills : favoriteSkills;
      return sourceSkills.filter(skill => skill.proficiencyLevel.id === levelId);
    },

    // Search skills by name/description
    searchSkillsByQuery: (query: string, from: 'all' | 'user' | 'favorites' = 'all') => {
      if (!query.trim()) return [];
      const sourceSkills = from === 'all' ? allSkills : from === 'user' ? userSkills : favoriteSkills;
      const lowerQuery = query.toLowerCase();
      return sourceSkills.filter(skill => 
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description?.toLowerCase().includes(lowerQuery) ||
        skill.tagsJson?.toLowerCase().includes(lowerQuery)
      );
    },

    // Get skills statistics
    getSkillsStatistics: () => ({
      totalAllSkills: allSkills.length,
      totalUserSkills: userSkills.length,
      totalFavoriteSkills: favoriteSkills.length,
      totalCategories: categories.length,
      totalProficiencyLevels: proficiencyLevels.length,
    }),

    // Check loading states
    isAnyLoading: () => {
      return skillsState.isLoading;
    },

    // Check error states  
    hasAnyError: () => {
      return !!skillsState.errorMessage;
    },

    // Get all errors
    getAllErrors: () => {
      return skillsState.errorMessage ? [{ type: 'general', message: skillsState.errorMessage }] : [];
    },

  }), [allSkills, userSkills, favoriteSkills, categories, proficiencyLevels, skillsState.favoriteSkillIds, skillsState.isLoading, skillsState.errorMessage]);

  // ===== RETURN OBJECT =====
  return {
    // === STATE DATA ===
    skills: allSkills,
    allSkills,
    userSkills,
    categories,
    proficiencyLevels, 
    favoriteSkills,
    selectedSkill,
    searchResults,
    
    // === UI STATE ===
    searchQuery: skillsState.searchQuery,
    selectedSkillId: skillsState.selectedSkillId,
    isSearchActive: skillsState.isSearchActive,
    
    // === PAGINATION ===
    allSkillsPagination: skillsState.allSkillsPagination,
    userSkillsPagination: skillsState.userSkillsPagination,
    searchResultsPagination: skillsState.searchResultsPagination,
    
    // === LOADING STATES (granular) ===
    loading: skillsState.isLoading,
    isLoading: computedValues.isAnyLoading(),
    isLoadingAll: skillsState.isLoading,
    isLoadingUser: skillsState.isLoading,
    isLoadingById: skillsState.isLoading,
    isLoadingFavorites: skillsState.isLoading,
    isLoadingCategories: skillsState.isLoading,
    isLoadingProficiencyLevels: skillsState.isLoading,
    isCreating: skillsState.isLoading,
    isUpdating: skillsState.isLoading,
    isDeleting: skillsState.isLoading,
    isTogglingFavorite: skillsState.isLoading,
    
    // === ERROR STATES (granular) ===
    errors: skillsState.errorMessage ? { general: skillsState.errorMessage } : {},
    error: computedValues.hasAnyError() ? computedValues.getAllErrors()[0]?.message : null,
    errorMessage: computedValues.hasAnyError() ? computedValues.getAllErrors()[0]?.message : null,
    
    // === ADDITIONAL DATA ===
    statistics: skillsStatistics,
    recommendations: skillsState.recommendations,
    popularTags: skillsState.popularTags,
    
    // === ACTIONS (memoized) ===
    ...actions,
    
    // === COMPUTED VALUES (memoized) ===
    ...computedValues,
    
    // === LEGACY COMPATIBILITY ===
    // These are here for backward compatibility with existing components
    fetchMySkills: actions.fetchUserSkills,
    loadSkills: actions.fetchAllSkills,
    loadUserSkills: actions.fetchUserSkills,
    loadCategories: actions.fetchCategories,
    loadProficiencyLevels: actions.fetchProficiencyLevels,
    loadFavoriteSkills: actions.fetchFavoriteSkills,
    isFavoriteSkill: computedValues.isSkillFavorite,
    addFavoriteSkill: actions.addToFavorites,
    removeFavoriteSkill: actions.removeFromFavorites,
    getCurrentSkill: () => selectedSkill,
    clearError: actions.clearError,
  };
};

export default useSkills;