import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction,
  EntityState,
  createSelector,
} from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { SkillService } from '../../api/services/skillsService';
import {
  ProficiencyLevel,
  Skill,
  SkillCategory,
} from '../../types/models/Skill';
import { UpdateSkillResponse } from '../../types/contracts/responses/UpdateSkillResponse';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { CreateSkillResponse } from '../../types/contracts/responses/CreateSkillResponse';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';

/* --------------------------------
   Typen für asynchrone Requests
-----------------------------------*/
type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/* --------------------------------
   Entity-Adapter
-----------------------------------*/
const skillsAdapter = createEntityAdapter<Skill, string>({
  selectId: (skill) => skill.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const categoriesAdapter = createEntityAdapter<SkillCategory, string>({
  selectId: (category) => category.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const proficiencyLevelsAdapter = createEntityAdapter<ProficiencyLevel, string>({
  selectId: (level) => level.id,
  sortComparer: (a, b) => a.rank - b.rank,
});

/* --------------------------------
   Slice State
-----------------------------------*/
interface SkillsState {
  skills: EntityState<Skill, string>;
  userSkills: EntityState<Skill, string>;
  categories: EntityState<SkillCategory, string>;
  proficiencyLevels: EntityState<ProficiencyLevel, string>;
  selectedSkill?: Skill;
  status: {
    skills: RequestStatus;
    userSkills: RequestStatus;
    categories: RequestStatus;
    proficiencyLevels: RequestStatus;
    createSkill: RequestStatus;
    updateSkill: RequestStatus;
    deleteSkill: RequestStatus;
  };
  error?: string;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  searchQuery: string;
}

const initialState: SkillsState = {
  skills: skillsAdapter.getInitialState(),
  userSkills: skillsAdapter.getInitialState(),
  categories: categoriesAdapter.getInitialState(),
  proficiencyLevels: proficiencyLevelsAdapter.getInitialState(),
  status: {
    skills: 'idle',
    userSkills: 'idle',
    categories: 'idle',
    proficiencyLevels: 'idle',
    createSkill: 'idle',
    updateSkill: 'idle',
    deleteSkill: 'idle',
  },
  pagination: {
    currentPage: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
  },
  searchQuery: '',
};

/* --------------------------------
   Async Thunks
-----------------------------------*/

// Ich kürze nur die Thunks, der Rest des Codes bleibt gleich.
// Ersetze axios durch native Fetch API + Fehlerhandling

function handleApiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Ein unbekannter Fehler ist aufgetreten';
}

export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (
    { page = 1, pageSize = 10 }: { page: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getAllSkills(page, pageSize);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchSkillById = createAsyncThunk<
  Skill,
  string,
  { rejectValue: string }
>('skills/fetchSkillById', async (skillId, { rejectWithValue }) => {
  try {
    return await SkillService.getSkillById(skillId);
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const searchSkills = createAsyncThunk(
  'skills/searchSkills',
  async (
    {
      query,
      page = 1,
      pageSize = 10,
    }: { query: string; page: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getSkillsBySearch(query, page, pageSize);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchUserSkills = createAsyncThunk(
  'skills/fetchUserSkills',
  async (
    {
      page = 1,
      pageSize = 10,
    }: { query: string; page: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getUserSkills(page, pageSize);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchUserSkillById = createAsyncThunk<
  Skill,
  string,
  { rejectValue: string }
>('skills/fetchUserSkillById', async (skillId, { rejectWithValue }) => {
  try {
    return await SkillService.getUserSkillById(skillId);
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const searchUserSkills = createAsyncThunk(
  'skills/searchUserSkills',
  async (
    {
      query,
      page = 1,
      pageSize = 10,
    }: { query: string; page: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getUserSkillsBySearch(query, page, pageSize);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createSkill = createAsyncThunk<
  CreateSkillResponse,
  CreateSkillRequest,
  { rejectValue: string }
>('skills/createSkill', async (skillData, { rejectWithValue }) => {
  try {
    return await SkillService.createSkill(skillData);
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const updateSkill = createAsyncThunk<
  UpdateSkillResponse,
  { skillId: string; updateData: UpdateSkillRequest },
  { rejectValue: string }
>(
  'skills/updateSkill',
  async ({ skillId, updateData }, { rejectWithValue }) => {
    try {
      return await SkillService.updateSkill(skillId, updateData);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteSkill = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('skills/deleteSkill', async (skillId, { rejectWithValue }) => {
  try {
    await SkillService.deleteSkill(skillId);
    return skillId;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchCategories = createAsyncThunk<
  SkillCategory[],
  void,
  { rejectValue: string }
>('skills/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    return await SkillService.getCategories();
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const createCategory = createAsyncThunk<
  SkillCategory,
  string,
  { rejectValue: string }
>('skills/createCategory', async (name, { rejectWithValue }) => {
  try {
    return await SkillService.createCategory(name);
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const updateCategory = createAsyncThunk<
  SkillCategory,
  { id: string; name: string },
  { rejectValue: string }
>('skills/updateCategory', async ({ id, name }, { rejectWithValue }) => {
  try {
    return await SkillService.updateCategory(id, name);
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('skills/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    await SkillService.deleteCategory(id);
    return id;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchProficiencyLevels = createAsyncThunk<
  ProficiencyLevel[],
  void,
  { rejectValue: string }
>('skills/fetchProficiencyLevels', async (_, { rejectWithValue }) => {
  try {
    return await SkillService.getProficiencyLevels();
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const createProficiencyLevel = createAsyncThunk<
  ProficiencyLevel,
  { level: string; rank: number },
  { rejectValue: string }
>(
  'skills/createProficiencyLevel',
  async ({ level, rank }, { rejectWithValue }) => {
    try {
      return await SkillService.createProficiencyLevel(level, rank);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateProficiencyLevel = createAsyncThunk<
  ProficiencyLevel,
  { id: string; level: string; rank: number },
  { rejectValue: string }
>(
  'skills/updateProficiencyLevel',
  async ({ id, level, rank }, { rejectWithValue }) => {
    try {
      return await SkillService.updateProficiencyLevel(id, level, rank);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteProficiencyLevel = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('skills/deleteProficiencyLevel', async (id, { rejectWithValue }) => {
  try {
    await SkillService.deleteProficiencyLevel(id);
    return id;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

/* --------------------------------
   Slice
-----------------------------------*/
const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    setSelectedSkill: (state, action: PayloadAction<Skill | undefined>) => {
      state.selectedSkill = action.payload;
    },
    clearSelectedSkill: (state) => {
      state.selectedSkill = undefined;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<{ page: number; pageSize: number }>
    ) => {
      state.pagination.currentPage = action.payload.page;
      state.pagination.pageSize = action.payload.pageSize;
    },
    resetStatus: (state) => {
      state.status = {
        skills: 'idle',
        userSkills: 'idle',
        categories: 'idle',
        proficiencyLevels: 'idle',
        createSkill: 'idle',
        updateSkill: 'idle',
        deleteSkill: 'idle',
      };
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    // fetchSkills
    builder.addCase(fetchSkills.pending, (state) => {
      state.status.skills = 'loading';
    });
    builder.addCase(fetchSkills.fulfilled, (state, action) => {
      state.status.skills = 'succeeded';
      const payload = action.payload;
      // payload.data enthält das Skill-Array
      skillsAdapter.setAll(state.skills, payload.items);
      // Optional: Paginierung übernehmen, wenn gewünscht
      state.pagination.currentPage = payload.pageNumber;
      state.pagination.pageSize = payload.pageSize;
      state.pagination.totalItems = payload.totalCount;
      // Z.B. totalPages = totalCount/pageSize, falls gewünscht
      state.pagination.totalPages = Math.ceil(
        payload.totalCount / payload.pageSize
      );
    });
    builder.addCase(fetchSkills.rejected, (state, action) => {
      state.status.skills = 'failed';
      state.error = action.payload as string;
    });

    // fetchSkillById
    builder.addCase(fetchSkillById.pending, (state) => {
      state.status.skills = 'loading';
    });
    builder.addCase(fetchSkillById.fulfilled, (state, action) => {
      state.status.skills = 'succeeded';
      const skill = action.payload;
      state.selectedSkill = skill;
      skillsAdapter.upsertOne(state.skills, skill);
    });
    builder.addCase(fetchSkillById.rejected, (state, action) => {
      state.status.skills = 'failed';
      state.error = action.payload as string;
    });

    // searchSkills
    builder.addCase(searchSkills.pending, (state) => {
      state.status.skills = 'loading';
    });
    builder.addCase(searchSkills.fulfilled, (state, action) => {
      state.status.skills = 'succeeded';
      // Gleiches Spiel wie bei fetchSkills
      const payload = action.payload;
      skillsAdapter.setAll(state.skills, payload.items);
      state.pagination.currentPage = payload.pageNumber;
      state.pagination.pageSize = payload.pageSize;
      state.pagination.totalItems = payload.totalCount;
      state.pagination.totalPages = Math.ceil(
        payload.totalCount / payload.pageSize
      );
    });
    builder.addCase(searchSkills.rejected, (state, action) => {
      state.status.skills = 'failed';
      state.error = action.payload as string;
    });

    // fetchUserSkills
    builder.addCase(fetchUserSkills.pending, (state) => {
      state.status.userSkills = 'loading';
    });
    builder.addCase(fetchUserSkills.fulfilled, (state, action) => {
      state.status.userSkills = 'succeeded';
      const payload = action.payload;
      skillsAdapter.setAll(state.userSkills, payload.items);
      // Paginierung könnte separat oder gemeinsam genutzt werden
    });
    builder.addCase(fetchUserSkills.rejected, (state, action) => {
      state.status.userSkills = 'failed';
      state.error = action.payload as string;
    });

    // fetchUserSkillById
    builder.addCase(fetchUserSkillById.pending, (state) => {
      state.status.userSkills = 'loading';
    });
    builder.addCase(fetchUserSkillById.fulfilled, (state, action) => {
      state.status.userSkills = 'succeeded';
      const skill = action.payload;
      state.selectedSkill = skill;
      skillsAdapter.upsertOne(state.userSkills, skill);
    });
    builder.addCase(fetchUserSkillById.rejected, (state, action) => {
      state.status.userSkills = 'failed';
      state.error = action.payload as string;
    });

    // searchUserSkills
    builder.addCase(searchUserSkills.pending, (state) => {
      state.status.userSkills = 'loading';
    });
    builder.addCase(searchUserSkills.fulfilled, (state, action) => {
      state.status.userSkills = 'succeeded';
      const payload = action.payload;
      skillsAdapter.setAll(state.userSkills, payload.items);
    });
    builder.addCase(searchUserSkills.rejected, (state, action) => {
      state.status.userSkills = 'failed';
      state.error = action.payload as string;
    });

    // createSkill
    builder.addCase(createSkill.pending, (state) => {
      state.status.createSkill = 'loading';
    });
    builder.addCase(createSkill.fulfilled, (state, action) => {
      state.status.createSkill = 'succeeded';
      // createSkillResponse gibt uns z.B. das neu erstellte Skill-Objekt zurück
      const newSkill = action.payload;
      // addOne in userSkills
      skillsAdapter.addOne(state.userSkills, {
        // Name, Description, usw. anpassen, wenn sich Felder unterscheiden
        ...newSkill,
      } as unknown as Skill);
    });
    builder.addCase(createSkill.rejected, (state, action) => {
      state.status.createSkill = 'failed';
      state.error = action.payload as string;
    });

    // updateSkill
    builder.addCase(updateSkill.pending, (state) => {
      state.status.updateSkill = 'loading';
    });
    builder.addCase(updateSkill.fulfilled, (state, action) => {
      state.status.updateSkill = 'succeeded';
      const updated = action.payload;
      // Schauen, welche ID Felder du für das updated-Skill hast
      skillsAdapter.updateOne(state.userSkills, {
        id: updated.id,
        changes: updated,
      });
      // Falls in den allgemeinen skills vorhanden, dort auch
      if (state.skills.entities[updated.id]) {
        skillsAdapter.updateOne(state.skills, {
          id: updated.id,
          changes: updated,
        });
      }
      // selectedSkill updaten
      if (state.selectedSkill?.id === updated.id) {
        state.selectedSkill = updated;
      }
    });
    builder.addCase(updateSkill.rejected, (state, action) => {
      state.status.updateSkill = 'failed';
      state.error = action.payload as string;
    });

    // deleteSkill
    builder.addCase(deleteSkill.pending, (state) => {
      state.status.deleteSkill = 'loading';
    });
    builder.addCase(deleteSkill.fulfilled, (state, action) => {
      state.status.deleteSkill = 'succeeded';
      const removedId = action.payload;
      skillsAdapter.removeOne(state.userSkills, removedId);
      skillsAdapter.removeOne(state.skills, removedId);
      if (state.selectedSkill?.id === removedId) {
        state.selectedSkill = undefined;
      }
    });
    builder.addCase(deleteSkill.rejected, (state, action) => {
      state.status.deleteSkill = 'failed';
      state.error = action.payload as string;
    });

    // fetchCategories
    builder.addCase(fetchCategories.pending, (state) => {
      state.status.categories = 'loading';
    });
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.status.categories = 'succeeded';
      categoriesAdapter.setAll(state.categories, action.payload);
    });
    builder.addCase(fetchCategories.rejected, (state, action) => {
      state.status.categories = 'failed';
      state.error = action.payload as string;
    });

    // createCategory
    builder.addCase(createCategory.fulfilled, (state, action) => {
      categoriesAdapter.addOne(state.categories, action.payload);
    });

    // updateCategory
    builder.addCase(updateCategory.fulfilled, (state, action) => {
      categoriesAdapter.updateOne(state.categories, {
        id: action.payload.id,
        changes: action.payload,
      });
    });

    // deleteCategory
    builder.addCase(deleteCategory.fulfilled, (state, action) => {
      const removedId = action.payload;
      categoriesAdapter.removeOne(state.categories, removedId);
    });

    // fetchProficiencyLevels
    builder.addCase(fetchProficiencyLevels.pending, (state) => {
      state.status.proficiencyLevels = 'loading';
    });
    builder.addCase(fetchProficiencyLevels.fulfilled, (state, action) => {
      state.status.proficiencyLevels = 'succeeded';
      proficiencyLevelsAdapter.setAll(state.proficiencyLevels, action.payload);
    });
    builder.addCase(fetchProficiencyLevels.rejected, (state, action) => {
      state.status.proficiencyLevels = 'failed';
      state.error = action.payload as string;
    });

    // createProficiencyLevel
    builder.addCase(createProficiencyLevel.fulfilled, (state, action) => {
      proficiencyLevelsAdapter.addOne(state.proficiencyLevels, action.payload);
    });

    // updateProficiencyLevel
    builder.addCase(updateProficiencyLevel.fulfilled, (state, action) => {
      proficiencyLevelsAdapter.updateOne(state.proficiencyLevels, {
        id: action.payload.id,
        changes: action.payload,
      });
    });

    // deleteProficiencyLevel
    builder.addCase(deleteProficiencyLevel.fulfilled, (state, action) => {
      proficiencyLevelsAdapter.removeOne(
        state.proficiencyLevels,
        action.payload
      );
    });
  },
});

/* --------------------------------
   Exportierte Aktionen
-----------------------------------*/
export const {
  setSelectedSkill,
  clearSelectedSkill,
  setSearchQuery,
  setPagination,
  resetStatus,
} = skillsSlice.actions;

/* --------------------------------
   Selektoren
-----------------------------------*/
const selectSkillsFeature = (state: RootState) => state.skills;

// Skills-Adapter-Selektoren
export const { selectAll: selectAllSkills, selectById: selectSkillById } =
  skillsAdapter.getSelectors((state: RootState) => state.skills.skills);

export const {
  selectAll: selectAllUserSkills,
  selectById: selectUserSkillById,
} = skillsAdapter.getSelectors((state: RootState) => state.skills.userSkills);

// Category-Adapter-Selektoren
export const {
  selectAll: selectAllCategories,
  selectById: selectCategoryById,
} = categoriesAdapter.getSelectors(
  (state: RootState) => state.skills.categories
);

// ProficiencyLevels-Adapter-Selektoren
export const {
  selectAll: selectAllProficiencyLevels,
  selectById: selectProficiencyLevelById,
} = proficiencyLevelsAdapter.getSelectors(
  (state: RootState) => state.skills.proficiencyLevels
);

// Zusätzliche Selektoren
export const selectSelectedSkill = createSelector(
  [selectSkillsFeature],
  (skillsState) => skillsState.selectedSkill
);

export const selectSkillsStatus = createSelector(
  [selectSkillsFeature],
  (skillsState) => skillsState.status
);

export const selectSkillsError = createSelector(
  [selectSkillsFeature],
  (skillsState) => skillsState.error
);

export const selectSkillsPagination = createSelector(
  [selectSkillsFeature],
  (skillsState) => skillsState.pagination
);

export const selectSkillsSearchQuery = createSelector(
  [selectSkillsFeature],
  (skillsState) => skillsState.searchQuery
);

/* --------------------------------
   Reducer
-----------------------------------*/
export default skillsSlice.reducer;
