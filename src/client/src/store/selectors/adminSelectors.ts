import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Admin Selectors
 * Centralized selectors for admin state and entity operations
 */

// Base selectors
export const selectAdminState = (state: RootState) => state.admin;
export const selectAdminLoading = (state: RootState) => state.admin.isLoading;
export const selectAdminError = (state: RootState) => state.admin.errorMessage;

// Dashboard selectors
export const selectAdminDashboard = createSelector(
  [selectAdminState],
  (adminState) => adminState.dashboard
);

export const selectAdminAnalytics = createSelector(
  [selectAdminState],
  (adminState) => adminState.analytics
);

export const selectSystemHealth = createSelector(
  [selectAdminState],
  (adminState) => adminState.systemHealth
);

export const selectAdminSettings = createSelector(
  [selectAdminState],
  (adminState) => adminState.settings
);

// Entity selectors - use users array directly
export const selectAllAdminUsers = createSelector(
  [selectAdminState],
  (adminState) => adminState.users || []
);

export const selectAdminUserById = createSelector(
  [selectAllAdminUsers, (_: RootState, userId: string) => userId],
  (users, userId) => users.find(user => user.id === userId) || null
);

// Direct array selectors
export const selectAdminUsers = createSelector(
  [selectAdminState],
  (adminState) => adminState.users
);

export const selectAdminSkills = createSelector(
  [selectAdminState],
  (adminState) => adminState.skills
);

export const selectAdminAppointments = createSelector(
  [selectAdminState],
  (adminState) => adminState.appointments
);

export const selectAdminMatches = createSelector(
  [selectAdminState],
  (adminState) => adminState.matches
);

export const selectAuditLogs = createSelector(
  [selectAdminState],
  (adminState) => adminState.auditLogs
);

export const selectModerationReports = createSelector(
  [selectAdminState],
  (adminState) => adminState.moderationReports
);

// Loading state selectors
export const selectIsLoadingUsers = (state: RootState) => state.admin.isLoadingUsers;
export const selectIsLoadingSkills = (state: RootState) => state.admin.isLoadingSkills;
export const selectIsLoadingAppointments = (state: RootState) => state.admin.isLoadingAppointments;
export const selectIsLoadingMatches = (state: RootState) => state.admin.isLoadingMatches;
export const selectIsLoadingAnalytics = (state: RootState) => state.admin.isLoadingAnalytics;
export const selectIsLoadingSystemHealth = (state: RootState) => state.admin.isLoadingSystemHealth;
export const selectIsLoadingAuditLogs = (state: RootState) => state.admin.isLoadingAuditLogs;
export const selectIsLoadingReports = (state: RootState) => state.admin.isLoadingReports;
export const selectIsLoadingSettings = (state: RootState) => state.admin.isLoadingSettings;

// Error state selectors
export const selectUserError = (state: RootState) => state.admin.userError;
export const selectSkillError = (state: RootState) => state.admin.skillError;
export const selectAppointmentError = (state: RootState) => state.admin.appointmentError;
export const selectMatchError = (state: RootState) => state.admin.matchError;
export const selectAnalyticsError = (state: RootState) => state.admin.analyticsError;
export const selectSystemHealthError = (state: RootState) => state.admin.systemHealthError;
export const selectAuditLogError = (state: RootState) => state.admin.auditLogError;
export const selectReportError = (state: RootState) => state.admin.reportError;
export const selectSettingsError = (state: RootState) => state.admin.settingsError;

// Filter selectors
export const selectAdminFilters = createSelector(
  [selectAdminState],
  (adminState) => adminState.filters
);

export const selectUserFilters = createSelector(
  [selectAdminFilters],
  (filters) => filters.users
);

export const selectSkillFilters = createSelector(
  [selectAdminFilters],
  (filters) => filters.skills
);

export const selectAdminAppointmentFilters = createSelector(
  [selectAdminFilters],
  (filters) => filters.appointments
);

export const selectMatchFilters = createSelector(
  [selectAdminFilters],
  (filters) => filters.matches
);

export const selectAuditLogFilters = createSelector(
  [selectAdminFilters],
  (filters) => filters.auditLogs
);

export const selectReportFilters = createSelector(
  [selectAdminFilters],
  (filters) => filters.reports
);

// Pagination selectors
export const selectAdminPagination = createSelector(
  [selectAdminState],
  (adminState) => adminState.pagination
);

export const selectUsersPagination = createSelector(
  [selectAdminPagination],
  (pagination) => pagination.users
);

export const selectSkillsPagination = createSelector(
  [selectAdminPagination],
  (pagination) => pagination.skills
);

export const selectAppointmentsPagination = createSelector(
  [selectAdminPagination],
  (pagination) => pagination.appointments
);

export const selectMatchesPagination = createSelector(
  [selectAdminPagination],
  (pagination) => pagination.matches
);

export const selectAuditLogsPagination = createSelector(
  [selectAdminPagination],
  (pagination) => pagination.auditLogs
);

