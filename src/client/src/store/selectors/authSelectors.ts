import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { withDefault, isDefined } from '../../utils/safeAccess';

/**
 * Auth Selectors
 * Centralized selectors for authentication state
 */

// Base selectors
export const selectAuthState = (state: RootState) => state.auth;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.errorMessage;
export const selectPendingLoginCredentials = (state: RootState) => state.auth.pendingLoginCredentials;

// Computed selectors
export const selectUserDisplayName = createSelector(
  [selectAuthUser],
  (user): string => {
    if (!isDefined(user)) return 'Benutzer';

    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    if (firstName) return firstName;
    if (lastName) return lastName;

    return withDefault(user.email, 'Benutzer');
  }
);

export const selectUserInitials = createSelector(
  [selectAuthUser],
  (user): string => {
    if (!isDefined(user)) return 'U';

    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();

    return user.email?.[0]?.toUpperCase() || 'U';
  }
);

export const selectUserRoles = createSelector(
  [selectAuthUser],
  (user) => user?.roles || []
);

export const selectHasAnyRole = createSelector(
  [selectUserRoles],
  (userRoles) => (roles: string[]): boolean => {
    return roles.some(role => userRoles.includes(role));
  }
);

export const selectHasAllRoles = createSelector(
  [selectUserRoles],
  (userRoles) => (roles: string[]): boolean => {
    return roles.length > 0 && roles.every(role => userRoles.includes(role));
  }
);

export const selectIsTokenExpired = createSelector(
  [selectIsAuthenticated],
  (): boolean => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    if (!token?.trim()) return true;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp && payload.exp - currentTime < 300; // 5 min buffer
    } catch {
      return true;
    }
  }
);

export const selectIs2FARequired = createSelector(
  [selectPendingLoginCredentials],
  (pendingCredentials) => !!pendingCredentials
);

// User profile completeness
export const selectProfileCompleteness = createSelector(
  [selectAuthUser],
  (user): number => {
    if (!user) return 0;

    const fields = [
      user.firstName,
      user.lastName, 
      user.email,
      user.bio,
      user.profilePictureUrl,
      user.phoneNumber
    ];

    const completedFields = fields.filter(field => !!field?.trim()).length;
    return Math.round((completedFields / fields.length) * 100);
  }
);

export const selectIsProfileComplete = createSelector(
  [selectProfileCompleteness],
  (completeness) => completeness >= 80
);