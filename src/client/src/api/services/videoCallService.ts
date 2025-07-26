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

  /**
   * Join call with updated endpoint
   */
  async joinCall(roomId: string): Promise<VideoCallConfig> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<VideoCallConfig>(`${VIDEOCALL_ENDPOINTS.JOIN}/${roomId}`);
  },

  /**
   * Leave call with updated endpoint
   */
  async leaveCall(roomId: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.LEAVE}/${roomId}`);
  },

  /**
   * Start recording
   */
  async startRecording(roomId: string): Promise<any> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<any>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/recording/start`);
  },

  /**
   * Stop recording
   */
  async stopRecording(roomId: string): Promise<any> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<any>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/recording/stop`);
  },

  /**
   * Get call statistics
   */
  async getCallStatistics(roomId: string): Promise<any> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.get<any>(`${VIDEOCALL_ENDPOINTS.STATISTICS}?roomId=${roomId}`);
  },

  /**
   * Report technical issue with details
   */
  async reportTechnicalIssue(roomId: string, issue: string, description: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    if (!issue?.trim()) throw new Error('Problem-Typ ist erforderlich');
    
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/report`, {
      issue: issue.trim(),
      description: description.trim(),
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Get call history
   */
  async getCallHistory(params?: { page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${VIDEOCALL_ENDPOINTS.MY_CALLS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<any>(url);
  },

  /**
   * Test connection quality
   */
  async testConnection(): Promise<any> {
    return apiClient.get<any>(`${VIDEOCALL_ENDPOINTS.DETAILS}/test-connection`);
  },

  /**
   * Get supported features
   */
  async getSupportedFeatures(): Promise<any> {
    return apiClient.get<any>(`${VIDEOCALL_ENDPOINTS.DETAILS}/features`);
  },

  /**
   * Update call settings
   */
  async updateCallSettings(roomId: string, settings: any): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    await apiClient.put<void>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/settings`, settings);
  },

  /**
   * Send chat message
   */
  async sendChatMessage(roomId: string, message: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    if (!message?.trim()) throw new Error('Nachricht ist erforderlich');
    
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/chat`, {
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Get call participants
   */
  async getCallParticipants(roomId: string): Promise<any[]> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.get<any[]>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/participants`);
  },
};

export default videoCallService;