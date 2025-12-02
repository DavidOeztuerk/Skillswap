import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { AdminAnalytics, AdminAppointment, AdminDashboardData, AdminMatch, AdminSettings, AdminSkill, AdminUser, AuditLog, ModerationReport, SystemHealth } from "../../types/models/Admin";
import { SecurityAlertResponse, SecurityAlertStatisticsResponse } from "../../types/models/SecurityAlert";
import { RequestState } from "../../types/common/RequestState";

export const adminUsersAdapter = createEntityAdapter<AdminUser, EntityId>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
});

export interface AdminEntityState extends EntityState<AdminUser, EntityId>, RequestState {
   // Data
  dashboard: AdminDashboardData | null;
  users: AdminUser[];
  skills: AdminSkill[];
  appointments: AdminAppointment[];
  matches: AdminMatch[];
  analytics: AdminAnalytics | null;
  systemHealth: SystemHealth | null;
  auditLogs: AuditLog[];
  moderationReports: ModerationReport[];
  settings: AdminSettings | null;
  securityAlerts: SecurityAlertResponse[];
  securityAlertStatistics: SecurityAlertStatisticsResponse | null;

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
  filters: AdminFilters;
}

export const initialAdminState: AdminEntityState = adminUsersAdapter.getInitialState({
   dashboard: null,
  users: [],
  skills: [],
  appointments: [],
  matches: [],
  analytics: null,
  systemHealth: null,
  auditLogs: [],
  moderationReports: [],
  settings: null,
  securityAlerts: [],
  securityAlertStatistics: null,

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
  
  filters: {
    users: { status: 'all', role: 'all', search: '' },
    skills: { status: 'all', category: 'all', search: '' },
    appointments: { status: 'all', dateRange: null },
    matches: { status: 'all', dateRange: null },
    auditLogs: { action: 'all', user: '', dateRange: null },
    reports: { type: 'all', status: 'all' },
    securityAlerts: {
      minLevel: '',
      type: '',
      includeRead: true,
      includeDismissed: false,
    },
  },
});

export const adminUsersSelectors = adminUsersAdapter.getSelectors();

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
}

export interface AdminFilters {
  users: {
    status: 'all' | 'active' | 'suspended' | 'pending';
    role: 'all' | 'user' | 'admin' | 'moderator';
    search: string;
  };
  skills: {
    status: 'all' | 'approved' | 'pending' | 'rejected' | 'quarantined';
    category: string;
    search: string;
  };
  appointments: {
    status: 'all' | 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
    dateRange: { start: Date; end: Date } | null;
  };
  matches: {
    status: 'all' | 'pending' | 'accepted' | 'rejected' | 'expired';
    dateRange: { start: Date; end: Date } | null;
  };
  auditLogs: {
    action: 'all' | 'login' | 'logout' | 'create' | 'update' | 'delete' | 'suspend' | 'unsuspend';
    user: string;
    dateRange: { start: Date; end: Date } | null;
  };
  reports: {
    type: 'all' | 'inappropriate-content' | 'spam' | 'harassment' | 'other';
    status: 'all' | 'pending' | 'approved' | 'rejected' | 'escalated';
  };
  securityAlerts: {
    minLevel: string;
    type: string;
    includeRead: boolean;
    includeDismissed: boolean;
  };
}
