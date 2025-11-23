import { createEntityAdapter, EntityState, EntityId } from "@reduxjs/toolkit";
import { Notification, NotificationSettings } from "../../types/models/Notification";
import { RequestState } from "../../types/common/RequestState";

export const notificationsAdapter = createEntityAdapter<Notification, EntityId>({
  selectId: (notification) => {
    if (!notification?.id) {
      console.error('Notification without ID detected:', notification);
      return `temp-${Date.now()}-${Math.random()}`;
    }
    return notification.id;
  },
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export interface NotificationsEntityState extends EntityState<Notification, EntityId>, RequestState {
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
    type: string;
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

export const initialNotificationsState: NotificationsEntityState = notificationsAdapter.getInitialState({
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
  errorMessage: undefined,
});

export const notificationsSelectors = notificationsAdapter.getSelectors();

