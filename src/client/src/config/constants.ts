// src/config/constants.ts

/**
 * Anwendungskonstanten
 */
export const APP_NAME = 'SkillSwap Platform';
export const APP_VERSION = '1.0.0';

/**
 * Pagination-Standardwerte
 */
export const DEFAULT_PAGE_SIZE = 12;
export const DEFAULT_PAGE_NUMBER = 1;

/**
 * Auth-bezogene Konstanten
 */
export const AUTH_TOKEN_STORAGE_KEY = 'skillswap_token';
export const AUTH_USER_STORAGE_KEY = 'skillswap_user';
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 Minuten in Millisekunden

/**
 * API-bezogene Konstanten
 */
export const API_TIMEOUT = 15000; // 15 Sekunden
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 Sekunde

/**
 * Validierungskonstanten
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;
export const MAX_BIO_LENGTH = 500;

/**
 * Feature-Konstanten
 */
export const MAX_LEARNABLE_SKILLS = 10;
export const MAX_TEACHABLE_SKILLS = 10;
export const MAX_MATCH_RESULTS = 20;
export const MAX_APPOINTMENTS_PER_WEEK = 10;

/**
 * Zeitformatierungen
 */
export const DEFAULT_DATE_FORMAT = 'dd.MM.yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm';

/**
 * Skill-Kategorien
 */
export const SKILL_CATEGORIES = [
  'Programming',
  'Language',
  'Music',
  'Art',
  'Science',
  'Math',
  'Business',
  'Other',
];

/**
 * Kompetenzlevel
 */
export const PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
];

/**
 * Videoanruf-Konfiguration
 */
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
export const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
};
export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
export const MAX_VIDEO_BITRATE = 1000000; // 1 Mbps

/**
 * Fehlermeldungen
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Netzwerkfehler. Bitte überprüfe deine Verbindung.',
  AUTH_FAILURE: 'Authentifizierung fehlgeschlagen. Bitte erneut anmelden.',
  SESSION_EXPIRED: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  SERVER_ERROR: 'Serverfehler aufgetreten. Bitte versuche es später erneut.',
  PERMISSION_DENIED:
    'Zugriff verweigert. Du hast keine Berechtigung für diese Aktion.',
  NOT_FOUND: 'Ressource nicht gefunden.',
  VALIDATION_ERROR: 'Überprüfe deine Eingaben.',
  UNKNOWN_ERROR: 'Ein unbekannter Fehler ist aufgetreten.',
};

/**
 * Erfolgsmeldungen
 */
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Dein Profil wurde erfolgreich aktualisiert.',
  SKILL_ADDED: 'Skill erfolgreich hinzugefügt.',
  SKILL_REMOVED: 'Skill erfolgreich entfernt.',
  MATCH_REQUESTED: 'Match-Anfrage wurde erfolgreich gesendet.',
  MATCH_ACCEPTED: 'Match wurde erfolgreich akzeptiert.',
  MATCH_REJECTED: 'Match wurde abgelehnt.',
  APPOINTMENT_CREATED: 'Termin wurde erfolgreich erstellt.',
  APPOINTMENT_CONFIRMED: 'Termin wurde bestätigt.',
  APPOINTMENT_CANCELLED: 'Termin wurde abgesagt.',
  PASSWORD_CHANGED: 'Dein Passwort wurde erfolgreich geändert.',
};

/**
 * Zeitfenster-Optionen
 */
export const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

/**
 * Wochentage
 */
export const WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];
