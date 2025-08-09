import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import videoCallService from '../../api/services/videoCallService';
import { VideoCallState } from '../../types/states/VideoCallState';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';
import { ChatMessage } from '../../types/models/ChatMessage';
import { SliceError } from '../../store/types';

const initialState: VideoCallState = {
  roomId: null,
  isConnected: false,
  isInitializing: false,
  peerId: null,
  localStream: null,
  remoteStream: null,
  participants: [],
  callDuration: 0,
  callStartTime: null,
  connectionQuality: 'good',
  isMicEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  isChatOpen: false,
  isRecording: false,
  messages: [],
  callStatistics: {
    audioLevel: 0,
    networkQuality: 'good',
    packetsLost: 0,
    bandwidth: 0,
  },
  settings: {
    videoQuality: 'hd',
    audioQuality: 'high',
    backgroundBlur: false,
    virtualBackground: null,
    speakerDetection: true,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const getCallConfig = createAsyncThunk(
  'videoCall/getCallConfig',
  async (appointmentId: string) => {
    return await videoCallService.getCallConfig(appointmentId);
  }
);

export const endVideoCall = createAsyncThunk(
  'videoCall/endVideoCall',
  async (roomId: string) => {
    await videoCallService.endCall(roomId);
    return roomId;
  }
);

export const saveCallInfo = createAsyncThunk(
  'videoCall/saveCallInfo',
  async ({ roomId, duration }: { roomId: string; duration: number }) => {
    await videoCallService.saveCallInfo(roomId, duration);
    return { roomId, duration };
  }
);

export const joinVideoCall = createAsyncThunk(
  'videoCall/joinCall',
  async (roomId: string) => {
    return await videoCallService.joinCall(roomId);
  }
);

export const leaveVideoCall = createAsyncThunk(
  'videoCall/leaveCall',
  async (roomId: string) => {
    await videoCallService.leaveCall(roomId);
    return roomId;
  }
);

export const startRecording = createAsyncThunk(
  'videoCall/startRecording',
  async (roomId: string) => {
    return await videoCallService.startRecording(roomId);
  }
);

export const stopRecording = createAsyncThunk(
  'videoCall/stopRecording',
  async (roomId: string) => {
    return await videoCallService.stopRecording(roomId);
  }
);

export const getCallStatistics = createAsyncThunk(
  'videoCall/getStatistics',
  async (roomId: string) => {
    return await videoCallService.getCallStatistics(roomId);
  }
);

export const reportTechnicalIssue = createAsyncThunk(
  'videoCall/reportIssue',
  async ({ roomId, issue, description }: { roomId: string; issue: string; description: string }) => {
    await videoCallService.reportTechnicalIssue(roomId, issue, description);
    return { roomId, issue, description };
  }
);

// Slice
const videoCallSlice = createSlice({
  name: 'videoCall',
  initialState,
  reducers: {
    initializeCall: (state, action: PayloadAction<VideoCallConfig>) => {
      state.roomId = action.payload?.roomId;
      state.peerId = action.payload?.peerId;
      state.isConnected = false;
      state.error = null;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setPeerId: (state, action: PayloadAction<string>) => {
      state.peerId = action.payload;
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.localStream = action.payload;
    },
    setRemoteStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.remoteStream = action.payload;
    },
    toggleMic: (state) => {
      state.isMicEnabled = !state.isMicEnabled;
    },
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled;
    },
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (action.payload) {
        state.messages.push(action.payload);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setError: (state, action) => {
        state.error = action.payload as SliceError;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
    setCallDuration: (state, action: PayloadAction<number>) => {
      state.callDuration = action.payload;
    },
    setCallStartTime: (state, action: PayloadAction<Date | null>) => {
      state.callStartTime = action.payload;
    },
    addParticipant: (state, action: PayloadAction<any>) => {
      if (action.payload) {
        state.participants.push(action.payload);
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants?.filter(p => p?.id !== action.payload);
    },
    updateParticipant: (state, action: PayloadAction<any>) => {
      const index = state.participants?.findIndex(p => p?.id === action.payload?.id);
      if (index !== -1 && state.participants[index]) {
        state.participants[index] = { ...state.participants[index], ...action.payload };
      }
    },
    setConnectionQuality: (state, action: PayloadAction<'poor' | 'fair' | 'good' | 'excellent'>) => {
      state.connectionQuality = action.payload;
    },
    updateCallStatistics: (state, action: PayloadAction<Partial<VideoCallState['callStatistics']>>) => {
      state.callStatistics = { ...state.callStatistics, ...action.payload };
    },
    updateSettings: (state, action: PayloadAction<Partial<VideoCallState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    resetCall: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get Call Config
      .addCase(getCallConfig.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCallConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roomId = action.payload.roomId;
        state.peerId = action.payload.peerId;
        state.error = null;
      })
      .addCase(getCallConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // End Video Call
      .addCase(endVideoCall.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(endVideoCall.fulfilled, (state) => {
        state.isLoading = false;
        state.isConnected = false;
        state.localStream = null;
        state.remoteStream = null;
        state.error = null;
      })
      .addCase(endVideoCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Save Call Info
      .addCase(saveCallInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveCallInfo.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(saveCallInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as SliceError;
      })

      // Join Video Call
      .addCase(joinVideoCall.pending, (state) => {
        state.isInitializing = true;
        state.error = null;
      })
      .addCase(joinVideoCall.fulfilled, (state, _action) => {
        state.isInitializing = false;
        state.isConnected = true;
        state.callStartTime = new Date();
        state.error = null;
      })
      .addCase(joinVideoCall.rejected, (state, action) => {
        state.isInitializing = false;
        state.error = action.error as SliceError;
      })

      // Leave Video Call
      .addCase(leaveVideoCall.fulfilled, (state) => {
        state.isConnected = false;
        state.localStream = null;
        state.remoteStream = null;
        state.participants = [];
        state.callStartTime = null;
        state.callDuration = 0;
      })

      // Start Recording
      .addCase(startRecording.fulfilled, (state) => {
        state.isRecording = true;
      })

      // Stop Recording
      .addCase(stopRecording.fulfilled, (state) => {
        state.isRecording = false;
      })

      // Get Call Statistics
      .addCase(getCallStatistics.fulfilled, (state, action) => {
        state.callStatistics = action.payload;
      });
  },
});

export const {
  initializeCall,
  setConnected,
  setPeerId,
  setLocalStream,
  setRemoteStream,
  toggleMic,
  toggleVideo,
  toggleScreenShare,
  toggleChat,
  addMessage,
  clearMessages,
  setError,
  setLoading,
  setInitializing,
  setCallDuration,
  setCallStartTime,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setConnectionQuality,
  updateCallStatistics,
  updateSettings,
  setRecording,
  resetCall,
} = videoCallSlice.actions;

export default videoCallSlice.reducer;