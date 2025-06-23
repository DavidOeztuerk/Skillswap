// src/api/services/authService.ts
import { AUTH_ENDPOINTS, PROFILE_ENDPOINTS } from '../../config/endpoints';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import { ApiResponse } from '../../types/common/ApiResponse';
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

// Erweitere die LoginRequest-Schnittstelle
interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
}

// Token-Response Interface
interface TokenRefreshApiResponse {
  token: string;
  refreshToken: string;
}

/**
 * Service für Authentifizierungs- und Benutzerverwaltungs-Operationen
 */
const authService = {
  /**
   * Führt den Login-Prozess aus
   * @param credentials - Login-Daten (E-Mail und Passwort)
   * @returns Authentifizierungsantwort mit Benutzer und Token
   */
  login: async (credentials: ExtendedLoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    const loginData = response.data.data;
    const useSessionStorage = !credentials.rememberMe;

    // Token und RefreshToken speichern
    if (loginData.tokens.accessToken) {
      setToken(loginData.tokens.accessToken, useSessionStorage);
    }

    if (loginData.tokens.refreshToken) {
      setRefreshToken(loginData.tokens.refreshToken, useSessionStorage);
    }

    return loginData;
  },

  /**
   * Registriert einen neuen Benutzer
   * @param userData - Registrierungsdaten
   * @returns Authentifizierungsantwort mit Benutzer und Token
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      AUTH_ENDPOINTS.REGISTER,
      userData
    );

    const registerData = response.data.data;

    // Token und RefreshToken speichern
    if (registerData.tokens.accessToken) {
      setToken(registerData.tokens.accessToken);
    }

    if (registerData.tokens.refreshToken) {
      setRefreshToken(registerData.tokens.refreshToken);
    }

    return registerData;
  },

  /**
   * Holt ein neues Access-Token mit dem Refresh-Token
   * @returns Neue Tokens oder null wenn Fehler
   */
  refreshToken: async (): Promise<TokenRefreshApiResponse | null> => {
    const currentToken = getToken();
    const currentRefreshToken = getRefreshToken();

    if (!currentToken || !currentRefreshToken) {
      return null;
    }

    try {
      const response = await apiClient.post<
        ApiResponse<TokenRefreshApiResponse>
      >(AUTH_ENDPOINTS.REFRESH_TOKEN, {
        token: currentToken,
        refreshToken: currentRefreshToken,
      });

      const tokenData = response.data.data;

      // Neue Tokens speichern
      if (tokenData.token) {
        setToken(tokenData.token);
      }

      if (tokenData.refreshToken) {
        setRefreshToken(tokenData.refreshToken);
      }

      return tokenData;
    } catch (error) {
      console.error('Fehler beim Token-Refresh:', error);
      return null;
    }
  },

  /**
   * Holt das Benutzerprofil
   * @returns Benutzerprofildaten
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(
      AUTH_ENDPOINTS.PROFILE
    );
    return response.data.data;
  },

  /**
   * Aktualisiert das Benutzerprofil
   * @param profileData - Neue Profildaten
   * @returns Aktualisierte Benutzerprofildaten
   */
  updateProfile: async (profileData: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>(
      PROFILE_ENDPOINTS.UPDATE,
      profileData
    );
    return response.data.data;
  },

  /**
   * Lädt ein Profilbild hoch
   * @param formData - FormData mit dem Profilbild
   * @returns Aktualisierte Benutzerprofildaten
   */
  uploadProfilePicture: async (formData: FormData): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>(
      PROFILE_ENDPOINTS.UPLOAD_AVATAR,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Ändert das Benutzerpasswort
   * @param passwordData - Daten zur Passwortänderung
   * @returns Erfolg-/Fehlermeldung
   */
  changePassword: async (
    passwordData: ChangePasswordRequest
  ): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      AUTH_ENDPOINTS.CHANGE_PASSWORD,
      passwordData
    );
    // Bei void-Responses geben wir nichts zurück
  },

  /**
   * Fordert eine Passwort-Zurücksetzung an
   * @param email - E-Mail-Adresse des Benutzers
   * @returns Erfolg-/Fehlermeldung
   */
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      email,
    });
    // Bei void-Responses geben wir nichts zurück
  },

  /**
   * Setzt ein Passwort zurück
   * @param token - Reset-Token
   * @param password - Neues Passwort
   * @returns Erfolg-/Fehlermeldung
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token,
      password,
    });
    // Bei void-Responses geben wir nichts zurück
  },

  /**
   * Führt einen Logout durch (Client-seitig)
   * Bei einem echten Backend würde hier auch das Token invalidiert werden
   */
  logout: async (): Promise<void> => {
    // Hier könnte man einen API-Call machen, um das Token serverseitig zu invalidieren
    removeToken();
    return Promise.resolve();
  },
};

export default authService;
