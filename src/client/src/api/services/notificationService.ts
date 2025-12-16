import { NOTIFICATION_ENDPOINTS } from '../../config/endpoints';
import type { Notification, NotificationSettings } from '../../types/models/Notification';
import type { ApiResponse, PagedResponse } from '../../types/api/UnifiedResponse';
import { apiClient } from '../apiClient';

export interface NotificationHistoryRequest {
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Service for notification operations
 */
const notificationService = {
  /**
   * Get all user notifications
   */
  async getNotifications(
    request?: NotificationHistoryRequest
  ): Promise<PagedResponse<Notification>> {
    const params: Record<string, unknown> = {};
    if (request?.type) params.Type = request.type;
    if (request?.status) params.Status = request.status;
    if (request?.startDate) params.StartDate = request.startDate.toISOString();
    if (request?.endDate) params.EndDate = request.endDate.toISOString();
    if (request?.pageNumber !== undefined) params.Page = request.pageNumber;
    if (request?.pageSize !== undefined) params.PageSize = request.pageSize;

    return await apiClient.getPaged<Notification>(NOTIFICATION_ENDPOINTS.GET_ALL, params);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    if (!notificationId.trim()) throw new Error('Benachrichtigungs-ID ist erforderlich');
    return apiClient.post(`${NOTIFICATION_ENDPOINTS.GET_ALL}/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.post(`${NOTIFICATION_ENDPOINTS.GET_ALL}/read-all`);
  },

  /**
   * Get notification settings
   */
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.get<NotificationSettings>(NOTIFICATION_ENDPOINTS.SETTINGS);
  },

  /**
   * Update notification settings
   */
  async updateSettings(settings: NotificationSettings): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.put<NotificationSettings>(NOTIFICATION_ENDPOINTS.SETTINGS, settings);
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    if (!notificationId.trim()) throw new Error('Benachrichtigungs-ID ist erforderlich');
    return apiClient.delete(`${NOTIFICATION_ENDPOINTS.GET_ALL}/${notificationId}`);
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<ApiResponse<void>> {
    return apiClient.delete(`${NOTIFICATION_ENDPOINTS.GET_ALL}/clear-all`);
  },

  /**
   * Subscribe to real-time notifications
   */
  async subscribeToRealTime(userId: string): Promise<void> {
    const { default: notificationHubService } =
      await import('../../services/signalr/notificationHub');
    await notificationHubService.connect(userId);
  },

  /**
   * Unsubscribe from real-time notifications
   */
  async unsubscribeFromRealTime(): Promise<void> {
    const { default: notificationHubService } =
      await import('../../services/signalr/notificationHub');
    await notificationHubService.disconnect();
  },
};

export default notificationService;
