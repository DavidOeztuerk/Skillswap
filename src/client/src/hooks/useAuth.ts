import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  login as loginAction,
  register as registerAction,
  logout as logoutAction,
  getProfile,
  updateProfile as updateProfileAction,
  uploadProfilePicture as uploadProfilePictureAction,
  changePassword as changePasswordAction,
  silentLogin as silentLoginAction,
  verifyEmail as verifyEmailAction,
  generateTwoFactorSecret as generateTwoFactorSecretAction,
  verifyTwoFactorCode as verifyTwoFactorCodeAction,
  getTwoFactorStatus,
  disableTwoFactor,
  requestPasswordReset,
  resetPassword,
  refreshToken,
} from '../features/auth/authThunks';
import { clearError, setLoading, clearTwoFactorState } from '../features/auth/authSlice';
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectUserDisplayName,
  selectUserInitials,
  selectUserRoles,
  selectIsProfileComplete,
  selectPendingLoginCredentials,
} from '../store/selectors/authSelectors';
import type { LoginRequest } from '../types/contracts/requests/LoginRequest';
import type { RegisterRequest } from '../types/contracts/requests/RegisterRequest';
import type { UpdateProfileRequest } from '../types/contracts/requests/UpdateProfileRequest';
import type { ChangePasswordRequest } from '../types/contracts/requests/ChangePasswordRequest';
import type { VerifyEmailRequest } from '../types/contracts/requests/VerifyEmailRequest';
import type { VerifyTwoFactorCodeRequest } from '../types/contracts/requests/VerifyTwoFactorCodeRequest';
import type { DisableTwoFactorRequest } from '../types/contracts/requests/DisableTwoFactorRequest';
import { removeToken } from '../utils/authHelpers';

/**
 * 🚀 ROBUST USEAUTH HOOK
 *
 * ✅ NO useEffects - prevents infinite loops!
 * ✅ Stateless Design - only Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 * ✅ NO Navigation - Components handle navigation after actions
 *
 * CRITICAL: This hook is STATELESS and contains NO useEffects.
 * All data fetching must be initiated from Components!
 * Navigation should be handled by Components based on action results.
 */
