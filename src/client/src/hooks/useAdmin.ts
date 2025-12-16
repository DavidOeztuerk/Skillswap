import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  fetchAdminDashboard,
  fetchAdminUsers,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  deleteUser,
  fetchAdminSkills,
  moderateSkill,
  fetchAdminAppointments,
  fetchAdminMatches,
  fetchAdminAnalytics,
  fetchSystemHealth,
  fetchAuditLogs,
  fetchModerationReports,
  handleModerationReport,
  fetchAdminSettings,
  updateAdminSettings,
} from '../features/admin/adminThunks';
import type {
  UserFilters,
  SkillFilters,
  AppointmentFilters,
  MatchFilters,
  AuditLogFilters,
  ModerationReportFilters,
} from '../types/filters/AdminFilters';
import {
  clearError,
  clearUserError,
  clearSkillError,
  clearAppointmentError,
  clearMatchError,
  clearAnalyticsError,
  clearSystemHealthError,
  clearAuditLogError,
  clearReportError,
  clearSettingsError,
  setUserFilters,
  setSkillFilters,
  setAppointmentFilters,
  setMatchFilters,
  setAuditLogFilters,
  setReportFilters,
  setUserPagination,
  setSkillPagination,
  setAppointmentPagination,
  setMatchPagination,
  setAuditLogPagination,
  setReportPagination,
} from '../features/admin/adminSlice';
import {
  selectAdminDashboard,
  selectSystemHealth,
  selectAdminLoading,
  selectAdminError,
  selectIsLoadingSystemHealth,
  selectSystemHealthError,
  selectAdminUsers,
  selectAdminSkills,
  selectAdminAppointments,
  selectAdminMatches,
  selectAuditLogs,
  selectModerationReports,
  selectAdminSettings,
  selectAdminAnalytics,
  selectIsLoadingUsers,
  selectIsLoadingSkills,
  selectIsLoadingAppointments,
  selectIsLoadingMatches,
  selectIsLoadingAnalytics,
  selectIsLoadingAuditLogs,
  selectIsLoadingReports,
  selectIsLoadingSettings,
  selectUserError,
  selectSkillError,
  selectAppointmentError,
  selectMatchError,
  selectAnalyticsError,
  selectAuditLogError,
  selectReportError,
  selectSettingsError,
} from '../store/selectors/adminSelectors';

/**
 * 🚀 ADMIN HOOK
 *
 * ✅ KEINE useEffects - prevents infinite loops!
 * ✅ Stateless Design - nur Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 *
 * CRITICAL: This hook is STATELESS and contains NO useEffects.
 * All data fetching must be initiated from Components!
 */
