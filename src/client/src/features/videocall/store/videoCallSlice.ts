import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { isDefined, withDefault } from '../../../shared/utils/safeAccess';
import {
  initialVideoCalllState,
  initialE2EEState,
  initialChatE2EEState,
  initialCallStatistics,
  type ConnectionQuality,
  type LayoutMode,
  type AddParticipantPayload,
  type CallParticipant,
  type UpdateParticipantPayload,
  type UpdateCallStatisticsPayload,
  type UpdateSettingsPayload,
  type EncryptionStats,
} from './videoCallAdapter+State';
import {
  getCallConfig,
  joinVideoCall,
  leaveVideoCall,
  endVideoCall,
  saveCallInfo,
  startRecording,
  stopRecording,
  getCallStatistics,
} from './videocallThunks';
import type { ChatMessage } from '../../chat/types/ChatMessage';
import type { ChatE2EEStatus, E2EEStatus } from '../hooks/types';
import type { VideoCallConfig } from '../types/VideoCallConfig';

const videoCallSlice = createSlice({
  name: 'videoCall',
  initialState: initialVideoCalllState,
  reducers: {
    // ========================================================================
    // Session Management
    // ========================================================================

    /**
     * Initialisiert einen neuen Call - räumt vorherigen State auf
     */
    initializeCall: (state, action: PayloadAction<VideoCallConfig>) => {
      state.localStreamId = null;
      state.remoteStreamId = null;
      state.participants = [];
      state.messages = [];
      state.unreadMessageCount = 0;
      state.e2ee = initialE2EEState;
      state.chatE2EE = initialChatE2EEState;
      state.callStatistics = initialCallStatistics;
      state.callDuration = 0;
      state.callStartTime = null;
      state.errorMessage = undefined;
      state.layoutMode = 'grid';
      state.activeSpeakerId = null;

      // Setze neue Session-Daten
      state.sessionId = action.payload.sessionId;
      state.roomId = action.payload.roomId;
      state.peerId = action.payload.participantUserId ?? null;
      state.isConnected = false;
      state.isInitializing = true;
    },

    /**
     * Setzt den kompletten State zurück
     */
    resetCall: () => initialVideoCalllState,

    // ========================================================================
    // Connection State
    // ========================================================================

    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload && !state.callStartTime) {
        state.callStartTime = new Date().toISOString();
      }
    },

    setPeerId: (state, action: PayloadAction<string | null>) => {
      state.peerId = action.payload;
    },

    setConnectionQuality: (state, action: PayloadAction<ConnectionQuality>) => {
      state.connectionQuality = action.payload;
    },

    // ========================================================================
    // Stream Management (nur IDs - Streams in StreamContext)
    // ========================================================================

    setLocalStreamId: (state, action: PayloadAction<string | null>) => {
      state.localStreamId = action.payload;
    },

    setRemoteStreamId: (state, action: PayloadAction<string | null>) => {
      state.remoteStreamId = action.payload;
    },

    // ========================================================================
    // Media Controls
    // ========================================================================

    toggleMic: (state) => {
      state.isMicEnabled = !state.isMicEnabled;
    },

    setMicEnabled: (state, action: PayloadAction<boolean>) => {
      state.isMicEnabled = action.payload;
    },

    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled;
    },

    setVideoEnabled: (state, action: PayloadAction<boolean>) => {
      state.isVideoEnabled = action.payload;
    },

    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },

    setScreenSharing: (state, action: PayloadAction<boolean>) => {
      state.isScreenSharing = action.payload;
    },

    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },

    // ========================================================================
    // Layout
    // ========================================================================

    setLayoutMode: (state, action: PayloadAction<LayoutMode>) => {
      state.layoutMode = action.payload;
    },

    setActiveSpeaker: (state, action: PayloadAction<string | null>) => {
      state.activeSpeakerId = action.payload;
    },

    // ========================================================================
    // Chat
    // ========================================================================

    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
      // Reset unread count when opening chat
      if (state.isChatOpen) {
        state.unreadMessageCount = 0;
      }
    },

    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isChatOpen = action.payload;
      if (action.payload) {
        state.unreadMessageCount = 0;
      }
    },

    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      // Increment unread if chat is closed
      if (!state.isChatOpen) {
        state.unreadMessageCount += 1;
      }
    },

    clearMessages: (state) => {
      state.messages = [];
      state.unreadMessageCount = 0;
    },

    // ========================================================================
    // Participants (typsicher)
    // ========================================================================

    addParticipant: (state, action: PayloadAction<AddParticipantPayload>) => {
      const { payload } = action;
      if (payload.id === '') return;

      // Prüfe ob Participant bereits existiert
      const exists = state.participants.some((p) => p.id === payload.id);
      if (exists) return;

      const participant: CallParticipant = {
        id: payload.id,
        name: payload.name,
        avatar: payload.avatar,
        isMuted: !(payload.audioEnabled ?? true),
        isVideoEnabled: payload.videoEnabled ?? true,
        isScreenSharing: false,
        joinedAt: new Date().toISOString(),
        connectionQuality: 'good',
        isLocal: false,
        audioLevel: 0,
        lastActiveAt: new Date().toISOString(),
      };

      state.participants.push(participant);
    },

    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter((p) => p.id !== action.payload);
    },

    updateParticipant: (state, action: PayloadAction<UpdateParticipantPayload>) => {
      const { payload } = action;
      if (payload.id === '') return;

      const index = state.participants.findIndex((p) => p.id === payload.id);
      if (index === -1) return;

      const participant = state.participants[index];
      state.participants[index] = {
        ...participant,
        ...(payload.isMuted !== undefined && { isMuted: payload.isMuted }),
        ...(payload.isVideoEnabled !== undefined && { isVideoEnabled: payload.isVideoEnabled }),
        ...(payload.isScreenSharing !== undefined && { isScreenSharing: payload.isScreenSharing }),
        ...(payload.connectionQuality !== undefined && {
          connectionQuality: payload.connectionQuality,
        }),
        ...(payload.audioLevel !== undefined && { audioLevel: payload.audioLevel }),
        lastActiveAt: new Date().toISOString(),
      };
    },

    clearParticipants: (state) => {
      state.participants = [];
    },

    // ========================================================================
    // Call Timing
    // ========================================================================

    setCallDuration: (state, action: PayloadAction<number>) => {
      state.callDuration = action.payload;
    },

    setCallStartTime: (state, action: PayloadAction<string | null>) => {
      state.callStartTime = action.payload;
    },

    incrementCallDuration: (state) => {
      state.callDuration += 1;
    },

    // ========================================================================
    // Statistics & Settings (typsicher)
    // ========================================================================

    updateCallStatistics: (state, action: PayloadAction<UpdateCallStatisticsPayload>) => {
      state.callStatistics = {
        ...state.callStatistics,
        ...action.payload,
      };
    },

    updateSettings: (state, action: PayloadAction<UpdateSettingsPayload>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    // ========================================================================
    // Error Handling
    // ========================================================================

    setError: (state, action: PayloadAction<string | undefined>) => {
      state.errorMessage = action.payload;
    },

    clearError: (state) => {
      state.errorMessage = undefined;
    },

    // ========================================================================
    // Loading States
    // ========================================================================

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },

    // ========================================================================
    // E2EE Video Actions
    // ========================================================================

    setE2EEStatus: (state, action: PayloadAction<E2EEStatus>) => {
      state.e2ee.status = action.payload;
      // Clear error when status changes to non-error
      if (action.payload !== 'error') {
        state.e2ee.errorMessage = null;
      }
    },

    setE2EELocalFingerprint: (state, action: PayloadAction<string | null>) => {
      state.e2ee.localKeyFingerprint = action.payload;
    },

    setE2EERemoteFingerprint: (state, action: PayloadAction<string | null>) => {
      state.e2ee.remotePeerFingerprint = action.payload;
    },

    setE2EEKeyGeneration: (state, action: PayloadAction<number>) => {
      state.e2ee.keyGeneration = action.payload;
    },

    incrementE2EEKeyGeneration: (state) => {
      state.e2ee.keyGeneration += 1;
    },

    setE2EEErrorMessage: (state, action: PayloadAction<string | null>) => {
      state.e2ee.errorMessage = action.payload;
      if (action.payload) {
        state.e2ee.status = 'error';
      }
    },

    setE2EEEncryptionStats: (state, action: PayloadAction<EncryptionStats | null>) => {
      state.e2ee.encryptionStats = action.payload;
    },

    updateE2EEEncryptionStats: (state, action: PayloadAction<Partial<EncryptionStats>>) => {
      if (state.e2ee.encryptionStats) {
        state.e2ee.encryptionStats = {
          ...state.e2ee.encryptionStats,
          ...action.payload,
        };
      }
    },

    resetE2EE: (state) => {
      state.e2ee = initialE2EEState;
    },

    // ========================================================================
    // E2EE Chat Actions
    // ========================================================================

    setChatE2EEStatus: (state, action: PayloadAction<ChatE2EEStatus>) => {
      state.chatE2EE.status = action.payload;
    },

    setChatE2EELocalFingerprint: (state, action: PayloadAction<string | null>) => {
      state.chatE2EE.localFingerprint = action.payload;
    },

    setChatE2EEPeerFingerprint: (state, action: PayloadAction<string | null>) => {
      state.chatE2EE.peerFingerprint = action.payload;
    },

    incrementChatMessagesEncrypted: (state) => {
      state.chatE2EE.stats.messagesEncrypted += 1;
    },

    incrementChatMessagesDecrypted: (state) => {
      state.chatE2EE.stats.messagesDecrypted += 1;
    },

    incrementChatVerificationFailures: (state) => {
      state.chatE2EE.stats.verificationFailures += 1;
    },

    resetChatE2EE: (state) => {
      state.chatE2EE = initialChatE2EEState;
    },
  },

  // ==========================================================================
  // Extra Reducers (Async Thunks)
  // ==========================================================================

  extraReducers: (builder) => {
    builder
      // ======================================================================
      // getCallConfig
      // ======================================================================
      .addCase(getCallConfig.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(getCallConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        if (isDefined(action.payload.data)) {
          state.roomId = withDefault(action.payload.data.roomId, '');
          state.peerId = withDefault(action.payload.data.participantUserId, '');
          state.sessionId = withDefault(action.payload.data.sessionId, '');
        }
      })
      .addCase(getCallConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to get call config';
      })

      // ======================================================================
      // joinVideoCall
      // ======================================================================
      .addCase(joinVideoCall.pending, (state) => {
        state.isInitializing = true;
        state.errorMessage = undefined;
      })
      .addCase(joinVideoCall.fulfilled, (state) => {
        state.isInitializing = false;
        state.isConnected = true;
        state.callStartTime ??= new Date().toISOString();
      })
      .addCase(joinVideoCall.rejected, (state, action) => {
        state.isInitializing = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to join call';
      })

      // ======================================================================
      // leaveVideoCall
      // ======================================================================
      .addCase(leaveVideoCall.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(leaveVideoCall.fulfilled, () => initialVideoCalllState)
      .addCase(leaveVideoCall.rejected, (_, action) => {
        const errorMessage = action.error.message ?? 'Unknown error';
        console.error('Leave call API failed:', errorMessage);
        // State trotzdem zurücksetzen - User will ja raus
        return {
          ...initialVideoCalllState,
          // Optional: Error beibehalten für Debugging
          errorMessage: `Leave failed: ${errorMessage}`,
        };
      })

      // ======================================================================
      // endVideoCall
      // ======================================================================
      .addCase(endVideoCall.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(endVideoCall.fulfilled, () => initialVideoCalllState)
      .addCase(endVideoCall.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to end call';
        // Trotzdem disconnected setzen
        state.isConnected = false;
      })

      // ======================================================================
      // saveCallInfo
      // ======================================================================
      .addCase(saveCallInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveCallInfo.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveCallInfo.rejected, (state, action) => {
        state.isLoading = false;
        // Nicht kritisch - nur loggen
        console.warn('Save call info failed:', action.payload?.message ?? action.error.message);
      })

      // ======================================================================
      // Recording
      // ======================================================================
      .addCase(startRecording.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(startRecording.fulfilled, (state) => {
        state.isLoading = false;
        state.isRecording = true;
      })
      .addCase(startRecording.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage =
          action.payload?.message ?? action.error.message ?? 'Failed to start recording';
      })

      .addCase(stopRecording.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(stopRecording.fulfilled, (state) => {
        state.isLoading = false;
        state.isRecording = false;
      })
      .addCase(stopRecording.rejected, (state, action) => {
        state.isLoading = false;
        // Bei Stop-Fehler trotzdem Recording-Flag zurücksetzen
        state.isRecording = false;
        console.warn('Stop recording failed:', action.payload?.message ?? action.error.message);
      })

      // ======================================================================
      // getCallStatistics
      // ======================================================================
      .addCase(getCallStatistics.fulfilled, (state, action) => {
        if (isDefined(action.payload.data)) {
          state.callStatistics = {
            ...state.callStatistics,
            ...action.payload.data,
          };
        }
      });
  },
});

