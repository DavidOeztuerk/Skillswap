// src/api/apiClient.ts
import httpClient from './httpClient';
import { ApiResponse } from '../types/common/ApiResponse';

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return httpClient.get<T>(url, params, config);
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return httpClient.post<T>(url, data, config);
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return httpClient.put<T>(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return httpClient.patch<T>(url, data, config);
  }

  async delete<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return httpClient.delete<T>(url, data, config);
  }

  async downloadFile(
    url: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    return httpClient.downloadFile(url, filename, config);
  }

  async uploadFile<T>(
    url: string,
    formData: FormData,
    config?: RequestConfig,
    onProgress?: (e: ProgressEvent) => void
  ): Promise<ApiResponse<T>> {
    return httpClient.uploadFile<T>(url, formData, config, onProgress);
  }

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
      options
    );
    return response.data;
  }

  async healthCheck(serviceName?: string): Promise<boolean> {
    try {
      const endpoint = serviceName ? `/health/${serviceName}` : '/health';
      await this.get(endpoint);
      return true;
    } catch {
      return false;
    }
  }
}

export default new ApiClient();