export const useAuth = (): {
  // State
  user: ReturnType<typeof selectAuthUser>;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | undefined;
  userDisplayName: string;
  userInitials: string;
  userRoles: string[];
  isProfileComplete: boolean;
  pendingLoginCredentials: ReturnType<typeof selectPendingLoginCredentials>;
  // Auth Operations
  login: (credentials: LoginRequest) => void;
  register: (userData: RegisterRequest) => void;
  logout: () => void;
  forceLogout: () => void;
  silentLogin: () => void;
  // Profile Operations
  loadProfile: () => void;
  updateProfile: (profileData: UpdateProfileRequest) => void;
  uploadProfilePicture: (file: File) => void;
  changePassword: (passwordData: ChangePasswordRequest) => void;
  // Email & 2FA Operations
  verifyEmail: (request: VerifyEmailRequest) => void;
  generateTwoFactorSecret: () => void;
  verifyTwoFactorCode: (request: VerifyTwoFactorCodeRequest) => void;
  getTwoFactorStatus: () => void;
  disableTwoFactor: (request: DisableTwoFactorRequest) => void;
  // Password Reset
  requestPasswordReset: (email: string) => void;
  resetPassword: (data: { token: string; password: string }) => void;
  // Token Operations
  refreshToken: () => void;
  // State Management
  clearError: () => void;
  dismissError: () => void;
  setLoading: (loading: boolean) => void;
  clearTwoFactorState: () => void;
  // Computed Helpers
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isTokenExpired: () => boolean;
  is2FARequired: boolean;
} => {
  const dispatch = useAppDispatch();

  // ===== SELECTORS =====
  const user = useAppSelector(selectAuthUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const errorMessage = useAppSelector(selectAuthError);
  const userDisplayName = useAppSelector(selectUserDisplayName);
  const userInitials = useAppSelector(selectUserInitials);
  const userRoles = useAppSelector(selectUserRoles);
  const isProfileComplete = useAppSelector(selectIsProfileComplete);
  const pendingLoginCredentials = useAppSelector(selectPendingLoginCredentials);

  // ===== MEMOIZED ACTIONS =====
  const actions = useMemo(
    () => ({
      // ===== AUTH OPERATIONS =====

      /**
       * Login with credentials
       * Note: Navigation should be handled by the calling component
       */
      login: (credentials: LoginRequest) => dispatch(loginAction(credentials)),

      /**
       * Register new user
       * Note: Navigation should be handled by the calling component
       */
      register: async (userData: RegisterRequest) => await dispatch(registerAction(userData)),

      /**
       * Logout current user
       * Note: Navigation should be handled by the calling component
       */
      logout: () => dispatch(logoutAction()),

      /**
       * Force logout - clears all tokens without API call
       * Use when token is invalid or for immediate logout
       * Note: Triggers logout thunk which clears Redux state
       */
      forceLogout: () => {
        removeToken();
        dispatch(clearError());
        // Dispatch logout to clear Redux state (will fail API call but clears state)
        void dispatch(logoutAction());
      },

      /**
       * Silent login - attempt to restore session from stored tokens
       */
      silentLogin: () => dispatch(silentLoginAction()),

      // ===== PROFILE OPERATIONS =====

      /**
       * Load current user profile
       */
      loadProfile: () => dispatch(getProfile()),

      /**
       * Update user profile
       */
      updateProfile: (profileData: UpdateProfileRequest) =>
        dispatch(updateProfileAction(profileData)),

      /**
       * Upload profile picture
       */
      uploadProfilePicture: (file: File) => dispatch(uploadProfilePictureAction(file)),

      /**
       * Change password
       */
      changePassword: (passwordData: ChangePasswordRequest) =>
        dispatch(changePasswordAction(passwordData)),

      // ===== EMAIL & 2FA OPERATIONS =====

      /**
       * Verify email with token
       */
      verifyEmail: (request: VerifyEmailRequest) => dispatch(verifyEmailAction(request)),

      /**
       * Generate 2FA secret for setup
       */
      generateTwoFactorSecret: () => dispatch(generateTwoFactorSecretAction()),

      /**
       * Verify 2FA code during setup or login
       */
      verifyTwoFactorCode: (request: VerifyTwoFactorCodeRequest) =>
        dispatch(verifyTwoFactorCodeAction(request)),

      /**
       * Get current 2FA status
       */
      getTwoFactorStatus: async () => await dispatch(getTwoFactorStatus()),

      /**
       * Disable 2FA
       */
      disableTwoFactor: (request: DisableTwoFactorRequest) => dispatch(disableTwoFactor(request)),

      // ===== PASSWORD RESET =====

      /**
       * Request password reset email
       */
      requestPasswordReset: (email: string) => dispatch(requestPasswordReset(email)),

      /**
       * Reset password with token
       */
      resetPassword: (data: { token: string; password: string }) => dispatch(resetPassword(data)),

      // ===== TOKEN OPERATIONS =====

      /**
       * Refresh access token
       */
      refreshToken: () => dispatch(refreshToken()),

      // ===== STATE MANAGEMENT =====

      /**
       * Clear error message
       */
      clearError: () => dispatch(clearError()),

      /**
       * Alias for clearError
       */
      dismissError: () => dispatch(clearError()),

      /**
       * Set loading state manually
       */
      setLoading: (loading: boolean) => dispatch(setLoading(loading)),

      /**
       * Clear pending 2FA credentials
       */
      clearTwoFactorState: () => dispatch(clearTwoFactorState()),
    }),
    [dispatch]
  );

  // ===== COMPUTED VALUES =====
  const computed = useMemo(
    () => ({
      /**
       * Check if user has any of the specified roles
       */
      hasAnyRole: (roles: string[]): boolean => {
        if (roles.length === 0 || userRoles.length === 0) return false;
        return roles.some((role) => userRoles.includes(role));
      },

      /**
       * Check if user has all of the specified roles
       */
      hasAllRoles: (roles: string[]): boolean => {
        if (roles.length === 0) return false;
        if (userRoles.length === 0) return false;
        return roles.every((role) => userRoles.includes(role));
      },

      /**
       * Check if access token is expired or about to expire
       */
      isTokenExpired: (): boolean => {
        const token =
          localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');

        if (token === null || token.trim() === '') return true;

        try {
          const parts = token.split('.');
          if (parts.length !== 3) return true;

          const payload = JSON.parse(atob(parts[1])) as { exp?: number };
          const currentTime = Math.floor(Date.now() / 1000);

          // Token is "expired" if less than 5 minutes remaining
          return payload.exp === undefined || payload.exp - currentTime < 300;
        } catch {
          return true;
        }
      },

      /**
       * Check if 2FA is currently required (pending login)
       */
      is2FARequired: pendingLoginCredentials !== undefined,
    }),
    [userRoles, pendingLoginCredentials]
  );

  // ===== RETURN OBJECT =====
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    errorMessage,
    userDisplayName,
    userInitials,
    userRoles,
    isProfileComplete,
    pendingLoginCredentials,

    // Actions (stable via useMemo)
    ...actions,

    // Computed values
    ...computed,
  };
};

export default useAuth;
