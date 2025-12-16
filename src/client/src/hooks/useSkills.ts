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
  createCategory,
  updateCategory,
  deleteCategory,
  rateSkill,
  endorseSkill,
} from '../features/skills/thunks/skillsThunks';
import { fetchCategories } from '../features/skills/thunks/categoryThunks';
import {
  fetchProficiencyLevels,
  createProficiencyLevel,
  updateProficiencyLevel,
  deleteProficiencyLevel,
} from '../features/skills/thunks/proficiencyLevelThunks';
import {
  setSearchQuery,
  clearSearchQuery,
  setSelectedSkillId,
  clearError,
  setSearchResults,
} from '../features/skills/skillsSlice';

// Type definitions for hook parameters
interface CreateProficiencyLevelRequest {
  level: string;
  rank: number;
  description?: string;
}

interface UpdateProficiencyLevelRequest {
  level: string;
  rank: number;
  description?: string;
}

interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}
import {
  selectSkillsState,
  selectAllSkills,
  selectUserSkills,
  selectSelectedSkill,
  selectSkillSearchResults,
  selectFavoriteSkills,
  selectSkillsStatistics,
} from '../store/selectors/skillsSelectors';
import { selectAllCategories } from '../store/selectors/categoriesSelectors';
import { selectAllProficiencyLevels } from '../store/selectors/proficiencyLevelSelectors';
import type { SkillSearchParams } from '../types/contracts/responses/SkillResponses';
import type { CreateSkillRequest } from '../types/contracts/requests/CreateSkillRequest';
import type { UpdateSkillRequest } from '../types/contracts/requests/UpdateSkillRequest';

