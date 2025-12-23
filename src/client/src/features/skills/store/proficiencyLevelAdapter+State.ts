import { createEntityAdapter, type EntityState, type EntityId } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { ProficiencyLevel } from '../types/Skill';

export const proficiencyLevelAdapter = createEntityAdapter<ProficiencyLevel, EntityId>({
  selectId: (level) => level.id,
  sortComparer: (a, b) => a.level.localeCompare(b.level),
});

export interface ProficiencyLevelEntityState
  extends EntityState<ProficiencyLevel, EntityId>, RequestState {
  proficiencyLevels: ProficiencyLevel[];
  selectedProficiencyLevel: ProficiencyLevel | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const initialProficiencyLevelState: ProficiencyLevelEntityState =
  proficiencyLevelAdapter.getInitialState({
    proficiencyLevels: [],
    selectedProficiencyLevel: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    errorMessage: undefined,
  });

export const proficiencyLevelSelectors = proficiencyLevelAdapter.getSelectors();
