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
export const getVersionedEndpoint = (endpoint: string): string =>
  endpoint.replace('/api/', `/api/${API_VERSION}/`);

// ============================================================================
// Base Path Constants (to avoid duplicate strings)
// ============================================================================
const BASE_USERS_PROFILE = '/api/users/profile';
const BASE_SKILLS = '/api/skills';
const BASE_MATCHES = '/api/matches';
const BASE_MATCHES_REQUESTS = '/api/matches/requests';
const BASE_APPOINTMENTS = '/api/appointments';
const BASE_CALLS = '/api/calls';
const BASE_NOTIFICATIONS = '/api/notifications';
const BASE_NOTIFICATIONS_PREFERENCES = `${BASE_NOTIFICATIONS}/preferences`;
const BASE_NOTIFICATIONS_TEMPLATES = `${BASE_NOTIFICATIONS}/templates`;
const BASE_ADMIN_USERS = '/api/admin/users';
const BASE_ADMIN_MODERATION = '/api/admin/moderation';
const BASE_ADMIN_SECURITY = '/api/admin/security';
const BASE_ADMIN_SECURITY_ALERTS = `${BASE_ADMIN_SECURITY}/alerts`;
const BASE_CHAT_THREADS = '/api/chat/threads';

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
  PROFILE: BASE_USERS_PROFILE,
  UPDATE_PROFILE: BASE_USERS_PROFILE,
  UPLOAD_AVATAR: `${BASE_USERS_PROFILE}/avatar`,

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
  GET_SKILLS: BASE_SKILLS,
  GET_USER_SKILLS: `${BASE_SKILLS}/my-skills`, // + /{userId}
  CREATE_SKILL: BASE_SKILLS,
  UPDATE_SKILL: BASE_SKILLS,
  DELETE_SKILL: BASE_SKILLS,
  RATE_SKILL: BASE_SKILLS, // + /{skillId}/rate
  ENDORSE_SKILL: `${BASE_SKILLS}/skills`, // + /{skillId}/endorse
  CATEGORIES: `${BASE_SKILLS}/categories`,
  PROFICIENCY_LEVELS: `${BASE_SKILLS}/proficiency-levels`,
  ANALYTICS_STATS: `${BASE_SKILLS}/analytics/statistics`,
  ANALYTICS_TAGS: `${BASE_SKILLS}/analytics/popular-tags`,
  RECOMMENDATIONS: `${BASE_SKILLS}/recommendations`,
};

/**
 * Favoriten-Endpunkte
 */
export const FAVORITE_ENDPOINTS = {
  GET_FAVORITES: () => `/api/users/favorites`,
  ADD_FAVORITE: () => `/api/users/favorites`,
  REMOVE_FAVORITE: (skillId: string) => `/api/users/favorites/${skillId}`,
};

/**
 * Matchmaking-Endpunkte mit verbesserter Organisation
 */
export const MATCHMAKING_ENDPOINTS = {
  // Core matching
  FIND_MATCHES: `${BASE_MATCHES}/find`,
  GET_MATCH: BASE_MATCHES, // + /{matchId}
  GET_USER_MATCHES: `${BASE_MATCHES}/my`,
  ACCEPT_MATCH: BASE_MATCHES, // + /{matchId}/accept
  REJECT_MATCH: BASE_MATCHES, // + /{matchId}/reject
  CANCEL_MATCH: BASE_MATCHES, // + /{matchId}/cancel

  // Advanced matching
  GET_SUGGESTIONS: `${BASE_MATCHES}/suggestions`,
  GET_COMPATIBILITY: `${BASE_MATCHES}/compatibility`, // + /{userId}
  SET_PREFERENCES: `${BASE_MATCHES}/preferences`,
  GET_PREFERENCES: `${BASE_MATCHES}/preferences`,

  // Match requests
  REQUESTS: {
    CREATE: BASE_MATCHES_REQUESTS,
    GET_INCOMING: `${BASE_MATCHES_REQUESTS}/incoming`,
    GET_OUTGOING: `${BASE_MATCHES_REQUESTS}/outgoing`,
    GET_ACCEPTED: `${BASE_MATCHES_REQUESTS}/accepted`,
    GET_THREAD: `${BASE_MATCHES_REQUESTS}/thread`, // + /{threadId}
    ACCEPT: BASE_MATCHES_REQUESTS, // Base path, append /{requestId}/accept
    REJECT: BASE_MATCHES_REQUESTS, // Base path, append /{requestId}/reject
    COUNTER: BASE_MATCHES_REQUESTS, // Base path, append /{requestId}/counter
    CANCEL: BASE_MATCHES_REQUESTS, // + /{requestId}/cancel
  },
  MATCHES: {
    USER: `${BASE_MATCHES}/my`,
    SEARCH: `${BASE_MATCHES}/search`,
    DETAILS: BASE_MATCHES,
  },

  // Match analytics
  STATISTICS: `${BASE_MATCHES}/statistics`,
  HISTORY: `${BASE_MATCHES}/history`,

  // Rating and feedback
  RATE_MATCH: BASE_MATCHES, // + /{matchId}/rate
  REPORT_MATCH: BASE_MATCHES, // + /{matchId}/report
};
/**
 * Termin-Endpunkte mit erweiterten Funktionen
 */
