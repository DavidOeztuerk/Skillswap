import { apiClient } from '../../../core/api/apiClient';
import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from '../../../core/config/endpoints';
import { type ApiResponse, isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import {
  setToken,
  setRefreshToken,
  removeToken,
  getRefreshToken,
  isRememberMeEnabled,
  getToken,
} from '../../../shared/utils/authHelpers';
import { withDefault, isDefined } from '../../../shared/utils/safeAccess';
import type { ApiError } from '../../../core/api/errorExtensions';
import type { PhoneVerificationResponse } from '../../user/types/PhoneVerificationResponse';
import type {
  UpdateProfileRequest,
  UpdateUserProfileResponse,
} from '../../user/types/UpdateProfileRequest';
import type { User } from '../../user/types/User';
import type { UserProfileResponse } from '../../user/types/UserProfileResponse';
import type { VerifyPhoneResponse } from '../../user/types/VerifyPhoneResponse';
import type { LoginResponse, RegisterResponse } from '../types/AuthResponse';
import type { ChangePasswordRequest } from '../types/ChangePasswordRequest';
import type { DisableTwoFactorRequest } from '../types/DisableTwoFactorRequest';
import type { DisableTwoFactorResponse } from '../types/DisableTwoFactorResponse';
import type { GenerateTwoFactorSecretResponse } from '../types/GenerateTwoFactorSecretResponse';
import type { GetTwoFactorStatusResponse } from '../types/GetTwoFactorStatusResponse';
import type { LoginRequest } from '../types/LoginRequest';
import type { RefreshTokenResponse } from '../types/RefreshTokenResponse';
import type { RegisterRequest } from '../types/RegisterRequest';
import type { VerifyEmailRequest } from '../types/VerifyEmailRequest';
import type { VerifyTwoFactorCodeRequest } from '../types/VerifyTwoFactorCodeRequest';
import type { VerifyTwoFactorCodeResponse } from '../types/VerifyTwoFactorCodeResponse';

const isAuthStatus = (s?: number): boolean => s === 401 || s === 403;

const authService = {
  /**
   * Login
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials);

    if (isSuccessResponse(response)) {
      const loginData = response.data;
      const storageType = withDefault(credentials.rememberMe, false) ? 'permanent' : 'session';

      if (isDefined(loginData.accessToken)) {
        setToken(loginData.accessToken, storageType);
        apiClient.setAuthToken(loginData.accessToken);
      }
      if (isDefined(loginData.refreshToken)) {
        setRefreshToken(loginData.refreshToken, storageType);
      }
    } else {
      // Login failed - error handling in component
    }

    return response;
  },

  /**
   * Register
   */
  async register(credentials: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, credentials);

    // Handle token storage only on success
    if (isSuccessResponse(response)) {
      const registerData = response.data;

      if (isDefined(registerData.accessToken)) {
        setToken(registerData.accessToken, 'session');
        apiClient.setAuthToken(registerData.accessToken);
      }
      if (isDefined(registerData.refreshToken)) {
        setRefreshToken(registerData.refreshToken, 'session');
      }
    }

    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
    return apiClient.get<UserProfileResponse>(PROFILE_ENDPOINTS.GET_USER);
  },

  /**
   * Update profile
   */
  async updateProfile(
    profileData: UpdateProfileRequest
  ): Promise<ApiResponse<UpdateUserProfileResponse>> {
    return apiClient.put<UpdateUserProfileResponse>(PROFILE_ENDPOINTS.UPDATE, profileData);
  },

  /**
   * Upload avatar - sends as JSON with base64 encoded image data
   */
  async uploadProfilePicture(
    file: File
  ): Promise<ApiResponse<{ userId: string; avatarUrl: string; uploadedAt: string }>> {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        errors: ['Nur JPEG, PNG und WebP Dateien sind erlaubt'],
        errorCode: 'INVALID_FILE_TYPE',
        timestamp: new Date().toISOString(),
      };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        errors: ['Datei ist zu groß. Maximum 5MB erlaubt.'],
        errorCode: 'FILE_TOO_LARGE',
        timestamp: new Date().toISOString(),
      };
    }

    // Convert file to byte array
    const imageData = await fileToByteArray(file);

    return apiClient.post<{ userId: string; avatarUrl: string; uploadedAt: string }>(
      PROFILE_ENDPOINTS.UPLOAD_AVATAR,
      {
        imageData,
        fileName: file.name,
        contentType: file.type,
      }
    );
  },

  /**
   * Delete avatar
   */
  async deleteProfilePicture(): Promise<
    ApiResponse<{ userId: string; success: boolean; message: string }>
  > {
    return apiClient.delete<{ userId: string; success: boolean; message: string }>(
      PROFILE_ENDPOINTS.UPLOAD_AVATAR
    );
  },

  /**
   * Change password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
  },

  /**
   * Forgot / Reset password
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
  },

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse<void>> {
    return apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      email,
      token,
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Email verification
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<ApiResponse<void>> {
    return apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, request);
  },

  async resendEmailVerification(email: string): Promise<ApiResponse<void>> {
    return apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email });
  },

  /**
   * Phone verification
   */
  async sendPhoneVerificationCode(
    phoneNumber: string
  ): Promise<ApiResponse<PhoneVerificationResponse>> {
    return apiClient.post<PhoneVerificationResponse>('/api/users/phone/send-verification', {
      phoneNumber,
    });
  },

  async verifyPhoneCode(code: string): Promise<ApiResponse<VerifyPhoneResponse>> {
    return apiClient.post<VerifyPhoneResponse>('/api/users/phone/verify', { code });
  },

  async removePhoneNumber(): Promise<ApiResponse<void>> {
    return apiClient.delete('/api/users/phone');
  },

  /**
   * 2FA
   */
  async generateTwoFactorSecret(): Promise<ApiResponse<GenerateTwoFactorSecretResponse>> {
    return apiClient.post<GenerateTwoFactorSecretResponse>(AUTH_ENDPOINTS.GENERATE_2FA);
  },

  async verifyTwoFactorCode(
    request: VerifyTwoFactorCodeRequest
  ): Promise<ApiResponse<VerifyTwoFactorCodeResponse>> {
    return apiClient.post<VerifyTwoFactorCodeResponse>(AUTH_ENDPOINTS.VERIFY_2FA, request);
  },

  async getTwoFactorStatus(): Promise<ApiResponse<GetTwoFactorStatusResponse>> {
    return apiClient.get<GetTwoFactorStatusResponse>(AUTH_ENDPOINTS.TWO_FACTOR_STATUS);
  },

  async disableTwoFactor(
    request: DisableTwoFactorRequest
  ): Promise<ApiResponse<DisableTwoFactorResponse>> {
    return apiClient.post<DisableTwoFactorResponse>(AUTH_ENDPOINTS.DISABLE_2FA, request);
  },

  /**
   * Auth helpers
   */
  isAuthenticated(): boolean {
    return !!getToken();
  },

  async validateToken(): Promise<boolean> {
    try {
      const response = await this.getProfile();
      return isSuccessResponse(response) && isDefined(response.data.userId);
    } catch {
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await Promise.resolve();
      // await apiClient.post<void>('/api/auth/logout');
    } catch {
      // Ignore server errors during logout
    } finally {
      removeToken();
      apiClient.setAuthToken(null);
    }
  },

  /**
   * Refresh token with error handling
   */
  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse | null>> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<RefreshTokenResponse>(
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken },
      { skipAuth: true }
    );

    if (isSuccessResponse(response)) {
      const tokenData = response.data;
      const storageType = isRememberMeEnabled() ? 'permanent' : 'session';

      // Update stored tokens
      if (tokenData.accessToken) {
        setToken(tokenData.accessToken, storageType);
        apiClient.setAuthToken(tokenData.accessToken);
      }
      if (tokenData.refreshToken) {
        setRefreshToken(tokenData.refreshToken, storageType);
      }

      return response;
    }
    removeToken();
    apiClient.setAuthToken(null);
    return response;
  },

  /**
   * Silent login – nur bei 401/403 refreshen; nie bei 400.
   * Tokens werden NUR bei 401/403 endgültig entfernt.
   */
  async silentLogin(): Promise<User | null> {
    const hasTokens = !!getToken() && !!getRefreshToken();
    if (!hasTokens) return null;

    const tryGetProfile = async (): Promise<User | null> => {
      const profileResp = await this.getProfile();
      if (!isSuccessResponse(profileResp)) return null;
      const profile = profileResp.data;
      return { id: profile.userId, ...profile };
    };

    try {
      return await tryGetProfile();
    } catch (e: unknown) {
      const s = (e as ApiError).statusCode;
      if (!isAuthStatus(s)) {
        // z.B. 400 -> kein Auth-Thema, kein Refresh erzwingen
        console.warn('⚠️ silentLogin: non-auth error on profile, skipping refresh', s);
        return null;
      }
      // 401/403 -> versuche Refresh
      try {
        await this.refreshToken();
        return await tryGetProfile();
      } catch (e2: unknown) {
        const s2 = (e2 as ApiError).statusCode;
        if (isAuthStatus(s2)) removeToken(); // wirklich ausgeloggt
        return null;
      }
    }
  },

  /**
   * Get email verification status
   */
  async getEmailVerificationStatus(): Promise<
    ApiResponse<{ isVerified: boolean; email?: string }>
  > {
    return apiClient.get<{ isVerified: boolean; email?: string }>(
      '/api/auth/email/verification/status'
    );
  },

  /**
   * Initialize auth state (z.B. beim App-Start)
   */
  initializeAuth(): void {
    const token = getToken();
    if (token) {
      apiClient.setAuthToken(token);
    }
  },

  /**
   * Get current auth token
   */
  getCurrentToken(): string | null {
    return getToken();
  },
};

export default authService;

/**
 * Convert File to byte array for API transmission
 */
async function fileToByteArray(file: File): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const byteArray = [...new Uint8Array(arrayBuffer)];
      resolve(byteArray);
    });

    reader.addEventListener('error', () => {
      reject(new Error('Failed to read file'));
    });

    reader.readAsArrayBuffer(file);
  });
}
