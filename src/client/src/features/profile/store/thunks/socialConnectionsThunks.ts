import { createAppAsyncThunk } from '../../../../core/store/thunkHelpers';
import { isSuccessResponse } from '../../../../shared/types/api/UnifiedResponse';
import { socialConnectionsService } from '../../services/socialConnectionsService';
import {
  type LinkedInConnection,
  type XingConnection,
  type ImportedSkill,
  type SocialConnectionsSummary,
  mapSocialConnectionsResponse,
  mapLinkedInConnectionResponse,
  mapXingConnectionResponse,
  mapImportedSkillResponse,
} from '../socialConnectionsAdapter+State';
import type {
  AddImportedSkillRequest,
  UpdateImportedSkillRequest,
  SkillOrderItem,
  ProfileSyncResultResponse,
  InitiateConnectResponse,
} from '../../services/socialConnectionsService';

// ===== FETCH ALL SOCIAL CONNECTIONS =====

interface FetchSocialConnectionsResult {
  linkedIn: LinkedInConnection | null;
  xing: XingConnection | null;
  importedSkills: ImportedSkill[];
  summary: SocialConnectionsSummary;
}

export const fetchSocialConnections = createAppAsyncThunk<FetchSocialConnectionsResult>(
  'socialConnections/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.getSocialConnections();

      if (!isSuccessResponse(response)) {
        console.error('❌ [fetchSocialConnections] Not a success response');
        return rejectWithValue(response);
      }

      return mapSocialConnectionsResponse(response.data);
    } catch (error) {
      console.error('❌ [fetchSocialConnections] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch connections'],
        errorCode: 'FETCH_CONNECTIONS_ERROR',
      });
    }
  }
);

// ===== LINKEDIN THUNKS =====

export const initiateLinkedInConnect = createAppAsyncThunk<InitiateConnectResponse, string>(
  'socialConnections/initiateLinkedIn',
  async (redirectUri, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.initiateLinkedInConnect(redirectUri);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data;
    } catch (error) {
      console.error('❌ [initiateLinkedInConnect] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to initiate LinkedIn connection'],
        errorCode: 'LINKEDIN_INITIATE_ERROR',
      });
    }
  }
);

interface CompleteLinkedInConnectParams {
  code: string;
  state: string;
  redirectUri: string;
}

export const completeLinkedInConnect = createAppAsyncThunk<
  LinkedInConnection,
  CompleteLinkedInConnectParams
>(
  'socialConnections/completeLinkedIn',
  async ({ code, state, redirectUri }, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.completeLinkedInConnect(
        code,
        state,
        redirectUri
      );

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return mapLinkedInConnectionResponse(response.data);
    } catch (error) {
      console.error('❌ [completeLinkedInConnect] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to complete LinkedIn connection'],
        errorCode: 'LINKEDIN_COMPLETE_ERROR',
      });
    }
  }
);

export const syncLinkedInProfile = createAppAsyncThunk<ProfileSyncResultResponse>(
  'socialConnections/syncLinkedIn',
  async (_, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.syncLinkedInProfile();

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data;
    } catch (error) {
      console.error('❌ [syncLinkedInProfile] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to sync LinkedIn profile'],
        errorCode: 'LINKEDIN_SYNC_ERROR',
      });
    }
  }
);

export const disconnectLinkedIn = createAppAsyncThunk<boolean>(
  'socialConnections/disconnectLinkedIn',
  async (_, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.disconnectLinkedIn();

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data;
    } catch (error) {
      console.error('❌ [disconnectLinkedIn] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to disconnect LinkedIn'],
        errorCode: 'LINKEDIN_DISCONNECT_ERROR',
      });
    }
  }
);

// ===== XING THUNKS =====

export const initiateXingConnect = createAppAsyncThunk<InitiateConnectResponse, string>(
  'socialConnections/initiateXing',
  async (redirectUri, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.initiateXingConnect(redirectUri);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data;
    } catch (error) {
      console.error('❌ [initiateXingConnect] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to initiate Xing connection'],
        errorCode: 'XING_INITIATE_ERROR',
      });
    }
  }
);

interface CompleteXingConnectParams {
  oauthToken: string;
  oauthVerifier: string;
  redirectUri: string;
}

export const completeXingConnect = createAppAsyncThunk<XingConnection, CompleteXingConnectParams>(
  'socialConnections/completeXing',
  async ({ oauthToken, oauthVerifier, redirectUri }, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.completeXingConnect(
        oauthToken,
        oauthVerifier,
        redirectUri
      );

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return mapXingConnectionResponse(response.data);
    } catch (error) {
      console.error('❌ [completeXingConnect] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to complete Xing connection'],
        errorCode: 'XING_COMPLETE_ERROR',
      });
    }
  }
);

export const syncXingProfile = createAppAsyncThunk<ProfileSyncResultResponse>(
  'socialConnections/syncXing',
  async (_, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.syncXingProfile();

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data;
    } catch (error) {
      console.error('❌ [syncXingProfile] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to sync Xing profile'],
        errorCode: 'XING_SYNC_ERROR',
      });
    }
  }
);

export const disconnectXing = createAppAsyncThunk<boolean>(
  'socialConnections/disconnectXing',
  async (_, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.disconnectXing();

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return response.data;
    } catch (error) {
      console.error('❌ [disconnectXing] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to disconnect Xing'],
        errorCode: 'XING_DISCONNECT_ERROR',
      });
    }
  }
);

// ===== IMPORTED SKILLS THUNKS =====

export const addImportedSkill = createAppAsyncThunk<ImportedSkill, AddImportedSkillRequest>(
  'socialConnections/addSkill',
  async (request, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.addImportedSkill(request);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return mapImportedSkillResponse(response.data);
    } catch (error) {
      console.error('❌ [addImportedSkill] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to add skill'],
        errorCode: 'ADD_SKILL_ERROR',
      });
    }
  }
);

interface UpdateImportedSkillParams {
  skillId: string;
  request: UpdateImportedSkillRequest;
}

export const updateImportedSkill = createAppAsyncThunk<ImportedSkill, UpdateImportedSkillParams>(
  'socialConnections/updateSkill',
  async ({ skillId, request }, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.updateImportedSkill(skillId, request);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return mapImportedSkillResponse(response.data);
    } catch (error) {
      console.error('❌ [updateImportedSkill] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to update skill'],
        errorCode: 'UPDATE_SKILL_ERROR',
      });
    }
  }
);

export const deleteImportedSkill = createAppAsyncThunk<string, string>(
  'socialConnections/deleteSkill',
  async (skillId, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.deleteImportedSkill(skillId);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return skillId;
    } catch (error) {
      console.error('❌ [deleteImportedSkill] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to delete skill'],
        errorCode: 'DELETE_SKILL_ERROR',
      });
    }
  }
);

export const reorderSkills = createAppAsyncThunk<SkillOrderItem[], SkillOrderItem[]>(
  'socialConnections/reorderSkills',
  async (skills, { rejectWithValue }) => {
    try {
      const response = await socialConnectionsService.reorderSkills(skills);

      if (!isSuccessResponse(response)) {
        return rejectWithValue(response);
      }

      return skills;
    } catch (error) {
      console.error('❌ [reorderSkills] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to reorder skills'],
        errorCode: 'REORDER_SKILLS_ERROR',
      });
    }
  }
);
