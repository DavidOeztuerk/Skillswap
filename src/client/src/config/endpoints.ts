/**
 * API-Basispfad aus den Umgebungsvariablen mit Fallback-Unterstützung
 */
export const API_BASE_URL = (() => {
  const env = import.meta.env.VITE_API_BASE_URL;
  const isDev = import.meta.env.DEV;
  
  if (env) return env;
  if (isDev) return 'http://localhost:8080';
  
  // Production fallback
  return window.location.origin;
})();

/**
 * API Versioning Support
 */
export const API_VERSION = 'v1';
export const getVersionedEndpoint = (endpoint: string) => 
  endpoint.replace('/api/', `/api/${API_VERSION}/`);

/**
 * Auth-Endpunkte mit verbesserter Struktur
 */
export const AUTH_ENDPOINTS = {
  // Core authentication
  LOGIN: '/api/users/login',
  REGISTER: '/api/users/register',
  LOGOUT: '/api/users/logout',
  REFRESH_TOKEN: '/api/users/refresh-token',
  
  // Profile management
  PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  UPLOAD_AVATAR: '/api/users/profile/avatar',
  
  // Email verification
  VERIFY_EMAIL: '/api/users/verify-email',
  RESEND_VERIFICATION: '/api/users/resend-verification',
  
  // Two-factor authentication
  GENERATE_2FA: '/api/users/2fa/generate',
  VERIFY_2FA: '/api/users/2fa/verify',
  DISABLE_2FA: '/api/users/2fa/disable',
  TWO_FACTOR_STATUS: '/api/users/2fa/status',
  
  // Password management
  CHANGE_PASSWORD: '/api/users/change-password',
  FORGOT_PASSWORD: '/api/users/request-password-reset',
  RESET_PASSWORD: '/api/users/reset-password',
  VALIDATE_RESET_TOKEN: '/api/users/validate-reset-token',
  
  // Session management
  GET_SESSIONS: '/api/users/sessions',
  REVOKE_SESSION: '/api/users/sessions',
  REVOKE_ALL_SESSIONS: '/api/users/sessions/revoke-all',
};

/**
 * Skill-Endpunkte
 */
export const SKILL_ENDPOINTS = {
  GET_SKILLS: '/api/skills',
  GET_USER_SKILLS: '/api/skills/my-skills', // + /{userId}
  CREATE_SKILL: '/api/skills',
  UPDATE_SKILL: '/api/skills',
  DELETE_SKILL: '/api/skills',
  RATE_SKILL: '/api/skills', // + /{skillId}/rate
  ENDORSE_SKILL: '/api/skills', // + /{skillId}/endorse
  CATEGORIES: '/api/categories',
  PROFICIENCY_LEVELS: '/api/proficiency-levels',
  ANALYTICS_STATS: '/api/skills/analytics/statistics',
  ANALYTICS_TAGS: '/api/skills/analytics/popular-tags',
  RECOMMENDATIONS: '/api/skills/recommendations',
};

/**
 * Favoriten-Endpunkte
 */
export const FAVORITE_ENDPOINTS = {
  GET_FAVORITES: () => `/api/users/favorites`,
  ADD_FAVORITE: (skillId: string) => `/api/users/favorites/${skillId}`,
  REMOVE_FAVORITE: (skillId: string) => `/api/users/favorites/${skillId}`,
};

/**
 * Matchmaking-Endpunkte mit verbesserter Organisation
 */
export const MATCHMAKING_ENDPOINTS = {
  // Core matching
  FIND_MATCHES: '/api/matches/find',
  GET_MATCH: '/api/matches', // + /{matchId}
  GET_USER_MATCHES: '/api/matches/my',
  ACCEPT_MATCH: '/api/matches', // + /{matchId}/accept
  REJECT_MATCH: '/api/matches', // + /{matchId}/reject
  CANCEL_MATCH: '/api/matches', // + /{matchId}/cancel
  
  // Advanced matching
  GET_SUGGESTIONS: '/api/matches/suggestions',
  GET_COMPATIBILITY: '/api/matches/compatibility', // + /{userId}
  SET_PREFERENCES: '/api/matches/preferences',
  GET_PREFERENCES: '/api/matches/preferences',
  
  // Match requests
  REQUESTS: {
    CREATE: '/api/matches/requests',
    GET_INCOMING: '/api/matches/requests/incoming',
    GET_OUTGOING: '/api/matches/requests/outgoing',
    GET_ACCEPTED: '/api/matches/requests/accepted',
    GET_THREAD: '/api/matches/requests/thread', // + /{threadId}
    ACCEPT: '/api/matches/requests/accept',
    REJECT: '/api/matches/requests/reject',
    COUNTER: '/api/matches/requests', // + /{requestId}/counter
    CANCEL: '/api/matches/requests', // + /{requestId}/cancel
  },
  
  // Match analytics
  STATISTICS: '/api/matches/statistics',
  HISTORY: '/api/matches/history',
  
  // Rating and feedback
  RATE_MATCH: '/api/matches', // + /{matchId}/rate
  REPORT_MATCH: '/api/matches', // + /{matchId}/report
};
/**
 * Termin-Endpunkte mit erweiterten Funktionen
 */
