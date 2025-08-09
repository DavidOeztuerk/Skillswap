// src/features/search/searchSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import skillService from '../../api/services/skillsService';
import { RootState } from '../../store/store';
import { SearchState } from '../../types/states/SearchState';
import { SliceError } from '../../store/types';
import { mapSkillResponseToSkill, mapUserSkillsResponseToSkill } from '../skills/skillsSlice';
import { Skill } from '../../types/models/Skill';
import { ensureArray, withDefault } from '../../utils/safeAccess';

const initialPagination = {
  page: 1,
  pageSize: 12,
  totalItems: 0,
  totalPages: 0,
};

const initialState: SearchState = {
  results: [],
  userResults: [],
  allSkills: [],
  isLoading: false,
  userLoading: false,
  allSkillsLoading: false,
  error: null,
  currentQuery: '',
  pagination: { ...initialPagination },
  userPagination: { ...initialPagination },
  allSkillsPagination: { ...initialPagination },
  lastSearchParams: null,
};

// Async thunks
export const fetchUserSearchResults = createAsyncThunk(
  'search/fetchUserSearchResults',
  async ({ pageNumber = 1, pageSize = 12 }: { pageNumber?: number; pageSize?: number } = {}) => {
    return await skillService.getUserSkills(pageNumber, pageSize);
  }
);

export const fetchAllSkills = createAsyncThunk(
  'search/fetchAllSkills',
  async ({ pageNumber = 1, pageSize = 12 }: { pageNumber?: number; pageSize?: number } = {}) => {
    return await skillService.getAllSkills({ pageNumber, pageSize });
  }
);

// Slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.results = [];
      state.isLoading = false;
      state.error = null;
      state.currentQuery = '';
      state.pagination = { ...initialPagination };
      state.lastSearchParams = null;
    },
    clearUserSearchResults: (state) => {
      state.userResults = [];
      state.userLoading = false;
      state.userPagination = { ...initialPagination };
    },
    clearAllSkillsResults: (state) => {
      state.allSkills = [];
      state.allSkillsLoading = false;
      state.allSkillsPagination = { ...initialPagination };
    },
    clearAllSearchData: () => initialState,
    setCurrentQuery: (state, action: PayloadAction<string>) => {
      state.currentQuery = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ page?: number; pageSize?: number }>) => {
      if (action.payload.page !== undefined) {
        state.pagination.page = action.payload.page;
      }
      if (action.payload.pageSize !== undefined) {
        state.pagination.pageSize = action.payload.pageSize;
      }
    },
    setUserPagination: (state, action: PayloadAction<{ page?: number; pageSize?: number }>) => {
      if (action.payload.page !== undefined) {
        state.userPagination.page = action.payload.page;
      }
      if (action.payload.pageSize !== undefined) {
        state.userPagination.pageSize = action.payload.pageSize;
      }
    },
    setAllSkillsPagination: (state, action: PayloadAction<{ page?: number; pageSize?: number }>) => {
      if (action.payload.page !== undefined) {
        state.allSkillsPagination.page = action.payload.page;
      }
      if (action.payload.pageSize !== undefined) {
        state.allSkillsPagination.pageSize = action.payload.pageSize;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload as SliceError;
    },
    resetSearchState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // User Search Results
      .addCase(fetchUserSearchResults.pending, (state) => {
        state.userLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSearchResults.fulfilled, (state, action) => {
        state.userLoading = false;
        const response = action.payload;

        state.userResults = ensureArray(response?.data).map((skill) => {
          if (skill && 'skillId' in skill) {
            return mapUserSkillsResponseToSkill(skill);
          }
          return skill as Skill;
        });

        state.userPagination = {
          page: withDefault(action.payload?.pageNumber, 1),
          pageSize: withDefault(action.payload?.pageSize, 12),
          totalItems: withDefault(action.payload?.totalRecords, 0),
          totalPages: withDefault(action.payload?.totalPages, 0),
        };
      })
      .addCase(fetchUserSearchResults.rejected, (state, action) => {
        state.userLoading = false;
        state.error = action.error as SliceError
        state.userResults = [];
      })

      // All Skills Search
      .addCase(fetchAllSkills.pending, (state) => {
        state.allSkillsLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSkills.fulfilled, (state, action) => {
        state.allSkillsLoading = false;
        state.allSkills = ensureArray(action.payload?.data).map(mapSkillResponseToSkill);
        state.allSkillsPagination = {
          page: withDefault(action.payload?.pageNumber, 1),
          pageSize: withDefault(action.payload?.pageSize, 12),
          totalItems: withDefault(action.payload?.totalRecords, 0),
          totalPages: withDefault(action.payload?.totalPages, 0),
        };
      })
      .addCase(fetchAllSkills.rejected, (state, action) => {
        state.allSkillsLoading = false;
        state.error = action.error as SliceError;
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

// Selectors
export const selectSearchResults = (state: RootState) => state.search.results;
export const selectUserSearchResults = (state: RootState) => state.search.userResults;
export const selectAllSkillsResults = (state: RootState) => state.search.allSkills;
export const selectSearchLoading = (state: RootState) => state.search.isLoading;
export const selectUserSearchLoading = (state: RootState) => state.search.userLoading;
export const selectAllSkillsLoading = (state: RootState) => state.search.allSkillsLoading;
export const selectSearchError = (state: RootState) => state.search.error;
export const selectCurrentQuery = (state: RootState) => state.search.currentQuery;
export const selectSearchPagination = (state: RootState) => state.search.pagination;
export const selectUserSearchPagination = (state: RootState) => state.search.userPagination;
export const selectAllSkillsPagination = (state: RootState) => state.search.allSkillsPagination;
export const selectIsAnySearchLoading = (state: RootState) => 
  state.search.isLoading || state.search.userLoading || state.search.allSkillsLoading;

export default searchSlice.reducer;