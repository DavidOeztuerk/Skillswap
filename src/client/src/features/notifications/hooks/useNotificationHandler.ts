import { useState, useCallback } from 'react';
import type { AlertColor } from '@mui/material';
import {
  type ApiErrorResponse,
  type ErrorDetails,
  extractErrorFromResponse,
} from '../../../shared/utils/errorMessages';

export interface NotificationState {
  title: string;
  message: string;
  severity: AlertColor;
  code?: string;
}

/**
 * Hook für Error/Success-Notifications mit automatischer Nachrichtenumwandlung
 *
 * @returns {object} Notification-Handler-Funktionen und aktueller State
 *
 * @example
 * ```tsx
 * const { notification, handleError, handleSuccess, clearNotification } = useNotificationHandler();
 *
 * const handleAccept = async () => {
 *   try {
 *     const result = await acceptAppointment(id);
 *     if (!result.success) {
 *       handleError(result);
 *     } else {
 *       handleSuccess('Termin erfolgreich bestätigt!');
 *     }
 *   } catch (err) {
 *     handleError({ errorCode: 'NETWORK_ERROR' });
 *   }
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleAccept}>Bestätigen</Button>
 *     <ErrorNotification
 *       open={!!notification}
 *       title={notification?.title}
 *       message={notification?.message}
 *       severity={notification?.severity || 'error'}
 *       onClose={clearNotification}
 *     />
 *   </>
 * );
 * ```
 */
export const useNotificationHandler = (): {
  notification: NotificationState | null;
  handleError: (apiResponse: ApiErrorResponse | null | undefined, fallbackMessage?: string) => void;
  handleSuccess: (message: string, title?: string) => void;
  handleWarning: (message: string, title?: string) => void;
  handleInfo: (message: string, title?: string) => void;
  clearNotification: () => void;
} => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  /**
   * Behandelt einen Fehler und extrahiert die passende Nachricht
   *
   * @param apiResponse - Die API-Response oder ein Error-Objekt
   * @param fallbackMessage - Optional: Fallback-Nachricht, falls keine Details verfügbar
   */
  const handleError = useCallback(
    (apiResponse: ApiErrorResponse | null | undefined, fallbackMessage?: string) => {
      const errorDetails: ErrorDetails = extractErrorFromResponse(apiResponse);

      setNotification({
        title: errorDetails.title,
        message: fallbackMessage ?? errorDetails.message,
        severity: 'error',
        code: errorDetails.code,
      });

      // Log für Debugging
      console.error('Error handled:', errorDetails);
    },
    []
  );

  /**
   * Zeigt eine Erfolgs-Nachricht an
   *
   * @param message - Die Erfolgs-Nachricht
   * @param title - Optional: Titel der Nachricht
   */
  const handleSuccess = useCallback((message: string, title?: string) => {
    setNotification({
      title: title ?? 'Erfolg',
      message,
      severity: 'success',
    });
  }, []);

  /**
   * Zeigt eine Warn-Nachricht an
   *
   * @param message - Die Warn-Nachricht
   * @param title - Optional: Titel der Nachricht
   */
  const handleWarning = useCallback((message: string, title?: string) => {
    setNotification({
      title: title ?? 'Warnung',
      message,
      severity: 'warning',
    });
  }, []);

  /**
   * Zeigt eine Info-Nachricht an
   *
   * @param message - Die Info-Nachricht
   * @param title - Optional: Titel der Nachricht
   */
  const handleInfo = useCallback((message: string, title?: string) => {
    setNotification({
      title: title ?? 'Info',
      message,
      severity: 'info',
    });
  }, []);

  /**
   * Löscht die aktuelle Notification
   */
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    clearNotification,
  };
};

export default useNotificationHandler;