export const APPOINTMENT_ENDPOINTS = {
  // Core appointments
  CREATE: '/api/appointments',
  GET_MY: '/api/my/appointments',
  GET_SINGLE: '/api/appointments', // + /{appointmentId}
  UPDATE: '/api/appointments', // + /{appointmentId}
  DELETE: '/api/appointments', // + /{appointmentId}
  
  // Appointment actions
  ACCEPT: '/api/appointments', // + /{appointmentId}/accept
  CANCEL: '/api/appointments', // + /{appointmentId}/cancel
  RESCHEDULE: '/api/appointments', // + /{appointmentId}/reschedule
  
  // Availability and scheduling
  GET_AVAILABILITY: '/api/appointments/availability', // + /{userId}
  SET_AVAILABILITY: '/api/appointments/availability',
  GET_TIME_SLOTS: '/api/appointments/time-slots',
  
  // Reminders and notifications
  SET_REMINDER: '/api/appointments', // + /{appointmentId}/reminder
  GET_UPCOMING: '/api/appointments/upcoming',
  
  // History and analytics
  GET_HISTORY: '/api/appointments/history',
  GET_STATISTICS: '/api/appointments/statistics',
  
  // Rating and feedback
  RATE_APPOINTMENT: '/api/appointments', // + /{appointmentId}/rate
  PROVIDE_FEEDBACK: '/api/appointments', // + /{appointmentId}/feedback
};

/**
 * Videoanruf-Endpunkte mit erweiterten Features
 */
export const VIDEOCALL_ENDPOINTS = {
  // Call management
  CREATE: '/api/calls/create',
  JOIN: '/api/calls', // + /{roomId}/join
  LEAVE: '/api/calls', // + /{roomId}/leave
  START: '/api/calls', // + /{roomId}/start
  END_CALL: '/api/calls', // + /{roomId}/end
  DETAILS: '/api/calls', // + /{roomId}
  
  // Call history and user calls
  MY_CALLS: '/api/my/calls',
  CALL_HISTORY: '/api/calls/history',
  
  // Recording features
  START_RECORDING: '/api/calls', // + /{roomId}/recording/start
  STOP_RECORDING: '/api/calls', // + /{roomId}/recording/stop
  GET_RECORDINGS: '/api/calls', // + /{roomId}/recordings
  
  // Real-time features
  SIGNALING: '/api/videocall',
  CHAT: '/api/calls', // + /{roomId}/chat
  PARTICIPANTS: '/api/calls', // + /{roomId}/participants
  
  // Quality and diagnostics
  STATISTICS: '/api/calls/statistics',
  CONNECTION_TEST: '/api/calls/test-connection',
  REPORT_ISSUE: '/api/calls', // + /{roomId}/report
  
  // Settings and preferences
  UPDATE_SETTINGS: '/api/calls', // + /{roomId}/settings
  GET_FEATURES: '/api/calls/features',
};

/**
 * Benutzerprofilendpunkte
 */
export const PROFILE_ENDPOINTS = {
  UPDATE: '/api/users/profile',
  UPLOAD_AVATAR: '/api/users/profile/avatar',
  GET_USER: '/api/users', // + /{userId}
  FEEDBACK: '/api/users/feedback',
};

/**
 * Benachrichtigungsendpunkte mit Real-Time Support
 */
export const NOTIFICATION_ENDPOINTS = {
  // Core notifications
  GET_ALL: '/api/notifications',
  GET_UNREAD: '/api/notifications/unread',
  GET_COUNT: '/api/notifications/count',
  
  // Notification actions
  MARK_READ: '/api/notifications', // + /{notificationId}/read
  MARK_ALL_READ: '/api/notifications/read-all',
  DELETE: '/api/notifications', // + /{notificationId}
  CLEAR_ALL: '/api/notifications/clear-all',
  
  // Real-time subscriptions
  SUBSCRIBE: '/api/notifications/subscribe',
  UNSUBSCRIBE: '/api/notifications/unsubscribe',
  
  // Settings and preferences
  SETTINGS: '/api/notifications/settings',
  UPDATE_SETTINGS: '/api/notifications/settings',
  GET_PREFERENCES: '/api/notifications/preferences',
  UPDATE_PREFERENCES: '/api/notifications/preferences',
  
  // Admin sending
  SEND: '/api/notifications/send',
  BULK_SEND: '/api/notifications/bulk-send',
  BROADCAST: '/api/notifications/broadcast',
  
  // Templates and categories
  GET_TEMPLATES: '/api/notifications/templates',
  GET_CATEGORIES: '/api/notifications/categories',
};

