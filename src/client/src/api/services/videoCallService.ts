import { VIDEOCALL_ENDPOINTS } from '../../config/endpoints';
import { apiClient } from '../apiClient';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';
import { ApiResponse, PagedResponse } from '../../types/api/UnifiedResponse';

/**
 * Service for video call operations
 */
const videoCallService = {
  /**
   * Get video call configuration
   */
  async getCallConfig(appointmentId: string): Promise<ApiResponse<VideoCallConfig>> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.get<VideoCallConfig>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${appointmentId}/config`);
  },

  /**
   * Create new video call room
   */
  async createCallRoom(appointmentId: string): Promise<ApiResponse<VideoCallConfig>> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.post<VideoCallConfig>(VIDEOCALL_ENDPOINTS.CREATE, { appointmentId });
  },

  /**
   * Join video call room
   */
  async joinCallRoom(roomId: string): Promise<ApiResponse<VideoCallConfig>> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<VideoCallConfig>(`${VIDEOCALL_ENDPOINTS.JOIN}/${roomId}/join`);
  },

  /**
   * Leave video call room
   */
  async leaveCallRoom(roomId: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.LEAVE}/${roomId}/leave`);
  },

  /**
   * Start video call
   */
  async startCall(roomId: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.START}/${roomId}/start`);
  },

  /**
   * End video call
   */
  async endCall(sessionId: string): Promise<void> {
    if (!sessionId?.trim()) throw new Error('Session-ID ist erforderlich');
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.END_CALL}/${sessionId}/end`);
  },

  /**
   * Save call information
   */
  async saveCallInfo(roomId: string, durationInSeconds: number): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    if (durationInSeconds < 0) throw new Error('Dauer muss positiv sein');
    
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/info`, {
      durationInSeconds,
    });
  },

  /**
   * Report technical issue
   */
  async reportIssue(roomId: string, issue: string): Promise<void> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    if (!issue?.trim()) throw new Error('Problembeschreibung ist erforderlich');
    
    await apiClient.post<void>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/report`, {
      issue: issue.trim(),
    });
  },

  /**
   * Join call with updated endpoint
   */
  async joinCall(roomId: string): Promise<ApiResponse<VideoCallConfig>> {
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
  async startRecording(roomId: string): Promise<ApiResponse<{ recordingId: string; status: string }>> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<{ recordingId: string; status: string }>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/recording/start`);
  },

  /**
   * Stop recording
   */
  async stopRecording(roomId: string): Promise<ApiResponse<{ recordingId: string; status: string; url?: string }>> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.post<{ recordingId: string; status: string; url?: string }>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/recording/stop`);
  },

  /**
   * Get call statistics
   */
  async getCallStatistics(roomId: string): Promise<ApiResponse<
  {
    audioLevel: number;
    networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
    packetsLost: number;
    bandwidth: number;
  }>> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return apiClient.get<{
      audioLevel: number;
      networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
      packetsLost: number;
      bandwidth: number;
    }>(`${VIDEOCALL_ENDPOINTS.STATISTICS}`, { roomId });
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
  async getCallHistory(params?: { page?: number; limit?: number }): Promise<ApiResponse<{ calls: unknown[]; total: number }>> {
    const queryParams: Record<string, unknown> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    return apiClient.get<{ calls: unknown[]; total: number }>(VIDEOCALL_ENDPOINTS.MY_CALLS, queryParams);
  },

  /**
   * Test connection quality
   */
  async testConnection(): Promise<ApiResponse<{ status: string; latency?: number }>> {
    return apiClient.get<{ status: string; latency?: number }>(`${VIDEOCALL_ENDPOINTS.DETAILS}/test-connection`);
  },

  /**
   * Get supported features
   */
  async getSupportedFeatures(): Promise<ApiResponse<{ features: string[]; capabilities: Record<string, boolean> }>> {
    return apiClient.get<{ features: string[]; capabilities: Record<string, boolean> }>(`${VIDEOCALL_ENDPOINTS.DETAILS}/features`);
  },

  /**
   * Update call settings
   */
  async updateCallSettings(roomId: string, settings: Record<string, unknown>): Promise<void> {
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
  async getCallParticipants(roomId: string): Promise<PagedResponse<{ id: string; name: string; isConnected: boolean }>> {
    if (!roomId?.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.getPaged<{ id: string; name: string; isConnected: boolean }[]>(`${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/participants`) as PagedResponse<{ id: string; name: string; isConnected: boolean }>;
  },
};

export default videoCallService;