// src/api/apiClient.ts
import httpClient, { RequestConfig } from './httpClient';
import { ApiResponse } from '../types/common/ApiResponse';

/**
 * Simplified API Client that wraps httpClient
 * Automatically handles ApiResponse wrapper
 */
class ApiClient {
  /**
   * GET request
   */
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<T> {
    const response = await httpClient.get<ApiResponse<T>>(url, {
      ...config,
      params,
    });
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await httpClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await httpClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await httpClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(
    url: string,
    config?: RequestConfig
  ): Promise<T> {
    const response = await httpClient.delete<ApiResponse<T>>(url, config);
    return response.data;
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
   * Health check
   */
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