// src/features/notifications/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import notificationService, { NotificationHistoryRequest } from '../../api/services/notificationService';
import { NotificationState } from '../../types/states/NotificationState';
import type { Notification, NotificationSettings } from '../../types/models/Notification';
import { SliceError } from '../../store/types';
import { withDefault } from '../../utils/safeAccess';
import { serializeError } from '../../utils/reduxHelpers';

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
  async (request?: NotificationHistoryRequest, { rejectWithValue }) => {
    try {
      return await notificationService.getNotifications(request);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const subscribeToRealTimeNotifications = createAsyncThunk(
  'notifications/subscribeRealTime',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await notificationService.subscribeToRealTime(userId);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const unsubscribeFromRealTimeNotifications = createAsyncThunk(
  'notifications/unsubscribeRealTime',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.unsubscribeFromRealTime();
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.clearAllNotifications();
      if (!response.success) {
        throw new Error(response.message || 'Failed to clear all notifications');
      }
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAllAsRead();
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark all notifications as read');
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getSettings();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notification settings');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: NotificationSettings, { rejectWithValue }) => {
    try {
      const response = await notificationService.updateSettings(settings);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update notification settings');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete notification');
      }
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error);
    }
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
    
    // Optimistic updates
    markAsReadOptimistic: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
      }
    },
    
    markAllAsReadOptimistic: (state) => {
      state.notifications.forEach(n => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    
    deleteNotificationOptimistic: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    // Rollback actions
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },
    
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
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
        // PagedResponse has data at root level - data is an array
        if (action.payload && action.payload.data) {
          state.notifications = action.payload.data;
          state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
        } else {
          state.notifications = [];
          state.unreadCount = 0;
        }
        // Update pagination
        if (action.payload) {
          state.pagination = {
            page: withDefault(action.payload.pageNumber, 1),
            limit: withDefault(action.payload.pageSize, 20),
            total: withDefault(action.payload.totalRecords, 0),
            totalPages: withDefault(action.payload.totalPages, 0),
          };
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = serializeError(action.payload);
      })

      // Mark as Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = serializeError(action.payload);
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
        state.error = serializeError(action.payload);
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
        state.error = serializeError(action.payload);
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
        state.error = serializeError(action.payload);
      })

      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, withDefault(state.unreadCount, 0) - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = serializeError(action.payload);
      })
      
      // Subscribe to Real-time
      .addCase(subscribeToRealTimeNotifications.fulfilled, (_state, _action) => {
        // Real-time connection handled by middleware
      })
      .addCase(subscribeToRealTimeNotifications.rejected, (state, action) => {
        state.isConnected = false;
        state.error = serializeError(action.payload);
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
  markAsReadOptimistic,
  markAllAsReadOptimistic,
  deleteNotificationOptimistic,
  setNotifications,
  setUnreadCount,
} = notificationSlice.actions;
export default notificationSlice.reducer;