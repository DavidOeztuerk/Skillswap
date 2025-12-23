import { createAppAsyncThunk } from '../../../../core/store/thunkHelpers';
import {
  type SuccessResponse,
  isSuccessResponse,
} from '../../../../shared/types/api/UnifiedResponse';
import { skillService } from '../../services/skillsService';
import type { SkillCategoryResponse } from '../../types/CreateSkillResponse';
import type { SkillCategory } from '../../types/Skill';

export const fetchCategories = createAppAsyncThunk<SuccessResponse<SkillCategoryResponse[]>>(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    const response = await skillService.getCategories();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

// Create category (Admin)
export const createCategory = createAppAsyncThunk<
  SuccessResponse<SkillCategory>,
  { name: string; description?: string }
>('categories/createCategory', async ({ name, description }, { rejectWithValue }) => {
  const response = await skillService.createCategory(name, description);
  return isSuccessResponse(response) ? response : rejectWithValue(response);
});

// Update category (Admin)
export const updateCategory = createAppAsyncThunk<
  SuccessResponse<SkillCategory>,
  { id: string; name: string; description?: string }
>('categories/updateCategory', async ({ id, name, description }, { rejectWithValue }) => {
  const response = await skillService.updateCategory(id, name, description);
  return isSuccessResponse(response) ? response : rejectWithValue(response);
});

// Delete category (Admin)
export const deleteCategory = createAppAsyncThunk<SuccessResponse<void>, string>(
  'categories/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    const response = await skillService.deleteCategory(id);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);
