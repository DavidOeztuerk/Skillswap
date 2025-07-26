import { RequestState } from '../common/RequestState';
import { Notification, NotificationSettings } from '../models/Notification';

export interface NotificationState extends RequestState {
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