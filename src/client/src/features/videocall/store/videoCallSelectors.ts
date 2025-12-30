import { createSelector } from '@reduxjs/toolkit';
import type {
  VideoCallEntityState,
  ConnectionQuality,
  CallParticipant,
  CallStatistics,
  CallSettings,
  E2EEState,
  ChatE2EEState,
} from './videoCallAdapter+State';
import type { RootState } from '../../../core/store/store';

// ============================================================================
// Base Selectors
// ============================================================================

export const selectVideocallState = (state: RootState): VideoCallEntityState => state.videoCall;

export const selectVideocallLoading = (state: RootState): boolean => state.videoCall.isLoading;

export const selectVideocallError = (state: RootState): string | undefined =>
  state.videoCall.errorMessage;

export const selectVideocallInitializing = (state: RootState): boolean =>
  state.videoCall.isInitializing;

// ============================================================================
// Session Selectors
// ============================================================================

export const selectSessionId = createSelector(
  [selectVideocallState],
  (state): string | null => state.sessionId
);

export const selectRoomId = createSelector(
  [selectVideocallState],
  (state): string | null => state.roomId
);

export const selectPeerId = createSelector(
  [selectVideocallState],
  (state): string | null => state.peerId
);

export const selectThreadId = createSelector(
  [selectVideocallState],
  (state): string | null => state.threadId
);

// ============================================================================
// Connection Selectors
// ============================================================================

export const selectIsConnected = createSelector(
  [selectVideocallState],
  (state): boolean => state.isConnected
);

export const selectConnectionQuality = createSelector(
  [selectVideocallState],
  (state): ConnectionQuality => state.connectionQuality
);

// ============================================================================
// Stream Selectors (nur IDs - Streams aus StreamContext)
// ============================================================================

export const selectLocalStreamId = createSelector(
  [selectVideocallState],
  (state): string | null => state.localStreamId
);

export const selectRemoteStreamId = createSelector(
  [selectVideocallState],
  (state): string | null => state.remoteStreamId
);

export const selectHasLocalStream = createSelector(
  [selectLocalStreamId],
  (streamId): boolean => streamId !== null
);

export const selectHasRemoteStream = createSelector(
  [selectRemoteStreamId],
  (streamId): boolean => streamId !== null
);

// ============================================================================
// Participant Selectors
// ============================================================================

export const selectParticipants = createSelector(
  [selectVideocallState],
  (state): CallParticipant[] => state.participants
);

export const selectParticipantCount = createSelector(
  [selectParticipants],
  (participants): number => participants.length
);

export const selectActiveParticipants = createSelector(
  [selectParticipants],
  (participants): CallParticipant[] => participants.filter((p) => p.connectionQuality !== 'poor')
);

export const selectParticipantById = createSelector(
  [selectParticipants, (_: RootState, participantId: string) => participantId],
  (participants, participantId): CallParticipant | null =>
    participants.find((p) => p.id === participantId) ?? null
);

export const selectRemoteParticipants = createSelector(
  [selectParticipants],
  (participants): CallParticipant[] => participants.filter((p) => !p.isLocal)
);

export const selectScreenSharingParticipant = createSelector(
  [selectParticipants],
  (participants): CallParticipant | null => participants.find((p) => p.isScreenSharing) ?? null
);

export const selectParticipantStats = createSelector([selectParticipants], (participants) => ({
  total: participants.length,
  withVideo: participants.filter((p) => p.isVideoEnabled).length,
  withAudio: participants.filter((p) => !p.isMuted).length,
  screenSharing: participants.filter((p) => p.isScreenSharing).length,
  poorConnection: participants.filter((p) => p.connectionQuality === 'poor').length,
}));

// ============================================================================
// Media Control Selectors
// ============================================================================

export const selectIsMicEnabled = createSelector(
  [selectVideocallState],
  (state): boolean => state.isMicEnabled
);

export const selectIsVideoEnabled = createSelector(
  [selectVideocallState],
  (state): boolean => state.isVideoEnabled
);

export const selectIsScreenSharing = createSelector(
  [selectVideocallState],
  (state): boolean => state.isScreenSharing
);

export const selectIsRecording = createSelector(
  [selectVideocallState],
  (state): boolean => state.isRecording
);

const EMPTY_MEDIA_CONTROLS = {
  micEnabled: true,
  videoEnabled: true,
  screenSharing: false,
  recording: false,
} as const;

