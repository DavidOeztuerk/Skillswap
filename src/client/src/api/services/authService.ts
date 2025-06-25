// src/api/services/authService.ts
import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from '../../config/endpoints';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import {
  RegisterResponse,
  LoginResponse,
} from '../../types/contracts/responses/AuthResponse';
import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
import { User } from '../../types/models/User';
import { UpdateProfileRequest } from '../../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../../types/contracts/requests/ChangePasswordRequest';
import {
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
  removeToken,
} from '../../utils/authHelpers';
import apiClient from '../apiClient';

// Extended Login Request with rememberMe option
interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
}

// Token Refresh Response Interface
interface TokenRefreshApiResponse {
  token: string;
  refreshToken: string;
}

/**
 * Perfect Authentication Service with comprehensive error handling,
 * token management, and type safety
 */
const authService = {
  /**
   * Performs user login with enhanced token management
   * @param credentials - Login credentials with optional rememberMe flag
   * @returns Authentication response with user data and tokens
   */
  login: async (credentials: ExtendedLoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        {
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        }
      );

      const loginData = response.data;

      // Validate response structure
      if (!loginData.tokens?.accessToken) {
        throw new Error('Invalid login response: missing access token');
      }

      // Store tokens with appropriate storage strategy
      const useSessionStorage = !credentials.rememberMe;

      setToken(loginData.tokens.accessToken, useSessionStorage);

      if (loginData.tokens.refreshToken) {
        setRefreshToken(loginData.tokens.refreshToken, useSessionStorage);
      }

      return loginData;
    } catch (error) {
      console.error('Login failed:', error);

      // Enhanced error handling with specific messages
      if (error instanceof Error) {
        if (
          error.message.includes('401') ||
          error.message.includes('Unauthorized')
        ) {
          throw new Error(
            'Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort.'
          );
        }
        if (
          error.message.includes('429') ||
          error.message.includes('Too Many Requests')
        ) {
          throw new Error(
            'Zu viele Anmeldeversuche. Bitte warte einen Moment.'
          );
        }
        if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          throw new Error(
            'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.'
          );
        }
      }

      throw new Error('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    }
  },

  /**
   * Registers a new user with comprehensive validation
   * @param userData - Registration data
   * @returns Registration response with user data and tokens
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      // Client-side validation
      if (!userData.email?.trim()) {
        throw new Error('E-Mail-Adresse ist erforderlich');
      }
      if (!userData.password?.trim()) {
        throw new Error('Passwort ist erforderlich');
      }
      if (!userData.firstName?.trim()) {
        throw new Error('Vorname ist erforderlich');
      }
      if (!userData.lastName?.trim()) {
        throw new Error('Nachname ist erforderlich');
      }

      const response = await apiClient.post<RegisterResponse>(
        AUTH_ENDPOINTS.REGISTER,
        {
          ...userData,
          email: userData.email.trim().toLowerCase(),
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          username: userData.username?.trim(),
        }
      );

      const registerData = response.data;

      // Store tokens immediately after successful registration
      if (registerData.tokens?.accessToken) {
        setToken(registerData.tokens.accessToken);
      }

      if (registerData.tokens?.refreshToken) {
        setRefreshToken(registerData.tokens.refreshToken);
      }

      return registerData;
    } catch (error) {
      console.error('Registration failed:', error);

      // Enhanced error handling for registration
      if (error instanceof Error) {
        if (
          error.message.includes('409') ||
          error.message.includes('Conflict')
        ) {
          throw new Error(
            'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.'
          );
        }
        if (
          error.message.includes('400') ||
          error.message.includes('Bad Request')
        ) {
          throw new Error(
            'Ungültige Eingabedaten. Bitte überprüfe deine Angaben.'
          );
        }
        if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          throw new Error(
            'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.'
          );
        }
      }

      throw new Error(
        'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
      );
    }
  },

  /**
   * Refreshes access token using refresh token
   * @returns New tokens or null if refresh fails
   */
  refreshToken: async (): Promise<TokenRefreshApiResponse | null> => {
    const currentToken = getToken();
    const currentRefreshToken = getRefreshToken();

    // Validate tokens exist
    if (!currentToken || !currentRefreshToken) {
      console.warn('No tokens available for refresh');
      return null;
    }

    try {
      const response = await apiClient.post<TokenRefreshApiResponse>(
        AUTH_ENDPOINTS.REFRESH_TOKEN,
        {
          token: currentToken,
          refreshToken: currentRefreshToken,
        }
      );

      const tokenData = response.data;

      // Validate refresh response
      if (!tokenData.token || !tokenData.refreshToken) {
        throw new Error('Invalid refresh response: missing tokens');
      }

      // Update stored tokens
      setToken(tokenData.token);
      setRefreshToken(tokenData.refreshToken);

      return tokenData;
    } catch (error) {
      console.error('Token refresh failed:', error);

      // Clean up invalid tokens
      await authService.logout();
      return null;
    }
  },

  /**
   * Fetches current user profile
   * @returns User profile data
   */
  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>(AUTH_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);

      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Sitzung abgelaufen. Bitte melde dich erneut an.');
      }

      throw new Error('Profil konnte nicht geladen werden.');
    }
  },

  /**
   * Updates user profile
   * @param profileData - Updated profile data
   * @returns Updated user profile
   */
  updateProfile: async (profileData: UpdateProfileRequest): Promise<User> => {
    try {
      // Client-side validation
      const cleanedData = {
        ...profileData,
        firstName: profileData.firstName?.trim(),
        lastName: profileData.lastName?.trim(),
        bio: profileData.bio?.trim(),
      };

      const response = await apiClient.post<User>(
        PROFILE_ENDPOINTS.UPDATE,
        cleanedData
      );
      return response.data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error('Profil konnte nicht aktualisiert werden.');
    }
  },

  /**
   * Uploads user profile picture
   * @param file - Profile picture file
   * @returns Updated user profile
   */
  uploadProfilePicture: async (file: File): Promise<User> => {
    try {
      // Validate file
      if (!file) {
        throw new Error('Keine Datei ausgewählt');
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Nur JPEG, PNG und WebP Dateien sind erlaubt');
      }

      // Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Datei ist zu groß. Maximum 5MB erlaubt.');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.uploadFile<User>(
        PROFILE_ENDPOINTS.UPLOAD_AVATAR,
        formData
      );
      return response.data;
    } catch (error) {
      console.error('Profile picture upload failed:', error);

      if (error instanceof Error) {
        throw error; // Re-throw validation errors
      }

      throw new Error('Profilbild konnte nicht hochgeladen werden.');
    }
  },

  /**
   * Changes user password with validation
   * @param passwordData - Password change data
   */
  changePassword: async (
    passwordData: ChangePasswordRequest
  ): Promise<void> => {
    try {
      // Client-side validation
      if (!passwordData.currentPassword?.trim()) {
        throw new Error('Aktuelles Passwort ist erforderlich');
      }
      if (!passwordData.newPassword?.trim()) {
        throw new Error('Neues Passwort ist erforderlich');
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        throw new Error('Neue Passwörter stimmen nicht überein');
      }
      if (passwordData.newPassword.length < 8) {
        throw new Error('Neues Passwort muss mindestens 8 Zeichen lang sein');
      }

      await apiClient.post<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
    } catch (error) {
      console.error('Password change failed:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('401') ||
          error.message.includes('current password')
        ) {
          throw new Error('Aktuelles Passwort ist incorrect');
        }
        if (
          error.message.includes('validation') ||
          error.message.includes('8 Zeichen')
        ) {
          throw error; // Re-throw validation errors
        }
      }

      throw new Error('Passwort konnte nicht geändert werden.');
    }
  },

  /**
   * Requests password reset
   * @param email - User email address
   */
  forgotPassword: async (email: string): Promise<void> => {
    try {
      if (!email?.trim()) {
        throw new Error('E-Mail-Adresse ist erforderlich');
      }

      await apiClient.post<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
        email: email.trim().toLowerCase(),
      });
    } catch (error) {
      console.error('Forgot password request failed:', error);

      if (
        error instanceof Error &&
        error.message.includes('E-Mail-Adresse ist erforderlich')
      ) {
        throw error;
      }

      throw new Error('Passwort-Reset-Anfrage fehlgeschlagen.');
    }
  },

  /**
   * Resets password using reset token
   * @param token - Reset token
   * @param password - New password
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      if (!token?.trim()) {
        throw new Error('Reset-Token ist erforderlich');
      }
      if (!password?.trim()) {
        throw new Error('Neues Passwort ist erforderlich');
      }
      if (password.length < 8) {
        throw new Error('Passwort muss mindestens 8 Zeichen lang sein');
      }

      await apiClient.post<void>(AUTH_ENDPOINTS.RESET_PASSWORD, {
        token: token.trim(),
        password,
      });
    } catch (error) {
      console.error('Password reset failed:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('Token') ||
          error.message.includes('Passwort')
        ) {
          throw error; // Re-throw validation errors
        }
        if (
          error.message.includes('expired') ||
          error.message.includes('invalid')
        ) {
          throw new Error('Reset-Token ist ungültig oder abgelaufen');
        }
      }

      throw new Error('Passwort konnte nicht zurückgesetzt werden.');
    }
  },

  /**
   * Checks if user is authenticated
   * @returns true if user has valid token
   */
  isAuthenticated: (): boolean => {
    const token = getToken();
    return !!token;
  },

  /**
   * Validates current token by making authenticated request
   * @returns true if token is valid
   */
  validateToken: async (): Promise<boolean> => {
    try {
      await apiClient.get<User>(AUTH_ENDPOINTS.PROFILE);
      return true;
    } catch (error) {
      console.warn('Token validation failed:', error);
      return false;
    }
  },

  /**
   * Performs logout with cleanup
   */
  logout: async (): Promise<void> => {
    try {
      // Clear cache and stored data
      apiClient.clearCache();
      removeToken();

      // Could make logout API call here if backend supports it
      // await apiClient.post('/api/auth/logout');

      return Promise.resolve();
    } catch (error) {
      console.error('Logout error:', error);

      // Ensure cleanup happens even if API call fails
      apiClient.clearCache();
      removeToken();
      return Promise.resolve();
    }
  },

  /**
   * Performs silent login using stored tokens
   * @returns User data if successful, null if failed
   */
  silentLogin: async (): Promise<User | null> => {
    try {
      const token = getToken();
      if (!token) {
        return null;
      }

      // Try to get profile with current token
      try {
        const user = await authService.getProfile();
        return user;
      } catch {
        // If profile fetch fails, try token refresh
        console.info('Profile fetch failed, attempting token refresh...');

        const refreshResult = await authService.refreshToken();
        if (refreshResult) {
          try {
            const user = await authService.getProfile();
            return user;
          } catch (secondProfileError) {
            console.error(
              'Profile fetch failed after token refresh:',
              secondProfileError
            );
            return null;
          }
        }
        return null;
      }
    } catch (error) {
      console.error('Silent login failed:', error);
      return null;
    }
  },

  /**
   * Verifies email address
   * @param token - Email verification token
   */
  verifyEmail: async (token: string): Promise<void> => {
    try {
      if (!token?.trim()) {
        throw new Error('Verifizierungs-Token ist erforderlich');
      }

      await apiClient.post<void>(AUTH_ENDPOINTS.VERIFY_EMAIL, {
        token: token.trim(),
      });
    } catch (error) {
      console.error('Email verification failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('Token')) {
          throw error;
        }
        if (
          error.message.includes('expired') ||
          error.message.includes('invalid')
        ) {
          throw new Error('Verifizierungs-Token ist ungültig oder abgelaufen');
        }
      }

      throw new Error('E-Mail-Verifizierung fehlgeschlagen.');
    }
  },

  /**
   * Enables two-factor authentication
   * @returns QR code data for 2FA setup
   */
  enable2FA: async (): Promise<{ qrCode: string; backupCodes: string[] }> => {
    try {
      const response = await apiClient.post<{
        qrCode: string;
        backupCodes: string[];
      }>(AUTH_ENDPOINTS.GENERATE_2FA);
      return response.data;
    } catch (error) {
      console.error('2FA setup failed:', error);
      throw new Error(
        'Zwei-Faktor-Authentifizierung konnte nicht eingerichtet werden.'
      );
    }
  },

  /**
   * Verifies 2FA code
   * @param code - 2FA verification code
   */
  verify2FA: async (code: string): Promise<void> => {
    try {
      if (!code?.trim()) {
        throw new Error('Verifizierungscode ist erforderlich');
      }

      await apiClient.post<void>(AUTH_ENDPOINTS.VERIFY_2FA, {
        code: code.trim(),
      });
    } catch (error) {
      console.error('2FA verification failed:', error);

      if (
        error instanceof Error &&
        error.message.includes('Verifizierungscode')
      ) {
        throw error;
      }

      throw new Error('2FA-Verifizierung fehlgeschlagen.');
    }
  },
};

export default authService;
