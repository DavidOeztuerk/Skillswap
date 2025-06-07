import { API_TIMEOUT } from '../config/constants';
import { setToken, removeToken, getToken } from '../utils/authHelpers';
import { router } from '../routes/Router';
import { ApiError, ApiResponse } from '../types/common/ApiResponse';
import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/endpoints';

// Interfaces für Request/Response
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  _retry?: boolean;
}

// interface ApiResponse<T> {
//   data: T;
//   status: number;
//   statusText: string;
//   headers: Headers;
// }

interface ApiErrorResponse extends Error {
  response?: {
    status: number;
    data: ApiError;
  };
  request?: {
    url: string;
    config: RequestConfig;
  };
}

interface TokenRefreshResponse {
  token: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(
    baseURL: string,
    defaultHeaders: Record<string, string>,
    timeout: number
  ) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
    this.timeout = timeout;
  }

  private subscribeTokenRefresh(cb: (token: string) => void): void {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async request<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // Headers zusammenführen
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    // Token hinzufügen falls vorhanden
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Request-Logging (Development)
    if (import.meta.env.DEV) {
      console.log('[Request]', {
        url: fullUrl,
        method: config.method || 'GET',
        headers,
        body: config.body,
      });
    }

    // AbortController für Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout || this.timeout
    );

    try {
      const fetchConfig: RequestInit = {
        method: config.method || 'GET',
        headers,
        signal: controller.signal,
      };

      // Body nur bei POST/PUT/PATCH hinzufügen
      if (
        config.body &&
        ['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '')
      ) {
        fetchConfig.body =
          typeof config.body === 'string'
            ? config.body
            : JSON.stringify(config.body);
      }

      const response = await fetch(fullUrl, fetchConfig);
      clearTimeout(timeoutId);

      // Content-Type prüfen für JSON-Parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      let data: T;
      if (isJson) {
        const jsonData = await response.json();
        data = jsonData as T;
      } else {
        const textData = await response.text();
        data = textData as T;
      }

      const apiResponse: ApiResponse<T> = {
        data,
        success: response.ok,
        message: response.statusText,
      };

      // Response-Logging (Development)
      if (import.meta.env.DEV) {
        console.log('[Response]', apiResponse);
      }

      // Fehlerbehandlung für HTTP-Fehler
      if (!response.ok) {
        await this.handleHttpError(response, data, config, url);
      }

      return apiResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      return this.handleRequestError(error, config, url);
    }
  }

  private async handleHttpError<T>(
    response: Response,
    data: T,
    originalConfig: RequestConfig,
    url: string
  ): Promise<ApiResponse<T>> {
    // 401 Unauthorized - Token Refresh
    if (response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      if (!this.isRefreshing) {
        this.isRefreshing = true;

        try {
          const refreshResponse = await this.request<TokenRefreshResponse>(
            AUTH_ENDPOINTS.REFRESH_TOKEN,
            {
              method: 'POST',
              body: { token: getToken() },
            }
          );

          setToken(refreshResponse.data.token);
          this.onRefreshed(refreshResponse.data.token);
          this.isRefreshing = false;

          // Original Request wiederholen
          return await this.request(url, originalConfig);
        } catch (refreshError) {
          this.isRefreshing = false;
          removeToken();
          router.navigate('/login');
          throw refreshError;
        }
      }

      // Auf Token-Refresh warten
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh(async (token: string) => {
          try {
            const retryConfig = {
              ...originalConfig,
              headers: {
                ...originalConfig.headers,
                Authorization: `Bearer ${token}`,
              },
            };
            const result = await this.request<T>(url, retryConfig);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    // Andere HTTP-Fehler
    const apiError = this.isApiError(data)
      ? data
      : { message: 'Ein Fehler ist aufgetreten' };

    const error = new Error(apiError.message) as ApiErrorResponse;
    error.response = {
      status: response.status,
      data: apiError,
    };

    throw error;
  }

  private isApiError(data: unknown): data is ApiError {
    return (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as Record<string, unknown>).message === 'string'
    );
  }

  private async handleRequestError(
    error: unknown,
    config: RequestConfig,
    url: string
  ): Promise<ApiResponse<never>> {
    // Timeout oder Netzwerkfehler
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request-Timeout erreicht');
    }

    // Netzwerkfehler
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Entwicklungsmodus: Fallback statt harter Fehler
      if (import.meta.env.DEV) {
        console.warn(
          '[Dev Fallback] Keine Serverantwort. Fallback-Antwort wird zurückgegeben.'
        );
        return Promise.resolve({
          data: {} as never, // Explizit never für Fallback
          status: 200,
          success: true,
          statusText: 'OK (Fallback)',
          headers: new Headers(),
        });
      }

      const networkError = new Error(
        'Netzwerkfehler. Bitte überprüfe deine Verbindung.'
      ) as ApiErrorResponse;
      networkError.request = { url, config };
      throw networkError;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unbekannter Fehler aufgetreten');
  }

  // HTTP-Methoden
  async get<T>(
    url: string,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body: data });
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data });
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data });
  }

  async delete<T>(
    url: string,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// Singleton-Instanz erstellen
const apiClient = new ApiClient(
  API_BASE_URL,
  { 'Content-Type': 'application/json' },
  API_TIMEOUT
);

export default apiClient;
