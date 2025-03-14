import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_TIMEOUT } from '../config/constants';
import { getToken, removeToken } from '../utils/authHelpers';
import { API_BASE_URL } from '../config/endpoints';
import { router } from '../routes/Router';
import { ApiError } from '../types/common/ApiResponse';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
});

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
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        removeToken();
        router.navigate('/login');
      } else if (status === 403) {
        console.error('[403] Zugriff verweigert');
      }
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
