import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ProficiencyLevelEntityState } from '../adapters/proficiencyLevelAdapter+State';

/**
 * Proficiency Level Selectors
 * Centralized selectors for proficiency levels state and entity operations
 */

// Base selectors
export const selectProficiencyLevelState = (state: RootState): ProficiencyLevelEntityState =>
  state.proficiencyLevel;
export const selectProficiencyLevelsLoading = (state: RootState): boolean =>
  state.proficiencyLevel.isLoading;
export const selectProficiencyLevelsError = (state: RootState): string | undefined =>
  state.proficiencyLevel.errorMessage;
export const selectIsProficiencyLevelCreating = (state: RootState): boolean =>
  state.proficiencyLevel.isCreating;
export const selectIsProficiencyLevelUpdating = (state: RootState): boolean =>
  state.proficiencyLevel.isUpdating;
export const selectIsProficiencyLevelDeleting = (state: RootState): boolean =>
  state.proficiencyLevel.isDeleting;

// Entity selectors - use proficiencyLevels array directly
export const selectAllProficiencyLevels = createSelector(
  [selectProficiencyLevelState],
  (proficiencyLevelState) => proficiencyLevelState.proficiencyLevels
);

export const selectProficiencyLevelById = createSelector(
  [selectProficiencyLevelState, (_: RootState, levelId: string) => levelId],
  (proficiencyLevelState, levelId) => proficiencyLevelState.entities[levelId] ?? null
);

// Direct array selectors
export const selectProficiencyLevels = createSelector(
  [selectProficiencyLevelState],
  (proficiencyLevelState) => proficiencyLevelState.proficiencyLevels
);

export const selectSelectedProficiencyLevel = createSelector(
  [selectProficiencyLevelState],
  (proficiencyLevelState) => proficiencyLevelState.selectedProficiencyLevel
);

// Computed selectors
export const selectProficiencyLevelsSortedByLevel = createSelector(
  [selectAllProficiencyLevels],
  (levels) => [...levels].sort((a, b) => a.level.localeCompare(b.level))
);

// Level hierarchy selectors
export const selectBeginnerLevels = createSelector([selectAllProficiencyLevels], (levels) =>
  levels.filter(
    (level) =>
      level.level.toLowerCase().includes('beginner') || level.level.toLowerCase().includes('novice')
  )
);

export const selectIntermediateLevels = createSelector([selectAllProficiencyLevels], (levels) =>
  levels.filter(
    (level) =>
      level.level.toLowerCase().includes('intermediate') ||
      level.level.toLowerCase().includes('medium')
  )
);

export const selectAdvancedLevels = createSelector([selectAllProficiencyLevels], (levels) =>
  levels.filter(
    (level) =>
      level.level.toLowerCase().includes('advanced') ||
      level.level.toLowerCase().includes('expert') ||
      level.level.toLowerCase().includes('master')
  )
);

// Find level by name/pattern
export const selectProficiencyLevelsByName = createSelector(
  [selectAllProficiencyLevels, (_: RootState, searchTerm: string) => searchTerm],
  (levels, searchTerm) => {
    if (!searchTerm.trim()) return levels;

    const term = searchTerm.toLowerCase();
    return levels.filter((level) => level.level.toLowerCase().includes(term));
  }
);

// Get level by rank
export const selectProficiencyLevelByRank = createSelector(
  [selectAllProficiencyLevels, (_: RootState, rank: number) => rank],
  (levels, rank) => levels.find((level) => level.rank === rank) ?? null
);

// Level progression selectors
export const selectNextProficiencyLevel = createSelector(
  [selectAllProficiencyLevels, (_: RootState, currentLevelId: string) => currentLevelId],
  (levels, currentLevelId) => {
    const currentLevel = levels.find((l) => l.id === currentLevelId);
    if (currentLevel?.rank === undefined) return null;

    const currentRank = currentLevel.rank;
    return levels.filter((l) => l.rank > currentRank).sort((a, b) => a.rank - b.rank)[0] ?? null;
  }
);

export const selectPreviousProficiencyLevel = createSelector(
  [selectAllProficiencyLevels, (_: RootState, currentLevelId: string) => currentLevelId],
  (levels, currentLevelId) => {
    const currentLevel = levels.find((l) => l.id === currentLevelId);
    if (currentLevel?.rank === undefined) return null;

    const currentRank = currentLevel.rank;
    return levels.filter((l) => l.rank < currentRank).sort((a, b) => b.rank - a.rank)[0] ?? null;
  }
);

// Level range selectors
export const selectProficiencyLevelsInRange = createSelector(
  [
    selectAllProficiencyLevels,
    (_: RootState, minRank: number, maxRank: number) => ({ minRank, maxRank }),
  ],
  (levels, { minRank, maxRank }) =>
    levels
      .filter((level) => level.rank >= minRank && level.rank <= maxRank)
      .sort((a, b) => a.rank - b.rank)
);

// Statistics selectors
export const selectProficiencyLevelStatistics = createSelector(
  [
    selectAllProficiencyLevels,
    selectBeginnerLevels,
    selectIntermediateLevels,
    selectAdvancedLevels,
  ],
  (allLevels, beginnerLevels, intermediateLevels, advancedLevels) => ({
    total: allLevels.length,
    beginner: beginnerLevels.length,
    intermediate: intermediateLevels.length,
    advanced: advancedLevels.length,
    averageRank:
      allLevels.length > 0
        ? Math.round(
            allLevels.reduce((sum: number, level) => sum + level.rank, 0) / allLevels.length
          )
        : 0,
  })
);

// Level validation selectors
export const selectIsValidLevelProgression = createSelector(
  [selectAllProficiencyLevels],
  (levels) =>
    (fromLevelId: string, toLevelId: string): boolean => {
      const fromLevel = levels.find((l) => l.id === fromLevelId);
      const toLevel = levels.find((l) => l.id === toLevelId);

      if (!fromLevel || !toLevel) {
        return false;
      }

      return toLevel.rank > fromLevel.rank;
    }
);

// Get levels for dropdown/selection
export const selectProficiencyLevelsForSelection = createSelector(
  [selectAllProficiencyLevels],
  (allLevels) =>
    [...allLevels]
      .sort((a, b) => a.rank - b.rank)
      .map((level) => ({
        value: level.id,
        label: level.level,
        rank: level.rank,
      }))
);
