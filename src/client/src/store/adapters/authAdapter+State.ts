import { createEntityAdapter, EntityState, EntityId } from '@reduxjs/toolkit';
import { User } from '../../types/models/User';
import { RequestState } from '../../types/common/RequestState';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';

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
 * Auth state interface extending EntityState and RequestState
 */
export interface UsersEntityState extends EntityState<User, EntityId>, RequestState {
  /** Currently authenticated user */
  user: User | null;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** Pending credentials when 2FA is required */
  pendingLoginCredentials: LoginRequest | null;
  
  /** Timestamp of last successful auth check */
  lastAuthCheck?: number;
}

// ============================================
// INITIAL STATE
// ============================================

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
    return !!(sessionToken || localToken);
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
  user: null,
  isAuthenticated: hasStoredToken(),
  pendingLoginCredentials: null,
  isLoading: false,
  errorMessage: undefined,
  lastAuthCheck: undefined,
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
export const isUserComplete = (user: User | null): user is User => {
  return user !== null && !!user.id && !!user.email;
};

/**
 * Type guard for 2FA pending state
 */
export const is2FAPending = (state: UsersEntityState): boolean => {
  return state.pendingLoginCredentials !== null;
};
