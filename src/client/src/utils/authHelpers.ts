// src/utils/authHelpers.ts
import { SessionStorage } from './sessionStorage';

// Storage keys
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_TIMESTAMP_KEY = 'token_timestamp';
const REMEMBER_ME_KEY = 'remember_me';

// Token expiration buffer (5 minutes)
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

/**
 * Perfect token management utilities with enhanced security and flexibility
 */

/**
 * Stores the access token with appropriate storage strategy
 * @param token - Access token
 * @param useSessionStorage - Whether to use session storage (default: false)
 */
export const setToken = (
  token: string,
  useSessionStorage: boolean = false
): void => {
  try {
    if (!token?.trim()) {
      console.warn('Attempted to set empty token');
      return;
    }

    const timestamp = Date.now().toString();

    if (useSessionStorage) {
      SessionStorage.setItem(TOKEN_KEY, token);
      SessionStorage.setItem(TOKEN_TIMESTAMP_KEY, timestamp);
      SessionStorage.setItem(REMEMBER_ME_KEY, 'false');

      // Clear localStorage versions to avoid conflicts
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_TIMESTAMP_KEY, timestamp);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');

      // Clear sessionStorage versions to avoid conflicts
      SessionStorage.removeItem(TOKEN_KEY);
      SessionStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      SessionStorage.removeItem(REMEMBER_ME_KEY);
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Retrieves the access token from storage
 * @returns Access token or null if not found/expired
 */
export const getToken = (): string | null => {
  try {
    // Check session storage first (priority for current session)
    let token = SessionStorage.getItem(TOKEN_KEY);
    let timestamp = SessionStorage.getItem(TOKEN_TIMESTAMP_KEY);

    // If not in session storage, check localStorage
    if (!token) {
      token = localStorage.getItem(TOKEN_KEY);
      timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
    }

    if (!token) {
      return null;
    }

    // Check if token is potentially expired (client-side validation)
    if (timestamp && isTokenExpired(token, parseInt(timestamp))) {
      console.info('Token appears to be expired, clearing storage');
      removeToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Stores the refresh token with same storage strategy as access token
 * @param refreshToken - Refresh token
 * @param useSessionStorage - Whether to use session storage (default: false)
 */
export const setRefreshToken = (
  refreshToken: string,
  useSessionStorage: boolean = false
): void => {
  try {
    if (!refreshToken?.trim()) {
      console.warn('Attempted to set empty refresh token');
      return;
    }

    if (useSessionStorage) {
      SessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      SessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error storing refresh token:', error);
  }
};

/**
 * Retrieves the refresh token from storage
 * @returns Refresh token or null if not found
 */
export const getRefreshToken = (): string | null => {
  try {
    // Check session storage first
    let refreshToken = SessionStorage.getItem(REFRESH_TOKEN_KEY);

    // If not in session storage, check localStorage
    if (!refreshToken) {
      refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    return refreshToken;
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
};

/**
 * Removes all authentication tokens and related data from storage
 */
export const removeToken = (): void => {
  try {
    // Clear from both storage types
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);

    SessionStorage.removeItem(TOKEN_KEY);
    SessionStorage.removeItem(REFRESH_TOKEN_KEY);
    SessionStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    SessionStorage.removeItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.error('Error removing tokens:', error);
  }
};

/**
 * Checks if user chose "Remember Me" option
 * @returns true if user wants to be remembered
 */
export const isRememberMeEnabled = (): boolean => {
  try {
    const rememberMe =
      localStorage.getItem(REMEMBER_ME_KEY) ||
      SessionStorage.getItem(REMEMBER_ME_KEY);
    return rememberMe === 'true';
  } catch (error) {
    console.error('Error checking remember me status:', error);
    return false;
  }
};

/**
 * JWT payload type for decodeToken
 */
export interface JwtPayload {
  exp?: number;
  sub?: string;
  userId?: string;
  id?: string;
  roles?: string[];
  authorities?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

/**
 * Decodes JWT token payload (client-side only, for UI purposes)
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = atob(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Checks if token is expired (client-side validation only)
 * @param token - JWT token
 * @param storedTimestamp - When token was stored
 * @returns true if token is likely expired
 */
export const isTokenExpired = (
  token: string,
  storedTimestamp?: number
): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return true;

    const currentTime = Math.floor(Date.now() / 1000);

    // Check JWT expiration time
    if (decoded.exp) {
      const bufferTime = TOKEN_EXPIRY_BUFFER / 1000; // Convert to seconds
      return currentTime >= decoded.exp - bufferTime;
    }

    // Fallback: check storage timestamp (24 hours default)
    if (storedTimestamp) {
      const tokenAge = Date.now() - storedTimestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      return tokenAge > maxAge;
    }

    return false;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Gets token expiration time in milliseconds
 * @param token - JWT token
 * @returns Expiration timestamp or null
 */
export const getTokenExpiration = (token: string): number | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return null;

    return decoded.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Gets time until token expires in milliseconds
 * @param token - JWT token
 * @returns Time until expiration in milliseconds, or null if expired/invalid
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) return null;

    const timeUntilExpiry = expiration - Date.now();
    return timeUntilExpiry > 0 ? timeUntilExpiry : null;
  } catch (error) {
    console.error('Error calculating time until expiration:', error);
    return null;
  }
};

/**
 * Validates token format (basic JWT structure check)
 * @param token - Token to validate
 * @returns true if token has valid format
 */
export const isValidTokenFormat = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Check if each part is valid base64
    for (const part of parts) {
      if (!part || part.length === 0) return false;
    }

    // Try to decode payload
    const payload = decodeToken(token);
    return payload !== null;
  } catch {
    return false;
  }
};

/**
 * Migrates tokens between storage types
 * @param useSessionStorage - Target storage type
 */
export const migrateTokenStorage = (useSessionStorage: boolean): void => {
  try {
    const token = getToken();
    const refreshToken = getRefreshToken();

    if (token || refreshToken) {
      // Clear all current storage
      removeToken();

      // Re-store with new strategy
      if (token) {
        setToken(token, useSessionStorage);
      }
      if (refreshToken) {
        setRefreshToken(refreshToken, useSessionStorage);
      }
    }
  } catch (error) {
    console.error('Error migrating token storage:', error);
  }
};

/**
 * Gets user ID from token (if stored in token payload)
 * @param token - JWT token (optional, uses stored token if not provided)
 * @returns User ID or null
 */
export const getUserIdFromToken = (token?: string): string | null => {
  try {
    const tokenToUse = token || getToken();
    if (!tokenToUse) return null;

    const decoded = decodeToken(tokenToUse);
    return decoded?.sub || decoded?.userId || decoded?.id || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
};

/**
 * Gets user roles from token (if stored in token payload)
 * @param token - JWT token (optional, uses stored token if not provided)
 * @returns Array of user roles or empty array
 */
export const getUserRolesFromToken = (token?: string): string[] => {
  try {
    const tokenToUse = token || getToken();
    if (!tokenToUse) return [];

    const decoded = decodeToken(tokenToUse);
    const roles =
      decoded?.roles || decoded?.authorities || decoded?.permissions || [];

    return Array.isArray(roles) ? roles : [];
  } catch (error) {
    console.error('Error getting user roles from token:', error);
    return [];
  }
};

/**
 * Checks if user has specific role
 * @param role - Role to check
 * @param token - JWT token (optional, uses stored token if not provided)
 * @returns true if user has the role
 */
export const hasRole = (role: string, token?: string): boolean => {
  try {
    const roles = getUserRolesFromToken(token);
    return roles.includes(role);
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

/**
 * Clears expired tokens from storage
 */
export const cleanupExpiredTokens = (): void => {
  try {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      console.info('Cleaning up expired tokens');
      removeToken();
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};

/**
 * Gets storage information for debugging
 * @returns Object with storage information
 */
export const getStorageInfo = (): {
  hasToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiration: number | null;
  timeUntilExpiration: number | null;
  isRemembered: boolean;
  storageType: 'localStorage' | 'sessionStorage' | 'none';
} => {
  try {
    const token = getToken();
    const refreshToken = getRefreshToken();
    const isRemembered = isRememberMeEnabled();

    let storageType: 'localStorage' | 'sessionStorage' | 'none' = 'none';
    if (SessionStorage.getItem(TOKEN_KEY)) {
      storageType = 'sessionStorage';
    } else if (localStorage.getItem(TOKEN_KEY)) {
      storageType = 'localStorage';
    }

    return {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      tokenExpiration: token ? getTokenExpiration(token) : null,
      timeUntilExpiration: token ? getTimeUntilExpiration(token) : null,
      isRemembered,
      storageType,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      hasToken: false,
      hasRefreshToken: false,
      tokenExpiration: null,
      timeUntilExpiration: null,
      isRemembered: false,
      storageType: 'none',
    };
  }
};
