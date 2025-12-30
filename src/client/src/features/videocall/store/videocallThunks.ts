// ============================================================================
// Types - Request Payloads
// ============================================================================

import { createAppAsyncThunk } from '../../../core/store/thunkHelpers';
import {
  type SuccessResponse,
  isSuccessResponse,
  createErrorResponse,
} from '../../../shared/types/api/UnifiedResponse';
import videoCallService from '../services/videoCallService';
import type { VideoCallConfig } from '../types/VideoCallConfig';
import type {
  JoinCallResponse,
  LeaveCallResponse,
  EndCallResponse,
  SaveCallInfoResponse,
  ReportIssueResponse,
} from '../types/VideoCallResponses';

export interface JoinCallPayload {
  sessionId: string;
  connectionId?: string;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  deviceInfo?: string;
}

export interface EndCallPayload {
  sessionId: string;
  durationSeconds?: number;
  rating?: number;
  feedback?: string;
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

// ============================================================================
// Thunks
// ============================================================================

/**
 * Get call configuration for an appointment
 * Backend: GET /api/calls/{sessionId}/config
 */
export const getCallConfig = createAppAsyncThunk<SuccessResponse<VideoCallConfig>, string>(
  'videoCall/getCallConfig',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await videoCallService.getCallConfig(appointmentId);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ getCallConfig error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

/**
 * Join a video call session
 * Backend: POST /api/calls/join
 * Returns: JoinCallResponse { sessionId, roomId, success, otherParticipants }
 */
export const joinVideoCall = createAppAsyncThunk<
  SuccessResponse<JoinCallResponse>,
  JoinCallPayload
>('videoCall/joinCall', async (payload, { rejectWithValue }) => {
  const {
    sessionId,
    connectionId,
    cameraEnabled = true,
    microphoneEnabled = true,
    deviceInfo,
  } = payload;

  try {
    const response = await videoCallService.joinCall(
      sessionId,
      connectionId,
      cameraEnabled,
      microphoneEnabled,
      deviceInfo
    );
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  } catch (error) {
    console.error('❌ joinVideoCall error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

/**
 * Leave a video call session
 * Backend: POST /api/calls/leave
 * Returns: LeaveCallResponse { sessionId, success }
 */
export const leaveVideoCall = createAppAsyncThunk<SuccessResponse<LeaveCallResponse>, string>(
  'videoCall/leaveCall',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await videoCallService.leaveCall(sessionId);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ leaveVideoCall error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

/**
 * End a video call (for host/initiator)
 * Backend: POST /api/calls/end
 * Returns: EndCallResponse { sessionId, endedAt, durationSeconds, rating }
 */
export const endVideoCall = createAppAsyncThunk<SuccessResponse<EndCallResponse>, EndCallPayload>(
  'videoCall/endVideoCall',
  async ({ sessionId, durationSeconds, rating, feedback }, { rejectWithValue }) => {
    try {
      const response = await videoCallService.endCall(sessionId, durationSeconds, rating, feedback);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
    } catch (error) {
      console.error('❌ endVideoCall error:', error);
      return rejectWithValue(createErrorResponse(error));
    }
  }
);

/**
 * Save call information after call ends
 * Note: This functionality is now part of endCall - kept for backwards compatibility
 * Returns: SaveCallInfoResponse { roomId, durationSaved, savedAt }
 */
export const saveCallInfo = createAppAsyncThunk<
  SuccessResponse<SaveCallInfoResponse>,
  SaveCallInfoPayload
>('videoCall/saveCallInfo', async ({ roomId, duration }, { rejectWithValue }) => {
  try {
    const response = await videoCallService.saveCallInfo(roomId, duration);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  } catch (error) {
    console.error('❌ saveCallInfo error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

/**
 * Report a technical issue during a call
 * Note: Backend endpoint pending - returns synthetic response
 * Returns: ReportIssueResponse { roomId, issue, reportedAt }
 */
export const reportTechnicalIssue = createAppAsyncThunk<
  SuccessResponse<ReportIssueResponse>,
  ReportIssuePayload
>('videoCall/reportIssue', async ({ roomId, issue, description }, { rejectWithValue }) => {
  try {
    const response = await videoCallService.reportTechnicalIssue(roomId, issue, description);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  } catch (error) {
    console.error('❌ reportTechnicalIssue error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

/**
 * Start recording a call
 * Backend: POST /api/calls/{roomId}/recording/start
 */
export const startRecording = createAppAsyncThunk<
  SuccessResponse<{ recordingId: string; status: string }>,
  string
>('videoCall/startRecording', async (roomId: string, { rejectWithValue }) => {
  try {
    const response = await videoCallService.startRecording(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  } catch (error) {
    console.error('❌ startRecording error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

/**
 * Stop recording a call
 * Backend: POST /api/calls/{roomId}/recording/stop
 */
export const stopRecording = createAppAsyncThunk<
  SuccessResponse<{ recordingId: string; status: string; url?: string }>,
  string
>('videoCall/stopRecording', async (roomId: string, { rejectWithValue }) => {
  try {
    const response = await videoCallService.stopRecording(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  } catch (error) {
    console.error('❌ stopRecording error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

/**
 * Get call statistics
 * Backend: GET /api/statistics
 */
export const getCallStatistics = createAppAsyncThunk<
  SuccessResponse<{
    audioLevel: number;
    networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
    packetsLost: number;
    bandwidth: number;
  }>,
  string
>('videoCall/getStatistics', async (roomId: string, { rejectWithValue }) => {
  try {
    const response = await videoCallService.getCallStatistics(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  } catch (error) {
    console.error('❌ getCallStatistics error:', error);
    return rejectWithValue(createErrorResponse(error));
  }
});

/**
 * Batch cleanup: Leave call and save info
 * Uses Promise.allSettled to ensure both complete even if one fails
 */
export interface CleanupResult {
  leaveResult: 'fulfilled' | 'rejected';
  saveResult: 'fulfilled' | 'rejected';
}

export const cleanupVideoCall = createAppAsyncThunk<
  SuccessResponse<CleanupResult>,
  { sessionId: string; roomId: string; duration: number }
>('videoCall/cleanup', async ({ sessionId, roomId, duration }, { dispatch }) => {
  const results = await Promise.allSettled([
    dispatch(leaveVideoCall(sessionId)),
    dispatch(saveCallInfo({ roomId, duration })),
  ]);

  const cleanupResult: CleanupResult = {
    leaveResult: results[0].status,
    saveResult: results[1].status,
  };

  return {
    success: true,
    data: cleanupResult,
    message: 'Cleanup completed',
  };
});
