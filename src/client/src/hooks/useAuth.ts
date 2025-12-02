import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import {
  clearError,
  setLoading,
  clearTwoFactorState,
} from '../features/auth/authSlice';
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
import { LoginRequest } from '../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../types/contracts/requests/RegisterRequest';
import { UpdateProfileRequest } from '../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../types/contracts/requests/ChangePasswordRequest';
import { VerifyEmailRequest } from '../types/contracts/requests/VerifyEmailRequest';
import { VerifyTwoFactorCodeRequest } from '../types/contracts/requests/VerifyTwoFactorCodeRequest';
import { DisableTwoFactorRequest } from '../types/contracts/requests/DisableTwoFactorRequest';
import { removeToken } from '../utils/authHelpers';

/**
 * Interface for location state with redirect info
 */
interface LocationState {
  from?: { pathname: string };
}

/**
 * 🚀 ROBUST USEAUTH HOOK
 *
 * ✅ NO useEffects - prevents infinite loops!
 * ✅ Stateless Design - only Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 *
 * CRITICAL: This hook is STATELESS and contains NO useEffects.
 * All data fetching must be initiated from Components!
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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

  // ===== AUTH OPERATIONS =====
  // Note: These are NOT in useMemo because they need fresh location state
  // But they ARE wrapped in useCallback for stable references

  /**
   * Login with credentials and optional redirect
   */
  const login = useCallback(
    (credentials: LoginRequest, redirectPath?: string) => {
      const result = dispatch(loginAction(credentials));

      result.then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          // Get redirect path from location state or use provided path
          const state = location.state as LocationState;
          const from = state?.from?.pathname || redirectPath || '/dashboard';
          navigate(from, { replace: true });
        }
      });

      return result;
    },
    [dispatch, navigate, location.state]
  );

  /**
   * Register new user and redirect
   */
  const register = useCallback(
    (userData: RegisterRequest, redirectPath?: string) => {
      const result = dispatch(registerAction(userData));

      result.then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          const path = redirectPath || '/dashboard';
          navigate(path, { replace: true });
        }
      });

      return result;
    },
    [dispatch, navigate]
  );

  /**
   * Logout and redirect to login page
   */
  const logout = useCallback(() => {
    const result = dispatch(logoutAction());

    result.finally(() => {
      navigate('/auth/login', { replace: true });
    });

    return result;
  }, [dispatch, navigate]);

  // ===== MEMOIZED ACTIONS (no navigation dependency) =====
  const actions = useMemo(
    () => ({
      /**
       * Silent login - attempt to restore session from stored tokens
       */
      silentLogin: () => dispatch(silentLoginAction()),

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
      uploadProfilePicture: (file: File) =>
        dispatch(uploadProfilePictureAction(file)),

      /**
       * Change password
       */
      changePassword: (passwordData: ChangePasswordRequest) =>
        dispatch(changePasswordAction(passwordData)),

      /**
       * Verify email with token
       */
      verifyEmail: (request: VerifyEmailRequest) =>
        dispatch(verifyEmailAction(request)),

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
      getTwoFactorStatus: () => dispatch(getTwoFactorStatus()),

      /**
       * Disable 2FA
       */
      disableTwoFactor: (request: DisableTwoFactorRequest) =>
        dispatch(disableTwoFactor(request)),

      /**
       * Request password reset email
       */
      requestPasswordReset: (email: string) =>
        dispatch(requestPasswordReset(email)),

      /**
       * Reset password with token
       */
      resetPassword: (data: { token: string; password: string }) =>
        dispatch(resetPassword(data)),

      /**
       * Refresh access token
       */
      refreshToken: () => dispatch(refreshToken()),

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

  /**
   * Force logout - clears all tokens and redirects without API call
   */
  const forceLogout = useCallback(() => {
    removeToken();
    dispatch(clearError());
    navigate('/auth/login', { replace: true });
  }, [dispatch, navigate]);

  // ===== COMPUTED VALUES =====
  const computed = useMemo(
    () => ({
      /**
       * Check if user has any of the specified roles
       */
      hasAnyRole: (roles: string[]): boolean => {
        if (!roles?.length || !userRoles?.length) return false;
        return roles.some((role) => userRoles.includes(role));
      },

      /**
       * Check if user has all of the specified roles
       */
      hasAllRoles: (roles: string[]): boolean => {
        if (!roles?.length) return false;
        if (!userRoles?.length) return false;
        return roles.every((role) => userRoles.includes(role));
      },

      /**
       * Check if access token is expired or about to expire
       */
      isTokenExpired: (): boolean => {
        const token =
          localStorage.getItem('access_token') ||
          sessionStorage.getItem('access_token');

        if (!token?.trim()) return true;

        try {
          const parts = token.split('.');
          if (parts.length !== 3) return true;

          const payload = JSON.parse(atob(parts[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          // Token is "expired" if less than 5 minutes remaining
          return !payload.exp || payload.exp - currentTime < 300;
        } catch {
          return true;
        }
      },

      /**
       * Check if 2FA is currently required (pending login)
       */
      is2FARequired: !!pendingLoginCredentials,
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

    // Navigation-dependent actions (stable via useCallback)
    login,
    register,
    logout,
    forceLogout,

    // Other actions (stable via useMemo)
    ...actions,

    // Computed values
    ...computed,
  };
};

export default useAuth;

// ============================================
// TYPE EXPORTS
// ============================================

export type UseAuthReturn = ReturnType<typeof useAuth>;
