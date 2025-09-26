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
      state.roomId = action.payload?.roomId;
      state.peerId = action.payload?.peerId;
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
    setCallStartTime: (state, action: PayloadAction<Date | null>) => {
      state.callStartTime = action.payload;
    },
    addParticipant: (state, action) => {
      if (action.payload) {
        const callParticipant: CallParticipant = {
          id: action.payload.id,
          name: action.payload.name || 'Unknown',
          avatar: undefined,
          isMuted: !action.payload.audioEnabled,
          isVideoEnabled: action.payload.videoEnabled || false,
          isScreenSharing: false,
          joinedAt: new Date(),
          connectionQuality: 'good'
        };
        state.participants.push(callParticipant);
      }
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants?.filter(p => p?.id !== action.payload);
    },
    updateParticipant: (state, action) => {
      const index = state.participants?.findIndex(p => p?.id === action.payload?.id);
      if (index !== -1 && state.participants[index]) {
        state.participants[index] = { ...state.participants[index], ...action.payload };
      }
    },
    setConnectionQuality: (state, action) => {
      state.connectionQuality = action.payload;
    },
    updateCallStatistics: (state, action) => {
      state.callStatistics = { ...state.callStatistics, ...action.payload };
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setRecording: (state, action) => {
      state.isRecording = action.payload;
    },
    resetCall: () => initialVideoCalllState,
  },
  extraReducers: (builder) => {
    builder
      // Get Call Config
      .addCase(getCallConfig.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(getCallConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.roomId = withDefault(action.payload.data?.roomId, "");
          state.peerId = withDefault(action.payload.data?.peerId, "");
        }
        state.errorMessage = undefined;
      })
      .addCase(getCallConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
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
        state.errorMessage = undefined;
      })
      .addCase(endVideoCall.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.payload?.message;
      })

      // Save Call Info
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

      // Join Video Call
      .addCase(joinVideoCall.pending, (state) => {
        state.isInitializing = true;
        state.errorMessage = undefined;
      })
      .addCase(joinVideoCall.fulfilled, (state, _action) => {
        state.isInitializing = false;
        state.isConnected = true;
        state.callStartTime = new Date();
        state.errorMessage = undefined;
      })
      .addCase(joinVideoCall.rejected, (state, action) => {
        state.isInitializing = false;
        state.errorMessage = action.payload?.message;
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
        if (isDefined(action.payload.data)) {
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