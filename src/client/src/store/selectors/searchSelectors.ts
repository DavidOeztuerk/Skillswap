import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { SearchState } from '../adapters/searchAdapter+State';
import type { Skill } from '../../types/models/Skill';

/**
 * Search Selectors
 * Centralized selectors for search state and entity operations
 */

// Base selectors
export const selectSearchState = (state: RootState): SearchState => state.search;
export const selectSearchLoading = (state: RootState): boolean => state.search.isLoading;
export const selectSearchError = (state: RootState): string | undefined =>
  state.search.errorMessage;
export const selectUserSearchLoading = (state: RootState): boolean => state.search.userLoading;
export const selectAllSkillsLoading = (state: RootState): boolean => state.search.allSkillsLoading;

// Entity selectors - use results array directly
export const selectAllSearchSkills = createSelector(
  [selectSearchState],
  (searchState) => searchState.results
);

export const selectSearchSkillById = createSelector(
  [selectAllSearchSkills, (_: RootState, skillId: string) => skillId],
  (skills, skillId) => skills.find((skill) => skill.id === skillId) ?? null
);

// Direct array selectors
export const selectSearchResults = createSelector(
  [selectSearchState],
  (searchState) => searchState.results
);

export const selectUserSearchResults = createSelector(
  [selectSearchState],
  (searchState) => searchState.userResults
);

export const selectSearchAllSkills = createSelector(
  [selectSearchState],
  (searchState) => searchState.allSkills
);

export const selectCurrentQuery = createSelector(
  [selectSearchState],
  (searchState) => searchState.currentQuery
);

export const selectLastSearchParams = createSelector(
  [selectSearchState],
  (searchState) => searchState.lastSearchParams
);

// Pagination selectors
export const selectSearchPagination = createSelector(
  [selectSearchState],
  (searchState) => searchState.pagination
);

export const selectUserSearchPagination = createSelector(
  [selectSearchState],
  (searchState) => searchState.userPagination
);

export const selectSearchAllSkillsPagination = createSelector(
  [selectSearchState],
  (searchState) => searchState.allSkillsPagination
);

// Search state checks
export const selectIsSearchQueryActive = createSelector(
  [selectCurrentQuery],
  (query) => query.trim().length > 0
);

export const selectHasSearchResults = createSelector(
  [selectSearchResults],
  (results) => results.length > 0
);

export const selectHasUserSearchResults = createSelector(
  [selectUserSearchResults],
  (results) => results.length > 0
);

// Results filtering and sorting
export const selectSearchResultsByCategory = createSelector(
  [selectSearchResults, (_: RootState, categoryId: string) => categoryId],
  (results, categoryId) => results.filter((skill) => skill.category.id === categoryId)
);

export const selectSearchResultsByProficiencyLevel = createSelector(
  [selectSearchResults, (_: RootState, levelId: string) => levelId],
  (results, levelId) => results.filter((skill) => skill.proficiencyLevel.id === levelId)
);

export const selectOfferedSearchResults = createSelector([selectSearchResults], (results) =>
  results.filter((skill) => skill.isOffered)
);

export const selectWantedSearchResults = createSelector([selectSearchResults], (results) =>
  results.filter((skill) => !skill.isOffered)
);

export const selectSearchResultsSorted = createSelector(
  [
    selectSearchResults,
    (
      _: RootState,
      sortBy:
        | 'relevance'
        | 'popularity'
        | 'rating'
        | 'createdAt'
        | 'updatedAt'
        | 'name'
        | 'category'
        | 'proficiencyLevel'
    ) => sortBy,
  ],
  (results, sortBy) => {
    const sorted = [...results];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'category':
        return sorted.sort((a, b) => a.category.name.localeCompare(b.category.name));
      case 'proficiencyLevel':
        return sorted.sort((a, b) =>
          a.proficiencyLevel.level.localeCompare(b.proficiencyLevel.level)
        );
      case 'createdAt':
        return sorted.sort(
          (a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()
        );
      case 'updatedAt':
        return sorted.sort(
          (a, b) =>
            new Date(b.lastActiveAt ?? '').getTime() - new Date(a.lastActiveAt ?? '').getTime()
        );
      case 'relevance':
        // For relevance, maintain original order (already sorted by backend)
        return sorted;
      case 'popularity':
        return sorted.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
      default:
        return sorted;
    }
  }
);

