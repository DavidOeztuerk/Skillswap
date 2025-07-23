// src/api/services/authService.ts
import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from '../../config/endpoints';
import { MIN_PASSWORD_LENGTH } from '../../config/constants';
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

// Helper functions for validation
const validateEmail = (email: string): string => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error('E-Mail-Adresse ist erforderlich');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Ungültige E-Mail-Adresse');
  }
  return trimmed;
};

const validatePassword = (password: string, fieldName = 'Passwort'): string => {
  if (!password?.trim()) throw new Error(`${fieldName} ist erforderlich`);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${fieldName} muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein`);
  }
  return password;
};

const validateRequired = (value: string | undefined, fieldName: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${fieldName} ist erforderlich`);
  return trimmed;
};

// Extended Login Request with rememberMe option
interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
}

/**
 * Authentication Service with improved error handling and validation
 */
const authService = {
  /**
   * Login with credentials
   */
  async login(credentials: ExtendedLoginRequest): Promise<LoginResponse> {
    const email = validateEmail(credentials.email);
    const password = validateRequired(credentials.password, 'Passwort');

    const response = await apiClient.post<LoginResponse>(
      AUTH_ENDPOINTS.LOGIN,
      { email, password }
    );

    if (!response.tokens?.accessToken) {
      throw new Error('Ungültige Antwort vom Server');
    }

    const useSessionStorage = credentials.rememberMe ? 'session' : 'permanent';
    setToken(response.tokens.accessToken, useSessionStorage);
    
    if (response.tokens.refreshToken) {
      setRefreshToken(response.tokens.refreshToken, useSessionStorage);
    }

    return response;
  },

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const validatedData = {
      email: validateEmail(userData.email),
      password: validatePassword(userData.password),
      firstName: validateRequired(userData.firstName, 'Vorname'),
      lastName: validateRequired(userData.lastName, 'Nachname'),
      userName: userData.userName?.trim(),
    };

    const response = await apiClient.post<RegisterResponse>(
      AUTH_ENDPOINTS.REGISTER,
      validatedData
    );

    if (response.tokens?.accessToken) {
      setToken(response.tokens.accessToken);
      if (response.tokens.refreshToken) {
        setRefreshToken(response.tokens.refreshToken);
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
    const validatedData = {
      currentPassword: validateRequired(passwordData.currentPassword, 'Aktuelles Passwort'),
      newPassword: validatePassword(passwordData.newPassword, 'Neues Passwort'),
    };

    await apiClient.post<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, validatedData);
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const validatedEmail = validateEmail(email);
    await apiClient.post<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email: validatedEmail });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    const validatedToken = validateRequired(token, 'Reset-Token');
    const validatedPassword = validatePassword(password, 'Neues Passwort');

    await apiClient.post<void>(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token: validatedToken,
      password: validatedPassword,
    });
  },

  /**
   * Verify email
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    const validatedData = {
      email: validateEmail(request.email),
      verificationToken: validateRequired(request.verificationToken, 'Verifizierungs-Token'),
    };

    await apiClient.post<void>(AUTH_ENDPOINTS.VERIFY_EMAIL, validatedData);
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
    const validatedData = {
      userId: validateRequired(request.userId, 'User ID'),
      code: validateRequired(request.code, 'Verifizierungscode'),
    };

    return apiClient.post<VerifyTwoFactorCodeResponse>(
      AUTH_ENDPOINTS.VERIFY_2FA,
      validatedData
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
   * Silent login with stored token
   */
  async silentLogin(): Promise<User | null> {
    if (!this.isAuthenticated()) return null;

    try {
      return await this.getProfile();
    } catch {
      // Token might be expired, try refresh
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;

      try {
        // Refresh will be handled by httpClient automatically
        return await this.getProfile();
      } catch {
        return null;
      }
    }
  },
};

export default authService;

// src/api/services/authService.ts


// import apiClient from '../apiClient';
// import {
//   setToken,
//   removeToken,
//   getToken,
//   setRefreshToken,
//   getRefreshToken,
// } from '../../utils/authHelpers';
// import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
// import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
// import { User } from '../../types/models/User';
// import { LoginResponse, RegisterResponse } from '../../types/contracts/responses/AuthResponse';

