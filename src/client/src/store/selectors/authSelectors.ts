import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { isDefined } from '../../utils/safeAccess';
import type { LoginRequest } from '../../types/contracts/requests/LoginRequest';

// ============================================
// BASE SELECTORS
// ============================================

/**
 * Select entire auth state
 */
export const selectAuthState = (state: RootState): RootState['auth'] => state.auth;

/**
 * Select current authenticated user
 */
export const selectAuthUser = (state: RootState): RootState['auth']['user'] => state.auth.user;

/**
 * Select authentication status
 */
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.isAuthenticated;

/**
 * Select loading state
 */
export const selectAuthLoading = (state: RootState): boolean => state.auth.isLoading;

/**
 * Select error message
 */
export const selectAuthError = (state: RootState): string | undefined => state.auth.errorMessage;

/**
 * Select pending 2FA credentials
 */
export const selectPendingLoginCredentials = (state: RootState): LoginRequest | undefined =>
  state.auth.pendingLoginCredentials;

// ============================================
// COMPUTED SELECTORS - USER INFO
// ============================================

/**
 * Select user's display name with fallbacks
 */
export const selectUserDisplayName = createSelector([selectAuthUser], (user): string => {
  if (!isDefined(user)) return 'Benutzer';

  const firstName = user.firstName.trim();
  const lastName = user.lastName.trim();

  return `${firstName} ${lastName}`;
});

/**
 * Select user's initials for avatars
 */
export const selectUserInitials = createSelector([selectAuthUser], (user): string => {
  if (!isDefined(user)) return 'U';

  const firstName = user.firstName.trim();
  const lastName = user.lastName.trim();

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) return firstName[0].toUpperCase();
  if (lastName) return lastName[0].toUpperCase();

  return user.email[0].toUpperCase() || 'U';
});

/**
 * Select user's email
 */
export const selectUserEmail = createSelector(
  [selectAuthUser],
  (user): string | undefined => user?.email
);

/**
 * Select user's ID
 */
export const selectUserId = createSelector(
  [selectAuthUser],
  (user): string | undefined => user?.id
);

// ============================================
// COMPUTED SELECTORS - ROLES & PERMISSIONS
// ============================================

/**
 * Select user's roles
 */
export const selectUserRoles = createSelector(
  [selectAuthUser],
  (user): string[] => user?.roles ?? []
);

/**
 * Create selector to check if user has any of the specified roles
 *
 * @example
 * const hasAdminOrMod = useAppSelector(state => selectHasAnyRole(state, ['admin', 'moderator']));
 */
export const selectHasAnyRole = createSelector(
  [selectUserRoles, (_state: RootState, roles: string[]) => roles],
  (userRoles, roles): boolean => {
    if (!roles.length || !userRoles.length) return false;
    const normalizedUserRoles = userRoles.map((r) => r.toLowerCase());
    return roles.some((role) => normalizedUserRoles.includes(role.toLowerCase()));
  }
);

/**
 * Create selector to check if user has all of the specified roles
 *
 * @example
 * const isAdminAndVerified = useAppSelector(state => selectHasAllRoles(state, ['admin', 'verified']));
 */
export const selectHasAllRoles = createSelector(
  [selectUserRoles, (_state: RootState, roles: string[]) => roles],
  (userRoles, roles): boolean => {
    if (!roles.length) return false;
    if (!userRoles.length) return false;
    const normalizedUserRoles = userRoles.map((r) => r.toLowerCase());
    return roles.every((role) => normalizedUserRoles.includes(role.toLowerCase()));
  }
);

/**
 * Check if user is admin
 */
export const selectIsAdmin = createSelector([selectUserRoles], (roles): boolean =>
  roles.some((role) => role.toLowerCase() === 'admin')
);

// ============================================
// COMPUTED SELECTORS - 2FA
// ============================================

/**
 * Check if 2FA is required (credentials pending)
 */
export const selectIs2FARequired = createSelector(
  [selectPendingLoginCredentials],
  (pendingCredentials): boolean => !!pendingCredentials
);

/**
 * Check if user has 2FA enabled
 */
export const selectIs2FAEnabled = createSelector(
  [selectAuthUser],
  (user): boolean => user?.twoFactorEnabled ?? false
);

