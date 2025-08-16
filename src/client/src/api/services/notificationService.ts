// src/api/services/notificationService.ts
import { NOTIFICATION_ENDPOINTS } from '../../config/endpoints';
import { Notification, NotificationSettings } from '../../types/models/Notification';
import { ApiResponse } from '../../types/common/ApiResponse';
import { PagedResponse } from '../../types/common/PagedResponse';
import apiClient from '../apiClient';

export interface NotificationHistoryRequest {
    Type?: string;
    Status?: string;
    StartDate?: Date;
    EndDate?: Date;
    Page?: number;
    PageSize?: number;
} 

/**
 * Service for notification operations
 */
const notificationService = {
  /**
   * Get all user notifications
   */
  async getNotifications(request?: NotificationHistoryRequest): Promise<PagedResponse<Notification>> {
    const queryParams = new URLSearchParams();
    if (request?.Type) queryParams.append('Type', request.Type);
    if (request?.Status) queryParams.append('Status', request.Status);
    if (request?.StartDate) queryParams.append('StartDate', request.StartDate.toISOString());
    if (request?.EndDate) queryParams.append('EndDate', request.EndDate.toISOString());
    if (request?.Page) queryParams.append('Page', request.Page.toString());
    if (request?.PageSize) queryParams.append('PageSize', request.PageSize.toString());
    
    const url = `${NOTIFICATION_ENDPOINTS.GET_ALL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<PagedResponse<Notification>>(url);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<any>> {
    if (!notificationId?.trim()) throw new Error('Benachrichtigungs-ID ist erforderlich');
    return apiClient.post<ApiResponse<any>>(`${NOTIFICATION_ENDPOINTS.GET_ALL}/${notificationId}/read`, {});
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`${NOTIFICATION_ENDPOINTS.GET_ALL}/read-all`, {});
  },

  /**
   * Get notification settings
   */
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.get<ApiResponse<NotificationSettings>>(NOTIFICATION_ENDPOINTS.SETTINGS);
  },

  /**
   * Update notification settings
   */
  async updateSettings(settings: NotificationSettings): Promise<ApiResponse<NotificationSettings>> {
    return apiClient.put<ApiResponse<NotificationSettings>>(NOTIFICATION_ENDPOINTS.SETTINGS, settings);
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    if (!notificationId?.trim()) throw new Error('Benachrichtigungs-ID ist erforderlich');
    return apiClient.delete<ApiResponse<any>>(`${NOTIFICATION_ENDPOINTS.GET_ALL}/${notificationId}`);
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<ApiResponse<any>> {
    return apiClient.delete<ApiResponse<any>>(`${NOTIFICATION_ENDPOINTS.GET_ALL}/clear-all`);
  },

  /**
   * Subscribe to real-time notifications
   */
  async subscribeToRealTime(userId: string): Promise<void> {
    const { default: notificationHubService } = await import('../../services/signalr/notificationHub');
    await notificationHubService.connect(userId);
  },

  /**
   * Unsubscribe from real-time notifications
   */
  async unsubscribeFromRealTime(): Promise<void> {
    const { default: notificationHubService } = await import('../../services/signalr/notificationHub');
    await notificationHubService.disconnect();
  }
};

export default notificationService;