export const selectMediaControlsState = createSelector(
  [selectIsMicEnabled, selectIsVideoEnabled, selectIsScreenSharing, selectIsRecording],
  (micEnabled, videoEnabled, screenSharing, recording) => {
    // Nur neues Objekt erstellen wenn sich Werte ändern
    if (
      micEnabled === EMPTY_MEDIA_CONTROLS.micEnabled &&
      videoEnabled === EMPTY_MEDIA_CONTROLS.videoEnabled &&
      screenSharing === EMPTY_MEDIA_CONTROLS.screenSharing &&
      recording === EMPTY_MEDIA_CONTROLS.recording
    ) {
      return EMPTY_MEDIA_CONTROLS;
    }
    return { micEnabled, videoEnabled, screenSharing, recording };
  }
);

export const selectIsAnyoneScreenSharing = createSelector(
  [selectParticipants, selectIsScreenSharing],
  (participants, isLocalScreenSharing): boolean =>
    isLocalScreenSharing || participants.some((p) => p.isScreenSharing)
);

export const selectMediaDeviceStatus = createSelector(
  [selectHasLocalStream, selectIsMicEnabled, selectIsVideoEnabled],
  (hasStream, micEnabled, videoEnabled) => ({
    hasStream,
    micEnabled,
    videoEnabled,
    hasAudio: hasStream && micEnabled,
    hasVideo: hasStream && videoEnabled,
  })
);

// ============================================================================
// Chat Selectors
// NOTE: Chat messages are now handled by useInlineChat via ChatHub.
// Only the panel open/close state is managed here.
// ============================================================================

export const selectIsChatOpen = createSelector(
  [selectVideocallState],
  (state): boolean => state.isChatOpen
);

// ============================================================================
// Call Timing Selectors
// ============================================================================

export const selectCallDuration = createSelector(
  [selectVideocallState],
  (state): number => state.callDuration
);

export const selectCallStartTime = createSelector(
  [selectVideocallState],
  (state): string | null => state.callStartTime
);

export const selectFormattedCallDuration = createSelector(
  [selectCallDuration],
  (duration): string => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    const pad = (n: number): string => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }
);

// ============================================================================
// Statistics Selectors
// ============================================================================

export const selectCallStatistics = createSelector(
  [selectVideocallState],
  (state): CallStatistics => state.callStatistics
);

export const selectNetworkQuality = createSelector(
  [selectCallStatistics],
  (statistics): ConnectionQuality => statistics.networkQuality
);

export const selectAudioLevel = createSelector(
  [selectCallStatistics],
  (statistics): number => statistics.audioLevel
);

export const selectPacketsLost = createSelector(
  [selectCallStatistics],
  (statistics): number => statistics.packetsLost
);

export const selectBandwidth = createSelector(
  [selectCallStatistics],
  (statistics): number => statistics.bandwidth
);

export const selectJitter = createSelector(
  [selectCallStatistics],
  (statistics): number => statistics.jitter
);

export const selectRoundTripTime = createSelector(
  [selectCallStatistics],
  (statistics): number => statistics.roundTripTime
);

// ============================================================================
// Settings Selectors
// ============================================================================

export const selectCallSettings = createSelector(
  [selectVideocallState],
  (state): CallSettings => state.settings
);

export const selectVideoQuality = createSelector(
  [selectCallSettings],
  (settings) => settings.videoQuality
);

export const selectAudioQuality = createSelector(
  [selectCallSettings],
  (settings) => settings.audioQuality
);

export const selectBackgroundBlur = createSelector(
  [selectCallSettings],
  (settings): boolean => settings.backgroundBlur
);

export const selectVirtualBackground = createSelector(
  [selectCallSettings],
  (settings): string | null => settings.virtualBackground
);

export const selectNoiseSuppression = createSelector(
  [selectCallSettings],
  (settings): boolean => settings.noiseSuppression
);

// ============================================================================
// Call State Selectors
// ============================================================================

export const selectIsCallActive = createSelector(
  [selectIsConnected, selectRoomId],
  (isConnected, roomId): boolean => isConnected && roomId !== null
);

export const selectIsCallInProgress = createSelector(
  [selectIsCallActive, selectCallStartTime],
  (isActive, startTime): boolean => isActive && startTime !== null
);

export const selectCanJoinCall = createSelector(
  [selectRoomId, selectIsConnected, selectVideocallInitializing],
  (roomId, isConnected, isInitializing): boolean =>
    roomId !== null && !isConnected && !isInitializing
);

// ============================================================================
// Quality Selectors
// ============================================================================

const QUALITY_SCORES: Record<ConnectionQuality, number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
};

