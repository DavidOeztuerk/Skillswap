// src/api/services/notificationService.ts
import { NOTIFICATION_ENDPOINTS } from '../../config/endpoints';
import { Notification, NotificationSettings } from '../../types/models/Notification';
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
  async getNotifications(request?: NotificationHistoryRequest): Promise<Notification[]> {
    const queryParams = new URLSearchParams();
    if (request?.Type) queryParams.append('Type', request.Type);
    if (request?.Status) queryParams.append('Status', request.Status);
    if (request?.StartDate) queryParams.append('StartDate', request.StartDate.toISOString());
    if (request?.EndDate) queryParams.append('EndDate', request.EndDate.toISOString());
    if (request?.Page) queryParams.append('Page', request.Page.toString());
    if (request?.PageSize) queryParams.append('PageSize', request.PageSize.toString());
    
    const url = `${NOTIFICATION_ENDPOINTS.GET_ALL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<Notification[]>(url);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!notificationId?.trim()) throw new Error('Benachrichtigungs-ID ist erforderlich');
    return apiClient.post<void>(`${NOTIFICATION_ENDPOINTS.GET_ALL}/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.post<void>(`${NOTIFICATION_ENDPOINTS.GET_ALL}/read-all`);
  },

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    return apiClient.get<NotificationSettings>(NOTIFICATION_ENDPOINTS.SETTINGS);
  },

  /**
   * Update notification settings
   */
  async updateSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    if (!settings) throw new Error('Einstellungen sind erforderlich');
    return apiClient.put<NotificationSettings>(NOTIFICATION_ENDPOINTS.SETTINGS, settings);
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!notificationId?.trim()) throw new Error('Benachrichtigungs-ID ist erforderlich');
    return apiClient.delete<void>(`${NOTIFICATION_ENDPOINTS.GET_ALL}/${notificationId}`);
  },

  /**
   * Subscribe to real-time notifications
   */
  async subscribeToRealTime(userId: string): Promise<void> {
    // Implementation would use SignalR or similar
    console.log('Subscribing to real-time notifications for user:', userId);
  },

  /**
   * Unsubscribe from real-time notifications
   */
  async unsubscribeFromRealTime(): Promise<void> {
    // Implementation would use SignalR or similar
    console.log('Unsubscribing from real-time notifications');
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    return apiClient.delete<void>(NOTIFICATION_ENDPOINTS.GET_ALL);
  },
};

export default notificationService;