// src/store/selectors/videoCallSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectVideocallState = (state: RootState) => state.videoCall;
export const selectVideocallLoading = (state: RootState) => state.videoCall.isLoading;
export const selectVideocallError = (state: RootState) => state.videoCall.errorMessage;
export const selectVideocallInitializing = (state: RootState) => state.videoCall.isInitializing;

export const selectAllVideoCallConfigs = createSelector(
  [selectVideocallState],
  (videocallState) => Object.values((videocallState as any).entities || {}).filter(Boolean)
);

export const selectVideoCallConfigByRoomId = createSelector(
  [selectVideocallState, (_: RootState, roomId: string) => roomId],
  (videocallState, roomId) => (videocallState as any).entities?.[roomId] || null
);

export const selectSessionId = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.sessionId
);

export const selectRoomId = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.roomId
);

export const selectIsConnected = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.isConnected
);

export const selectPeerId = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.peerId
);

export const selectConnectionQuality = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.connectionQuality
);

export const selectLocalStream = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.localStream
);

export const selectRemoteStream = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.remoteStream
);

export const selectHasLocalStream = createSelector(
  [selectLocalStream],
  (localStream) => localStream !== null
);

export const selectHasRemoteStream = createSelector(
  [selectRemoteStream],
  (remoteStream) => remoteStream !== null
);

export const selectParticipants = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.participants || []
);

export const selectActiveParticipants = createSelector(
  [selectParticipants],
  (participants) => participants.filter(p => p.connectionQuality !== 'poor')
);

export const selectParticipantCount = createSelector(
  [selectParticipants],
  (participants) => participants.length
);

export const selectParticipantById = createSelector(
  [selectParticipants, (_: RootState, participantId: string) => participantId],
  (participants, participantId) =>
    participants.find(p => p.id === participantId) || null
);

export const selectIsMicEnabled = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.isMicEnabled
);

export const selectIsVideoEnabled = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.isVideoEnabled
);

export const selectIsScreenSharing = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.isScreenSharing
);

export const selectIsRecording = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.isRecording
);

export const selectMediaControlsState = createSelector(
  [selectIsMicEnabled, selectIsVideoEnabled, selectIsScreenSharing, selectIsRecording],
  (micEnabled, videoEnabled, screenSharing, recording) => ({
    micEnabled,
    videoEnabled,
    screenSharing,
    recording
  })
);

export const selectCallDuration = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.callDuration || 0
);

export const selectCallStartTime = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.callStartTime || null
);

export const selectFormattedCallDuration = createSelector(
  [selectCallDuration],
  (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
);

export const selectIsChatOpen = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.isChatOpen
);

export const selectChatMessages = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.messages || []
);

export const selectUnreadMessagesCount = createSelector(
  [selectChatMessages, selectIsChatOpen],
  (messages, isChatOpen) => {
    if (isChatOpen) return 0;
    return messages.length;
  }
);

export const selectLatestMessage = createSelector(
  [selectChatMessages],
  (messages) => messages.length > 0 ? messages[messages.length - 1] : null
);

export const selectCallStatistics = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.callStatistics || {}
);

export const selectNetworkQuality = createSelector(
  [selectCallStatistics],
  (statistics) => (statistics as any).networkQuality || 'good'
);

export const selectAudioLevel = createSelector(
  [selectCallStatistics],
  (statistics) => (statistics as any).audioLevel || 0
);

export const selectPacketsLost = createSelector(
  [selectCallStatistics],
  (statistics) => (statistics as any).packetsLost || 0
);

export const selectBandwidth = createSelector(
  [selectCallStatistics],
  (statistics) => (statistics as any).bandwidth || 0
);

export const selectCallSettings = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.settings || {}
);

export const selectVideoQuality = createSelector(
  [selectCallSettings],
  (settings) => (settings as any).videoQuality
);

export const selectAudioQuality = createSelector(
  [selectCallSettings],
  (settings) => (settings as any).audioQuality
);

export const selectBackgroundBlur = createSelector(
  [selectCallSettings],
  (settings) => (settings as any).backgroundBlur
);

export const selectVirtualBackground = createSelector(
  [selectCallSettings],
  (settings) => (settings as any).virtualBackground
);

export const selectIsCallActive = createSelector(
  [selectIsConnected, selectRoomId],
  (isConnected, roomId) => !!isConnected && roomId !== null && roomId !== undefined
);

export const selectIsCallInProgress = createSelector(
  [selectIsCallActive, selectCallStartTime],
  (isActive, startTime) => isActive && startTime !== null
);

export const selectCanJoinCall = createSelector(
  [selectRoomId, selectIsConnected, selectVideocallInitializing],
  (roomId, isConnected, isInitializing) =>
    roomId !== null && roomId !== undefined && !isConnected && !isInitializing
);

export const selectParticipantStats = createSelector(
  [selectParticipants],
  (participants) => ({
    total: participants.length,
    withVideo: participants.filter((p: any) => p.isVideoEnabled).length,
    withAudio: participants.filter((p: any) => !p.isMuted).length,
    screenSharing: participants.filter((p: any) => p.isScreenSharing).length,
    poorConnection: participants.filter((p: any) => p.connectionQuality === 'poor').length
  })
);

export const selectOverallCallQuality = createSelector(
  [selectConnectionQuality, selectNetworkQuality, selectPacketsLost],
  (connectionQuality, networkQuality, packetsLost) => {
    const qualityScores: Record<string, number> = {
      'excellent': 4,
      'good': 3,
      'fair': 2,
      'poor': 1
    };

    const connectionScore = qualityScores[connectionQuality] ?? 3;
    const networkScore = qualityScores[networkQuality] ?? 3;
    const packetLossScore = packetsLost > 5 ? 1 : packetsLost > 2 ? 2 : packetsLost > 0 ? 3 : 4;

    const averageScore = (connectionScore + networkScore + packetLossScore) / 3;

    if (averageScore >= 3.5) return 'excellent';
    if (averageScore >= 2.5) return 'good';
    if (averageScore >= 1.5) return 'fair';
    return 'poor';
  }
);

export const selectScreenSharingParticipant = createSelector(
  [selectParticipants],
  (participants) => participants.find((p: any) => p.isScreenSharing) || null
);

export const selectIsAnyoneScreenSharing = createSelector(
  [selectParticipants, selectIsScreenSharing],
  (participants, isLocalScreenSharing) =>
    isLocalScreenSharing || participants.some((p: any) => p.isScreenSharing)
);

export const selectMediaDeviceStatus = createSelector(
  [selectHasLocalStream, selectIsMicEnabled, selectIsVideoEnabled],
  (hasStream, micEnabled, videoEnabled) => ({
    hasStream,
    micEnabled,
    videoEnabled,
    hasAudio: !!hasStream && !!micEnabled,
    hasVideo: !!hasStream && !!videoEnabled
  })
);