export const APPOINTMENT_ENDPOINTS = {
  // Core appointments
  CREATE: BASE_APPOINTMENTS,
  GET_MY: '/api/my/appointments',
  GET_SINGLE: BASE_APPOINTMENTS, // + /{appointmentId}
  UPDATE: BASE_APPOINTMENTS, // + /{appointmentId}
  DELETE: BASE_APPOINTMENTS, // + /{appointmentId}

  // Appointment actions
  ACCEPT: BASE_APPOINTMENTS, // + /{appointmentId}/accept
  CANCEL: BASE_APPOINTMENTS, // + /{appointmentId}/cancel
  RESCHEDULE: `${BASE_APPOINTMENTS}/{appointmentId}/reschedule`,
  GENERATE_MEETING_LINK: `${BASE_APPOINTMENTS}/{appointmentId}/meeting-link`,

  // Availability and scheduling
  GET_AVAILABILITY: `${BASE_APPOINTMENTS}/availability`, // + /{userId}
  SET_AVAILABILITY: `${BASE_APPOINTMENTS}/availability`,
  GET_TIME_SLOTS: `${BASE_APPOINTMENTS}/time-slots`,
  AVAILABLE_SLOTS: `${BASE_APPOINTMENTS}/available-slots`,

  // Reporting
  REPORT: BASE_APPOINTMENTS, // + /{appointmentId}/report

  // Reminders and notifications
  SET_REMINDER: BASE_APPOINTMENTS, // + /{appointmentId}/reminder
  GET_UPCOMING: `${BASE_APPOINTMENTS}/upcoming`,

  // History and analytics
  GET_HISTORY: `${BASE_APPOINTMENTS}/history`,
  GET_STATISTICS: `${BASE_APPOINTMENTS}/statistics`,

  // Rating and feedback
  RATE_APPOINTMENT: BASE_APPOINTMENTS, // + /{appointmentId}/rate
  PROVIDE_FEEDBACK: BASE_APPOINTMENTS, // + /{appointmentId}/feedback

  // Session lifecycle endpoints
  START_SESSION: BASE_APPOINTMENTS, // + /{appointmentId}/start
  COMPLETE_SESSION: BASE_APPOINTMENTS, // + /{appointmentId}/complete-session
  RATE_SESSION: BASE_APPOINTMENTS, // + /{appointmentId}/rate-session
  RESCHEDULE_SESSION: BASE_APPOINTMENTS, // + /{appointmentId}/reschedule-session
  CANCEL_SESSION: BASE_APPOINTMENTS, // + /{appointmentId}/cancel-session
  PROCESS_PAYMENT: BASE_APPOINTMENTS, // + /{appointmentId}/payment
};

/**
 * Videoanruf-Endpunkte mit erweiterten Features
 */
export const VIDEOCALL_ENDPOINTS = {
  // Call management
  CREATE: `${BASE_CALLS}/create`,
  JOIN: `${BASE_CALLS}/join`,
  LEAVE: `${BASE_CALLS}/leave`,
  START: `${BASE_CALLS}/start`,
  END_CALL: `${BASE_CALLS}/end`,
  DETAILS: BASE_CALLS, // + /{roomId}

  // Call history and user calls
  MY_CALLS: '/api/my/calls',
  CALL_HISTORY: `${BASE_CALLS}/history`,

  // Recording features
  START_RECORDING: BASE_CALLS, // + /{roomId}/recording/start
  STOP_RECORDING: BASE_CALLS, // + /{roomId}/recording/stop
  GET_RECORDINGS: BASE_CALLS, // + /{roomId}/recordings

  // Real-time features
  SIGNALING: '/api/videocall',
  CHAT: BASE_CALLS, // + /{roomId}/chat
  PARTICIPANTS: BASE_CALLS, // + /{roomId}/participants

  // Quality and diagnostics
  STATISTICS: `${BASE_CALLS}/statistics`,
  CONNECTION_TEST: `${BASE_CALLS}/test-connection`,
  REPORT_ISSUE: BASE_CALLS, // + /{roomId}/report

  // Settings and preferences
  UPDATE_SETTINGS: BASE_CALLS, // + /{roomId}/settings
  GET_FEATURES: `${BASE_CALLS}/features`,
};

