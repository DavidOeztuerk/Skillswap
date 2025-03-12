import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from '@reduxjs/toolkit';
import { SkillCategory } from '../../types/models/Skill';
import { SkillService } from '../../api/services/skillsService';
import { RootState } from '../../store/store';

// EntityAdapter für effizienteres State-Handling
const categoriesAdapter = createEntityAdapter<SkillCategory, string>({
  selectId: (category) => category.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Initial State
const initialState = categoriesAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null as string | null,
});

// API Call für Kategorien laden
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await SkillService.getCategories();
    return response;
  }
);

// Redux Slice
const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        categoriesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.error.message || 'Fehler beim Laden der Kategorien';
      });
  },
});

// Selektoren für UI
export const {
  selectAll: selectAllCategories,
  selectById: selectCategoryById,
} = categoriesAdapter.getSelectors((state: RootState) => state.category);

export const selectCategoryStatus = (state: RootState) => state.category.status;
export const selectCategoryError = (state: RootState) => state.category.error;

export default categorySlice.reducer;
