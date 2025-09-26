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
import { PhoneVerificationResponse } from '../../types/contracts/responses/PhoneVerificationResponse';
import { VerifyPhoneResponse } from '../../types/contracts/responses/VerifyPhoneResponse';
import {
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
  removeToken,
  isRememberMeEnabled,
} from '../../utils/authHelpers';
import { UserProfileResponse } from '../../types/contracts/responses/UserProfileResponse';
import { ApiResponse, isSuccessResponse } from '../../types/api/UnifiedResponse';
import { apiClient, ApiError } from '../apiClient';
import { isDefined, withDefault } from '../../utils/safeAccess';

const isAuthStatus = (s?: number) => s === 401 || s === 403;

const authService = {
  /**
   * Login
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>(
      AUTH_ENDPOINTS.LOGIN, 
      credentials
    );

    if (isSuccessResponse(response)) {
        console.log('🔐 LOGIN DEBUG:', {
          isSuccess: isSuccessResponse(response),
          response: response,
          hasData: !!response.data,
          hasAccessToken: !!response.data?.accessToken
        });
      const loginData = response.data;
      const storageType = withDefault(credentials?.rememberMe, false) ? 'permanent' : 'session';
      
      console.log('🔐 STORING TOKENS:', {
        hasAccessToken: isDefined(loginData?.accessToken),
        hasRefreshToken: isDefined(loginData?.refreshToken),
        storageType
      });
      
      if (isDefined(loginData?.accessToken)) {
        setToken(loginData.accessToken, storageType);
        apiClient.setAuthToken(loginData.accessToken);
        console.log('✅ Access token stored');
      }
      if (isDefined(loginData?.refreshToken)) {
        setRefreshToken(loginData.refreshToken, storageType);
        console.log('✅ Refresh token stored');
      }
    } else {
      console.error('❌ Login response not successful:', response);
    }

    return response;
  },

  /**
   * Register
   */
  async register(credentials: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post<RegisterResponse>(
      AUTH_ENDPOINTS.REGISTER, 
      credentials
    );

    // Handle token storage only on success
    if (isSuccessResponse(response)) {
      const registerData = response.data;
      
      if (isDefined(registerData?.accessToken)) {
        setToken(registerData.accessToken, 'session');
        apiClient.setAuthToken(registerData.accessToken);
      }
      if (isDefined(registerData?.refreshToken)) {
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
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<UpdateUserProfileResponse>> {
    return apiClient.post<UpdateUserProfileResponse>(
      PROFILE_ENDPOINTS.UPDATE, 
      profileData
    );
  },

  /**
   * Upload avatar
   */
  async uploadProfilePicture(file: File): Promise<ApiResponse<User>> {
    if (!file) {
      // Return error response instead of throwing
      return {
        success: false,
        errors: ['Keine Datei ausgewählt'],
        errorCode: 'FILE_MISSING',
        timestamp: new Date().toISOString(),
      };
    }

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

    const formData = new FormData();
    formData.append('avatar', file);

    return apiClient.post<User>(
      PROFILE_ENDPOINTS.UPLOAD_AVATAR,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
  },

  /**
   * Change password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
  },

  /**
   * Forgot / Reset password
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(AUTH_ENDPOINTS.RESET_PASSWORD, { token, password });
  },

  /**
   * Email verification
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>(AUTH_ENDPOINTS.VERIFY_EMAIL, request);
  },

  async resendEmailVerification(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email });
  },

  /**
   * Phone verification
   */
  async sendPhoneVerificationCode(phoneNumber: string): Promise<ApiResponse<PhoneVerificationResponse>> {
    return apiClient.post<PhoneVerificationResponse>(
      '/api/users/phone/send-verification',
      { phoneNumber }
    );
  },

  async verifyPhoneCode(code: string): Promise<ApiResponse<VerifyPhoneResponse>> {
    return apiClient.post<VerifyPhoneResponse>(
      '/api/users/phone/verify',
      { code }
    );
  },

  async removePhoneNumber(): Promise<ApiResponse<void>> {
    return apiClient.delete<void>('/api/users/phone');
  },

  /**
   * 2FA
   */
  async generateTwoFactorSecret(): Promise<ApiResponse<GenerateTwoFactorSecretResponse>> {
    return apiClient.post<GenerateTwoFactorSecretResponse>(AUTH_ENDPOINTS.GENERATE_2FA);
  },

  async verifyTwoFactorCode(request: VerifyTwoFactorCodeRequest): Promise<ApiResponse<VerifyTwoFactorCodeResponse>> {
    return apiClient.post<VerifyTwoFactorCodeResponse>(
      AUTH_ENDPOINTS.VERIFY_2FA,
      request
    );
  },

  async getTwoFactorStatus(): Promise<ApiResponse<GetTwoFactorStatusResponse>> {
    return apiClient.get<GetTwoFactorStatusResponse>(AUTH_ENDPOINTS.TWO_FACTOR_STATUS);
  },

  async disableTwoFactor(request: DisableTwoFactorRequest): Promise<ApiResponse<DisableTwoFactorResponse>> {
    return apiClient.post<DisableTwoFactorResponse>(
      AUTH_ENDPOINTS.DISABLE_2FA,
      request
    );
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
    } else {
      removeToken();
      apiClient.setAuthToken(null);
      return response;  
    }
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
      const s = (e as ApiError)?.statusCode;
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
        const s2 = (e2 as ApiError)?.statusCode;
        if (isAuthStatus(s2)) removeToken(); // wirklich ausgeloggt
        return null;
      }
    }
  },

  /**
   * Get email verification status
   */
  async getEmailVerificationStatus(): Promise<ApiResponse<{ isVerified: boolean; email?: string }>> {
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
  }
};

export default authService;