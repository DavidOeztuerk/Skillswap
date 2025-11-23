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
import {
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
export const useAdmin = () => {
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
  const actions = useMemo(() => ({
    
    // === DASHBOARD OPERATIONS ===
    fetchAdminDashboard: () => {
      return dispatch(fetchAdminDashboard());
    },

    fetchSystemHealth: () => {
      return dispatch(fetchSystemHealth());
    },

    // === USER MANAGEMENT ===
    fetchAdminUsers: (params?: { page?: number; limit?: number; filters?: UserFilters }) => {
      return dispatch(fetchAdminUsers(params || {}));
    },

    updateUserRole: (userId: string, role: string) => {
      return dispatch(updateUserRole({ userId, role }));
    },

    suspendUser: (userId: string, reason: string) => {
      return dispatch(suspendUser({ userId, reason }));
    },

    unsuspendUser: (userId: string) => {
      return dispatch(unsuspendUser(userId));
    },

    deleteUser: (userId: string) => {
      return dispatch(deleteUser(userId));
    },

    // === SKILL MANAGEMENT ===
    fetchAdminSkills: (params?: { page?: number; limit?: number; filters?: SkillFilters }) => {
      return dispatch(fetchAdminSkills(params || {}));
    },

    moderateSkill: (skillId: string, action: 'approve' | 'reject' | 'quarantine', reason?: string) => {
      return dispatch(moderateSkill({ skillId, action, reason }));
    },

    // === APPOINTMENT MANAGEMENT ===
    fetchAdminAppointments: (params?: { page?: number; limit?: number; filters?: AppointmentFilters }) => {
      return dispatch(fetchAdminAppointments(params || {}));
    },

    // === MATCH MANAGEMENT ===
    fetchAdminMatches: (params?: { page?: number; limit?: number; filters?: MatchFilters }) => {
      return dispatch(fetchAdminMatches(params || {}));
    },

    // === ANALYTICS ===
    fetchAdminAnalytics: (dateRange?: "7d" | "30d" | "90d" | "1y") => {
      return dispatch(fetchAdminAnalytics(dateRange || "30d"));
    },

    // === AUDIT LOGS ===
    fetchAuditLogs: (params?: { page?: number; limit?: number; filters?: AuditLogFilters }) => {
      return dispatch(fetchAuditLogs(params || {}));
    },

    // === MODERATION ===
    fetchModerationReports: (params?: { page?: number; limit?: number; filters?: ModerationReportFilters }) => {
      return dispatch(fetchModerationReports(params || {}));
    },

    handleModerationReport: (reportId: string, action: 'approve' | 'reject' | 'escalate', reason?: string) => {
      return dispatch(handleModerationReport({ reportId, action, reason }));
    },

    // === SETTINGS ===
    fetchAdminSettings: () => {
      return dispatch(fetchAdminSettings());
    },

    updateAdminSettings: (settings: Record<string, unknown>) => {
      return dispatch(updateAdminSettings(settings));
    },

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

  }), [dispatch]);

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