export const selectOverallCallQuality = createSelector(
  [selectConnectionQuality, selectNetworkQuality, selectPacketsLost, selectJitter],
  (connectionQuality, networkQuality, packetsLost, jitter): ConnectionQuality => {
    const connectionScore = QUALITY_SCORES[connectionQuality];
    const networkScore = QUALITY_SCORES[networkQuality];

    // Packet Loss Score
    let packetLossScore: number;
    if (packetsLost > 5) packetLossScore = 1;
    else if (packetsLost > 2) packetLossScore = 2;
    else if (packetsLost > 0) packetLossScore = 3;
    else packetLossScore = 4;

    // Jitter Score
    let jitterScore: number;
    if (jitter > 100) jitterScore = 1;
    else if (jitter > 50) jitterScore = 2;
    else if (jitter > 20) jitterScore = 3;
    else jitterScore = 4;

    const averageScore = (connectionScore + networkScore + packetLossScore + jitterScore) / 4;

    if (averageScore >= 3.5) return 'excellent';
    if (averageScore >= 2.5) return 'good';
    if (averageScore >= 1.5) return 'fair';
    return 'poor';
  }
);

// ============================================================================
// E2EE Video Selectors
// ============================================================================

export const selectE2EEState = createSelector(
  [selectVideocallState],
  (state): E2EEState => state.e2ee
);

export const selectE2EEStatus = createSelector([selectE2EEState], (e2ee) => e2ee.status);

export const selectE2EELocalFingerprint = createSelector(
  [selectE2EEState],
  (e2ee): string | null => e2ee.localKeyFingerprint
);

export const selectE2EERemoteFingerprint = createSelector(
  [selectE2EEState],
  (e2ee): string | null => e2ee.remotePeerFingerprint
);

export const selectE2EEKeyGeneration = createSelector(
  [selectE2EEState],
  (e2ee): number => e2ee.keyGeneration
);

export const selectE2EEEncryptionStats = createSelector(
  [selectE2EEState],
  (e2ee) => e2ee.encryptionStats
);

export const selectE2EEErrorMessage = createSelector(
  [selectE2EEState],
  (e2ee): string | null => e2ee.errorMessage
);

export const selectIsE2EEActive = createSelector(
  [selectE2EEStatus],
  (status): boolean => status === 'active'
);

export const selectIsE2EESupported = createSelector(
  [selectE2EEStatus],
  (status): boolean => status !== 'unsupported' && status !== 'inactive'
);

// ============================================================================
// E2EE Chat Selectors
// ============================================================================

export const selectChatE2EEState = createSelector(
  [selectVideocallState],
  (state): ChatE2EEState => state.chatE2EE
);

export const selectChatE2EEStatus = createSelector(
  [selectChatE2EEState],
  (chatE2EE) => chatE2EE.status
);

export const selectChatE2EELocalFingerprint = createSelector(
  [selectChatE2EEState],
  (chatE2EE): string | null => chatE2EE.localFingerprint
);

export const selectChatE2EEPeerFingerprint = createSelector(
  [selectChatE2EEState],
  (chatE2EE): string | null => chatE2EE.peerFingerprint
);

export const selectChatE2EEStats = createSelector(
  [selectChatE2EEState],
  (chatE2EE) => chatE2EE.stats
);

export const selectIsChatE2EEActive = createSelector(
  [selectChatE2EEStatus],
  (status): boolean => status === 'active'
);

// ============================================================================
// Combined E2EE Selectors
// ============================================================================

export const selectE2EESummary = createSelector(
  [selectIsE2EEActive, selectIsChatE2EEActive, selectE2EEErrorMessage],
  (videoE2EE, chatE2EE, error) => ({
    videoEncrypted: videoE2EE,
    chatEncrypted: chatE2EE,
    fullyEncrypted: videoE2EE && chatE2EE,
    hasError: error !== null,
    errorMessage: error,
  })
);

// ============================================================================
// Debug Selectors
// ============================================================================

export const selectDebugInfo = createSelector(
  [
    selectSessionId,
    selectRoomId,
    selectIsConnected,
    selectParticipantCount,
    selectIsE2EEActive,
    selectIsChatE2EEActive,
    selectConnectionQuality,
    selectVideocallError,
  ],
  (
    sessionId,
    roomId,
    isConnected,
    participantCount,
    e2eeActive,
    chatE2eeActive,
    quality,
    error
  ) => ({
    sessionId,
    roomId,
    isConnected,
    participantCount,
    e2eeActive,
    chatE2eeActive,
    quality,
    error,
    timestamp: new Date().toISOString(),
  })
);
