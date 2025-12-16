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
  selectNotificationStatistics,
} from '../store/selectors/notificationsSelectors';
import type { NotificationType, NotificationSettings } from '../types/models/Notification';
import type { NotificationHistoryRequest } from '../api/services/notificationService';

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
export const useNotifications = (): {
  // === STATE DATA ===
  notifications: ReturnType<typeof selectNotifications>;
  unreadNotifications: ReturnType<typeof selectUnreadNotifications>;
  unreadCount: ReturnType<typeof selectUnreadCount>;
  settings: ReturnType<typeof selectNotificationSettings>;
  statistics: ReturnType<typeof selectNotificationStatistics>;
  isLoading: boolean;
  error: string | undefined;
  // === FETCH OPERATIONS ===
  loadNotifications: (request?: NotificationHistoryRequest) => void;
  loadSettings: () => void;
  // === CRUD OPERATIONS ===
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (notificationId: string) => void;
  deleteNotificationById: (notificationId: string) => void;
  updateSettings: (newSettings: NotificationSettings) => void;
  clearError: () => void;
  // === COMPUTED VALUES ===
  getNotificationsByType: (type: NotificationType) => ReturnType<typeof selectNotifications>;
  getUnreadNotifications: () => ReturnType<typeof selectUnreadNotifications>;
  hasUnreadOfType: (type: NotificationType) => boolean;
  getUnreadCountByType: (type: NotificationType) => number;
} => {
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
  const actions = useMemo(
    () => ({
      // === FETCH OPERATIONS ===
      loadNotifications: (request: NotificationHistoryRequest = {}) => {
        void dispatch(fetchNotifications(request));
      },

      loadSettings: () => {
        void dispatch(fetchNotificationSettings());
      },

      // === CRUD OPERATIONS ===
      markAsRead: (notificationId: string) => {
        void dispatch(markNotificationAsRead(notificationId));
      },

      markAllAsRead: () => {
        void dispatch(markAllNotificationsAsRead());
      },

      clearAll: () => {
        void dispatch(clearAllNotifications());
      },

      deleteNotification: (notificationId: string) => {
        void dispatch(deleteNotification(notificationId));
      },

      updateSettings: (newSettings: NotificationSettings) => {
        void dispatch(updateNotificationSettings(newSettings));
      },
    }),
    [dispatch]
  );

  // ===== COMPUTED VALUES (memoized) =====
  const computed = useMemo(
    () => ({
      // Get notifications by type
      getNotificationsByType: (type: NotificationType) =>
        notifications.filter((notification) => notification.type === type),

      // Get unread notifications
      getUnreadNotifications: () => unreadNotifications,

      // Check if has unread of type
      hasUnreadOfType: (type: NotificationType) =>
        notifications.some((notification) => notification.type === type && !notification.isRead) ||
        false,

      // Get unread count by type
      getUnreadCountByType: (type: NotificationType) =>
        notifications.filter((notification) => notification.type === type && !notification.isRead)
          .length || 0,
    }),
    [notifications, unreadNotifications]
  );

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

    // === ACTIONS (memoized) ===
    ...actions,

    // === COMPUTED VALUES (memoized) ===
    ...computed,

    // === ADDITIONAL ACTIONS ===
    deleteNotificationById: (notificationId: string) => {
      void dispatch(deleteNotification(notificationId));
    },
    clearError: () => {
      dispatch(clearError());
    },
  };
};
