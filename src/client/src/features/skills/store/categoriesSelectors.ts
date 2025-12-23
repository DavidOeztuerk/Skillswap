import { createSelector } from '@reduxjs/toolkit';
import type { CategoriesEntityState } from './categoriesAdapter+State';
import type { RootState } from '../../../core/store/store';

/**
 * Categories Selectors
 * Centralized selectors for skill categories state and entity operations
 */

// Base selectors
export const selectCategoriesState = (state: RootState): CategoriesEntityState => state.category;
export const selectCategoriesLoading = (state: RootState): boolean => state.category.isLoading;
export const selectCategoriesError = (state: RootState): string | undefined =>
  state.category.errorMessage;
export const selectIsCategoryCreating = (state: RootState): boolean => state.category.isCreating;
export const selectIsCategoryUpdating = (state: RootState): boolean => state.category.isUpdating;
export const selectIsCategoryDeleting = (state: RootState): boolean => state.category.isDeleting;

// Entity selectors - use categories array directly
export const selectAllCategories = createSelector(
  [selectCategoriesState],
  (categoriesState) => categoriesState.categories
);

export const selectCategoryById = createSelector(
  [selectCategoriesState, (_: RootState, categoryId: string) => categoryId],
  (categoriesState, categoryId) => categoriesState.entities[categoryId] ?? null
);

// Direct array selectors
export const selectCategories = createSelector(
  [selectCategoriesState],
  (categoriesState) => categoriesState.categories
);

export const selectSelectedCategory = createSelector(
  [selectCategoriesState],
  (categoriesState) => categoriesState.selectedCategory
);

// Computed selectors
export const selectCategoriesSortedByName = createSelector([selectAllCategories], (categories) =>
  [...categories].sort((a, b) => a.name.localeCompare(b.name))
);

export const selectCategoriesSortedBySkillCount = createSelector(
  [selectAllCategories],
  (categories) => [...categories].sort((a, b) => (b.skillCount ?? 0) - (a.skillCount ?? 0))
);

// Search and filtering
export const selectCategoriesByName = createSelector(
  [selectAllCategories, (_: RootState, searchTerm: string) => searchTerm],
  (categories, searchTerm) => {
    if (!searchTerm.trim()) return categories;

    const term = searchTerm.toLowerCase();
    return categories.filter((category) => category.name.toLowerCase().includes(term));
  }
);

export const selectCategoriesWithSkills = createSelector([selectAllCategories], (categories) =>
  categories.filter((category) => (category.skillCount ?? 0) > 0)
);

export const selectEmptyCategories = createSelector([selectAllCategories], (categories) =>
  categories.filter((category) => (category.skillCount ?? 0) === 0)
);

// Popular categories based on skill count
export const selectTopCategories = createSelector(
  [selectCategoriesSortedBySkillCount],
  (sortedCategories) => sortedCategories.slice(0, 10)
);

// Category statistics
export const selectCategoryStatistics = createSelector(
  [selectAllCategories, selectCategoriesWithSkills],
  (allCategories, categoriesWithSkills) => ({
    total: allCategories.length,
    withSkills: categoriesWithSkills.length,
    empty: allCategories.length - categoriesWithSkills.length,
    averageSkillsPerCategory:
      allCategories.length > 0
        ? Math.round(
            allCategories.reduce((sum, cat) => sum + (cat.skillCount ?? 0), 0) /
              allCategories.length
          )
        : 0,
  })
);
