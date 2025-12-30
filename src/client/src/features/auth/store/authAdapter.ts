import { createEntityAdapter, type EntityState, type EntityId } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { User } from '../../user/types/User';
import type { LoginRequest } from '../types/LoginRequest';

// ============================================
// ENTITY ADAPTER
// ============================================

/**
 * Entity adapter for User entities
 * Used for normalized user storage in Redux
 */
export const usersAdapter = createEntityAdapter<User, EntityId>({
  selectId: (user) => user.id,
  sortComparer: (a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
});

// ============================================
// STATE INTERFACE
// ============================================

/**
 * Password flow state (used for forgot/reset password)
 */
export interface PasswordFlowState {
  isLoading: boolean;
  isSuccess: boolean;
  errorMessage: string | undefined;
}

/**
 * Auth state interface extending EntityState and RequestState
 */
export interface UsersEntityState extends EntityState<User, EntityId>, RequestState {
  /** Currently authenticated user */
  user: User | undefined;

  /** Whether user is authenticated */
  isAuthenticated: boolean;

  /** Pending credentials when 2FA is required */
  pendingLoginCredentials: LoginRequest | undefined;

  /** Timestamp of last successful auth check */
  lastAuthCheck?: number;

  /** Password reset state */
  resetPassword: PasswordFlowState;

  /** Forgot password state */
  forgotPassword: PasswordFlowState;
}

// ============================================
// INITIAL STATE
// ============================================

/**
 * Initial state for password flow
 */
export const initialPasswordFlowState: PasswordFlowState = {
  isLoading: false,
  isSuccess: false,
  errorMessage: undefined,
};

/**
 * Helper to safely check for existing token
 * SSR-safe: returns false during server-side rendering
 */
const hasStoredToken = (): boolean => {
  // SSR safety check
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const sessionToken = sessionStorage.getItem('access_token');
    const localToken = localStorage.getItem('access_token');
    return !!(sessionToken ?? localToken);
  } catch {
    // Storage access might fail in some environments
    return false;
  }
};

/**
 * Initial state for auth slice
 *
 * NOTE: isAuthenticated is initialized based on token presence,
 * but actual validation happens via silentLogin on app startup
 */
export const initialUsersState: UsersEntityState = usersAdapter.getInitialState({
  user: undefined,
  isAuthenticated: hasStoredToken(),
  pendingLoginCredentials: undefined,
  isLoading: false,
  errorMessage: undefined,
  lastAuthCheck: undefined,
  resetPassword: { ...initialPasswordFlowState },
  forgotPassword: { ...initialPasswordFlowState },
});

// ============================================
// SELECTORS
// ============================================

/**
 * Entity adapter selectors
 */
export const usersSelectors = usersAdapter.getSelectors();

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard to check if a user is fully loaded
 */
export const isUserComplete = (user: User | null): user is User =>
  user !== null && !!user.id && !!user.email;

/**
 * Type guard for 2FA pending state
 */
export const is2FAPending = (state: UsersEntityState): boolean =>
  state.pendingLoginCredentials !== undefined;
