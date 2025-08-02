// src/features/skills/skillsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Skill } from '../../types/models/Skill';
import skillService, {
  SkillSearchParams,
} from '../../api/services/skillsService';
// import { PaginatedResponse } from '../../types/common/PaginatedResponse';
import { SkillState } from '../../types/states/SkillState';
// import { ApiResponse } from '../../types/common/ApiResponse';
import { ExtendedCreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { ExtendedUpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { SliceError } from '../../store/types';

const initialState: SkillState = {
  allSkills: [],
  userSkills: [],
  favoriteSkillIds: [],
  selectedSkill: null,
  searchQuery: '',
  searchResults: [],
  isSearchActive: false,
  pagination: {
    pageNumber: 1,
    pageSize: 12,
    totalPages: 0,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  statistics: null,
  recommendations: [],
  popularTags: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

export const fetchFavoriteSkills = createAsyncThunk(
  'skills/fetchFavoriteSkills',
  async () => {
    return await skillService.getFavoriteSkills();
  }
);

export const addFavoriteSkill = createAsyncThunk(
  'skills/addFavoriteSkill',
  async ({skillId }: { skillId: string }) => {
    return await skillService.addFavoriteSkill(skillId);
  }
);

export const removeFavoriteSkill = createAsyncThunk(
  'skills/removeFavoriteSkill',
  async ({ skillId }: { skillId: string }) => {
    return await skillService.removeFavoriteSkill(skillId);
  }
);


/**
 * Async Thunks
 */
// Get all skills with pagination
export const fetchAllSkills = createAsyncThunk(
  'skills/fetchAllSkills',
  async (params: SkillSearchParams = {}) => {
    return await skillService.getAllSkills(params);
  }
);

// Get skill by ID
export const fetchSkillById = createAsyncThunk(
  'skills/fetchSkillById',
  async (skillId: string) => {
    return  await skillService.getSkillById(skillId);
  }
);

// Get user skills
export const fetchUserSkills = createAsyncThunk(
  'skills/fetchUserSkills',
  async ({ page = 1, pageSize = 12 }: { page?: number; pageSize?: number }) => {
    return await skillService.getUserSkills(page, pageSize);
  }
);

// Create new skill
export const createSkill = createAsyncThunk(
  'skills/createSkill',
  async (skillData: ExtendedCreateSkillRequest) => {
    return await skillService.createSkill(skillData);
  }
);

// Update existing skill
export const updateSkill = createAsyncThunk(
  'skills/updateSkill',
  async ({skillId, updateData}: { skillId: string; updateData: ExtendedUpdateSkillRequest }) => {
    return await skillService.updateSkill(skillId, updateData);
  }
);

// Delete skill
export const deleteSkill = createAsyncThunk(
  'skills/deleteSkill',
  async ({ skillId, reason }: { skillId: string; reason?: string }) => {
    return await skillService.deleteSkill(skillId, reason);
  }
);

// Rate skill
export const rateSkill = createAsyncThunk(
  'skills/rateSkill',
  async ({ skillId, rating, review }: { skillId: string; rating: number; review?: string }) => {
    return await skillService.rateSkill(skillId, rating, review);
  }
);

// Endorse skill
export const endorseSkill = createAsyncThunk(
  'skills/endorseSkill',
  async ({ skillId, message }: { skillId: string; message?: string }) => {
      return await skillService.endorseSkill(skillId, message);
  }
);

// Fetch skill statistics
export const fetchSkillStatistics = createAsyncThunk(
  'skills/fetchSkillStatistics',
  async () => {
    return  await skillService.getSkillStatistics();
  }
);

// Fetch popular tags
export const fetchPopularTags = createAsyncThunk(
  'skills/fetchPopularTags',
  async ({ limit = 20 }: { limit?: number }) => {
    return  await skillService.getPopularTags(limit);
  }
);

// Fetch skill recommendations
export const fetchSkillRecommendations = createAsyncThunk(
  'skills/fetchSkillRecommendations',
  async ({ limit = 10 }: { limit?: number }) => {
    return  await skillService.getSkillRecommendations(limit);
  }
);

/**
 * Skills Slice
 */
const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    // Error handling
    clearError: (state) => {
      state.error = null;
    },

    setError: (state, action) => {
      state.error = action.payload as SliceError;
    },

    // Selected skill management
    setSelectedSkill: (state, action: PayloadAction<Skill | null>) => {
      state.selectedSkill = action.payload;
    },

    clearSelectedSkill: (state) => {
      state.selectedSkill = null;
    },

    // Search management
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.isSearchActive = action.payload.length > 0;
    },

    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearchActive = false;
    },

    // Pagination management
    setPagination: (
      state,
      action: PayloadAction<Partial<typeof initialState.pagination>>
    ) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },

    // Manual state updates
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    addUserSkill: (state, action: PayloadAction<Skill>) => {
      const existingIndex = state.userSkills?.findIndex(
        (skill) => skill.id === action.payload.id
      );
      if (existingIndex === -1) {
        state.userSkills?.unshift(action.payload);
      } else if (state.userSkills && existingIndex) {
        state.userSkills[existingIndex] = action.payload;
      }
    },

    removeUserSkill: (state, action: PayloadAction<string>) => {
      state.userSkills = state.userSkills?.filter(
        (skill) => skill.id !== action.payload
      );
      if (state.selectedSkill?.id === action.payload) {
        state.selectedSkill = null;
      }
    },

    updateSkillInState: (state, action: PayloadAction<Skill>) => {
      const updatedSkill = action.payload;

      // Update in all relevant arrays
      const updateInArray = (array?: Skill[]) => {
        const index = array?.findIndex(
          (skill) => skill.id === updatedSkill.id
        );
        if (index && array) {
          array[index] = updatedSkill;
        }
      };

      updateInArray(state.allSkills);
      updateInArray(state.userSkills);
      updateInArray(state.searchResults);

      if (state.selectedSkill?.id === updatedSkill.id) {
        state.selectedSkill = updatedSkill;
      }
    },

    // Clear all data
    clearAllSkills: (state) => {
      state.allSkills = [];
      state.userSkills = [];
      state.searchResults = [];
      state.selectedSkill = null;
      state.recommendations = [];
    },

    // Reset entire state
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    // FAVORITES
    builder
      .addCase(fetchFavoriteSkills.fulfilled, (state, action) => {
        state.favoriteSkillIds = action.payload || [];
        state.error = null;
      })
      .addCase(fetchFavoriteSkills.rejected, (state, action) => {
        state.error = action.error as SliceError;
        state.favoriteSkillIds = [];
      })
      .addCase(addFavoriteSkill.fulfilled, (state, action) => {
        if (!state.favoriteSkillIds.includes(action.meta.arg.skillId)) {
          state.favoriteSkillIds.push(action.meta.arg.skillId);
        }
        state.error = null;
      })
      .addCase(addFavoriteSkill.rejected, (state, action) => {
        state.error = action.error as SliceError;
      })
      .addCase(removeFavoriteSkill.fulfilled, (state, action) => {
        state.favoriteSkillIds = state.favoriteSkillIds.filter(id => id !== action.meta.arg.skillId);
        state.error = null;
      })
      .addCase(removeFavoriteSkill.rejected, (state, action) => {
        state.error = action.error as SliceError;
      })
      // Fetch all skills cases
      .addCase(fetchAllSkills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload.data;
        const pagination = action.payload;
        state.allSkills = data;
        state.pagination = pagination;
        state.error = null;
      })
      .addCase(fetchAllSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.allSkills = [];
      })

      // Fetch skill by ID cases
      .addCase(fetchSkillById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSkillById.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload;
        state.selectedSkill = data;

        if (data) {
          const updateInArray = (array?: Skill[]) => {
            const index = array?.findIndex(
              (skill) => skill.id === data.id
            );
            if (index && array) {
              array[index] = data;
            }
          };

          updateInArray(state.allSkills);
          updateInArray(state.userSkills);
          updateInArray(state.searchResults);
        }

        state.error = null;
      })
      .addCase(fetchSkillById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.selectedSkill = null;
      })

      // Fetch user skills cases
      .addCase(fetchUserSkills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload.data;
        const pagination = action.payload;
        state.userSkills = data;
        state.pagination = pagination;
        state.error = null;
      })
      .addCase(fetchUserSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.userSkills = [];
      })

      // Create skill cases
      .addCase(createSkill.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createSkill.fulfilled, (state, action) => {
        state.isCreating = false;
        const response = action.payload;
        console.log('✅ Create skill response:', response);

        // // Handle the API response structure
        const skillData = action.payload;
        // if (response && typeof (response as CreateSkillResponse)) {
        //   if ('data' in response) {
        //     skillData = response.data;
        //   } else if ('skillId' in response) {
        //     // Handle case where response is the skill data directly
        //     skillData = response;
        //   }
        // }


        // Map API response to Skill model (minimal, extend as needed)
        if (skillData) {
          // CreateSkillResponse does not have userId, skillCategoryId, proficiencyLevelId, updatedAt, tags, etc.
          // We'll fill with minimal info and empty/defaults for missing fields
          const newSkill: Skill = {
            id: skillData.skillId,
            userId: '',
            name: skillData.name || '',
            description: skillData.description || '',
            isOffered: skillData.isOffered || false,
            category: { id: '', name: '', isActive: true, createdAt: '' },
            proficiencyLevel: { id: '', level: '', rank: 0, isActive: true, createdAt: '' },
            tagsJson: "",
            createdAt: skillData.createdAt || '',
          };
          state.userSkills?.unshift(newSkill);
          state.allSkills?.unshift(newSkill);
          console.log('✅ New skill added to state:', newSkill);
        } else {
          console.warn('⚠️ No skill data found in response:', response);
        }

        state.error = null;
      })
      .addCase(createSkill.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error as SliceError;
      })

      // Update skill cases
      .addCase(updateSkill.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.isUpdating = false;
        const data = action.payload;

        if (data) {
          // UpdateSkillResponse does not have userId, only id, name, description, isOffered, skillCategoryId, proficiencyLevelId
          const updateInArray = (array?: Skill[]) => {
            const index = array?.findIndex((skill) => skill.id === data.id);
            if (index && array) {
              array[index] = {
                ...array[index],
                id: data.id || array[index].id,
                name: data.name ?? array[index].name,
                description: data.description ?? array[index].description,
                isOffered: data.isOffered ?? array[index].isOffered,
                category: { id: data.categoryId || '', name: '', isActive: true, createdAt: '' },
                proficiencyLevel: { id: data.proficiencyLevelId || '', level: '', rank: 0, isActive: true, createdAt: '' },
              };
            }
          };

          updateInArray(state.allSkills);
          updateInArray(state.userSkills);
          updateInArray(state.searchResults);

          if (state.selectedSkill?.id === data.id) {
            state.selectedSkill = state.allSkills?.find((s) => s.id === data.id) || null;
          }
        }

        state.error = null;
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error as SliceError;
      })

      // Delete skill cases
      .addCase(deleteSkill.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedSkillId = action.meta.arg.skillId;

        // Remove from all arrays

        state.allSkills = state.allSkills?.filter(
          (skill) => skill.id !== deletedSkillId
        );
        state.userSkills = state.userSkills?.filter(
          (skill) => skill.id !== deletedSkillId
        );
        state.searchResults = state.searchResults.filter(
          (skill) => skill.id !== deletedSkillId
        );

        if (state.selectedSkill?.id === deletedSkillId) {
          state.selectedSkill = null;
        }

        state.error = null;
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.error as SliceError;
      })

      // Rate/Endorse skill cases
      .addCase(rateSkill.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rateSkill.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(rateSkill.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      .addCase(endorseSkill.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(endorseSkill.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(endorseSkill.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      // Statistics and analytics cases
      .addCase(fetchSkillStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSkillStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload;
        state.error = null;
      })
      .addCase(fetchSkillStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.statistics = null;
      })

      .addCase(fetchPopularTags.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPopularTags.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularTags = action.payload;
        state.error = null;
      })
      .addCase(fetchPopularTags.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.popularTags = [];
      })

      .addCase(fetchSkillRecommendations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSkillRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recommendations = action.payload;
        state.error = null;
      })
      .addCase(fetchSkillRecommendations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
        state.recommendations = [];
      });
  },
});

