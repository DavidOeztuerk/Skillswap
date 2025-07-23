// src/api/services/notificationService.ts
import { NOTIFICATION_ENDPOINTS } from '../../config/endpoints';
import { Notification, NotificationSettings } from '../../types/models/Notification';
import apiClient from '../apiClient';

/**
 * Service for notification operations
 */
const notificationService = {
  /**
   * Get all user notifications
   */
  async getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>(NOTIFICATION_ENDPOINTS.GET_ALL);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!notificationId?.trim()) throw new Error('Benachrichtigungs-ID ist erforderlich');
    return apiClient.post<void>(`${NOTIFICATION_ENDPOINTS.MARK_READ}/${notificationId}`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.post<void>(NOTIFICATION_ENDPOINTS.MARK_ALL_READ);
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
};

export default notificationService;