import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VideoCallConfig } from '../../types/models/VideoCallConfig';
import { ChatMessage } from '../../types/models/ChatMessage';
import { withDefault, isDefined } from '../../utils/safeAccess';
import { getCallConfig, endVideoCall, saveCallInfo, joinVideoCall, leaveVideoCall, startRecording, stopRecording, getCallStatistics } from './videocallThunks';
import { initialVideoCalllState, CallParticipant } from '../../store/adapters/videoCallAdapter+State';

// Slice
const videoCallSlice = createSlice({
  name: 'videoCall',
  initialState: initialVideoCalllState,
  reducers: {
    initializeCall: (state, action: PayloadAction<VideoCallConfig>) => {
      state.sessionId = action.payload?.sessionId || null;
      state.roomId = action.payload?.roomId;
      state.peerId = action.payload?.participantUserId || null;
      state.isConnected = false;
      state.errorMessage = undefined;
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
        state.messages = state.messages || [];
        state.messages.push(action.payload);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string | undefined>) => {
      state.errorMessage = action.payload;
    },
    clearError: (state) => {
      state.errorMessage = undefined;
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
    setCallStartTime: (state, action: PayloadAction<string | null>) => {
      state.callStartTime = action.payload;
    },
    addParticipant: (state, action: PayloadAction<any>) => {
      if (action.payload) {
        const callParticipant: CallParticipant = {
          id: action.payload.id,
          name: action.payload.name || 'Unknown',
          avatar: undefined,
          isMuted: !action.payload.audioEnabled,
          isVideoEnabled: action.payload.videoEnabled || false,
          isScreenSharing: false,
          joinedAt: new Date().toISOString(),
          connectionQuality: 'good'
        };
        state.participants = state.participants || [];
        state.participants.push(callParticipant);
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = (state.participants || []).filter(p => p?.id !== action.payload);
    },
    updateParticipant: (state, action: PayloadAction<any>) => {
      const index = (state.participants || []).findIndex(p => p?.id === action.payload?.id);
      if (index !== -1 && state.participants && state.participants[index]) {
        state.participants[index] = { ...state.participants[index], ...action.payload };
      }
    },
    setConnectionQuality: (state, action: PayloadAction<any>) => {
      state.connectionQuality = action.payload;
    },
    updateCallStatistics: (state, action: PayloadAction<any>) => {
      state.callStatistics = { ...state.callStatistics, ...action.payload };
    },
    updateSettings: (state, action: PayloadAction<any>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    resetCall: () => initialVideoCalllState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCallConfig.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(getCallConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload?.data)) {
          state.roomId = withDefault(action.payload.data?.roomId, "");
          state.peerId = withDefault(action.payload.data?.participantUserId, "");
        }
        state.errorMessage = undefined;
      })
      .addCase(getCallConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      .addCase(endVideoCall.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(endVideoCall.fulfilled, (state) => {
        state.isLoading = false;
        state.isConnected = false;
        state.localStream = null;
        state.remoteStream = null;
        state.errorMessage = undefined;
      })
      .addCase(endVideoCall.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      .addCase(saveCallInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveCallInfo.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
      })
      .addCase(saveCallInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      .addCase(joinVideoCall.pending, (state) => {
        state.isInitializing = true;
        state.errorMessage = undefined;
      })
      .addCase(joinVideoCall.fulfilled, (state) => {
        state.isInitializing = false;
        state.isConnected = true;
        state.callStartTime = new Date().toISOString();
        state.errorMessage = undefined;
      })
      .addCase(joinVideoCall.rejected, (state, action) => {
        state.isInitializing = false;
        state.errorMessage = action.payload?.message;
      })

      .addCase(leaveVideoCall.fulfilled, (state) => {
        state.isConnected = false;
        state.localStream = null;
        state.remoteStream = null;
        state.participants = [];
        state.callStartTime = null;
        state.callDuration = 0;
      })

      .addCase(startRecording.fulfilled, (state) => {
        state.isRecording = true;
      })

      .addCase(stopRecording.fulfilled, (state) => {
        state.isRecording = false;
      })

      .addCase(getCallStatistics.fulfilled, (state, action) => {
        if (isDefined(action.payload?.data)) {
          state.callStatistics = action.payload.data;
        }
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
  clearError,
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
