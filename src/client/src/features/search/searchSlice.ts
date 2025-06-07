import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Skill } from '../../types/models/Skill';
import { SkillService } from '../../api/services/skillsService';
import { RootState } from '../../store/store';
// import axios from 'axios';
import { PaginatedResponse } from '../../types/common/PaginatedResponse';

// Async Thunk für die Suche mit dynamischer Pagination
export const fetchSearchResults = createAsyncThunk(
  'search/fetchSearchResults',
  async (
    {
      query,
      page,
      pageSize,
    }: { query: string; page: number; pageSize: number },
    // { rejectWithValue }
  ) => {
    try {
      const response = await SkillService.getSkillsBySearch(
        query,
        page,
        pageSize
      );
      return response;
    } catch  {
      // if (axios.isAxiosError(error)) {
      //   return rejectWithValue(error.message);
      // }
    }
  }
);

interface SearchState {
  results: Skill[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
}

const initialState: SearchState = {
  results: [],
  loading: false,
  error: null,
  page: 1,
  pageSize: 12,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.results = [];
      state.loading = false;
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSearchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = (action.payload as unknown as PaginatedResponse<Skill>).results || [];
      })
      .addCase(fetchSearchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSearchResults, setPage, setPageSize } = searchSlice.actions;
export default searchSlice.reducer;

// Selector-Funktionen
export const selectSearchResults = (state: RootState) => state.search.results;
export const selectSearchLoading = (state: RootState) => state.search.loading;
export const selectSearchError = (state: RootState) => state.search.error;
export const selectSearchPage = (state: RootState) => state.search.page;
export const selectSearchPageSize = (state: RootState) => state.search.pageSize;
