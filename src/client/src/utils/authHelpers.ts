// src/utils/authHelpers.ts

/**
 * Name des Cookies/LocalStorage Keys für das Auth-Token
 */
const TOKEN_KEY = import.meta.env.VITE_AUTH_COOKIE_NAME || 'skillswap_token';

/**
 * Speichert das Token im LocalStorage
 * @param token - Das JWT-Token als String
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Holt das Token aus dem LocalStorage
 * @returns Das gespeicherte Token oder null, wenn kein Token vorhanden ist
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Entfernt das Token aus dem LocalStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Überprüft, ob ein Token im LocalStorage vorhanden ist
 * @returns true, wenn ein Token vorhanden ist, sonst false
 */
export const hasToken = (): boolean => {
  return !!getToken();
};

/**
 * Überprüft, ob ein Token gültig ist (nicht abgelaufen)
 * @returns true, wenn das Token gültig ist, sonst false
 */
export const isTokenValid = (): boolean => {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    // Token hat das Format: header.payload.signature
    const payloadBase64 = token.split('.')[1];

    if (!payloadBase64) {
      return false;
    }

    // Base64 URL-safe decode des Payload
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload: { exp?: number } = JSON.parse(jsonPayload);

    // Überprüfe, ob das Token ein Ablaufdatum hat und ob es abgelaufen ist
    if (payload.exp) {
      return payload.exp * 1000 > Date.now();
    }

    return true;
  } catch (error) {
    // Bei Fehlern beim Parsen des Tokens geben wir false zurück
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Dekodiert die Nutzerdaten aus dem JWT-Token
 * @returns Dekodierte Nutzerdaten oder null, wenn kein gültiges Token vorhanden ist
 */
export const getDecodedToken = <T>(): T | null => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    // Token hat das Format: header.payload.signature
    const payloadBase64 = token.split('.')[1];

    if (!payloadBase64) {
      return null;
    }

    // Base64 URL-safe decode des Payload
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
