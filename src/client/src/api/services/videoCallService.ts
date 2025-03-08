// src/api/services/videoCallService.ts
import apiClient from '../apiClient';
import { VIDEOCALL_ENDPOINTS } from '../../config/endpoints';
// import { ApiResponse } from '../../types/common/ApiResponse';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';

/**
 * Service für Videoanruf-Operationen
 */
const videoCallService = {
  /**
   * Holt die Konfiguration für einen Videoanruf
   * @param appointmentId - ID des Termins, für den ein Anruf gestartet wird
   * @returns Konfiguration für den Videoanruf
   */
  getCallConfig: async (appointmentId: string): Promise<VideoCallConfig> => {
    const response = await apiClient.get<VideoCallConfig>(
      VIDEOCALL_ENDPOINTS.CONFIG,
      {
        params: { appointmentId },
      }
    );
    return response.data;
  },

  /**
   * Beendet einen Videoanruf
   * @param roomId - ID des Anrufraums
   * @returns Erfolg-/Fehlermeldung
   */
  endCall: async (roomId: string): Promise<void> => {
    const response = await apiClient.post<void>(VIDEOCALL_ENDPOINTS.END_CALL, {
      roomId,
      action: 'end',
    });
    return response.data;
  },

  /**
   * Speichert eine Anrufaufzeichnung (Information)
   * @param roomId - ID des Anrufraums
   * @param durationInSeconds - Dauer des Anrufs in Sekunden
   * @returns Erfolg-/Fehlermeldung
   */
  saveCallInfo: async (
    roomId: string,
    durationInSeconds: number
  ): Promise<void> => {
    const response = await apiClient.post<void>(
      `${VIDEOCALL_ENDPOINTS.CONFIG}/info`,
      {
        roomId,
        durationInSeconds,
      }
    );
    return response.data;
  },

  /**
   * Meldet ein technisches Problem während eines Anrufs
   * @param roomId - ID des Anrufraums
   * @param issue - Beschreibung des Problems
   * @returns Erfolg-/Fehlermeldung
   */
  reportIssue: async (roomId: string, issue: string): Promise<void> => {
    const response = await apiClient.post<void>(
      `${VIDEOCALL_ENDPOINTS.CONFIG}/report`,
      {
        roomId,
        issue,
      }
    );
    return response.data;
  },
};

export default videoCallService;
