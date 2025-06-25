// src/hooks/useAuth.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { User } from '../types/models/User';

// Extended login interface
interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
}

/**
 * Perfect Authentication Hook with comprehensive functionality
 * Provides all authentication methods with proper error handling,
 * loading states, and navigation
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading, error, token, refreshToken } =
    useAppSelector((state) => state.auth);

  /**
   * Enhanced login with comprehensive error handling and navigation
   * @param credentials - Login credentials with optional rememberMe
   * @param redirectPath - Path to navigate after successful login
   * @returns Promise<boolean> - Success status
   */
  const login = useCallback(
    async (
      credentials: ExtendedLoginRequest,
      redirectPath = '/dashboard'
    ): Promise<boolean> => {
      try {
        const resultAction = await dispatch(loginAction(credentials));

        if (loginAction.fulfilled.match(resultAction)) {
          navigate(redirectPath, { replace: true });
          return true;
        } else {
          console.error('Login failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    [dispatch, navigate]
  );

  /**
   * Enhanced registration with validation and navigation
   * @param userData - Registration data
   * @param redirectPath - Path to navigate after successful registration
   * @returns Promise<boolean> - Success status
   */
  const register = useCallback(
    async (
      userData: RegisterRequest,
      redirectPath = '/dashboard'
    ): Promise<boolean> => {
      try {
        const resultAction = await dispatch(registerAction(userData));

        if (registerAction.fulfilled.match(resultAction)) {
          navigate(redirectPath, { replace: true });
          return true;
        } else {
          console.error('Registration failed:', resultAction.payload);
          return false;
        }
      } catch (error) {
        console.error('Registration error:', error);
        return false;
      }
    },
    [dispatch, navigate]
  );

  /**
   * Enhanced logout with cleanup and navigation
   * @param redirectPath - Path to navigate after logout
   */
  const logout = useCallback(
    async (redirectPath = '/login'): Promise<void> => {
      try {
        await dispatch(logoutAction());
        navigate(redirectPath, { replace: true });
      } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API call fails
        dispatch(forceLogout());
        navigate(redirectPath, { replace: true });
      }
    },
    [dispatch, navigate]
  );

  /**
   * Load user profile data
   * @returns Promise<User | null> - User data or null on failure
   */
  const loadUserProfile = useCallback(async (): Promise<User | null> => {
    try {
      const resultAction = await dispatch(getProfile());

      if (getProfile.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        console.error('Profile loading failed:', resultAction.payload);
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
   * @param token - Email verification token
   * @returns Promise<boolean> - Success status
   */
  const verifyEmail = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        const resultAction = await dispatch(verifyEmailAction(token));

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
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  /**
   * Check if user has specific permissions/roles
   * @param requiredRole - Required role or permission
   * @returns boolean - Whether user has permission
   */
  const hasPermission = useCallback(
    (requiredRole: string): boolean => {
      // Implement role/permission checking logic based on your auth system
      // This is a placeholder implementation
      console.log(`Checking permission for role: ${requiredRole}`);
      
      return user?.token ? true : false;
    },
    [user]
  );

  /**
   * Get user display name
   * @returns string - Formatted user name
   */
  const getUserDisplayName = useCallback((): string => {
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

  /**
   * Check if token is likely expired (client-side check)
   * @returns boolean - Whether token might be expired
   */
  const isTokenLikelyExpired = useCallback((): boolean => {
    if (!token) return true;

    try {
      // Basic JWT token structure check
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token expires within next 5 minutes
      return payload.exp && payload.exp - currentTime < 300;
    } catch {
      return true;
    }
  }, [token]);

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

    // State management
    dismissError,
    updateUserData,
    setLoadingState,
    forceLogoutUser,

    // Utility methods
    hasPermission,
    getUserDisplayName,
    isTokenLikelyExpired,
  };
};
