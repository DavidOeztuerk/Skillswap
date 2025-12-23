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
  // Email preferences
  emailEnabled: boolean;
  emailMarketing: boolean;
  emailSecurity: boolean;
  emailUpdates: boolean;

  // SMS preferences
  smsEnabled: boolean;
  smsSecurity: boolean;
  smsReminders: boolean;

  // Push notification preferences
  pushEnabled: boolean;
  pushMarketing: boolean;
  pushSecurity: boolean;
  pushUpdates: boolean;

  // Quiet hours
  quietHoursStart?: string;
  quietHoursEnd?: string;

  // Other settings
  timeZone: string;
  digestFrequency: string;
  language: string;

  // Metadata
  updatedAt?: string;
}