// class AuthService {
//   private refreshTokenPromise: Promise<any> | null = null;

//   async login(credentials: LoginRequest & { rememberMe?: boolean }): Promise<LoginResponse> {
//     try {
//       const response = await apiClient.post<LoginResponse>('/auth/login', {
//         email: credentials.email,
//         password: credentials.password,
//       });

//       if (response.tokens) {
//         // Store tokens based on rememberMe flag
//         const storage = credentials.rememberMe ? 'permanent' : 'session';
//         setToken(response.tokens.accessToken, storage);
//         setRefreshToken(response.tokens.refreshToken, storage);
//       }

//       return response;
//     } catch (error: any) {
//       console.error('Login error:', error);
//       throw new Error(error.response?.data?.message || 'Login failed');
//     }
//   }

//   async register(userData: RegisterRequest): Promise<RegisterResponse> {
//     try {
//       const response = await apiClient.post<RegisterResponse>('/auth/register', userData);

//       if (response.tokens) {
//         setToken(response.tokens.accessToken);
//         setRefreshToken(response.tokens.refreshToken);
//       }

//       return response;
//     } catch (error: any) {
//       console.error('Registration error:', error);
//       throw new Error(error.response?.data?.message || 'Registration failed');
//     }
//   }

//   async logout(): Promise<void> {
//     try {
//       const token = getToken();
//       if (token) {
//         await apiClient.post('/auth/logout');
//       }
//     } catch (error) {
//       console.error('Logout error:', error);
//     } finally {
//       // Always clear tokens, even if logout request fails
//       removeToken();
      
//       // Clear any cached data
//       sessionStorage.clear();
      
//       // Redirect will be handled by the hook
//     }
//   }

//   async refreshToken(): Promise<{ token: string; refreshToken: string } | null> {
//     try {
//       // Prevent multiple simultaneous refresh requests
//       if (this.refreshTokenPromise) {
//         return await this.refreshTokenPromise;
//       }

//       const refreshToken = getRefreshToken();
//       if (!refreshToken) {
//         throw new Error('No refresh token available');
//       }

//       this.refreshTokenPromise = apiClient.post<{
//         accessToken: string;
//         refreshToken: string;
//       }>('/auth/refresh-token', { refreshToken });

//       const response = await this.refreshTokenPromise;
      
//       if (response.data) {
//         setToken(response.data.accessToken);
//         setRefreshToken(response.data.refreshToken);
        
//         return {
//           token: response.data.accessToken,
//           refreshToken: response.data.refreshToken,
//         };
//       }

//       return null;
//     } catch (error) {
//       console.error('Token refresh error:', error);
//       removeToken();
//       return null;
//     } finally {
//       this.refreshTokenPromise = null;
//     }
//   }

//   async getProfile(): Promise<User> {
//     try {
//       const response = await apiClient.get<User>('/auth/profile');
//       return response;
//     } catch (error: any) {
//       console.error('Get profile error:', error);
//       throw new Error(error.response?.data?.message || 'Failed to get profile');
//     }
//   }

//   async silentLogin(): Promise<User | null> {
//     try {
//       const token = getToken();
//       if (!token) {
//         return null;
//       }

//       // Try to get profile with existing token
//       const user = await this.getProfile();
//       return user;
//     } catch (error: any) {
//       // If token is expired, try to refresh
//       if (error.response?.status === 401) {
//         const refreshResult = await this.refreshToken();
//         if (refreshResult) {
//           // Retry getting profile with new token
//           try {
//             const user = await this.getProfile();
//             return user;
//           } catch (retryError) {
//             console.error('Silent login retry failed:', retryError);
//             return null;
//           }
//         }
//       }
      
//       console.error('Silent login error:', error);
//       return null;
//     }
//   }

//   async verifyEmail(request: { token: string; userId: string }): Promise<void> {
//     await apiClient.post('/auth/verify-email', request);
//   }

//   async forgotPassword(email: string): Promise<void> {
//     await apiClient.post('/auth/forgot-password', { email });
//   }

//   async resetPassword(token: string, newPassword: string): Promise<void> {
//     await apiClient.post('/auth/reset-password', { token, newPassword });
//   }

//   isAuthenticated(): boolean {
//     return !!getToken();
//   }
// }

// export default new AuthService();