export const useAdmin = (): {
  dashboard: ReturnType<typeof selectAdminDashboard>;
  systemHealth: ReturnType<typeof selectSystemHealth>;
  isLoading: boolean;
  errorMessage: string | undefined;
  isLoadingSystemHealth: boolean;
  systemHealthError: string | undefined;
  users: ReturnType<typeof selectAdminUsers>;
  skills: ReturnType<typeof selectAdminSkills>;
  appointments: ReturnType<typeof selectAdminAppointments>;
  matches: ReturnType<typeof selectAdminMatches>;
  auditLogs: ReturnType<typeof selectAuditLogs>;
  moderationReports: ReturnType<typeof selectModerationReports>;
  settings: ReturnType<typeof selectAdminSettings>;
  analytics: ReturnType<typeof selectAdminAnalytics>;
  isLoadingUsers: boolean;
  isLoadingSkills: boolean;
  isLoadingAppointments: boolean;
  isLoadingMatches: boolean;
  isLoadingAnalytics: boolean;
  isLoadingAuditLogs: boolean;
  isLoadingReports: boolean;
  isLoadingSettings: boolean;
  userError: string | undefined;
  skillError: string | undefined;
  appointmentError: string | undefined;
  matchError: string | undefined;
  analyticsError: string | undefined;
  auditLogError: string | undefined;
  reportError: string | undefined;
  settingsError: string | undefined;
  fetchAdminDashboard: () => void;
  fetchSystemHealth: () => void;
  fetchAdminUsers: (params?: { page?: number; limit?: number; filters?: UserFilters }) => void;
  updateUserRole: (userId: string, role: string) => void;
  suspendUser: (userId: string, reason: string) => void;
  unsuspendUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  fetchAdminSkills: (params?: { page?: number; limit?: number; filters?: SkillFilters }) => void;
  moderateSkill: (
    skillId: string,
    action: 'approve' | 'reject' | 'quarantine',
    reason?: string
  ) => void;
  fetchAdminAppointments: (params?: {
    page?: number;
    limit?: number;
    filters?: AppointmentFilters;
  }) => void;
  fetchAdminMatches: (params?: { page?: number; limit?: number; filters?: MatchFilters }) => void;
  fetchAdminAnalytics: (dateRange?: '7d' | '30d' | '90d' | '1y') => void;
  fetchAuditLogs: (params?: { page?: number; limit?: number; filters?: AuditLogFilters }) => void;
  fetchModerationReports: (params?: {
    page?: number;
    limit?: number;
    filters?: ModerationReportFilters;
  }) => void;
  handleModerationReport: (
    reportId: string,
    action: 'approve' | 'reject' | 'escalate',
    reason?: string
  ) => void;
  fetchAdminSettings: () => void;
  updateAdminSettings: (settingsData: Record<string, unknown>) => void;
  clearError: () => void;
  clearUserError: () => void;
  clearSkillError: () => void;
  clearAppointmentError: () => void;
  clearMatchError: () => void;
  clearAnalyticsError: () => void;
  clearSystemHealthError: () => void;
  clearAuditLogError: () => void;
  clearReportError: () => void;
  clearSettingsError: () => void;
  setUserFilters: (filters: UserFilters) => void;
  setSkillFilters: (filters: SkillFilters) => void;
  setAppointmentFilters: (filters: AppointmentFilters) => void;
  setMatchFilters: (filters: MatchFilters) => void;
  setAuditLogFilters: (filters: AuditLogFilters) => void;
  setReportFilters: (filters: ModerationReportFilters) => void;
  setUserPagination: (pagination: { page?: number; limit?: number }) => void;
  setSkillPagination: (pagination: { page?: number; limit?: number }) => void;
  setAppointmentPagination: (pagination: { page?: number; limit?: number }) => void;
  setMatchPagination: (pagination: { page?: number; limit?: number }) => void;
  setAuditLogPagination: (pagination: { page?: number; limit?: number }) => void;
  setReportPagination: (pagination: { page?: number; limit?: number }) => void;
} => {
  const dispatch = useAppDispatch();

  // ===== SELECTORS =====
  const dashboard = useAppSelector(selectAdminDashboard);
  const systemHealth = useAppSelector(selectSystemHealth);
  const isLoading = useAppSelector(selectAdminLoading);
  const errorMessage = useAppSelector(selectAdminError);
  const isLoadingSystemHealth = useAppSelector(selectIsLoadingSystemHealth);
  const systemHealthError = useAppSelector(selectSystemHealthError);

  const users = useAppSelector(selectAdminUsers);
  const skills = useAppSelector(selectAdminSkills);
  const appointments = useAppSelector(selectAdminAppointments);
  const matches = useAppSelector(selectAdminMatches);
  const auditLogs = useAppSelector(selectAuditLogs);
  const moderationReports = useAppSelector(selectModerationReports);
  const settings = useAppSelector(selectAdminSettings);
  const analytics = useAppSelector(selectAdminAnalytics);

  const isLoadingUsers = useAppSelector(selectIsLoadingUsers);
  const isLoadingSkills = useAppSelector(selectIsLoadingSkills);
  const isLoadingAppointments = useAppSelector(selectIsLoadingAppointments);
  const isLoadingMatches = useAppSelector(selectIsLoadingMatches);
  const isLoadingAnalytics = useAppSelector(selectIsLoadingAnalytics);
  const isLoadingAuditLogs = useAppSelector(selectIsLoadingAuditLogs);
  const isLoadingReports = useAppSelector(selectIsLoadingReports);
  const isLoadingSettings = useAppSelector(selectIsLoadingSettings);

  const userError = useAppSelector(selectUserError);
  const skillError = useAppSelector(selectSkillError);
  const appointmentError = useAppSelector(selectAppointmentError);
  const matchError = useAppSelector(selectMatchError);
  const analyticsError = useAppSelector(selectAnalyticsError);
  const auditLogError = useAppSelector(selectAuditLogError);
  const reportError = useAppSelector(selectReportError);
  const settingsError = useAppSelector(selectSettingsError);

  // ===== MEMOIZED ACTIONS =====
  const actions = useMemo(
    () => ({
      // === DASHBOARD OPERATIONS ===
      fetchAdminDashboard: () => dispatch(fetchAdminDashboard()),

      fetchSystemHealth: () => dispatch(fetchSystemHealth()),

      // === USER MANAGEMENT ===
      fetchAdminUsers: (params?: { page?: number; limit?: number; filters?: UserFilters }) =>
        dispatch(fetchAdminUsers(params ?? {})),

      updateUserRole: (userId: string, role: string) => dispatch(updateUserRole({ userId, role })),

      suspendUser: (userId: string, reason: string) => dispatch(suspendUser({ userId, reason })),

      unsuspendUser: (userId: string) => dispatch(unsuspendUser(userId)),

      deleteUser: (userId: string) => dispatch(deleteUser(userId)),

      // === SKILL MANAGEMENT ===
      fetchAdminSkills: (params?: { page?: number; limit?: number; filters?: SkillFilters }) =>
        dispatch(fetchAdminSkills(params ?? {})),

      moderateSkill: (
        skillId: string,
        action: 'approve' | 'reject' | 'quarantine',
        reason?: string
      ) => dispatch(moderateSkill({ skillId, action, reason })),

      // === APPOINTMENT MANAGEMENT ===
      fetchAdminAppointments: (params?: {
        page?: number;
        limit?: number;
        filters?: AppointmentFilters;
      }) => dispatch(fetchAdminAppointments(params ?? {})),

      // === MATCH MANAGEMENT ===
      fetchAdminMatches: (params?: { page?: number; limit?: number; filters?: MatchFilters }) =>
        dispatch(fetchAdminMatches(params ?? {})),

      // === ANALYTICS ===
      fetchAdminAnalytics: (dateRange?: '7d' | '30d' | '90d' | '1y') =>
        dispatch(fetchAdminAnalytics(dateRange ?? '30d')),

      // === AUDIT LOGS ===
      fetchAuditLogs: (params?: { page?: number; limit?: number; filters?: AuditLogFilters }) =>
        dispatch(fetchAuditLogs(params ?? {})),

      // === MODERATION ===
      fetchModerationReports: (params?: {
        page?: number;
        limit?: number;
        filters?: ModerationReportFilters;
      }) => dispatch(fetchModerationReports(params ?? {})),

      handleModerationReport: (
        reportId: string,
        action: 'approve' | 'reject' | 'escalate',
        reason?: string
      ) => dispatch(handleModerationReport({ reportId, action, reason })),

      // === SETTINGS ===
      fetchAdminSettings: () => dispatch(fetchAdminSettings()),

      updateAdminSettings: (settingsData: Record<string, unknown>) =>
        dispatch(updateAdminSettings(settingsData)),

      // === ERROR CLEARING ===
      clearError: () => {
        dispatch(clearError());
      },

      clearUserError: () => {
        dispatch(clearUserError());
      },

      clearSkillError: () => {
        dispatch(clearSkillError());
      },

      clearAppointmentError: () => {
        dispatch(clearAppointmentError());
      },

      clearMatchError: () => {
        dispatch(clearMatchError());
      },

      clearAnalyticsError: () => {
        dispatch(clearAnalyticsError());
      },

      clearSystemHealthError: () => {
        dispatch(clearSystemHealthError());
      },

      clearAuditLogError: () => {
        dispatch(clearAuditLogError());
      },

      clearReportError: () => {
        dispatch(clearReportError());
      },

      clearSettingsError: () => {
        dispatch(clearSettingsError());
      },

      // === FILTER OPERATIONS ===
      setUserFilters: (filters: UserFilters) => {
        dispatch(setUserFilters(filters));
      },

      setSkillFilters: (filters: SkillFilters) => {
        dispatch(setSkillFilters(filters));
      },

      setAppointmentFilters: (filters: AppointmentFilters) => {
        dispatch(setAppointmentFilters(filters));
      },

      setMatchFilters: (filters: MatchFilters) => {
        dispatch(setMatchFilters(filters));
      },

      setAuditLogFilters: (filters: AuditLogFilters) => {
        dispatch(setAuditLogFilters(filters));
      },

      setReportFilters: (filters: ModerationReportFilters) => {
        dispatch(setReportFilters(filters));
      },

      // === PAGINATION OPERATIONS ===
      setUserPagination: (pagination: { page?: number; limit?: number }) => {
        dispatch(setUserPagination(pagination));
      },

      setSkillPagination: (pagination: { page?: number; limit?: number }) => {
        dispatch(setSkillPagination(pagination));
      },

      setAppointmentPagination: (pagination: { page?: number; limit?: number }) => {
        dispatch(setAppointmentPagination(pagination));
      },

      setMatchPagination: (pagination: { page?: number; limit?: number }) => {
        dispatch(setMatchPagination(pagination));
      },

      setAuditLogPagination: (pagination: { page?: number; limit?: number }) => {
        dispatch(setAuditLogPagination(pagination));
      },

      setReportPagination: (pagination: { page?: number; limit?: number }) => {
        dispatch(setReportPagination(pagination));
      },
    }),
    [dispatch]
  );

  // ===== RETURN OBJECT =====
  return {
    // === STATE ===
    dashboard,
    systemHealth,
    isLoading,
    errorMessage,
    isLoadingSystemHealth,
    systemHealthError,
    users,
    skills,
    appointments,
    matches,
    auditLogs,
    moderationReports,
    settings,
    analytics,
    isLoadingUsers,
    isLoadingSkills,
    isLoadingAppointments,
    isLoadingMatches,
    isLoadingAnalytics,
    isLoadingAuditLogs,
    isLoadingReports,
    isLoadingSettings,
    userError,
    skillError,
    appointmentError,
    matchError,
    analyticsError,
    auditLogError,
    reportError,
    settingsError,

    // === ACTIONS ===
    ...actions,
  };
};

export default useAdmin;
