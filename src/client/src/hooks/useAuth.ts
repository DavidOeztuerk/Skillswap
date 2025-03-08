// src/hooks/useAuth.ts
import { useNavigate } from 'react-router-dom';
import {
  login as loginAction,
  register as registerAction,
  logout as logoutAction,
  getProfile,
  clearError,
  updateUser,
} from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { LoginRequest } from '../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../types/contracts/requests/RegisterRequest';
import { User } from '../types/models/User';
import { UpdateProfileRequest } from '../types/contracts/requests/UpdateProfileRequest';

/**
 * Hook für Authentifizierungsfunktionalität
 * Bietet Methoden für Login, Registrierung, Logout und Profilaktualisierung
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  /**
   * Führt den Login-Prozess aus
   * @param credentials - Login-Daten (E-Mail und Passwort)
   * @param redirectPath - Pfad, zu dem nach erfolgreichem Login navigiert wird
   * @returns true bei Erfolg, false bei Fehler
   */
  const login = async (
    credentials: LoginRequest,
    redirectPath = '/dashboard'
  ): Promise<boolean> => {
    try {
      const resultAction = await dispatch(loginAction(credentials));

      if (loginAction.fulfilled.match(resultAction)) {
        navigate(redirectPath, { replace: true });
        return true;
      }

      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  /**
   * Führt den Registrierungsprozess aus
   * @param userData - Registrierungsdaten
   * @param redirectPath - Pfad, zu dem nach erfolgreicher Registrierung navigiert wird
   * @returns true bei Erfolg, false bei Fehler
   */
  const register = async (
    userData: RegisterRequest,
    redirectPath = '/dashboard'
  ): Promise<boolean> => {
    try {
      const resultAction = await dispatch(registerAction(userData));

      if (registerAction.fulfilled.match(resultAction)) {
        navigate(redirectPath, { replace: true });
        return true;
      }

      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  /**
   * Führt den Logout-Prozess aus
   * @param redirectPath - Pfad, zu dem nach erfolgreichem Logout navigiert wird
   */
  const logout = async (redirectPath = '/login'): Promise<void> => {
    await dispatch(logoutAction());
    navigate(redirectPath, { replace: true });
  };

  /**
   * Lädt Benutzerprofildaten
   * @returns Das Benutzerprofil oder null bei Fehler
   */
  const loadUserProfile = async (): Promise<User | null> => {
    const resultAction = await dispatch(getProfile());

    if (getProfile.fulfilled.match(resultAction)) {
      return resultAction.payload;
    }

    return null;
  };

  /**
   * Aktualisiert das Benutzerprofil
   * @param profileData - Neue Profildaten
   * @returns true bei Erfolg, false bei Fehler
   */
  const updateProfile = async (
    profileData: UpdateProfileRequest
  ): Promise<boolean> => {
    // Hier würde der tatsächliche API-Call über einen neuen Thunk erfolgen
    // Für dieses Beispiel aktualisieren wir nur den lokalen State
    try {
      if (user) {
        dispatch(
          updateUser({
            ...user,
            ...profileData,
          })
        );
        return true;
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  /**
   * Löscht Fehler im Auth-State
   */
  const dismissError = (): void => {
    dispatch(clearError());
  };

  return {
    // Auth-Zustand
    user,
    isAuthenticated,
    isLoading,
    error,

    // Auth-Methoden
    login,
    register,
    logout,
    loadUserProfile,
    updateProfile,
    dismissError,
  };
};
