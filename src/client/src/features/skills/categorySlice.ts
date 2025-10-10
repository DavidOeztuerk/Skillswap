import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SkillCategory } from '../../types/models/Skill';
import { SkillCategoryResponse } from '../../types/contracts/responses/CreateSkillResponse';
import { withDefault, isDefined } from '../../utils/safeAccess';
import { initialCategoriesState } from '../../store/adapters/categoriesAdapter+State';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from './thunks/categoryThunks';

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: initialCategoriesState,
  reducers: {
    clearError: (state) => {
      state.errorMessage = undefined;
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
      state.categories = state.categories?.filter(
        (category) => category?.id !== action.payload
      );
      if (state.selectedCategory?.id === action.payload) {
        state.selectedCategory = null;
      }
    },

    updateCategoryInState: (state, action: PayloadAction<SkillCategory>) => {
      const updatedCategory = action.payload;
      const index = state.categories?.findIndex(
        (category) => category?.id === updatedCategory?.id
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
      state.errorMessage = action.payload.message;
    },

    // Optimistic updates
    createCategoryOptimistic: (state, action: PayloadAction<SkillCategory>) => {
      state.categories.push(action.payload);
      state.categories.sort((a, b) => a?.name.localeCompare(b?.name));
    },
    
    updateCategoryOptimistic: (state, action: PayloadAction<SkillCategory>) => {
      const index = state.categories?.findIndex(
        (cat) => cat?.id === action.payload?.id
      );
      if (index !== -1) {
        state.categories[index] = action.payload;
        state.categories.sort((a, b) => a?.name.localeCompare(b?.name));
      }
      if (state.selectedCategory?.id === action.payload.id) {
        state.selectedCategory = action.payload;
      }
    },
    
    deleteCategoryOptimistic: (state, action: PayloadAction<string>) => {
      state.categories = state.categories?.filter(
        (category) => category?.id !== action.payload
      );
      if (state.selectedCategory?.id === action.payload) {
        state.selectedCategory = null;
      }
    },
    
    // Rollback actions
    setCategories: (state, action: PayloadAction<SkillCategory[]>) => {
      state.categories = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;

        const mapSkillResponseToSkill = (response: SkillCategoryResponse): SkillCategory => {
          return {
            id: response.categoryId,
            name: response.name,
            iconName: response.iconName,
            color: response.color,
            skillCount: response.skillCount
          }
        }

        if (isDefined(action.payload.data)) {
          const categories = action.payload.data.map(x => mapSkillResponseToSkill(x));
          state.categories = categories;
          // Sort categories by name
          state.categories.sort((a, b) => {
            return withDefault(a?.name, '').localeCompare(withDefault(b?.name, ''));
          });
        } else {
          state.categories = [];
        }

        state.errorMessage = undefined;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
        state.categories = [];
      })

      // Create category cases
      .addCase(createCategory.pending, (state) => {
        state.isCreating = true;
        state.errorMessage = undefined;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isCreating = false;
        if (isDefined(action.payload.data)) {
          state.categories.push(action.payload.data);
          // Re-sort after adding
          state.categories.sort((a, b) => {
            return withDefault(a?.name, '').localeCompare(withDefault(b?.name, ''));
          });
        }
        state.errorMessage = undefined;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isCreating = false;
        state.errorMessage = action.payload?.message;
      })

      // Update category cases
      .addCase(updateCategory.pending, (state) => {
        state.isUpdating = true;
        state.errorMessage = undefined;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (isDefined(action.payload.data)) {
          const categoryData = action.payload.data;
          const index = state.categories?.findIndex(
            (cat) => cat?.id === categoryData?.id
          );
          if (index !== -1) {
            state.categories[index] = categoryData;
            // Re-sort after updating
            state.categories.sort((a, b) => {
              return withDefault(a?.name, '').localeCompare(withDefault(b?.name, ''));
            });
          }

          if (state.selectedCategory?.id === categoryData.id) {
            state.selectedCategory = categoryData;
          }
        }
        state.errorMessage = undefined;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isUpdating = false;
        state.errorMessage = action.payload?.message;
      })

      // Delete category cases
      .addCase(deleteCategory.pending, (state) => {
        state.isDeleting = true;
        state.errorMessage = undefined;
      })
      .addCase(deleteCategory.fulfilled, (state) => {
        state.isDeleting = false;
        state.selectedCategory = null;
        state.errorMessage = undefined;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isDeleting = false;
        state.errorMessage = action.payload?.message;
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
  createCategoryOptimistic,
  updateCategoryOptimistic,
  deleteCategoryOptimistic,
  setCategories,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
