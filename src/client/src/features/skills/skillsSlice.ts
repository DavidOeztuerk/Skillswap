import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialSkillsState, normalizeEntities, removeEntity, updateEntity } from '../../store/adapters/skillsAdapter+State';
import { fetchUserSkills, fetchSkillById, createSkill, updateSkill, deleteSkill, fetchFavoriteSkills, toggleFavoriteSkill, fetchAllSkills } from './thunks/skillsThunks';

// ===== REDUX SLICE =====
const skillsSlice = createSlice({
  name: 'skills',
  initialState: initialSkillsState,
  reducers: {
    // UI State Actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    clearSearchQuery: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearchActive = false;
    },
    
    setSelectedSkillId: (state, action) => {
      state.selectedSkillId = action.payload;
    },
    
    // Error Management
    clearError: (state, _) => {
      delete state.errorMessage;
    },
    
    // Search Results
    setSearchResults: (state, action: PayloadAction<string[]>) => {
      state.searchResults = action.payload;
      state.isSearchActive = true;
    },
  },
  extraReducers: (builder) => {
    // === FETCH ALL SKILLS ===
    builder.addCase(fetchAllSkills.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(fetchAllSkills.fulfilled, (state, action) => {
      state.isLoading = false;
      state.allSkills = normalizeEntities(action.payload.skills);
      state.allSkillsPagination = action.payload.pagination;
    });
    builder.addCase(fetchAllSkills.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to fetch all skills';
    });
    
    // === FETCH USER SKILLS ===
    builder.addCase(fetchUserSkills.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(fetchUserSkills.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userSkills = normalizeEntities(action.payload.skills);
      state.userSkillsPagination = action.payload.pagination;
    });
    builder.addCase(fetchUserSkills.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to fetch user skills';
    });
    
    // === FETCH SKILL BY ID ===
    builder.addCase(fetchSkillById.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(fetchSkillById.fulfilled, (state, action) => {
      state.isLoading = false;
      // Add to both allSkills and potentially userSkills
      state.allSkills = updateEntity(state.allSkills, action.payload);
      // Set as selected
      state.selectedSkillId = action.payload.id;
    });
    builder.addCase(fetchSkillById.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to fetch skill details';
    });
    
    // === CREATE SKILL ===
    builder.addCase(createSkill.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(createSkill.fulfilled, (state, action) => {
      state.isLoading = false;
      // Add to both allSkills and userSkills
      state.allSkills = updateEntity(state.allSkills, action.payload);
      state.userSkills = updateEntity(state.userSkills, action.payload);
    });
    builder.addCase(createSkill.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to create skill';
    });
    
    // === UPDATE SKILL ===
    builder.addCase(updateSkill.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(updateSkill.fulfilled, (state, action) => {
      state.isLoading = false;
      // Update in both allSkills and userSkills
      state.allSkills = updateEntity(state.allSkills, action.payload);
      state.userSkills = updateEntity(state.userSkills, action.payload);
    });
    builder.addCase(updateSkill.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to update skill';
    });
    
    // === DELETE SKILL ===
    builder.addCase(deleteSkill.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(deleteSkill.fulfilled, (state, action) => {
      state.isLoading = false;
      // Remove from both allSkills and userSkills
      state.allSkills = removeEntity(state.allSkills, action.payload);
      state.userSkills = removeEntity(state.userSkills, action.payload);
      // Clear selected if it was the deleted skill
      if (state.selectedSkillId === action.payload) {
        state.selectedSkillId = null;
      }
    });
    builder.addCase(deleteSkill.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to delete skill';
    });
    
    // === FETCH FAVORITE SKILLS ===
    builder.addCase(fetchFavoriteSkills.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(fetchFavoriteSkills.fulfilled, (state, action) => {
      state.isLoading = false;
      state.favoriteSkillIds = action.payload;
    });
    builder.addCase(fetchFavoriteSkills.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to fetch favorite skills';
    });
    
    // === TOGGLE FAVORITE SKILL ===
    builder.addCase(toggleFavoriteSkill.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(toggleFavoriteSkill.fulfilled, (state, action) => {
      state.isLoading = false;
      const { skillId, isFavorite } = action.payload;
      if (isFavorite) {
        if (!state.favoriteSkillIds.includes(skillId)) {
          state.favoriteSkillIds.push(skillId);
        }
      } else {
        state.favoriteSkillIds = state.favoriteSkillIds.filter(id => id !== skillId);
      }
    });
    builder.addCase(toggleFavoriteSkill.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors?.[0] || 'Failed to toggle favorite skill';
    });
  },
});

// ===== EXPORTS =====
export const {
  setSearchQuery,
  clearSearchQuery,
  setSelectedSkillId,
  clearError,
  setSearchResults,
} = skillsSlice.actions;

export default skillsSlice.reducer;
