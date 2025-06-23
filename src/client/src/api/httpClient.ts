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

// HTTP Methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request Configuration Interface
interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ExtendedRequestConfig extends RequestConfig {
  _retry?: boolean;
}

// Response Interface
interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

// Error Interface
interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: HttpResponse;
}

// Token Refresh Response Interface
interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
}

class CustomHttpClient {
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  /**
   * Creates an HTTP error with additional metadata
   */
  private createHttpError(
    message: string,
    status?: number,
    statusText?: string,
    response?: HttpResponse
  ): HttpError {
    const error = new Error(message) as HttpError;
    error.status = status;
    error.statusText = statusText;
    error.response = response;
    return error;
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

    const tokenData = response.data.data;
    setToken(tokenData.token);
    setRefreshToken(tokenData.refreshToken);
    return tokenData;
  }

  /**
   * Handles HTTP errors and implements retry logic for 401 errors
   */
  private async handleError<T>(
    error: HttpError,
    method: HttpMethod,
    url: string,
    data?: unknown,
    config?: ExtendedRequestConfig
  ): Promise<HttpResponse<T>> {
    if (error.status === 401 && !config?._retry) {
      const retryConfig = { ...config, _retry: true };

      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const tokenData = await this.refreshAccessToken();
          this.onRefreshed(tokenData.token);
          this.isRefreshing = false;
        } catch (refreshError) {
          this.isRefreshing = false;
          removeToken();
          router.navigate('/login');
          throw refreshError;
        }
      }

      return new Promise<HttpResponse<T>>((resolve, reject) => {
        this.subscribeTokenRefresh(() => {
          this.request<T>(method, url, data, retryConfig)
            .then((result) => resolve(result as HttpResponse<T>))
            .catch(reject);
        });
      });
    }

    throw error;
  }

  /**
   * Creates fetch request with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
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
        throw this.createHttpError('Request timeout', 408, 'Request Timeout');
      }
      throw error;
    }
  }

  /**
   * Performs HTTP request without authentication interceptors
   */
  private async requestWithoutInterceptor<T>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const timeout = config?.timeout || API_TIMEOUT;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        // Remove Content-Type for FormData (browser will set it with boundary)
        delete headers['Content-Type'];
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    try {
      const response = await this.fetchWithTimeout(fullUrl, options, timeout);

      // Parse response
      let responseData: T;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = (await response.text()) as unknown as T;
      }

      const httpResponse: HttpResponse<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };

      // Handle HTTP errors
      if (!response.ok) {
        throw this.createHttpError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          response.status,
          response.statusText,
          httpResponse
        );
      }

      return httpResponse;
    } catch (error) {
      if (error instanceof TypeError) {
        throw this.createHttpError(
          'Network Error: Unable to connect to server'
        );
      }
      throw error;
    }
  }

  /**
   * Performs HTTP request with authentication and retry logic
   */
  public async request<T>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    config?: ExtendedRequestConfig
  ): Promise<HttpResponse<T>> {
    // Add authorization header if token exists
    const token = getToken();
    const headers = { ...config?.headers };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestConfig = { ...config, headers };

    try {
      return await this.requestWithoutInterceptor<T>(
        method,
        url,
        data,
        requestConfig
      );
    } catch (error) {
      if (error instanceof Error) {
        const httpError = error as HttpError;
        return this.handleError<T>(httpError, method, url, data, requestConfig);
      }
      throw error;
    }
  }

  /**
   * Performs GET request
   */
  public async get<T>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'GET',
      url,
      undefined,
      config
    );
    return response.data;
  }

  /**
   * Performs POST request
   */
  public async post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'POST',
      url,
      data,
      config
    );
    return response.data;
  }

  /**
   * Performs PUT request
   */
  public async put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'PUT',
      url,
      data,
      config
    );
    return response.data;
  }

  /**
   * Performs PATCH request
   */
  public async patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'PATCH',
      url,
      data,
      config
    );
    return response.data;
  }

  /**
   * Performs DELETE request
   */
  public async delete<T>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.request<ApiResponse<T>>(
      'DELETE',
      url,
      undefined,
      config
    );
    return response.data;
  }

  /**
   * Performs request with retry logic
   */
  public async requestWithRetry<T>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    const maxRetries = config?.retries || 3;
    const retryDelay = config?.retryDelay || 1000;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(method, url, data, config);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except 401
        if (error instanceof Error) {
          const httpError = error as HttpError;
          if (
            httpError.status &&
            httpError.status >= 400 &&
            httpError.status < 500 &&
            httpError.status !== 401
          ) {
            throw error;
          }
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
    url: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    const response = await this.request<Blob>('GET', url, undefined, {
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
    url: string,
    formData: FormData,
    config?: RequestConfig,
    onProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<ApiResponse<T>> {
    // Note: Progress tracking with fetch API requires additional implementation
    // For now, we'll implement basic file upload without progress tracking

    if (onProgress) {
      console.log('nix ');
    }

    const response = await this.request<ApiResponse<T>>('POST', url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
    });
    return response.data;
  }
}

// Create and export singleton instance
export default new CustomHttpClient();
