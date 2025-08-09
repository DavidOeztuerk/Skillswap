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

// Types
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

export interface InterceptorManager<T> {
  use(fulfilled?: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number;
  eject(id: number): void;
  clear(): void;
}

interface Interceptor<T> {
  fulfilled?: (value: T) => T | Promise<T>;
  rejected?: (error: any) => any;
}

// Interceptor Implementation
class InterceptorManagerImpl<T> implements InterceptorManager<T> {
  private interceptors: Map<number, Interceptor<T>> = new Map();
  private counter = 0;

  use(fulfilled?: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number {
    const id = this.counter++;
    this.interceptors.set(id, { fulfilled, rejected });
    return id;
  }

  eject(id: number): void {
    this.interceptors.delete(id);
  }

  clear(): void {
    this.interceptors.clear();
  }

  async execute(value: T, isError = false): Promise<T> {
    let result = value;
    
    for (const [, interceptor] of this.interceptors) {
      try {
        if (isError && interceptor.rejected) {
          result = await interceptor.rejected(result);
          isError = false; // Error was handled
        } else if (!isError && interceptor.fulfilled) {
          result = await interceptor.fulfilled(result);
        }
      } catch (error) {
        result = error as T;
        isError = true;
      }
    }
    
    if (isError) {
      throw result;
    }
    
    return result;
  }

  // Response-Interceptor speziell für Errors
  async executeError(error: any): Promise<any> {
    let result = error;
    
    for (const [, interceptor] of this.interceptors) {
      try {
        if (interceptor.rejected) {
          result = await interceptor.rejected(result);
        }
      } catch (rejectedError) {
        result = rejectedError;
      }
    }
    
    throw result;
  }
}

// Main HttpClient Class
class HttpClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  
  // Interceptors (like Axios)
  public interceptors = {
    request: new InterceptorManagerImpl<RequestConfig>(),
    response: new InterceptorManagerImpl<Response>()
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.setupDefaultInterceptors();
  }

  /**
   * Setup default interceptors
   */
  private setupDefaultInterceptors(): void {
    // Request Interceptor: Add Auth Token
    this.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token && !config.skipAuth) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`
          };
        }
        
        // Add default headers
        config.headers = {
          'Content-Type': 'application/json',
          ...config.headers
        };
        
        // Log in development
        if (import.meta.env.DEV) {
          console.log('🚀 Request:', config);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor: Handle 401 & Token Refresh
    this.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
          console.log('✅ Response:', response.status, response.url);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 - Token Refresh
        if (error.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.handleTokenRefresh();
            // Retry original request with new token
            return this.request(
              originalRequest.method,
              originalRequest.url,
              originalRequest.body,
              originalRequest
            );
          } catch (refreshError) {
            removeToken();
            router.navigate('/auth/login');
            return Promise.reject(refreshError);
          }
        }
        
        // Handle Rate Limiting
        if (error.status === 429) {
          const retryAfter = error.headers?.get('Retry-After');
          console.warn(`⚠️ Rate limited. Retry after ${retryAfter || 60} seconds`);
        }
        
        // Handle Network Errors
        if (!error.status) {
          console.error('🔌 Network Error - Check your connection');
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle token refresh with queue
   */
  private async handleTokenRefresh(): Promise<string> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseUrl}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: getToken(),
            refreshToken: refreshToken
          })
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const newToken = data.data?.accessToken || data.accessToken;
        
        const storageType = localStorage.getItem('remember_me') === 'true' ? 'permanent' : 'session';
        setToken(newToken, storageType);
        if (data.data?.refreshToken || data.refreshToken) {
          setRefreshToken(data.data?.refreshToken || data.refreshToken, storageType);
        }
        
        // Notify all subscribers
        this.refreshSubscribers.forEach(callback => callback(newToken));
        this.refreshSubscribers = [];
        
        return newToken;
      } finally {
        this.isRefreshing = false;
      }
    }

    // Wait for ongoing refresh
    return new Promise((resolve) => {
      this.refreshSubscribers.push((token: string) => {
        resolve(token);
      });
    });
  }

  /**
   * Build URL with query parameters
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
   * Main request method
   */
  async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    // Apply request interceptors
    const interceptedConfig = await this.interceptors.request.execute(config);
    
    const url = this.buildUrl(endpoint, method === 'GET' ? interceptedConfig.params : undefined);
    
    const options: RequestInit = {
      method,
      headers: interceptedConfig.headers,
      signal: interceptedConfig.signal,
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        delete (options.headers as any)['Content-Type'];
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    // Add timeout
    const timeoutId = setTimeout(() => {
      if (interceptedConfig.signal) {
        (interceptedConfig.signal as any).abort?.();
      }
    }, interceptedConfig.timeout || API_TIMEOUT);

    try {
      let response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      // Apply response interceptors
      response = await this.interceptors.response.execute(response);
      
      // Parse response
      const contentType = response.headers.get('content-type');
      let result: unknown;
      
      if (contentType?.includes('application/json')) {
        result = await response.json();
      } else if (contentType?.includes('text/')) {
        result = await response.text();
      } else if (response.status === 204) {
        result = null;
      } else {
        result = await response.blob();
      }
      
      if (!response.ok) {
        const error = {
          status: response.status,
          statusText: response.statusText,
          message: (result as any)?.message || response.statusText,
          data: result,
          config: interceptedConfig,
          headers: response.headers
        };
        throw await this.interceptors.response.executeError(error);
      }
      
      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw await this.interceptors.response.executeError(error);
    }
  }

  // Convenience methods
  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }
}

// Create and export instance
const httpClient = new HttpClient(API_BASE_URL);

// Example: Add custom interceptors
if (import.meta.env.DEV) {
  // Performance monitoring interceptor
  let requestStart: number;
  
  httpClient.interceptors.request.use((config) => {
    requestStart = Date.now();
    return config;
  });
  
  httpClient.interceptors.response.use((response) => {
    const duration = Date.now() - requestStart;
    console.log(`⏱️ Request took ${duration}ms`);
    return response;
  });
}

export default httpClient;