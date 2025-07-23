// src/api/services/videoCallService.ts
import { VIDEOCALL_ENDPOINTS } from '../../config/endpoints';
import apiClient from '../apiClient';
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
    try {
      const response = await apiClient.get<VideoCallConfig>(
        `${VIDEOCALL_ENDPOINTS.DETAILS}/${appointmentId}/config`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get call config:', error);
      throw new Error('Videoanruf-Konfiguration konnte nicht geladen werden.');
    }
  },

  /**
   * Erstellt einen neuen Videoanruf-Raum
   * @param appointmentId - ID des Termins
   * @returns Raum-Konfiguration
   */
  createCallRoom: async (appointmentId: string): Promise<VideoCallConfig> => {
    try {
      const response = await apiClient.post<VideoCallConfig>(
        VIDEOCALL_ENDPOINTS.CREATE,
        { appointmentId }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create call room:', error);
      throw new Error('Videoanruf-Raum konnte nicht erstellt werden.');
    }
  },

  /**
   * Tritt einem Videoanruf-Raum bei
   * @param roomId - ID des Raums
   * @returns Raum-Informationen
   */
  joinCallRoom: async (roomId: string): Promise<VideoCallConfig> => {
    try {
      const response = await apiClient.post<VideoCallConfig>(
        `${VIDEOCALL_ENDPOINTS.JOIN}/${roomId}/join`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to join call room:', error);
      throw new Error('Videoanruf-Raum konnte nicht betreten werden.');
    }
  },

  /**
   * Verlässt einen Videoanruf-Raum
   * @param roomId - ID des Raums
   */
  leaveCallRoom: async (roomId: string): Promise<void> => {
    try {
      await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.LEAVE}/${roomId}/leave`);
    } catch (error) {
      console.error('Failed to leave call room:', error);
      throw new Error('Videoanruf-Raum konnte nicht verlassen werden.');
    }
  },

  /**
   * Startet einen Videoanruf
   * @param roomId - ID des Raums
   */
  startCall: async (roomId: string): Promise<void> => {
    try {
      await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.START}/${roomId}/start`);
    } catch (error) {
      console.error('Failed to start call:', error);
      throw new Error('Videoanruf konnte nicht gestartet werden.');
    }
  },

  /**
   * Beendet einen Videoanruf
   * @param sessionId - ID des Anrufraums
   * @returns Erfolg-/Fehlermeldung
   */
  endCall: async (sessionId: string): Promise<void> => {
    const response = await apiClient.post<void>(
      `${VIDEOCALL_ENDPOINTS.END_CALL}/${sessionId}/end`
    );
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
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/info`,
      {
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
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/report`,
      {
        issue,
      }
    );
    return response.data;
  },
};

export default videoCallService;
