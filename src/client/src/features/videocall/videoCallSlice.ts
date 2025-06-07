// src/features/videocall/videoCallSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import videoCallService from '../../api/services/videoCallService';
import { VideoCallState } from '../../types/states/VideoCallState';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';
import { ChatMessage } from '../../types/models/ChatMessage';

// Initialer State für den VideoCall-Reducer
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
  error: undefined,
};

// Async Thunk für das Laden der Videoanruf-Konfiguration
export const getCallConfig = createAsyncThunk(
  'videoCall/getCallConfig',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      console.log(appointmentId);

      // const response = await videoCallService.getCallConfig(appointmentId);
      // return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message ||
      //     'Videoanruf-Konfiguration konnte nicht geladen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Videoanruf-Konfiguration konnte nicht geladen werden'
      );
    }
  }
);

// Async Thunk für das Beenden eines Videoanrufs
export const endVideoCall = createAsyncThunk(
  'videoCall/endVideoCall',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await videoCallService.endCall(roomId);
      // if (response.success) {
      //   return true;
      // }
      // return rejectWithValue(
      //   response.message || 'Videoanruf konnte nicht beendet werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Videoanruf konnte nicht beendet werden'
      );
    }
  }
);

// Async Thunk für das Speichern von Anrufinformationen
export const saveCallInfo = createAsyncThunk(
  'videoCall/saveCallInfo',
  async (
    {
      roomId,
      durationInSeconds,
    }: { roomId: string; durationInSeconds: number },
    { rejectWithValue }
  ) => {
    try {
      await videoCallService.saveCallInfo(roomId, durationInSeconds);
      // if (response.success) {
      //   return true;
      // }
      // return rejectWithValue(
      //   response.message ||
      //     'Anrufinformationen konnten nicht gespeichert werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Anrufinformationen konnten nicht gespeichert werden'
      );
    }
  }
);

// VideoCall Slice
const videoCallSlice = createSlice({
  name: 'videoCall',
  initialState,
  reducers: {
    initializeCall: (state, action: PayloadAction<VideoCallConfig>) => {
      state.roomId = action.payload.roomId;
      state.peerId = action.payload.peerId;
    },
    joinRoom: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    leaveRoom: (state) => {
      state.roomId = null;
      state.isConnected = false;
      state.localStream = null;
      state.remoteStream = null;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
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
    sendMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    endCall: (state) => {
      state.roomId = null;
      state.isConnected = false;
      state.localStream = null;
      state.remoteStream = null;
      state.messages = [];
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Call Config
      .addCase(getCallConfig.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      // .addCase(getCallConfig.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.roomId = action.payload.roomId;
      //   state.peerId = action.payload.peerId;
      // })
      .addCase(getCallConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // End Video Call
      .addCase(endVideoCall.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(endVideoCall.fulfilled, (state) => {
        state.isLoading = false;
        state.roomId = null;
        state.isConnected = false;
        state.localStream = null;
        state.remoteStream = null;
        state.messages = [];
      })
      .addCase(endVideoCall.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Save Call Info
      .addCase(saveCallInfo.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(saveCallInfo.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveCallInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  initializeCall,
  joinRoom,
  leaveRoom,
  setConnected,
  setLocalStream,
  setRemoteStream,
  toggleMic,
  toggleVideo,
  toggleScreenShare,
  toggleChat,
  sendMessage,
  addMessage,
  clearMessages,
  endCall,
  clearError,
} = videoCallSlice.actions;
export default videoCallSlice.reducer;
