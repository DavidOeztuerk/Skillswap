// src/features/proficiencyLevels/proficiencyLevelsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProficiencyLevel } from '../../types/models/Skill';
import skillService from '../../api/services/skillsService';
import { ProficiencyLevelsState } from '../../types/states/SkillState';
import { SliceError } from '../../store/types';

const initialState: ProficiencyLevelsState = {
  proficiencyLevels: [],
  selectedProficiencyLevel: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

/**
 * Async thunks for proficiency levels operations
 */

// Fetch proficiency levels
export const fetchProficiencyLevels = createAsyncThunk(
  'proficiencyLevels/fetchProficiencyLevels',
  async () => {
    return await skillService.getProficiencyLevels();;
  }
);

// Create proficiency level (Admin)
export const createProficiencyLevel = createAsyncThunk(
  'proficiencyLevels/createProficiencyLevel',
  async ({level, rank, description}: { level: string; rank: number; description?: string }) => {
    return await skillService.createProficiencyLevel(level,rank, description)
  }
);

// Update proficiency level (Admin)
export const updateProficiencyLevel = createAsyncThunk(
  'proficiencyLevels/updateProficiencyLevel',
  async ({id, level, rank, description}: { id: string; level: string; rank: number; description?: string }) => {
    return await skillService.updateProficiencyLevel(id, level, rank, description)
  }
);

// Delete proficiency level (Admin)
export const deleteProficiencyLevel = createAsyncThunk(
  'proficiencyLevels/deleteProficiencyLevel',
  async (id: string) => {
    return skillService.deleteProficiencyLevel(id)
  }
);

/**
 * Proficiency Levels Slice
 */
const proficiencyLevelsSlice = createSlice({
  name: 'proficiencyLevels',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setSelectedProficiencyLevel: (
      state,
      action: PayloadAction<ProficiencyLevel | null>
    ) => {
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
        (level) => level.levelId === action.payload.levelId
      );
      if (existingIndex === -1) {
        state.proficiencyLevels.push(action.payload);
        // Sort by rank
        state.proficiencyLevels.sort((a, b) => (a.rank || 0) - (b.rank || 0));
      } else {
        state.proficiencyLevels[existingIndex] = action.payload;
      }
    },

    removeProficiencyLevel: (state, action: PayloadAction<string>) => {
      state.proficiencyLevels = state.proficiencyLevels.filter(
        (level) => level.levelId !== action.payload
      );
      if (state.selectedProficiencyLevel?.levelId === action.payload) {
        state.selectedProficiencyLevel = null;
      }
    },

    updateProficiencyLevelInState: (
      state,
      action: PayloadAction<ProficiencyLevel>
    ) => {
      const updatedLevel = action.payload;
      const index = state.proficiencyLevels.findIndex(
        (level) => level.levelId === updatedLevel.levelId
      );
      if (index !== -1) {
        state.proficiencyLevels[index] = updatedLevel;
        // Re-sort after updating
        state.proficiencyLevels.sort((a, b) => (a.rank || 0) - (b.rank || 0));
      }

      if (state.selectedProficiencyLevel?.levelId === updatedLevel.levelId) {
        state.selectedProficiencyLevel = updatedLevel;
      }
    },

    clearAllProficiencyLevels: (state) => {
      state.proficiencyLevels = [];
      state.selectedProficiencyLevel = null;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    resetState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch proficiency levels cases
      .addCase(fetchProficiencyLevels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProficiencyLevels.fulfilled, (state, action) => {
        state.isLoading = false;
        // Null-safe access to API response
        state.proficiencyLevels = action.payload || [];

        // Sort proficiency levels by rank
        state.proficiencyLevels.sort((a, b) => (a.rank || 0) - (b.rank || 0));

        state.error = null;
      })
      .addCase(fetchProficiencyLevels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.proficiencyLevels = [];
      })

      // Create proficiency level cases
      .addCase(createProficiencyLevel.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createProficiencyLevel.fulfilled, (state, action) => {
        state.isCreating = false;
        if (action.payload) {
          state.proficiencyLevels.push(action.payload);
          // Re-sort after adding
          state.proficiencyLevels.sort((a, b) => (a.rank || 0) - (b.rank || 0));
        }
        state.error = null;
      })
      .addCase(createProficiencyLevel.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error as SliceError;
      })

      // Update proficiency level cases
      .addCase(updateProficiencyLevel.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateProficiencyLevel.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (action.payload) {
          const index = state.proficiencyLevels.findIndex(
            (level) => level.levelId === action.payload.levelId
          );
          if (index !== -1) {
            state.proficiencyLevels[index] = action.payload;
            // Re-sort after updating
            state.proficiencyLevels.sort(
              (a, b) => (a.rank || 0) - (b.rank || 0)
            );
          }

          if (
            state.selectedProficiencyLevel?.levelId === action.payload.levelId
          ) {
            state.selectedProficiencyLevel = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateProficiencyLevel.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error as SliceError;
      })

      // Delete proficiency level cases
      .addCase(deleteProficiencyLevel.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteProficiencyLevel.fulfilled, (state) => {
        state.isDeleting = false;
        state.selectedProficiencyLevel = null;
        state.error = null;
      })
      .addCase(deleteProficiencyLevel.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.error as SliceError;
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
  resetState,
} = proficiencyLevelsSlice.actions;

export default proficiencyLevelsSlice.reducer;