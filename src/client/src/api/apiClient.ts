// src/api/apiClient.ts
import httpClient from './httpClient';
import { ApiResponse } from '../types/common/ApiResponse';

/**
 * Enhanced API Client with improved error handling and utilities
 * Replaces Axios with custom fetch-based implementation
 */
class ApiClient {
  /**
   * Performs GET request
   */
  async get<T>(
    url: string,
    config?: { params?: Record<string, unknown> }
  ): Promise<ApiResponse<T>> {
    let fullUrl = url;

    // Handle query parameters
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    return httpClient.get<T>(fullUrl);
  }

  /**
   * Performs POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: { headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    return httpClient.post<T>(url, data, config);
  }

  /**
   * Performs PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: { headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    return httpClient.put<T>(url, data, config);
  }

  /**
   * Performs PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: { headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    return httpClient.patch<T>(url, data, config);
  }

  /**
   * Performs DELETE request
   */
  async delete<T>(
    url: string,
    config?: { headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    return httpClient.delete<T>(url, config);
  }

  /**
   * Downloads a file
   */
  async downloadFile(url: string, filename?: string): Promise<void> {
    return httpClient.downloadFile(url, filename);
  }

  /**
   * Uploads a file with FormData
   */
  async uploadFile<T>(
    url: string,
    formData: FormData,
    onProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<ApiResponse<T>> {
    return httpClient.uploadFile<T>(url, formData, {}, onProgress);
  }

  /**
   * Performs request with custom retry logic
   */
  async requestWithRetry<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: unknown,
    options?: {
      retries?: number;
      retryDelay?: number;
      headers?: Record<string, string>;
    }
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.requestWithRetry<ApiResponse<T>>(
      method,
      url,
      data,
      {
        retries: options?.retries,
        retryDelay: options?.retryDelay,
        headers: options?.headers,
      }
    );
    return response.data;
  }

  /**
   * Health check utility
   */
  async healthCheck(serviceName?: string): Promise<boolean> {
    try {
      const endpoint = serviceName ? `/health/${serviceName}` : '/health';
      await this.get(endpoint);
      return true;
    } catch (error) {
      console.warn(
        `Health check failed${serviceName ? ` for ${serviceName}` : ''}:`,
        error
      );
      return false;
    }
  }

  /**
   * Batch requests utility
   */
  async batchRequests<T>(
    requests: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      url: string;
      data?: unknown;
    }>
  ): Promise<Array<ApiResponse<T> | Error>> {
    const promises = requests.map(async (request) => {
      try {
        switch (request.method) {
          case 'GET':
            return await this.get<T>(request.url);
          case 'POST':
            return await this.post<T>(request.url, request.data);
          case 'PUT':
            return await this.put<T>(request.url, request.data);
          case 'PATCH':
            return await this.patch<T>(request.url, request.data);
          case 'DELETE':
            return await this.delete<T>(request.url);
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }
      } catch (error) {
        return error as Error;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Request with cache support (simple memory cache)
   */
  private cache = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  >();

  async getWithCache<T>(
    url: string,
    ttl = 5 * 60 * 1000, // 5 minutes default
    config?: { params?: Record<string, unknown> }
  ): Promise<ApiResponse<T>> {
    let fullUrl = url;

    // Handle query parameters for cache key
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const cacheKey = fullUrl;
    const cached = this.cache.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as ApiResponse<T>;
    }

    // Fetch new data
    const response = await this.get<T>(fullUrl, config);

    // Cache the response
    this.cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      ttl,
    });

    return response;
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear cache entries matching pattern
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Request with timeout
   */
  async requestWithTimeout<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: unknown,
    timeout = 10000
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.request<ApiResponse<T>>(
      method,
      url,
      data,
      { timeout }
    );
    return response.data;
  }
}

// Create and export singleton instance
export default new ApiClient();
