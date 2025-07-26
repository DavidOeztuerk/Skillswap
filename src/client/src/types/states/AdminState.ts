import {
  AdminDashboardData,
  AdminUser,
  AdminSkill,
  AdminAppointment,
  AdminMatch,
  AdminAnalytics,
  SystemHealth,
  AuditLog,
  ModerationReport,
  AdminSettings,
} from '../models/Admin';
import { SliceError } from '../../store/types';

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
}

export interface AdminState {
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
  
  // Error states
  error: SliceError | null;
  userError: SliceError | null;
  skillError: SliceError | null;
  appointmentError: SliceError | null;
  matchError: SliceError | null;
  analyticsError: SliceError | null;
  systemHealthError: SliceError | null;
  auditLogError: SliceError | null;
  reportError: SliceError | null;
  settingsError: SliceError | null;
  
  // Pagination
  pagination: {
    users: AdminPagination;
    skills: AdminPagination;
    appointments: AdminPagination;
    matches: AdminPagination;
    auditLogs: AdminPagination;
    reports: AdminPagination;
  };
  
  // Filters
  filters: AdminFilters;
}