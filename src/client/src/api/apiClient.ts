import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosError,
  AxiosProgressEvent,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  AxiosResponse
} from 'axios';
import { 
  ApiResponse, 
  PagedResponse, 
  extractData,
  isSuccessResponse,
  ErrorResponse,
} from '../types/api/UnifiedResponse';
import { 
  getToken, 
  getRefreshToken, 
  setToken, 
  setRefreshToken, 
  removeToken,
  isRememberMeEnabled
} from '../utils/authHelpers';
import { router } from '../routes/Router';
import { toast } from 'react-toastify';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
  retryDelay?: number;
  cache?: {
    ttl?: number;
    key?: string;
  };
  priority?: 'low' | 'normal' | 'high';
  dedupe?: boolean;
  _retry?: boolean;
  _retryCount?: number;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableCircuitBreaker?: boolean;
  enableRateLimiting?: boolean;
  maxConcurrentRequests?: number;
  circuitBreakerConfig?: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
  monitoredErrors?: number[];
}

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

// ============================================
// ERROR CLASSES
// ============================================

export class ApiError extends Error {
  constructor(
    public readonly success: boolean,
    public readonly statusCode: number,
    public readonly errors: string[],
    public readonly errorCode?: string,
    public readonly traceId?: string,
    public readonly timestamp?: string
  ) {
    super(errors[0] || 'API Error');
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(
    message: string = 'Network error occurred',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string = 'Request timeout',
    public readonly timeout: number = 0
  ) {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class AbortError extends Error {
  constructor(message: string = 'Request aborted') {
    super(message);
    this.name = 'AbortError';
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}

// ============================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private halfOpenAttempts = 0;
  private successCount = 0;
  
  constructor(private config: CircuitBreakerConfig) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be opened
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenAttempts = 0;
        console.log('Circuit breaker: HALF_OPEN');
      } else {
        throw new Error(`Circuit breaker is OPEN. Retry after ${
          Math.ceil((this.config.resetTimeout - (now - this.lastFailureTime)) / 1000)
        } seconds`);
      }
    }
    
    // Check half-open state
    if (this.state === 'HALF_OPEN' && 
        this.halfOpenAttempts >= this.config.halfOpenRequests) {
      if (this.successCount >= this.config.halfOpenRequests) {
        this.state = 'CLOSED';
        this.failures = 0;
        console.log('Circuit breaker: CLOSED');
      } else {
        this.state = 'OPEN';
        this.lastFailureTime = Date.now();
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        this.halfOpenAttempts++;
      }
      
      if (this.state === 'CLOSED' && this.failures > 0) {
        this.failures = Math.max(0, this.failures - 1);
      }
      
      return result;
    } catch (error: any) {
      // Only count specific errors
      const statusCode = error?.response?.status || error?.statusCode;
      const monitoredErrors = this.config.monitoredErrors || [500, 502, 503, 504];
      
      if (monitoredErrors.includes(statusCode)) {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.state === 'HALF_OPEN') {
          this.halfOpenAttempts++;
        }
        
        if (this.failures >= this.config.failureThreshold) {
          this.state = 'OPEN';
          console.error(`Circuit breaker opened after ${this.failures} failures`);
        }
      }
      
      throw error;
    }
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.halfOpenAttempts = 0;
    this.successCount = 0;
  }
  
  getState(): string {
    return this.state;
  }
}

// ============================================
// RATE LIMITER IMPLEMENTATION
// ============================================

class RateLimiter {
  private requests: number[] = [];
  
  constructor(private config: RateLimiterConfig) {}
  
  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.config.windowMs
    );
    
    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getNextAvailableTime(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.config.windowMs - (Date.now() - oldestRequest));
  }
  
  reset(): void {
    this.requests = [];
  }
}

// ============================================
// DEDUPLICATION MANAGER
// ============================================

class DeduplicationManager {
  private pending = new Map<string, Promise<any>>();
  