// Return type for useSkills hook - explicit definition without extending base state
interface UseSkillsReturn {
  // === STATE DATA ===
  skills: ReturnType<typeof selectAllSkills>;
  allSkills: ReturnType<typeof selectAllSkills>;
  userSkills: ReturnType<typeof selectUserSkills>;
  categories: ReturnType<typeof selectAllCategories>;
  proficiencyLevels: ReturnType<typeof selectAllProficiencyLevels>;
  favoriteSkills: ReturnType<typeof selectFavoriteSkills>;
  selectedSkill: ReturnType<typeof selectSelectedSkill>;
  searchResults: ReturnType<typeof selectSkillSearchResults>;
  statistics: ReturnType<typeof selectSkillsStatistics>;
  // === UI STATE ===
  searchQuery: string;
  selectedSkillId: string | null;
  isSearchActive: boolean;
  // === PAGINATION ===
  allSkillsPagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  userSkillsPagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  searchResultsPagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  // === ADDITIONAL DATA ===
  recommendations: {
    skill: ReturnType<typeof selectAllSkills>[number];
    score: number;
    reason: string;
    matchPercentage: number;
  }[];
  popularTags: { tag: string; count: number }[];
  // === LOADING STATES ===
  loading: boolean;
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingUser: boolean;
  isLoadingById: boolean;
  isLoadingFavorites: boolean;
  isLoadingCategories: boolean;
  isLoadingProficiencyLevels: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTogglingFavorite: boolean;
  // === ERROR STATES ===
  errors: Record<string, string>;
  error: string | undefined;
  errorMessage: string | undefined;
  // === FETCH OPERATIONS ===
  fetchAllSkills: (params?: SkillSearchParams) => void;
  fetchUserSkills: (params?: {
    pageNumber?: number;
    pageSize?: number;
    isOffered?: boolean;
    categoryId?: string;
    proficiencyLevelId?: string;
    includeInactive?: boolean;
  }) => void;
  fetchSkillById: (skillId: string) => void;
  fetchCategories: () => void;
  fetchProficiencyLevels: () => void;
  fetchFavoriteSkills: () => void;
  // === CRUD OPERATIONS ===
  createSkill: (skillData: CreateSkillRequest) => void;
  updateSkill: (skillId: string, updateData: UpdateSkillRequest) => void;
  deleteSkill: (skillId: string, reason?: string) => void;
  // === FAVORITE OPERATIONS ===
  toggleFavoriteSkill: (skillId: string, isFavorite: boolean) => void;
  addToFavorites: (skillId: string) => void;
  removeFromFavorites: (skillId: string) => void;
  // === UI STATE OPERATIONS ===
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  setSelectedSkillId: (skillId: string | null) => void;
  setSearchResults: (skillIds: string[]) => void;
  // === ERROR MANAGEMENT ===
  clearError: (
    errorKey:
      | 'fetchAll'
      | 'fetchUser'
      | 'fetchById'
      | 'fetchFavorites'
      | 'fetchCategories'
      | 'fetchProficiencyLevels'
      | 'create'
      | 'update'
      | 'delete'
      | 'toggleFavorite'
  ) => void;
  clearAllErrors: () => void;
  dismissError: () => void;
  // === ADMIN OPERATIONS ===
  createProficiencyLevel: (data: CreateProficiencyLevelRequest) => void;
  updateProficiencyLevel: (id: string, updates: UpdateProficiencyLevelRequest) => void;
  deleteProficiencyLevel: (id: string) => void;
  createCategory: (data: CreateCategoryRequest) => void;
  updateCategory: (id: string, updates: UpdateCategoryRequest) => void;
  deleteCategory: (id: string) => void;
  // === RATING & ENDORSEMENT OPERATIONS ===
  rateSkill: (skillId: string, rating: number, feedback?: string) => void;
  endorseSkill: (skillId: string, endorsement?: string) => void;
  // === COMPUTED VALUES ===
  getSkillById: (skillId: string) => ReturnType<typeof selectAllSkills>[number] | null;
  isSkillFavorite: (skillId: string) => boolean;
  getCategoryById: (categoryId: string) => ReturnType<typeof selectAllCategories>[number] | null;
  getProficiencyLevelById: (
    levelId: string
  ) => ReturnType<typeof selectAllProficiencyLevels>[number] | null;
  getSkillsByCategory: (
    categoryId: string,
    from?: 'all' | 'user' | 'favorites'
  ) => ReturnType<typeof selectAllSkills>;
  getSkillsByProficiencyLevel: (
    levelId: string,
    from?: 'all' | 'user' | 'favorites'
  ) => ReturnType<typeof selectAllSkills>;
  searchSkillsByQuery: (
    query: string,
    from?: 'all' | 'user' | 'favorites'
  ) => ReturnType<typeof selectAllSkills>;
  getSkillsStatistics: () => {
    totalAllSkills: number;
    totalUserSkills: number;
    totalFavoriteSkills: number;
    totalCategories: number;
    totalProficiencyLevels: number;
  };
  isAnyLoading: () => boolean;
  hasAnyError: () => boolean;
  getAllErrors: () => { type: string; message: string }[];
  // === LEGACY COMPATIBILITY ===
  fetchMySkills: (params?: {
    pageNumber?: number;
    pageSize?: number;
    isOffered?: boolean;
    categoryId?: string;
    proficiencyLevelId?: string;
    includeInactive?: boolean;
  }) => void;
  loadSkills: (params?: SkillSearchParams) => void;
  loadUserSkills: (params?: {
    pageNumber?: number;
    pageSize?: number;
    isOffered?: boolean;
    categoryId?: string;
    proficiencyLevelId?: string;
    includeInactive?: boolean;
  }) => void;
  loadCategories: () => void;
  loadProficiencyLevels: () => void;
  loadFavoriteSkills: () => void;
  isFavoriteSkill: (skillId: string) => boolean;
  addFavoriteSkill: (skillId: string) => void;
  removeFavoriteSkill: (skillId: string) => void;
  getCurrentSkill: () => ReturnType<typeof selectSelectedSkill>;
}

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
export const useSkills = (): UseSkillsReturn => {
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

  const actions = useMemo(
    () => ({
      // === FETCH OPERATIONS ===
      fetchAllSkills: (params?: SkillSearchParams) => {
        void dispatch(fetchAllSkills(params ?? {}));
      },

      fetchUserSkills: (params?: {
        pageNumber?: number;
        pageSize?: number;
        isOffered?: boolean;
        categoryId?: string;
        proficiencyLevelId?: string;
        includeInactive?: boolean;
      }) => {
        void dispatch(fetchUserSkills(params ?? {}));
      },

      fetchSkillById: (skillId: string) => {
        void dispatch(fetchSkillById(skillId));
      },

      fetchCategories: () => {
        void dispatch(fetchCategories());
      },

      fetchProficiencyLevels: () => {
        void dispatch(fetchProficiencyLevels());
      },

      fetchFavoriteSkills: () => {
        void dispatch(fetchFavoriteSkills());
      },

      // === CRUD OPERATIONS ===
      createSkill: (skillData: CreateSkillRequest) => {
        void dispatch(createSkill(skillData));
      },

      updateSkill: (skillId: string, updateData: UpdateSkillRequest) => {
        void dispatch(updateSkill({ skillId, updateData }));
      },

      deleteSkill: (skillId: string, reason?: string) => {
        void dispatch(deleteSkill({ skillId, reason }));
      },

      // === FAVORITE OPERATIONS ===
      toggleFavoriteSkill: (skillId: string, isFavorite: boolean) => {
        void dispatch(toggleFavoriteSkill({ skillId, isFavorite }));
      },

      addToFavorites: (skillId: string) => {
        void dispatch(toggleFavoriteSkill({ skillId, isFavorite: true }));
      },

      removeFromFavorites: (skillId: string) => {
        void dispatch(toggleFavoriteSkill({ skillId, isFavorite: false }));
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
      clearError: (
        errorKey:
          | 'fetchAll'
          | 'fetchUser'
          | 'fetchById'
          | 'fetchFavorites'
          | 'fetchCategories'
          | 'fetchProficiencyLevels'
          | 'create'
          | 'update'
          | 'delete'
          | 'toggleFavorite'
      ) => {
        dispatch(clearError(errorKey));
      },

      clearAllErrors: () => {
        dispatch(clearError(null));
      },

      // === ADMIN OPERATIONS ===
      createProficiencyLevel: (data: CreateProficiencyLevelRequest) => {
        void dispatch(createProficiencyLevel(data));
      },

      updateProficiencyLevel: (id: string, updates: UpdateProficiencyLevelRequest) => {
        void dispatch(updateProficiencyLevel({ id, ...updates }));
      },

      deleteProficiencyLevel: (id: string) => {
        void dispatch(deleteProficiencyLevel(id));
      },

      createCategory: (data: CreateCategoryRequest) => {
        void dispatch(createCategory(data));
      },

      updateCategory: (id: string, updates: UpdateCategoryRequest) => {
        void dispatch(updateCategory({ id, updates }));
      },

      deleteCategory: (id: string) => {
        void dispatch(deleteCategory(id));
      },

      // === RATING & ENDORSEMENT OPERATIONS ===
      rateSkill: (skillId: string, rating: number, feedback?: string) => {
        void dispatch(rateSkill({ skillId, rating, feedback }));
      },

      endorseSkill: (skillId: string, endorsement?: string) => {
        void dispatch(endorseSkill({ skillId, endorsement }));
      },

      // === ERROR HANDLING ===
      dismissError: () => {
        dispatch(clearError(null));
      },
    }),
    [dispatch]
  );

  // ===== COMPUTED VALUES (memoized) =====
  const computedValues = useMemo(
    () => ({
      // Get skill by ID helper
      getSkillById: (skillId: string) =>
        allSkills.find((skill) => skill.id === skillId) ??
        userSkills.find((skill) => skill.id === skillId) ??
        null,

      // Check if skill is favorite
      isSkillFavorite: (skillId: string) => skillsState.favoriteSkillIds.includes(skillId),

      // Get category by ID
      getCategoryById: (categoryId: string) =>
        categories.find((cat) => cat.id === categoryId) ?? null,

      // Get proficiency level by ID
      getProficiencyLevelById: (levelId: string) =>
        proficiencyLevels.find((level) => level.id === levelId) ?? null,

      // Filter skills by category
      getSkillsByCategory: (categoryId: string, from: 'all' | 'user' | 'favorites' = 'all') => {
        const sourceSkills =
          from === 'all' ? allSkills : from === 'user' ? userSkills : favoriteSkills;
        return sourceSkills.filter((skill) => skill.category.id === categoryId);
      },

      // Filter skills by proficiency level
      getSkillsByProficiencyLevel: (
        levelId: string,
        from: 'all' | 'user' | 'favorites' = 'all'
      ) => {
        const sourceSkills =
          from === 'all' ? allSkills : from === 'user' ? userSkills : favoriteSkills;
        return sourceSkills.filter((skill) => skill.proficiencyLevel.id === levelId);
      },

      // Search skills by name/description
      searchSkillsByQuery: (query: string, from: 'all' | 'user' | 'favorites' = 'all') => {
        if (!query.trim()) return [];
        const sourceSkills =
          from === 'all' ? allSkills : from === 'user' ? userSkills : favoriteSkills;
        const lowerQuery = query.toLowerCase();
        return sourceSkills.filter(
          (skill) =>
            skill.name.toLowerCase().includes(lowerQuery) ||
            skill.description.toLowerCase().includes(lowerQuery) ||
            skill.tagsJson.toLowerCase().includes(lowerQuery)
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
      isAnyLoading: () => skillsState.isLoading,

      // Check error states
      hasAnyError: () => !!skillsState.errorMessage,

      // Get all errors
      getAllErrors: () =>
        skillsState.errorMessage ? [{ type: 'general', message: skillsState.errorMessage }] : [],
    }),
    [
      allSkills,
      userSkills,
      favoriteSkills,
      categories,
      proficiencyLevels,
      skillsState.favoriteSkillIds,
      skillsState.isLoading,
      skillsState.errorMessage,
    ]
  );

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
    error: computedValues.hasAnyError() ? computedValues.getAllErrors()[0]?.message : undefined,
    errorMessage: computedValues.hasAnyError()
      ? computedValues.getAllErrors()[0]?.message
      : undefined,

    // === ADDITIONAL DATA ===
    statistics: skillsStatistics,
    recommendations: skillsState.recommendations,
    popularTags: skillsState.popularTags,

    // === ACTIONS (memoized) ===
    ...actions,

    // === COMPUTED VALUES (memoized) ===
    ...computedValues,

    // === LEGACY COMPATIBILITY ===
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
