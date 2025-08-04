// src/features/categories/categoriesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SkillCategory } from '../../types/models/Skill';
import skillService from '../../api/services/skillsService';
import { SliceError } from '../../store/types';
import { CategoriesState } from '../../types/states/SkillState';
import { SkillCategoryResponse } from '../../types/contracts/responses/CreateSkillResponse';

const initialState: CategoriesState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

/**
 * Async thunks for categories operations
 */

// Fetch categories
export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async () => {
        return await skillService.getCategories()
    }
);

// Create category (Admin)
export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async ({ name, description }: { name: string; description?: string }) => {
    return await skillService.createCategory(name, description)
  }
);

// Update category (Admin)
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, name, description} : { id: string; name: string; description?: string }) => {
    return await skillService.updateCategory(id, name, description)
  }
);

// Delete category (Admin)
export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id: string) => {
    return skillService.deleteCategory(id);;
  }
);

/**
 * Categories Slice
 */
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setSelectedCategory: (
      state,
      action: PayloadAction<SkillCategory | null>
    ) => {
      state.selectedCategory = action.payload;
    },

    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    addCategory: (state, action: PayloadAction<SkillCategory>) => {
      const existingIndex = state.categories.findIndex(
        (category) => category.id === action.payload.id
      );
      if (existingIndex === -1) {
        state.categories.push(action.payload);
        // Sort by sortOrder or name
        state.categories.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
      } else {
        state.categories[existingIndex] = action.payload;
      }
    },

    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        (category) => category.id !== action.payload
      );
      if (state.selectedCategory?.id === action.payload) {
        state.selectedCategory = null;
      }
    },

    updateCategoryInState: (state, action: PayloadAction<SkillCategory>) => {
      const updatedCategory = action.payload;
      const index = state.categories.findIndex(
        (category) => category.id === updatedCategory.id
      );
      if (index !== -1) {
        state.categories[index] = updatedCategory;
      }

      if (state.selectedCategory?.id === updatedCategory.id) {
        state.selectedCategory = updatedCategory;
      }
    },

    clearAllCategories: (state) => {
      state.categories = [];
      state.selectedCategory = null;
    },

    setError: (state, action) => {
      state.error = action.payload as SliceError;
    },

    resetState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        // Null-safe access to API response
        // state.categories = action?.payload || [];
        const mapSkillResponseToSkill = (response: SkillCategoryResponse): SkillCategory => {
          return {
            id: response.categoryId,
            ...response
          }
        }
        if (action.payload && Array.isArray(action.payload)) {
          state.categories = action.payload.map(x => mapSkillResponseToSkill(x));
        }
        // Sort categories by sortOrder or name
        state.categories.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
        state.categories = [];
      })

      // Create category cases
      .addCase(createCategory.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isCreating = false;
        if (action.payload) {
          state.categories.push(action.payload);
          // Re-sort after adding
          state.categories.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        }
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as SliceError;
      })

      // Update category cases
      .addCase(updateCategory.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (action.payload) {
          const index = state.categories.findIndex(
            (cat) => cat.id === action.payload.id
          );
          if (index !== -1) {
            state.categories[index] = action.payload;
            // Re-sort after updating
            state.categories.sort((a, b) => {
              return a.name.localeCompare(b.name);
            });
          }

          if (state.selectedCategory?.id === action.payload.id) {
            state.selectedCategory = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as SliceError;
      })

      // Delete category cases
      .addCase(deleteCategory.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state) => {
        state.isDeleting = false;
        state.selectedCategory = null;
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as SliceError;
      });
  },
});

// Export actions
export const {
  clearError,
  setSelectedCategory,
  clearSelectedCategory,
  setLoading,
  addCategory,
  removeCategory,
  updateCategoryInState,
  clearAllCategories,
  setError,
  resetState,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
