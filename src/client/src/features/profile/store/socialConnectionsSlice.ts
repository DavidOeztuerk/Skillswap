import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { socialConnectionsService } from '../services/socialConnectionsService';
import type {
  SocialConnectionsResponse,
  LinkedInConnectionResponse,
  XingConnectionResponse,
  UserImportedSkillResponse,
  ProfileSyncResultResponse,
  InitiateConnectResponse,
  AddImportedSkillRequest,
  UpdateImportedSkillRequest,
  SkillOrderItem,
} from '../services/socialConnectionsService';
import type { ErrorPayload } from '../../../shared/types/api/UnifiedResponse';

// ===== STATE INTERFACE =====

export interface SocialConnectionsState {
  // Connection data
  linkedIn: LinkedInConnectionResponse | null;
  xing: XingConnectionResponse | null;
  importedSkills: UserImportedSkillResponse[];

  // Summary
  summary: {
    totalImportedSkills: number;
    linkedInSkillCount: number;
    xingSkillCount: number;
    manualSkillCount: number;
    totalImportedExperiences: number;
    totalImportedEducations: number;
    hasLinkedInConnection: boolean;
    hasXingConnection: boolean;
  } | null;

  // OAuth flow state
  oauthState: {
    provider: 'linkedin' | 'xing' | null;
    authorizationUrl: string | null;
    state: string | null;
    isInitiating: boolean;
    isCompleting: boolean;
  };

  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  isSaving: boolean;

  // Error handling
  error: string | null;
  syncResult: ProfileSyncResultResponse | null;
}

const initialState: SocialConnectionsState = {
  linkedIn: null,
  xing: null,
  importedSkills: [],
  summary: null,
  oauthState: {
    provider: null,
    authorizationUrl: null,
    state: null,
    isInitiating: false,
    isCompleting: false,
  },
  isLoading: false,
  isSyncing: false,
  isSaving: false,
  error: null,
  syncResult: null,
};

// ===== ASYNC THUNKS =====

export const fetchSocialConnections = createAsyncThunk<
  SocialConnectionsResponse,
  void,
  { rejectValue: ErrorPayload }
>('socialConnections/fetchAll', async (_, { rejectWithValue }) => {
  const response = await socialConnectionsService.getSocialConnections();
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to fetch connections' });
  }
  return response.data!;
});

// LinkedIn thunks
export const initiateLinkedInConnect = createAsyncThunk<
  InitiateConnectResponse,
  string,
  { rejectValue: ErrorPayload }
>('socialConnections/initiateLinkedIn', async (redirectUri, { rejectWithValue }) => {
  const response = await socialConnectionsService.initiateLinkedInConnect(redirectUri);
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to initiate LinkedIn connection' });
  }
  return response.data!;
});

export const completeLinkedInConnect = createAsyncThunk<
  LinkedInConnectionResponse,
  { code: string; state: string; redirectUri: string },
  { rejectValue: ErrorPayload }
>('socialConnections/completeLinkedIn', async ({ code, state, redirectUri }, { rejectWithValue }) => {
  const response = await socialConnectionsService.completeLinkedInConnect(code, state, redirectUri);
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to complete LinkedIn connection' });
  }
  return response.data!;
});

export const syncLinkedInProfile = createAsyncThunk<
  ProfileSyncResultResponse,
  void,
  { rejectValue: ErrorPayload }
>('socialConnections/syncLinkedIn', async (_, { rejectWithValue }) => {
  const response = await socialConnectionsService.syncLinkedInProfile();
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to sync LinkedIn profile' });
  }
  return response.data!;
});

export const disconnectLinkedIn = createAsyncThunk<boolean, void, { rejectValue: ErrorPayload }>(
  'socialConnections/disconnectLinkedIn',
  async (_, { rejectWithValue }) => {
    const response = await socialConnectionsService.disconnectLinkedIn();
    if (!response.succeeded) {
      return rejectWithValue({ message: response.error ?? 'Failed to disconnect LinkedIn' });
    }
    return response.data!;
  }
);

// Xing thunks
export const initiateXingConnect = createAsyncThunk<
  InitiateConnectResponse,
  string,
  { rejectValue: ErrorPayload }
>('socialConnections/initiateXing', async (redirectUri, { rejectWithValue }) => {
  const response = await socialConnectionsService.initiateXingConnect(redirectUri);
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to initiate Xing connection' });
  }
  return response.data!;
});

export const completeXingConnect = createAsyncThunk<
  XingConnectionResponse,
  { oauthToken: string; oauthVerifier: string; redirectUri: string },
  { rejectValue: ErrorPayload }
