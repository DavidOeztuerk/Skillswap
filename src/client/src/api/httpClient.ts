// src/api/httpClient.ts
import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/endpoints';
import { API_TIMEOUT, MAX_RETRY_ATTEMPTS, RETRY_DELAY } from '../config/constants';
import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  removeToken,
} from '../utils/authHelpers';
import { router } from '../routes/Router';
import { errorService } from '../services/errorService';

// Request Configuration Interface
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  params?: Record<string, unknown>;
  _retry?: boolean;
}

// Token Refresh Response Interface
interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
}

class HttpClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Gets default headers including auth token
   */
  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Builds URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => urlObj.searchParams.append(key, String(v)));
        } else {
          urlObj.searchParams.append(key, String(value));
        }
      }
    });

    return urlObj.toString();
  }

  /**
   * Creates fetch request with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = API_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Handles fetch response and parses data
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    let data: unknown;

    try {
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else if (response.status === 204) {
        data = null; // No content
      } else {
        data = await response.blob();
      }
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = {
        status: response.status,
        statusText: response.statusText,
        message: (data as any)?.message || response.statusText,
        data,
      };
      
      errorService.handleApiError(error, `${response.status} ${response.url}`);
      throw error;
    }

    return data as T;
  }

  /**
   * Refreshes the access token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{ data: TokenRefreshResponse }>(
      'POST',
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      { token: getToken(), refreshToken },
      { _retry: true }
    );

    const tokenData = response.data;
    setToken(tokenData.token);
    setRefreshToken(tokenData.refreshToken);
    
    return tokenData.token;
  }

  /**
   * Handles 401 errors with token refresh
   */
  private async handle401Error<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    if (config?._retry) {
      // Already retried, logout
      removeToken();
      router.navigate('/login');
      throw new Error('Authentication failed');
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      
      try {
        const newToken = await this.refreshAccessToken();
        this.refreshSubscribers.forEach(cb => cb(newToken));
        this.refreshSubscribers = [];
        this.isRefreshing = false;
        
        // Retry original request
        return this.request<T>(method, endpoint, data, { ...config, _retry: true });
      } catch (error) {
        this.isRefreshing = false;
        this.refreshSubscribers = [];
        removeToken();
        router.navigate('/login');
        throw error;
      }
    }

    // Wait for token refresh
    return new Promise<T>((resolve, reject) => {
      this.refreshSubscribers.push(() => {
        this.request<T>(method, endpoint, data, { ...config, _retry: true })
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Main request method with retry logic
   */
  async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const maxRetries = config?.retries ?? (method === 'GET' ? MAX_RETRY_ATTEMPTS : 0);
    const retryDelay = config?.retryDelay ?? RETRY_DELAY;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = this.buildUrl(endpoint, method === 'GET' ? config?.params : undefined);
        const headers = this.getHeaders(config?.headers);
        
        const options: RequestInit = {
          method,
          headers,
        };

        // Add body for non-GET requests
        if (data && method !== 'GET') {
          if (data instanceof FormData) {
            delete (headers as any)['Content-Type'];
            options.body = data;
          } else {
            options.body = JSON.stringify(data);
          }
        }

        const response = await this.fetchWithTimeout(url, options, config?.timeout);
        
        // Handle 401 specifically
        if (response.status === 401 && !config?._retry) {
          return this.handle401Error<T>(method, endpoint, data, config);
        }

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (except 401) or if already retrying
        if (error.status >= 400 && error.status < 500 && error.status !== 401) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
          continue;
        }
      }
    }

    throw lastError;
  }

  // Convenience methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  /**
   * Downloads a file
   */
  async downloadFile(endpoint: string, filename?: string, config?: RequestConfig): Promise<void> {
    const response = await this.request<Blob>('GET', endpoint, undefined, {
      ...config,
      headers: {
        ...config?.headers,
        Accept: 'application/octet-stream',
      },
    });

    const blob = new Blob([response]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Uploads a file with progress tracking
   */
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    if (onProgress) {
      // Use XMLHttpRequest for progress tracking
      return new Promise<T>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress((e.loaded / e.total) * 100);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              resolve(xhr.responseText as T);
            }
          } else {
            reject({ status: xhr.status, message: xhr.statusText });
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        const url = this.buildUrl(endpoint);
        xhr.open('POST', url);
        
        const token = getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });
    }

    return this.post<T>(endpoint, formData, config);
  }
}

export default new HttpClient(API_BASE_URL);