// ============================================================================
// Exports
// ============================================================================

export const {
  // Session
  initializeCall,
  resetCall,

  // Connection
  setConnected,
  setPeerId,
  setConnectionQuality,

  // Streams
  setLocalStreamId,
  setRemoteStreamId,

  // Media
  toggleMic,
  setMicEnabled,
  toggleVideo,
  setVideoEnabled,
  toggleScreenShare,
  setScreenSharing,
  setRecording,

  // Layout
  setLayoutMode,
  setActiveSpeaker,

  // Chat
  toggleChat,
  setChatOpen,
  addMessage,
  clearMessages,

  // Participants
  addParticipant,
  removeParticipant,
  updateParticipant,
  clearParticipants,

  // Timing
  setCallDuration,
  setCallStartTime,
  incrementCallDuration,

  // Stats & Settings
  updateCallStatistics,
  updateSettings,

  // Error
  setError,
  clearError,

  // Loading
  setLoading,
  setInitializing,

  // E2EE Video
  setE2EEStatus,
  setE2EELocalFingerprint,
  setE2EERemoteFingerprint,
  setE2EEKeyGeneration,
  incrementE2EEKeyGeneration,
  setE2EEErrorMessage,
  setE2EEEncryptionStats,
  updateE2EEEncryptionStats,
  resetE2EE,

  // E2EE Chat
  setChatE2EEStatus,
  setChatE2EELocalFingerprint,
  setChatE2EEPeerFingerprint,
  incrementChatMessagesEncrypted,
  incrementChatMessagesDecrypted,
  incrementChatVerificationFailures,
  resetChatE2EE,
} = videoCallSlice.actions;

export default videoCallSlice.reducer;