>(
  'socialConnections/completeXing',
  async ({ oauthToken, oauthVerifier, redirectUri }, { rejectWithValue }) => {
    const response = await socialConnectionsService.completeXingConnect(
      oauthToken,
      oauthVerifier,
      redirectUri
    );
    if (!response.succeeded) {
      return rejectWithValue({ message: response.error ?? 'Failed to complete Xing connection' });
    }
    return response.data!;
  }
);

export const syncXingProfile = createAsyncThunk<
  ProfileSyncResultResponse,
  void,
  { rejectValue: ErrorPayload }
>('socialConnections/syncXing', async (_, { rejectWithValue }) => {
  const response = await socialConnectionsService.syncXingProfile();
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to sync Xing profile' });
  }
  return response.data!;
});

export const disconnectXing = createAsyncThunk<boolean, void, { rejectValue: ErrorPayload }>(
  'socialConnections/disconnectXing',
  async (_, { rejectWithValue }) => {
    const response = await socialConnectionsService.disconnectXing();
    if (!response.succeeded) {
      return rejectWithValue({ message: response.error ?? 'Failed to disconnect Xing' });
    }
    return response.data!;
  }
);

// Imported skills thunks
export const addImportedSkill = createAsyncThunk<
  UserImportedSkillResponse,
  AddImportedSkillRequest,
  { rejectValue: ErrorPayload }
>('socialConnections/addSkill', async (request, { rejectWithValue }) => {
  const response = await socialConnectionsService.addImportedSkill(request);
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to add skill' });
  }
  return response.data!;
});

export const updateImportedSkill = createAsyncThunk<
  UserImportedSkillResponse,
  { skillId: string; request: UpdateImportedSkillRequest },
  { rejectValue: ErrorPayload }
>('socialConnections/updateSkill', async ({ skillId, request }, { rejectWithValue }) => {
  const response = await socialConnectionsService.updateImportedSkill(skillId, request);
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to update skill' });
  }
  return response.data!;
});

export const deleteImportedSkill = createAsyncThunk<
  string,
  string,
  { rejectValue: ErrorPayload }
>('socialConnections/deleteSkill', async (skillId, { rejectWithValue }) => {
  const response = await socialConnectionsService.deleteImportedSkill(skillId);
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to delete skill' });
  }
  return skillId;
});

export const reorderSkills = createAsyncThunk<
  SkillOrderItem[],
  SkillOrderItem[],
  { rejectValue: ErrorPayload }
>('socialConnections/reorderSkills', async (skills, { rejectWithValue }) => {
  const response = await socialConnectionsService.reorderSkills(skills);
  if (!response.succeeded) {
    return rejectWithValue({ message: response.error ?? 'Failed to reorder skills' });
  }
  return skills;
});

// ===== SLICE =====

