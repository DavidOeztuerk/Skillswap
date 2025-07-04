// src/features/skills/skillsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Skill } from '../../types/models/Skill';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import skillService, {
  SkillSearchParams,
  SkillStatistics,
  SkillRecommendation,
} from '../../api/services/skillsService';
import { PaginatedResponse } from '../../types/common/PaginatedResponse';

// Enhanced interfaces
interface ExtendedCreateSkillRequest extends CreateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}

interface ExtendedUpdateSkillRequest extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}

// API Response interface - angepasst an deine API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  timestamp?: string;
  traceId?: string;
}

// Unified Skills State
interface SkillsState {
  // All skills (from search/browse)
  allSkills: Skill[];

  // User's own skills
  userSkills: Skill[];

  // Currently selected skill for details
  selectedSkill: Skill | null;

  // Search & Filter
  searchQuery: string;
  searchResults: Skill[];
  isSearchActive: boolean;

  // Pagination
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  // Analytics
  statistics: SkillStatistics | null;
  recommendations: SkillRecommendation[];
  popularTags: Array<{ tag: string; count: number }>;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error handling
  errors: string[] | null;
}

const initialState: SkillsState = {
  allSkills: [],
  userSkills: [],
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
  errors: null,
};

/**
 * Helper function to extract data from API response
 */
const extractApiData = <T>(response: PaginatedResponse<T> | T): T => {
  // If response has 'data' property, extract it
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  // Otherwise, assume the response is the data itself
  return response as T;
};

/**
 * Helper function to extract pagination from API response
 */
const extractPagination = <T>(response: PaginatedResponse<T> | unknown) => {
  if (response && typeof response === 'object') {
    return {
      pageNumber: (response as PaginatedResponse<T>).pageNumber || 1,
      pageSize: (response as PaginatedResponse<T>).pageSize || 12,
      totalPages: (response as PaginatedResponse<T>).totalPages || 0,
      totalRecords: (response as PaginatedResponse<T>).totalRecords || 0,
      hasNextPage: (response as PaginatedResponse<T>).hasNextPage || false,
      hasPreviousPage:
        (response as PaginatedResponse<T>).hasPreviousPage || false,
    };
  }
  return initialState.pagination;
};

/**
 * Async Thunks
 */
