// src/config/constants.ts

/**
 * Application constants
 */
export const APP_NAME = 'SkillSwap Platform';
export const APP_VERSION = '1.0.0';

/**
 * Pagination default values
 */
export const DEFAULT_PAGE_SIZE = 12;
export const DEFAULT_PAGE_NUMBER = 1;

/**
 * Auth-related constants
 */
export const AUTH_TOKEN_STORAGE_KEY = 'skillswap_token';
export const AUTH_USER_STORAGE_KEY = 'skillswap_user';
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * API-related constants
 */
export const API_TIMEOUT = 15000; // 15 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

/**
 * Validation constants
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;
export const MAX_BIO_LENGTH = 500;

/**
 * Feature constants
 */
export const MAX_LEARNABLE_SKILLS = 10;
export const MAX_TEACHABLE_SKILLS = 10;
export const MAX_MATCH_RESULTS = 20;
export const MAX_APPOINTMENTS_PER_WEEK = 10;

/**
 * Time formatting
 */
export const DEFAULT_DATE_FORMAT = 'dd.MM.yyyy';
export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm';

/**
 * Skill categories
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
 * Proficiency levels
 */
export const PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
];

/**
 * Video call configuration
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
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_FAILURE: 'Authentication failed. Please log in again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  PERMISSION_DENIED:
    'Access denied. You do not have permission for this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input.',
  UNKNOWN_ERROR: 'An unknown error has occurred.',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Your profile has been successfully updated.',
  SKILL_ADDED: 'Skill successfully added.',
  SKILL_REMOVED: 'Skill successfully removed.',
  MATCH_REQUESTED: 'Match request successfully sent.',
  MATCH_ACCEPTED: 'Match successfully accepted.',
  MATCH_REJECTED: 'Match was rejected.',
  APPOINTMENT_CREATED: 'Appointment successfully created.',
  APPOINTMENT_CONFIRMED: 'Appointment confirmed.',
  APPOINTMENT_CANCELLED: 'Appointment cancelled.',
  PASSWORD_CHANGED: 'Your password has been successfully changed.',
};

/**
 * Time slot options
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
 * Weekdays
 */
export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];