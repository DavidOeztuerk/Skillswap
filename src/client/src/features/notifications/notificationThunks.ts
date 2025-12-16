import notificationService, {
  type NotificationHistoryRequest,
} from '../../api/services/notificationService';
import { createAppAsyncThunk } from '../../store/thunkHelpers';
import { isPagedResponse, isSuccessResponse } from '../../types/api/UnifiedResponse';
import type { NotificationSettings } from '../../types/models/Notification';

// Async thunks
export const fetchNotifications = createAppAsyncThunk(
  'notifications/fetchNotifications',
  async (request: NotificationHistoryRequest, { rejectWithValue }) => {
    const response = await notificationService.getNotifications(request);
    return isPagedResponse(response) ? response : rejectWithValue(response);
  }
);

export const subscribeToRealTimeNotifications = createAppAsyncThunk(
  'notifications/subscribeRealTime',
  async (userId: string) => {
    await notificationService.subscribeToRealTime(userId);
  }
);

export const unsubscribeFromRealTimeNotifications = createAppAsyncThunk(
  'notifications/unsubscribeRealTime',
  async () => {
    await notificationService.unsubscribeFromRealTime();
  }
);

export const clearAllNotifications = createAppAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    const response = await notificationService.clearAllNotifications();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const markNotificationAsRead = createAppAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    const response = await notificationService.markAsRead(notificationId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const markAllNotificationsAsRead = createAppAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    const response = await notificationService.markAllAsRead();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const fetchNotificationSettings = createAppAsyncThunk(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    const response = await notificationService.getSettings();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const updateNotificationSettings = createAppAsyncThunk(
  'notifications/updateSettings',
  async (settings: NotificationSettings, { rejectWithValue }) => {
    const response = await notificationService.updateSettings(settings);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const deleteNotification = createAppAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    const response = await notificationService.deleteNotification(notificationId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);
