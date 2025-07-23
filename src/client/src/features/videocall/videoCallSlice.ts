// src/features/videocall/videoCallSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import videoCallService from '../../api/services/videoCallService';
import { VideoCallState } from '../../types/states/VideoCallState';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';
import { ChatMessage } from '../../types/models/ChatMessage';
import { SliceError } from '../../store/types';

// Initial state for the VideoCall reducer
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

// Async thunk for loading video call configuration
export const getCallConfig = createAsyncThunk(
  'videoCall/getCallConfig',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await videoCallService.getCallConfig(appointmentId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Video call configuration could not be loaded'
      );
    }
  }
);

// Async thunk for ending a video call
export const endVideoCall = createAsyncThunk(
  'videoCall/endVideoCall',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await videoCallService.endCall(roomId);
      return roomId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Video call could not be ended'
      );
    }
  }
);

// Async thunk for saving call information
export const saveCallInfo = createAsyncThunk(
  'videoCall/saveCallInfo',
  async (
    { roomId, duration }: { roomId: string; duration: number },
    { rejectWithValue }
  ) => {
    try {
      await videoCallService.saveCallInfo(roomId, duration);
      return { roomId, duration };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Call information could not be saved'
      );
    }
  }
);

// VideoCall slice
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
    setError: (state, action: PayloadAction<SliceError | null>) => {
      state.error = action.payload;
      ;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetCall: (state) => {
      state.roomId = null;
      state.isConnected = false;
      state.peerId = null;
      state.localStream = null;
      state.remoteStream = null;
      state.isMicEnabled = true;
      state.isVideoEnabled = true;
      state.isScreenSharing = false;
      state.isChatOpen = false;
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get call config
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
        state.error = action.payload as SliceError;
      })
      // End video call
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
        state.error = action.payload as SliceError;
      })
      // Save call info
      .addCase(saveCallInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveCallInfo.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(saveCallInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
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