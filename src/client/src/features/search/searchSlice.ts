import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Skill } from '../../types/models/Skill';
import skillService, {
  SkillSearchParams,
} from '../../api/services/skillsService';
import { RootState } from '../../store/store';

// Enhanced search parameters interface
interface SearchParams extends SkillSearchParams {
  page?: number;
  pageSize?: number;
}

// Async Thunk for general skill search

// Async Thunk for user skill search
export const fetchUserSearchResults = createAsyncThunk(
  'search/fetchUserSearchResults',
  async (
    { page = 1, pageSize = 12 }: { page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await skillService.getUserSkills(page, pageSize);
      return response;
    } catch (error) {
      console.error('User search results thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'User skills search failed'
      );
    }
  }
);

// Async Thunk for general skills search
export const fetchAllSkills = createAsyncThunk(
  'search/fetchAllSkills',
  async (
    { page = 1, pageSize = 12 }: { page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await skillService.getAllSkills({ page, pageSize });
      return response;
    } catch (error) {
      console.error('All skills search thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Skills search failed'
      );
    }
  }
);

interface SearchState {
  results: Skill[];
  userResults: Skill[];
  allSkills: Skill[];
  loading: boolean;
  userLoading: boolean;
  allSkillsLoading: boolean;
  error: string | null;
  userError: string | null;
  allSkillsError: string | null;
  currentQuery: string;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  userPagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  allSkillsPagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  lastSearchParams: SearchParams | null;
}

const initialState: SearchState = {
  results: [],
  userResults: [],
  allSkills: [],
  loading: false,
  userLoading: false,
  allSkillsLoading: false,
  error: null,
  userError: null,
  allSkillsError: null,
  currentQuery: '',
  pagination: {
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
  },
  userPagination: {
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
  },
  allSkillsPagination: {
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
  },
  lastSearchParams: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    /**
     * Clear all search results
     */
    clearSearchResults: (state) => {
      state.results = [];
      state.loading = false;
      state.error = null;
      state.currentQuery = '';
      state.pagination = initialState.pagination;
      state.lastSearchParams = null;
    },

    /**
     * Clear user search results
     */
    clearUserSearchResults: (state) => {
      state.userResults = [];
      state.userLoading = false;
      state.userError = null;
      state.userPagination = initialState.userPagination;
    },

    /**
     * Clear all skills results
     */
    clearAllSkillsResults: (state) => {
      state.allSkills = [];
      state.allSkillsLoading = false;
      state.allSkillsError = null;
      state.allSkillsPagination = initialState.allSkillsPagination;
    },

    /**
     * Clear all search data
     */
    clearAllSearchData: (state) => {
      Object.assign(state, initialState);
    },

    /**
     * Set current search query
     */
    setCurrentQuery: (state, action: PayloadAction<string>) => {
      state.currentQuery = action.payload;
    },

    /**
     * Set pagination for main search
     */
    setPagination: (
      state,
      action: PayloadAction<{ page?: number; pageSize?: number }>
    ) => {
      if (action.payload.page !== undefined) {
        state.pagination.page = action.payload.page;
      }
      if (action.payload.pageSize !== undefined) {
        state.pagination.pageSize = action.payload.pageSize;
      }
    },

    /**
     * Set pagination for user search
     */
    setUserPagination: (
      state,
      action: PayloadAction<{ page?: number; pageSize?: number }>
    ) => {
      if (action.payload.page !== undefined) {
        state.userPagination.page = action.payload.page;
      }
      if (action.payload.pageSize !== undefined) {
        state.userPagination.pageSize = action.payload.pageSize;
      }
    },

    /**
     * Set pagination for all skills search
     */
    setAllSkillsPagination: (
      state,
      action: PayloadAction<{ page?: number; pageSize?: number }>
    ) => {
      if (action.payload.page !== undefined) {
        state.allSkillsPagination.page = action.payload.page;
      }
      if (action.payload.pageSize !== undefined) {
        state.allSkillsPagination.pageSize = action.payload.pageSize;
      }
    },

    /**
     * Set loading state manually
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error manually
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Reset entire search state
     */
    resetSearchState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // User search results cases
      .addCase(fetchUserSearchResults.pending, (state) => {
        state.userLoading = true;
        state.userError = null;
      })
      .addCase(fetchUserSearchResults.fulfilled, (state, action) => {
        state.userLoading = false;
        state.userResults = action.payload.data;
        state.userPagination = {
          page: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalItems: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
        };
        state.userError = null;
      })
      .addCase(fetchUserSearchResults.rejected, (state, action) => {
        state.userLoading = false;
        state.userError = action.payload as string;
        state.userResults = [];
      })

      // All skills search results cases
      .addCase(fetchAllSkills.pending, (state) => {
        state.allSkillsLoading = true;
        state.allSkillsError = null;
      })
      .addCase(fetchAllSkills.fulfilled, (state, action) => {
        state.allSkillsLoading = false;
        state.allSkills = action.payload.data;
        state.allSkillsPagination = {
          page: action.payload.pageNumber,
          pageSize: action.payload.pageSize,
          totalItems: action.payload.totalRecords,
          totalPages: action.payload.totalPages,
        };
        state.allSkillsError = null;
      })
      .addCase(fetchAllSkills.rejected, (state, action) => {
        state.allSkillsLoading = false;
        state.allSkillsError = action.payload as string;
        state.allSkills = [];
      });
  },
});

// Export actions
export const {
  clearSearchResults,
  clearUserSearchResults,
  clearAllSkillsResults,
  clearAllSearchData,
  setCurrentQuery,
  setPagination,
  setUserPagination,
  setAllSkillsPagination,
  setLoading,
  setError,
  resetSearchState,
} = searchSlice.actions;

export default searchSlice.reducer;

// Enhanced selector functions
export const selectSearchResults = (state: RootState) => state.search.results;
export const selectUserSearchResults = (state: RootState) =>
  state.search.userResults;
export const selectAllSkillsResults = (state: RootState) =>
  state.search.allSkills;

export const selectSearchLoading = (state: RootState) => state.search.loading;
export const selectUserSearchLoading = (state: RootState) =>
  state.search.userLoading;
export const selectAllSkillsLoading = (state: RootState) =>
  state.search.allSkillsLoading;

export const selectSearchError = (state: RootState) => state.search.error;
export const selectUserSearchError = (state: RootState) =>
  state.search.userError;
export const selectAllSkillsError = (state: RootState) =>
  state.search.allSkillsError;

export const selectCurrentQuery = (state: RootState) =>
  state.search.currentQuery;
export const selectLastSearchParams = (state: RootState) =>
  state.search.lastSearchParams;

export const selectSearchPagination = (state: RootState) =>
  state.search.pagination;
export const selectUserSearchPagination = (state: RootState) =>
  state.search.userPagination;
export const selectAllSkillsPagination = (state: RootState) =>
  state.search.allSkillsPagination;

// Combined selectors for convenience
export const selectIsAnySearchLoading = (state: RootState) =>
  state.search.loading ||
  state.search.userLoading ||
  state.search.allSkillsLoading;

export const selectHasAnySearchError = (state: RootState) =>
  Boolean(
    state.search.error || state.search.userError || state.search.allSkillsError
  );

export const selectSearchState = (state: RootState) => state.search;
