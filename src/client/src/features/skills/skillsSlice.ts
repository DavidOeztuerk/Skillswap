import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction,
  EntityState,
} from '@reduxjs/toolkit';
import {
  Skill,
  SkillCategory,
  ProficiencyLevel,
} from '../../types/models/Skill';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import { RootState } from '../../store/store';
import { SkillService } from '../../api/services/skillsService';
import axios from 'axios';

// Status-Typ für asynchrone Anfragen
type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// Entity-Adapter für Skills
const skillsAdapter = createEntityAdapter<Skill, string>({
  selectId: (skill) => skill.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Entity-Adapter für Kategorien
const categoriesAdapter = createEntityAdapter<SkillCategory, string>({
  selectId: (category) => category.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Entity-Adapter für Fertigkeitsstufen
const proficiencyLevelsAdapter = createEntityAdapter<ProficiencyLevel, string>({
  selectId: (level) => level.id,
  sortComparer: (a, b) => a.rank - b.rank,
});

// Definition der Schnittstellenstruktur für den Zustand
interface SkillsState {
  skills: EntityState<Skill, string>;
  userSkills: EntityState<Skill, string>;
  categories: EntityState<SkillCategory, string>;
  proficiencyLevels: EntityState<ProficiencyLevel, string>;
  selectedSkill: Skill | undefined;
  status: {
    skills: RequestStatus;
    userSkills: RequestStatus;
    categories: RequestStatus;
    proficiencyLevels: RequestStatus;
    createSkill: RequestStatus;
    updateSkill: RequestStatus;
    deleteSkill: RequestStatus;
  };
  error: string | undefined;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  searchQuery: string;
}

// Initialer Zustand
const initialState: SkillsState = {
  skills: skillsAdapter.getInitialState(),
  userSkills: skillsAdapter.getInitialState(),
  categories: categoriesAdapter.getInitialState(),
  proficiencyLevels: proficiencyLevelsAdapter.getInitialState(),
  selectedSkill: undefined,
  status: {
    skills: 'idle',
    userSkills: 'idle',
    categories: 'idle',
    proficiencyLevels: 'idle',
    createSkill: 'idle',
    updateSkill: 'idle',
    deleteSkill: 'idle',
  },
  error: undefined,
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  },
  searchQuery: '',
};

// *** Async-Thunks für Skill-Operationen ***

// Alle Skills abrufen
export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (
    { page = 1, pageSize = 10 }: { page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getAllSkills(page, pageSize);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Skill nach ID abrufen
export const fetchSkillById = createAsyncThunk(
  'skills/fetchSkillById',
  async (skillId: string, { rejectWithValue }) => {
    try {
      return await SkillService.getSkillById(skillId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Skills nach Suchbegriff filtern
export const searchSkills = createAsyncThunk(
  'skills/searchSkills',
  async (
    {
      query,
      page = 1,
      pageSize = 10,
    }: { query: string; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getSkillsBySearch(query, page, pageSize);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Skills des angemeldeten Benutzers abrufen
export const fetchUserSkills = createAsyncThunk(
  'skills/fetchUserSkills',
  async (
    { page = 1, pageSize = 10 }: { page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getUserSkills(page, pageSize);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Benutzer-Skill nach ID abrufen
export const fetchUserSkillById = createAsyncThunk(
  'skills/fetchUserSkillById',
  async (skillId: string, { rejectWithValue }) => {
    try {
      return await SkillService.getUserSkillById(skillId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Benutzer-Skills nach Suchbegriff filtern
export const searchUserSkills = createAsyncThunk(
  'skills/searchUserSkills',
  async (
    {
      query,
      page = 1,
      pageSize = 10,
    }: { query: string; page?: number; pageSize?: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.getUserSkillsBySearch(query, page, pageSize);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Neuen Skill erstellen
export const createSkill = createAsyncThunk(
  'skills/createSkill',
  async (skillData: CreateSkillRequest, { rejectWithValue }) => {
    try {
      return await SkillService.createSkill(skillData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Skill aktualisieren
export const updateSkill = createAsyncThunk(
  'skills/updateSkill',
  async (
    {
      skillId,
      updateData,
    }: { skillId: string; updateData: UpdateSkillRequest },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.updateSkill(skillId, updateData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Skill löschen
export const deleteSkill = createAsyncThunk(
  'skills/deleteSkill',
  async (skillId: string, { rejectWithValue }) => {
    try {
      await SkillService.deleteSkill(skillId);
      return skillId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// *** Async-Thunks für Kategorie-Operationen ***

// Alle Kategorien abrufen
export const fetchCategories = createAsyncThunk(
  'skills/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await SkillService.getCategories();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Neue Kategorie erstellen
export const createCategory = createAsyncThunk(
  'skills/createCategory',
  async (name: string, { rejectWithValue }) => {
    try {
      return await SkillService.createCategory(name);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Kategorie aktualisieren
export const updateCategory = createAsyncThunk(
  'skills/updateCategory',
  async ({ id, name }: { id: string; name: string }, { rejectWithValue }) => {
    try {
      return await SkillService.updateCategory(id, name);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Kategorie löschen
export const deleteCategory = createAsyncThunk(
  'skills/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      await SkillService.deleteCategory(id);
      return id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// *** Async-Thunks für Fertigkeitsstufen-Operationen ***

// Alle Fertigkeitsstufen abrufen
export const fetchProficiencyLevels = createAsyncThunk(
  'skills/fetchProficiencyLevels',
  async (_, { rejectWithValue }) => {
    try {
      return await SkillService.getProficiencyLevels();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Neue Fertigkeitsstufe erstellen
export const createProficiencyLevel = createAsyncThunk(
  'skills/createProficiencyLevel',
  async (
    { level, rank }: { level: string; rank: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.createProficiencyLevel(level, rank);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Fertigkeitsstufe aktualisieren
export const updateProficiencyLevel = createAsyncThunk(
  'skills/updateProficiencyLevel',
  async (
    { id, level, rank }: { id: string; level: string; rank: number },
    { rejectWithValue }
  ) => {
    try {
      return await SkillService.updateProficiencyLevel(id, level, rank);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Fertigkeitsstufe löschen
export const deleteProficiencyLevel = createAsyncThunk(
  'skills/deleteProficiencyLevel',
  async (id: string, { rejectWithValue }) => {
    try {
      await SkillService.deleteProficiencyLevel(id);
      return id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            'Fehler beim Abrufen der Skills'
        );
      }
    }
  }
);

// Skill-Slice
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
    // *** Allgemeine Skills-Operationen ***

    // fetchSkills
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.status.skills = 'loading';
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.status.skills = 'succeeded';
        if (action.payload) {
          skillsAdapter.setAll(state.skills, action.payload);
        }
        // Hier könnten wir Paginierungs-Metadaten aktualisieren, wenn sie von der API geliefert würden
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.status.skills = 'failed';
        state.error = action.payload as string;
      })

      // fetchSkillById
      .addCase(fetchSkillById.pending, (state) => {
        state.status.skills = 'loading';
      })
      .addCase(fetchSkillById.fulfilled, (state, action) => {
        state.status.skills = 'succeeded';
        state.selectedSkill = action.payload;
        if (action.payload) {
          skillsAdapter.upsertOne(state.skills, action.payload);
        }
      })
      .addCase(fetchSkillById.rejected, (state, action) => {
        state.status.skills = 'failed';
        state.error = action.payload as string;
      })

      // searchSkills
      .addCase(searchSkills.pending, (state) => {
        state.status.skills = 'loading';
      })
      .addCase(searchSkills.fulfilled, (state, action) => {
        state.status.skills = 'succeeded';
        if (action.payload) {
          skillsAdapter.setAll(state.skills, action.payload);
        }
      })
      .addCase(searchSkills.rejected, (state, action) => {
        state.status.skills = 'failed';
        state.error = action.payload as string;
      })

      // *** Benutzerspezifische Skills-Operationen ***

      // fetchUserSkills
      .addCase(fetchUserSkills.pending, (state) => {
        state.status.userSkills = 'loading';
      })
      .addCase(fetchUserSkills.fulfilled, (state, action) => {
        state.status.userSkills = 'succeeded';
        if (action.payload) {
          skillsAdapter.setAll(state.userSkills, action.payload);
        }
      })
      .addCase(fetchUserSkills.rejected, (state, action) => {
        state.status.userSkills = 'failed';
        state.error = action.payload as string;
      })

      // fetchUserSkillById
      .addCase(fetchUserSkillById.pending, (state) => {
        state.status.userSkills = 'loading';
      })
      .addCase(fetchUserSkillById.fulfilled, (state, action) => {
        state.status.userSkills = 'succeeded';
        state.selectedSkill = action.payload;
        if (action.payload) {
          skillsAdapter.upsertOne(state.userSkills, action.payload);
        }
      })
      .addCase(fetchUserSkillById.rejected, (state, action) => {
        state.status.userSkills = 'failed';
        state.error = action.payload as string;
      })

      // searchUserSkills
      .addCase(searchUserSkills.pending, (state) => {
        state.status.userSkills = 'loading';
      })
      .addCase(searchUserSkills.fulfilled, (state, action) => {
        state.status.userSkills = 'succeeded';
        if (action.payload) {
          skillsAdapter.setAll(state.userSkills, action.payload);
        }
      })
      .addCase(searchUserSkills.rejected, (state, action) => {
        state.status.userSkills = 'failed';
        state.error = action.payload as string;
      })

      // *** CRUD-Operationen für Skills ***

      // createSkill
      .addCase(createSkill.pending, (state) => {
        state.status.createSkill = 'loading';
      })
      .addCase(createSkill.fulfilled, (state, action) => {
        state.status.createSkill = 'succeeded';
        if (action.payload) {
          skillsAdapter.addOne(state.userSkills, action.payload);
        }
      })
      .addCase(createSkill.rejected, (state, action) => {
        state.status.createSkill = 'failed';
        state.error = action.payload as string;
      })

      // updateSkill
      .addCase(updateSkill.pending, (state) => {
        state.status.updateSkill = 'loading';
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.status.updateSkill = 'succeeded';
        if (action.payload) {
          skillsAdapter.updateOne(state.userSkills, {
            id: action.payload.id,
            changes: action.payload,
          });
        }

        // Wenn es auch in der allgemeinen Skills-Liste ist, aktualisieren wir das auch
        if (
          action.payload &&
          skillsAdapter
            .getSelectors()
            .selectById(state.skills, action.payload.id)
        ) {
          skillsAdapter.updateOne(state.skills, {
            id: action.payload.id,
            changes: action.payload,
          });
        }
        // Wenn es der ausgewählte Skill ist, aktualisieren wir auch diesen
        if (action.payload && state.selectedSkill?.id === action.payload.id) {
          state.selectedSkill = action.payload;
        }
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.status.updateSkill = 'failed';
        state.error = action.payload as string;
      })

      // deleteSkill
      .addCase(deleteSkill.pending, (state) => {
        state.status.deleteSkill = 'loading';
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.status.deleteSkill = 'succeeded';
        if (action.payload) {
          skillsAdapter.removeOne(state.userSkills, action.payload);
          skillsAdapter.removeOne(state.skills, action.payload);
          if (state.selectedSkill?.id === action.payload) {
            state.selectedSkill = undefined;
          }
        }
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.status.deleteSkill = 'failed';
        state.error = action.payload as string;
      })

      // *** Kategorie-Operationen ***

      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.status.categories = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status.categories = 'succeeded';
        if (action.payload) {
          categoriesAdapter.setAll(state.categories, action.payload);
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status.categories = 'failed';
        state.error = action.payload as string;
      })

      // createCategory
      .addCase(createCategory.fulfilled, (state, action) => {
        if (action.payload) {
          categoriesAdapter.addOne(state.categories, action.payload);
        }
      })

      // updateCategory
      .addCase(updateCategory.fulfilled, (state, action) => {
        if (action.payload) {
          categoriesAdapter.updateOne(state.categories, {
            id: action.payload.id,
            changes: action.payload,
          });
        }
      })

      // deleteCategory
      .addCase(deleteCategory.fulfilled, (state, action) => {
        if (action.payload) {
          categoriesAdapter.removeOne(state.categories, action.payload);
        }
      })

      // *** Fertigkeitsstufen-Operationen ***

      // fetchProficiencyLevels
      .addCase(fetchProficiencyLevels.pending, (state) => {
        state.status.proficiencyLevels = 'loading';
      })
      .addCase(fetchProficiencyLevels.fulfilled, (state, action) => {
        state.status.proficiencyLevels = 'succeeded';
        if (action.payload) {
          proficiencyLevelsAdapter.setAll(
            state.proficiencyLevels,
            action.payload
          );
        }
      })
      .addCase(fetchProficiencyLevels.rejected, (state, action) => {
        state.status.proficiencyLevels = 'failed';
        state.error = action.payload as string;
      })

      // createProficiencyLevel
      .addCase(createProficiencyLevel.fulfilled, (state, action) => {
        if (action.payload) {
          proficiencyLevelsAdapter.addOne(
            state.proficiencyLevels,
            action.payload
          );
        }
      })

      // updateProficiencyLevel
      .addCase(updateProficiencyLevel.fulfilled, (state, action) => {
        if (action.payload) {
          proficiencyLevelsAdapter.updateOne(state.proficiencyLevels, {
            id: action.payload.id,
            changes: action.payload,
          });
        }
      })

      // deleteProficiencyLevel
      .addCase(deleteProficiencyLevel.fulfilled, (state, action) => {
        if (action.payload) {
          proficiencyLevelsAdapter.removeOne(
            state.proficiencyLevels,
            action.payload
          );
        }
      });
  },
});

// Aktionen aus dem Slice exportieren
export const {
  setSelectedSkill,
  clearSelectedSkill,
  setSearchQuery,
  setPagination,
  resetStatus,
} = skillsSlice.actions;

// Selektoren erstellen
// Allgemeine Skills
export const {
  selectAll: selectAllSkills,
  selectById: selectSkillById,
  selectIds: selectSkillIds,
} = skillsAdapter.getSelectors<RootState>((state) => state.skills.skills);

// Benutzer-Skills
export const {
  selectAll: selectAllUserSkills,
  selectById: selectUserSkillById,
  selectIds: selectUserSkillIds,
} = skillsAdapter.getSelectors<RootState>((state) => state.skills.userSkills);

// Kategorien
export const {
  selectAll: selectAllCategories,
  selectById: selectCategoryById,
  selectIds: selectCategoryIds,
} = categoriesAdapter.getSelectors<RootState>(
  (state) => state.skills.categories
);

// Fertigkeitsstufen
export const {
  selectAll: selectAllProficiencyLevels,
  selectById: selectProficiencyLevelById,
  selectIds: selectProficiencyLevelIds,
} = proficiencyLevelsAdapter.getSelectors<RootState>(
  (state) => state.skills.proficiencyLevels
);

// Zusätzliche Selektoren
export const selectSelectedSkill = (state: RootState) =>
  state.skills.selectedSkill;
export const selectSkillsStatus = (state: RootState) => state.skills.status;
export const selectSkillsError = (state: RootState) => state.skills.error;
export const selectSkillsPagination = (state: RootState) =>
  state.skills.pagination;
export const selectSkillsSearchQuery = (state: RootState) =>
  state.skills.searchQuery;

export default skillsSlice.reducer;
