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
import httpClient from '../httpClient';
import { UserProfileResponse } from '../../types/contracts/responses/UserProfileResponse';
import { ApiResponse } from '../../types/common/ApiResponse';

/**
 * Authentication Service with improved error handling and validation
 */
const authService = {
  /**
   * Login with credentials
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // Use httpClient directly to get the full ApiResponse (not apiClient which unwraps data)
    const response = await httpClient.post<ApiResponse<LoginResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );
 
    const storageType = credentials?.rememberMe ? 'permanent' : 'session';
    
    // Set tokens from the response
    if (response?.data?.accessToken) {
      setToken(response.data.accessToken, storageType);
    }
    if (response?.data?.refreshToken) {
      setRefreshToken(response.data.refreshToken, storageType);
    }
    
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
      if (response?.refreshToken) {
        setRefreshToken(response.refreshToken);
      }
    }

    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfileResponse> {
    return apiClient.get<UserProfileResponse>(AUTH_ENDPOINTS.PROFILE);
  },

  // /**
  //  * Get user by ID (public profile)
  //  */
  // async getUserById(userId: string): Promise<Partial<User>> {
  //   if (!userId) throw new Error('User ID ist erforderlich');
  //   return apiClient.get<Partial<User>>(`/api/users/${userId}`);
  // },

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<UpdateUserProfileResponse> {
    return apiClient.post<UpdateUserProfileResponse>(PROFILE_ENDPOINTS.UPDATE, profileData);
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
    return apiClient.post<GenerateTwoFactorSecretResponse>(AUTH_ENDPOINTS.GENERATE_2FA, {});
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
   * Get 2FA status
   */
  async getTwoFactorStatus(): Promise<GetTwoFactorStatusResponse> {
    return apiClient.get<GetTwoFactorStatusResponse>(AUTH_ENDPOINTS.TWO_FACTOR_STATUS);
  },

  /**
   * Disable 2FA
   */
  async disableTwoFactor(request: DisableTwoFactorRequest): Promise<DisableTwoFactorResponse> {
    return apiClient.post<DisableTwoFactorResponse>(
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
      
      // Make the refresh request
      const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
        AUTH_ENDPOINTS.REFRESH_TOKEN,
        requestBody
      );
      
      // Extract the data from the API response wrapper
      const tokenData = response.data || response;
      
      if (tokenData.accessToken) {
        // Preserve the storage type from the original token
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

    const token = getToken();
    const refreshTokenValue = getRefreshToken();
    
    // If we don't have both tokens, can't do silent login
    if (!token || !refreshTokenValue) {
      console.log('🔐 Silent login: Missing tokens');
      return null;
    }

    try {
      // First try to get profile with current token
      console.log('🔐 Silent login: Attempting to fetch profile...');
      const profile = await this.getProfile();
      const user: User = { ...profile, id: profile.userId };
      console.log('✅ Silent login: Profile fetched successfully');
      return user;
    } catch (error) {
      console.log('⚠️ Silent login: Profile fetch failed, attempting token refresh...');
      
      // Token might be expired, try refresh
      try {
        await this.refreshToken();
        console.log('✅ Silent login: Token refreshed successfully');
        
        // Now get profile with new token
        const profile = await this.getProfile();
        const user: User = { ...profile, id: profile.userId };
        console.log('✅ Silent login: Profile fetched after refresh');
        return user;
      } catch (refreshError) {
        console.error('❌ Silent login: Token refresh failed:', refreshError);
        // Clear invalid tokens
        removeToken();
        return null;
      }
    }
  },
};

export default authService;