/**
 * Benutzerprofilendpunkte
 */
export const PROFILE_ENDPOINTS = {
  UPDATE: BASE_USERS_PROFILE,
  UPLOAD_AVATAR: `${BASE_USERS_PROFILE}/avatar`,
  GET_USER: BASE_USERS_PROFILE,
  FEEDBACK: '/api/users/feedback',
};

/**
 * Benachrichtigungsendpunkte mit Real-Time Support
 */
export const NOTIFICATION_ENDPOINTS = {
  // Core notifications
  GET_ALL: BASE_NOTIFICATIONS,
  GET_UNREAD: `${BASE_NOTIFICATIONS}/unread`,
  GET_COUNT: `${BASE_NOTIFICATIONS}/count`,

  // Notification actions
  MARK_READ: BASE_NOTIFICATIONS, // + /{notificationId}/read
  MARK_ALL_READ: `${BASE_NOTIFICATIONS}/read-all`,
  DELETE: BASE_NOTIFICATIONS, // + /{notificationId}
  CLEAR_ALL: `${BASE_NOTIFICATIONS}/clear-all`,

  // Real-time subscriptions
  SUBSCRIBE: `${BASE_NOTIFICATIONS}/subscribe`,
  UNSUBSCRIBE: `${BASE_NOTIFICATIONS}/unsubscribe`,

  // Settings and preferences
  SETTINGS: BASE_NOTIFICATIONS_PREFERENCES,
  UPDATE_SETTINGS: BASE_NOTIFICATIONS_PREFERENCES,
  GET_PREFERENCES: BASE_NOTIFICATIONS_PREFERENCES,
  UPDATE_PREFERENCES: BASE_NOTIFICATIONS_PREFERENCES,

  // Push notifications
  PUSH_TOKEN: `${BASE_NOTIFICATIONS_PREFERENCES}/push-token`,

  // Reminder settings
  REMINDER_SETTINGS: `${BASE_NOTIFICATIONS}/reminders/settings`,

  // Admin sending
  SEND: `${BASE_NOTIFICATIONS}/send`,
  BULK_SEND: `${BASE_NOTIFICATIONS}/bulk-send`,
  BROADCAST: `${BASE_NOTIFICATIONS}/broadcast`,

  // Templates and categories
  GET_TEMPLATES: BASE_NOTIFICATIONS_TEMPLATES,
  GET_TEMPLATE_BY_ID: BASE_NOTIFICATIONS_TEMPLATES, // + /{templateId}
  UPDATE_TEMPLATE: BASE_NOTIFICATIONS_TEMPLATES,
  PREVIEW_TEMPLATE: `${BASE_NOTIFICATIONS_TEMPLATES}/preview`,
  TEST_SEND_TEMPLATE: `${BASE_NOTIFICATIONS_TEMPLATES}/test-send`,
  GET_CATEGORIES: `${BASE_NOTIFICATIONS}/categories`,
};

/**
 * Admin-Endpunkte
 */
const BASE_ADMIN = '/api/admin';
const BASE_ADMIN_DASHBOARD = `${BASE_ADMIN}/dashboard`;