// ============================================
// COMPUTED SELECTORS - TOKEN STATUS
// ============================================

/**
 * Check if access token is expired or about to expire
 *
 * Note: This reads from localStorage/sessionStorage because
 * the token itself is not stored in Redux state for security
 */
export const selectIsTokenExpired = createSelector(
  [selectIsAuthenticated],
  (isAuthenticated): boolean => {
    // If not authenticated, token is effectively "expired"
    if (!isAuthenticated) return true;

    // SSR safety
    if (typeof window === 'undefined') return true;

    try {
      const token = sessionStorage.getItem('access_token') ?? localStorage.getItem('access_token');

      if (!token?.trim()) return true;

      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1])) as { exp?: number };
      const currentTime = Math.floor(Date.now() / 1000);

      // Consider expired if less than 5 minutes remaining
      return payload.exp === undefined || payload.exp - currentTime < 300;
    } catch {
      return true;
    }
  }
);

/**
 * Get time until token expires in milliseconds
 * Returns null if token is invalid or already expired
 */
export const selectTokenExpiresIn = createSelector(
  [selectIsAuthenticated],
  (isAuthenticated): number | null => {
    if (!isAuthenticated) return null;

    // SSR safety
    if (typeof window === 'undefined') return null;

    try {
      const token = sessionStorage.getItem('access_token') ?? localStorage.getItem('access_token');

      if (!token?.trim()) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1])) as { exp?: number };
      if (payload.exp === undefined) return null;

      const expiresAt = payload.exp * 1000; // Convert to ms
      const remaining = expiresAt - Date.now();

      return remaining > 0 ? remaining : null;
    } catch {
      return null;
    }
  }
);

// ============================================
// COMPUTED SELECTORS - PROFILE COMPLETENESS
// ============================================

/**
 * Calculate profile completeness percentage
 */
export const selectProfileCompleteness = createSelector([selectAuthUser], (user): number => {
  if (!user) return 0;

  const fields = [
    user.firstName,
    user.lastName,
    user.email,
    user.bio,
    user.profilePictureUrl,
    user.phoneNumber,
  ];

  const completedFields = fields.filter((field) => !!field?.trim()).length;
  return Math.round((completedFields / fields.length) * 100);
});

/**
 * Check if profile is considered complete (>= 80%)
 */
export const selectIsProfileComplete = createSelector(
  [selectProfileCompleteness],
  (completeness): boolean => completeness >= 80
);

/**
 * Get list of missing profile fields
 */
export const selectMissingProfileFields = createSelector([selectAuthUser], (user): string[] => {
  if (!user) return [];

  const fieldMap: Record<string, string | undefined> = {
    Vorname: user.firstName,
    Nachname: user.lastName,
    'E-Mail': user.email,
    Biografie: user.bio,
    Profilbild: user.profilePictureUrl,
    Telefonnummer: user.phoneNumber,
  };

  return Object.entries(fieldMap)
    .filter(([_, value]) => !value?.trim())
    .map(([key]) => key);
});

// ============================================
// COMPUTED SELECTORS - EMAIL VERIFICATION
// ============================================

/**
 * Check if user's email is verified
 */
export const selectIsEmailVerified = createSelector(
  [selectAuthUser],
  (user): boolean => user?.emailVerified ?? false
);

/**
 * Check if email verification is needed
 */
export const selectNeedsEmailVerification = createSelector(
  [selectAuthUser, selectIsAuthenticated],
  (user, isAuthenticated): boolean => isAuthenticated && user !== undefined && !user.emailVerified
);

// ============================================
// COMBINED SELECTORS
// ============================================

/**
 * Select auth summary for debugging/logging
 */
export const selectAuthSummary = createSelector(
  [
    selectIsAuthenticated,
    selectUserId,
    selectUserEmail,
    selectUserRoles,
    selectIs2FAEnabled,
    selectIsEmailVerified,
  ],
  (isAuthenticated, userId, email, roles, is2FAEnabled, isEmailVerified) => ({
    isAuthenticated,
    userId,
    email,
    roles,
    is2FAEnabled,
    isEmailVerified,
  })
);
