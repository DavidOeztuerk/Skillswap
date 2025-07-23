// src/api/services/notificationService.ts
import { NOTIFICATION_ENDPOINTS } from '../../config/endpoints';
import { Notification, NotificationSettings } from '../../types/models/Notification';
import apiClient from '../apiClient';

/**
 * Service für Benachrichtigungen-Operationen
 */
const notificationService = {
  /**
   * Holt alle Benachrichtigungen des Benutzers
   * @returns Liste der Benachrichtigungen
   */
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>(
        NOTIFICATION_ENDPOINTS.GET_ALL
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw new Error('Benachrichtigungen konnten nicht geladen werden.');
    }
  },

  /**
   * Markiert eine Benachrichtigung als gelesen
   * @param notificationId - ID der Benachrichtigung
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.post<void>(
        `${NOTIFICATION_ENDPOINTS.MARK_READ}/${notificationId}`
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw new Error('Benachrichtigung konnte nicht als gelesen markiert werden.');
    }
  },

  /**
   * Markiert alle Benachrichtigungen als gelesen
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.post<void>(NOTIFICATION_ENDPOINTS.MARK_ALL_READ);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw new Error('Alle Benachrichtigungen konnten nicht als gelesen markiert werden.');
    }
  },

  /**
   * Holt die Benachrichtigungseinstellungen des Benutzers
   * @returns Benachrichtigungseinstellungen
   */
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.get<NotificationSettings>(
        NOTIFICATION_ENDPOINTS.SETTINGS
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      throw new Error('Benachrichtigungseinstellungen konnten nicht geladen werden.');
    }
  },

  /**
   * Aktualisiert die Benachrichtigungseinstellungen
   * @param settings - Neue Einstellungen
   * @returns Aktualisierte Einstellungen
   */
  updateSettings: async (
    settings: NotificationSettings
  ): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.put<NotificationSettings>(
        NOTIFICATION_ENDPOINTS.SETTINGS,
        settings
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw new Error('Benachrichtigungseinstellungen konnten nicht aktualisiert werden.');
    }
  },

  /**
   * Löscht eine Benachrichtigung
   * @param notificationId - ID der zu löschenden Benachrichtigung
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.delete<void>(
        `${NOTIFICATION_ENDPOINTS.GET_ALL}/${notificationId}`
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw new Error('Benachrichtigung konnte nicht gelöscht werden.');
    }
  },
};

export default notificationService;