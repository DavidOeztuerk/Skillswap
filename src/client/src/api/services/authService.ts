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
 * Enhanced Auth Service with improved error handling and type safety
 */
const authService = {
  /**
   * Führt den Login-Prozess aus
   * @param credentials - Login-Daten (E-Mail und Passwort)
   * @returns Authentifizierungsantwort mit Benutzer und Token
   */
  login: async (credentials: ExtendedLoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        {
          email: credentials.email,
          password: credentials.password,
        }
      );

      const loginData = response.data;
      const useSessionStorage = !credentials.rememberMe;

      // Token und RefreshToken speichern
      if (loginData.tokens?.accessToken) {
        setToken(loginData.tokens.accessToken, useSessionStorage);
      }

      if (loginData.tokens?.refreshToken) {
        setRefreshToken(loginData.tokens.refreshToken, useSessionStorage);
      }

      return loginData;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.');
    }
  },

  /**
   * Registriert einen neuen Benutzer
   * @param userData - Registrierungsdaten
   * @returns Authentifizierungsantwort mit Benutzer und Token
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await apiClient.post<RegisterResponse>(
        AUTH_ENDPOINTS.REGISTER,
        userData
      );

      const registerData = response.data;

      // Token und RefreshToken speichern
      if (registerData.tokens?.accessToken) {
        setToken(registerData.tokens.accessToken);
      }

      if (registerData.tokens?.refreshToken) {
        setRefreshToken(registerData.tokens.refreshToken);
      }

      return registerData;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    }
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
      const response = await apiClient.post<TokenRefreshApiResponse>(
        AUTH_ENDPOINTS.REFRESH_TOKEN,
        {
          token: currentToken,
          refreshToken: currentRefreshToken,
        }
      );

      const tokenData = response.data;

      // Neue Tokens speichern
      if (tokenData.token) {
        setToken(tokenData.token);
      }

      if (tokenData.refreshToken) {
        setRefreshToken(tokenData.refreshToken);
      }

      return tokenData;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Bei Token-Refresh-Fehler logout durchführen
      await authService.logout();
      return null;
    }
  },

  /**
   * Holt das Benutzerprofil
   * @returns Benutzerprofildaten
   */
  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>(AUTH_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw new Error('Profil konnte nicht geladen werden.');
    }
  },

  /**
   * Aktualisiert das Benutzerprofil
   * @param profileData - Neue Profildaten
   * @returns Aktualisierte Benutzerprofildaten
   */
  updateProfile: async (profileData: UpdateProfileRequest): Promise<User> => {
    try {
      const response = await apiClient.post<User>(
        PROFILE_ENDPOINTS.UPDATE,
        profileData
      );
      return response.data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error('Profil konnte nicht aktualisiert werden.');
    }
  },

  /**
   * Lädt ein Profilbild hoch
   * @param file - Profilbild-Datei
   * @returns Aktualisierte Benutzerprofildaten
   */
  uploadProfilePicture: async (file: File): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.uploadFile<User>(
        PROFILE_ENDPOINTS.UPLOAD_AVATAR,
        formData
      );
      return response.data;
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      throw new Error('Profilbild konnte nicht hochgeladen werden.');
    }
  },

  /**
   * Ändert das Benutzerpasswort
   * @param passwordData - Daten zur Passwortänderung
   * @returns Erfolg-/Fehlermeldung
   */
  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
      await apiClient.post<void>(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
    } catch (error) {
      console.error('Password change failed:', error);
      throw new Error('Passwort konnte nicht geändert werden.');
    }
  },

  /**
   * Fordert eine Passwort-Zurücksetzung an
   * @param email - E-Mail-Adresse des Benutzers
   * @returns Erfolg-/Fehlermeldung
   */
  forgotPassword: async (email: string): Promise<void> => {
    try {
      await apiClient.post<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
    } catch (error) {
      console.error('Forgot password request failed:', error);
      throw new Error('Passwort-Reset-Anfrage fehlgeschlagen.');
    }
  },

  /**
   * Setzt ein Passwort zurück
   * @param token - Reset-Token
   * @param password - Neues Passwort
   * @returns Erfolg-/Fehlermeldung
   */
  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      await apiClient.post<void>(AUTH_ENDPOINTS.RESET_PASSWORD, {
        token,
        password,
      });
    } catch (error) {
      console.error('Password reset failed:', error);
      throw new Error('Passwort konnte nicht zurückgesetzt werden.');
    }
  },

  /**
   * Überprüft ob der Benutzer authentifiziert ist
   * @returns true wenn authentifiziert
   */
  isAuthenticated: (): boolean => {
    const token = getToken();
    return !!token;
  },

  /**
   * Überprüft die Token-Gültigkeit
   * @returns true wenn Token gültig ist
   */
  validateToken: async (): Promise<boolean> => {
    try {
      await apiClient.get<User>(AUTH_ENDPOINTS.PROFILE);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Führt einen Logout durch
   */
  logout: async (): Promise<void> => {
    try {
      // Clear cache when logging out
      apiClient.clearCache();
      
      // Remove tokens
      removeToken();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure tokens are removed even if logout request fails
      removeToken();
      return Promise.resolve();
    }
  },

  /**
   * Führt einen stillen Login durch (mit gespeicherten Tokens)
   * @returns User-Daten wenn erfolgreich, null wenn fehlgeschlagen
   */
  silentLogin: async (): Promise<User | null> => {
    try {
      const token = getToken();
      if (!token) {
        return null;
      }

      // Validate current token by fetching profile
      const user = await authService.getProfile();
      return user;
    } catch {
      // Try to refresh token
      const refreshResult = await authService.refreshToken();
      if (refreshResult) {
        try {
          const user = await authService.getProfile();
          return user;
        } catch (profileError) {
          console.error('Silent login failed:', profileError);
          return null;
        }
      }
      return null;
    }
  },
};

export default authService;