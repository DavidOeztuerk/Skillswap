// src/config/endpoints.ts

/**
 * API-Basispfad aus den Umgebungsvariablen
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Auth-Endpunkte
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/users/login',
  REGISTER: '/api/users/register',
  PROFILE: '/api/users/profile',
  VERIFY_EMAIL: '/api/users/verify-email',
  GENERATE_2FA: '/api/users/2fa/generate',
  VERIFY_2FA: '/api/users/2fa/verify',
  CHANGE_PASSWORD: '/api/users/change-password',
  FORGOT_PASSWORD: '/api/users/request-password-reset',
  RESET_PASSWORD: '/api/users/reset-password',
  REFRESH_TOKEN: '/api/users/refresh-token'
};

/**
 * Skill-Endpunkte
 */
export const SKILL_ENDPOINTS = {
  GET_SKILLS: '/api/skills',
  GET_MY_SKILLS: '/api/my/skills',
  GET_USER_SKILLS: '/api/users', // + /{userId}/skills
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
 * Matchmaking-Endpunkte
 */
export const MATCHMAKING_ENDPOINTS = {
  FIND_MATCH: '/api/matches/find',
  GET_MATCH: '/api/matches', // + /{matchId}
  ACCEPT_MATCH: '/api/matches', // + /{matchId}/accept
  REJECT_MATCH: '/api/matches', // + /{matchId}/reject
  GET_MY_MATCHES: '/api/my/matches',
  STATISTICS: '/api/matches/statistics',
};

/**
 * Termin-Endpunkte
 */
export const APPOINTMENT_ENDPOINTS = {
  CREATE: '/api/appointments',
  GET_MY: '/api/my/appointments',
  GET_SINGLE: '/api/appointments', // + /{appointmentId}
  ACCEPT: '/api/appointments', // + /{appointmentId}/accept
  CANCEL: '/api/appointments', // + /{appointmentId}/cancel
};

/**
 * Videoanruf-Endpunkte
 */
export const VIDEOCALL_ENDPOINTS = {
  CREATE: '/api/calls/create',
  JOIN: '/api/calls', // + /{sessionId}/join
  LEAVE: '/api/calls', // + /{sessionId}/leave
  START: '/api/calls', // + /{sessionId}/start
  END_CALL: '/api/calls', // + /{sessionId}/end
  DETAILS: '/api/calls', // + /{sessionId}
  MY_CALLS: '/api/my/calls',
  STATISTICS: '/api/calls/statistics',
  SIGNALING: '/api/videocall',
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
 * Benachrichtigungsendpunkte
 */
export const NOTIFICATION_ENDPOINTS = {
  GET_ALL: '/api/notifications',
  MARK_READ: '/api/notifications/read', // + /{notificationId}
  MARK_ALL_READ: '/api/notifications/read-all',
  SETTINGS: '/api/notifications/settings',
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
