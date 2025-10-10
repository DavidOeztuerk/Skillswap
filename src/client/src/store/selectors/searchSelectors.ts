import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Search Selectors
 * Centralized selectors for search state and entity operations
 */

// Base selectors
export const selectSearchState = (state: RootState) => state.search;
export const selectSearchLoading = (state: RootState) => state.search.isLoading;
export const selectSearchError = (state: RootState) => state.search.errorMessage;
export const selectUserSearchLoading = (state: RootState) => state.search.userLoading;
export const selectAllSkillsLoading = (state: RootState) => state.search.allSkillsLoading;

// Entity selectors - use results array directly
export const selectAllSearchSkills = createSelector(
  [selectSearchState],
  (searchState) => searchState.results || []
);

export const selectSearchSkillById = createSelector(
  [selectAllSearchSkills, (_: RootState, skillId: string) => skillId],
  (skills, skillId) => skills.find(skill => skill.id === skillId) || null
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
  (results, categoryId) => results.filter(skill => skill.category.id === categoryId)
);

export const selectSearchResultsByProficiencyLevel = createSelector(
  [selectSearchResults, (_: RootState, levelId: string) => levelId],
  (results, levelId) => results.filter(skill => skill.proficiencyLevel.id === levelId)
);

export const selectOfferedSearchResults = createSelector(
  [selectSearchResults],
  (results) => results.filter(skill => skill.isOffered)
);

export const selectWantedSearchResults = createSelector(
  [selectSearchResults],
  (results) => results.filter(skill => !skill.isOffered)
);

export const selectSearchResultsSorted = createSelector(
  [selectSearchResults, (_: RootState, sortBy: 'relevance' | 'popularity' | 'rating' | 'createdAt' | 'updatedAt' | 'name' | 'category' | 'proficiencyLevel') => sortBy],
  (results, sortBy) => {
    const sorted = [...results];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a: any, b: any) => a.name.localeCompare(b.name));
      case 'category':
        return sorted.sort((a: any, b: any) => a.category.name.localeCompare(b.category.name));
      case 'proficiencyLevel':
        return sorted.sort((a: any, b: any) => a.proficiencyLevel.level.localeCompare(b.proficiencyLevel.level));
      case 'createdAt':
        return sorted.sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      case 'updatedAt':
        return sorted.sort((a: any, b: any) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime());
      case 'relevance':
        return sorted.sort((a: any, b: any) => new Date(b.relevance || '').getTime() - new Date(a.relevance || '').getTime());
      case 'popularity':
        return sorted.sort((a: any, b: any) => new Date(b.popularity || '').getTime() - new Date(a.popularity || '').getTime());
      case 'rating':
        return sorted.sort((a: any, b: any) => new Date(b.rating || '').getTime() - new Date(a.rating || '').getTime());
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

export const selectUniqueSearchResults = createSelector(
  [selectAllSearchResults],
  (allResults) => {
    const uniqueResults = new Map();
    allResults.forEach(skill => {
      if (!uniqueResults.has(skill.id)) {
        uniqueResults.set(skill.id, skill);
      }
    });
    return Array.from(uniqueResults.values());
  }
);

// Search statistics
export const selectSearchStatistics = createSelector(
  [selectSearchResults, selectUserSearchResults, selectSearchAllSkills],
  (searchResults, userResults, allSkills) => ({
    searchResultsCount: searchResults.length,
    userResultsCount: userResults.length,
    totalResultsCount: searchResults.length + userResults.length,
    allSkillsCount: allSkills.length,
    offeredCount: searchResults.filter((s: any) => s.isOffered).length,
    wantedCount: searchResults.filter((s: any) => !s.isOffered).length
  })
);

// Category distribution in search results
export const selectSearchResultsByCategories = createSelector(
  [selectSearchResults],
  (results) => {
    const categoryGroups: Record<string, typeof results> = {};
    
    results.forEach(skill => {
      const categoryId = skill.category.id;
      if (!categoryGroups[categoryId]) {
        categoryGroups[categoryId] = [];
      }
      categoryGroups[categoryId].push(skill);
    });
    
    return categoryGroups;
  }
);

// Popular categories from search results
export const selectPopularCategoriesFromSearch = createSelector(
  [selectSearchResultsByCategories],
  (categoryGroups) => {
    return Object.entries(categoryGroups)
      .map(([categoryId, skills]) => ({
        categoryId,
        categoryName: skills[0]?.category.name || 'Unknown',
        count: skills.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
);

// Proficiency level distribution
export const selectProficiencyLevelDistribution = createSelector(
  [selectSearchResults],
  (results) => {
    const levelGroups: Record<string, number> = {};
    
    results.forEach(skill => {
      const level = skill.proficiencyLevel.level;
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
    const searchCategories = new Set(searchResults.map((skill: any) => skill.category.id));
    
    // Find other skills in the same categories
    const recommendations = allSkills
      .filter((skill: any) => 
        searchCategories.has(skill.category.id) && 
        !searchResults.some((result: any) => result.id === skill.id)
      )
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
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
    hasFilters: !!(lastParams?.categoryId || lastParams?.proficiencyLevelId || lastParams?.isOffered !== undefined)
  })
);