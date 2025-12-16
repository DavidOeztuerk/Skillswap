import { SessionStorage } from './sessionStorage';

// ============================================
// CONSTANTS
// ============================================

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_TIMESTAMP_KEY = 'token_timestamp';
const REMEMBER_ME_KEY = 'remember_me';

// Debug mode - only log in development
const DEBUG = import.meta.env.DEV;

// ============================================
// TOKEN STORAGE
// ============================================

/**
 * Store access token in session or local storage
 */
export const setToken = (token: string, storageType: 'session' | 'permanent' = 'session'): void => {
  if (token.trim() === '') return;

  try {
    const timestamp = String(Date.now());

    if (storageType === 'session') {
      SessionStorage.setItem(TOKEN_KEY, token);
      SessionStorage.setItem(TOKEN_TIMESTAMP_KEY, timestamp);
      SessionStorage.setItem(REMEMBER_ME_KEY, 'false');

      // Clear from permanent storage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_TIMESTAMP_KEY, timestamp);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');

      // Clear from session storage
      SessionStorage.removeItem(TOKEN_KEY);
      SessionStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      SessionStorage.removeItem(REMEMBER_ME_KEY);
    }

    if (DEBUG) {
      console.debug(`🔐 Token stored in ${storageType} storage`);
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Get access token from storage
 */
export const getToken = (): string | null => {
  try {
    // Check session storage first
    let token = SessionStorage.getItem(TOKEN_KEY);
    token ??= localStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Store refresh token
 */
export const setRefreshToken = (
  refreshToken: string,
  storageType: 'session' | 'permanent' = 'session'
): void => {
  if (refreshToken.trim() === '') return;

  try {
    if (storageType === 'session') {
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
 * Get refresh token from storage
 */
export const getRefreshToken = (): string | null => {
  try {
    let refreshToken = SessionStorage.getItem(REFRESH_TOKEN_KEY);
    refreshToken ??= localStorage.getItem(REFRESH_TOKEN_KEY);
    return refreshToken;
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
};

/**
 * Remove all auth tokens from storage
 */
export const removeToken = (): void => {
  try {
    // Clear from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);

    // Clear from sessionStorage
    SessionStorage.removeItem(TOKEN_KEY);
    SessionStorage.removeItem(REFRESH_TOKEN_KEY);
    SessionStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    SessionStorage.removeItem(REMEMBER_ME_KEY);

    if (DEBUG) {
      console.debug('🔐 All tokens removed');
    }
  } catch (error) {
    console.error('Error removing tokens:', error);
  }
};

// ============================================
// STORAGE INFO
// ============================================

/**
 * Check if remember me is enabled
 */
export const isRememberMeEnabled = (): boolean => {
  try {
    const value = localStorage.getItem(REMEMBER_ME_KEY) ?? SessionStorage.getItem(REMEMBER_ME_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking remember me status:', error);
    return false;
  }
};

/**
 * Get comprehensive storage info for debugging
 */
export const getStorageInfo = (): {
  hasToken: boolean;
  hasRefreshToken: boolean;
  isRemembered: boolean;
  storageType: 'localStorage' | 'sessionStorage' | 'none';
} => {
  try {
    const token = getToken();
    const refreshToken = getRefreshToken();
    const isRemembered = isRememberMeEnabled();

    let storageType: 'localStorage' | 'sessionStorage' | 'none' = 'none';
    if (SessionStorage.getItem(TOKEN_KEY) !== null) {
      storageType = 'sessionStorage';
    } else if (localStorage.getItem(TOKEN_KEY) !== null) {
      storageType = 'localStorage';
    }

    return {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      isRemembered,
      storageType,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      hasToken: false,
      hasRefreshToken: false,
      isRemembered: false,
      storageType: 'none',
    };
  }
};

// ============================================
// JWT DECODING
// ============================================

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
  roles?: string[];
  authorities?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

/**
 * Convert base64url to UTF-8 string
 */
const b64urlToUtf8 = (input: string): string => {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const bin = atob(padded);

  try {
    const bytes = Uint8Array.from({ length: bin.length }, (_, i) => bin.charCodeAt(i));
    return new TextDecoder().decode(bytes);
  } catch {
    return bin;
  }
};

/**
 * Decode JWT token without verification
 * Note: This only decodes, it does NOT verify the signature
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadJson = b64urlToUtf8(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Get time until token expiration in milliseconds
 * Returns null if token is invalid or has no expiration
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  try {
    const decoded = decodeToken(token);

    if (decoded?.exp === undefined) {
      if (DEBUG) {
        console.debug('🔐 Token has no exp claim');
      }
      return null;
    }

    const expMs = decoded.exp * 1000;
    const now = Date.now();
    const diff = expMs - now;

    if (DEBUG) {
      console.debug('🔐 Token expires in:', Math.round(diff / 60000), 'minutes');
    }

    return diff > 0 ? diff : null;
  } catch (error) {
    if (DEBUG) {
      console.error('🔐 Error in getTimeUntilExpiration:', error);
    }
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const timeLeft = getTimeUntilExpiration(token);
    return timeLeft === null || timeLeft <= 0;
  } catch {
    return true;
  }
};

/**
 * Check if token is about to expire (within buffer time)
 * @param token - JWT token
 * @param bufferMs - Buffer time in milliseconds (default: 5 minutes)
 */
export const isTokenExpiringSoon = (token: string, bufferMs: number = 5 * 60 * 1000): boolean => {
  try {
    const timeLeft = getTimeUntilExpiration(token);
    return timeLeft === null || timeLeft <= bufferMs;
  } catch {
    return true;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract user ID from stored token
 */
export const getUserIdFromToken = (): string | null => {
  const token = getToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  return decoded?.userId ?? decoded?.sub ?? decoded?.id ?? null;
};

/**
 * Extract roles from stored token
 */
export const getRolesFromToken = (): string[] => {
  const token = getToken();
  if (!token) return [];

  const decoded = decodeToken(token);
  return decoded?.roles ?? decoded?.authorities ?? [];
};

/**
 * Check if current token has a specific role
 */
export const hasRole = (role: string): boolean => {
  const roles = getRolesFromToken();
  return roles.some((r) => r.toLowerCase() === role.toLowerCase());
};
