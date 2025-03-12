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

/**
 * Konfiguriert den Axios-Client mit Standard-Einstellungen
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT, // 15 Sekunden
});

/**
 * Request-Interceptor zum Hinzufügen des Auth-Tokens
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (import.meta.env.DEV) {
      console.log('Request:', config);
    }
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response-Interceptor für die Fehlerbehandlung
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Handle spezifische Fehler
      const status = error.response.status;

      if (status === 401) {
        // Nicht autorisiert - Token abgelaufen oder ungültig
        removeToken();
        router.navigate('/login');
      }

      if (status === 403) {
        // Zugriff verweigert - Keine ausreichenden Berechtigungen
        console.error('Zugriffsversuch auf beschränkte Ressource');
      }

      // Fehlermeldung aus API-Antwort extrahieren, wenn vorhanden
      const apiError = error.response?.data;
      const errorMessage = apiError?.message || 'Ein Fehler ist aufgetreten';
      return Promise.reject(new Error(errorMessage));
    }

    if (error.request) {
      // Anfrage gestellt, aber keine Antwort erhalten
      return Promise.reject(
        new Error('Netzwerkfehler. Bitte überprüfe deine Verbindung.')
      );
    }

    // Andere Fehler
    return Promise.reject(error);
  }
);

export default apiClient;
