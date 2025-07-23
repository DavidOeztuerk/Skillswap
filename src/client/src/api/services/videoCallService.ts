// src/api/services/videoCallService.ts
import { VIDEOCALL_ENDPOINTS } from '../../config/endpoints';
import apiClient from '../apiClient';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';

/**
 * Service for video call operations
 */
const videoCallService = {
  /**
   * Get video call configuration
   */
  async getCallConfig(appointmentId: string): Promise<VideoCallConfig> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.get<VideoCallConfig>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${appointmentId}/config`);
  },

  /**
   * Create new video call room
   */
  async createCallRoom(appointmentId: string): Promise<VideoCallConfig> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.post<VideoCallConfig>(VIDEOCALL_ENDPOINTS.CREATE, { appointmentId });
  },

  /**
   * Join video call room
   */
  async joinCallRoom(roomId: string): Promise<VideoCallConfig> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<VideoCallConfig>(`${VIDEOCALL_ENDPOINTS.JOIN}/${roomId}/join`);
  },

  /**
   * Leave video call room
   */
  async leaveCallRoom(roomId: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.LEAVE}/${roomId}/leave`);
  },

  /**
   * Start video call
   */
  async startCall(roomId: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.START}/${roomId}/start`);
  },

  /**
   * End video call
   */
  async endCall(sessionId: string): Promise<void> {
    if (!sessionId?.trim()) throw new Error('Session-ID ist erforderlich');
    return apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.END_CALL}/${sessionId}/end`);
  },

  /**
   * Save call information
   */
  async saveCallInfo(roomId: string, durationInSeconds: number): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    if (durationInSeconds < 0) throw new Error('Dauer muss positiv sein');
    
    return apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/info`, {
      durationInSeconds,
    });
  },

  /**
   * Report technical issue
   */
  async reportIssue(roomId: string, issue: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    if (!issue?.trim()) throw new Error('Problembeschreibung ist erforderlich');
    
    return apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/report`, {
      issue: issue.trim(),
    });
  },
};

export default videoCallService;