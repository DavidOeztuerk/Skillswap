import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  fetchNotificationSettings,
  updateNotificationSettings,
  deleteNotification,
} from '../features/notifications/notificationThunks';
import { clearError } from '../features/notifications/notificationSlice';
import {
  selectNotifications,
  selectUnreadCount,
  selectNotificationSettings,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadNotifications,
  selectNotificationStatistics
} from '../store/selectors/notificationsSelectors';
import { NotificationType, NotificationSettings } from '../types/models/Notification';
import { NotificationHistoryRequest } from '../api/services/notificationService';

/**
 * 🚀 ROBUSTE USENOTIFICATIONS HOOK 
 * 
 * ✅ KEINE useEffects - prevents infinite loops!
 * ✅ Stateless Design - nur Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 * 
 * CRITICAL: This hook is STATELESS and contains NO useEffects.
 * All data fetching must be initiated from Components!
 */
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  
  // ===== SELECTORS =====
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const settings = useAppSelector(selectNotificationSettings);
  const statistics = useAppSelector(selectNotificationStatistics);
  const isLoading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);

  // ===== MEMOIZED ACTIONS =====
  const actions = useMemo(() => ({
    
    // === FETCH OPERATIONS ===
    loadNotifications: (request: NotificationHistoryRequest = {}) => {
      return dispatch(fetchNotifications(request));
    },

    loadSettings: () => {
      return dispatch(fetchNotificationSettings());
    },

    // === CRUD OPERATIONS ===
    markAsRead: (notificationId: string) => {
      return dispatch(markNotificationAsRead(notificationId));
    },

    markAllAsRead: () => {
      return dispatch(markAllNotificationsAsRead());
    },

    clearAll: () => {
      return dispatch(clearAllNotifications());
    },

    deleteNotification: (notificationId: string) => {
      return dispatch(deleteNotification(notificationId));
    },

    updateSettings: (newSettings: NotificationSettings) => {
      return dispatch(updateNotificationSettings(newSettings));
    },

  }), [dispatch]);

  // ===== COMPUTED VALUES (memoized) =====
  const computed = useMemo(() => ({

    // Get notifications by type
    getNotificationsByType: (type: NotificationType) => {
      return notifications?.filter(notification => notification?.type === type) || [];
    },

    // Get unread notifications
    getUnreadNotifications: () => {
      return unreadNotifications || [];
    },

    // Check if has unread of type
    hasUnreadOfType: (type: NotificationType) => {
      return notifications?.some(
        notification => notification?.type === type && !notification?.isRead
      ) || false;
    },

    // Get unread count by type
    getUnreadCountByType: (type: NotificationType) => {
      return notifications?.filter(
        notification => notification?.type === type && !notification?.isRead
      ).length || 0;
    },

  }), [notifications, unreadNotifications]);

  // ===== RETURN OBJECT =====
  return {
    // === STATE DATA ===
    notifications,
    unreadNotifications,
    unreadCount,
    settings,
    statistics,
    
    // === LOADING STATES ===
    isLoading,
    
    // === ERROR STATES ===
    error,
    
    // === ACTIONS ===
    ...actions,
    
    // === COMPUTED VALUES ===
    ...computed,

    // === LEGACY COMPATIBILITY ===
    loadNotifications: actions.loadNotifications,
    loadSettings: actions.loadSettings,
    deleteNotificationById: actions.deleteNotification,
    markAsRead: actions.markAsRead,
    markAllAsRead: actions.markAllAsRead,
    updateSettings: actions.updateSettings,
    getNotificationsByType: computed.getNotificationsByType,
    getUnreadNotifications: computed.getUnreadNotifications,
    hasUnreadOfType: computed.hasUnreadOfType,
    getUnreadCountByType: computed.getUnreadCountByType,
    clearError: () => dispatch(clearError()),
  };
};