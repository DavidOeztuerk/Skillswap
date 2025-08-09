import axios, { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL, AUTH_ENDPOINTS } from "../config/endpoints";
import { API_TIMEOUT } from "../config/constants";
import { getToken, getRefreshToken, setToken, setRefreshToken, removeToken } from "../utils/authHelpers";
import { router } from "../routes/Router";

// ---- Helpers (leichtgewichtig, lokal) ----
type ApiEnvelope<T> = { data?: T; message?: string; [k: string]: any };
const isApiResponse = <T = unknown>(v: any): v is ApiEnvelope<T> => v && (typeof v === "object") && ("data" in v || "message" in v);
// const withDefault = <T>(val: T | undefined | null, fallback: T): T => (val == null ? fallback : val);

// ---- Axios-Instanz ----
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { "Content-Type": "application/json" }
});

// ---- Token-Refresh Queue ----
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
const subscribeTokenRefresh = (cb: (token: string) => void) => refreshSubscribers.push(cb);
const onRefreshed = (token: string) => { refreshSubscribers.forEach(cb => cb(token)); refreshSubscribers = []; };

// ---- Request Interceptor (Token anfügen) ----
api.interceptors.request.use((config) => {
  const token = getToken();
  const skipAuth = (config as any).skipAuth as boolean | undefined;

  if (token && !skipAuth) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = new AxiosHeaders(config.headers);
      (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
    }
  }

  if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers);
  }
  (config.headers as AxiosHeaders).set("Content-Type", "application/json");

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("🚀 Request:", { url: config.url, method: config.method, params: config.params });
  }
  return config;
});

