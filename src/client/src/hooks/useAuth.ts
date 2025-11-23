import { useMemo } from 'react';
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
  selectIsProfileComplete
} from '../store/selectors/authSelectors';
import { LoginRequest } from '../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../types/contracts/requests/RegisterRequest';
import { UpdateProfileRequest } from '../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../types/contracts/requests/ChangePasswordRequest';
import { VerifyEmailRequest } from '../types/contracts/requests/VerifyEmailRequest';
import { VerifyTwoFactorCodeRequest } from '../types/contracts/requests/VerifyTwoFactorCodeRequest';
import { DisableTwoFactorRequest } from '../types/contracts/requests/DisableTwoFactorRequest';

interface LocationState {
  from?: { pathname: string };
}

/**
 * 🚀 ROBUSTE USEAUTH HOOK 
 * 
 * ✅ KEINE useEffects - prevents infinite loops!
 * ✅ Stateless Design - nur Redux State + Actions
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
  const pendingLoginCredentials = useAppSelector(state => state.auth.pendingLoginCredentials);

  // ===== MEMOIZED ACTIONS =====
  const actions = useMemo(() => ({
    
    // === AUTH OPERATIONS ===
    login: (credentials: LoginRequest, redirectPath?: string) => {
      const result = dispatch(loginAction(credentials));

      result.then((action: { meta: { requestStatus: string } }) => {
        if (action.meta.requestStatus === 'fulfilled') {
          const state = location.state as LocationState;
          const from = state?.from?.pathname || redirectPath || '/dashboard';
          navigate(from, { replace: true });
        }
      });

      return result;
    },

    register: (userData: RegisterRequest, redirectPath?: string) => {
      const result = dispatch(registerAction(userData));

      result.then((action: { meta: { requestStatus: string } }) => {
        if (action.meta.requestStatus === 'fulfilled') {
          const path = redirectPath || '/dashboard';
          navigate(path, { replace: true });
        }
      });

      return result;
    },

    logout: () => {
      const result = dispatch(logoutAction());
      
      result.finally(() => {
        navigate('/auth/login', { replace: true });
      });
      
      return result;
    },

    silentLogin: () => {
      return dispatch(silentLoginAction());
    },

    // === PROFILE OPERATIONS ===
    loadProfile: () => {
      return dispatch(getProfile());
    },

    updateProfile: (profileData: UpdateProfileRequest) => {
      return dispatch(updateProfileAction(profileData));
    },

    uploadProfilePicture: (file: File) => {
      return dispatch(uploadProfilePictureAction(file));
    },

    // === PASSWORD & SECURITY ===
    changePassword: (passwordData: ChangePasswordRequest) => {
      return dispatch(changePasswordAction(passwordData));
    },

    verifyEmail: (request: VerifyEmailRequest) => {
      return dispatch(verifyEmailAction(request));
    },

    // === TWO FACTOR AUTH ===
    generateTwoFactorSecret: () => {
      return dispatch(generateTwoFactorSecretAction());
    },

    verifyTwoFactorCode: (request: VerifyTwoFactorCodeRequest) => {
      return dispatch(verifyTwoFactorCodeAction(request));
    },

    getTwoFactorStatus: () => {
      return dispatch(getTwoFactorStatus());
    },

    disableTwoFactor: (request: DisableTwoFactorRequest) => {
      return dispatch(disableTwoFactor(request));
    },

    // === PASSWORD RESET ===
    requestPasswordReset: (email: string) => {
      return dispatch(requestPasswordReset(email));
    },

    resetPassword: (data: { token: string; password: string }) => {
      return dispatch(resetPassword(data));
    },

    // === TOKEN OPERATIONS ===
    refreshToken: () => {
      return dispatch(refreshToken());
    },

    // === UTILITY OPERATIONS ===
    clearError: () => {
      dispatch(clearError());
    },

    dismissError: () => {
      dispatch(clearError());
    },

    setLoading: (loading: boolean) => {
      dispatch(setLoading(loading));
    },

    clearTwoFactorState: () => {
      dispatch(clearTwoFactorState());
    },

    forceLogout: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      dispatch(clearError());
      navigate('/auth/login', { replace: true });
    },

  }), [dispatch, navigate, location]);

  // ===== COMPUTED VALUES (memoized) =====
  const computed = useMemo(() => ({
    
    // Permission helpers
    hasAnyRole: (roles: string[]): boolean => {
      return roles?.some(role => userRoles?.includes(role)) || false;
    },

    hasAllRoles: (roles: string[]): boolean => {
      return roles.length > 0 && roles.every(role => userRoles?.includes(role)) || false;
    },

    // Token validation
    isTokenExpired: (): boolean => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      if (!token?.trim()) return true;

      try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        return payload.exp && payload.exp - currentTime < 300;
      } catch {
        return true;
      }
    },

  }), [userRoles]);

  // ===== RETURN OBJECT =====
  return {
    // === STATE ===
    user,
    isAuthenticated,
    isLoading,
    errorMessage,
    userDisplayName,
    userInitials,
    userRoles,
    isProfileComplete,
    pendingLoginCredentials,

    // === ACTIONS ===
    ...actions,

    // === COMPUTED ===
    ...computed,
  };
};

export default useAuth;