// Export actions
export const {
  clearError,
  setError,
  setSelectedSkill,
  clearSelectedSkill,
  setSearchQuery,
  clearSearch,
  setPagination,
  resetPagination,
  setLoading,
  addUserSkill,
  removeUserSkill,
  updateSkillInState,
  clearAllSkills,
  resetState,
} = skillsSlice.actions;

export default skillsSlice.reducer;









/**
//  * Helper function to extract data from API response
//  */
// const extractApiData = <T>(response: PaginatedResponse<T> | T): T => {
//   // If response has 'data' property, extract it
//   if (response && typeof response === 'object' && 'data' in response) {
//     return (response as ApiResponse<T>).data;
//   }
//   // Otherwise, assume the response is the data itself
//   return response as T;
// };

// /**
//  * Maps backend skill response to frontend Skill model
//  * Handles field name differences between backend and frontend
//  */
// const mapBackendSkillToFrontend = (backendSkill: any): Skill => {
//   return {
//     id: backendSkill.skillId || backendSkill.id,
//     userId: backendSkill.userId,
//     name: backendSkill.name,
//     description: backendSkill.description,
//     // Backend sends 'isOffering' but frontend expects 'isOffered'
//     isOffered: backendSkill.isOffering ?? backendSkill.isOffered ?? false,
//     category: backendSkill.category,
//     proficiencyLevel: backendSkill.proficiencyLevel,
//     tagsJson: backendSkill.tagsJson || "[]",
//     averageRating: backendSkill.averageRating,
//     reviewCount: backendSkill.reviewCount || 0,
//     endorsementCount: backendSkill.endorsementCount || 0,
//     estimatedDurationMinutes: backendSkill.estimatedDurationMinutes,
//     createdAt: backendSkill.createdAt,
//     lastActiveAt: backendSkill.lastActiveAt,
//   };
// };

// /**
//  * Helper function to extract pagination from API response
//  */
// const extractPagination = <T>(response: PaginatedResponse<T> | unknown) => {
//   if (response && typeof response === 'object') {
//     return {
//       pageNumber: (response as PaginatedResponse<T>).pageNumber || 1,
//       pageSize: (response as PaginatedResponse<T>).pageSize || 12,
//       totalPages: (response as PaginatedResponse<T>).totalPages || 0,
//       totalRecords: (response as PaginatedResponse<T>).totalRecords || 0,
//       hasNextPage: (response as PaginatedResponse<T>).hasNextPage || false,
//       hasPreviousPage:
//         (response as PaginatedResponse<T>).hasPreviousPage || false,
//     };
//   }
//   return initialState.pagination;
// };
