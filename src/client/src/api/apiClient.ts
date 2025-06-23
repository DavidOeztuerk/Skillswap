import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
} from 'axios';
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

interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
}

interface ExtendedAxiosRequestConfig<T = unknown> extends AxiosRequestConfig<T> {
  _retry?: boolean;
}

class ApiClient {
  private axios: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    this.axios.interceptors.request.use((config) => {
      const token = getToken();
      if (token && config.headers) {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<TokenRefreshResponse> {
    const response = await this.axios.post<ApiResponse<TokenRefreshResponse>>(
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      {
        token: getToken(),
        refreshToken: getRefreshToken(),
      }
    );
    const tokenData = response.data.data;
    setToken(tokenData.token);
    setRefreshToken(tokenData.refreshToken);
    return tokenData;
  }

  private async handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const originalConfig = error.config as ExtendedAxiosRequestConfig;
      if (error.response?.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

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
            return Promise.reject(refreshError);
          }
        }

        return new Promise((resolve, reject) => {
          this.subscribeTokenRefresh((token) => {
            if (originalConfig.headers) {
              originalConfig.headers.Authorization = `Bearer ${token}`;
            }
            this.axios(originalConfig)
              .then(resolve)
              .catch(reject);
          });
        });
      }
    }
    return Promise.reject(error);
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.axios
      .get<ApiResponse<T>>(url, config)
      .then((res) => res.data);
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.axios
      .post<ApiResponse<T>>(url, data, config)
      .then((res) => res.data);
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.axios
      .put<ApiResponse<T>>(url, data, config)
      .then((res) => res.data);
  }

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.axios
      .patch<ApiResponse<T>>(url, data, config)
      .then((res) => res.data);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.axios
      .delete<ApiResponse<T>>(url, config)
      .then((res) => res.data);
  }
}

export default new ApiClient();
