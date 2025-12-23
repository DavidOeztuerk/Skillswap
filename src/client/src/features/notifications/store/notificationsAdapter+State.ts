import { createEntityAdapter, type EntityId, type EntityState } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { NotificationSettings, NotificationType, Notification } from '../types/Notification';

export const notificationsAdapter = createEntityAdapter<Notification, EntityId>({
  selectId: (notification) => notification.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export interface NotificationsEntityState
  extends EntityState<Notification, EntityId>, RequestState {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  lastNotification: Notification | null;
  isConnected: boolean;
  connectionId: string | null;
  settings: NotificationSettings;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
    categories: {
      appointments: boolean;
      matches: boolean;
      messages: boolean;
      system: boolean;
      marketing: boolean;
    };
  };
  filters: {
    read: string;
    type: NotificationType | 'all';
    priority: string;
    dateRange: string | null;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const initialNotificationsState: NotificationsEntityState =
  notificationsAdapter.getInitialState({
    notifications: [],
    unreadCount: 0,
    totalCount: 0,
    lastNotification: null,
    isLoading: false,
    isConnected: false,
    connectionId: null,
    settings: {
      // Email preferences
      emailEnabled: true,
      emailMarketing: true,
      emailSecurity: true,
      emailUpdates: true,
      // SMS preferences
      smsEnabled: false,
      smsSecurity: false,
      smsReminders: false,
      // Push notification preferences
      pushEnabled: true,
      pushMarketing: false,
      pushSecurity: true,
      pushUpdates: true,
      // Quiet hours (optional)
      quietHoursStart: undefined,
      quietHoursEnd: undefined,
      // Other settings
      timeZone: 'Europe/Berlin',
      digestFrequency: 'Daily',
      language: 'de',
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
    errorMessage: undefined,
  });

export const notificationsSelectors = notificationsAdapter.getSelectors();
