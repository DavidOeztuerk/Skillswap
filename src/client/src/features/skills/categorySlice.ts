// src/features/categories/categoriesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SkillCategory } from '../../types/models/Skill';
import skillService from '../../api/services/skillsService';

// Categories State interface
interface CategoriesState {
  categories: SkillCategory[];
  selectedCategory: SkillCategory | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

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
  async (_, { rejectWithValue }) => {
    try {
      const response = await skillService.getCategories();
      return response;
    } catch (error) {
      console.error('Fetch categories thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Kategorien konnten nicht geladen werden'
      );
    }
  }
);

// Create category (Admin)
export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (
    { name, description }: { name: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await skillService.createCategory(name, description);
      return response;
    } catch (error) {
      console.error('Create category thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Kategorie konnte nicht erstellt werden'
      );
    }
  }
);

// Update category (Admin)
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async (
    {
      id,
      name,
      description,
    }: { id: string; name: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await skillService.updateCategory(id, name, description);
      return response;
    } catch (error) {
      console.error('Update category thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Kategorie konnte nicht aktualisiert werden'
      );
    }
  }
);

// Delete category (Admin)
export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      await skillService.deleteCategory(id);
      return id;
    } catch (error) {
      console.error('Delete category thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Kategorie konnte nicht gelöscht werden'
      );
    }
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
        (category) => category.categoryId === action.payload.categoryId
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
        (category) => category.categoryId !== action.payload
      );
      if (state.selectedCategory?.categoryId === action.payload) {
        state.selectedCategory = null;
      }
    },

    updateCategoryInState: (state, action: PayloadAction<SkillCategory>) => {
      const updatedCategory = action.payload;
      const index = state.categories.findIndex(
        (category) => category.categoryId === updatedCategory.categoryId
      );
      if (index !== -1) {
        state.categories[index] = updatedCategory;
      }

      if (state.selectedCategory?.categoryId === updatedCategory.categoryId) {
        state.selectedCategory = updatedCategory;
      }
    },

    clearAllCategories: (state) => {
      state.categories = [];
      state.selectedCategory = null;
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
      // Fetch categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        // Null-safe access to API response
        state.categories = action?.payload || [];

        // Sort categories by sortOrder or name
        state.categories.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
            (cat) => cat.categoryId === action.payload.categoryId
          );
          if (index !== -1) {
            state.categories[index] = action.payload;
            // Re-sort after updating
            state.categories.sort((a, b) => {
              return a.name.localeCompare(b.name);
            });
          }

          if (state.selectedCategory?.categoryId === action.payload.categoryId) {
            state.selectedCategory = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })

      // Delete category cases
      .addCase(deleteCategory.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedCategoryId = action.payload;

        state.categories = state.categories.filter(
          (cat) => cat.categoryId !== deletedCategoryId
        );

        if (state.selectedCategory?.categoryId === deletedCategoryId) {
          state.selectedCategory = null;
        }

        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
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
