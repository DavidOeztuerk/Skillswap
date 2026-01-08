import { apiClient } from '../../../core/api/apiClient';
import type { ApiResponse } from '../../../shared/types/api/UnifiedResponse';

/**
 * Phase 12: LinkedIn/Xing Integration Types
 */

export interface LinkedInConnectionResponse {
  id: string;
  linkedInId: string;
  profileUrl?: string;
  linkedInEmail?: string;
  isVerified: boolean;
  verifiedAt?: string;
  lastSyncAt?: string;
  importedExperienceCount: number;
  importedEducationCount: number;
  autoSyncEnabled: boolean;
  createdAt: string;
}

export interface XingConnectionResponse {
  id: string;
  xingId: string;
  profileUrl?: string;
  xingEmail?: string;
  isVerified: boolean;
  verifiedAt?: string;
  lastSyncAt?: string;
  importedExperienceCount: number;
  importedEducationCount: number;
  autoSyncEnabled: boolean;
  createdAt: string;
}

export interface UserImportedSkillResponse {
  id: string;
  name: string;
  source: 'manual' | 'linkedin' | 'xing';
  externalId?: string;
  endorsementCount: number;
  category?: string;
  sortOrder: number;
  isVisible: boolean;
  importedAt?: string;
  lastSyncAt?: string;
  createdAt: string;
}

export interface SocialConnectionsSummary {
  totalImportedSkills: number;
  linkedInSkillCount: number;
  xingSkillCount: number;
  manualSkillCount: number;
  totalImportedExperiences: number;
  totalImportedEducations: number;
  hasLinkedInConnection: boolean;
  hasXingConnection: boolean;
}

export interface SocialConnectionsResponse {
  linkedIn?: LinkedInConnectionResponse;
  xing?: XingConnectionResponse;
  importedSkills: UserImportedSkillResponse[];
  summary: SocialConnectionsSummary;
}

export interface InitiateConnectResponse {
  authorizationUrl: string;
  state: string;
}

export interface ProfileSyncResultResponse {
  experiencesImported: number;
  experiencesUpdated: number;
  educationsImported: number;
  educationsUpdated: number;
  syncedAt: string;
  error?: string;
  success: boolean;
}

export interface AddImportedSkillRequest {
  name: string;
  category?: string;
  sortOrder?: number;
}

export interface UpdateImportedSkillRequest {
  name: string;
  category?: string;
  sortOrder?: number;
  isVisible?: boolean;
}

export interface SkillOrderItem {
  skillId: string;
  sortOrder: number;
}

/**
 * Service for social connections (LinkedIn/Xing) and imported skills
 * Phase 12: LinkedIn/Xing Integration
 */
export const socialConnectionsService = {
  // =============================================
  // Overview endpoints
  // =============================================

  /**
   * Get all social connections and imported skills
   */
  async getSocialConnections(): Promise<ApiResponse<SocialConnectionsResponse>> {
    return apiClient.get<SocialConnectionsResponse>('/api/users/profile/connections');
  },

  // =============================================
  // LinkedIn endpoints
  // =============================================

  /**
   * Get LinkedIn connection details
   */
  async getLinkedInConnection(): Promise<ApiResponse<LinkedInConnectionResponse>> {
    return apiClient.get<LinkedInConnectionResponse>('/api/users/profile/linkedin');
  },

  /**
   * Initiate LinkedIn OAuth flow
   */
  async initiateLinkedInConnect(redirectUri: string): Promise<ApiResponse<InitiateConnectResponse>> {
    return apiClient.post<InitiateConnectResponse>('/api/users/profile/linkedin/connect', {
      redirectUri,
    });
  },

  /**
   * Complete LinkedIn OAuth flow
   */
  async completeLinkedInConnect(
    code: string,
    state: string,
    redirectUri: string
  ): Promise<ApiResponse<LinkedInConnectionResponse>> {
    return apiClient.post<LinkedInConnectionResponse>('/api/users/profile/linkedin/callback', {
      code,
      state,
      redirectUri,
    });
  },

  /**
   * Sync profile data from LinkedIn
   */
  async syncLinkedInProfile(): Promise<ApiResponse<ProfileSyncResultResponse>> {
    return apiClient.post<ProfileSyncResultResponse>('/api/users/profile/linkedin/sync', {});
  },

  /**
   * Disconnect LinkedIn account
   */
  async disconnectLinkedIn(): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>('/api/users/profile/linkedin');
  },

  // =============================================
  // Xing endpoints
  // =============================================

  /**
   * Get Xing connection details
   */
  async getXingConnection(): Promise<ApiResponse<XingConnectionResponse>> {
    return apiClient.get<XingConnectionResponse>('/api/users/profile/xing');
  },

  /**
   * Initiate Xing OAuth flow
   */
  async initiateXingConnect(redirectUri: string): Promise<ApiResponse<InitiateConnectResponse>> {
    return apiClient.post<InitiateConnectResponse>('/api/users/profile/xing/connect', {
      redirectUri,
    });
  },

  /**
   * Complete Xing OAuth flow
   */
  async completeXingConnect(
    oauthToken: string,
    oauthVerifier: string,
    redirectUri: string
  ): Promise<ApiResponse<XingConnectionResponse>> {
    return apiClient.post<XingConnectionResponse>('/api/users/profile/xing/callback', {
      oauthToken,
      oauthVerifier,
      redirectUri,
    });
  },

  /**
   * Sync profile data from Xing
   */
  async syncXingProfile(): Promise<ApiResponse<ProfileSyncResultResponse>> {
    return apiClient.post<ProfileSyncResultResponse>('/api/users/profile/xing/sync', {});
  },

  /**
   * Disconnect Xing account
   */
  async disconnectXing(): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>('/api/users/profile/xing');
  },

  // =============================================
  // Imported Skills endpoints
  // =============================================

  /**
   * Get all imported skills
   */
  async getImportedSkills(): Promise<ApiResponse<UserImportedSkillResponse[]>> {
    return apiClient.get<UserImportedSkillResponse[]>('/api/users/profile/skills');
  },

  /**
   * Add a manual skill
   */
  async addImportedSkill(request: AddImportedSkillRequest): Promise<ApiResponse<UserImportedSkillResponse>> {
    return apiClient.post<UserImportedSkillResponse>('/api/users/profile/skills', request);
  },

  /**
   * Update an imported skill
   */
  async updateImportedSkill(
    skillId: string,
    request: UpdateImportedSkillRequest
  ): Promise<ApiResponse<UserImportedSkillResponse>> {
    return apiClient.put<UserImportedSkillResponse>(`/api/users/profile/skills/${skillId}`, request);
  },

  /**
   * Delete an imported skill
   */
  async deleteImportedSkill(skillId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`/api/users/profile/skills/${skillId}`);
  },

  /**
   * Update skill visibility
   */
  async updateSkillVisibility(
    skillId: string,
    isVisible: boolean
  ): Promise<ApiResponse<UserImportedSkillResponse>> {
    return apiClient.patch<UserImportedSkillResponse>(`/api/users/profile/skills/${skillId}/visibility`, {
      isVisible,
    });
  },

  /**
   * Reorder skills
   */
  async reorderSkills(skills: SkillOrderItem[]): Promise<ApiResponse<boolean>> {
    return apiClient.post<boolean>('/api/users/profile/skills/reorder', { skills });
  },
};
