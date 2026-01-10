/**
 * useSocialConnections Hook
 *
 * Custom hook that manages state and logic for social connections (LinkedIn/Xing).
 * Uses Redux store for state management and provides memoized actions.
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import {
  // Selectors
  selectLinkedInConnection,
  selectXingConnection,
  selectImportedSkills,
  selectSocialConnectionsSummary,
  selectSocialConnectionsLoading,
  selectSocialConnectionsSyncing,
  selectSocialConnectionsSaving,
  selectSocialConnectionsError,
  selectSyncResult,
  selectOAuthState,
  // Actions
  clearSocialConnectionsError,
  clearSyncResult,
  // Thunks
  fetchSocialConnections,
  initiateLinkedInConnect,
  disconnectLinkedIn,
  syncLinkedInProfile,
  initiateXingConnect,
  disconnectXing,
  syncXingProfile,
  addImportedSkill,
  updateImportedSkill,
  deleteImportedSkill,
  // Types
  type LinkedInConnection,
  type XingConnection,
  type ImportedSkill,
  type SocialConnectionsSummary,
  type OAuthState,
} from '../store';

// ===== TYPES =====

interface SyncResultState {
  success: boolean;
  experiencesImported: number;
  educationsImported: number;
  error?: string;
}

interface UseSocialConnectionsReturn {
  // === CONNECTION DATA ===
  linkedIn: LinkedInConnection | null;
  xing: XingConnection | null;
  importedSkills: ImportedSkill[];
  summary: SocialConnectionsSummary | null;

  // === LOADING STATES ===
  isLoading: boolean;
  isSyncing: boolean;
  isSaving: boolean;

  // === ERROR & RESULT STATE ===
  error: string | undefined;
  syncResult: SyncResultState | null;
  oauthState: OAuthState;

  // === ACTIONS ===
  // Data fetching
  refresh: () => Promise<void>;

  // LinkedIn actions
  connectLinkedIn: () => Promise<void>;
  disconnectLinkedIn: () => Promise<void>;
  syncLinkedIn: () => Promise<void>;

  // Xing actions
  connectXing: () => Promise<void>;
  disconnectXing: () => Promise<void>;
  syncXing: () => Promise<void>;

  // Skill actions
  addSkill: (name: string, category?: string) => Promise<void>;
  updateSkill: (skill: ImportedSkill, updates: Partial<ImportedSkill>) => Promise<void>;
  toggleSkillVisibility: (skill: ImportedSkill) => Promise<void>;
  deleteSkill: (skillId: string) => Promise<void>;

  // Error handling
  clearError: () => void;
  dismissSyncResult: () => void;
}

// ===== HOOK IMPLEMENTATION =====

export const useSocialConnections = (): UseSocialConnectionsReturn => {
  const dispatch = useAppDispatch();

  // === REDUX SELECTORS ===
  const linkedIn = useAppSelector(selectLinkedInConnection);
  const xing = useAppSelector(selectXingConnection);
  const importedSkills = useAppSelector(selectImportedSkills);
  const summary = useAppSelector(selectSocialConnectionsSummary);
  const isLoading = useAppSelector(selectSocialConnectionsLoading);
  const isSyncing = useAppSelector(selectSocialConnectionsSyncing);
  const isSaving = useAppSelector(selectSocialConnectionsSaving);
  const error = useAppSelector(selectSocialConnectionsError);
  const syncResult = useAppSelector(selectSyncResult);
  const oauthState = useAppSelector(selectOAuthState);

  // === EFFECTS ===

  // Load data on mount
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      await dispatch(fetchSocialConnections());
    };
    loadData().catch(console.error);
  }, [dispatch]);

  // Handle OAuth redirect
  useEffect(() => {
    if (oauthState.authorizationUrl) {
      window.location.href = oauthState.authorizationUrl;
    }
  }, [oauthState.authorizationUrl]);

  // === HELPER ===
  const getRedirectUri = useCallback(() => `${window.location.origin}/profile?tab=connections`, []);

  // === MEMOIZED ACTIONS ===

  const refresh = useCallback(async (): Promise<void> => {
    await dispatch(fetchSocialConnections());
  }, [dispatch]);

  // LinkedIn actions
  const connectLinkedIn = useCallback(async (): Promise<void> => {
    await dispatch(initiateLinkedInConnect(getRedirectUri()));
  }, [dispatch, getRedirectUri]);

  const handleDisconnectLinkedIn = useCallback(async (): Promise<void> => {
    await dispatch(disconnectLinkedIn());
  }, [dispatch]);

  const syncLinkedIn = useCallback(async (): Promise<void> => {
    await dispatch(syncLinkedInProfile());
  }, [dispatch]);

  // Xing actions
  const connectXing = useCallback(async (): Promise<void> => {
    await dispatch(initiateXingConnect(getRedirectUri()));
  }, [dispatch, getRedirectUri]);

  const handleDisconnectXing = useCallback(async (): Promise<void> => {
    await dispatch(disconnectXing());
  }, [dispatch]);

  const syncXing = useCallback(async (): Promise<void> => {
    await dispatch(syncXingProfile());
  }, [dispatch]);

  // Skill actions
  const addSkill = useCallback(
    async (name: string, category?: string): Promise<void> => {
      await dispatch(addImportedSkill({ name, category }));
    },
    [dispatch]
  );

  const updateSkill = useCallback(
    async (skill: ImportedSkill, updates: Partial<ImportedSkill>): Promise<void> => {
      await dispatch(
        updateImportedSkill({
          skillId: skill.id,
          request: {
            name: updates.name ?? skill.name,
            category: updates.category ?? skill.category ?? undefined,
            sortOrder: updates.sortOrder ?? skill.sortOrder,
            isVisible: updates.isVisible ?? skill.isVisible,
          },
        })
      );
    },
    [dispatch]
  );

  const toggleSkillVisibility = useCallback(
    async (skill: ImportedSkill): Promise<void> => {
      await dispatch(
        updateImportedSkill({
          skillId: skill.id,
          request: {
            name: skill.name,
            category: skill.category ?? undefined,
            sortOrder: skill.sortOrder,
            isVisible: !skill.isVisible,
          },
        })
      );
    },
    [dispatch]
  );

  const handleDeleteSkill = useCallback(
    async (skillId: string): Promise<void> => {
      await dispatch(deleteImportedSkill(skillId));
    },
    [dispatch]
  );

  // Error handling (synchronous actions)
  const clearError = useCallback((): void => {
    dispatch(clearSocialConnectionsError());
  }, [dispatch]);

  const dismissSyncResult = useCallback((): void => {
    dispatch(clearSyncResult());
  }, [dispatch]);

  // === RETURN ===
  return useMemo(
    () => ({
      // Connection data
      linkedIn,
      xing,
      importedSkills,
      summary,

      // Loading states
      isLoading,
      isSyncing,
      isSaving,

      // Error & result state
      error,
      syncResult,
      oauthState,

      // Actions
      refresh,
      connectLinkedIn,
      disconnectLinkedIn: handleDisconnectLinkedIn,
      syncLinkedIn,
      connectXing,
      disconnectXing: handleDisconnectXing,
      syncXing,
      addSkill,
      updateSkill,
      toggleSkillVisibility,
      deleteSkill: handleDeleteSkill,
      clearError,
      dismissSyncResult,
    }),
    [
      linkedIn,
      xing,
      importedSkills,
      summary,
      isLoading,
      isSyncing,
      isSaving,
      error,
      syncResult,
      oauthState,
      refresh,
      connectLinkedIn,
      handleDisconnectLinkedIn,
      syncLinkedIn,
      connectXing,
      handleDisconnectXing,
      syncXing,
      addSkill,
      updateSkill,
      toggleSkillVisibility,
      handleDeleteSkill,
      clearError,
      dismissSyncResult,
    ]
  );
};

export default useSocialConnections;
