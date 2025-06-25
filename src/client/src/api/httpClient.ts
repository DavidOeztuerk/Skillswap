// src/api/httpClient.ts
import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/endpoints';
import { API_TIMEOUT } from '../config/constants';
import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  removeToken,
} from '../utils/authHelpers';
import { router } from '../routes/Router';
import { ApiResponse } from '../types/common/ApiResponse';

// HTTP Response Interface
export interface HttpResponse<T> {
  data: T;
  status: number;
  ok: boolean;
  message?: string;
  headers?: Record<string, string>;
}

// Request Configuration Interface
interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  _retry?: boolean;
}

// Token Refresh Response Interface
interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
}

class CustomHttpClient {
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
   * Handles fetch response and parses JSON
   */
  private async handleResponse<T>(
    response: Response
  ): Promise<HttpResponse<T>> {
    let data: unknown = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch {
      // Response might not contain JSON/text
    }

    // Convert headers to plain object
    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    const result: HttpResponse<T> = {
      data: data as T,
      status: response.status,
      ok: response.ok,
      message: response.ok
        ? 'Success'
        : (data as { message?: string })?.message || response.statusText,
      headers: headersObj,
    };

    if (!response.ok) {
      console.error('API Error:', result.message);
    }

    return result;
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
   * Adds a subscriber to token refresh queue
   */
  private subscribeTokenRefresh(cb: (token: string) => void): void {
    this.refreshSubscribers.push(cb);
  }

  /**
   * Notifies all subscribers about successful token refresh
   */
  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  /**
   * Refreshes the access token
   */
  private async refreshAccessToken(): Promise<TokenRefreshResponse> {
    const response = await this.requestWithoutInterceptor<
      ApiResponse<TokenRefreshResponse>
    >('POST', AUTH_ENDPOINTS.REFRESH_TOKEN, {
      token: getToken(),
      refreshToken: getRefreshToken(),
    });

    if (!response.ok || !response.data.data) {
      throw new Error('Token refresh failed');
    }

    const tokenData = response.data.data;
    setToken(tokenData.token);
    setRefreshToken(tokenData.refreshToken);
    return tokenData;
  }

  /**
   * Performs HTTP request without authentication interceptors
   */
  private async requestWithoutInterceptor<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: this.getHeaders(config?.headers),
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Remove Content-Type for FormData (browser will set it with boundary)
        const headers = { ...options.headers } as Record<string, string>;
        delete headers['Content-Type'];
        options.headers = headers;
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }

    const response = await this.fetchWithTimeout(url, options, config?.timeout);
    return this.handleResponse<T>(response);
  }

  /**
   * Handles HTTP errors and implements retry logic for 401 errors
   */
  private async handleError<T>(
    error: unknown,
    method: string,
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status?: number }).status === 401 &&
      !config?._retry
    ) {
      const retryConfig = { ...config, _retry: true };

      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const tokenData = await this.refreshAccessToken();
          this.onRefreshed(tokenData.token);
          this.isRefreshing = false;

          // Retry original request with new token
          return this.request<T>(method, endpoint, body, retryConfig);
        } catch (refreshError) {
          this.isRefreshing = false;
          this.refreshSubscribers = [];
          removeToken();
          router.navigate('/login');
          throw refreshError;
        }
      }

      // Queue the request if token refresh is in progress
      return new Promise<HttpResponse<T>>((resolve, reject) => {
        this.subscribeTokenRefresh(() => {
          this.request<T>(method, endpoint, body, retryConfig)
            .then(resolve)
            .catch(reject);
        });
      });
    }

    throw error;
  }

  /**
   * Performs HTTP request with authentication and retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    try {
      const response = await this.requestWithoutInterceptor<T>(
        method,
        endpoint,
        body,
        config
      );

      // Handle 401 errors for token refresh
      if (response.status === 401) {
        return this.handleError<T>(
          { status: response.status },
          method,
          endpoint,
          body,
          config
        );
      }

      return response;
    } catch (error) {
      // Handle network errors or other issues
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * GET request
   */
  public async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
      }
    }

    const response = await this.request<ApiResponse<T>>(
      'GET',
      url,
      undefined,
      config
    );
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'POST',
      endpoint,
      body,
      config
    );
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'PUT',
      endpoint,
      body,
      config
    );
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'PATCH',
      endpoint,
      body,
      config
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'DELETE',
      endpoint,
      undefined,
      config
    );
    return response.data;
  }

  /**
   * Performs request with retry logic
   */
  public async requestWithRetry<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    const maxRetries = config?.retries || 3;
    const retryDelay = config?.retryDelay || 1000;
    let lastError: Error;

    interface StatusError extends Error {
      status?: number;
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(method, endpoint, body, config);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except 401
        const status = (error as StatusError)?.status;
        if (
          status !== undefined &&
          status >= 400 &&
          status < 500 &&
          status !== 401
        ) {
          throw error;
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
        }
      }
    }

    throw lastError!;
  }

  /**
   * Downloads a file
   */
  public async downloadFile(
    endpoint: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    const response = await this.request<Blob>('GET', endpoint, undefined, {
      ...config,
      headers: {
        ...config?.headers,
        Accept: 'application/octet-stream',
      },
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Uploads a file
   */
  public async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig,
    onProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<ApiResponse<T>> {
    // Note: Progress tracking with fetch API requires additional implementation
    if (onProgress) {
      console.warn('Progress tracking not implemented with fetch API');
    }

    const response = await this.request<ApiResponse<T>>(
      'POST',
      endpoint,
      formData,
      config
    );
    return response.data;
  }
}

// Create and export singleton instance
export default new CustomHttpClient(API_BASE_URL);
