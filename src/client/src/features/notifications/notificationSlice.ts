// src/features/notifications/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import notificationService from '../../api/services/notificationService';
import { NotificationState } from '../../types/states/NotificationState';
import type { Notification, NotificationSettings } from '../../types/models/Notification';
import { SliceError } from '../../store/types';

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  lastNotification: null,
  isLoading: false,
  isConnected: false,
  connectionId: null,
  settings: {
    emailNotifications: true,
    pushNotifications: true,
    matchRequests: true,
    appointmentReminders: true,
    skillEndorsements: true,
    systemUpdates: true,
    desktopNotifications: true,
  },
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    desktopNotifications: true,
    categories: {
      appointments: true,
      matches: true,
      messages: true,
      system: true,
      marketing: false,
    },
  },
  filters: {
    read: 'all',
    type: 'all',
    priority: 'all',
    dateRange: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  error: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: { page?: number; limit?: number; filters?: any }) => {
    return await notificationService.getNotifications(params);
  }
);

export const subscribeToRealTimeNotifications = createAsyncThunk(
  'notifications/subscribeRealTime',
  async (userId: string) => {
    return await notificationService.subscribeToRealTime(userId);
  }
);

export const unsubscribeFromRealTimeNotifications = createAsyncThunk(
  'notifications/unsubscribeRealTime',
  async () => {
    await notificationService.unsubscribeFromRealTime();
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async () => {
    await notificationService.clearAllNotifications();
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    return notificationId;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await notificationService.markAllAsRead();
    return true;
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  'notifications/fetchSettings',
  async () => {
    return await notificationService.getSettings();
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: NotificationSettings) => {
    return await notificationService.updateSettings(settings);
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
    return notificationId;
  }
);

// Slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      
      // Show desktop notification if enabled
      if (state.settings.desktopNotifications && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(action.payload.title, {
            body: action.payload.message,
            icon: '/icons/notification.png',
            tag: action.payload.id,
          });
        }
      }
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    setConnectionId: (state, action: PayloadAction<string | null>) => {
      state.connectionId = action.payload;
    },
    
    setNotificationPreferences: (state, action: PayloadAction<Partial<NotificationState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    setNotificationFilters: (state, action: PayloadAction<Partial<NotificationState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    setPagination: (state, action: PayloadAction<Partial<NotificationState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
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
        state.notifications = Array.isArray(action.payload) ? action.payload : [];
        state.unreadCount = state.notifications.filter((n: any) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Mark as Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.error as SliceError;
      })

      // Mark All as Read
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

      // Fetch Settings
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

      // Update Settings
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
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.error as SliceError;
      })
      
      // Subscribe to Real-time
      .addCase(subscribeToRealTimeNotifications.fulfilled, (_state, _action) => {
        // Real-time connection handled by middleware
      })
      .addCase(subscribeToRealTimeNotifications.rejected, (state, action) => {
        state.isConnected = false;
        state.error = action.error as SliceError;
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
  addNotification,
  setConnectionStatus,
  setConnectionId,
  setNotificationPreferences,
  setNotificationFilters,
  setPagination,
  clearError,
  setLoading,
} = notificationSlice.actions;
export default notificationSlice.reducer;