// ---- Response Interceptor (401/Refresh, 429-Hinweis) ----
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("✅ Response:", response.status, response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean });

    // 401 -> Refresh Flow
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders();
            if (originalRequest.headers instanceof AxiosHeaders) {
              originalRequest.headers.set("Authorization", `Bearer ${token}`);
            } else {
              (originalRequest.headers as any).Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
          accessToken: getToken(),
          refreshToken
        });

        const newToken =
          res.data?.data?.accessToken ??
          res.data?.accessToken;

        const storageType = localStorage.getItem("remember_me") === "true" ? "permanent" : "session";
        setToken(newToken, storageType);

        const newRt = res.data?.data?.refreshToken ?? res.data?.refreshToken;
        if (newRt) setRefreshToken(newRt, storageType);

        onRefreshed(newToken);
        isRefreshing = false;

        if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders();
        if (originalRequest.headers instanceof AxiosHeaders) {
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        } else {
          (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (e) {
        removeToken();
        isRefreshing = false;
        router.navigate("/auth/login");
        return Promise.reject(e);
      }
    }

    // 429 -> Hinweis
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.["retry-after"];
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️ Rate limited. Retry after ${retryAfter ?? 60}s`);
      }
    }

    // Netzwerkfehler
    if (!error.response) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("🔌 Network Error - Check connection");
      }
    }

    return Promise.reject(error);
  }
);

// ---- ApiClient mit Cache + Request-Dedup + Upload ----
interface CacheEntry<T> { data: T; timestamp: number; etag?: string }
interface PendingRequest { promise: Promise<any>; abortController?: AbortController }

export interface RequestConfig extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

class ApiClient {
  private cache = new Map<string, CacheEntry<any>>();
  private pending = new Map<string, PendingRequest>();

  private readonly CACHE_CONFIG: Record<string, number> = {
    "/api/config": 5 * 60 * 1000,
    "/api/user/profile": 2 * 60 * 1000,
    "/api/translations": 30 * 60 * 1000,
    "/api/countries": 60 * 60 * 1000
  };

  private shouldCache(url: string): number | false {
    for (const [pattern, ttl] of Object.entries(this.CACHE_CONFIG)) {
      if (url?.includes(pattern)) return ttl;
    }
    return false;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const pattern = Object.keys(this.CACHE_CONFIG).find(p => key?.includes(p));
    const ttl = pattern ? this.CACHE_CONFIG[pattern] : 0;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
    }

  private createKey(method: string, url: string, data?: unknown, params?: unknown): string {
    const body = data ? JSON.stringify(data) : "";
    const p = params ? JSON.stringify(params) : "";
    return `${method}:${url}:${body}:${p}`;
  }

  private async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    abortController?: AbortController
  ): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug("🔄 Reusing pending request:", key);
      }
      return existing.promise;
    }

    const promise = requestFn().finally(() => this.pending.delete(key));
    this.pending.set(key, { promise, abortController });
    return promise;
  }

  cancelRequest(key: string) {
    const p = this.pending.get(key);
    p?.abortController?.abort();
    this.pending.delete(key);
  }

  cancelAll() {
    this.pending.forEach(p => p.abortController?.abort());
    this.pending.clear();
  }

  clearCache() {
    this.cache.clear();
  }

  private invalidateCache(url: string) {
    const rules: Record<string, string[]> = {
      "/user": ["/user/profile", "/user/settings"],
      "/posts": ["/posts", "/feed"],
      "/comments": ["/posts", "/comments"]
    };

    for (const [pattern, targets] of Object.entries(rules)) {
      if (url?.includes(pattern)) {
        targets.forEach(t => {
          for (const key of this.cache.keys()) {
            if (key?.includes(t)) {
              this.cache.delete(key);
              if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.debug("🗑️ Cache invalidated:", key);
              }
            }
          }
        });
      }
    }
  }

  private async request<T>(
    method: AxiosRequestConfig["method"],
    url: string,
    data?: unknown,
    cfg?: RequestConfig
  ): Promise<T> {
    const controller = new AbortController();
    const config: AxiosRequestConfig = {
      method,
      url,
      data,
      params: cfg?.params,
      headers: cfg?.headers,
      signal: controller.signal,
      timeout: cfg?.timeout ?? API_TIMEOUT
    };

    const key = this.createKey(String(method ?? "GET"), url, data, config.params);

    return this.deduplicate<T>(
      key,
      async () => {
        // Cache (nur GET)
        if ((method ?? "GET").toUpperCase() === "GET" && this.shouldCache(url)) {
          const cached = this.getFromCache<T>(url);
          if (cached !== null) {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.debug("✨ Cache hit:", url);
            }
            return cached;
          }
        }

        let res: AxiosResponse<any>;
        try {
          res = await api.request(config);
        } catch (err: any) {
          throw err;
        }

        const payload = isApiResponse(res.data)
          ? (res.data as T) 
          : ({
              success: true,
              data: res.data as unknown,
              message: "",
              errors: [],
              timestamp: new Date().toISOString(),
            } as T);

        if ((method ?? "GET").toUpperCase() === "GET" && this.shouldCache(url)) {
          this.cache.set(url, {
            data: payload,
            timestamp: Date.now(),
            etag: (res.headers?.etag as string | undefined)
          });
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug("💾 Cached:", url);
          }
        }

        return payload;
      },
      controller
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>, config?: RequestConfig) {
    return this.request<T>("GET", url, undefined, { ...config, params });
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig) {
    const r = await this.request<T>("POST", url, data, config);
    this.invalidateCache(url);
    return r;
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig) {
    const r = await this.request<T>("PUT", url, data, config);
    this.invalidateCache(url);
    return r;
  }

  async patch<T>(url: string, data?: unknown, config?: RequestConfig) {
    const r = await this.request<T>("PATCH", url, data, config);
    this.invalidateCache(url);
    return r;
  }

  async delete<T>(url: string, config?: RequestConfig) {
    const r = await this.request<T>("DELETE", url, undefined, config);
    this.invalidateCache(url);
    return r;
  }

  async prefetch<T>(url: string, params?: Record<string, unknown>) {
    try { await this.get<T>(url, params); } catch { /* ignore */ }
  }

  async uploadFile<T>(
    url: string,
    fileOrForm: File | FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = fileOrForm instanceof FormData
      ? fileOrForm
      : (() => { const fd = new FormData(); fd.append("file", fileOrForm); return fd; })();

    const res = await api.post(url, formData, {
      headers: (() => {
        const h = new AxiosHeaders();
        const token = getToken();
        if (token) h.set("Authorization", `Bearer ${token}`);
        // Content-Type für FormData NICHT manuell setzen -> Browser setzt Boundary
        return h;
      })(),
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    return (isApiResponse<T>(res.data) ? res.data.data : res.data) as T;
  }
}

// ---- Singleton + globaler Error-Hook (z.B. Sentry) ----
const apiClient = new ApiClient();

api.interceptors.response.use(
  r => r,
  e => {
    if (import.meta.env.PROD) {
      // window.Sentry?.captureException?.(e);
    }
    return Promise.reject(e);
  }
);

export default apiClient;
export { api }; // optional: rohe Axios-Instanz
