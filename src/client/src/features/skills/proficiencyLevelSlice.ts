// src/features/proficiencyLevels/proficiencyLevelsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProficiencyLevel } from '../../types/models/Skill';
import skillService from '../../api/services/skillsService';

// Proficiency Levels State interface
interface ProficiencyLevelsState {
  proficiencyLevels: ProficiencyLevel[];
  selectedProficiencyLevel: ProficiencyLevel | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

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
  async (_, { rejectWithValue }) => {
    try {
      const response = await skillService.getProficiencyLevels();
      return response;
    } catch (error) {
      console.error('Fetch proficiency levels thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to load proficiency levels'
      );
    }
  }
);

// Create proficiency level (Admin)
export const createProficiencyLevel = createAsyncThunk(
  'proficiencyLevels/createProficiencyLevel',
  async (
    {
      level,
      rank,
      description,
    }: { level: string; rank: number; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await skillService.createProficiencyLevel(
        level,
        rank,
        description
      );
      return response;
    } catch (error) {
      console.error('Create proficiency level thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to create proficiency level'
      );
    }
  }
);

// Update proficiency level (Admin)
export const updateProficiencyLevel = createAsyncThunk(
  'proficiencyLevels/updateProficiencyLevel',
  async (
    {
      id,
      level,
      rank,
      description,
    }: { id: string; level: string; rank: number; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await skillService.updateProficiencyLevel(
        id,
        level,
        rank,
        description
      );
      return response;
    } catch (error) {
      console.error('Update proficiency level thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to update proficiency level'
      );
    }
  }
);

// Delete proficiency level (Admin)
export const deleteProficiencyLevel = createAsyncThunk(
  'proficiencyLevels/deleteProficiencyLevel',
  async (id: string, { rejectWithValue }) => {
    try {
      await skillService.deleteProficiencyLevel(id);
      return id;
    } catch (error) {
      console.error('Delete proficiency level thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to delete proficiency level'
      );
    }
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

    setError: (state, action: PayloadAction<string | null>) => {
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
      })

      // Delete proficiency level cases
      .addCase(deleteProficiencyLevel.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteProficiencyLevel.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedLevelId = action.payload;

        state.proficiencyLevels = state.proficiencyLevels.filter(
          (level) => level.levelId !== deletedLevelId
        );

        if (state.selectedProficiencyLevel?.levelId === deletedLevelId) {
          state.selectedProficiencyLevel = null;
        }

        state.error = null;
      })
      .addCase(deleteProficiencyLevel.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
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