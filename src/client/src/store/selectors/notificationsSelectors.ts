import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { NotificationType } from '../../types/models/Notification';
import type { NotificationsEntityState } from '../adapters/notificationsAdapter+State';

/**
 * Notifications Selectors
 * Centralized selectors for notifications state and entity operations
 */

// Base selectors
export const selectNotificationsState = (state: RootState): NotificationsEntityState =>
  state.notifications;
export const selectNotificationsLoading = (state: RootState): boolean =>
  state.notifications.isLoading;
export const selectNotificationsError = (state: RootState): string | undefined =>
  state.notifications.errorMessage;
export const selectNotificationsConnected = (state: RootState): boolean =>
  state.notifications.isConnected;
export const selectNotificationsConnectionId = (state: RootState): string | null =>
  state.notifications.connectionId;

// Direct array selectors
export const selectNotifications = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.notifications
);

export const selectUnreadCount = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.unreadCount
);

export const selectTotalNotificationCount = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.totalCount
);

export const selectLastNotification = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.lastNotification
);

// Settings and preferences
export const selectNotificationSettings = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.settings
);

export const selectNotificationPreferences = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.preferences
);

// Computed selectors
export const selectUnreadNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter((notification) => !notification.isRead)
);

export const selectReadNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter((notification) => notification.isRead)
);

export const selectNotificationsByType = createSelector(
  [selectNotifications, (_: RootState, type: NotificationType) => type],
  (notifications, type) => notifications.filter((notification) => notification.type === type)
);

export const selectNotificationsByUrgency = createSelector(
  [selectNotifications, (_: RootState, urgent: boolean) => urgent],
  (notifications, urgent) => {
    if (urgent) {
      return notifications.filter(
        (notification) =>
          notification.type === NotificationType.AppointmentReminder ||
          notification.type === NotificationType.VideoCallStarted ||
          notification.type === NotificationType.System
      );
    }
    return notifications.filter(
      (notification) =>
        notification.type === NotificationType.MatchRequest ||
        notification.type === NotificationType.MatchAccepted ||
        notification.type === NotificationType.SkillEndorsement
    );
  }
);

export const selectRecentNotifications = createSelector([selectNotifications], (notifications) => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return notifications.filter(
    (notification) => new Date(notification.createdAt).getTime() > oneDayAgo
  );
});

export const selectImportantNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter(
    (notification) =>
      notification.type === NotificationType.AppointmentReminder ||
      notification.type === NotificationType.VideoCallStarted ||
      notification.type === NotificationType.System
  )
);

// Categorized notifications
export const selectAppointmentNotifications = createSelector(
  [selectNotifications],
  (notifications) =>
    notifications.filter(
      (notification) =>
        notification.type === NotificationType.AppointmentRequest ||
        notification.type === NotificationType.AppointmentReminder ||
        notification.type === NotificationType.AppointmentConfirmed ||
        notification.type === NotificationType.AppointmentCancelled
    )
);

export const selectMatchNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter(
    (notification) =>
      notification.type === NotificationType.MatchRequest ||
      notification.type === NotificationType.MatchAccepted ||
      notification.type === NotificationType.MatchRejected
  )
);

export const selectSystemNotifications = createSelector([selectNotifications], (notifications) =>
  notifications.filter((notification) => notification.type === NotificationType.System)
);

// Filters and pagination
export const selectNotificationFilters = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.filters
);

export const selectNotificationPagination = createSelector(
  [selectNotificationsState],
  (notificationsState) => notificationsState.pagination
);

// Filtered notifications based on current filters
export const selectFilteredNotifications = createSelector(
  [selectNotifications, selectNotificationFilters],
  (notifications, filters) => {
    let filtered = [...notifications];

    // Filter by read status
    if (filters.read === 'read') {
      filtered = filtered.filter((n) => n.isRead);
    } else if (filters.read === 'unread') {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter((n) => n.type === filters.type);
    }

    // Filter by priority - use type as proxy since priority doesn't exist
    if (filters.priority && filters.priority !== 'all') {
      if (filters.priority === 'high') {
        filtered = filtered.filter(
          (n) =>
            n.type === NotificationType.AppointmentReminder ||
            n.type === NotificationType.VideoCallStarted ||
            n.type === NotificationType.System
        );
      } else {
        filtered = filtered.filter(
          (n) =>
            n.type === NotificationType.MatchRequest ||
            n.type === NotificationType.MatchAccepted ||
            n.type === NotificationType.SkillEndorsement
        );
      }
    }

    // Filter by date range
    if (filters.dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((n) => new Date(n.createdAt) >= startDate);
    }

    return filtered;
  }
);

// Statistics selectors
export const selectNotificationStatistics = createSelector(
  [
    selectNotifications,
    selectUnreadNotifications,
    selectAppointmentNotifications,
    selectMatchNotifications,
    selectSystemNotifications,
  ],
  (all, unread, appointments, matches, system) => ({
    total: all.length,
    unread: unread.length,
    appointments: appointments.length,
    matches: matches.length,
    system: system.length,
    readPercentage:
      all.length > 0 ? Math.round(((all.length - unread.length) / all.length) * 100) : 0,
  })
);

// Notification grouping by date
export const selectNotificationsByDate = createSelector(
  [selectFilteredNotifications],
  (notifications) => {
    const groups: Record<string, typeof notifications> = {};

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt).toDateString();
      groups[date] = [];
      groups[date].push(notification);
    });

    return groups;
  }
);

// Check if user has permission for notification type
export const selectCanReceiveNotificationType = createSelector(
  [selectNotificationPreferences],
  (preferences) =>
    (type: string): boolean => {
      switch (type) {
        case 'appointment':
        case 'appointment_reminder':
          return preferences.categories.appointments;
        case 'match_request':
        case 'match_accepted':
          return preferences.categories.matches;
        case 'message':
          return preferences.categories.messages;
        case 'system':
          return preferences.categories.system;
        case 'marketing':
          return preferences.categories.marketing;
        default:
          return true;
      }
    }
);

// Check if notifications are enabled for different channels
export const selectNotificationChannelEnabled = createSelector(
  [selectNotificationSettings, selectNotificationPreferences],
  (settings, preferences) => ({
    email: settings.emailNotifications && preferences.emailNotifications,
    push: settings.pushNotifications && preferences.pushNotifications,
    desktop: settings.desktopNotifications && preferences.desktopNotifications,
    sound: preferences.soundEnabled,
  })
);
