import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  requestPasswordReset as requestPasswordResetAction,
  resetPassword as resetPasswordAction,
  generateTwoFactorSecret as generateTwoFactorSecretAction,
  verifyTwoFactorCode as verifyTwoFactorCodeAction,
  clearError,
  updateUser,
  setLoading,
  forceLogout,
} from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { LoginRequest } from '../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../types/contracts/requests/RegisterRequest';
import { UpdateProfileRequest } from '../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../types/contracts/requests/ChangePasswordRequest';
import { VerifyEmailRequest } from '../types/contracts/requests/VerifyEmailRequest';
import { GenerateTwoFactorSecretResponse } from '../types/contracts/responses/GenerateTwoFactorSecretResponse';
import { VerifyTwoFactorCodeRequest } from '../types/contracts/requests/VerifyTwoFactorCodeRequest';
import { VerifyTwoFactorCodeResponse } from '../types/contracts/responses/VerifyTwoFactorCodeResponse';
import { User } from '../types/models/User';
import { UserProfileResponse } from '../types/contracts/responses/UserProfileResponse';

interface LocationState {
  from?: { pathname: string };
}

/**
 * Perfect Authentication Hook with comprehensive functionality
 * Provides all authentication methods with proper error handling,
 * loading states, and navigation
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authState = useAppSelector((state) => state.auth);

  const { user, isAuthenticated, isLoading, error, token, refreshToken } = authState;

  // Memoized user display name
  const userDisplayName = useMemo((): string => {
    if (!user) return 'Benutzer';

    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    if (firstName) return firstName;
    if (lastName) return lastName;

    return user.email || 'Benutzer';
  }, [user]);

  // Memoized token expiration check
  const isTokenExpired = useMemo((): boolean => {
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
  }, [token]);

  // Simple permission checker - just check roles from user object
  // The actual permission checking should be done via PermissionContext
  const permissionChecker = useMemo(() => ({
    hasAnyRole: (roles: string[]): boolean => {
      return roles.some(role => user?.roles?.includes(role)) ?? false;
    },
    hasAllRoles: (roles: string[]): boolean => {
      return roles.every(role => user?.roles?.includes(role)) ?? false;
    },
  }), [user?.roles]);

  // Attempt silent login on mount
// useEffect(() => {
//   const initializeAuth = async () => {
//     // Nur wenn noch nicht authentifiziert und nicht bereits am Laden
//     if (!isAuthenticated && !isLoading && !error) {
//       console.log('Attempting silent login...');
//       dispatch(setLoading(true)); // Loading state setzen
      
//       try {
//         const success = await dispatch(silentLoginAction()).unwrap();
//         console.log('Silent login result:', success);
//       } catch (error) {
//         console.log('Silent login failed:', error);
//         // Fehler nicht weiterwerfen, da es normal ist, wenn kein Token vorhanden
//       } finally {
//         dispatch(setLoading(false));
//       }
//     }
//   };

//   initializeAuth();
// }, [dispatch, isAuthenticated, isLoading, error]);

  /**
   * Enhanced login with comprehensive error handling and navigation
   * @param credentials - Login credentials with optional rememberMe
   * @param redirectPath - Path to navigate after successful login
   * @returns Promise<boolean> - Success status
   */
  const login = useCallback(
    async (credentials: LoginRequest & { rememberMe?: boolean; csrfToken?: string }, redirectPath?: string) => {
      try {
        // Set loading state manually for better UX
        dispatch(setLoading(true));
        
        const result = await dispatch(loginAction(credentials)).unwrap();
        
        if (result) {
          // Get redirect path from location state or use provided/default
          const state = location.state as LocationState;
          const from = state?.from?.pathname || redirectPath || '/dashboard';
          
          // Clear any previous errors
          dispatch(clearError());
          
          // Navigate after successful login
          navigate(from, { replace: true });
          
          return true;
        }
        return false;
      } catch (error) {
        console.error('Login failed:', error);
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, navigate, location]
  );

  /**
   * Enhanced registration with validation and navigation
   * @param userData - Registration data
   * @param redirectPath - Path to navigate after successful registration
   * @returns Promise<boolean> - Success status
   */
    const register = useCallback(
    async (userData: RegisterRequest, redirectPath?: string) => {
      try {
        // Set loading state manually for better UX
        dispatch(setLoading(true));
        
        const result = await dispatch(registerAction(userData)).unwrap();
        
        if (result) {
          // Clear any previous errors
          dispatch(clearError());
          
          // Navigate after successful registration
          const path = redirectPath || '/dashboard';
          navigate(path, { replace: true });
          
          return true;
        }
        return false;
      } catch (error) {
        console.error('Registration failed:', error);
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, navigate]
  );

  /**
   * Enhanced logout with cleanup and navigation
   * @param redirectPath - Path to navigate after logout
   */
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutAction()).unwrap();
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      navigate('/auth/login', { replace: true });
    }
  }, [dispatch, navigate]);

  /**
   * Load user profile data
   * @returns Promise<User | null> - User data or null on failure
   */
  const loadUserProfile = useCallback(async (): Promise<UserProfileResponse | null> => {
    try {
      const resultAction = await dispatch(getProfile()).unwrap();

      if (getProfile.fulfilled.match(resultAction)) {
        return resultAction;
      } else {
        console.error('Profile loading failed:', resultAction);
        return null;
      }
    } catch (error) {
      console.error('Load profile error:', error);
      return null;
    }
  }, [dispatch]);

  /**
   * Update user profile
   * @param profileData - Updated profile data
   * @returns Promise<boolean> - Success status
   */
  const updateProfile = useCallback(
    async (profileData: UpdateProfileRequest): Promise<boolean> => {
      try {
        const resultAction = await dispatch(updateProfileAction(profileData));

        if (updateProfileAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('Profile update failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Update profile error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Upload profile picture
   * @param file - Image file
   * @returns Promise<boolean> - Success status
   */
  const uploadProfilePicture = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        const resultAction = await dispatch(uploadProfilePictureAction(file));

        if (uploadProfilePictureAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('Profile picture upload failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Upload profile picture error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Change user password
   * @param passwordData - Password change data
   * @returns Promise<boolean> - Success status
   */
  const changePassword = useCallback(
    async (passwordData: ChangePasswordRequest): Promise<boolean> => {
      try {
        const resultAction = await dispatch(changePasswordAction(passwordData));

        if (changePasswordAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('Password change failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Change password error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Perform silent login on app initialization
   * @returns Promise<boolean> - Success status
   */
  const performSilentLogin = useCallback(async (): Promise<boolean> => {
    try {
      const resultAction = await dispatch(silentLoginAction());

      if (silentLoginAction.fulfilled.match(resultAction)) {
        return true;
      } else {
        console.info('Silent login failed:', resultAction.payload);
        return false;
      }
    } catch (error) {
      console.error('Silent login error:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Verify email address
   * @param request - { email, verificationToken }
   * @returns Promise<boolean> - Success status
   */
  const verifyEmail = useCallback(
    async (request: VerifyEmailRequest): Promise<boolean> => {
      try {
        const resultAction = await dispatch(verifyEmailAction(request));
        if (verifyEmailAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('Email verification failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Verify email error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Request password reset
   * @param email - User email address
   * @returns Promise<boolean> - Success status
   */
  const requestPasswordReset = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(requestPasswordResetAction(email));

        if (requestPasswordResetAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('Password reset request failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Request password reset error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Reset password using token
   * @param token - Reset token
   * @param password - New password
   * @returns Promise<boolean> - Success status
   */
  const resetPassword = useCallback(
    async (token: string, password: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(
          resetPasswordAction({ token, password })
        );

        if (resetPasswordAction.fulfilled.match(resultAction)) {
          return true;
        } else {
          console.error('Password reset failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Reset password error:', error);
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Clear authentication error
   */
  const dismissError = useCallback((): void => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Update user data locally
   * @param userData - Partial user data to update
   */
  const updateUserData = useCallback(
    (userData: Partial<User>): void => {
      dispatch(updateUser(userData));
    },
    [dispatch]
  );

  /**
   * Set loading state manually
   * @param loading - Loading state
   */
  const setLoadingState = useCallback(
    (loading: boolean): void => {
      dispatch(setLoading(loading));
    },
    [dispatch]
  );

  /**
   * Force logout (emergency cleanup)
   */
  const forceLogoutUser = useCallback((): void => {
    dispatch(forceLogout());
    navigate('/auth/login', { replace: true });
  }, [dispatch, navigate]);


    /**
   * Generate 2FA secret (returns QR code and secret)
   */
  const generateTwoFactorSecret = useCallback(async (): Promise<GenerateTwoFactorSecretResponse | null> => {
    try {
      const resultAction = await dispatch(generateTwoFactorSecretAction());
      if (generateTwoFactorSecretAction.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        console.error('2FA secret generation failed:', resultAction.payload);
        return null;
      }
    } catch (error) {
      console.error('2FA secret generation error:', error);
      return null;
    }
  }, [dispatch]);

  /**
   * Verify 2FA code
   */
  const verifyTwoFactorCode = useCallback(async (request: VerifyTwoFactorCodeRequest): Promise<VerifyTwoFactorCodeResponse | null> => {
    try {
      const resultAction = await dispatch(verifyTwoFactorCodeAction(request));
      if (verifyTwoFactorCodeAction.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        console.error('2FA verification failed:', resultAction.payload);
        return null;
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      return null;
    }
  }, [dispatch]);

  return {
    // Authentication state
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    refreshToken,

    // Core authentication methods
    login,
    register,
    logout,
    performSilentLogin,

    // Profile management
    loadUserProfile,
    updateProfile,
    uploadProfilePicture,

    // Password management
    changePassword,
    requestPasswordReset,
    resetPassword,

    // Email verification
    verifyEmail,
    generateTwoFactorSecret,
    verifyTwoFactorCode,

    // State management
    dismissError,
    updateUserData,
    setLoadingState,
    forceLogoutUser,

    // Utility methods (memoized)
    userDisplayName,
    isTokenExpired,
    ...permissionChecker,
  };
};
