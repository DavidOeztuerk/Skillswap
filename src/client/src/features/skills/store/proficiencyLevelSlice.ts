import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { withDefault, isDefined } from '../../../shared/utils/safeAccess';
import { initialProficiencyLevelState } from './proficiencyLevelAdapter+State';
import {
  fetchProficiencyLevels,
  createProficiencyLevel,
  updateProficiencyLevel,
  deleteProficiencyLevel,
} from './thunks/proficiencyLevelThunks';
import type { ProficiencyLevelResponse } from '../types/CreateSkillResponse';
import type { ProficiencyLevel } from '../types/Skill';

const proficiencyLevelsSlice = createSlice({
  name: 'proficiencyLevels',
  initialState: initialProficiencyLevelState,
  reducers: {
    clearError: (state) => {
      state.errorMessage = undefined;
    },

    setSelectedProficiencyLevel: (state, action: PayloadAction<ProficiencyLevel | null>) => {
      state.selectedProficiencyLevel = action.payload;
    },

    clearSelectedProficiencyLevel: (state) => {
      state.selectedProficiencyLevel = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    addProficiencyLevel: (state, action: PayloadAction<ProficiencyLevel>) => {
      const existingIndex = state.proficiencyLevels.findIndex(
        (level) => level.id === action.payload.id
      );
      if (existingIndex === -1) {
        state.proficiencyLevels.push(action.payload);
        // Sort by rank
        state.proficiencyLevels.sort((a, b) => withDefault(a.rank, 0) - withDefault(b.rank, 0));
      } else {
        state.proficiencyLevels[existingIndex] = action.payload;
      }
    },

    removeProficiencyLevel: (state, action: PayloadAction<string>) => {
      state.proficiencyLevels = state.proficiencyLevels.filter(
        (level) => level.id !== action.payload
      );
      if (state.selectedProficiencyLevel?.id === action.payload) {
        state.selectedProficiencyLevel = null;
      }
    },

    updateProficiencyLevelInState: (state, action: PayloadAction<ProficiencyLevel>) => {
      const updatedLevel = action.payload;
      const index = state.proficiencyLevels.findIndex((level) => level.id === updatedLevel.id);
      if (index !== -1) {
        state.proficiencyLevels[index] = updatedLevel;
        // Re-sort after updating
        state.proficiencyLevels.sort((a, b) => withDefault(a.rank, 0) - withDefault(b.rank, 0));
      }

      if (state.selectedProficiencyLevel?.id === updatedLevel.id) {
        state.selectedProficiencyLevel = updatedLevel;
      }
    },

    clearAllProficiencyLevels: (state) => {
      state.proficiencyLevels = [];
      state.selectedProficiencyLevel = null;
    },

    setError: (state, action: PayloadAction<{ message?: string }>) => {
      state.errorMessage = action.payload.message;
    },

    // Optimistic updates
    createProficiencyLevelOptimistic: (state, action: PayloadAction<ProficiencyLevel>) => {
      state.proficiencyLevels.push(action.payload);
      state.proficiencyLevels.sort((a, b) => withDefault(a.rank, 0) - withDefault(b.rank, 0));
    },

    updateProficiencyLevelOptimistic: (state, action: PayloadAction<ProficiencyLevel>) => {
      const index = state.proficiencyLevels.findIndex((level) => level.id === action.payload.id);
      if (index !== -1) {
        state.proficiencyLevels[index] = action.payload;
        state.proficiencyLevels.sort((a, b) => withDefault(a.rank, 0) - withDefault(b.rank, 0));
      }
      if (state.selectedProficiencyLevel?.id === action.payload.id) {
        state.selectedProficiencyLevel = action.payload;
      }
    },

    deleteProficiencyLevelOptimistic: (state, action: PayloadAction<string>) => {
      state.proficiencyLevels = state.proficiencyLevels.filter(
        (level) => level.id !== action.payload
      );
      if (state.selectedProficiencyLevel?.id === action.payload) {
        state.selectedProficiencyLevel = null;
      }
    },

    // Rollback actions
    setProficiencyLevels: (state, action: PayloadAction<ProficiencyLevel[]>) => {
      state.proficiencyLevels = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch proficiency levels cases
      .addCase(fetchProficiencyLevels.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchProficiencyLevels.fulfilled, (state, action) => {
        state.isLoading = false;
        // Null-safe access to API response
        const mapSkillResponseToSkill = (response: ProficiencyLevelResponse): ProficiencyLevel => ({
          id: response.levelId,
          level: response.level,
          rank: response.rank,
          color: response.color,
          skillCount: response.skillCount,
        });
        if (isDefined(action.payload.data)) {
          state.proficiencyLevels = action.payload.data.map((x) => mapSkillResponseToSkill(x));
        } else {
          state.proficiencyLevels = [];
        }

        // Sort proficiency levels by rank
        state.proficiencyLevels.sort((a, b) => withDefault(a.rank, 0) - withDefault(b.rank, 0));

        state.errorMessage = undefined;
      })
      .addCase(fetchProficiencyLevels.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch proficiency levels';
        state.proficiencyLevels = [];
      })

      // Create proficiency level cases
      .addCase(createProficiencyLevel.pending, (state) => {
        state.isCreating = true;
        state.errorMessage = undefined;
      })
      .addCase(createProficiencyLevel.fulfilled, (state, action) => {
        state.isCreating = false;
        const levelData = action.payload.data;
        if (isDefined(levelData)) {
          state.proficiencyLevels.push(levelData);
          // Re-sort after adding
          state.proficiencyLevels.sort((a, b) => withDefault(a.rank, 0) - withDefault(b.rank, 0));
        }
        state.errorMessage = undefined;
      })
      .addCase(createProficiencyLevel.rejected, (state, action) => {
        state.isCreating = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to create proficiency level';
      })

      // Update proficiency level cases
      .addCase(updateProficiencyLevel.pending, (state) => {
        state.isUpdating = true;
        state.errorMessage = undefined;
      })
      .addCase(updateProficiencyLevel.fulfilled, (state, action) => {
        state.isUpdating = false;
        const levelData = action.payload.data;
        if (isDefined(levelData)) {
          const index = state.proficiencyLevels.findIndex((level) => level.id === levelData.id);
          if (index !== -1) {
            state.proficiencyLevels[index] = levelData;
            // Re-sort after updating
            state.proficiencyLevels.sort((a, b) => withDefault(a.rank, 0) - withDefault(b.rank, 0));
          }

          if (state.selectedProficiencyLevel?.id === levelData.id) {
            state.selectedProficiencyLevel = levelData;
          }
        }
        state.errorMessage = undefined;
      })
      .addCase(updateProficiencyLevel.rejected, (state, action) => {
        state.isUpdating = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to update proficiency level';
      })

      // Delete proficiency level cases
      .addCase(deleteProficiencyLevel.pending, (state) => {
        state.isDeleting = true;
        state.errorMessage = undefined;
      })
      .addCase(deleteProficiencyLevel.fulfilled, (state) => {
        state.isDeleting = false;
        state.selectedProficiencyLevel = null;
        state.errorMessage = undefined;
      })
      .addCase(deleteProficiencyLevel.rejected, (state, action) => {
        state.isDeleting = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to delete proficiency level';
      });
  },
});

// Export actions
export const {
  clearError,
  setSelectedProficiencyLevel,
  clearSelectedProficiencyLevel,
  setLoading,
  addProficiencyLevel,
  removeProficiencyLevel,
  updateProficiencyLevelInState,
  clearAllProficiencyLevels,
  setError,
  createProficiencyLevelOptimistic,
  updateProficiencyLevelOptimistic,
  deleteProficiencyLevelOptimistic,
  setProficiencyLevels,
} = proficiencyLevelsSlice.actions;

export default proficiencyLevelsSlice.reducer;
