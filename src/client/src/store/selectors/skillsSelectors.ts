import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { skillsAdapter, type SkillsEntityState } from '../adapters/skillsAdapter+State';

/**
 * Skills Selectors
 * Centralized selectors for skills state and entity operations
 */

// Base selectors
export const selectSkillsState = (state: RootState): SkillsEntityState => state.skills;
export const selectSkillsLoading = (state: RootState): boolean => state.skills.isLoading;
export const selectSkillsError = (state: RootState): string | undefined =>
  state.skills.errorMessage;

// EntityAdapter selectors
const adapterSelectors = skillsAdapter.getSelectors<RootState>((state) => state.skills);

// Export EntityAdapter's built-in selectors
export const {
  selectAll: selectAllSkillsFromEntities,
  selectById: selectSkillByIdFromEntities,
  selectIds: selectSkillIds,
  selectEntities: selectSkillEntities,
} = adapterSelectors;

// Collection-specific selectors using ID arrays
export const selectAllSkills = createSelector(
  [selectSkillEntities, (state: RootState) => state.skills.allSkillIds],
  (entities, allSkillIds) => allSkillIds.map((id) => entities[id]).filter(Boolean)
);

export const selectUserSkills = createSelector(
  [selectSkillEntities, (state: RootState) => state.skills.userSkillIds],
  (entities, userSkillIds) => userSkillIds.map((id) => entities[id]).filter(Boolean)
);

export const selectSkillById = createSelector(
  [selectSkillEntities, (_: RootState, skillId: string) => skillId],
  (entities, skillId) => entities[skillId] ?? null
);

export const selectSelectedSkillId = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.selectedSkillId
);

export const selectSelectedSkill = createSelector(
  [selectSkillsState, selectSkillEntities, selectAllSkills, selectUserSkills],
  (skillsState, entities, allSkills, userSkills) => {
    if (skillsState.selectedSkillId === null) return null;

    // First check in allSkills and userSkills (from ID arrays)
    const fromLists = [...allSkills, ...userSkills].find(
      (skill) => skill.id === skillsState.selectedSkillId
    );
    if (fromLists) return fromLists;

    // Fallback: check directly in entities (for skills loaded via fetchSkillById)
    // This handles the case when navigating directly to /skills/:skillId
    return entities[skillsState.selectedSkillId] ?? null;
  }
);

// Search selectors
export const selectSearchQuery = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.searchQuery
);

export const selectIsSearchActive = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.isSearchActive
);

export const selectSkillSearchResults = createSelector(
  [selectSkillsState, selectAllSkills],
  (skillsState, allSkills) =>
    skillsState.searchResults
      .map((id) => allSkills.find((skill) => skill.id === id))
      .filter(Boolean)
);

// Favorite skills
export const selectFavoriteSkillIds = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.favoriteSkillIds
);

export const selectFavoriteSkills = createSelector(
  [selectAllSkills, selectFavoriteSkillIds],
  (allSkills, favoriteIds) => allSkills.filter((skill) => favoriteIds.includes(skill.id))
);

export const selectIsSkillFavorite = createSelector(
  [selectFavoriteSkillIds],
  (favoriteIds) =>
    (skillId: string): boolean =>
      favoriteIds.includes(skillId)
);

// Filtered and computed selectors
export const selectSkillsByCategory = createSelector(
  [selectAllSkills, (_: RootState, categoryId: string) => categoryId],
  (skills, categoryId) => skills.filter((skill) => skill.category.id === categoryId)
);

export const selectFilteredSkills = createSelector(
  [selectAllSkills, selectSearchQuery],
  (skills, searchQuery) => {
    if (!searchQuery.trim()) return skills;

    const query = searchQuery.toLowerCase();
    return skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.category.name.toLowerCase().includes(query)
    );
  }
);

export const selectSkillsByProficiencyLevel = createSelector(
  [selectAllSkills, (_: RootState, levelId: string) => levelId],
  (skills, levelId) => skills.filter((skill) => skill.proficiencyLevel.id === levelId)
);

export const selectOfferedSkills = createSelector([selectAllSkills], (skills) =>
  skills.filter((skill) => skill.isOffered)
);

export const selectWantedSkills = createSelector([selectAllSkills], (skills) =>
  skills.filter((skill) => !skill.isOffered)
);

// Statistics and analytics
export const selectSkillsStatistics = createSelector(
  [selectAllSkills, selectUserSkills, selectFavoriteSkills],
  (allSkills, userSkills, favoriteSkills) => ({
    totalSkills: allSkills.length,
    userSkillsCount: userSkills.length,
    favoriteSkillsCount: favoriteSkills.length,
    offeredSkillsCount: allSkills.filter((skill) => skill.isOffered).length,
    wantedSkillsCount: allSkills.filter((skill) => !skill.isOffered).length,
  })
);

export const selectPopularTags = createSelector([selectAllSkills], (skills) => {
  const tagCounts: Record<string, number> = {};

  skills.forEach((skill) => {
    const tags = skill.tagsJson
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

// Pagination selectors
export const selectAllSkillsPagination = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.allSkillsPagination
);

export const selectUserSkillsPagination = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.userSkillsPagination
);

export const selectSkillSearchResultsPagination = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.searchResultsPagination
);

// Recommendations and additional data
export const selectSkillRecommendations = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.recommendations
);

export const selectSkillStatistics = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.statistics
);

export const selectPopularTagsFromState = createSelector(
  [selectSkillsState],
  (skillsState) => skillsState.popularTags
);

/**
 * Select top 6 featured skills for homepage display
 * Sort by averageRating (descending), fallback to createdAt (newest first)
 */
export const selectFeaturedSkills = createSelector([selectAllSkills], (skills) =>
  [...skills]
    .sort((a, b) => {
      // Primary: Sort by rating (descending) - higher ratings first
      const ratingA = a.averageRating ?? 0;
      const ratingB = b.averageRating ?? 0;
      if (ratingA !== ratingB) return ratingB - ratingA;

      // Fallback: Sort by createdAt (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 6)
);
