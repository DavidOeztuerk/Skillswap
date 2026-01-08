import type { RequestState } from '../../../shared/types/common/RequestState';
import type {
  SocialConnectionsResponse,
  LinkedInConnectionResponse,
  XingConnectionResponse,
  UserImportedSkillResponse,
  ProfileSyncResultResponse,
} from '../services/socialConnectionsService';

// ===== DOMAIN MODELS =====

/**
 * Frontend model for LinkedIn connection
 */
export interface LinkedInConnection {
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

/**
 * Frontend model for Xing connection
 */
export interface XingConnection {
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

/**
 * Frontend model for imported skill
 */
export interface ImportedSkill {
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

/**
 * Summary of social connections
 */
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

/**
 * OAuth flow state
 */
export interface OAuthState {
  provider: 'linkedin' | 'xing' | null;
  authorizationUrl: string | null;
  state: string | null;
  isInitiating: boolean;
  isCompleting: boolean;
}

// ===== STATE INTERFACE =====

export interface SocialConnectionsState extends RequestState {
  // Connection data
  linkedIn: LinkedInConnection | null;
  xing: XingConnection | null;
  importedSkills: ImportedSkill[];

  // Summary
  summary: SocialConnectionsSummary | null;

  // OAuth flow state
  oauthState: OAuthState;

  // Loading states
  isSyncing: boolean;
  isSaving: boolean;

  // Sync result
  syncResult: ProfileSyncResultResponse | null;
}

// ===== INITIAL STATE =====

export const initialSocialConnectionsState: SocialConnectionsState = {
  // Connection data
  linkedIn: null,
  xing: null,
  importedSkills: [],

  // Summary
  summary: null,

  // OAuth flow state
  oauthState: {
    provider: null,
    authorizationUrl: null,
    state: null,
    isInitiating: false,
    isCompleting: false,
  },

  // Loading states (from RequestState)
  isLoading: false,
  errorMessage: undefined,

  // Additional loading states
  isSyncing: false,
  isSaving: false,

  // Sync result
  syncResult: null,
};

// ===== MAPPING FUNCTIONS =====

export const mapLinkedInConnectionResponse = (
  response: LinkedInConnectionResponse
): LinkedInConnection => ({
  id: response.id,
  linkedInId: response.linkedInId,
  profileUrl: response.profileUrl,
  linkedInEmail: response.linkedInEmail,
  isVerified: response.isVerified,
  verifiedAt: response.verifiedAt,
  lastSyncAt: response.lastSyncAt,
  importedExperienceCount: response.importedExperienceCount,
  importedEducationCount: response.importedEducationCount,
  autoSyncEnabled: response.autoSyncEnabled,
  createdAt: response.createdAt,
});

export const mapXingConnectionResponse = (response: XingConnectionResponse): XingConnection => ({
  id: response.id,
  xingId: response.xingId,
  profileUrl: response.profileUrl,
  xingEmail: response.xingEmail,
  isVerified: response.isVerified,
  verifiedAt: response.verifiedAt,
  lastSyncAt: response.lastSyncAt,
  importedExperienceCount: response.importedExperienceCount,
  importedEducationCount: response.importedEducationCount,
  autoSyncEnabled: response.autoSyncEnabled,
  createdAt: response.createdAt,
});

export const mapImportedSkillResponse = (response: UserImportedSkillResponse): ImportedSkill => ({
  id: response.id,
  name: response.name,
  source: response.source,
  externalId: response.externalId,
  endorsementCount: response.endorsementCount,
  category: response.category,
  sortOrder: response.sortOrder,
  isVisible: response.isVisible,
  importedAt: response.importedAt,
  lastSyncAt: response.lastSyncAt,
  createdAt: response.createdAt,
});

interface MappedSocialConnectionsResult {
  linkedIn: LinkedInConnection | null;
  xing: XingConnection | null;
  importedSkills: ImportedSkill[];
  summary: SocialConnectionsSummary;
}

export const mapSocialConnectionsResponse = (
  response: SocialConnectionsResponse
): MappedSocialConnectionsResult => ({
  linkedIn: response.linkedIn ? mapLinkedInConnectionResponse(response.linkedIn) : null,
  xing: response.xing ? mapXingConnectionResponse(response.xing) : null,
  importedSkills: response.importedSkills.map(mapImportedSkillResponse),
  summary: response.summary,
});
