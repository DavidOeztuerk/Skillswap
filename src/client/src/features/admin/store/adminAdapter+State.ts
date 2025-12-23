import { createEntityAdapter, type EntityId, type EntityState } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type {
  UserFilters,
  SkillFilters,
  AuditLogFilters,
  ModerationReportFilters,
  SecurityAlertFilters,
} from '../../../shared/types/filters/AdminFilters';
import type {
  SecurityAlertResponse,
  SecurityAlertStatisticsResponse,
} from '../../notifications/types/SecurityAlert';
import type {
  AdminUser,
  AdminDashboardData,
  AdminSkill,
  AdminAppointment,
  AdminMatch,
  AdminAnalytics,
  SystemHealth,
  AuditLog,
  ModerationReport,
  AdminSettings,
} from '../types/Admin';

// Admin appointment status type matching AdminAppointment entity
export type AdminAppointmentStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

// Admin match status type matching AdminMatch entity
export type AdminMatchStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// Admin-specific filter types that match AdminAppointment and AdminMatch entity types
export interface AdminAppointmentFilters {
  status?: 'all' | AdminAppointmentStatus;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface AdminMatchFilters {
  status?: 'all' | AdminMatchStatus;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

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
  matches: AdminMatchFilters;
  appointments: AdminAppointmentFilters;
  auditLogs: AuditLogFilters;
  reports: ModerationReportFilters;
  securityAlerts: SecurityAlertFilters;
}
