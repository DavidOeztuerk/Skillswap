import { createContext } from 'react';

// ============================================================================
// Types
// ============================================================================

export type LoadingState = Record<string, boolean>;

export interface LoadingContextType {
  /** Check if a specific operation is loading */
  isLoading: (key?: string) => boolean;
  /** Start loading for a specific operation */
  startLoading: (key: string) => void;
  /** Stop loading for a specific operation */
  stopLoading: (key: string) => void;
  /** Execute an async operation with automatic loading state */
  withLoading: <T>(key: string, operation: () => Promise<T>) => Promise<T>;
  /** Get all loading states (for debugging) */
  getLoadingStates: () => LoadingState;
  /** Check if anything is loading */
  isAnyLoading: () => boolean;
  /** Clear all loading states */
  clearAllLoading: () => void;
}

// ============================================================================
// Context
// ============================================================================

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// ============================================================================
// Loading Keys Constants
// ============================================================================

export const LoadingKeys = {
  // Auth operations
  LOGIN: 'auth.login',
  REGISTER: 'auth.register',
  LOGOUT: 'auth.logout',
  REFRESH_TOKEN: 'auth.refreshToken',
  VERIFY_EMAIL: 'auth.verifyEmail',
  RESET_PASSWORD: 'auth.resetPassword',

  // User operations
  FETCH_PROFILE: 'user.fetchProfile',
  UPDATE_PROFILE: 'user.updateProfile',
  UPLOAD_AVATAR: 'user.uploadAvatar',

  // Skill operations
  FETCH_SKILLS: 'skills.fetch',
  CREATE_SKILL: 'skills.create',
  UPDATE_SKILL: 'skills.update',
  DELETE_SKILL: 'skills.delete',
  SEARCH_SKILLS: 'skills.search',

  // Matching operations
  FETCH_MATCHES: 'matches.fetch',
  CREATE_MATCH: 'matches.create',
  ACCEPT_MATCH: 'matches.accept',
  REJECT_MATCH: 'matches.reject',

  // Appointment operations
  FETCH_APPOINTMENTS: 'appointments.fetch',
  CREATE_APPOINTMENT: 'appointments.create',
  UPDATE_APPOINTMENT: 'appointments.update',
  CANCEL_APPOINTMENT: 'appointments.cancel',

  // Video call operations
  VIDEO_CALL_INIT: 'videocall.init',
  VIDEO_CALL_JOIN: 'videocall.join',
  VIDEO_CALL_LEAVE: 'videocall.leave',

  // Admin operations
  FETCH_USERS: 'admin.fetchUsers',
  UPDATE_USER: 'admin.updateUser',
  DELETE_USER: 'admin.deleteUser',
  FETCH_STATS: 'admin.fetchStats',

  // General operations
  FETCH_DATA: 'general.fetchData',
  SUBMIT_FORM: 'general.submitForm',
  SEARCH: 'general.search',
  PAGINATION: 'general.pagination',
} as const;

export type LoadingKey = (typeof LoadingKeys)[keyof typeof LoadingKeys];
