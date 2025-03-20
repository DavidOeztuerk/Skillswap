import { SessionStorage } from './sessionStorage';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Speichert das Access-Token im localStorage
 */
export const setToken = (
  token: string,
  useSessionStorage: boolean = false
): void => {
  if (useSessionStorage) {
    SessionStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Holt das Access-Token aus dem localStorage
 */
export const getToken = (): string | null => {
  const sessionToken = SessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) {
    return sessionToken;
  }

  // Falls nicht gefunden, in localStorage prüfen (langfristig)
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Entfernt das Access-Token aus dem localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  SessionStorage.removeItem(TOKEN_KEY);
  SessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (
  refreshToken: string,
  useSessionStorage: boolean = false
): void => {
  if (useSessionStorage) {
    SessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * Holt das Refresh-Token aus dem localStorage
 */
export const getRefreshToken = (): string | null => {
  // Zuerst in sessionStorage prüfen (aktuelle Session)
  const sessionRefreshToken = SessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (sessionRefreshToken) {
    return sessionRefreshToken;
  }

  // Falls nicht gefunden, in localStorage prüfen (langfristig)
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};