export const selectReportsPagination = createSelector(
  [selectAdminPagination],
  (pagination) => pagination.reports
);

// Filtered data selectors
export const selectFilteredUsers = createSelector(
  [selectAdminUsers, selectUserFilters],
  (users, filters) => {
    let filtered = [...users];

    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.accountStatus === filters.status);
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(user => 
        user.roles?.includes(filters.role)
      );
    }

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }
);

export const selectAdminFilteredSkills = createSelector(
  [selectAdminSkills, selectSkillFilters],
  (skills, filters) => {
    let filtered = [...skills];

    if (filters.status !== 'all') {
      filtered = filtered.filter(skill => skill.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(skill => skill.category?.id === filters.category);
    }

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(skill => 
        skill.name?.toLowerCase().includes(searchTerm) ||
        skill.description?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }
);

export const selectFilteredAppointments = createSelector(
  [selectAdminAppointments, selectAdminAppointmentFilters],
  (appointments, filters) => {
    let filtered = [...appointments];

    if (filters.status !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === filters.status);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.startTime);
        return appointmentDate >= filters.dateRange!.start && 
               appointmentDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }
);

export const selectFilteredMatches = createSelector(
  [selectAdminMatches, selectMatchFilters],
  (matches, filters) => {
    let filtered = [...matches];

    if (filters.status !== 'all') {
      filtered = filtered.filter(match => match.status === filters.status);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.createdAt);
        return matchDate >= filters.dateRange!.start && 
               matchDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }
);

export const selectFilteredAuditLogs = createSelector(
  [selectAuditLogs, selectAuditLogFilters],
  (auditLogs, filters) => {
    let filtered = [...auditLogs];

    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.user.trim()) {
      const userTerm = filters.user.toLowerCase();
      filtered = filtered.filter(log =>
        log.actor?.firstName?.toLowerCase().includes(userTerm) ||
        log.actor?.email?.toLowerCase().includes(userTerm) ||
        log.userName?.toLowerCase().includes(userTerm)
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= filters.dateRange!.start && 
               logDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }
);

export const selectFilteredReports = createSelector(
  [selectModerationReports, selectReportFilters],
  (reports, filters) => {
    let filtered = [...reports];

    if (filters.type !== 'all') {
      filtered = filtered.filter(report => report.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    return filtered;
  }
);

// Statistics selectors
export const selectUserStatistics = createSelector(
  [selectAdminUsers],
  (users) => {
    const total = users.length;
    const active = users.filter(u => u.accountStatus === 'active').length;
    const suspended = users.filter(u => u.accountStatus === 'suspended').length;
    const pending = users.filter(u => u.accountStatus === 'pending').length;

    return {
      total,
      active,
      suspended,
      pending,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }
);

export const selectAdminSkillStatistics = createSelector(
  [selectAdminSkills],
  (skills) => {
    const total = skills.length;
    const approved = skills.filter(s => s.status === 'approved').length;
    const pending = skills.filter(s => s.status === 'pending').length;
    const rejected = skills.filter(s => s.status === 'rejected').length;

    return {
      total,
      approved,
      pending,
      rejected,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
    };
  }
);

export const selectRecentActivity = createSelector(
  [selectAuditLogs],
  (auditLogs) => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return auditLogs
      .filter(log => new Date(log.timestamp).getTime() > oneDayAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }
);

export const selectPendingReports = createSelector(
  [selectModerationReports],
  (reports) => reports.filter(report => report.status === 'pending')
);

export const selectCriticalSystemIssues = createSelector(
  [selectSystemHealth],
  (systemHealth) => {
    if (!systemHealth) return [];

    const issues = [];
    if (systemHealth.infrastructure?.database?.status === 'disconnected') issues.push('Database Down');
    if (systemHealth.infrastructure?.cache?.status === 'disconnected') issues.push('Cache Down');
    if (systemHealth.infrastructure?.messageQueue?.status === 'disconnected') issues.push('Message Queue Down');
    if (systemHealth.status === 'critical') issues.push('System Critical');

    return issues;
  }
);

// Security Alert selectors
export const selectSecurityAlerts = createSelector(
  [selectAdminState],
  (adminState) => adminState.securityAlerts
);

export const selectSecurityAlertStatistics = createSelector(
  [selectAdminState],
  (adminState) => adminState.securityAlertStatistics
);

export const selectIsLoadingSecurityAlerts = (state: RootState) => state.admin.isLoadingSecurityAlerts;
export const selectIsLoadingSecurityStatistics = (state: RootState) => state.admin.isLoadingSecurityStatistics;
export const selectSecurityAlertError = (state: RootState) => state.admin.securityAlertError;

export const selectSecurityAlertFilters = createSelector(
  [selectAdminFilters],
  (filters) => filters.securityAlerts
);

export const selectSecurityAlertsPagination = createSelector(
  [selectAdminPagination],
  (pagination) => pagination.securityAlerts
);