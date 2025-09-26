import videoCallService from "../../api/services/videoCallService";
import { createAppAsyncThunk } from "../../store/thunkHelpers";
import { SuccessResponse, isSuccessResponse } from "../../types/api/UnifiedResponse";
import { VideoCallConfig } from "../../types/models/VideoCallConfig";

export const getCallConfig = createAppAsyncThunk<SuccessResponse<VideoCallConfig>, string>(
  'videoCall/getCallConfig',
  async (appointmentId: string, { rejectWithValue }) => {
    const response = await videoCallService.getCallConfig(appointmentId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const endVideoCall = createAppAsyncThunk<void, string>(
  'videoCall/endVideoCall',
  async (roomId: string, {}) => {
    await videoCallService.endCall(roomId);
  }
);

export const saveCallInfo = createAppAsyncThunk<void, { roomId: string; duration: number }>(
  'videoCall/saveCallInfo',
  async ({ roomId, duration }, {}) => {
    await videoCallService.saveCallInfo(roomId, duration);
  }
);

export const joinVideoCall = createAppAsyncThunk<void, string>(
  'videoCall/joinCall',
  async (roomId: string, {}) => {
    await videoCallService.joinCall(roomId);
  }
);

export const leaveVideoCall = createAppAsyncThunk<void, string>(
  'videoCall/leaveCall',
  async (roomId: string, {}) => {
    await videoCallService.leaveCall(roomId);
  }
);

export const startRecording = createAppAsyncThunk<SuccessResponse<any>, string>(
  'videoCall/startRecording',
  async (roomId: string, { rejectWithValue }) => {
    const response = await videoCallService.startRecording(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const stopRecording = createAppAsyncThunk<SuccessResponse<any>, string>(
  'videoCall/stopRecording',
  async (roomId: string, { rejectWithValue }) => {
    const response = await videoCallService.stopRecording(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const getCallStatistics = createAppAsyncThunk<SuccessResponse<
{ 
  audioLevel: number;
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
  packetsLost: number;
  bandwidth: number;
}>, string>(
  'videoCall/getStatistics',
  async (roomId: string, { rejectWithValue }) => {
    const response = await videoCallService.getCallStatistics(roomId);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const reportTechnicalIssue = createAppAsyncThunk<void, { roomId: string; issue: string; description: string }>(
  'videoCall/reportIssue',
  async ({ roomId, issue, description }, {}) => {
    await videoCallService.reportTechnicalIssue(roomId, issue, description);
  }
);