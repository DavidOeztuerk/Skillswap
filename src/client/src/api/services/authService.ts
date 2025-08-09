import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from '../../config/endpoints';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import { RegisterResponse, LoginResponse } from '../../types/contracts/responses/AuthResponse';
import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
import { User } from '../../types/models/User';
import { UpdateProfileRequest, UpdateUserProfileResponse } from '../../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../../types/contracts/requests/ChangePasswordRequest';
import { VerifyEmailRequest } from '../../types/contracts/requests/VerifyEmailRequest';
import { GenerateTwoFactorSecretResponse } from '../../types/contracts/responses/GenerateTwoFactorSecretResponse';
import { VerifyTwoFactorCodeRequest } from '../../types/contracts/requests/VerifyTwoFactorCodeRequest';
import { VerifyTwoFactorCodeResponse } from '../../types/contracts/responses/VerifyTwoFactorCodeResponse';
import { DisableTwoFactorRequest } from '../../types/contracts/requests/DisableTwoFactorRequest';
import { GetTwoFactorStatusResponse } from '../../types/contracts/responses/GetTwoFactorStatusResponse';
import { DisableTwoFactorResponse } from '../../types/contracts/responses/DisableTwoFactorResponse';
import { RefreshTokenResponse } from '../../types/contracts/responses/RefreshTokenResponse';
import {
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
  removeToken,
} from '../../utils/authHelpers';
import apiClient from '../apiClient';
import { UserProfileResponse } from '../../types/contracts/responses/UserProfileResponse';
import { ApiResponse } from '../../types/common/ApiResponse';
import { isDefined, unwrap, withDefault } from '../../utils/safeAccess';

/**
 * Authentication Service with improved error handling and validation
 */
const authService = {
  /**
   * Login with credentials
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(AUTH_ENDPOINTS.LOGIN, credentials);
    const payload = unwrap<LoginResponse>(response);

    const storageType = withDefault(credentials?.rememberMe, false) ? 'permanent' : 'session';
    if (isDefined(payload?.accessToken)) setToken(payload.accessToken, storageType);
    if (isDefined(payload?.refreshToken)) setRefreshToken(payload.refreshToken, storageType);

    return response;
  },

  /**
   * Register new user
   */
  async register(credentials: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(AUTH_ENDPOINTS.REGISTER, credentials);

    const payload = unwrap<RegisterResponse>(response);
    if (isDefined(payload?.accessToken)) {
      setToken(payload.accessToken);
      if (isDefined(payload?.refreshToken)) setRefreshToken(payload.refreshToken);
    }
    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
    return apiClient.get<ApiResponse<UserProfileResponse>>(AUTH_ENDPOINTS.PROFILE);
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<UpdateUserProfileResponse>> {
    return apiClient.post<ApiResponse<UpdateUserProfileResponse>>(PROFILE_ENDPOINTS.UPDATE, profileData);
  },

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File): Promise<User> {
    if (!file) throw new Error('Keine Datei ausgewählt');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes?.includes(file.type)) {
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
    await apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email: email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token: token,
      password: password,
    });
  },

  /**
   * Verify email
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, request);
  },

  /**
   * Generate 2FA secret
   */
  async generateTwoFactorSecret(): Promise<ApiResponse<GenerateTwoFactorSecretResponse>> {
    return apiClient.post<ApiResponse<GenerateTwoFactorSecretResponse>>(AUTH_ENDPOINTS.GENERATE_2FA);
  },

  /**
   * Verify 2FA code
   */
  async verifyTwoFactorCode(request: VerifyTwoFactorCodeRequest): Promise<ApiResponse<VerifyTwoFactorCodeResponse>> {
    return apiClient.post<ApiResponse<VerifyTwoFactorCodeResponse>>(
      AUTH_ENDPOINTS.VERIFY_2FA,
      request
    );
  },

  /**
   * Get 2FA status
   */
  async getTwoFactorStatus(): Promise<ApiResponse<GetTwoFactorStatusResponse>> {
    return apiClient.get<ApiResponse<GetTwoFactorStatusResponse>>(AUTH_ENDPOINTS.TWO_FACTOR_STATUS);
  },

  /**
   * Disable 2FA
   */
  async disableTwoFactor(request: DisableTwoFactorRequest): Promise<ApiResponse<DisableTwoFactorResponse>> {
    return apiClient.post<ApiResponse<DisableTwoFactorResponse>>(
      AUTH_ENDPOINTS.DISABLE_2FA,
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
     const response = await this.getProfile();
     // Check if response has userId
     return isDefined(response) && isDefined(response.data.userId);
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
    try {
      // await apiClient.post('/api/auth/logout', {});
    } catch {
      // Ignore logout endpoint errors
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const refreshTokenValue = getRefreshToken();
    const currentAccessToken = getToken();
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      // Backend expects BOTH accessToken and refreshToken in body
      const requestBody = { 
        accessToken: currentAccessToken || '',
        refreshToken: refreshTokenValue 
      };
      
      const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
        AUTH_ENDPOINTS.REFRESH_TOKEN,
        requestBody
      );
      
      const tokenData = unwrap<RefreshTokenResponse>(response);
      
      if (tokenData.accessToken) {
        const storageType = localStorage.getItem('remember_me') === 'true' ? 'permanent' : 'session';
        
        setToken(tokenData.accessToken, storageType);
        if (tokenData.refreshToken) {
          setRefreshToken(tokenData.refreshToken, storageType);
        }
        
        console.log('✅ Token refreshed successfully in authService');
        return {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken
        };
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('❌ Token refresh failed in authService:', error);
      removeToken();
      throw error;
    }
  },

  /**
   * Silent login with stored token
   */
  async silentLogin(): Promise<User | null> {
    if (!this.isAuthenticated()) return null;
    if (!getToken() || !getRefreshToken()) return null;

    try {
      const profileResp = await this.getProfile();
      const profile = unwrap<UserProfileResponse>(profileResp);
      return { id: profile.userId, ...profile };
    } catch {
      try {
        await this.refreshToken();
        const profileResp = await this.getProfile();
        const profile = unwrap<UserProfileResponse>(profileResp);
        return { id: profile.userId, ...profile };
      } catch {
        removeToken();
        return null;
      }
    }
  }
};

export default authService;