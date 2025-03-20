// src/api/services/authService.ts
import apiClient from '../apiClient';
import { AUTH_ENDPOINTS } from '../../config/endpoints';

// Erweitere die LoginRequest-Schnittstelle
interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
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
    const response = await apiClient.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
      email: credentials.email,
      password: credentials.password,
    });

    const useSessionStorage = !credentials.rememberMe;

    // Token und RefreshToken speichern
    if (response.data.token) {
      setToken(response.data.token, useSessionStorage);
    }

    if (response.data.refreshToken) {
      setRefreshToken(response.data.refreshToken, useSessionStorage);
    }

    return response.data;
  },

  /**
   * Registriert einen neuen Benutzer
   * @param userData - Registrierungsdaten
   * @returns Authentifizierungsantwort mit Benutzer und Token
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.REGISTER,
      userData
    );

    // Token und RefreshToken speichern
    if (response.data.token) {
      setToken(response.data.token);
    }

    if (response.data.refreshToken) {
      setRefreshToken(response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Holt ein neues Access-Token mit dem Refresh-Token
   * @returns Neue Tokens oder null wenn Fehler
   */
  refreshToken: async (): Promise<{
    token: string;
    refreshToken: string;
  } | null> => {
    const currentToken = getToken();
    const currentRefreshToken = getRefreshToken();

    if (!currentToken || !currentRefreshToken) {
      return null;
    }

    try {
      const response = await apiClient.post<{
        token: string;
        refreshToken: string;
      }>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
        token: currentToken,
        refreshToken: currentRefreshToken,
      });

      // Neue Tokens speichern
      if (response.data.token) {
        setToken(response.data.token);
      }

      if (response.data.refreshToken) {
        setRefreshToken(response.data.refreshToken);
      }

      return response.data;
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
    const response = await apiClient.get<User>(AUTH_ENDPOINTS.PROFILE);
    return response.data;
  },

  /**
   * Aktualisiert das Benutzerprofil
   * @param profileData - Neue Profildaten
   * @returns Aktualisierte Benutzerprofildaten
   */
  updateProfile: async (profileData: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.post<User>(
      PROFILE_ENDPOINTS.UPDATE,
      profileData
    );
    return response.data;
  },

  /**
   * Lädt ein Profilbild hoch
   * @param formData - FormData mit dem Profilbild
   * @returns Aktualisierte Benutzerprofildaten
   */
  uploadProfilePicture: async (formData: FormData): Promise<User> => {
    const response = await apiClient.post<User>(
      PROFILE_ENDPOINTS.UPLOAD_AVATAR,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Ändert das Benutzerpasswort
   * @param passwordData - Daten zur Passwortänderung
   * @returns Erfolg-/Fehlermeldung
   */
  changePassword: async (
    passwordData: ChangePasswordRequest
  ): Promise<void> => {
    const response = await apiClient.post<void>(
      AUTH_ENDPOINTS.CHANGE_PASSWORD,
      passwordData
    );
    return response.data;
  },

  /**
   * Fordert eine Passwort-Zurücksetzung an
   * @param email - E-Mail-Adresse des Benutzers
   * @returns Erfolg-/Fehlermeldung
   */
  forgotPassword: async (email: string): Promise<void> => {
    const response = await apiClient.post<void>(
      AUTH_ENDPOINTS.FORGOT_PASSWORD,
      { email }
    );
    return response.data;
  },

  /**
   * Setzt ein Passwort zurück
   * @param token - Reset-Token
   * @param password - Neues Passwort
   * @returns Erfolg-/Fehlermeldung
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    const response = await apiClient.post<void>(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token,
      password,
    });
    return response.data;
  },

  /**
   * Führt einen Logout durch (Client-seitig)
   * Bei einem echten Backend würde hier auch das Token invalidiert werden
   */
  logout: async (): Promise<void> => {
    // Hier könnte man einen API-Call machen, um das Token serverseitig zu invalidieren
    // Für jetzt entfernen wir nur die lokalen Tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return Promise.resolve();
  },
};

// Import für updateProfile und uploadProfilePicture
import { PROFILE_ENDPOINTS } from '../../config/endpoints';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
// import { ApiResponse } from '../../types/common/ApiResponse';
import {
  AuthResponse,
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
} from '../../utils/authHelpers';

export default authService;
