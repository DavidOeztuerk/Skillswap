import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Proficiency Level Selectors
 * Centralized selectors for proficiency levels state and entity operations
 */

// Base selectors
export const selectProficiencyLevelState = (state: RootState) => state.proficiencyLevel;
export const selectProficiencyLevelsLoading = (state: RootState) => state.proficiencyLevel.isLoading;
export const selectProficiencyLevelsError = (state: RootState) => state.proficiencyLevel.errorMessage;
export const selectIsProficiencyLevelCreating = (state: RootState) => state.proficiencyLevel.isCreating;
export const selectIsProficiencyLevelUpdating = (state: RootState) => state.proficiencyLevel.isUpdating;
export const selectIsProficiencyLevelDeleting = (state: RootState) => state.proficiencyLevel.isDeleting;

// Entity selectors using the normalized structure
export const selectAllProficiencyLevels = createSelector(
  [selectProficiencyLevelState],
  (proficiencyLevelState) => Object.values(proficiencyLevelState.entities).filter(Boolean)
);

export const selectProficiencyLevelById = createSelector(
  [selectProficiencyLevelState, (_: RootState, levelId: string) => levelId],
  (proficiencyLevelState, levelId) => 
    proficiencyLevelState.entities[levelId] || null
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
export const selectBeginnerLevels = createSelector(
  [selectAllProficiencyLevels],
  (levels) => levels.filter(level => 
    level.level.toLowerCase().includes('beginner') || 
    level.level.toLowerCase().includes('novice'))
);

export const selectIntermediateLevels = createSelector(
  [selectAllProficiencyLevels],
  (levels) => levels.filter(level => 
    level.level.toLowerCase().includes('intermediate') ||
    level.level.toLowerCase().includes('medium')
  )
);

export const selectAdvancedLevels = createSelector(
  [selectAllProficiencyLevels],
  (levels) => levels.filter(level => 
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
    return levels.filter(level => 
      level.level.toLowerCase().includes(term)
    );
  }
);

// Get level by rank
export const selectProficiencyLevelByRank = createSelector(
  [selectAllProficiencyLevels, (_: RootState, rank: number) => rank],
  (levels, rank) => levels.find(level => level.rank === rank) || null
);

// Level progression selectors
export const selectNextProficiencyLevel = createSelector(
  [selectAllProficiencyLevels, (_: RootState, currentLevelId: string) => currentLevelId],
  (levels, currentLevelId) => {
    const currentLevel = levels.find(l => l.id === currentLevelId);
    if (!currentLevel || currentLevel.rank === undefined) return null;
    
    return levels
      .filter(l => (l.rank || 0) > currentLevel.rank!)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0))[0] || null;
  }
);

export const selectPreviousProficiencyLevel = createSelector(
  [selectAllProficiencyLevels, (_: RootState, currentLevelId: string) => currentLevelId],
  (levels, currentLevelId) => {
    const currentLevel = levels.find(l => l.id === currentLevelId);
    if (!currentLevel || currentLevel.rank === undefined) return null;
    
    return levels
      .filter(l => (l.rank || 0) < currentLevel.rank!)
      .sort((a, b) => (b.rank || 0) - (a.rank || 0))[0] || null;
  }
);

// Level range selectors
export const selectProficiencyLevelsInRange = createSelector(
  [selectAllProficiencyLevels, (_: RootState, minRank: number, maxRank: number) => ({ minRank, maxRank })],
  (levels, { minRank, maxRank }) => 
    levels.filter(level => 
      (level.rank || 0) >= minRank && (level.rank || 0) <= maxRank
    ).sort((a, b) => (a.rank || 0) - (b.rank || 0))
);

// Statistics selectors
export const selectProficiencyLevelStatistics = createSelector(
  [
    selectAllProficiencyLevels,
    selectBeginnerLevels,
    selectIntermediateLevels,
    selectAdvancedLevels
  ],
  (allLevels, beginnerLevels, intermediateLevels, advancedLevels) => ({
    total: allLevels.length,
    beginner: beginnerLevels.length,
    intermediate: intermediateLevels.length,
    advanced: advancedLevels.length,
    averageRank: allLevels.length > 0 
      ? Math.round(allLevels.reduce((sum: number, level) => sum + (level.rank || 0), 0) / allLevels.length)
      : 0
  })
);

// Level validation selectors
export const selectIsValidLevelProgression = createSelector(
  [selectAllProficiencyLevels],
  (levels) => (fromLevelId: string, toLevelId: string): boolean => {
    const fromLevel = levels.find(l => l.id === fromLevelId);
    const toLevel = levels.find(l => l.id === toLevelId);
    
    if (!fromLevel || !toLevel || fromLevel.rank === undefined || toLevel.rank === undefined) {
      return false;
    }
    
    return toLevel.rank > fromLevel.rank;
  }
);

// Get levels for dropdown/selection
export const selectProficiencyLevelsForSelection = createSelector(
  [selectAllProficiencyLevels],
  (allLevels) => allLevels
    .sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0))
    .map((level: any) => ({
      value: level.id,
      label: level.level,
      description: level.description,
      rank: level.rank
    }))
);