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
} from '../../utils/authHelpers';
import apiClient, { RequestConfig } from '../apiClient';
import { UserProfileResponse } from '../../types/contracts/responses/UserProfileResponse';
import { ApiResponse } from '../../types/common/ApiResponse';
import { isDefined, unwrap, withDefault } from '../../utils/safeAccess';

const isAuthStatus = (s?: number) => s === 401 || s === 403;

const authService = {
  /**
   * Login
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
   * Register
   */
  async register(credentials: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(AUTH_ENDPOINTS.REGISTER, credentials);
    const payload = unwrap<RegisterResponse>(response);

    if (isDefined(payload?.accessToken)) {
      setToken(payload.accessToken);
    }
    if (isDefined(payload?.refreshToken)) setRefreshToken(payload.refreshToken);

    return response;
  },

  /**
   * Get current user profile
   * ACHTUNG: Passe den Endpoint an dein Projekt an (GET/ME/PROFILE).
   */
  async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
    // Falls dein Projekt AUTH_ENDPOINTS.PROFILE nutzt, ersetze die nächste Zeile:
    return apiClient.get<ApiResponse<UserProfileResponse>>(PROFILE_ENDPOINTS.GET_USER);
  },

  /**
   * Update profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<UpdateUserProfileResponse>> {
    return apiClient.post<ApiResponse<UpdateUserProfileResponse>>(PROFILE_ENDPOINTS.UPDATE, profileData);
  },

  /**
   * Upload avatar
   */
  async uploadProfilePicture(file: File): Promise<User> {
    if (!file) throw new Error('Keine Datei ausgewählt');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Nur JPEG, PNG und WebP Dateien sind erlaubt');
    }
    const maxSize = 5 * 1024 * 1024;
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
   * Forgot / Reset password
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, password });
  },

  /**
   * Email verification
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, request);
  },

  async resendEmailVerification(email: string): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email });
  },

  /**
   * Phone verification
   */
  async sendPhoneVerificationCode(phoneNumber: string): Promise<ApiResponse<PhoneVerificationResponse>> {
    return apiClient.post<ApiResponse<PhoneVerificationResponse>>('/api/users/phone/send-verification', { phoneNumber });
  },

  async verifyPhoneCode(code: string): Promise<ApiResponse<VerifyPhoneResponse>> {
    return apiClient.post<ApiResponse<VerifyPhoneResponse>>('/api/users/phone/verify', { code });
  },

  async removePhoneNumber(): Promise<void> {
    await apiClient.delete('/api/users/phone');
  },

  /**
   * 2FA
   */
  async generateTwoFactorSecret(): Promise<ApiResponse<GenerateTwoFactorSecretResponse>> {
    return apiClient.post<ApiResponse<GenerateTwoFactorSecretResponse>>(AUTH_ENDPOINTS.GENERATE_2FA);
  },

  async verifyTwoFactorCode(request: VerifyTwoFactorCodeRequest): Promise<ApiResponse<VerifyTwoFactorCodeResponse>> {
    return apiClient.post<ApiResponse<VerifyTwoFactorCodeResponse>>(AUTH_ENDPOINTS.VERIFY_2FA, request);
  },

  async getTwoFactorStatus(): Promise<ApiResponse<GetTwoFactorStatusResponse>> {
    return apiClient.get<ApiResponse<GetTwoFactorStatusResponse>>(AUTH_ENDPOINTS.TWO_FACTOR_STATUS);
  },

  async disableTwoFactor(request: DisableTwoFactorRequest): Promise<ApiResponse<DisableTwoFactorResponse>> {
    return apiClient.post<ApiResponse<DisableTwoFactorResponse>>(AUTH_ENDPOINTS.DISABLE_2FA, request);
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
      return isDefined(response?.data?.userId);
    } catch {
      return false;
    }
  },

  async logout(): Promise<void> {
    removeToken();
    try {
      // optional: await apiClient.post('/api/auth/logout', {});
    } catch { /* ignore */ }
  },

  /**
   * Refresh (mit skipAuth, damit Interceptor nicht eingreift)
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken?: string } | null> {
    const rt = getRefreshToken();
    const at = getToken();
    if (!rt) throw new Error('No refresh token available');

    try {
      const body = { accessToken: at || '', refreshToken: rt };
      const cfg: RequestConfig = { skipAuth: true }; // <- wichtig!
      const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(AUTH_ENDPOINTS.REFRESH_TOKEN, body, cfg);

      const tokenData = unwrap<RefreshTokenResponse>(response);
      if (!tokenData?.accessToken) throw new Error('Invalid refresh response');

      const storageType = localStorage.getItem('remember_me') === 'true' ? 'permanent' : 'session';
      setToken(tokenData.accessToken, storageType);
      if (tokenData.refreshToken) setRefreshToken(tokenData.refreshToken, storageType);

      console.log('✅ Token refreshed successfully in authService');
      return { accessToken: tokenData.accessToken, refreshToken: tokenData.refreshToken };
    } catch (e: any) {
      console.error('❌ Token refresh failed in authService:', e);
      // Nur bei echten Auth-Fehlern Tokens entfernen
      const s = e?.response?.status;
      if (isAuthStatus(s)) removeToken();
      throw e;
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
      const profile = unwrap<UserProfileResponse>(profileResp);
      return { id: profile.userId, ...profile };
    };

    try {
      return await tryGetProfile();
    } catch (e: any) {
      const s = e?.response?.status;
      if (!isAuthStatus(s)) {
        // z.B. 400 -> kein Auth-Thema, kein Refresh erzwingen
        console.warn('⚠️ silentLogin: non-auth error on profile, skipping refresh', s);
        return null;
      }
      // 401/403 -> versuche Refresh
      try {
        await this.refreshToken();
        return await tryGetProfile();
      } catch (e2: any) {
        const s2 = e2?.response?.status;
        if (isAuthStatus(s2)) removeToken(); // wirklich ausgeloggt
        return null;
      }
    }
  },

  /**
   * Sonstiges
   */
  async getEmailVerificationStatus(): Promise<any> {
    return apiClient.get('/api/auth/email/verification/status');
  }
};

export default authService;
