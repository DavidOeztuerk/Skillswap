import { createEntityAdapter, type EntityState, type EntityId } from '@reduxjs/toolkit';
import type {
  AdminAnalytics,
  AdminAppointment,
  AdminDashboardData,
  AdminMatch,
  AdminSettings,
  AdminSkill,
  AdminUser,
  AuditLog,
  ModerationReport,
  SystemHealth,
} from '../../types/models/Admin';
import type {
  SecurityAlertResponse,
  SecurityAlertStatisticsResponse,
} from '../../types/models/SecurityAlert';
import type { RequestState } from '../../types/common/RequestState';
import type {
  AppointmentFilters,
  AuditLogFilters,
  MatchFilters,
  ModerationReportFilters,
  SecurityAlertFilters,
  SkillFilters,
  UserFilters,
} from '../../types/filters/AdminFilters';

export const adminUsersAdapter = createEntityAdapter<AdminUser, EntityId>({
  selectId: (user) => user.id,
  sortComparer: (a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
});

export interface AdminEntityState extends EntityState<AdminUser, EntityId>, RequestState {
  // Data
  dashboard: AdminDashboardData | undefined;
  users: AdminUser[];
  skills: AdminSkill[];
  appointments: AdminAppointment[];
  matches: AdminMatch[];
  analytics: AdminAnalytics | undefined;
  systemHealth: SystemHealth | undefined;
  auditLogs: AuditLog[];
  moderationReports: ModerationReport[];
  settings: AdminSettings | undefined;
  securityAlerts: SecurityAlertResponse[];
  securityAlertStatistics: SecurityAlertStatisticsResponse | undefined;

  // Loading states
  isLoading: boolean;
  isLoadingUsers: boolean;
  isLoadingSkills: boolean;
  isLoadingAppointments: boolean;
  isLoadingMatches: boolean;
  isLoadingAnalytics: boolean;
  isLoadingSystemHealth: boolean;
  isLoadingAuditLogs: boolean;
  isLoadingReports: boolean;
  isLoadingSettings: boolean;
  isLoadingSecurityAlerts: boolean;
  isLoadingSecurityStatistics: boolean;

  // Error states
  userError: string | undefined;
  skillError: string | undefined;
  appointmentError: string | undefined;
  matchError: string | undefined;
  analyticsError: string | undefined;
  systemHealthError: string | undefined;
  auditLogError: string | undefined;
  reportError: string | undefined;
  settingsError: string | undefined;
  securityAlertError: string | undefined;

  // Pagination
  pagination: {
    users: AdminPagination;
    skills: AdminPagination;
    appointments: AdminPagination;
    matches: AdminPagination;
    auditLogs: AdminPagination;
    reports: AdminPagination;
    securityAlerts: AdminPagination;
  };

  // Filters
  filters: AdminFilters | undefined;
}

export const initialAdminState: AdminEntityState = adminUsersAdapter.getInitialState({
  dashboard: undefined,
  users: [],
  skills: [],
  appointments: [],
  matches: [],
  analytics: undefined,
  systemHealth: undefined,
  auditLogs: [],
  moderationReports: [],
  settings: undefined,
  securityAlerts: [],
  securityAlertStatistics: undefined,

  isLoading: false,
  isLoadingUsers: false,
  isLoadingSkills: false,
  isLoadingAppointments: false,
  isLoadingMatches: false,
  isLoadingAnalytics: false,
  isLoadingSystemHealth: false,
  isLoadingAuditLogs: false,
  isLoadingReports: false,
  isLoadingSettings: false,
  isLoadingSecurityAlerts: false,
  isLoadingSecurityStatistics: false,

  errorMessage: undefined,
  userError: undefined,
  skillError: undefined,
  appointmentError: undefined,
  matchError: undefined,
  analyticsError: undefined,
  systemHealthError: undefined,
  auditLogError: undefined,
  reportError: undefined,
  settingsError: undefined,
  securityAlertError: undefined,

  pagination: {
    users: { page: 1, limit: 20, total: 0 },
    skills: { page: 1, limit: 20, total: 0 },
    appointments: { page: 1, limit: 20, total: 0 },
    matches: { page: 1, limit: 20, total: 0 },
    auditLogs: { page: 1, limit: 50, total: 0 },
    reports: { page: 1, limit: 20, total: 0 },
    securityAlerts: { page: 1, limit: 20, total: 0 },
  },

  filters: undefined,
});

export const adminUsersSelectors = adminUsersAdapter.getSelectors();

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
}

export interface AdminFilters {
  users: UserFilters;
  skills: SkillFilters;
  matches: MatchFilters;
  appointments: AppointmentFilters;
  auditLogs: AuditLogFilters;
  reports: ModerationReportFilters;
  securityAlerts: SecurityAlertFilters;
}
