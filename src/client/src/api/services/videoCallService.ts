import { VIDEOCALL_ENDPOINTS } from '../../config/endpoints';
import { apiClient } from '../apiClient';
import type { VideoCallConfig } from '../../types/models/VideoCallConfig';
import type { ApiResponse, PagedResponse } from '../../types/api/UnifiedResponse';
import type { SendChatMessageRequest } from '../../types/models/ChatMessage';
import type {
  JoinCallResponse,
  LeaveCallResponse,
  EndCallResponse,
  ChatMessageResponse,
  SaveCallInfoResponse,
  ReportIssueResponse,
} from '../../types/contracts/responses/VideoCallResponses';

/**
 * Service for video call operations
 */
const videoCallService = {
  /**
   * Get video call configuration
   */
  async getCallConfig(appointmentId: string): Promise<ApiResponse<VideoCallConfig>> {
    if (!appointmentId.trim()) throw new Error('Termin-ID ist erforderlich');
    return await apiClient.get<VideoCallConfig>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${appointmentId}/config`
    );
  },

  /**
   * Create new video call room
   */
  async createCallRoom(appointmentId: string): Promise<ApiResponse<VideoCallConfig>> {
    if (!appointmentId.trim()) throw new Error('Termin-ID ist erforderlich');
    return await apiClient.post<VideoCallConfig>(VIDEOCALL_ENDPOINTS.CREATE, { appointmentId });
  },

  /**
   * Join video call room
   */
  async joinCallRoom(roomId: string): Promise<ApiResponse<VideoCallConfig>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.post<VideoCallConfig>(`${VIDEOCALL_ENDPOINTS.JOIN}/${roomId}/join`);
  },

  /**
   * Leave video call room (legacy endpoint)
   * @deprecated Use leaveCall() instead
   */
  async leaveCallRoom(roomId: string): Promise<ApiResponse<LeaveCallResponse>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.post<LeaveCallResponse>(`${VIDEOCALL_ENDPOINTS.LEAVE}/${roomId}/leave`);
  },

  /**
   * Start video call
   */
  async startCall(roomId: string): Promise<ApiResponse<{ sessionId: string; startedAt: string }>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.post<{ sessionId: string; startedAt: string }>(
      `${VIDEOCALL_ENDPOINTS.START}/${roomId}/start`
    );
  },

  /**
   * End video call
   * Backend returns: EndCallResponse { sessionId, endedAt, durationSeconds, rating }
   */
  async endCall(
    sessionId: string,
    durationSeconds?: number,
    rating?: number,
    feedback?: string
  ): Promise<ApiResponse<EndCallResponse>> {
    if (!sessionId.trim()) throw new Error('Session-ID ist erforderlich');
    return await apiClient.post<EndCallResponse>(VIDEOCALL_ENDPOINTS.END_CALL, {
      sessionId,
      durationSeconds: durationSeconds ?? 0,
      rating,
      feedback,
    });
  },

  /**
   * Save call information
   * Note: This functionality is now part of endCall - kept for backwards compatibility
   * Returns a synthetic response since there's no dedicated backend endpoint
   */
  async saveCallInfo(
    roomId: string,
    durationInSeconds: number
  ): Promise<ApiResponse<SaveCallInfoResponse>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    if (durationInSeconds < 0) throw new Error('Dauer muss positiv sein');

    // Note: Save call info is now handled by endCall endpoint
    // This method returns a synthetic success response for backwards compatibility
    await Promise.resolve();

    return {
      success: true,
      data: {
        roomId,
        durationSaved: durationInSeconds,
        savedAt: new Date().toISOString(),
      },
      message: 'Call info will be saved when call ends',
    };
  },

  /**
   * Report technical issue (legacy endpoint)
   * @deprecated Use reportTechnicalIssue() instead
   */
  async reportIssue(roomId: string, issue: string): Promise<ApiResponse<ReportIssueResponse>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    if (!issue.trim()) throw new Error('Problembeschreibung ist erforderlich');

    // Return synthetic response as backend endpoint doesn't exist
    await Promise.resolve();

    return {
      success: true,
      data: {
        roomId,
        issue: issue.trim(),
        reportedAt: new Date().toISOString(),
      },
      message: 'Issue logged',
    };
  },

  /**
   * Join call with updated endpoint
   * Backend returns: JoinCallResponse { sessionId, roomId, success, otherParticipants }
   */
  async joinCall(
    sessionId: string,
    connectionId?: string,
    cameraEnabled = true,
    microphoneEnabled = true,
    deviceInfo?: string
  ): Promise<ApiResponse<JoinCallResponse>> {
    if (!sessionId.trim()) throw new Error('Session-ID ist erforderlich');

    return await apiClient.post<JoinCallResponse>(VIDEOCALL_ENDPOINTS.JOIN, {
      sessionId,
      connectionId:
        connectionId ?? `conn_${String(Date.now())}_${Math.random().toString(36).substring(2, 11)}`,
      cameraEnabled,
      microphoneEnabled,
      deviceInfo: deviceInfo ?? navigator.userAgent,
    });
  },

  /**
   * Leave call with updated endpoint
   * Backend returns: LeaveCallResponse { sessionId, success }
   */
  async leaveCall(sessionId: string): Promise<ApiResponse<LeaveCallResponse>> {
    if (!sessionId.trim()) throw new Error('Session-ID ist erforderlich');
    return await apiClient.post<LeaveCallResponse>(VIDEOCALL_ENDPOINTS.LEAVE, { sessionId });
  },

  /**
   * Start recording
   */
  async startRecording(
    roomId: string
  ): Promise<ApiResponse<{ recordingId: string; status: string }>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.post<{ recordingId: string; status: string }>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/recording/start`
    );
  },

  /**
   * Stop recording
   */
  async stopRecording(
    roomId: string
  ): Promise<ApiResponse<{ recordingId: string; status: string; url?: string }>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.post<{ recordingId: string; status: string; url?: string }>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/recording/stop`
    );
  },

  /**
   * Get call statistics
   */
  async getCallStatistics(roomId: string): Promise<
    ApiResponse<{
      audioLevel: number;
      networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
      packetsLost: number;
      bandwidth: number;
    }>
  > {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.get<{
      audioLevel: number;
      networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
      packetsLost: number;
      bandwidth: number;
    }>(VIDEOCALL_ENDPOINTS.STATISTICS, { roomId });
  },

  /**
   * Report technical issue with details
   * Note: No dedicated backend endpoint yet - returns synthetic response
   * TODO: Implement backend endpoint for issue reporting
   */
  async reportTechnicalIssue(
    roomId: string,
    issue: string,
    description: string
  ): Promise<ApiResponse<ReportIssueResponse>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    if (!issue.trim()) throw new Error('Problem-Typ ist erforderlich');

    // Log the issue for now - backend endpoint doesn't exist yet
    console.warn('[VideoCallService] reportTechnicalIssue: Backend endpoint not implemented', {
      roomId,
      issue,
      description,
    });

    await Promise.resolve();

    return {
      success: true,
      data: {
        roomId,
        issue: issue.trim(),
        reportedAt: new Date().toISOString(),
      },
      message: 'Issue logged locally (backend endpoint pending)',
    };
  },

  /**
   * Get call history
   */
  async getCallHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ calls: unknown[]; total: number }>> {
    const queryParams: Record<string, number> = {};
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.limit !== undefined) queryParams.limit = params.limit;
    return await apiClient.get<{ calls: unknown[]; total: number }>(
      VIDEOCALL_ENDPOINTS.MY_CALLS,
      queryParams
    );
  },

  /**
   * Test connection quality
   */
  async testConnection(): Promise<ApiResponse<{ status: string; latency?: number }>> {
    return await apiClient.get<{ status: string; latency?: number }>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/test-connection`
    );
  },

  /**
   * Get supported features
   */
  async getSupportedFeatures(): Promise<
    ApiResponse<{ features: string[]; capabilities: Record<string, boolean> }>
  > {
    return await apiClient.get<{ features: string[]; capabilities: Record<string, boolean> }>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/features`
    );
  },

  /**
   * Update call settings
   */
  async updateCallSettings(
    roomId: string,
    settings: Record<string, unknown>
  ): Promise<ApiResponse<{ roomId: string; updated: boolean }>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.put<{ roomId: string; updated: boolean }>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/settings`,
      settings
    );
  },

  /**
   * Send chat message - messages are persisted to database
   * @param request - Message details including sessionId, senderId, and message content
   */
  async sendChatMessage(request: SendChatMessageRequest): Promise<ApiResponse<boolean>> {
    if (!request.sessionId.trim()) throw new Error('Session-ID ist erforderlich');
    if (!request.message.trim()) throw new Error('Nachricht ist erforderlich');

    return await apiClient.post<boolean>(`${VIDEOCALL_ENDPOINTS.DETAILS}/chat/send`, request);
  },

  /**
   * Get call participants
   */
  async getCallParticipants(
    roomId: string
  ): Promise<PagedResponse<{ id: string; name: string; isConnected: boolean }>> {
    if (!roomId.trim()) throw new Error('Raum-ID ist erforderlich');
    return await apiClient.getPaged<{ id: string; name: string; isConnected: boolean }>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${roomId}/participants`
    );
  },

  /**
   * Get chat history for a session - retrieves persisted messages from database
   * Backend returns: ChatMessageResponse[]
   * @param sessionId - The video call session ID
   * @param limit - Optional limit on number of messages to retrieve
   */
  async getChatHistory(
    sessionId: string,
    limit?: number
  ): Promise<ApiResponse<ChatMessageResponse[]>> {
    if (!sessionId.trim()) throw new Error('Session-ID ist erforderlich');

    const queryParams = limit !== undefined ? { limit } : undefined;
    return apiClient.get<ChatMessageResponse[]>(
      `${VIDEOCALL_ENDPOINTS.DETAILS}/${sessionId}/chat-history`,
      queryParams
    );
  },
};

export default videoCallService;