/**
 * Admin-Endpunkte
 */
export const ADMIN_ENDPOINTS = {
  DASHBOARD: '/api/admin/dashboard',
  USERS: '/api/admin/users',
  SKILLS: '/api/admin/skills',
  APPOINTMENTS: '/api/admin/appointments',
  MATCHES: '/api/admin/matches',
  ANALYTICS: '/api/admin/analytics',
  SYSTEM_HEALTH: '/api/admin/system-health',
  AUDIT_LOGS: '/api/admin/audit-logs',
  MODERATION: '/api/admin/moderation',
  REPORTS: '/api/admin/reports',
  SETTINGS: '/api/admin/settings',
  USER_MANAGEMENT: {
    GET_ALL: '/api/admin/users',
    GET_BY_ID: '/api/admin/users', // + /{userId}
    UPDATE_ROLE: '/api/admin/users', // + /{userId}/role
    SUSPEND: '/api/admin/users', // + /{userId}/suspend
    UNSUSPEND: '/api/admin/users', // + /{userId}/unsuspend
    DELETE: '/api/admin/users', // + /{userId}
    EXPORT: '/api/admin/users/export',
  },
  CONTENT_MODERATION: {
    GET_REPORTS: '/api/admin/moderation/reports',
    APPROVE_CONTENT: '/api/admin/moderation/approve', // + /{contentId}
    REJECT_CONTENT: '/api/admin/moderation/reject', // + /{contentId}
    QUARANTINE: '/api/admin/moderation/quarantine', // + /{contentId}
  },
};

/**
 * System-/Admin-Endpunkte
 */
export const SYSTEM_ENDPOINTS = {
  /**
   * Liefert Metriken des angegebenen Service
   */
  METRICS: (service: string) => `/api/system/metrics/${service}`,
};

/**
 * Erstellt einen vollständigen API-Pfad
 * @param endpoint - Der relative Endpunkt
 * @returns Der vollständige API-Pfad
 */
export const getFullApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Erstellt einen Pfad mit URL-Parametern
 * @param endpoint - Der Basis-Endpunkt
 * @param params - Objekt mit URL-Parametern
 * @returns Ein Endpunkt mit angehängten URL-Parametern
 */
export const getUrlWithParams = (
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>
): string => {
  const url = new URL(getFullApiUrl(endpoint));

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
};

/**
 * Erstellt einen parametrisierten Endpunkt
 * @param endpoint - Der Basis-Endpunkt mit Platzhaltern (z.B. "/api/users/{userId}")
 * @param pathParams - Objekt mit Pfad-Parametern
 * @returns Der Endpunkt mit ersetzten Parametern
 */
export const getParameterizedEndpoint = (
  endpoint: string,
  pathParams: Record<string, string | number>
): string => {
  let result = endpoint;
  Object.entries(pathParams).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  return result;
};

/**
 * Erstellt eine Cache-optimierte URL
 * @param endpoint - Der Endpunkt
 * @param cacheKey - Optional cache key für bessere Performance
 * @returns Cache-optimierte URL
 */
export const getCachedEndpoint = (
  endpoint: string,
  cacheKey?: string
): string => {
  if (!cacheKey) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}_cache=${cacheKey}`;
};

/**
 * Endpoint-Konfiguration für optimierte Performance
 */
export interface EndpointConfig {
  cacheStrategy?: 'no-cache' | 'cache-first' | 'stale-while-revalidate';
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Standard-Konfigurationen für verschiedene Endpoint-Typen
 */
export const ENDPOINT_CONFIGS: Record<string, EndpointConfig> = {
  // Real-time endpoints
  realtime: {
    cacheStrategy: 'no-cache',
    timeout: 5000,
    retries: 3,
    priority: 'high',
  },
  
  // Static data endpoints
  static: {
    cacheStrategy: 'cache-first',
    timeout: 10000,
    retries: 1,
    priority: 'medium',
  },
  
  // User data endpoints
  user: {
    cacheStrategy: 'stale-while-revalidate',
    timeout: 8000,
    retries: 2,
    priority: 'high',
  },
  
  // Admin endpoints
  admin: {
    cacheStrategy: 'no-cache',
    timeout: 15000,
    retries: 1,
    priority: 'medium',
  },
  
  // Critical operations
  critical: {
    cacheStrategy: 'no-cache',
    timeout: 3000,
    retries: 5,
    priority: 'critical',
  },
};

/**
 * Hilfsfunktion zum Erstellen optimierter API-Calls
 */
export const createOptimizedEndpoint = (
  endpoint: string,
  config: EndpointConfig = {}
) => ({
  url: endpoint,
  config: { ...ENDPOINT_CONFIGS.static, ...config },
});
