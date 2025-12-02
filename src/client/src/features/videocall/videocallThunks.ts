import videoCallService from '../../api/services/videoCallService';
import { createAppAsyncThunk } from '../../store/thunkHelpers';
import { SuccessResponse, isSuccessResponse } from '../../types/api/UnifiedResponse';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';
import { ChatMessage, SendChatMessageRequest } from '../../types/models/ChatMessage';

// ============================================================================
// Types
// ============================================================================

export interface JoinCallPayload {
  sessionId: string;
  connectionId?: string;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  deviceInfo?: string;
}

export interface SaveCallInfoPayload {
  roomId: string;
  duration: number;
}

export interface ReportIssuePayload {
  roomId: string;
  issue: string;
  description: string;
}

export interface GetChatHistoryPayload {
  sessionId: string;
  limit?: number;
}

// ============================================================================
// Thunks
// ============================================================================

/**
 * Get call configuration for an appointment
 */
export const getCallConfig = createAppAsyncThunk<SuccessResponse<VideoCallConfig>, string>(
  'videoCall/getCallConfig',
  async (appointmentId: string, { rejectWithValue }) => {
    const response = await videoCallService.getCallConfig(appointmentId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

/**
 * Join a video call session
 */
export const joinVideoCall = createAppAsyncThunk<void, JoinCallPayload>(
  'videoCall/joinCall',
  async (payload, { rejectWithValue }) => {
    const {
      sessionId,
      connectionId,
      cameraEnabled = true,
      microphoneEnabled = true,
      deviceInfo,
    } = payload;

    try {
      await videoCallService.joinCall(
        sessionId,
        connectionId,
        cameraEnabled,
        microphoneEnabled,
        deviceInfo
      );
    } catch (error) {
      console.error('❌ joinVideoCall error:', error);
      return rejectWithValue({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to join call'],
        errorCode: 'JOIN_CALL_ERROR',
      });
    }
  }
);

/**
 * Leave a video call session
 * Note: Even if API fails, we still want to clean up local state
 */
export const leaveVideoCall = createAppAsyncThunk<void, string>(
  'videoCall/leaveCall',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      await videoCallService.leaveCall(sessionId);
    } catch (error) {
      console.error('❌ leaveVideoCall error:', error);
      // Still log but don't block - user needs to leave
      return rejectWithValue({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to leave call'],
        errorCode: 'LEAVE_CALL_ERROR',
      });
    }
  }
);

/**
 * End a video call (for host/initiator)
 */
export const endVideoCall = createAppAsyncThunk<void, string>(
  'videoCall/endVideoCall',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await videoCallService.endCall(roomId);
    } catch (error) {
      console.error('❌ endVideoCall error:', error);
      return rejectWithValue({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to end call'],
        errorCode: 'END_CALL_ERROR',
      });
    }
  }
);

/**
 * Save call information after call ends
 */
export const saveCallInfo = createAppAsyncThunk<void, SaveCallInfoPayload>(
  'videoCall/saveCallInfo',
  async ({ roomId, duration }, { rejectWithValue }) => {
    try {
      await videoCallService.saveCallInfo(roomId, duration);
    } catch (error) {
      console.error('❌ saveCallInfo error:', error);
      return rejectWithValue({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to save call info'],
        errorCode: 'SAVE_INFO_ERROR',
      });
    }
  }
);

/**
 * Report a technical issue during a call
 */
export const reportTechnicalIssue = createAppAsyncThunk<void, ReportIssuePayload>(
  'videoCall/reportIssue',
  async ({ roomId, issue, description }, { rejectWithValue }) => {
    try {
      await videoCallService.reportTechnicalIssue(roomId, issue, description);
    } catch (error) {
      console.error('❌ reportTechnicalIssue error:', error);
      return rejectWithValue({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to report issue'],
        errorCode: 'REPORT_ISSUE_ERROR',
      });
    }
  }
);

/**
 * Start recording a call
 */
export const startRecording = createAppAsyncThunk<SuccessResponse<unknown>, string>(
  'videoCall/startRecording',
  async (roomId: string, { rejectWithValue }) => {
    const response = await videoCallService.startRecording(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

/**
 * Stop recording a call
 */
export const stopRecording = createAppAsyncThunk<SuccessResponse<unknown>, string>(
  'videoCall/stopRecording',
  async (roomId: string, { rejectWithValue }) => {
    const response = await videoCallService.stopRecording(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

/**
 * Get call statistics
 */
export const getCallStatistics = createAppAsyncThunk<
  SuccessResponse<{
    audioLevel: number;
    networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
    packetsLost: number;
    bandwidth: number;
  }>,
  string
>(
  'videoCall/getStatistics',
  async (roomId: string, { rejectWithValue }) => {
    const response = await videoCallService.getCallStatistics(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

/**
 * Send a chat message (stored in database)
 */
export const sendChatMessage = createAppAsyncThunk<boolean, SendChatMessageRequest>(
  'videoCall/sendChatMessage',
  async (request, { rejectWithValue }) => {
    const response = await videoCallService.sendChatMessage(request);
    return isSuccessResponse(response) ? response.data! : rejectWithValue(response);
  }
);

/**
 * Get chat history for a session
 */
export const getChatHistory = createAppAsyncThunk<ChatMessage[], GetChatHistoryPayload>(
  'videoCall/getChatHistory',
  async ({ sessionId, limit }, { rejectWithValue }) => {
    const response = await videoCallService.getChatHistory(sessionId, limit);
    return isSuccessResponse(response) ? response.data! : rejectWithValue(response);
  }
);

/**
 * Batch cleanup: Leave call and save info
 * Uses Promise.allSettled to ensure both complete even if one fails
 */
export const cleanupVideoCall = createAppAsyncThunk<
  { leaveResult: 'fulfilled' | 'rejected'; saveResult: 'fulfilled' | 'rejected' },
  { sessionId: string; roomId: string; duration: number }
>(
  'videoCall/cleanup',
  async ({ sessionId, roomId, duration }, { dispatch }) => {
    const results = await Promise.allSettled([
      dispatch(leaveVideoCall(sessionId)),
      dispatch(saveCallInfo({ roomId, duration })),
    ]);

    return {
      leaveResult: results[0].status,
      saveResult: results[1].status,
    };
  }
);