export const ADMIN_ENDPOINTS = {
  DASHBOARD: BASE_ADMIN_DASHBOARD,
  USERS: BASE_ADMIN_USERS,
  SKILLS: `${BASE_ADMIN}/skills`,
  APPOINTMENTS: `${BASE_ADMIN}/appointments`,
  MATCHES: `${BASE_ADMIN}/matches`,
  // FIXED: Changed from '/api/admin/analytics' to dashboard - analytics endpoint doesn't exist
  ANALYTICS: BASE_ADMIN_DASHBOARD,
  SYSTEM_HEALTH: `${BASE_ADMIN}/system-health`,
  AUDIT_LOGS: `${BASE_ADMIN}/audit-logs`,
  MODERATION: BASE_ADMIN_MODERATION,
  REPORTS: `${BASE_ADMIN}/reports`,
  SETTINGS: `${BASE_ADMIN}/settings`,
  USER_MANAGEMENT: {
    GET_ALL: BASE_ADMIN_USERS,
    GET_BY_ID: BASE_ADMIN_USERS, // + /{userId}
    UPDATE_ROLE: BASE_ADMIN_USERS, // + /{userId}/role
    SUSPEND: BASE_ADMIN_USERS, // + /{userId}/suspend
    UNSUSPEND: BASE_ADMIN_USERS, // + /{userId}/unsuspend
    DELETE: BASE_ADMIN_USERS, // + /{userId}
    EXPORT: `${BASE_ADMIN_USERS}/export`,
  },
  CONTENT_MODERATION: {
    GET_REPORTS: `${BASE_ADMIN_MODERATION}/reports`,
    APPROVE_CONTENT: `${BASE_ADMIN_MODERATION}/approve`, // + /{contentId}
    REJECT_CONTENT: `${BASE_ADMIN_MODERATION}/reject`, // + /{contentId}
    QUARANTINE: `${BASE_ADMIN_MODERATION}/quarantine`, // + /{contentId}
  },
  SECURITY: {
    GET_ALERTS: BASE_ADMIN_SECURITY_ALERTS,
    GET_ALERT_BY_ID: BASE_ADMIN_SECURITY_ALERTS, // + /{alertId}
    GET_STATISTICS: `${BASE_ADMIN_SECURITY}/statistics`,
    DISMISS_ALERT: BASE_ADMIN_SECURITY_ALERTS, // + /{alertId}/dismiss
    MARK_ALERT_READ: BASE_ADMIN_SECURITY_ALERTS, // + /{alertId}/mark-read
  },
};

/**
 * Chat-Endpunkte für Thread-basiertes Messaging
 */
const BASE_CHAT = '/api/chat';
const BASE_CHAT_MESSAGES = `${BASE_CHAT}/messages`;
const BASE_CHAT_ATTACHMENTS = `${BASE_CHAT}/attachments`;

export const CHAT_ENDPOINTS = {
  // Thread operations
  THREADS: BASE_CHAT_THREADS,
  THREAD: BASE_CHAT_THREADS, // + /{threadId}
  CREATE_THREAD: BASE_CHAT_THREADS,

  // Message operations
  MESSAGES: BASE_CHAT_THREADS, // + /{threadId}/messages
  SEND_MESSAGE: BASE_CHAT_THREADS, // + /{threadId}/messages

  // Read receipts
  MARK_READ: BASE_CHAT_THREADS, // + /{threadId}/read

  // Typing indicator
  TYPING: BASE_CHAT_THREADS, // + /{threadId}/typing

  // Reactions
  REACTIONS: BASE_CHAT_MESSAGES, // + /{messageId}/reactions

  // Unread count
  UNREAD_COUNT: `${BASE_CHAT}/unread`,

  // File attachments
  UPLOAD_ATTACHMENT: `${BASE_CHAT_ATTACHMENTS}/upload`,
  DOWNLOAD_ATTACHMENT: BASE_CHAT_ATTACHMENTS, // + /{attachmentId}
};

/**
 * Calendar Integration Endpunkte
 */
export const CALENDAR_ENDPOINTS = {
  // Get all connected calendars
  CONNECTIONS: '/api/users/calendar/connections',
  // Initiate OAuth connection (append provider: /connect/google or /connect/microsoft)
  CONNECT: '/api/users/calendar/connect',
  // OAuth callback (used internally by backend)
  CALLBACK: '/api/users/calendar/callback',
  // Disconnect a calendar (append provider: /disconnect/google)
  DISCONNECT: '/api/users/calendar/disconnect',
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
export const getFullApiUrl = (endpoint: string): string => `${API_BASE_URL}${endpoint}`;

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
      url.searchParams.append(key, value.toString());
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
    result = result.replace(`{${key}}`, value.toString());
  });
  return result;
};

/**
 * Erstellt eine Cache-optimierte URL
 * @param endpoint - Der Endpunkt
 * @param cacheKey - Optional cache key für bessere Performance
 * @returns Cache-optimierte URL
 */
export const getCachedEndpoint = (endpoint: string, cacheKey?: string): string => {
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
): { url: string; config: EndpointConfig } => ({
  url: endpoint,
  config: { ...ENDPOINT_CONFIGS.static, ...config },
});
