// src/client/src/api/apiClient.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig
} from "axios";
import { API_BASE_URL, AUTH_ENDPOINTS } from "../config/endpoints";
import { API_TIMEOUT } from "../config/constants";
import { getToken, getRefreshToken, setToken, setRefreshToken, removeToken } from "../utils/authHelpers";
import { router } from "../routes/Router";

// ---- deine Typen bitte aus deinem Projekt importieren ----
// import type { ApiResponse } from "../types/common/ApiResponse";
// import type { PagedResponse } from "../types/common/PagedResponse";

// ---- Refresh-Contracts (Server kann beides liefern: flach oder enveloped) ----
type RefreshTokens = { accessToken: string; refreshToken?: string };
type MaybeEnvelope<T> = { success?: boolean; data?: T; [k: string]: unknown } | T;
const unwrap = <T>(v: MaybeEnvelope<T>): T => (typeof v === "object" && v && "data" in v ? (v as any).data as T : (v as T));

// ---- Request-Extras ----
type RequestExtras = { retries?: number; retryDelay?: number; skipAuth?: boolean; _retry?: boolean };
export type RequestConfig = AxiosRequestConfig & RequestExtras;

// ---- Axios-Instanz ----
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT
});

// ---- Request-Interceptor (Axios v1 korrekt typisiert) ----
api.interceptors.request.use((config: InternalAxiosRequestConfig & RequestExtras) => {
  config.headers = AxiosHeaders.from(config.headers) as AxiosRequestHeaders;

  const token = getToken();
  if (token && !config.skipAuth) {
    (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  }

  if (!(config.data instanceof FormData)) {
    (config.headers as AxiosHeaders).set("Content-Type", "application/json");
  }

  if (import.meta.env.DEV) {
    console.debug("🚀 Request:", { url: config.url, method: config.method, params: config.params });
  }
  return config;
});

// ---- Response-Interceptor (401 Refresh-Queue) ----
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
const subscribeTokenRefresh = (cb: (t: string) => void) => refreshSubscribers.push(cb);
const onRefreshed = (t: string) => { refreshSubscribers.forEach(cb => cb(t)); refreshSubscribers = []; };

api.interceptors.response.use(
  r => {
    if (import.meta.env.DEV) console.debug("✅ Response:", r.status, r.config.url);
    return r;
  },
  async (err: AxiosError) => {
    const original = (err.config ?? {}) as InternalAxiosRequestConfig & RequestExtras;

    // Don't try to refresh token for login/register endpoints
    const isAuthEndpoint = original.url?.includes('/login') || original.url?.includes('/register');
    
    if (err.response?.status === 401 && !original._retry && !original.skipAuth && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            original.headers = AxiosHeaders.from(original.headers) as AxiosRequestHeaders;
            (original.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const rt = getRefreshToken();
        if (!rt) throw new Error("No refresh token");

        // Wichtig: native axios, um Interceptor-Loop zu vermeiden
        const res = await axios.post<MaybeEnvelope<RefreshTokens>>(
          `${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH_TOKEN}`,
          { accessToken: getToken(), refreshToken: rt },
          { headers: new AxiosHeaders({ "Content-Type": "application/json" }) }
        );

        const { accessToken, refreshToken } = unwrap<RefreshTokens>(res.data);
        const storage = localStorage.getItem("remember_me") === "true" ? "permanent" : "session";
        setToken(accessToken, storage);
        if (refreshToken) setRefreshToken(refreshToken, storage);

        onRefreshed(accessToken);
        isRefreshing = false;

        original.headers = AxiosHeaders.from(original.headers) as AxiosRequestHeaders;
        (original.headers as AxiosHeaders).set("Authorization", `Bearer ${accessToken}`);

        return api(original);
      } catch (e) {
        isRefreshing = false;
        removeToken();
        router.navigate("/auth/login");
        return Promise.reject(e);
      }
    }

    if (err.response?.status === 429 && import.meta.env.DEV) {
      const retryAfter = err.response.headers?.["retry-after"];
      console.warn(`⚠️ Rate limited. Retry after ${retryAfter ?? 60}s`);
    }

    if (!err.response && import.meta.env.DEV) console.error("🔌 Network Error");
    return Promise.reject(err);
  }
);

// ---- Lean Client: du gibst T vor (ApiResponse<X> ODER PagedResponse<Y> ODER raw) ----
class ApiClient {
  async get<T>(url: string, params?: Record<string, unknown>, config?: RequestConfig): Promise<T> {
    const res = await api.get<T>(url, { ...config, params });
    return res.data;
  }
  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const res = await api.post<T>(url, data, config);
    return res.data;
  }
  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const res = await api.put<T>(url, data, config);
    return res.data;
  }
  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const res = await api.patch<T>(url, data, config);
    return res.data;
  }
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const res = await api.delete<T>(url, config);
    return res.data;
  }

  async uploadFile<T>(url: string, fileOrForm: File | FormData, onProgress?: (progress: number) => void): Promise<T> {
    const formData = fileOrForm instanceof FormData
      ? fileOrForm
      : (() => { const fd = new FormData(); fd.append("file", fileOrForm); return fd; })();

    const res = await api.post<T>(url, formData, {
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    return res.data;
  }
}

const apiClient = new ApiClient();

// optional: Prod-Error-Hook
api.interceptors.response.use(r => r, e => {
  if (import.meta.env.PROD) {
    // window.Sentry?.captureException?.(e);
  }
  return Promise.reject(e);
});

export default apiClient;
export { api };
