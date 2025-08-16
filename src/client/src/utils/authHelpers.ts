// src/utils/authHelpers.ts
import { SessionStorage } from "./sessionStorage";

// ----- Keys & constants -----
const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_TIMESTAMP_KEY = "token_timestamp";
const REMEMBER_ME_KEY = "remember_me";

// 5 Minuten Puffer
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

// ----- Types -----
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

// ----- Base64URL helper -----
const b64urlToUtf8 = (input: string): string => {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const bin = atob(padded);
  try {
    const bytes = Uint8Array.from({ length: bin.length }, (_, i) => bin.charCodeAt(i));
    return new TextDecoder().decode(bytes);
  } catch {
    return bin;
  }
};

// ----- Token speichern -----
export const setToken = (token: string, storageType: "session" | "permanent" = "session"): void => {
  try {
    if (!token?.trim()) return;

    const timestamp = String(Date.now());
    const encryptedToken = token; // optional: encryptData(token)

    if (storageType === "session") {
      SessionStorage.setItem(TOKEN_KEY, encryptedToken);
      SessionStorage.setItem(TOKEN_TIMESTAMP_KEY, timestamp);
      SessionStorage.setItem(REMEMBER_ME_KEY, "false");

      localStorage?.removeItem(TOKEN_KEY);
      localStorage?.removeItem(TOKEN_TIMESTAMP_KEY);
      localStorage?.removeItem(REMEMBER_ME_KEY);
    } else {
      localStorage?.setItem(TOKEN_KEY, encryptedToken);
      localStorage?.setItem(TOKEN_TIMESTAMP_KEY, timestamp);
      localStorage?.setItem(REMEMBER_ME_KEY, "true");

      SessionStorage.removeItem(TOKEN_KEY);
      SessionStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      SessionStorage.removeItem(REMEMBER_ME_KEY);
    }
  } catch (error) {
    console.error("Error storing token:", error);
  }
};

// ----- Token lesen -----
export const getToken = (): string | null => {
  try {
    let token = SessionStorage.getItem(TOKEN_KEY);
    let ts = SessionStorage.getItem(TOKEN_TIMESTAMP_KEY);

    if (!token) {
      token = localStorage?.getItem(TOKEN_KEY) ?? null;
      ts = localStorage?.getItem(TOKEN_TIMESTAMP_KEY) ?? ts;
    }
    if (!token) return null;

    const storedTs = ts ? Number(ts) : undefined;
    if (isTokenExpired(token, storedTs)) {
      removeToken();
      return null;
    }
    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

// ----- Refresh-Token speichern/lesen -----
export const setRefreshToken = (refreshToken: string, storageType: "session" | "permanent" = "session"): void => {
  try {
    if (!refreshToken?.trim()) return;

    const encrypted = refreshToken; // optional: encryptData(refreshToken)
    if (storageType === "session") {
      SessionStorage.setItem(REFRESH_TOKEN_KEY, encrypted);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      localStorage.setItem(REFRESH_TOKEN_KEY, encrypted);
      SessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error storing refresh token:", error);
  }
};

export const getRefreshToken = (): string | null => {
  try {
    let v = SessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!v) v = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!v) return null;

    const rt = v; // optional: decryptData(v)
    return rt || null;
  } catch (error) {
    console.error("Error retrieving refresh token:", error);
    return null;
  }
};

// ----- Remove all -----
export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);

    SessionStorage.removeItem(TOKEN_KEY);
    SessionStorage.removeItem(REFRESH_TOKEN_KEY);
    SessionStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    SessionStorage.removeItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.error("Error removing tokens:", error);
  }
};

// ----- Remember me -----
export const isRememberMeEnabled = (): boolean => {
  try {
    const v = localStorage.getItem(REMEMBER_ME_KEY) ?? SessionStorage.getItem(REMEMBER_ME_KEY);
    return v === "true";
  } catch (error) {
    console.error("Error checking remember me status:", error);
    return false;
  }
};

