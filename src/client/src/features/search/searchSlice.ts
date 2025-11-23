import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Skill } from '../../types/models/Skill';
import { withDefault, isDefined } from '../../utils/safeAccess';
import { initialPagination, initialSearchState } from '../../store/adapters/searchAdapter+State';
import { fetchUserSearchResults, fetchAllSkills } from './searchThunks';
import { mapSkillResponseToSkill, mapUserSkillsResponseToSkill } from '../../store/adapters/skillsAdapter+State';

// Slice
const searchSlice = createSlice({
  name: 'search',
  initialState: initialSearchState,
  reducers: {
    clearSearchResults: (state) => {
      state.results = [];
      state.isLoading = false;
      state.errorMessage = undefined;
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
    clearAllSearchData: () => initialSearchState,
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
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.errorMessage = action.payload.message;
    },
    resetSearchState: () => initialSearchState,
  },
  extraReducers: (builder) => {
    builder
      // User Search Results
      .addCase(fetchUserSearchResults.pending, (state) => {
        state.userLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchUserSearchResults.fulfilled, (state, action) => {
        state.userLoading = false;
        if (isDefined(action.payload.data)) {
          state.userResults = action.payload.data.map((skill) => {
            if (skill && 'skillId' in skill) {
              return mapUserSkillsResponseToSkill(skill);
            }
            return skill as Skill;
          });
        } else {
          state.userResults = [];
        }

        state.userPagination = {
          page: withDefault(action.payload.pageNumber, 1),
          pageSize: withDefault(action.payload.pageSize, 12),
          totalItems: withDefault(action.payload.totalRecords, 0),
          totalPages: withDefault(action.payload.totalPages, 0),
        };
      })
      .addCase(fetchUserSearchResults.rejected, (state, action) => {
        state.userLoading = false;
        state.errorMessage = action.payload?.message;
        state.userResults = [];
      })

      // All Skills Search
      .addCase(fetchAllSkills.pending, (state) => {
        state.allSkillsLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchAllSkills.fulfilled, (state, action) => {
        state.allSkillsLoading = false;
        if (isDefined(action.payload.data)) {
          state.allSkills = action.payload.data.map(mapSkillResponseToSkill);
        } else {
          state.allSkills = [];
        }
        state.allSkillsPagination = {
          page: withDefault(action.payload.pageNumber, 1),
          pageSize: withDefault(action.payload.pageSize, 12),
          totalItems: withDefault(action.payload.totalRecords, 0),
          totalPages: withDefault(action.payload.totalPages, 0),
        };
      })
      .addCase(fetchAllSkills.rejected, (state, action) => {
        state.allSkillsLoading = false;
        state.errorMessage = action.payload?.message;
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