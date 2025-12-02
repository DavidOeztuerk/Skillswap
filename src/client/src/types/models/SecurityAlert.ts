export enum SecurityAlertLevel {
  Info = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export enum SecurityAlertType {
  // Authentication & Session
  TokenTheftDetected = 0,
  ConcurrentSessionLimitExceeded = 1,
  SessionHijackingDetected = 2,
  UnusualLoginLocation = 3,
  BruteForceAttack = 4,
  FailedLoginAttempts = 5,
  SuspiciousUserAgent = 6,

  // Authorization & Access Control
  UnauthorizedAccessAttempt = 7,
  PrivilegeEscalationAttempt = 8,
  SuspiciousRoleChange = 9,

  // API & Rate Limiting
  RateLimitExceeded = 10,
  AbnormalAPIUsage = 11,
  DDoSPatternDetected = 12,

  // Data & Content
  SuspiciousDataExport = 13,
  MaliciousFileUpload = 14,
  SQLInjectionAttempt = 15,
  XSSAttempt = 16,
  CSPViolation = 17,

  // Application Security
  E2EEKeyExchangeFailure = 18,
  CertificateValidationFailed = 19,
  IntegrityCheckFailed = 20
}

export interface SecurityAlertResponse {
  id: string;
  level: SecurityAlertLevel;
  type: SecurityAlertType;
  title: string;
  message: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  readBy?: string;
  isDismissed: boolean;
  dismissedAt?: string;
  dismissedBy?: string;
  dismissalReason?: string;
  occurrenceCount: number;
  lastOccurrenceAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SecurityAlertStatisticsResponse {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  infoAlerts: number;
  unreadAlerts: number;
  dismissedAlerts: number;
  alertsByType: Array<{
    type: SecurityAlertType;
    typeName: string;
    count: number;
  }>;
  alertsByLevel: Array<{
    level: SecurityAlertLevel;
    levelName: string;
    count: number;
  }>;
  recentTrends: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  }>;
  topAffectedUsers: Array<{
    userId: string;
    userName: string;
    alertCount: number;
  }>;
  topAffectedIPs: Array<{
    ipAddress: string;
    alertCount: number;
  }>;
}

export interface SecurityAlertActionResponse {
  alertId: string;
  action: string; // "Dismissed" or "MarkedAsRead"
  adminUserId: string;
  actionAt: string;
  reason?: string;
  success: boolean;
  message: string;
}

export interface DismissSecurityAlertRequest {
  reason: string;
}