// ----- JWT decode -----
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = b64urlToUtf8(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// ----- Expiry -----
export const isTokenExpired = (token: string, storedTimestamp?: number): boolean => {
  try {
    const decoded = decodeToken(token);
    const nowSec = Math.floor(Date.now() / 1000);
    const bufferSec = TOKEN_EXPIRY_BUFFER / 1000;

    if (decoded?.exp && Number.isFinite(decoded.exp)) {
      return nowSec >= decoded.exp - bufferSec;
    }

    if (typeof storedTimestamp === "number" && Number.isFinite(storedTimestamp)) {
      const tokenAge = Date.now() - storedTimestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24h
      return tokenAge > maxAge;
    }

    // Wenn keine valide Info vorhanden ist, nicht vorschnell verwerfen
    return false;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return false;
  }
};

export const getTokenExpiration = (token: string): number | null => {
  try {
    const decoded = decodeToken(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
  } catch (error) {
    console.error("Error getting token expiration:", error);
    return null;
  }
};

export const getTimeUntilExpiration = (token: string): number | null => {
  try {
    const exp = getTokenExpiration(token);
    if (!exp) return null;
    const diff = exp - Date.now();
    return diff > 0 ? diff : null;
  } catch (error) {
    console.error("Error calculating time until expiration:", error);
    return null;
  }
};

// ----- Format check -----
export const isValidTokenFormat = (token: string): boolean => {
  try {
    if (typeof token !== "string" || !token.includes(".")) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    return decodeToken(token) !== null;
  } catch {
    return false;
  }
};

// ----- Migration -----
export const migrateTokenStorage = (storageType: "session" | "permanent"): void => {
  try {
    const token = getToken();
    const rt = getRefreshToken();
    if (token || rt) {
      removeToken();
      if (token) setToken(token, storageType);
      if (rt) setRefreshToken(rt, storageType);
    }
  } catch (error) {
    console.error("Error migrating token storage:", error);
  }
};

// ----- Claims helpers -----
export const getUserIdFromToken = (token?: string): string | null => {
  try {
    const t = token || getToken();
    if (!t) return null;
    const d = decodeToken(t);
    return (d?.sub as string) || (d?.userId as string) || (d?.id as string) || null;
  } catch (error) {
    console.error("Error getting user ID from token:", error);
    return null;
  }
};

export const getUserRolesFromToken = (token?: string): string[] => {
  try {
    const t = token || getToken();
    if (!t) return [];
    const d = decodeToken(t);
    const roles = (d?.roles || d?.authorities || d?.permissions) as unknown;
    return Array.isArray(roles) ? roles.filter((x): x is string => typeof x === "string") : [];
  } catch (error) {
    console.error("Error getting user roles from token:", error);
    return [];
  }
};

export const hasRole = (role: string, token?: string): boolean => {
  try {
    return getUserRolesFromToken(token).includes(role);
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
};

// ----- Cleanup -----
export const cleanupExpiredTokens = (): void => {
  try {
    const t = getToken();
    if (t && isTokenExpired(t)) removeToken();
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
};

// ----- Debug info -----
export const getStorageInfo = (): {
  hasToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiration: number | null;
  timeUntilExpiration: number | null;
  isRemembered: boolean;
  storageType: "localStorage" | "sessionStorage" | "none";
} => {
  try {
    const t = getToken();
    const rt = getRefreshToken();
    const isRemembered = isRememberMeEnabled();

    let storageType: "localStorage" | "sessionStorage" | "none" = "none";
    if (SessionStorage.getItem(TOKEN_KEY)) storageType = "sessionStorage";
    else if (localStorage.getItem(TOKEN_KEY)) storageType = "localStorage";

    return {
      hasToken: !!t,
      hasRefreshToken: !!rt,
      tokenExpiration: t ? getTokenExpiration(t) : null,
      timeUntilExpiration: t ? getTimeUntilExpiration(t) : null,
      isRemembered,
      storageType
    };
  } catch (error) {
    console.error("Error getting storage info:", error);
    return {
      hasToken: false,
      hasRefreshToken: false,
      tokenExpiration: null,
      timeUntilExpiration: null,
      isRemembered: false,
      storageType: "none"
    };
  }
};
