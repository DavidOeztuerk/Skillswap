import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { initialProfileState, profilesAdapter } from './profileAdapter+State';
import {
  fetchPublicProfile,
  fetchProfileReviews,
  fetchProfileReviewStats,
  fetchOwnExperience,
  fetchOwnEducation,
  saveExperience,
  deleteExperience,
  saveEducation,
  deleteEducation,
} from './thunks/profileThunks';

// ===== REDUX SLICE =====

const profileSlice = createSlice({
  name: 'profile',
  initialState: initialProfileState,
  reducers: {
    // UI State Actions
    setSelectedProfileId: (state, action: PayloadAction<string | null>) => {
      state.selectedProfileId = action.payload;
    },

    clearSelectedProfile: (state) => {
      state.selectedProfileId = null;
      state.currentProfileReviews = [];
      state.reviewsPagination = {
        pageNumber: 1,
        pageSize: 5,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    },

    // Error Management
    clearError: (state) => {
      delete state.errorMessage;
      delete state.saveError;
    },

    clearSaveError: (state) => {
      delete state.saveError;
    },

    // Reviews-specific actions
    setReviewsStarFilter: (state, action: PayloadAction<number | null>) => {
      state.reviewsStarFilter = action.payload;
    },

    clearReviewsData: (state) => {
      state.currentProfileReviews = [];
      state.currentProfileStats = null;
      state.reviewsStarFilter = null;
      state.reviewsPagination = {
        pageNumber: 1,
        pageSize: 5,
        totalPages: 0,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    },
  },
  extraReducers: (builder) => {
    // === FETCH PUBLIC PROFILE ===
    builder.addCase(fetchPublicProfile.pending, (state) => {
      state.isLoading = true;
      delete state.errorMessage;
    });
    builder.addCase(fetchPublicProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      // Use EntityAdapter's upsertOne to add/update the profile
      profilesAdapter.upsertOne(state, action.payload);
      // Set as selected profile
      state.selectedProfileId = action.payload.userId;
    });
    builder.addCase(fetchPublicProfile.rejected, (state, action) => {
      console.error('❌ [profileSlice] fetchPublicProfile.rejected:', action.payload);
      state.isLoading = false;
      state.errorMessage =
        action.payload?.message ?? action.error.message ?? 'Failed to fetch profile';
    });

    // === FETCH PROFILE REVIEWS ===
    builder.addCase(fetchProfileReviews.pending, (state) => {
      state.isReviewsLoading = true;
    });
    builder.addCase(fetchProfileReviews.fulfilled, (state, action) => {
      state.isReviewsLoading = false;
      state.currentProfileReviews = action.payload.reviews;
      state.reviewsPagination = action.payload.pagination;
    });
    builder.addCase(fetchProfileReviews.rejected, (state, action) => {
      console.error('❌ [profileSlice] fetchProfileReviews.rejected:', action.payload);
      state.isReviewsLoading = false;
    });

    // === FETCH PROFILE REVIEW STATS ===
    builder.addCase(fetchProfileReviewStats.pending, (state) => {
      state.isStatsLoading = true;
    });
    builder.addCase(fetchProfileReviewStats.fulfilled, (state, action) => {
      state.isStatsLoading = false;
      state.currentProfileStats = action.payload;
    });
    builder.addCase(fetchProfileReviewStats.rejected, (state, action) => {
      console.error('❌ [profileSlice] fetchProfileReviewStats.rejected:', action.payload);
      state.isStatsLoading = false;
    });

    // === FETCH OWN EXPERIENCE ===
    builder.addCase(fetchOwnExperience.pending, (state) => {
      state.isOwnDataLoading = true;
    });
    builder.addCase(fetchOwnExperience.fulfilled, (state, action) => {
      state.isOwnDataLoading = false;
      state.ownExperience = action.payload;
    });
    builder.addCase(fetchOwnExperience.rejected, (state, action) => {
      console.error('❌ [profileSlice] fetchOwnExperience.rejected:', action.payload);
      state.isOwnDataLoading = false;
    });

    // === FETCH OWN EDUCATION ===
    builder.addCase(fetchOwnEducation.pending, (state) => {
      state.isOwnDataLoading = true;
    });
    builder.addCase(fetchOwnEducation.fulfilled, (state, action) => {
      state.isOwnDataLoading = false;
      state.ownEducation = action.payload;
    });
    builder.addCase(fetchOwnEducation.rejected, (state, action) => {
      console.error('❌ [profileSlice] fetchOwnEducation.rejected:', action.payload);
      state.isOwnDataLoading = false;
    });

    // === SAVE EXPERIENCE ===
    builder.addCase(saveExperience.pending, (state) => {
      state.isSaving = true;
      delete state.saveError;
    });
    builder.addCase(saveExperience.fulfilled, (state, action) => {
      state.isSaving = false;
      const existingIndex = state.ownExperience.findIndex((e) => e.id === action.payload.id);
      if (existingIndex >= 0) {
        state.ownExperience[existingIndex] = action.payload;
      } else {
        state.ownExperience.unshift(action.payload);
      }
    });
    builder.addCase(saveExperience.rejected, (state, action) => {
      state.isSaving = false;
      state.saveError =
        action.payload?.message ?? action.error.message ?? 'Failed to save experience';
    });

    // === DELETE EXPERIENCE ===
    builder.addCase(deleteExperience.pending, (state) => {
      state.isSaving = true;
      delete state.saveError;
    });
    builder.addCase(deleteExperience.fulfilled, (state, action) => {
      state.isSaving = false;
      state.ownExperience = state.ownExperience.filter((e) => e.id !== action.payload);
    });
    builder.addCase(deleteExperience.rejected, (state, action) => {
      state.isSaving = false;
      state.saveError =
        action.payload?.message ?? action.error.message ?? 'Failed to delete experience';
    });

    // === SAVE EDUCATION ===
    builder.addCase(saveEducation.pending, (state) => {
      state.isSaving = true;
      delete state.saveError;
    });
    builder.addCase(saveEducation.fulfilled, (state, action) => {
      state.isSaving = false;
      const existingIndex = state.ownEducation.findIndex((e) => e.id === action.payload.id);
      if (existingIndex >= 0) {
        state.ownEducation[existingIndex] = action.payload;
      } else {
        state.ownEducation.unshift(action.payload);
      }
    });
    builder.addCase(saveEducation.rejected, (state, action) => {
      state.isSaving = false;
      state.saveError =
        action.payload?.message ?? action.error.message ?? 'Failed to save education';
    });

    // === DELETE EDUCATION ===
    builder.addCase(deleteEducation.pending, (state) => {
      state.isSaving = true;
      delete state.saveError;
    });
    builder.addCase(deleteEducation.fulfilled, (state, action) => {
      state.isSaving = false;
      state.ownEducation = state.ownEducation.filter((e) => e.id !== action.payload);
    });
    builder.addCase(deleteEducation.rejected, (state, action) => {
      state.isSaving = false;
      state.saveError =
        action.payload?.message ?? action.error.message ?? 'Failed to delete education';
    });
  },
});

// ===== EXPORTS =====

export const {
  setSelectedProfileId,
  clearSelectedProfile,
  clearError,
  clearSaveError,
  setReviewsStarFilter,
  clearReviewsData,
} = profileSlice.actions;

export default profileSlice.reducer;
