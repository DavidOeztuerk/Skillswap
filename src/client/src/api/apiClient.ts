// src/api/apiClient.ts
import httpClient, { RequestConfig } from './httpClient';
import { ApiResponse } from '../types/common/ApiResponse';
import { EndpointConfig, ENDPOINT_CONFIGS } from '../config/endpoints';

/**
 * Enhanced API Client with performance optimizations
 * Automatically handles ApiResponse wrapper and endpoint configurations
 */
class ApiClient {
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue = new Map<string, Promise<any>>();

  /**
   * Apply endpoint configuration to request config
   */
  private applyEndpointConfig(
    config: RequestConfig = {},
    endpointConfig?: EndpointConfig
  ): RequestConfig {
    if (!endpointConfig) return config;

    return {
      ...config,
      timeout: endpointConfig.timeout || config.timeout,
      // Add retry logic metadata
      metadata: {
        ...config.metadata,
        retries: endpointConfig.retries || 1,
        priority: endpointConfig.priority || 'medium',
        cacheStrategy: endpointConfig.cacheStrategy || 'no-cache',
      },
    };
  }

  /**
   * Check if request can be served from cache
   */
  private getCachedResponse<T>(
    cacheKey: string,
    cacheStrategy: string
  ): T | null {
    if (cacheStrategy === 'no-cache') return null;

    const cached = this.requestCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now > cached.timestamp + cached.ttl;

    if (cacheStrategy === 'cache-first' && !isExpired) {
      return cached.data;
    }

    if (cacheStrategy === 'stale-while-revalidate') {
      return cached.data; // Return stale data, revalidation happens in background
    }

    return null;
  }

  /**
   * Cache response based on strategy
   */
  private cacheResponse(
    cacheKey: string,
    data: any,
    cacheStrategy: string,
    ttl: number = 300000 // 5 minutes default
  ): void {
    if (cacheStrategy === 'no-cache') return;

    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Create a cache key for the request
   */
  private createCacheKey(url: string, params?: Record<string, unknown>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  /**
   * Deduplicate concurrent requests
   */
  private async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }
  /**
   * Enhanced GET request with caching and optimization
   */
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig,
    endpointConfig?: EndpointConfig
  ): Promise<T> {
    const cacheKey = this.createCacheKey(url, params);
    const mergedConfig = this.applyEndpointConfig(config, endpointConfig);
    const cacheStrategy = mergedConfig.metadata?.cacheStrategy || 'no-cache';

    // Check cache first
    const cachedResponse = this.getCachedResponse<T>(cacheKey, cacheStrategy);
    if (cachedResponse && cacheStrategy === 'cache-first') {
      return cachedResponse;
    }

    // Deduplicate concurrent requests
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const response = await httpClient.get<ApiResponse<T>>(url, {
          ...mergedConfig,
          params,
        });
        
        // Handle both wrapped and unwrapped responses
        let data: T;
        if (response && typeof response === 'object' && 'data' in response) {
          data = (response as ApiResponse<T>).data;
        } else {
          data = response as T;
        }

        // Cache the response
        this.cacheResponse(cacheKey, data, cacheStrategy);

        return data;
      } catch (error) {
        // On stale-while-revalidate, return cached data if available
        if (cacheStrategy === 'stale-while-revalidate' && cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    });
  }

  /**
   * Enhanced POST request with optimization
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    endpointConfig?: EndpointConfig
  ): Promise<T> {
    const mergedConfig = this.applyEndpointConfig(config, endpointConfig);
    
    try {
      const response = await httpClient.post<ApiResponse<T>>(url, data, mergedConfig);
      
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as ApiResponse<T>).data;
      }
      
      return response as T;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT request with automatic ApiResponse unwrapping
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await httpClient.put<ApiResponse<T>>(url, data, config);
      
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as ApiResponse<T>).data;
      }
      
      return response as T;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PATCH request with automatic ApiResponse unwrapping
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await httpClient.patch<ApiResponse<T>>(url, data, config);
      
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as ApiResponse<T>).data;
      }
      
      return response as T;
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE request with automatic ApiResponse unwrapping
   */
  async delete<T>(
    url: string,
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await httpClient.delete<ApiResponse<T>>(url, config);
      
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as ApiResponse<T>).data;
      }
      
      return response as T;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(
    url: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    return httpClient.downloadFile(url, filename, config);
  }

  /**
   * Upload file with progress
   */
  async uploadFile<T>(
    url: string,
    formData: FormData,
    config?: RequestConfig,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await httpClient.uploadFile<ApiResponse<T>>(
      url,
      formData,
      config,
      onProgress
    );
    return response.data;
  }

  /**
   * Health check with optimization
   */
  async healthCheck(serviceName?: string): Promise<boolean> {
    try {
      const endpoint = serviceName ? `/health/${serviceName}` : '/health';
      await this.get(endpoint, undefined, undefined, ENDPOINT_CONFIGS.critical);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear cache for specific endpoint or all
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.requestCache.clear();
      return;
    }

    const keysToDelete = Array.from(this.requestCache.keys()).filter(key =>
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.requestCache.delete(key));
  }

  /**
   * Preload endpoint for better performance
   */
  async preload<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig,
    endpointConfig?: EndpointConfig
  ): Promise<void> {
    try {
      await this.get<T>(url, params, config, endpointConfig);
    } catch {
      // Ignore errors in preloading
    }
  }

  /**
   * Batch requests for efficiency
   */
  async batch<T>(
    requests: Array<{
      url: string;
      params?: Record<string, unknown>;
      config?: RequestConfig;
      endpointConfig?: EndpointConfig;
    }>
  ): Promise<T[]> {
    const promises = requests.map(req =>
      this.get<T>(req.url, req.params, req.config, req.endpointConfig)
    );
    return Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate: number;
  } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }
}

export default new ApiClient();