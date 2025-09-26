export interface Notification {
  id: string;
  userId: string | undefined;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  autoHide?: boolean;
  duration?: number;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  metadata?: NotificationMetadata;
}

export enum NotificationType {
  MatchRequest = 'MatchRequest',
  MatchAccepted = 'MatchAccepted',
  MatchRejected = 'MatchRejected',
  AppointmentRequest = 'AppointmentRequest',
  AppointmentConfirmed = 'AppointmentConfirmed',
  AppointmentCancelled = 'AppointmentCancelled',
  AppointmentReminder = 'AppointmentReminder',
  VideoCallStarted = 'VideoCallStarted',
  SkillEndorsement = 'SkillEndorsement',
  System = 'System',
}

export interface NotificationMetadata {
  matchId?: string;
  appointmentId?: string;
  skillId?: string;
  senderId?: string;
  senderName?: string;
  [key: string]: unknown;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  matchRequests: boolean;
  appointmentReminders: boolean;
  skillEndorsements: boolean;
  systemUpdates: boolean;
  desktopNotifications: boolean;
}