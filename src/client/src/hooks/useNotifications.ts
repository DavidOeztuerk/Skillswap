// src/hooks/useNotifications.ts
import { useCallback, useEffect } from 'react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchNotificationSettings,
  updateNotificationSettings,
  deleteNotification,
  addNotification,
} from '../features/notifications/notificationSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { Notification, NotificationSettings, NotificationType } from '../types/models/Notification';
import { NotificationHistoryRequest } from '../api/services/notificationService';
import { withDefault } from '../utils/safeAccess';

/**
 * Hook für Benachrichtigungs-Funktionalität
 * Bietet Methoden für das Verwalten von Benachrichtigungen
 */
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const {
    notifications,
    unreadCount,
    settings,
    isLoading,
    error,
  } = useAppSelector((state) => state.notifications);

  /**
   * Lädt alle Benachrichtigungen
   */
  const loadNotifications = useCallback(async (request?: NotificationHistoryRequest): Promise<void> => {
    await dispatch(fetchNotifications(request));
  }, [dispatch]);

  /**
   * Lädt die Benachrichtigungseinstellungen
   */
  const loadSettings = useCallback(async (): Promise<void> => {
    await dispatch(fetchNotificationSettings());
  }, [dispatch]);

  // Lade Benachrichtigungen beim ersten Rendern
  useEffect(() => {
    // Direkt dispatch aufrufen um Function-Dependencies zu vermeiden
    void dispatch(fetchNotifications());
    void dispatch(fetchNotificationSettings());
  }, [dispatch]); // Nur dispatch als Dependency

  /**
   * Markiert eine Benachrichtigung als gelesen
   * @param notificationId - ID der Benachrichtigung
   * @returns true bei Erfolg, false bei Fehler
   */
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    const resultAction = await dispatch(markNotificationAsRead(notificationId));
    return markNotificationAsRead.fulfilled.match(resultAction);
  };

  /**
   * Markiert alle Benachrichtigungen als gelesen
   * @returns true bei Erfolg, false bei Fehler
   */
  const markAllAsRead = async (): Promise<boolean> => {
    const resultAction = await dispatch(markAllNotificationsAsRead());
    return markAllNotificationsAsRead.fulfilled.match(resultAction);
  };

  /**
   * Löscht eine Benachrichtigung
   * @param notificationId - ID der zu löschenden Benachrichtigung
   * @returns true bei Erfolg, false bei Fehler
   */
  const deleteNotificationById = async (notificationId: string): Promise<boolean> => {
    const resultAction = await dispatch(deleteNotification(notificationId));
    return deleteNotification.fulfilled.match(resultAction);
  };

  /**
   * Aktualisiert die Benachrichtigungseinstellungen
   * @param newSettings - Neue Einstellungen
   * @returns true bei Erfolg, false bei Fehler
   */
  const updateSettings = async (newSettings: NotificationSettings): Promise<boolean> => {
    const resultAction = await dispatch(updateNotificationSettings(newSettings));
    return updateNotificationSettings.fulfilled.match(resultAction);
  };

  /**
   * Fügt eine neue Benachrichtigung hinzu (für lokale Updates)
   * @param notification - Neue Benachrichtigung
   */
  const addNewNotification = (notification: Notification): void => {
    dispatch(addNotification(notification));
  };

  /**
   * Filtert Benachrichtigungen nach Typ
   * @param type - Benachrichtigungstyp
   * @returns Gefilterte Benachrichtigungen
   */
  const getNotificationsByType = (type: NotificationType): Notification[] => {
    return notifications?.filter(notification => notification?.type === type);
  };

  /**
   * Filtert ungelesene Benachrichtigungen
   * @returns Ungelesene Benachrichtigungen
   */
  const getUnreadNotifications = (): Notification[] => {
    return notifications?.filter(notification => !notification?.isRead);
  };

  /**
   * Prüft, ob es ungelesene Benachrichtigungen eines bestimmten Typs gibt
   * @param type - Benachrichtigungstyp
   * @returns true, wenn ungelesene Benachrichtigungen vorhanden sind
   */
  const hasUnreadOfType = (type: NotificationType): boolean => {
    return notifications?.some(
      notification => notification?.type === type && !notification?.isRead
    );
  };

  /**
   * Holt die Anzahl ungelesener Benachrichtigungen eines bestimmten Typs
   * @param type - Benachrichtigungstyp
   * @returns Anzahl ungelesener Benachrichtigungen
   */
  const getUnreadCountByType = (type: NotificationType): number => {
    return notifications?.filter(
      notification => notification?.type === type && !notification?.isRead
    ).length;
  };

  return {
    // Daten
    notifications: notifications,
    unreadCount: withDefault(unreadCount, 0),
    settings,
    isLoading,
    error,

    // Aktionen
    loadNotifications,
    loadSettings,
    markAsRead,
    markAllAsRead,
    deleteNotificationById,
    updateSettings,
    addNewNotification,

    // Hilfsfunktionen
    getNotificationsByType,
    getUnreadNotifications,
    hasUnreadOfType,
    getUnreadCountByType,
  };
};