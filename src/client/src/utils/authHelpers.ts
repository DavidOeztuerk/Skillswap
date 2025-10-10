import { SessionStorage } from "./sessionStorage";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_TIMESTAMP_KEY = "token_timestamp";
const REMEMBER_ME_KEY = "remember_me";

export const setToken = (token: string, storageType: "session" | "permanent" = "session"): void => {
  try {
    if (!token?.trim()) return;

    const timestamp = String(Date.now());

    if (storageType === "session") {
      SessionStorage.setItem(TOKEN_KEY, token);
      SessionStorage.setItem(TOKEN_TIMESTAMP_KEY, timestamp);
      SessionStorage.setItem(REMEMBER_ME_KEY, "false");

      localStorage?.removeItem(TOKEN_KEY);
      localStorage?.removeItem(TOKEN_TIMESTAMP_KEY);
      localStorage?.removeItem(REMEMBER_ME_KEY);
    } else {
      localStorage?.setItem(TOKEN_KEY, token);
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

export const getToken = (): string | null => {
  try {
    let token = SessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = localStorage?.getItem(TOKEN_KEY) ?? null;
    }
    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

export const setRefreshToken = (refreshToken: string, storageType: "session" | "permanent" = "session"): void => {
  try {
    if (!refreshToken?.trim()) return;

    if (storageType === "session") {
      SessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      SessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error storing refresh token:", error);
  }
};

export const getRefreshToken = (): string | null => {
  try {
    let refreshToken = SessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return refreshToken || null;
  } catch (error) {
    console.error("Error retrieving refresh token:", error);
    return null;
  }
};

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

export const isRememberMeEnabled = (): boolean => {
  try {
    const value = localStorage.getItem(REMEMBER_ME_KEY) ?? SessionStorage.getItem(REMEMBER_ME_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error checking remember me status:", error);
    return false;
  }
};

export const getStorageInfo = (): {
  hasToken: boolean;
  hasRefreshToken: boolean;
  isRemembered: boolean;
  storageType: "localStorage" | "sessionStorage" | "none";
} => {
  try {
    const token = getToken();
    const refreshToken = getRefreshToken();
    const isRemembered = isRememberMeEnabled();

    let storageType: "localStorage" | "sessionStorage" | "none" = "none";
    if (SessionStorage.getItem(TOKEN_KEY)) storageType = "sessionStorage";
    else if (localStorage.getItem(TOKEN_KEY)) storageType = "localStorage";

    return {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      isRemembered,
      storageType
    };
  } catch (error) {
    console.error("Error getting storage info:", error);
    return {
      hasToken: false,
      hasRefreshToken: false,
      isRemembered: false,
      storageType: "none"
    };
  }
};

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

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = b64urlToUtf8(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
};

export const getTimeUntilExpiration = (token: string): number | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return null;
    const expMs = decoded.exp * 1000;
    const diff = expMs - Date.now();
    return diff > 0 ? diff : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const timeLeft = getTimeUntilExpiration(token);
    return timeLeft === null || timeLeft <= 0;
  } catch {
    return true;
  }
};
