export interface AdminDashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSkills: number;
    totalAppointments: number;
    totalMatches: number;
    pendingReports: number;
  };
  recentActivity: {
    newUsers: number;
    newSkills: number;
    completedAppointments: number;
    activeMatches: number;
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    responseTime: number;
    uptime: number;
  };
  topCategories: {
    name: string;
    count: number;
    growth: number;
  }[];
  userGrowth: {
    date: string;
    count: number;
  }[];
  appointmentStats: {
    date: string;
    completed: number;
    cancelled: number;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  roles: string[];
  emailVerified: boolean;
  accountStatus: 'active' | 'suspended' | 'pending' | 'deactivated';
  createdAt: string;
  lastLoginAt?: string;
  totalSkills: number;
  totalAppointments: number;
  averageRating: number;
  isOnline: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
}

export interface AdminSkill {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'approved' | 'pending' | 'rejected' | 'quarantined';
  createdAt: string;
  updatedAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationReason?: string;
  totalRatings: number;
  averageRating: number;
  isActive: boolean;
  reportCount: number;
}

export interface AdminAppointment {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  skill: {
    id: string;
    name: string;
    category: string;
  };
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  duration: number;
  rating?: number;
  feedback?: string;
}

export interface AdminMatch {
  id: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  skill: {
    id: string;
    name: string;
    category: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  matchScore: number;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
  message?: string;
  response?: string;
  appointmentId?: string;
}

export interface AdminAnalytics {
  // Flat properties for easier access
  totalUsers?: number;
  activeUsers?: number;
  totalSkills?: number;
  totalMatches?: number;
  totalAppointments?: number;
  completedAppointments?: number;
  userGrowthRate?: number;
  matchSuccessRate?: number;
  avgSessionDuration?: string;
  sessionsPerUser?: string;
  matchToAppointmentRate?: string;
  avgRating?: string;

  // Top skills data
  topSkills?: {
    name: string;
    count: number;
  }[];

  // Recent activity data
  recentActivity?: {
    date: string;
    newUsers: number;
    newMatches: number;
    newAppointments: number;
  }[];

  // Nested structure (optional for backend compatibility)
  userMetrics?: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    userRetentionRate: number;
    averageSessionDuration: number;
  };
  skillMetrics?: {
    totalSkills: number;
    skillsPerUser: number;
    topCategories: {
      name: string;
      count: number;
      percentage: number;
    }[];
  };
  appointmentMetrics?: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    completionRate: number;
    averageDuration: number;
    averageRating: number;
    busyHours: {
      hour: number;
      count: number;
    }[];
  };
  matchingMetrics?: {
    totalMatches: number;
    successfulMatches: number;
    matchSuccessRate: number;
    averageMatchScore: number;
    responseTime: number;
  };
  platformHealth?: {
    systemUptime: number;
    averageResponseTime: number;
    errorRate: number;
    apiCallsPerHour: number;
  };
  trends?: {
    userGrowth: {
      date: string;
      count: number;
    }[];
    skillGrowth: {
      date: string;
      count: number;
    }[];
    appointmentTrends: {
      date: string;
      scheduled: number;
      completed: number;
      cancelled: number;
    }[];
    matchingTrends: {
      date: string;
      requested: number;
      accepted: number;
      rejected: number;
    }[];
  };
}

export interface SystemHealth {
  status?: 'healthy' | 'warning' | 'critical';

  // Flat service status properties for easier access
  userService?: string;
  skillService?: string;
  matchmakingService?: string;
  appointmentService?: string;
  videocallService?: string;
  notificationService?: string;
  gateway?: string;

  // Flat infrastructure status properties
  database?: string;
  cache?: string;
  messageBus?: string;

  // Flat performance metrics
  avgResponseTime?: string;
  requestsPerMinute?: string;
  errorRate?: string;
  uptime?: string;

  // Nested structure (optional for backend compatibility)
  services?: {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    uptime: number;
    lastCheck: string;
    errorRate: number;
  }[];
  infrastructure?: {
    database: {
      status: 'connected' | 'disconnected' | 'slow';
      connectionCount: number;
      avgQueryTime: number;
      slowQueries: number;
    };
    cache: {
      status: 'connected' | 'disconnected';
      hitRate: number;
      memoryUsage: number;
      keys: number;
    };
    messageQueue: {
      status: 'connected' | 'disconnected';
      queueLength: number;
      processingRate: number;
      errorRate: number;
    };
  };
  performance?: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkTraffic: {
      inbound: number;
      outbound: number;
    };
  };
  alerts?: {
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    service?: string;
    resolved: boolean;
  }[];
}

export interface AuditLog {
  id: string;
  action: string;

  // Flat properties for easier access (admin page compatibility)
  userId?: string;
  userName?: string;
  entityType?: string;
  entityId?: string;
  severity?: string;
  details?: string;

  // Nested structure (optional for backend compatibility)
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  target?: {
    type: 'user' | 'skill' | 'appointment' | 'match' | 'report' | 'settings';
    id: string;
    name: string;
  };
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success?: boolean;
  errorMessage?: string;
}

export interface ModerationReport {
  id: string;
  type:
    | 'inappropriate-content'
    | 'spam'
    | 'harassment'
    | 'fake-profile'
    | 'copyright'
    | 'other'
    | 'User'
    | 'Skill'
    | 'Comment'
    | 'Review';
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'escalated'
    | 'Pending'
    | 'Approved'
    | 'Rejected'
    | 'Flagged';
  priority?: 'low' | 'medium' | 'high' | 'critical';

  // Flat properties for easier access (admin page compatibility)
  reportedBy?: string;
  reportedByName?: string;
  reportedUser?: string;
  reportedUserName?: string;
  reason?: string;
  content?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';

  // Nested structure (optional for backend compatibility)
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reported?: {
    type: 'user' | 'skill' | 'appointment' | 'message';
    id: string;
    name: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  description?: string;
  evidence?: {
    type: 'screenshot' | 'text' | 'url' | 'other';
    content: string;
    url?: string;
  }[];
  createdAt: string;
  updatedAt?: string;
  handledBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  handledAt?: string;
  resolution?: string;
  actions?: {
    action: 'warning' | 'temporary-ban' | 'permanent-ban' | 'content-removal' | 'no-action';
    reason: string;
    timestamp: string;
    actor: string;
  }[];
}

export interface AdminSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
    twoFactorRequired: boolean;
  };
  moderation: {
    autoModerationEnabled: boolean;
    profanityFilterEnabled: boolean;
    spamDetectionEnabled: boolean;
    requireApprovalForNewSkills: boolean;
    maximumReportsBeforeAction: number;
    appealProcessEnabled: boolean;
  };
  features: {
    videoCallsEnabled: boolean;
    appointmentBookingEnabled: boolean;
    skillRatingsEnabled: boolean;
    skillEndorsementsEnabled: boolean;
    matchmakingEnabled: boolean;
    notificationsEnabled: boolean;
  };
  limits: {
    maxSkillsPerUser: number;
    maxAppointmentsPerDay: number;
    maxAppointmentDuration: number;
    fileUploadSizeLimit: number;
    rateLimit: {
      requests: number;
      timeWindow: number;
    };
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    systemAlerts: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireUppercase: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    accountLockoutDuration: number;
  };
  analytics: {
    googleAnalyticsEnabled: boolean;
    googleAnalyticsId?: string;
    dataRetentionDays: number;
    anonymizeUserData: boolean;
    trackingCookiesEnabled: boolean;
  };
}