  getDedupKey(config: AxiosRequestConfig): string {
    const { method = 'GET', url, params, data } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
  }
  
  getPending<T>(key: string): Promise<T> | null {
    return this.pending.get(key) || null;
  }
  
  setPending<T>(key: string, promise: Promise<T>): void {
    this.pending.set(key, promise);
    
    // Remove from pending after completion
    promise.finally(() => {
      this.pending.delete(key);
    });
  }
  
  clear(): void {
    this.pending.clear();
  }
}

// ============================================
// MAIN API CLIENT CLASS
// ============================================

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private circuitBreaker?: CircuitBreaker;
  private rateLimiter?: RateLimiter;
  private deduplicationManager = new DeduplicationManager();
  
  // Token refresh management
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  
  // Abort controllers
  private abortControllers = new Map<string, AbortController>();
  
  // Performance monitoring
  private performanceMetrics = new Map<string, { count: number; totalTime: number }>();
  
  constructor(private config: ApiClientConfig) {
    // Initialize axios instance
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // Initialize optional features
    if (config.enableCircuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(
        config.circuitBreakerConfig || {
          failureThreshold: 5,
          resetTimeout: 60000,
          halfOpenRequests: 3,
          monitoredErrors: [500, 502, 503, 504]
        }
      );
    }
    
    if (config.enableRateLimiting) {
      this.rateLimiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 60000
      });
    }
    
    this.setupInterceptors();
  }
  
  // ============================================
  // INTERCEPTORS SETUP
  // ============================================
  
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig & RequestConfig) => {
        // Add auth token
        const token = getToken();
        if (token && !config.skipAuth) {
          config.headers = AxiosHeaders.from(config.headers);
          config.headers.set('Authorization', `Bearer ${token}`);
        }
        
        // Add request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        config.headers = AxiosHeaders.from(config.headers);
        config.headers.set('X-Request-ID', requestId);
        
        // Add timestamp for performance monitoring
        (config as any).metadata = {
          startTime: performance.now(),
          requestId
        };
        
        // Development logging
        if (import.meta.env.DEV) {
          console.debug(`🚀 [${requestId}] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data
          });
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Performance monitoring
        const metadata = (response.config as any).metadata;
        if (metadata) {
          const duration = performance.now() - metadata.startTime;
          this.trackPerformance(response.config.url || '', duration);
          
          if (import.meta.env.DEV) {
            console.debug(`✅ [${metadata.requestId}] Response in ${duration.toFixed(2)}ms`);
          }
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & RequestConfig;
        
        // Handle network errors
        if (!error.response) {
          if (error.code === 'ECONNABORTED') {
            throw new TimeoutError('Request timeout', originalRequest.timeout);
          }
          if (error.message === 'canceled') {
            throw new AbortError('Request was cancelled');
          }
          throw new NetworkError('Network connection failed', error);
        }
        
        const { status, data } = error.response;
        
        // Performance monitoring for errors
        const metadata = (originalRequest as any).metadata;
        if (metadata) {
          const duration = performance.now() - metadata.startTime;
          
          if (import.meta.env.DEV) {
            console.error(`❌ [${metadata.requestId}] Error ${status} in ${duration.toFixed(2)}ms`);
          }
        }
        
        // Handle rate limiting
        if (status === 429) {
          const retryAfter = error.response.headers?.['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          
          console.warn(`Rate limited. Retry after ${delay}ms`);
          
          // Retry after delay
          if (!originalRequest._retry && originalRequest.retries && originalRequest.retries > 0) {
            originalRequest._retry = true;
            originalRequest.retries--;
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.axiosInstance(originalRequest);
          }
        }
        
        // Handle 401 Unauthorized - Token refresh
        if (status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
          // Check if it's a login/register endpoint
          const isAuthEndpoint = originalRequest.url?.includes('/login') || 
                                originalRequest.url?.includes('/register') ||
                                originalRequest.url?.includes('/refresh');
          
          if (!isAuthEndpoint) {
            return this.handleTokenRefresh(originalRequest);
          }
        }
        
        // Handle 403 Forbidden
        if (status === 403) {
          // User doesn't have permission
          toast.error('Sie haben keine Berechtigung für diese Aktion');
        }
        
        // Handle 500+ Server errors with retry
        if (status >= 500 && !originalRequest._retry && originalRequest.retries) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          if (originalRequest._retryCount <= (originalRequest.retries || this.config.maxRetries || 3)) {
            const delay = this.calculateRetryDelay(originalRequest._retryCount, originalRequest.retryDelay);
            
            console.warn(`Retrying request (${originalRequest._retryCount}/${originalRequest.retries}) after ${delay}ms`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.axiosInstance(originalRequest);
          }
        }
        
        // Transform to ApiError
        if (data && typeof data === 'object' && 'errors' in data) {
          throw new ApiError(
            false,
            status,
            Array.isArray(data.errors) ? data.errors : [data.errors as string],
            (data as any).errorCode,
            (data as any).traceId,
            (data as any).timestamp || new Date().toISOString()
          );
        }
        
        // Fallback error
        throw new ApiError(
          false,
          status,
          [`HTTP ${status}: ${error.message}`],
          'UNKNOWN_ERROR',
          undefined,
          new Date().toISOString()
        );
      }
    );
  }
  
  // ============================================
  // TOKEN REFRESH HANDLING
  // ============================================
  
  private async handleTokenRefresh(originalRequest: InternalAxiosRequestConfig & RequestConfig): Promise<any> {
    if (this.isRefreshing) {
      // Token is already being refreshed, queue this request
      return new Promise((resolve) => {
        this.subscribeTokenRefresh((token: string) => {
          originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
          originalRequest.headers.set('Authorization', `Bearer ${token}`);
          resolve(this.axiosInstance(originalRequest));
        });
      });
    }
    
    originalRequest._retry = true;
    this.isRefreshing = true;
    
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Make refresh request directly without interceptors
      const refreshResponse = await axios.post(
        `${this.config.baseURL}/api/auth/refresh-token`,
        {
          accessToken: getToken(),
          refreshToken
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      const tokens = this.extractTokens(refreshResponse.data);
      const storage = isRememberMeEnabled() ? 'permanent' : 'session';
      
      // Store new tokens
      setToken(tokens.accessToken, storage);
      if (tokens.refreshToken) {
        setRefreshToken(tokens.refreshToken, storage);
      }
      
      // Update default header
      this.setAuthToken(tokens.accessToken);
      
      // Notify all queued requests
      this.onTokenRefreshed(tokens.accessToken);
      this.isRefreshing = false;
      
      // Retry original request with new token
      originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
      originalRequest.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      
      return this.axiosInstance(originalRequest);
    } catch (refreshError) {
      this.isRefreshing = false;
      this.refreshSubscribers = [];
      
      // Clear tokens and redirect to login
      removeToken();
      this.setAuthToken(null);
      
      toast.error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', {
        toastId: 'session-expired',
        autoClose: 5000,
      });
      
      router.navigate('/auth/login');
      
      return Promise.reject(refreshError);
    }
  }
  
  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }
  
  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }
  
  private extractTokens(data: any): { accessToken: string; refreshToken?: string } {
    // Handle different response formats
    if (data?.data?.accessToken) {
      return {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken
      };
    }
    
    if (data?.accessToken) {
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
    }
    
    throw new Error('Invalid token response format');
  }
  
  // ============================================
  // MAIN REQUEST METHODS
  // ============================================
  
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Check deduplication
    if (config.dedupe !== false && config.method === 'GET') {
      const dedupKey = this.deduplicationManager.getDedupKey(config);
      const pending = this.deduplicationManager.getPending<ApiResponse<T>>(dedupKey);
      if (pending) {
        if (import.meta.env.DEV) {
          console.debug('🔄 Deduped request:', dedupKey);
        }
        return pending;
      }
    }
    
    // Create abort controller
    const abortKey = `${config.method}:${config.url}`;
    const existingController = this.abortControllers.get(abortKey);
    if (existingController) {
      existingController.abort();
    }
    
    const controller = new AbortController();
    this.abortControllers.set(abortKey, controller);
    config.signal = controller.signal;
    
    // Create request function
    const executeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        // Check rate limiting
        if (this.rateLimiter && !this.rateLimiter.canMakeRequest()) {
          const waitTime = this.rateLimiter.getNextAvailableTime();
          throw new ApiError(
            false,
            429,
            [`Rate limit exceeded. Retry after ${Math.ceil(waitTime / 1000)} seconds`],
            'RATE_LIMIT_EXCEEDED',
            undefined,
            new Date().toISOString()
          );
        }
        
        // Execute with circuit breaker if enabled
        const response = await (this.circuitBreaker
          ? this.circuitBreaker.execute(() => this.axiosInstance(config))
          : this.axiosInstance(config));
        
        const apiResponse = this.normalizeResponse<T>(response.data);
        
        return apiResponse;
      } catch (error) {
        return this.handleError<T>(error);
      } finally {
        this.abortControllers.delete(abortKey);
      }
    };
    
    // Handle deduplication for GET requests
    if (config.dedupe !== false && config.method === 'GET') {
      const dedupKey = this.deduplicationManager.getDedupKey(config);
      const promise = executeRequest();
      this.deduplicationManager.setPending(dedupKey, promise);
      return promise;
    }

    return executeRequest();
  } 
  
  // ============================================
  // HTTP METHOD SHORTCUTS
  // ============================================
  
  async get<T>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
      params,
    });
  }
  
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    });
  }
  
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data,
    });
  }
  
  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'PATCH',
      url,
      data,
    });
  }
  
  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url,
    });
  }
  
  // ============================================
  // SPECIALIZED METHODS
  // ============================================
  
  async uploadFile<T>(
    url: string,
    fileOrForm: File | FormData,
    onProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = fileOrForm instanceof FormData
      ? fileOrForm
      : (() => {
          const fd = new FormData();
          fd.append('file', fileOrForm);
          return fd;
        })();
    
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        }
      },
    });
  }
  
  async downloadFile(
    url: string,
    filename?: string,
    onProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<Blob> {
    const response = await this.axiosInstance({
      ...config,
      method: 'GET',
      url,
      responseType: 'blob',
      onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        }
      },
    });
    
    const blob = response.data;
    
    // Auto-download if filename provided
    if (filename && typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
    
    return blob;
  }
  
  async getPaged<T>(
    url: string,
    params?: Record<string, any>,
    config?: RequestConfig
  ): Promise<PagedResponse<T>> {
    const response = await this.request<T[]>({
      ...config,
      method: 'GET',
      url,
      params,
    });
    
    // Check if response has pagination structure
    if ('pagination' in response && response.pagination) {
      return response as PagedResponse<T>;
    }
    
    // Convert to paged response if needed
    if (isSuccessResponse(response)) {
      return {
        ...response,
        pagination: {
          pageNumber: 1,
          pageSize: Array.isArray(response.data) ? response.data.length : 1,
          totalPages: 1,
          totalRecords: Array.isArray(response.data) ? response.data.length : 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      } as PagedResponse<T>;
    }
    
    return response as PagedResponse<T>;
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  async getAndExtract<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.get<T>(url, params);
    return extractData(response);
  }
  
  async postAndExtract<T>(url: string, data?: any): Promise<T> {
    const response = await this.post<T>(url, data);
    return extractData(response);
  }
  
  async putAndExtract<T>(url: string, data?: any): Promise<T> {
    const response = await this.put<T>(url, data);
    return extractData(response);
  }
  
  async patchAndExtract<T>(url: string, data?: any): Promise<T> {
    const response = await this.patch<T>(url, data);
    return extractData(response);
  }
  
  async deleteAndExtract<T>(url: string): Promise<T> {
    const response = await this.delete<T>(url);
    return extractData(response);
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  private normalizeResponse<T>(data: any): ApiResponse<T> {
    // Already in correct format
    if (this.isApiResponseFormat(data)) {
      return data as ApiResponse<T>;
    }
    
    // Wrap raw data in success response
    return {
      success: true,
      data: data as T,
      timestamp: new Date().toISOString(),
    };
  }
  
  private handleError<T>(error: any): ApiResponse<T> {
    if (error instanceof ApiError) {
      return {
        success: false,
        errors: error.errors,
        errorCode: error.errorCode,
        statusCode: error.statusCode,
        traceId: error.traceId,
        timestamp: error.timestamp,
      } as ErrorResponse;
    }
    
    if (error instanceof NetworkError) {
      return {
        success: false,
        errors: ['Network connection failed. Please check your internet connection.'],
        errorCode: 'NETWORK_ERROR',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      } as ErrorResponse;
    }
    
    if (error instanceof TimeoutError) {
      return {
        success: false,
        errors: ['Request timed out. Please try again.'],
        errorCode: 'TIMEOUT_ERROR',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      } as ErrorResponse;
    }
    
    if (error instanceof AbortError) {
      return {
        success: false,
        errors: ['Request was cancelled'],
        errorCode: 'ABORTED',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      } as ErrorResponse;
    }
    
    return {
      success: false,
      errors: [error?.message || 'An unknown error occurred'],
      errorCode: 'UNKNOWN_ERROR',
      statusCode: 0,
      timestamp: new Date().toISOString(),
    } as ErrorResponse;
  }
  
  private isApiResponseFormat(data: any): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      typeof data.success === 'boolean'
    );
  }
  
  private calculateRetryDelay(retryCount: number, baseDelay?: number): number {
    const base = baseDelay || this.config.retryDelay || 1000;
    // Exponential backoff with jitter
    const exponentialDelay = base * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }
  
  private trackPerformance(endpoint: string, duration: number): void {
    const current = this.performanceMetrics.get(endpoint) || { count: 0, totalTime: 0 };
    this.performanceMetrics.set(endpoint, {
      count: current.count + 1,
      totalTime: current.totalTime + duration
    });
  }
  
  // ============================================
  // PUBLIC UTILITY METHODS
  // ============================================
  
  setAuthToken(token: string | null): void {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }
  
  cancelRequest(url: string, method: string = 'GET'): void {
    const key = `${method}:${url}`;
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }
  
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }
  
  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }
  
  resetRateLimiter(): void {
    this.rateLimiter?.reset();
  }
  
  getPerformanceReport(): any {
    const report = Array.from(this.performanceMetrics.entries()).map(([endpoint, metrics]) => ({
      endpoint,
      ...metrics,
      avgTime: metrics.totalTime / metrics.count
    }));
    
    return {
      endpoints: report.sort((a, b) => b.count - a.count),
      totalRequests: report.reduce((sum, item) => sum + item.count, 0),
      avgResponseTime: report.reduce((sum, item) => sum + item.avgTime, 0) / report.length,
      circuitBreakerState: this.circuitBreaker?.getState(),
    };
  }
  
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
  
  cleanup(): void {
    this.cancelAllRequests();
    this.deduplicationManager.clear();
    this.refreshSubscribers = [];
    this.isRefreshing = false;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  maxRetries: 3,
  retryDelay: 1000,
  enableCircuitBreaker: true,
  enableRateLimiting: true,
  maxConcurrentRequests: 10,
  circuitBreakerConfig: {
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenRequests: 3,
    monitoredErrors: [500, 502, 503, 504]
  }
});

// Legacy export for backward compatibility
export const api = apiClient.getAxiosInstance();

// Cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiClient.cleanup();
  });
}