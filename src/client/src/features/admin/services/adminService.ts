import { apiClient } from '../../../core/api/apiClient';
import { ADMIN_ENDPOINTS } from '../../../core/config/endpoints';
import type { ApiResponse, PagedResponse } from '../../../shared/types/api/UnifiedResponse';
import type {
  SecurityAlertResponse,
  SecurityAlertStatisticsResponse,
  DismissSecurityAlertRequest,
  SecurityAlertActionResponse,
} from '../../notifications/types/SecurityAlert';
import type { AdminAppointmentFilters, AdminMatchFilters } from '../store/adminAdapter+State';
import type {
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
} from '../types/Admin';

export class AdminService {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<AdminDashboardData>> {
    return apiClient.get<AdminDashboardData>(ADMIN_ENDPOINTS.DASHBOARD);
  }

  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    filters?: Record<string, string | number | boolean | undefined>;
  }): Promise<PagedResponse<AdminUser>> {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...params.filters,
    };
    return apiClient.getPaged<AdminUser>(ADMIN_ENDPOINTS.USER_MANAGEMENT.GET_ALL, queryParams);
  }

  async getUserById(userId: string): Promise<AdminUser> {
    return apiClient.getAndExtract<AdminUser>(
      `${ADMIN_ENDPOINTS.USER_MANAGEMENT.GET_BY_ID}/${userId}`
    );
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.patch<AdminUser>(
      `${ADMIN_ENDPOINTS.USER_MANAGEMENT.UPDATE_ROLE}/${userId}/role`,
      {
        role,
      }
    );
  }

  async suspendUser(userId: string, reason: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>(
      `${ADMIN_ENDPOINTS.USER_MANAGEMENT.SUSPEND}/${userId}/suspend`,
      {
        reason,
      }
    );
  }

  async unsuspendUser(userId: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>(
      `${ADMIN_ENDPOINTS.USER_MANAGEMENT.UNSUSPEND}/${userId}/unsuspend`
    );
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.DELETE}/${userId}`);
  }

  async exportUsers(
    filters?: Record<string, string | number | boolean | undefined>
  ): Promise<Blob> {
    const queryParams = filters ?? {};
    const response = await apiClient
      .getAxiosInstance()
      .get<Blob>(ADMIN_ENDPOINTS.USER_MANAGEMENT.EXPORT, {
        params: queryParams,
        responseType: 'blob',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    return response.data;
  }

  // Skills Management
  async getSkills(params: {
    page?: number;
    limit?: number;
    filters?: Record<string, string | number | boolean | undefined>;
  }): Promise<PagedResponse<AdminSkill>> {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...params.filters,
    };
    return apiClient.getPaged<AdminSkill>(ADMIN_ENDPOINTS.SKILLS, queryParams);
  }

  async moderateSkill(
    skillId: string,
    action: 'approve' | 'reject' | 'quarantine',
    reason?: string
  ): Promise<ApiResponse<AdminSkill>> {
    let endpoint: string;
    if (action === 'approve') {
      endpoint = ADMIN_ENDPOINTS.CONTENT_MODERATION.APPROVE_CONTENT;
    } else if (action === 'reject') {
      endpoint = ADMIN_ENDPOINTS.CONTENT_MODERATION.REJECT_CONTENT;
    } else {
      endpoint = ADMIN_ENDPOINTS.CONTENT_MODERATION.QUARANTINE;
    }

    return apiClient.post<AdminSkill>(`${endpoint}/${skillId}`, {
      reason,
    });
  }

  // Appointments Management
  async getAppointments(params: {
    page?: number;
    limit?: number;
    filters?: AdminAppointmentFilters;
  }): Promise<PagedResponse<AdminAppointment>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.filters) {
      if (params.filters.status !== undefined) queryParams.status = params.filters.status;
      if (params.filters.fromDate !== undefined) queryParams.fromDate = params.filters.fromDate;
      if (params.filters.toDate !== undefined) queryParams.toDate = params.filters.toDate;
      if (params.filters.searchTerm !== undefined)
        queryParams.searchTerm = params.filters.searchTerm;
    }
    return apiClient.getPaged<AdminAppointment>(ADMIN_ENDPOINTS.APPOINTMENTS, queryParams);
  }

  // Matches Management
  async getMatches(params: {
    page?: number;
    limit?: number;
    filters?: AdminMatchFilters;
  }): Promise<PagedResponse<AdminMatch>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.filters) {
      if (params.filters.status !== undefined) queryParams.status = params.filters.status;
      if (params.filters.fromDate !== undefined) queryParams.fromDate = params.filters.fromDate;
      if (params.filters.toDate !== undefined) queryParams.toDate = params.filters.toDate;
      if (params.filters.searchTerm !== undefined)
        queryParams.searchTerm = params.filters.searchTerm;
    }
    return apiClient.getPaged<AdminMatch>(ADMIN_ENDPOINTS.MATCHES, queryParams);
  }

  // Analytics
  async getAnalytics(
    timeRange?: '7d' | '30d' | '90d' | '1y'
  ): Promise<ApiResponse<AdminAnalytics>> {
    const queryParams = {
      timeRange: timeRange ?? '30d',
    };
    return apiClient.get<AdminAnalytics>(ADMIN_ENDPOINTS.ANALYTICS, queryParams);
  }

  // System Health
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return apiClient.get<SystemHealth>(ADMIN_ENDPOINTS.SYSTEM_HEALTH);
  }

  // Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    filters?: Record<string, string | number | boolean | undefined>;
  }): Promise<PagedResponse<AuditLog>> {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      ...params.filters,
    };
    return apiClient.getPaged<AuditLog>(ADMIN_ENDPOINTS.AUDIT_LOGS, queryParams);
  }

  // Moderation Reports
  async getModerationReports(params: {
    page?: number;
    limit?: number;
    filters?: Record<string, string | number | boolean | undefined>;
  }): Promise<PagedResponse<ModerationReport>> {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...params.filters,
    };
    return apiClient.getPaged<ModerationReport>(ADMIN_ENDPOINTS.REPORTS, queryParams);
  }

  async handleModerationReport(
    reportId: string,
    action: 'approve' | 'reject' | 'escalate',
    reason?: string
  ): Promise<ApiResponse<ModerationReport>> {
    return apiClient.post<ModerationReport>(`${ADMIN_ENDPOINTS.REPORTS}/${reportId}/handle`, {
      action,
      reason,
    });
  }

  // Settings
  async getSettings(): Promise<ApiResponse<AdminSettings>> {
    return apiClient.get<AdminSettings>(ADMIN_ENDPOINTS.SETTINGS);
  }

  async updateSettings(settings: Partial<AdminSettings>): Promise<ApiResponse<AdminSettings>> {
    return apiClient.patch<AdminSettings>(ADMIN_ENDPOINTS.SETTINGS, settings);
  }

  // Bulk Actions
  async bulkUserAction(
    userIds: string[],
    action: 'suspend' | 'unsuspend' | 'delete',
    reason?: string
  ): Promise<ApiResponse<void>> {
    return apiClient.post(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.GET_ALL}/bulk-action`, {
      userIds,
      action,
      reason,
    });
  }

  async bulkSkillAction(
    skillIds: string[],
    action: 'approve' | 'reject' | 'quarantine',
    reason?: string
  ): Promise<ApiResponse<void>> {
    return apiClient.post(`${ADMIN_ENDPOINTS.SKILLS}/bulk-action`, {
      skillIds,
      action,
      reason,
    });
  }

  async bulkReportAction(
    reportIds: string[],
    action: 'approve' | 'reject' | 'escalate',
    reason?: string
  ): Promise<ApiResponse<void>> {
    return apiClient.post(`${ADMIN_ENDPOINTS.REPORTS}/bulk-action`, {
      reportIds,
      action,
      reason,
    });
  }

  // System Operations
  async clearCache(): Promise<ApiResponse<void>> {
    return apiClient.post(`${ADMIN_ENDPOINTS.SYSTEM_HEALTH}/clear-cache`);
  }

  async restartService(serviceName: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${ADMIN_ENDPOINTS.SYSTEM_HEALTH}/restart-service`, {
      serviceName,
    });
  }

  async backupDatabase(): Promise<ApiResponse<void>> {
    return apiClient.post(`${ADMIN_ENDPOINTS.SYSTEM_HEALTH}/backup-database`);
  }

  // Notifications
  async sendBulkNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    targetUsers?: string[];
    targetRoles?: string[];
  }): Promise<ApiResponse<void>> {
    return apiClient.post(`${ADMIN_ENDPOINTS.DASHBOARD}/send-notification`, notification);
  }

  // Reports Generation
  async generateReport(
    type: 'users' | 'skills' | 'appointments' | 'matches' | 'system',
    params: Record<string, string | number | boolean | undefined>
  ): Promise<Blob> {
    const response = await apiClient.getAxiosInstance().post<Blob>(
      `${ADMIN_ENDPOINTS.DASHBOARD}/generate-report`,
      {
        type,
        ...params,
      },
      {
        responseType: 'blob',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }
    );
    return response.data;
  }

  // Security Monitoring
  async getSecurityAlerts(params: {
    pageNumber?: number;
    pageSize?: number;
    minLevel?: string;
    type?: string;
    includeRead?: boolean;
    includeDismissed?: boolean;
  }): Promise<PagedResponse<SecurityAlertResponse>> {
    const queryParams = {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 20,
      minLevel: params.minLevel,
      type: params.type,
      includeRead: params.includeRead ?? true,
      includeDismissed: params.includeDismissed ?? false,
    };
    return apiClient.getPaged<SecurityAlertResponse>(
      ADMIN_ENDPOINTS.SECURITY.GET_ALERTS,
      queryParams
    );
  }

  async getSecurityAlertById(alertId: string): Promise<ApiResponse<SecurityAlertResponse>> {
    return apiClient.get<SecurityAlertResponse>(
      `${ADMIN_ENDPOINTS.SECURITY.GET_ALERT_BY_ID}/${alertId}`
    );
  }

  async getSecurityAlertStatistics(params?: {
    from?: string;
    to?: string;
  }): Promise<ApiResponse<SecurityAlertStatisticsResponse>> {
    return apiClient.get<SecurityAlertStatisticsResponse>(
      ADMIN_ENDPOINTS.SECURITY.GET_STATISTICS,
      params
    );
  }

  async dismissSecurityAlert(
    alertId: string,
    request: DismissSecurityAlertRequest
  ): Promise<ApiResponse<SecurityAlertActionResponse>> {
    return apiClient.post<SecurityAlertActionResponse>(
      `${ADMIN_ENDPOINTS.SECURITY.DISMISS_ALERT}/${alertId}/dismiss`,
      request
    );
  }

  async markSecurityAlertAsRead(
    alertId: string
  ): Promise<ApiResponse<SecurityAlertActionResponse>> {
    return apiClient.post<SecurityAlertActionResponse>(
      `${ADMIN_ENDPOINTS.SECURITY.MARK_ALERT_READ}/${alertId}/mark-read`,
      {}
    );
  }
}

export const adminService = new AdminService();
