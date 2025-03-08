// src/api/apiClient.ts
import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_TIMEOUT } from '../config/constants';
import { getToken, removeToken } from '../utils/authHelpers';
import { API_BASE_URL } from '../config/endpoints';

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
  (error: AxiosError) => {
    if (error.response) {
      // Handle spezifische Fehler
      const status = error.response.status;

      if (status === 401) {
        // Nicht autorisiert - Token abgelaufen oder ungültig
        removeToken();
        window.location.href = '/login';
      }

      if (status === 403) {
        // Zugriff verweigert - Keine ausreichenden Berechtigungen
        console.error('Zugriffsversuch auf beschränkte Ressource');
      }

      // Fehlermeldung aus API-Antwort extrahieren, wenn vorhanden
      const data = error.response.data as { message?: string };
      const errorMessage = data?.message || error.response.statusText;
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
