// src/features/notifications/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import notificationService from '../../api/services/notificationService';
import { NotificationState } from '../../types/states/NotificationState';
import { Notification, NotificationSettings } from '../../types/models/Notification';
import { SliceError } from '../../store/types';

// Initial state for the Notification reducer
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    emailNotifications: true,
    pushNotifications: true,
    matchRequests: true,
    appointmentReminders: true,
    skillEndorsements: true,
    systemUpdates: true,
  },
  isLoading: false,
  error: null,
};

// Async Thunk for loading all notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const notifications = await notificationService.getNotifications();
      return notifications;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Could not load notifications'
      );
    }
  }
);

// Async Thunk for marking a notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Could not mark notification as read'
      );
    }
  }
);

// Async Thunk for marking all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Could not mark all notifications as read'
      );
    }
  }
);

// Async Thunk for loading notification settings
export const fetchNotificationSettings = createAsyncThunk(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await notificationService.getSettings();
      return settings;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Could not load notification settings'
      );
    }
  }
);

// Async Thunk for updating notification settings
export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: NotificationSettings, { rejectWithValue }) => {
    try {
      const updatedSettings = await notificationService.updateSettings(settings);
      return updatedSettings;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Could not update notification settings'
      );
    }
  }
);

// Async Thunk for deleting a notification
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Could not delete notification'
      );
    }
  }
);

// Notification Slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })
      // Mark Notification as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.error as SliceError;
      })
      // Mark All Notifications as Read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        const now = new Date().toISOString();
        state.notifications.forEach(notification => {
          if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = now;
          }
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.error as SliceError;
      })
      // Fetch Notification Settings
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })
      // Update Notification Settings
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })
      // Delete Notification
      .addCase(deleteNotification.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const index = state.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.error as SliceError
      });
  },
});

export const {
  addNotification,
  clearError,
  setLoading,
} = notificationSlice.actions;

export default notificationSlice.reducer;