// Combined search results
export const selectAllSearchResults = createSelector(
  [selectSearchResults, selectUserSearchResults],
  (searchResults, userResults) => [...searchResults, ...userResults]
);

export const selectUniqueSearchResults = createSelector([selectAllSearchResults], (allResults) => {
  const uniqueResults = new Map<string, Skill>();
  allResults.forEach((skill) => {
    if (!uniqueResults.has(skill.id)) {
      uniqueResults.set(skill.id, skill);
    }
  });
  return Array.from(uniqueResults.values());
});

// Search statistics
export const selectSearchStatistics = createSelector(
  [selectSearchResults, selectUserSearchResults, selectSearchAllSkills],
  (searchResults, userResults, allSkills) => ({
    searchResultsCount: searchResults.length,
    userResultsCount: userResults.length,
    totalResultsCount: searchResults.length + userResults.length,
    allSkillsCount: allSkills.length,
    offeredCount: searchResults.filter((s) => s.isOffered).length,
    wantedCount: searchResults.filter((s) => !s.isOffered).length,
  })
);

// Category distribution in search results
export const selectSearchResultsByCategories = createSelector([selectSearchResults], (results) => {
  const categoryGroups: Record<string, typeof results> = {};

  results.forEach((skill) => {
    const categoryId = skill.category.id;
    categoryGroups[categoryId] ??= [];
    categoryGroups[categoryId].push(skill);
  });

  return categoryGroups;
});

// Popular categories from search results
export const selectPopularCategoriesFromSearch = createSelector(
  [selectSearchResultsByCategories],
  (categoryGroups) =>
    Object.entries(categoryGroups)
      .map(([categoryId, skills]) => ({
        categoryId,
        categoryName: skills[0]?.category.name || 'Unknown',
        count: skills.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
);

// Proficiency level distribution
export const selectProficiencyLevelDistribution = createSelector(
  [selectSearchResults],
  (results) => {
    const levelGroups: Record<string, number> = {};

    results.forEach((skill) => {
      const { level } = skill.proficiencyLevel;
      levelGroups[level] = (levelGroups[level] || 0) + 1;
    });

    return Object.entries(levelGroups)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);
  }
);

// Search recommendations based on current results
export const selectSearchRecommendations = createSelector(
  [selectSearchResults, selectSearchAllSkills],
  (searchResults, allSkills) => {
    if (searchResults.length === 0) return [];

    // Get categories from search results
    const searchCategories = new Set(searchResults.map((skill) => skill.category.id));

    // Find other skills in the same categories
    const recommendations = allSkills
      .filter(
        (skill) =>
          searchCategories.has(skill.category.id) &&
          !searchResults.some((result) => result.id === skill.id)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);

    return recommendations;
  }
);

// Check if we have more pages to load
export const selectCanLoadMoreSearchResults = createSelector(
  [selectSearchPagination],
  (pagination) => pagination.page < pagination.totalPages
);

export const selectCanLoadMoreUserResults = createSelector(
  [selectUserSearchPagination],
  (pagination) => pagination.page < pagination.totalPages
);

export const selectCanLoadMoreAllSkills = createSelector(
  [selectSearchAllSkillsPagination],
  (pagination) => pagination.page < pagination.totalPages
);

// Search query analysis
export const selectSearchQueryInfo = createSelector(
  [selectCurrentQuery, selectLastSearchParams],
  (query, lastParams) => ({
    query: query.trim(),
    hasQuery: query.trim().length > 0,
    queryLength: query.trim().length,
    lastParams,
    hasFilters: !!(lastParams?.categoryId ?? lastParams?.proficiencyLevelId),
  })
);
