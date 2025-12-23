import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosProgressEvent,
  type InternalAxiosRequestConfig,
  AxiosHeaders,
  type AxiosResponse,
} from 'axios';
import { toast } from 'react-toastify';
import {
  type ApiResponse,
  type PagedResponse,
  isSuccessResponse,
  extractData,
  type ErrorResponse,
} from '../../shared/types/api/UnifiedResponse';
import {
  getRefreshToken,
  isRememberMeEnabled,
  setToken,
  setRefreshToken,
  removeToken,
  getToken,
} from '../../shared/utils/authHelpers';
import { NetworkError, ApiError, TimeoutError, AbortError } from './errorExtensions';
import type {
  CircuitBreakerConfig,
  RateLimiterConfig,
  ApiClientConfig,
  RequestConfig,
} from './apiConfigs';

/**
 * Event-based navigation for auth failures.
 * This avoids importing Router directly which causes circular dependencies.
 * Subscribe to onAuthFailure in a component that has access to navigation.
 */
export const authEvents = {
  onAuthFailure: null as (() => void) | null,
};

// ============================================
// INTERNAL TYPES
// ============================================

interface RequestMetadata {
  startTime: number;
  requestId: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

interface TokenResponseWrapper {
  data?: TokenResponse;
  accessToken?: string;
  refreshToken?: string;
}

interface ErrorResponseData {
  errors: string | string[];
  errorCode?: string;
  traceId?: string;
  timestamp?: string;
}

interface EndpointMetrics {
  endpoint: string;
  count: number;
  totalTime: number;
  avgTime: number;
}

interface PerformanceReport {
  endpoints: EndpointMetrics[];
  totalRequests: number;
  avgResponseTime: number;
  circuitBreakerState?: string;
}

// ============================================
// ERROR CLASSES
// ============================================

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

  /**
   * Check and transition from OPEN state
   */
  private checkOpenState(): void {
    if (this.state !== 'OPEN') return;

    const now = Date.now();
    if (now - this.lastFailureTime > this.config.resetTimeout) {
      this.state = 'HALF_OPEN';
      this.halfOpenAttempts = 0;
      console.debug('Circuit breaker: HALF_OPEN');
    } else {
      const retryAfterSeconds = Math.ceil(
        (this.config.resetTimeout - (now - this.lastFailureTime)) / 1000
      );
      throw new Error(`Circuit breaker is OPEN. Retry after ${retryAfterSeconds} seconds`);
    }
  }

  /**
   * Check and transition from HALF_OPEN state
   */
  private checkHalfOpenState(): void {
    if (this.state !== 'HALF_OPEN' || this.halfOpenAttempts < this.config.halfOpenRequests) return;

    if (this.successCount >= this.config.halfOpenRequests) {
      this.state = 'CLOSED';
      this.failures = 0;
      console.debug('Circuit breaker: CLOSED');
    } else {
      this.state = 'OPEN';
      this.lastFailureTime = Date.now();
      throw new Error('Circuit breaker is OPEN');
    }
  }

