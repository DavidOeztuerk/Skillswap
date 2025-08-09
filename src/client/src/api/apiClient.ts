// src/api/apiClient.ts
import httpClient, { RequestConfig } from './httpClient';
import { ApiResponse } from '../types/common/ApiResponse';
import { getToken } from '../utils/authHelpers';
import { API_BASE_URL } from '../config/endpoints';

// Types
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

interface PendingRequest {
  promise: Promise<any>;
  abortController?: AbortController;
}

/**
 * Simplified API Client focusing on essential features
 */
class ApiClient {
  // Simple cache for static data only
  private cache = new Map<string, CacheEntry<any>>();
  // Prevent duplicate requests
  private pendingRequests = new Map<string, PendingRequest>();
  
  // Define what to cache (static data only)
  private readonly CACHE_CONFIG = {
    '/api/config': 5 * 60 * 1000,        // 5 minutes
    '/api/user/profile': 2 * 60 * 1000,  // 2 minutes  
    '/api/translations': 30 * 60 * 1000,  // 30 minutes
    '/api/countries': 60 * 60 * 1000,     // 1 hour
  } as const;

  /**
   * Check if endpoint should be cached
   */
  private shouldCache(url: string): number | false {
    for (const [pattern, ttl] of Object.entries(this.CACHE_CONFIG)) {
      if (url.includes(pattern)) {
        return ttl;
      }
    }
    return false;
  }

  /**
   * Get cached data if valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const pattern = Object.keys(this.CACHE_CONFIG).find(p => key.includes(p));
    const ttl = pattern ? this.CACHE_CONFIG[pattern as keyof typeof this.CACHE_CONFIG] : 0;
    
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Create request key for deduplication
   */
  private createRequestKey(method: string, url: string, data?: unknown): string {
    const dataHash = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataHash}`;
  }

  /**
   * Prevent duplicate concurrent requests
   */
  private async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    abortController?: AbortController
  ): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log('🔄 Reusing pending request:', key);
      return pending.promise;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, { promise, abortController });
    return promise;
  }

  /**
   * Cancel pending request
   */
  cancelRequest(key: string): void {
    const pending = this.pendingRequests.get(key);
    if (pending?.abortController) {
      pending.abortController.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Generic request handler
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const requestKey = this.createRequestKey(method, url, data);
    const abortController = new AbortController();
    
    return this.deduplicateRequest(requestKey, async () => {
      try {
        // Check cache for GET requests
        if (method === 'GET' && this.shouldCache(url)) {
          const cached = this.getFromCache<T>(url);
          if (cached !== null) {
            console.log('✨ Cache hit:', url);
            return cached;
          }
        }

        // Make the actual request
        const response = await httpClient.request<ApiResponse<T>>(
          method,
          url,
          data,
          {
            ...config,
            signal: abortController.signal
          }
        );

        // Extract data from ApiResponse wrapper
        const responseData = (response && typeof response === 'object' && 'data' in response)
          ? (response as ApiResponse<T>).data
          : response as T;

        // Cache if applicable
        if (method === 'GET' && this.shouldCache(url)) {
          this.cache.set(url, {
            data: responseData,
            timestamp: Date.now(),
            etag: (response as any).headers?.etag
          });
          console.log('💾 Cached:', url);
        }

        return responseData;
      } catch (error) {
        // Clean up on error
        this.pendingRequests.delete(requestKey);
        throw error;
      }
    }, abortController);
  }

  /**
   * GET request
   */
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<T> {
    return this.makeRequest<T>('GET', url, undefined, { ...config, params });
  }

  /**
   * POST request (clears related cache)
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const result = await this.makeRequest<T>('POST', url, data, config);
    
    // Invalidate related cache after successful POST
    this.invalidateCache(url);
    
    return result;
  }

  /**
   * PUT request (clears related cache)
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const result = await this.makeRequest<T>('PUT', url, data, config);
    this.invalidateCache(url);
    return result;
  }

  /**
   * PATCH request (clears related cache)
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const result = await this.makeRequest<T>('PATCH', url, data, config);
    this.invalidateCache(url);
    return result;
  }

  /**
   * DELETE request (clears related cache)
   */
  async delete<T>(
    url: string,
    config?: RequestConfig
  ): Promise<T> {
    const result = await this.makeRequest<T>('DELETE', url, undefined, config);
    this.invalidateCache(url);
    return result;
  }

  /**
   * Invalidate cache for related endpoints
   */
  private invalidateCache(url: string): void {
    // Smart cache invalidation based on URL patterns
    const invalidationRules: Record<string, string[]> = {
      '/user': ['/user/profile', '/user/settings'],
      '/posts': ['/posts', '/feed'],
      '/comments': ['/posts', '/comments'],
    };

    for (const [pattern, targets] of Object.entries(invalidationRules)) {
      if (url.includes(pattern)) {
        targets.forEach(target => {
          for (const key of this.cache.keys()) {
            if (key.includes(target)) {
              this.cache.delete(key);
              console.log('🗑️ Cache invalidated:', key);
            }
          }
        });
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.pendingRequests.forEach(({ abortController }) => {
      abortController?.abort();
    });
    this.pendingRequests.clear();
  }

  /**
   * Prefetch data for better UX
   */
  async prefetch<T>(url: string, params?: Record<string, unknown>): Promise<void> {
    try {
      await this.get<T>(url, params);
      console.log('📥 Prefetched:', url);
    } catch {
      // Ignore prefetch errors
    }
  }

  /**
   * Upload file with progress
   */
  async uploadFile<T>(
    url: string,
    data: File | FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
   const formData = data instanceof FormData ? data : (() => {
      const fd = new FormData();
      fd.append('file', data);
      return fd;
    })();

    // Use XMLHttpRequest for progress tracking
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(Math.round(progress));
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const data = response.data || response;
            resolve(data);
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject({
            status: xhr.status,
            message: xhr.statusText
          });
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      // Setup request
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      xhr.open('POST', fullUrl);
      
      // Add auth token
      const token = getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Send
      xhr.send(formData);
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Add custom interceptor for error tracking
httpClient.interceptors.response.use(
  response => response,
  error => {
    // Track errors (e.g., to Sentry)
    if (import.meta.env.PROD) {
      // window.Sentry?.captureException(error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Export types
export type { CacheEntry, PendingRequest };