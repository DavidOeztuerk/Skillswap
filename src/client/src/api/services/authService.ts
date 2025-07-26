// src/api/services/authService.ts
import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from '../../config/endpoints';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import { RegisterResponse, LoginResponse } from '../../types/contracts/responses/AuthResponse';
import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
import { User } from '../../types/models/User';
import { UpdateProfileRequest } from '../../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../../types/contracts/requests/ChangePasswordRequest';
import { VerifyEmailRequest } from '../../types/contracts/requests/VerifyEmailRequest';
import { GenerateTwoFactorSecretResponse } from '../../types/contracts/responses/GenerateTwoFactorSecretResponse';
import { VerifyTwoFactorCodeRequest } from '../../types/contracts/requests/VerifyTwoFactorCodeRequest';
import { VerifyTwoFactorCodeResponse } from '../../types/contracts/responses/VerifyTwoFactorCodeResponse';
import {
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
  removeToken,
} from '../../utils/authHelpers';
import apiClient from '../apiClient';

/**
 * Authentication Service with improved error handling and validation
 */
const authService = {
  /**
   * Login with credentials
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );
    
    console.log('🔍 Login response received:', {
      hasAccessToken: !!response.accessToken,
      hasRefreshToken: !!response.refreshToken,
      hasUser: !!response.user,
      responseKeys: Object.keys(response)
    });

    if (!response.accessToken) {
      console.error('❌ No accessToken in response:', response);
      throw new Error('Ungültige Antwort vom Server');
    }

    const storageType = credentials.rememberMe ? 'permanent' : 'session';
    console.log('💾 Storing token with type:', storageType);
    
    setToken(response.accessToken, storageType);
    
    if (response.refreshToken) {
      setRefreshToken(response.refreshToken, storageType);
    }
    
    // Verify token was stored
    const storedToken = getToken();
    console.log('✅ Token stored successfully:', !!storedToken);

    return response;
  },

  /**
   * Register new user
   */
  async register(credentials: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      AUTH_ENDPOINTS.REGISTER,
      credentials
    );

    if (response.accessToken) {
      setToken(response.accessToken);
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
      }
    }

    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>(AUTH_ENDPOINTS.PROFILE);
  },

  /**
   * Get user by ID (public profile)
   */
  async getUserById(userId: string): Promise<Partial<User>> {
    if (!userId) throw new Error('User ID ist erforderlich');
    return apiClient.get<Partial<User>>(`/api/users/${userId}`);
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const cleanedData = {
      ...profileData,
      firstName: profileData.firstName?.trim(),
      lastName: profileData.lastName?.trim(),
      bio: profileData.bio?.trim(),
    };

    return apiClient.post<User>(PROFILE_ENDPOINTS.UPDATE, cleanedData);
  },

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File): Promise<User> {
    if (!file) throw new Error('Keine Datei ausgewählt');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Nur JPEG, PNG und WebP Dateien sind erlaubt');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Datei ist zu groß. Maximum 5MB erlaubt.');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    return apiClient.uploadFile<User>(PROFILE_ENDPOINTS.UPLOAD_AVATAR, formData);
  },

  /**
   * Change password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await apiClient.post<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email: email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post<void>(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token: token,
      password: password,
    });
  },

  /**
   * Verify email
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    await apiClient.post<void>(AUTH_ENDPOINTS.VERIFY_EMAIL, request);
  },

  /**
   * Generate 2FA secret
   */
  async generateTwoFactorSecret(): Promise<GenerateTwoFactorSecretResponse> {
    return apiClient.post<GenerateTwoFactorSecretResponse>(AUTH_ENDPOINTS.GENERATE_2FA);
  },

  /**
   * Verify 2FA code
   */
  async verifyTwoFactorCode(request: VerifyTwoFactorCodeRequest): Promise<VerifyTwoFactorCodeResponse> {
    return apiClient.post<VerifyTwoFactorCodeResponse>(
      AUTH_ENDPOINTS.VERIFY_2FA,
      request
    );
  },

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!getToken();
  },

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    removeToken();
    // Optional: Call logout endpoint if backend supports it
    // await apiClient.post('/api/auth/logout');
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        AUTH_ENDPOINTS.REFRESH_TOKEN,
        { refreshToken }
      );

      if (response.accessToken) {
        const storageType = 'session'; // Default to session storage for refresh tokens
        setToken(response.accessToken, storageType);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken, storageType);
        }
      }

      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      removeToken();
      throw error;
    }
  },

  /**
   * Silent login with stored token
   */
  async silentLogin(): Promise<User | null> {
    if (!this.isAuthenticated()) return null;

    try {
      return await this.getProfile();
    } catch {
      // Token might be expired, try refresh
      try {
        await this.refreshToken();
        return await this.getProfile();
      } catch {
        return null;
      }
    }
  },
};

export default authService;
