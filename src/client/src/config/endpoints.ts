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
  CHANGE_PASSWORD: '/api/users/change-password',
  FORGOT_PASSWORD: '/api/users/forgot-password',
  RESET_PASSWORD: '/api/users/reset-password',
  REFRESH_TOKEN: '/api/users/refresh-token'
};

/**
 * Skill-Endpunkte
 */
export const SKILL_ENDPOINTS = {
  GET_SKILLS: '/api/skills',
  GET_USER_SKILLS: '/api/user/skills',
  SEARCH_SKILLS: '/api/skills/search',
  SEARCH_USER_SKILLS: '/api/user/skills/search',
  CREATE_SKILL: '/api/skills',
  UPDATE_SKILL: '/api/skills',
  DELETE_SKILL: '/api/skills',
  CATEGORIES: '/api/categories',
  PROFICIENCY_LEVELS: '/api/proficiencylevels',
};

/**
 * Matchmaking-Endpunkte
 */
export const MATCHMAKING_ENDPOINTS = {
  FIND_MATCH: '/api/matches/find',
  GET_MATCH: '/api/matches', // + /{matchSessionId}
  ACCEPT_MATCH: '/api/matches/accept', // + /{matchSessionId}
  REJECT_MATCH: '/api/matches/reject', // + /{matchSessionId}
  GET_USER_MATCHES: '/api/matches',
};

/**
 * Termin-Endpunkte
 */
export const APPOINTMENT_ENDPOINTS = {
  CREATE: '/api/appointments/create',
  GET_ALL: '/api/appointments',
  RESPOND: '/api/appointments/respond',
  GET_SINGLE: '/api/appointments', // + /{appointmentId}
  CANCEL: '/api/appointments/cancel', // + /{appointmentId}
  COMPLETE: '/api/appointments/complete', // + /{appointmentId}
};

/**
 * Videoanruf-Endpunkte
 */
export const VIDEOCALL_ENDPOINTS = {
  CONFIG: '/api/videocall', // mit appointmentId als Query-Parameter
  END_CALL: '/api/videocall', // POST mit roomId im Body
  SIGNALING: '/api/videocall/hub', // SignalR-Hub
};

/**
 * Benutzerprofilendpunkte
 */
export const PROFILE_ENDPOINTS = {
  UPDATE: '/api/users/profile/update',
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
