// src/features/skills/skillsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import skillsService from '../../api/services/skillsService';
import { SkillState } from '../../types/states/SkillState';
import { AddUserSkillRequest } from '../../types/contracts/requests/AddUserSkillRequest';
import { Skill, SkillCategory } from '../../types/models/Skill';

// Initialer State für den Skills-Reducer
const initialState: SkillState = {
  skills: [],
  userSkills: [],
  filteredSkills: [],
  searchTerm: '',
  selectedCategory: null,
  isLoading: false,
  error: null,
};

// Async Thunk für das Laden aller Skills
export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (_, { rejectWithValue }) => {
    try {
      const response = await skillsService.getSkills();
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Skills konnten nicht geladen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Skills konnten nicht geladen werden'
      );
    }
  }
);

// Async Thunk für das Laden der Benutzer-Skills
export const fetchUserSkills = createAsyncThunk(
  'skills/fetchUserSkills',
  async (_, { rejectWithValue }) => {
    try {
      const response = await skillsService.getUserSkills();
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Benutzer-Skills konnten nicht geladen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Benutzer-Skills konnten nicht geladen werden'
      );
    }
  }
);

// Async Thunk für die Suche nach Skills
export const searchSkills = createAsyncThunk(
  'skills/searchSkills',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await skillsService.searchSkills(query);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Skills konnten nicht gesucht werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Skills konnten nicht gesucht werden'
      );
    }
  }
);

// Async Thunk für das Hinzufügen eines Skills zum Benutzerprofil
export const addUserSkill = createAsyncThunk(
  'skills/addUserSkill',
  async (skillData: AddUserSkillRequest, { rejectWithValue }) => {
    try {
      const response = await skillsService.addUserSkill(skillData);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Skill konnte nicht hinzugefügt werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Skill konnte nicht hinzugefügt werden'
      );
    }
  }
);

// Async Thunk für das Aktualisieren eines Benutzer-Skills
export const updateUserSkill = createAsyncThunk(
  'skills/updateUserSkill',
  async (
    {
      userSkillId,
      skillData,
    }: {
      userSkillId: string;
      skillData: Partial<AddUserSkillRequest>;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await skillsService.updateUserSkill(
        userSkillId,
        skillData
      );
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Skill konnte nicht aktualisiert werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Skill konnte nicht aktualisiert werden'
      );
    }
  }
);

// Async Thunk für das Entfernen eines Skills vom Benutzerprofil
export const removeUserSkill = createAsyncThunk(
  'skills/removeUserSkill',
  async (skillId: string, { rejectWithValue }) => {
    try {
      await skillsService.removeUserSkill(skillId);
      return skillId;
      // if (response.success) {
      //   return skillId;
      // }
      // return rejectWithValue(
      //   response.message || 'Skill konnte nicht entfernt werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Skill konnte nicht entfernt werden'
      );
    }
  }
);

// Skills Slice
const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.filteredSkills = filterSkills(
        state.skills,
        action.payload,
        state.selectedCategory
      );
    },
    setSelectedCategory: (
      state,
      action: PayloadAction<SkillCategory | null>
    ) => {
      state.selectedCategory = action.payload;
      state.filteredSkills = filterSkills(
        state.skills,
        state.searchTerm,
        action.payload
      );
    },
    clearFilters: (state) => {
      state.searchTerm = '';
      state.selectedCategory = null;
      state.filteredSkills = [...state.skills];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Skills
      .addCase(fetchSkills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.skills = action.payload;
        state.filteredSkills = filterSkills(
          action.payload,
          state.searchTerm,
          state.selectedCategory
        );
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch User Skills
      .addCase(fetchUserSkills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userSkills = action.payload;
      })
      .addCase(fetchUserSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search Skills
      .addCase(searchSkills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredSkills = action.payload;
      })
      .addCase(searchSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add User Skill
      .addCase(addUserSkill.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addUserSkill.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userSkills.push(action.payload);
      })
      .addCase(addUserSkill.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update User Skill
      .addCase(updateUserSkill.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserSkill.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.userSkills.findIndex(
          (skill) => skill.id === action.payload.id
        );
        if (index !== -1) {
          state.userSkills[index] = action.payload;
        }
      })
      .addCase(updateUserSkill.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Remove User Skill
      .addCase(removeUserSkill.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeUserSkill.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userSkills = state.userSkills.filter(
          (skill) => skill.id !== action.payload
        );
      })
      .addCase(removeUserSkill.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Hilfsfunktion für das Filtern von Skills basierend auf Suchbegriff und Kategorie
const filterSkills = (
  skills: Skill[],
  searchTerm: string,
  category: SkillCategory | null
): Skill[] => {
  return skills.filter((skill) => {
    // Kategorie-Filter
    if (category && skill.category !== category) {
      return false;
    }

    // Suchbegriff-Filter
    if (
      searchTerm &&
      !skill.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !skill.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
};

export const { clearError, setSearchTerm, setSelectedCategory, clearFilters } =
  skillsSlice.actions;
export default skillsSlice.reducer;
