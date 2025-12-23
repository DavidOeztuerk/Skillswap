import type { AxiosRequestConfig } from 'axios';

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