  /**
   * Handle successful execution
   */
  private handleSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      this.halfOpenAttempts++;
    }

    if (this.state === 'CLOSED' && this.failures > 0) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  /**
   * Handle execution failure
   */
  private handleFailure(error: unknown): void {
    const statusCode = this.getStatusCode(error);
    const monitoredErrors = this.config.monitoredErrors ?? [500, 502, 503, 504];

    if (statusCode === undefined || !monitoredErrors.includes(statusCode)) return;

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

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkOpenState();
    this.checkHalfOpenState();

    try {
      const result = await fn();
      this.handleSuccess();
      return result;
    } catch (error: unknown) {
      this.handleFailure(error);
      throw error;
    }
  }

  private getStatusCode(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null) {
      // Check for axios-style error (error.response.status)
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status !== undefined) {
        return axiosError.response.status;
      }
      // Check for direct statusCode property
      const statusError = error as { statusCode?: number };
      if (statusError.statusCode !== undefined) {
        return statusError.statusCode;
      }
    }
    return undefined;
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
    this.requests = this.requests.filter((time) => now - time < this.config.windowMs);

    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getNextAvailableTime(): number {
    if (this.requests.length === 0) {
      return 0;
    }

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
  private pending = new Map<string, Promise<unknown>>();

  getDedupKey(config: AxiosRequestConfig): string {
    const method = config.method ?? 'GET';
    const url = config.url ?? '';
    return `${method}:${url}:${JSON.stringify(config.params)}:${JSON.stringify(config.data)}`;
  }

  getPending<T>(key: string): Promise<T> | null {
    const pending = this.pending.get(key);
    return pending ? (pending as Promise<T>) : null;
  }

  setPending<T>(key: string, promise: Promise<T>): void {
    this.pending.set(key, promise);

    // Remove from pending after completion
    void promise.finally(() => {
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
  private refreshSubscribers: ((token: string) => void)[] = [];

  // Abort controllers
  private abortControllers = new Map<string, AbortController>();

  // Performance monitoring
  private performanceMetrics = new Map<string, { count: number; totalTime: number }>();

  constructor(private config: ApiClientConfig) {
    // Initialize axios instance
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        // Force browser to always revalidate with server (no stale cache)
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache', // For older browsers
      },
    });

    // Initialize optional features
    if (config.enableCircuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(
        config.circuitBreakerConfig ?? {
          failureThreshold: 5,
          resetTimeout: 60000,
          halfOpenRequests: 3,
          monitoredErrors: [500, 502, 503, 504],
        }
      );
    }

    if (config.enableRateLimiting) {
      this.rateLimiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 60000,
      });
    }

    this.setupInterceptors();
  }

  // ============================================
  // ERROR HANDLER HELPERS
  // ============================================

  /**
   * Handle network-level errors (no response)
   */
  private handleNetworkLevelError(
    error: AxiosError,
    originalRequest: InternalAxiosRequestConfig & RequestConfig
  ): never {
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timeout', originalRequest.timeout);
    }
    if (error.message === 'canceled') {
      throw new AbortError('Request was cancelled');
    }
    throw new NetworkError('Network connection failed', error);
  }

  /**
   * Log error performance metrics
   */
  private logErrorMetrics(
    originalRequest: InternalAxiosRequestConfig & RequestConfig,
    status: number
  ): void {
    const { metadata } = originalRequest as InternalAxiosRequestConfig & {
      metadata?: RequestMetadata;
    };
    if (metadata && import.meta.env.DEV) {
      const duration = performance.now() - metadata.startTime;
      console.error(`❌ [${metadata.requestId}] Error ${status} in ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Handle rate limit (429) errors
   */
  private async handleRateLimitError(
    error: AxiosError,
    originalRequest: InternalAxiosRequestConfig & RequestConfig
  ): Promise<AxiosResponse | null> {
    const headers = error.response?.headers as Record<string, string | undefined> | undefined;
    const retryAfterHeader = headers?.['retry-after'];
    const delay = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) * 1000 : 60000;

    console.warn(`Rate limited. Retry after ${delay}ms`);

    const { retries } = originalRequest;
    if (!originalRequest._retry && retries !== undefined && retries > 0) {
      originalRequest._retry = true;
      originalRequest.retries = retries - 1;

      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
      return this.axiosInstance(originalRequest);
    }
    return null;
  }

  /**
   * Check if request is to an auth endpoint
   */
  private isAuthEndpoint(url?: string): boolean {
    return (
      url?.includes('/login') === true ||
      url?.includes('/register') === true ||
      url?.includes('/refresh') === true
    );
  }

  /**
   * Handle unauthorized (401) errors
   */
  private async handleUnauthorizedError(
    originalRequest: InternalAxiosRequestConfig & RequestConfig
  ): Promise<AxiosResponse | null> {
    console.debug('🔍 [apiClient] 401 Error detected!');
    console.debug('🔍 [apiClient] Request URL:', originalRequest.url);

    const isAuth = this.isAuthEndpoint(originalRequest.url);
    const hasTokens = getToken() && getRefreshToken();

    console.debug('🔍 [apiClient] Is auth endpoint:', isAuth);
    console.debug('🔍 [apiClient] Has tokens:', hasTokens);

    if (!isAuth && hasTokens) {
      console.debug('⚠️ [apiClient] Triggering token refresh due to 401!');
      return this.handleTokenRefresh(originalRequest);
    }

    if (!hasTokens) {
      console.debug('401 on unauthenticated request - not attempting token refresh');
    }
    return null;
  }

  /**
   * Handle server (500+) errors with retry
   */
  private async handleServerError(
    originalRequest: InternalAxiosRequestConfig & RequestConfig
  ): Promise<AxiosResponse | null> {
    const { retries: serverRetries } = originalRequest;
    if (originalRequest._retry || serverRetries === undefined) return null;

    originalRequest._retry = true;
    const currentRetryCount = originalRequest._retryCount ?? 0;
    originalRequest._retryCount = currentRetryCount + 1;

    const maxRetries = serverRetries > 0 ? serverRetries : (this.config.maxRetries ?? 3);
    if (originalRequest._retryCount <= maxRetries) {
      const delay = this.calculateRetryDelay(
        originalRequest._retryCount,
        originalRequest.retryDelay
      );

      console.warn(
        `Retrying request (${originalRequest._retryCount}/${serverRetries}) after ${delay}ms`
      );

      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
      return this.axiosInstance(originalRequest);
    }
    return null;
  }

  /**
   * Transform error response data to ApiError
   */
  private createApiErrorFromResponse(status: number, data: unknown, message: string): ApiError {
    if (typeof data === 'object' && data !== null && 'errors' in data) {
      const errorData = data as ErrorResponseData;
      return new ApiError(
        false,
        status,
        Array.isArray(errorData.errors) ? errorData.errors : [errorData.errors],
        errorData.errorCode,
        errorData.traceId,
        errorData.timestamp ?? new Date().toISOString()
      );
    }

    return new ApiError(
      false,
      status,
      [`HTTP ${status}: ${message}`],
      'UNKNOWN_ERROR',
      undefined,
      new Date().toISOString()
    );
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
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        config.headers = AxiosHeaders.from(config.headers);
        config.headers.set('X-Request-ID', requestId);

        // Add timestamp for performance monitoring
        (config as InternalAxiosRequestConfig & { metadata: RequestMetadata }).metadata = {
          startTime: performance.now(),
          requestId,
        };

        // Development logging - only show params/data if they exist
        if (import.meta.env.DEV) {
          const extras: string[] = [];
          if (
            config.params !== undefined &&
            config.params !== null &&
            Object.keys(config.params as Record<string, unknown>).length > 0
          ) {
            extras.push(`params=${JSON.stringify(config.params)}`);
          }
          if (config.data !== undefined) {
            extras.push(`data=${JSON.stringify(config.data)}`);
          }
          console.debug(
            `🚀 [${requestId}] ${config.method?.toUpperCase() ?? 'GET'} ${config.url ?? ''}`,
            extras.length > 0 ? extras.join(' ') : ''
          );
        }

        return config;
      },
      (error: unknown) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Performance monitoring
        const { metadata } = response.config as InternalAxiosRequestConfig & {
          metadata?: RequestMetadata;
        };
        if (metadata) {
          const duration = performance.now() - metadata.startTime;
          this.trackPerformance(response.config.url ?? '', duration);

          if (import.meta.env.DEV) {
            console.debug(`✅ [${metadata.requestId}] Response in ${duration.toFixed(2)}ms`);
          }
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & RequestConfig;

        // Handle network errors (no response)
        if (!error.response) {
          this.handleNetworkLevelError(error, originalRequest);
        }

        const { status, data } = error.response;

        // Log performance metrics for errors
        this.logErrorMetrics(originalRequest, status);

        // Handle rate limiting (429)
        if (status === 429) {
          const result = await this.handleRateLimitError(error, originalRequest);
          if (result) return result;
        }

        // Handle 401 Unauthorized
        if (status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
          const result = await this.handleUnauthorizedError(originalRequest);
          if (result) return result;
        }

        // Handle 403 Forbidden
        if (status === 403) {
          toast.error('Sie haben keine Berechtigung für diese Aktion');
        }

        // Handle 500+ Server errors with retry
        if (status >= 500) {
          const result = await this.handleServerError(originalRequest);
          if (result) return result;
        }

        // Transform to ApiError
        throw this.createApiErrorFromResponse(status, data, error.message);
      }
    );
  }

  // ============================================
  // TOKEN REFRESH HANDLING
  // ============================================

  private async handleTokenRefresh(
    originalRequest: InternalAxiosRequestConfig & RequestConfig
  ): Promise<AxiosResponse> {
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
      const refreshResponse = await axios.post<TokenResponseWrapper>(
        `${this.config.baseURL}/api/users/refresh-token`,
        {
          accessToken: getToken(),
          refreshToken,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
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

      return await this.axiosInstance(originalRequest);
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

      // Use event system to avoid circular dependency with Router
      if (authEvents.onAuthFailure) {
        authEvents.onAuthFailure();
      } else {
        // Fallback if no handler is registered
        window.location.href = '/auth/login';
      }

      throw refreshError instanceof Error ? refreshError : new Error(String(refreshError));
    }
  }

  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => {
      callback(token);
    });
    this.refreshSubscribers = [];
  }

  private extractTokens(data: unknown): TokenResponse {
    // Handle different response formats
    const wrapper = data as TokenResponseWrapper;

    if (wrapper.data?.accessToken) {
      return {
        accessToken: wrapper.data.accessToken,
        refreshToken: wrapper.data.refreshToken,
      };
    }

    if (wrapper.accessToken) {
      return {
        accessToken: wrapper.accessToken,
        refreshToken: wrapper.refreshToken,
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
          console.debug('🔄 Deduped request', {
            method: config.method,
            url: config.url,
            params: config.params as Record<string, unknown>,
            reason: 'Identical request already pending',
          });
        }
        return pending;
      }
    }

    // Create abort controller
    const abortKey = this.deduplicationManager.getDedupKey(config);
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

        return this.normalizeResponse<T>(response.data);
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

  async get<T>(url: string, params?: object, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
      params,
    });
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    });
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data,
    });
  }

  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'PATCH',
      url,
      data,
    });
  }

  async delete<T>(url: string, config?: RequestConfig, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url,
      data,
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
    const formData =
      fileOrForm instanceof FormData
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
        if (progressEvent.total !== undefined && progressEvent.total > 0 && onProgress) {
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
    const response = await this.axiosInstance<Blob>({
      ...config,
      method: 'GET',
      url,
      responseType: 'blob',
      onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total !== undefined && progressEvent.total > 0 && onProgress) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        }
      },
    });

    const blob = response.data;

    // Auto-download if filename provided
    if (filename && typeof window !== 'undefined') {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    }

    return blob;
  }

  async getPaged<T>(
    url: string,
    params?: object,
    config?: RequestConfig
  ): Promise<PagedResponse<T>> {
    const response = await this.request<T[]>({
      ...config,
      method: 'GET',
      url,
      params,
    });

    // Check if response has pagination structure (flat structure)
    if ('pageNumber' in response && 'totalRecords' in response) {
      return response as PagedResponse<T>;
    }

    // Convert to paged response if needed (use flat structure)
    if (isSuccessResponse(response)) {
      return {
        ...response,
        pageNumber: 1,
        pageSize: Array.isArray(response.data) ? response.data.length : 1,
        totalPages: 1,
        totalRecords: Array.isArray(response.data) ? response.data.length : 1,
        hasNextPage: false,
        hasPreviousPage: false,
      } as PagedResponse<T>;
    }

    return response as PagedResponse<T>;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getAndExtract<T>(url: string, params?: object): Promise<T> {
    const response = await this.get<T>(url, params);
    return extractData(response);
  }

  async postAndExtract<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.post<T>(url, data);
    return extractData(response);
  }

  async putAndExtract<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.put<T>(url, data);
    return extractData(response);
  }

  async patchAndExtract<T>(url: string, data?: unknown): Promise<T> {
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

  private normalizeResponse<T>(data: unknown): ApiResponse<T> {
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

  private handleError<T>(error: unknown): ApiResponse<T> {
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

    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      errors: [message],
      errorCode: 'UNKNOWN_ERROR',
      statusCode: 0,
      timestamp: new Date().toISOString(),
    } as ErrorResponse;
  }

  private isApiResponseFormat(data: unknown): data is { success: boolean } {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      typeof (data as { success: unknown }).success === 'boolean'
    );
  }

  private calculateRetryDelay(retryCount: number, baseDelay?: number): number {
    const base = baseDelay ?? this.config.retryDelay ?? 1000;
    // Exponential backoff with jitter
    const exponentialDelay = base * 2 ** (retryCount - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private trackPerformance(endpoint: string, duration: number): void {
    const current = this.performanceMetrics.get(endpoint) ?? { count: 0, totalTime: 0 };
    this.performanceMetrics.set(endpoint, {
      count: current.count + 1,
      totalTime: current.totalTime + duration,
    });
  }

  // ============================================
  // PUBLIC UTILITY METHODS
  // ============================================

  setAuthToken(token: string | null): void {
    if (token) {
      this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common.Authorization;
    }
  }

  cancelRequest(url: string, method = 'GET'): void {
    const key = `${method}:${url}`;
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }

  resetRateLimiter(): void {
    this.rateLimiter?.reset();
  }

  getPerformanceReport(): PerformanceReport {
    const report = [...this.performanceMetrics.entries()].map(([endpoint, metrics]) => ({
      endpoint,
      ...metrics,
      avgTime: metrics.totalTime / metrics.count,
    }));

    return {
      endpoints: report.sort((a, b) => b.count - a.count),
      totalRequests: report.reduce((sum, item) => sum + item.count, 0),
      avgResponseTime:
        report.length > 0 ? report.reduce((sum, item) => sum + item.avgTime, 0) / report.length : 0,
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

const apiTimeout = import.meta.env.VITE_API_TIMEOUT;
const timeoutValue = apiTimeout ? Number.parseInt(apiTimeout, 10) : 30000;

export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  timeout: Number.isNaN(timeoutValue) ? 30000 : timeoutValue,
  maxRetries: 3,
  retryDelay: 1000,
  enableCircuitBreaker: true,
  enableRateLimiting: true,
  maxConcurrentRequests: 10,
  circuitBreakerConfig: {
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenRequests: 3,
    monitoredErrors: [500, 502, 503, 504],
  },
});

export const api = apiClient.getAxiosInstance();

// Cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiClient.cleanup();
  });
}
