import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Skill } from '../../types/models/Skill';
import skillService, {
  GetUserSkillRespone,
  SkillSearchParams,
  SkillSearchResultResponse,
} from '../../api/services/skillsService';
import { SkillState } from '../../types/states/SkillState';
import { ExtendedCreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { ExtendedUpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { SliceError } from '../../store/types';
import { withDefault } from '../../utils/safeAccess';

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

/**
 * Maps backend SkillSearchResultResponse to frontend Skill model
 */
export const mapSkillResponseToSkill = (response: SkillSearchResultResponse): Skill => {
  return {
    id: response.skillId,
    userId: response.userId,
    name: response.name,
    description: response.description,
    isOffered: response.isOffered, // Fixed: Now correctly maps from backend
    category: {
      id: response.category?.categoryId || '',
      name: response.category?.name,
      iconName: response.category?.iconName,
      color: response.category?.color,
    },
    proficiencyLevel: {
      id: response.proficiencyLevel?.levelId || '',
      level: response.proficiencyLevel?.level,
      rank: withDefault(response.proficiencyLevel?.rank, 0),
      color: response.proficiencyLevel?.color,
    },
    tagsJson: response.tagsJson,
    averageRating: withDefault(response.averageRating, 0),
    reviewCount: withDefault(response.reviewCount, 0),
    endorsementCount: withDefault(response.endorsementCount, 0),
    estimatedDurationMinutes: withDefault(response.estimatedDurationMinutes, 0),
    createdAt: response.createdAt?.toString(),
    lastActiveAt: response.lastActiveAt ? response.lastActiveAt.toString() : undefined,
  };
};

export const mapUserSkillsResponseToSkill = (response: GetUserSkillRespone): Skill => {
  return {
    id: response.skillId,
    userId: response.userId,
    name: response.name,
    description: response.description,
    isOffered: response.isOffered,
    category: {
      id: response.category?.categoryId || '',
      name: response.category?.name,
      iconName: response.category?.iconName,
      color: response.category?.color,
    },
    proficiencyLevel: {
      id: response.proficiencyLevel?.levelId || '',
      level: response.proficiencyLevel?.level,
      rank: withDefault(response.proficiencyLevel?.rank, 0),
      color: response.proficiencyLevel?.color,
    },
    tagsJson: response.tags?.toString(),
    averageRating: withDefault(response.averageRating, 0),
    reviewCount: withDefault(response.reviewCount, 0),
    endorsementCount: withDefault(response.endorsementCount, 0),
    createdAt: response.createdAt?.toString(),
    lastActiveAt: response.updatedAt ? response.updatedAt.toString() : undefined,
  };
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
    return await skillService.getSkillById(skillId);
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
    return await skillService.getSkillStatistics();
  }
);

// Fetch popular tags
export const fetchPopularTags = createAsyncThunk(
  'skills/fetchPopularTags',
  async ({ limit = 20 }: { limit?: number }) => {
    return await skillService.getPopularTags(limit);
  }
);

// Fetch skill recommendations
export const fetchSkillRecommendations = createAsyncThunk(
  'skills/fetchSkillRecommendations',
  async ({ limit = 10 }: { limit?: number }) => {
    return await skillService.getSkillRecommendations(limit);
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
      if (existingIndex) {
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
        if (index !== undefined && index !== -1 && array) {
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
        // Handle ApiResponse wrapper
        if (action.payload.success && action.payload.data) {
          state.favoriteSkillIds = action.payload.data || [];
        } else {
          state.favoriteSkillIds = [];
        }
        state.error = null;
      })
      .addCase(fetchFavoriteSkills.rejected, (state, action) => {
        state.error = action.error as SliceError;
        state.favoriteSkillIds = [];
      })
      .addCase(addFavoriteSkill.fulfilled, (state, action) => {
        if (!state.favoriteSkillIds?.includes(action.meta.arg.skillId)) {
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
        // PagedResponse has data array at the root level
        if (action.payload.data && Array.isArray(action.payload.data)) {
          state.allSkills = action.payload.data.map(mapSkillResponseToSkill);
        }
        // Update pagination from PagedResponse
        if (action.payload.pageNumber !== undefined) {
          state.pagination = {
            pageNumber: action.payload.pageNumber,
            pageSize: action.payload.pageSize,
            totalPages: action.payload.totalPages,
            totalRecords: action.payload.totalRecords,
            hasNextPage: action.payload.hasNextPage,
            hasPreviousPage: action.payload.hasPreviousPage,
          };
        }
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
        
        // Handle ApiResponse wrapper
        if (!action.payload.success || !action.payload.data) {
          state.error = { 
            message: action.payload.message || 'Failed to fetch skill', 
            code: 'SKILL_FETCH_FAILED', 
            details: undefined
          };
          return;
        }
        
        const skill = action.payload.data;
        state.selectedSkill = skill;

        if (skill) {
          const updateInArray = (array?: Skill[]) => {
            const index = array?.findIndex(
              (s) => s.id === skill.id
            );
            if (index !== undefined && index !== -1 && array) {
              array[index] = skill;
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
        const response = action.payload;

        // Map the skills from PagedResponse data array
        if (response.data && Array.isArray(response.data)) {
          state.userSkills = response.data.map((skill: GetUserSkillRespone) => {
            if ('skillId' in skill) {
              return mapUserSkillsResponseToSkill(skill);
            }
            return skill as Skill;
          });
        }
        
        // Update pagination from PagedResponse
        if (response.pageNumber !== undefined) {
          state.pagination = {
            pageNumber: response.pageNumber,
            pageSize: response.pageSize,
            totalPages: response.totalPages,
            totalRecords: response.totalRecords,
            hasNextPage: response.hasNextPage,
            hasPreviousPage: response.hasPreviousPage,
          };
        }
        
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
        
        // Handle ApiResponse wrapper
        if (!action.payload.success || !action.payload.data) {
          state.error = { 
            message: action.payload.message || 'Failed to create skill', 
            code: 'SKILL_CREATE_FAILED', 
            details: undefined
          };
          return;
        }
        
        const response = action.payload.data;
        console.log('✅ Create skill response:', response);

        // Handle the response - it might be a CreateSkillResponse or full skill data
        let newSkill: Skill;
        
        if (response && 'skillId' in response) {
          // If it's a minimal response, create a minimal Skill object
          // You might need to fetch the full skill details after creation
          newSkill = {
            id: response.skillId,
            userId: "",
            name: response.name || '',
            description: response.description || '',
            isOffered: response.isOffered || false,
            endorsementCount: 0,
            category: { 
              id: response.categoryName || '', 
              name: '', 
            },
            proficiencyLevel: { 
              id: response.proficiencyLevelName || '', 
              level: '', 
              rank: 0, 
            },
            tagsJson: response.tags?.toString() || "[]",
            createdAt: response.createdAt || new Date().toISOString(),
          };
        } else if (response && 'skillId' in response && 'category' in response) {
          // If it's a full SkillSearchResultResponse
          newSkill = mapSkillResponseToSkill(response as SkillSearchResultResponse);
        } else {
          // If it's already a Skill object
          newSkill = response as Skill;
        }

        state.userSkills?.unshift(newSkill);
        state.allSkills?.unshift(newSkill);
        console.log('✅ New skill added to state:', newSkill);

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
        
        // Handle ApiResponse wrapper
        if (!action.payload.success || !action.payload.data) {
          state.error = { 
            message: action.payload.message || 'Failed to update skill', 
            code: 'SKILL_UPDATE_FAILED', 
            details: undefined
          };
          return;
        }
        
        const data = action.payload.data;

        if (data) {
          // UpdateSkillResponse might be partial, so we need to merge with existing data
          const updateInArray = (array?: Skill[]) => {
            const index = array?.findIndex((skill) => skill.id === data.id);
            if (index !== undefined && index !== -1 && array) {
              array[index] = {
                ...array[index],
                id: data.id || array[index].id,
                name: data.name ?? array[index].name,
                description: data.description ?? array[index].description,
                isOffered: data.isOffered ?? array[index].isOffered,
                // Update category if categoryId is provided
                category: data.categoryId ? {
                  ...array[index].category,
                  id: data.categoryId,
                } : array[index].category,
                // Update proficiency level if proficiencyLevelId is provided
                proficiencyLevel: data.proficiencyLevelId ? {
                  ...array[index].proficiencyLevel,
                  id: data.proficiencyLevelId,
                } : array[index].proficiencyLevel,
              };
            }
          };

          updateInArray(state.allSkills);
          updateInArray(state.userSkills);
          updateInArray(state.searchResults);

          if (state.selectedSkill?.id === data.id) {
            state.selectedSkill = state.allSkills?.find((s) => s.id === data.id) || 
                                  state.userSkills?.find((s) => s.id === data.id) || 
                                  null;
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
        // Handle ApiResponse wrapper
        if (action.payload.success && action.payload.data) {
          state.statistics = action.payload.data;
        }
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
        // Handle ApiResponse wrapper
        if (action.payload.success && action.payload.data) {
          state.popularTags = action.payload.data;
        } else {
          state.popularTags = [];
        }
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
        // Handle ApiResponse wrapper
        if (action.payload.success && action.payload.data) {
          state.recommendations = action.payload.data;
        } else {
          state.recommendations = [];
        }
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