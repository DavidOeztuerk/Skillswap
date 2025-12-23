import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { withDefault, isDefined } from '../../../shared/utils/safeAccess';
import {
  addNotification as addNotificationAction,
  setConnectionStatus as setConnectionStatusAction,
  setConnectionId as setConnectionIdAction,
  setNotifications as setNotificationsAction,
  setUnreadCount as setUnreadCountAction,
} from './notificationActions';
import { initialNotificationsState } from './notificationsAdapter+State';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchNotificationSettings,
  updateNotificationSettings,
  deleteNotification,
  subscribeToRealTimeNotifications,
  unsubscribeFromRealTimeNotifications,
  clearAllNotifications,
} from './notificationThunks';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: initialNotificationsState,
  reducers: {
    setNotificationPreferences: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    setNotificationFilters: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setPagination: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearError: (state) => {
      state.errorMessage = undefined;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Optimistic updates
    markAsReadOptimistic: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
      }
    },

    markAllAsReadOptimistic: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },

    deleteNotificationOptimistic: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex((n) => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // External actions from notificationActions.ts (to avoid circular dependencies)
      .addCase(addNotificationAction, (state, action) => {
        state.notifications.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
        // Show desktop notification if enabled
        if (
          state.preferences.desktopNotifications &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          void new Notification(action.payload.title, {
            body: action.payload.message,
            icon: '/icons/notification.png',
            tag: action.payload.id,
          });
        }
      })
      .addCase(setConnectionStatusAction, (state, action) => {
        state.isConnected = action.payload;
      })
      .addCase(setConnectionIdAction, (state, action) => {
        state.connectionId = action.payload;
      })
      .addCase(setNotificationsAction, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(setUnreadCountAction, (state, action) => {
        state.unreadCount = action.payload;
      })

      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        // PagedResponse has data at root level - data is an array
        if (isDefined(action.payload.data)) {
          state.notifications = action.payload.data;
          state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
        } else {
          state.notifications = [];
          state.unreadCount = 0;
        }
        // Update pagination
        state.pagination = {
          page: withDefault(action.payload.pageNumber, 1),
          limit: withDefault(action.payload.pageSize, 20),
          total: withDefault(action.payload.totalRecords, 0),
          totalPages: withDefault(action.payload.totalPages, 0),
        };
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to fetch notifications';
      })

      // Mark as Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.meta.arg);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to mark notification as read';
      })

      // Mark All as Read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        const now = new Date().toISOString();
        state.notifications.forEach((notification) => {
          if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = now;
          }
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.errorMessage =
          action.payload?.message ??
          action.error.message ??
          'Failed to mark all notifications as read';
      })

      // Fetch Settings
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          // Merge with defaults to prevent undefined values causing controlled/uncontrolled warnings
          state.settings = {
            ...state.settings,
            ...action.payload.data,
          };
        }
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ??
          action.error.message ??
          'Failed to fetch notification settings';
      })

      // Update Settings
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          // Merge with defaults to prevent undefined values causing controlled/uncontrolled warnings
          state.settings = {
            ...state.settings,
            ...action.payload.data,
          };
        }
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ??
          action.error.message ??
          'Failed to update notification settings';
      })

      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.meta.arg);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to delete notification';
      })

      // Subscribe to Real-time
      .addCase(subscribeToRealTimeNotifications.fulfilled, (_state, _action) => {
        // Real-time connection handled by middleware
      })
      .addCase(subscribeToRealTimeNotifications.rejected, (state, action) => {
        state.isConnected = false;
        state.errorMessage =
          action.payload?.message ??
          action.error.message ??
          'Failed to subscribe to real-time notifications';
      })

      // Unsubscribe from Real-time
      .addCase(unsubscribeFromRealTimeNotifications.fulfilled, (_state) => {
        // Real-time disconnection handled by middleware
      })

      // Clear All Notifications
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
  },
});

export const {
  setNotificationPreferences,
  setNotificationFilters,
  setPagination,
  clearError,
  setLoading,
  markAsReadOptimistic,
  markAllAsReadOptimistic,
  deleteNotificationOptimistic,
} = notificationSlice.actions;

// Re-export actions from notificationActions for backwards compatibility
export {
  addNotification,
  setConnectionStatus,
  setConnectionId,
  setNotifications,
  setUnreadCount,
} from './notificationActions';

export default notificationSlice.reducer;
