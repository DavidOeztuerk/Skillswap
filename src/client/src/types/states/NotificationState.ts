import { RequestState } from '../common/RequestState';
import { Notification, NotificationSettings } from '../models/Notification';

export interface NotificationState extends RequestState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
}