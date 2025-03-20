import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_TIMEOUT } from '../config/constants';
import { setToken, removeToken, getToken } from '../utils/authHelpers';
import { router } from '../routes/Router';
import { ApiError } from '../types/common/ApiResponse';
import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/endpoints';

// Typ-Erweiterung für _retry
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Hier ist der fehlende Request-Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (import.meta.env.DEV) {
      console.log('[Request]', config);
    }

    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log('[Response]', response);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalConfig = error.config;

    if (
      originalConfig &&
      error.response &&
      error.response.status === 401 &&
      !originalConfig._retry
    ) {
      originalConfig._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const { data } = await axios.post(
            `${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH_TOKEN}`,
            { token: getToken() }
          );

          setToken(data.token);
          onRefreshed(data.token);
          isRefreshing = false;

          return axios(originalConfig);
        } catch (refreshError) {
          removeToken();
          router.navigate('/login');
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${token}`;
          }
          resolve(axios(originalConfig));
        });
      });
    }

    // Hier ist ein wichtiger Teil der alten Fehlerbehandlung
    if (error.response) {
      const apiError = error.response.data;
      const message = apiError?.message || 'Ein Fehler ist aufgetreten';
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      // Entwicklungsmodus: Fallback statt harter Fehler
      if (import.meta.env.DEV) {
        console.warn(
          '[Dev Fallback] Keine Serverantwort. Fallback-Antwort wird zurückgegeben.'
        );
        return Promise.resolve({ data: {} }); // Beispiel-Objekt
      }

      return Promise.reject(
        new Error('Netzwerkfehler. Bitte überprüfe deine Verbindung.')
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
