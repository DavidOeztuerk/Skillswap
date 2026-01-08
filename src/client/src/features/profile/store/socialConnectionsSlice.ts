import { createSlice } from '@reduxjs/toolkit';
import { initialSocialConnectionsState } from './socialConnectionsAdapter+State';
import {
  fetchSocialConnections,
  initiateLinkedInConnect,
  completeLinkedInConnect,
  syncLinkedInProfile,
  disconnectLinkedIn,
  initiateXingConnect,
  completeXingConnect,
  syncXingProfile,
  disconnectXing,
  addImportedSkill,
  updateImportedSkill,
  deleteImportedSkill,
  reorderSkills,
} from './thunks/socialConnectionsThunks';

// ===== REDUX SLICE =====

const socialConnectionsSlice = createSlice({
  name: 'socialConnections',
  initialState: initialSocialConnectionsState,
  reducers: {
    clearError: (state) => {
      state.errorMessage = undefined;
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
    // ===== FETCH ALL CONNECTIONS =====
    builder.addCase(fetchSocialConnections.pending, (state) => {
      state.isLoading = true;
      state.errorMessage = undefined;
    });
    builder.addCase(fetchSocialConnections.fulfilled, (state, action) => {
      state.isLoading = false;
      state.linkedIn = action.payload.linkedIn;
      state.xing = action.payload.xing;
      state.importedSkills = action.payload.importedSkills;
      state.summary = action.payload.summary;
    });
    builder.addCase(fetchSocialConnections.rejected, (state, action) => {
      console.error('❌ [socialConnectionsSlice] fetchSocialConnections.rejected:', action.payload);
      state.isLoading = false;
      state.errorMessage =
        action.payload?.errors[0] ?? action.error.message ?? 'Failed to fetch connections';
    });

    // ===== LINKEDIN OAUTH =====
    builder.addCase(initiateLinkedInConnect.pending, (state) => {
      state.oauthState.isInitiating = true;
      state.oauthState.provider = 'linkedin';
      state.errorMessage = undefined;
    });
    builder.addCase(initiateLinkedInConnect.fulfilled, (state, action) => {
      state.oauthState.isInitiating = false;
      state.oauthState.authorizationUrl = action.payload.authorizationUrl;
      state.oauthState.state = action.payload.state;
    });
    builder.addCase(initiateLinkedInConnect.rejected, (state, action) => {
      state.oauthState.isInitiating = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to initiate LinkedIn connection';
    });

    builder.addCase(completeLinkedInConnect.pending, (state) => {
      state.oauthState.isCompleting = true;
      state.errorMessage = undefined;
    });
    builder.addCase(completeLinkedInConnect.fulfilled, (state, action) => {
      state.oauthState = initialSocialConnectionsState.oauthState;
      state.linkedIn = action.payload;
      if (state.summary) {
        state.summary.hasLinkedInConnection = true;
      }
    });
    builder.addCase(completeLinkedInConnect.rejected, (state, action) => {
      state.oauthState.isCompleting = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to complete LinkedIn connection';
    });

    builder.addCase(syncLinkedInProfile.pending, (state) => {
      state.isSyncing = true;
      state.errorMessage = undefined;
    });
    builder.addCase(syncLinkedInProfile.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.syncResult = action.payload;
    });
    builder.addCase(syncLinkedInProfile.rejected, (state, action) => {
      state.isSyncing = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to sync LinkedIn profile';
    });

    builder.addCase(disconnectLinkedIn.pending, (state) => {
      state.isLoading = true;
      state.errorMessage = undefined;
    });
    builder.addCase(disconnectLinkedIn.fulfilled, (state) => {
      state.isLoading = false;
      state.linkedIn = null;
      if (state.summary) {
        state.summary.hasLinkedInConnection = false;
      }
    });
    builder.addCase(disconnectLinkedIn.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to disconnect LinkedIn';
    });

    // ===== XING OAUTH =====
    builder.addCase(initiateXingConnect.pending, (state) => {
      state.oauthState.isInitiating = true;
      state.oauthState.provider = 'xing';
      state.errorMessage = undefined;
    });
    builder.addCase(initiateXingConnect.fulfilled, (state, action) => {
      state.oauthState.isInitiating = false;
      state.oauthState.authorizationUrl = action.payload.authorizationUrl;
      state.oauthState.state = action.payload.state;
    });
    builder.addCase(initiateXingConnect.rejected, (state, action) => {
      state.oauthState.isInitiating = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to initiate Xing connection';
    });

    builder.addCase(completeXingConnect.pending, (state) => {
      state.oauthState.isCompleting = true;
      state.errorMessage = undefined;
    });
    builder.addCase(completeXingConnect.fulfilled, (state, action) => {
      state.oauthState = initialSocialConnectionsState.oauthState;
      state.xing = action.payload;
      if (state.summary) {
        state.summary.hasXingConnection = true;
      }
    });
    builder.addCase(completeXingConnect.rejected, (state, action) => {
      state.oauthState.isCompleting = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to complete Xing connection';
    });

    builder.addCase(syncXingProfile.pending, (state) => {
      state.isSyncing = true;
      state.errorMessage = undefined;
    });
    builder.addCase(syncXingProfile.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.syncResult = action.payload;
    });
    builder.addCase(syncXingProfile.rejected, (state, action) => {
      state.isSyncing = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to sync Xing profile';
    });

    builder.addCase(disconnectXing.pending, (state) => {
      state.isLoading = true;
      state.errorMessage = undefined;
    });
    builder.addCase(disconnectXing.fulfilled, (state) => {
      state.isLoading = false;
      state.xing = null;
      if (state.summary) {
        state.summary.hasXingConnection = false;
      }
    });
    builder.addCase(disconnectXing.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to disconnect Xing';
    });

    // ===== IMPORTED SKILLS =====
    builder.addCase(addImportedSkill.pending, (state) => {
      state.isSaving = true;
      state.errorMessage = undefined;
    });
    builder.addCase(addImportedSkill.fulfilled, (state, action) => {
      state.isSaving = false;
      state.importedSkills.push(action.payload);
      if (state.summary) {
        state.summary.totalImportedSkills++;
        state.summary.manualSkillCount++;
      }
    });
    builder.addCase(addImportedSkill.rejected, (state, action) => {
      state.isSaving = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to add skill';
    });

    builder.addCase(updateImportedSkill.pending, (state) => {
      state.isSaving = true;
      state.errorMessage = undefined;
    });
    builder.addCase(updateImportedSkill.fulfilled, (state, action) => {
      state.isSaving = false;
      const index = state.importedSkills.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.importedSkills[index] = action.payload;
      }
    });
    builder.addCase(updateImportedSkill.rejected, (state, action) => {
      state.isSaving = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to update skill';
    });

    builder.addCase(deleteImportedSkill.pending, (state) => {
      state.isSaving = true;
      state.errorMessage = undefined;
    });
    builder.addCase(deleteImportedSkill.fulfilled, (state, action) => {
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
    });
    builder.addCase(deleteImportedSkill.rejected, (state, action) => {
      state.isSaving = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to delete skill';
    });

    builder.addCase(reorderSkills.pending, (state) => {
      state.isSaving = true;
      state.errorMessage = undefined;
    });
    builder.addCase(reorderSkills.fulfilled, (state, action) => {
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
    });
    builder.addCase(reorderSkills.rejected, (state, action) => {
      state.isSaving = false;
      state.errorMessage = action.payload?.errors[0] ?? 'Failed to reorder skills';
    });
  },
});

// ===== EXPORTS =====

export const { clearError, clearSyncResult, resetOAuthState } = socialConnectionsSlice.actions;

export default socialConnectionsSlice.reducer;
