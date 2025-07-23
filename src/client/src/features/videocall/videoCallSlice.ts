// src/features/videocall/videoCallSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import videoCallService from '../../api/services/videoCallService';
import { VideoCallState } from '../../types/states/VideoCallState';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';
import { ChatMessage } from '../../types/models/ChatMessage';
import { SliceError } from '../../store/types';

const initialState: VideoCallState = {
  roomId: null,
  isConnected: false,
  peerId: null,
  localStream: null,
  remoteStream: null,
  isMicEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  isChatOpen: false,
  messages: [],
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

// Slice
const videoCallSlice = createSlice({
  name: 'videoCall',
  initialState,
  reducers: {
    initializeCall: (state, action: PayloadAction<VideoCallConfig>) => {
      state.roomId = action.payload.roomId;
      state.peerId = action.payload.peerId;
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
      state.messages.push(action.payload);
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
  resetCall,
} = videoCallSlice.actions;

export default videoCallSlice.reducer;