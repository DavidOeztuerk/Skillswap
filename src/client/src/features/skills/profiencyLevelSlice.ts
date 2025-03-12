import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { ProficiencyLevel } from '../../types/models/Skill';
import { SkillService } from '../../api/services/skillsService';
import { RootState } from '../../store/store';

// Entity Adapter für effizientes State-Handling
const proficiencyAdapter = createEntityAdapter<ProficiencyLevel, string>({
  selectId: (level) => level.id,
  sortComparer: (a, b) => a.rank - b.rank,
});

// Initial State
const initialState = proficiencyAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null as string | null,
});

// API Call für Proficiency Levels
export const fetchProficiencyLevels = createAsyncThunk(
  'proficiencyLevels/fetchProficiencyLevels',
  async () => {
    const response = await SkillService.getProficiencyLevels();
    return response;
  }
);

// Redux Slice
const proficiencyLevelSlice = createSlice({
  name: 'proficiencyLevels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProficiencyLevels.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProficiencyLevels.fulfilled, (state, action) => {
        state.status = 'succeeded';
        proficiencyAdapter.setAll(state, action.payload);
      })
      .addCase(fetchProficiencyLevels.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Fehler beim Laden der Levels';
      });
  },
});

// Selektoren für UI
export const {
  selectAll: selectAllProficiencyLevels,
  selectById: selectProficiencyLevelById,
} = proficiencyAdapter.getSelectors((state: RootState) => state.proficiencyLevel);

export const selectProficiencyStatus = (state: RootState) => state.proficiencyLevel.status;
export const selectProficiencyError = (state: RootState) => state.proficiencyLevel.error;

export default proficiencyLevelSlice.reducer;