// Get all skills with pagination
export const fetchAllSkills = createAsyncThunk(
  'skills/fetchAllSkills',
  async (params: SkillSearchParams, { rejectWithValue }) => {
    try {
      const response = await skillService.getAllSkills(params);
      console.log('📋 All skills response:', response);
      return response;
    } catch (error) {
      console.error('❌ Fetch all skills error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skills konnten nicht geladen werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Get skill by ID
export const fetchSkillById = createAsyncThunk(
  'skills/fetchSkillById',
  async (skillId: string, { rejectWithValue }) => {
    try {
      console.log('🎯 Fetching skill by ID:', skillId);
      const response = await skillService.getSkillById(skillId);
      console.log('🎯 Skill by ID response:', response);
      return response;
    } catch (error) {
      console.error('❌ Fetch skill by ID error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill konnte nicht geladen werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Get user skills
export const fetchUserSkills = createAsyncThunk(
  'skills/fetchUserSkills',
  async (
    { page = 1, pageSize = 12 }: { page?: number; pageSize?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      console.log(
        '👤 Fetching user skills - page:',
        page,
        'pageSize:',
        pageSize
      );
      const response = await skillService.getUserSkills(page, pageSize);
      console.log('👤 User skills response:', response);
      return response;
    } catch (error) {
      console.error('❌ Fetch user skills error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Deine Skills konnten nicht geladen werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Create new skill
export const createSkill = createAsyncThunk(
  'skills/createSkill',
  async (skillData: ExtendedCreateSkillRequest, { rejectWithValue }) => {
    try {
      console.log('✨ Creating skill:', skillData);
      const response = await skillService.createSkill(skillData);
      console.log('✨ Create skill response:', response);
      return response;
    } catch (error) {
      console.error('❌ Create skill error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill konnte nicht erstellt werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Update existing skill
export const updateSkill = createAsyncThunk(
  'skills/updateSkill',
  async (
    {
      skillId,
      updateData,
    }: { skillId: string; updateData: ExtendedUpdateSkillRequest },
    { rejectWithValue }
  ) => {
    try {
      console.log('📝 Updating skill:', skillId, updateData);
      const response = await skillService.updateSkill(skillId, updateData);
      console.log('📝 Update skill response:', response);
      return { skillId, updatedSkill: response };
    } catch (error) {
      console.error('❌ Update skill error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill konnte nicht aktualisiert werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Delete skill
export const deleteSkill = createAsyncThunk(
  'skills/deleteSkill',
  async (
    { skillId, reason }: { skillId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('🗑️ Deleting skill:', skillId, reason);
      await skillService.deleteSkill(skillId, reason);
      console.log('🗑️ Skill deleted successfully');
      return skillId;
    } catch (error) {
      console.error('❌ Delete skill error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill konnte nicht gelöscht werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Rate skill
export const rateSkill = createAsyncThunk(
  'skills/rateSkill',
  async (
    {
      skillId,
      rating,
      review,
    }: { skillId: string; rating: number; review?: string },
    { rejectWithValue }
  ) => {
    try {
      await skillService.rateSkill(skillId, rating, review);
      return { skillId, rating, review };
    } catch (error) {
      console.error('❌ Rate skill error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill-Bewertung fehlgeschlagen';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Endorse skill
export const endorseSkill = createAsyncThunk(
  'skills/endorseSkill',
  async (
    { skillId, message }: { skillId: string; message?: string },
    { rejectWithValue }
  ) => {
    try {
      await skillService.endorseSkill(skillId, message);
      return { skillId, message };
    } catch (error) {
      console.error('❌ Endorse skill error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill-Empfehlung fehlgeschlagen';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Fetch skill statistics
export const fetchSkillStatistics = createAsyncThunk(
  'skills/fetchSkillStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await skillService.getSkillStatistics();
      return response;
    } catch (error) {
      console.error('❌ Fetch skill statistics error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill-Statistiken konnten nicht geladen werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Fetch popular tags
export const fetchPopularTags = createAsyncThunk(
  'skills/fetchPopularTags',
  async ({ limit = 20 }: { limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await skillService.getPopularTags(limit);
      return response;
    } catch (error) {
      console.error('❌ Fetch popular tags error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Beliebte Tags konnten nicht geladen werden';
      return rejectWithValue([errorMessage]);
    }
  }
);

// Fetch skill recommendations
export const fetchSkillRecommendations = createAsyncThunk(
  'skills/fetchSkillRecommendations',
  async ({ limit = 10 }: { limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await skillService.getSkillRecommendations(limit);
      return response;
    } catch (error) {
      console.error('❌ Fetch skill recommendations error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Skill-Empfehlungen konnten nicht geladen werden';
      return rejectWithValue([errorMessage]);
    }
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
      state.errors = null;
    },

    setError: (state, action: PayloadAction<string[] | null>) => {
      state.errors = action.payload;
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
      const existingIndex = state.userSkills.findIndex(
        (skill) => skill.skillId === action.payload.skillId
      );
      if (existingIndex === -1) {
        state.userSkills.unshift(action.payload);
      } else {
        state.userSkills[existingIndex] = action.payload;
      }
    },

    removeUserSkill: (state, action: PayloadAction<string>) => {
      state.userSkills = state.userSkills.filter(
        (skill) => skill.skillId !== action.payload
      );
      if (state.selectedSkill?.skillId === action.payload) {
        state.selectedSkill = null;
      }
    },

    updateSkillInState: (state, action: PayloadAction<Skill>) => {
      const updatedSkill = action.payload;

      // Update in all relevant arrays
      const updateInArray = (array: Skill[]) => {
        const index = array.findIndex(
          (skill) => skill.skillId === updatedSkill.skillId
        );
        if (index !== -1) {
          array[index] = updatedSkill;
        }
      };

      updateInArray(state.allSkills);
      updateInArray(state.userSkills);
      updateInArray(state.searchResults);

      if (state.selectedSkill?.skillId === updatedSkill.skillId) {
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
    builder
      // Fetch all skills cases
      .addCase(fetchAllSkills.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(fetchAllSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = extractApiData(action.payload);
        const pagination = extractPagination(action.payload);

        state.allSkills = Array.isArray(data) ? data : [];
        state.pagination = pagination;
        state.errors = null;

        console.log('✅ All skills updated:', state.allSkills.length, 'skills');
      })
      .addCase(fetchAllSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
        state.allSkills = [];
        console.log('❌ Fetch all skills failed:', action.payload);
      })

      // Fetch skill by ID cases
      .addCase(fetchSkillById.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(fetchSkillById.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = extractApiData(action.payload);
        state.selectedSkill = data || null;

        // Update in arrays if it exists
        if (data) {
          const updateInArray = (array: Skill[]) => {
            const index = array.findIndex(
              (skill) => skill.skillId === data.skillId
            );
            if (index !== -1) {
              array[index] = {
                skillId: data.skillId,
                userId: data.userId,
                name: data.name ?? '',
                description: data.description ?? '',
                isOffering: data.isOffering ?? false,
                category: data.category ?? array[index].category,
                proficiencyLevel:
                  data.proficiencyLevel ?? array[index].proficiencyLevel,
              };
            }
          };

          updateInArray(state.allSkills);
          updateInArray(state.userSkills);
          updateInArray(state.searchResults);
        }

        state.errors = null;
        console.log('✅ Skill by ID updated:', data?.name);
      })
      .addCase(fetchSkillById.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
        state.selectedSkill = null;
        console.log('❌ Fetch skill by ID failed:', action.payload);
      })

      // Fetch user skills cases
      .addCase(fetchUserSkills.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(fetchUserSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = extractApiData(action.payload);
        const pagination = extractPagination(action.payload);

        state.userSkills = Array.isArray(data) ? data : [];
        state.pagination = pagination;
        state.errors = null;

        console.log(
          '✅ User skills updated:',
          state.userSkills.length,
          'skills'
        );
      })
      .addCase(fetchUserSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
        state.userSkills = [];
        console.log('❌ Fetch user skills failed:', action.payload);
      })

      // Create skill cases
      .addCase(createSkill.pending, (state) => {
        state.isCreating = true;
        state.errors = null;
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

        const skill = state.allSkills.find(
          (skill) =>
            skill.category?.categoryId === skillData.skillCategoryId &&
            skill.proficiencyLevel?.levelId === skillData.proficiencyLevelId
        );

        if (skillData) {
          // Ensure we have all required fields for the Skill interface
          const newSkill: Skill = {
            skillId: skillData.id,
            userId: skillData.userId,
            name: skillData.name || '',
            description: skillData.description || '',
            isOffering: skillData.isOffering || false,
            category: skill?.category || undefined,
            proficiencyLevel: skill?.proficiencyLevel || undefined,
            // Add other fields if available
            // createdAt: skillData.,
            // updatedAt: skillData.updatedAt,
          };

          // Add to user skills (at the beginning)
          state.userSkills.unshift(newSkill);
          // Also add to all skills
          state.allSkills.unshift(newSkill);

          console.log('✅ New skill added to state:', newSkill);
        } else {
          console.warn('⚠️ No skill data found in response:', response);
        }

        state.errors = null;
      })
      .addCase(createSkill.rejected, (state, action) => {
        state.isCreating = false;
        state.errors = action.payload as string[];
        console.log('❌ Create skill failed:', action.payload);
      })

      // Update skill cases
      .addCase(updateSkill.pending, (state) => {
        state.isUpdating = true;
        state.errors = null;
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { skillId, updatedSkill } = action.payload;
        const data = extractApiData(updatedSkill);

        const skill = state.allSkills.find(
          (skill) =>
            skill.category?.categoryId ===
              action.payload.updatedSkill.skillCategoryId &&
            skill.proficiencyLevel?.levelId ===
              action.payload.updatedSkill.proficiencyLevelId
        );

        if (data) {
          // Update in all relevant arrays
          const updateInArray = (array: Skill[]) => {
            const index = array.findIndex((skill) => skill.skillId === skillId);
            if (index !== -1) {
              array[index] = {
                skillId: skill?.skillId ?? array[index].skillId,
                userId: skill?.userId ?? array[index].userId,
                name: data.name ?? array[index].name,
                description: data.description ?? array[index].description,
                isOffering: data.isOffering ?? array[index].isOffering,
                category: skill?.category ?? array[index].category,
                proficiencyLevel:
                  skill?.proficiencyLevel ?? array[index].proficiencyLevel,
              };
            }
          };

          updateInArray(state.allSkills);
          updateInArray(state.userSkills);
          updateInArray(state.searchResults);

          if (state.selectedSkill?.skillId === skillId) {
            state.selectedSkill = skill || null;
          }

          console.log('✅ Skill updated:', data.name);
        }

        state.errors = null;
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.isUpdating = false;
        state.errors = action.payload as string[];
        console.log('❌ Update skill failed:', action.payload);
      })

      // Delete skill cases
      .addCase(deleteSkill.pending, (state) => {
        state.isDeleting = true;
        state.errors = null;
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedSkillId = action.payload;

        // Remove from all arrays
        state.allSkills = state.allSkills.filter(
          (skill) => skill.skillId !== deletedSkillId
        );
        state.userSkills = state.userSkills.filter(
          (skill) => skill.skillId !== deletedSkillId
        );
        state.searchResults = state.searchResults.filter(
          (skill) => skill.skillId !== deletedSkillId
        );

        if (state.selectedSkill?.skillId === deletedSkillId) {
          state.selectedSkill = null;
        }

        state.errors = null;
        console.log('✅ Skill deleted:', deletedSkillId);
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.isDeleting = false;
        state.errors = action.payload as string[];
        console.log('❌ Delete skill failed:', action.payload);
      })

      // Rate/Endorse skill cases
      .addCase(rateSkill.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(rateSkill.fulfilled, (state) => {
        state.isLoading = false;
        state.errors = null;
      })
      .addCase(rateSkill.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
      })

      .addCase(endorseSkill.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(endorseSkill.fulfilled, (state) => {
        state.isLoading = false;
        state.errors = null;
      })
      .addCase(endorseSkill.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
      })

      // Statistics and analytics cases
      .addCase(fetchSkillStatistics.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(fetchSkillStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = extractApiData(action.payload);
        state.errors = null;
      })
      .addCase(fetchSkillStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
        state.statistics = null;
      })

      .addCase(fetchPopularTags.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(fetchPopularTags.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularTags = extractApiData(action.payload) || [];
        state.errors = null;
      })
      .addCase(fetchPopularTags.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
        state.popularTags = [];
      })

      .addCase(fetchSkillRecommendations.pending, (state) => {
        state.isLoading = true;
        state.errors = null;
      })
      .addCase(fetchSkillRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recommendations = extractApiData(action.payload) || [];
        state.errors = null;
      })
      .addCase(fetchSkillRecommendations.rejected, (state, action) => {
        state.isLoading = false;
        state.errors = action.payload as string[];
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
