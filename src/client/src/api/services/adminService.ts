import apiClient from '../apiClient';
import { ADMIN_ENDPOINTS, getUrlWithParams } from '../../config/endpoints';
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
} from '../../types/models/Admin';
import { PaginatedResponse } from '../../types/common/PaginatedResponse';

export class AdminService {
  // Dashboard
  async getDashboard(): Promise<AdminDashboardData> {
    return await apiClient.get<AdminDashboardData>(ADMIN_ENDPOINTS.DASHBOARD);
  }

  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    filters?: any;
  }): Promise<PaginatedResponse<AdminUser>> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.USER_MANAGEMENT.GET_ALL, {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params.filters,
    });
    return await apiClient.get<PaginatedResponse<AdminUser>>(url);
  }

  async getUserById(userId: string): Promise<AdminUser> {
    return await apiClient.get<AdminUser>(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.GET_BY_ID}/${userId}`);
  }

  async updateUserRole(userId: string, role: string): Promise<AdminUser> {
    return await apiClient.put<AdminUser>(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.UPDATE_ROLE}/${userId}/role`, {
      role,
    });
  }

  async suspendUser(userId: string, reason: string): Promise<AdminUser> {
    return await apiClient.post<AdminUser>(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.SUSPEND}/${userId}/suspend`, {
      reason,
    });
  }

  async unsuspendUser(userId: string): Promise<AdminUser> {
    return await apiClient.post<AdminUser>(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.UNSUSPEND}/${userId}/unsuspend`);
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.DELETE}/${userId}`);
  }

  async exportUsers(filters?: any): Promise<Blob> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.USER_MANAGEMENT.EXPORT, filters || {});
    return await apiClient.get<Blob>(url, {
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  }

  // Skills Management
  async getSkills(params: {
    page?: number;
    limit?: number;
    filters?: any;
  }): Promise<PaginatedResponse<AdminSkill>> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.SKILLS, {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params.filters,
    });
    return await apiClient.get<PaginatedResponse<AdminSkill>>(url);
  }

  async moderateSkill(skillId: string, action: 'approve' | 'reject' | 'quarantine', reason?: string): Promise<AdminSkill> {
    const endpoint = action === 'approve' 
      ? ADMIN_ENDPOINTS.CONTENT_MODERATION.APPROVE_CONTENT
      : action === 'reject'
      ? ADMIN_ENDPOINTS.CONTENT_MODERATION.REJECT_CONTENT
      : ADMIN_ENDPOINTS.CONTENT_MODERATION.QUARANTINE;

    return await apiClient.post<AdminSkill>(`${endpoint}/${skillId}`, {
      reason,
    });
  }

  // Appointments Management
  async getAppointments(params: {
    page?: number;
    limit?: number;
    filters?: any;
  }): Promise<PaginatedResponse<AdminAppointment>> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.APPOINTMENTS, {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params.filters,
    });
    return await apiClient.get<PaginatedResponse<AdminAppointment>>(url);
  }

  // Matches Management
  async getMatches(params: {
    page?: number;
    limit?: number;
    filters?: any;
  }): Promise<PaginatedResponse<AdminMatch>> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.MATCHES, {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params.filters,
    });
    return await apiClient.get<PaginatedResponse<AdminMatch>>(url);
  }

  // Analytics
  async getAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<AdminAnalytics> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.ANALYTICS, {
      timeRange: timeRange || '30d',
    });
    return await apiClient.get<AdminAnalytics>(url);
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    return await apiClient.get<SystemHealth>(ADMIN_ENDPOINTS.SYSTEM_HEALTH);
  }

  // Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    filters?: any;
  }): Promise<PaginatedResponse<AuditLog>> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.AUDIT_LOGS, {
      page: params.page || 1,
      limit: params.limit || 50,
      ...params.filters,
    });
    return await apiClient.get<PaginatedResponse<AuditLog>>(url);
  }

  // Moderation Reports
  async getModerationReports(params: {
    page?: number;
    limit?: number;
    filters?: any;
  }): Promise<PaginatedResponse<ModerationReport>> {
    const url = getUrlWithParams(ADMIN_ENDPOINTS.REPORTS, {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params.filters,
    });
    return await apiClient.get<PaginatedResponse<ModerationReport>>(url);
  }

  async handleModerationReport(
    reportId: string,
    action: 'approve' | 'reject' | 'escalate',
    reason?: string
  ): Promise<ModerationReport> {
    return await apiClient.post<ModerationReport>(`${ADMIN_ENDPOINTS.REPORTS}/${reportId}/handle`, {
      action,
      reason,
    });
  }

  // Settings
  async getSettings(): Promise<AdminSettings> {
    return await apiClient.get<AdminSettings>(ADMIN_ENDPOINTS.SETTINGS);
  }

  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    return await apiClient.put<AdminSettings>(ADMIN_ENDPOINTS.SETTINGS, settings);
  }

  // Bulk Actions
  async bulkUserAction(userIds: string[], action: 'suspend' | 'unsuspend' | 'delete', reason?: string): Promise<void> {
    await apiClient.post(`${ADMIN_ENDPOINTS.USER_MANAGEMENT.GET_ALL}/bulk-action`, {
      userIds,
      action,
      reason,
    });
  }

  async bulkSkillAction(skillIds: string[], action: 'approve' | 'reject' | 'quarantine', reason?: string): Promise<void> {
    await apiClient.post(`${ADMIN_ENDPOINTS.SKILLS}/bulk-action`, {
      skillIds,
      action,
      reason,
    });
  }

  async bulkReportAction(reportIds: string[], action: 'approve' | 'reject' | 'escalate', reason?: string): Promise<void> {
    await apiClient.post(`${ADMIN_ENDPOINTS.REPORTS}/bulk-action`, {
      reportIds,
      action,
      reason,
    });
  }

  // System Operations
  async clearCache(): Promise<void> {
    await apiClient.post(`${ADMIN_ENDPOINTS.SYSTEM_HEALTH}/clear-cache`);
  }

  async restartService(serviceName: string): Promise<void> {
    await apiClient.post(`${ADMIN_ENDPOINTS.SYSTEM_HEALTH}/restart-service`, {
      serviceName,
    });
  }

  async backupDatabase(): Promise<void> {
    await apiClient.post(`${ADMIN_ENDPOINTS.SYSTEM_HEALTH}/backup-database`);
  }

  // Notifications
  async sendBulkNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    targetUsers?: string[];
    targetRoles?: string[];
  }): Promise<void> {
    await apiClient.post(`${ADMIN_ENDPOINTS.DASHBOARD}/send-notification`, notification);
  }

  // Reports Generation
  async generateReport(type: 'users' | 'skills' | 'appointments' | 'matches' | 'system', params: any): Promise<Blob> {
    return await apiClient.post<Blob>(`${ADMIN_ENDPOINTS.DASHBOARD}/generate-report`, {
      type,
      ...params,
    }, {
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  }
}

export const adminService = new AdminService();