const socialConnectionsSlice = createSlice({
  name: 'socialConnections',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSyncResult: (state) => {
      state.syncResult = null;
    },
    resetOAuthState: (state) => {
      state.oauthState = {
        provider: null,
        authorizationUrl: null,
        state: null,
        isInitiating: false,
        isCompleting: false,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch all connections
    builder
      .addCase(fetchSocialConnections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSocialConnections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.linkedIn = action.payload.linkedIn ?? null;
        state.xing = action.payload.xing ?? null;
        state.importedSkills = action.payload.importedSkills;
        state.summary = action.payload.summary;
      })
      .addCase(fetchSocialConnections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Failed to fetch connections';
      });

    // LinkedIn OAuth
    builder
      .addCase(initiateLinkedInConnect.pending, (state) => {
        state.oauthState.isInitiating = true;
        state.oauthState.provider = 'linkedin';
        state.error = null;
      })
      .addCase(initiateLinkedInConnect.fulfilled, (state, action) => {
        state.oauthState.isInitiating = false;
        state.oauthState.authorizationUrl = action.payload.authorizationUrl;
        state.oauthState.state = action.payload.state;
      })
      .addCase(initiateLinkedInConnect.rejected, (state, action) => {
        state.oauthState.isInitiating = false;
        state.error = action.payload?.message ?? 'Failed to initiate LinkedIn connection';
      });

    builder
      .addCase(completeLinkedInConnect.pending, (state) => {
        state.oauthState.isCompleting = true;
        state.error = null;
      })
      .addCase(completeLinkedInConnect.fulfilled, (state, action) => {
        state.oauthState.isCompleting = false;
        state.oauthState = initialState.oauthState;
        state.linkedIn = action.payload;
        if (state.summary) {
          state.summary.hasLinkedInConnection = true;
        }
      })
      .addCase(completeLinkedInConnect.rejected, (state, action) => {
        state.oauthState.isCompleting = false;
        state.error = action.payload?.message ?? 'Failed to complete LinkedIn connection';
      });

    builder
      .addCase(syncLinkedInProfile.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncLinkedInProfile.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.syncResult = action.payload;
      })
      .addCase(syncLinkedInProfile.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload?.message ?? 'Failed to sync LinkedIn profile';
      });

    builder
      .addCase(disconnectLinkedIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disconnectLinkedIn.fulfilled, (state) => {
        state.isLoading = false;
        state.linkedIn = null;
        if (state.summary) {
          state.summary.hasLinkedInConnection = false;
        }
      })
      .addCase(disconnectLinkedIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Failed to disconnect LinkedIn';
      });

    // Xing OAuth
    builder
      .addCase(initiateXingConnect.pending, (state) => {
        state.oauthState.isInitiating = true;
        state.oauthState.provider = 'xing';
        state.error = null;
      })
      .addCase(initiateXingConnect.fulfilled, (state, action) => {
        state.oauthState.isInitiating = false;
        state.oauthState.authorizationUrl = action.payload.authorizationUrl;
        state.oauthState.state = action.payload.state;
      })
      .addCase(initiateXingConnect.rejected, (state, action) => {
        state.oauthState.isInitiating = false;
        state.error = action.payload?.message ?? 'Failed to initiate Xing connection';
      });

    builder
      .addCase(completeXingConnect.pending, (state) => {
        state.oauthState.isCompleting = true;
        state.error = null;
      })
      .addCase(completeXingConnect.fulfilled, (state, action) => {
        state.oauthState.isCompleting = false;
        state.oauthState = initialState.oauthState;
        state.xing = action.payload;
        if (state.summary) {
          state.summary.hasXingConnection = true;
        }
      })
      .addCase(completeXingConnect.rejected, (state, action) => {
        state.oauthState.isCompleting = false;
        state.error = action.payload?.message ?? 'Failed to complete Xing connection';
      });

    builder
      .addCase(syncXingProfile.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncXingProfile.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.syncResult = action.payload;
      })
      .addCase(syncXingProfile.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload?.message ?? 'Failed to sync Xing profile';
      });

    builder
      .addCase(disconnectXing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disconnectXing.fulfilled, (state) => {
        state.isLoading = false;
        state.xing = null;
        if (state.summary) {
          state.summary.hasXingConnection = false;
        }
      })
      .addCase(disconnectXing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? 'Failed to disconnect Xing';
      });

    // Imported skills
    builder
      .addCase(addImportedSkill.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(addImportedSkill.fulfilled, (state, action) => {
        state.isSaving = false;
        state.importedSkills.push(action.payload);
        if (state.summary) {
          state.summary.totalImportedSkills++;
          state.summary.manualSkillCount++;
        }
      })
      .addCase(addImportedSkill.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload?.message ?? 'Failed to add skill';
      });

    builder
      .addCase(updateImportedSkill.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateImportedSkill.fulfilled, (state, action) => {
        state.isSaving = false;
        const index = state.importedSkills.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.importedSkills[index] = action.payload;
        }
      })
      .addCase(updateImportedSkill.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload?.message ?? 'Failed to update skill';
      });

    builder
      .addCase(deleteImportedSkill.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(deleteImportedSkill.fulfilled, (state, action) => {
        state.isSaving = false;
        const deletedSkill = state.importedSkills.find((s) => s.id === action.payload);
        state.importedSkills = state.importedSkills.filter((s) => s.id !== action.payload);
        if (state.summary && deletedSkill) {
          state.summary.totalImportedSkills--;
          if (deletedSkill.source === 'linkedin') {
            state.summary.linkedInSkillCount--;
          } else if (deletedSkill.source === 'xing') {
            state.summary.xingSkillCount--;
          } else {
            state.summary.manualSkillCount--;
          }
        }
      })
      .addCase(deleteImportedSkill.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload?.message ?? 'Failed to delete skill';
      });

    builder
      .addCase(reorderSkills.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(reorderSkills.fulfilled, (state, action) => {
        state.isSaving = false;
        // Update sort order locally
        for (const item of action.payload) {
          const skill = state.importedSkills.find((s) => s.id === item.skillId);
          if (skill) {
            skill.sortOrder = item.sortOrder;
          }
        }
        // Sort by sortOrder
        state.importedSkills.sort((a, b) => a.sortOrder - b.sortOrder);
      })
      .addCase(reorderSkills.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload?.message ?? 'Failed to reorder skills';
      });
  },
});

export const { clearError, clearSyncResult, resetOAuthState } = socialConnectionsSlice.actions;
export default socialConnectionsSlice.reducer;
