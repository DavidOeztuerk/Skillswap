import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Video Call Selectors
 * Centralized selectors for video call state and entity operations
 */

// Base selectors
export const selectVideocallState = (state: RootState) => state.videoCall;
export const selectVideocallLoading = (state: RootState) => state.videoCall.isLoading;
export const selectVideocallError = (state: RootState) => state.videoCall.errorMessage;
export const selectVideocallInitializing = (state: RootState) => state.videoCall.isInitializing;

// Entity selectors using the normalized structure
export const selectAllVideoCallConfigs = createSelector(
  [selectVideocallState],
  (videocallState) => Object.values(videocallState.entities).filter(Boolean)
);

export const selectVideoCallConfigByRoomId = createSelector(
  [selectVideocallState, (_: RootState, roomId: string) => roomId],
  (videocallState, roomId) => videocallState.entities[roomId] || null
);

// Connection selectors
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

// Stream selectors
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

// Participants selectors
export const selectParticipants = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.participants
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

// Media controls selectors
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

// Call duration and timing
export const selectCallDuration = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.callDuration
);

export const selectCallStartTime = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.callStartTime
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

// Chat selectors
export const selectIsChatOpen = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.isChatOpen
);

export const selectChatMessages = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.messages
);

export const selectUnreadMessagesCount = createSelector(
  [selectChatMessages, selectIsChatOpen],
  (messages, isChatOpen) => {
    // Chat messages don't have read status in video calls
    // Return 0 if chat is open, otherwise return total count
    if (isChatOpen) return 0;
    return messages.length;
  }
);

export const selectLatestMessage = createSelector(
  [selectChatMessages],
  (messages) => messages.length > 0 ? messages[messages.length - 1] : null
);

// Call statistics and quality
export const selectCallStatistics = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.callStatistics
);

export const selectNetworkQuality = createSelector(
  [selectCallStatistics],
  (statistics) => statistics.networkQuality
);

export const selectAudioLevel = createSelector(
  [selectCallStatistics],
  (statistics) => statistics.audioLevel
);

export const selectPacketsLost = createSelector(
  [selectCallStatistics],
  (statistics) => statistics.packetsLost
);

export const selectBandwidth = createSelector(
  [selectCallStatistics],
  (statistics) => statistics.bandwidth
);

// Call settings
export const selectCallSettings = createSelector(
  [selectVideocallState],
  (videocallState) => videocallState.settings
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
  (settings) => settings.backgroundBlur
);

export const selectVirtualBackground = createSelector(
  [selectCallSettings],
  (settings) => settings.virtualBackground
);

// Call state checks
export const selectIsCallActive = createSelector(
  [selectIsConnected, selectRoomId],
  (isConnected, roomId) => isConnected && roomId !== null
);

export const selectIsCallInProgress = createSelector(
  [selectIsCallActive, selectCallStartTime],
  (isActive, startTime) => isActive && startTime !== null
);

export const selectCanJoinCall = createSelector(
  [selectRoomId, selectIsConnected, selectVideocallInitializing],
  (roomId, isConnected, isInitializing) => 
    roomId !== null && !isConnected && !isInitializing
);

// Participant status aggregation
export const selectParticipantStats = createSelector(
  [selectParticipants],
  (participants) => ({
    total: participants.length,
    withVideo: participants.filter(p => p.isVideoEnabled).length,
    withAudio: participants.filter(p => !p.isMuted).length,
    screenSharing: participants.filter(p => p.isScreenSharing).length,
    poorConnection: participants.filter(p => p.connectionQuality === 'poor').length
  })
);

// Call quality indicators
export const selectOverallCallQuality = createSelector(
  [selectConnectionQuality, selectNetworkQuality, selectPacketsLost],
  (connectionQuality, networkQuality, packetsLost) => {
    const qualityScores = {
      'excellent': 4,
      'good': 3,
      'fair': 2,
      'poor': 1
    };
    
    const connectionScore = qualityScores[connectionQuality];
    const networkScore = qualityScores[networkQuality];
    const packetLossScore = packetsLost > 5 ? 1 : packetsLost > 2 ? 2 : packetsLost > 0 ? 3 : 4;
    
    const averageScore = (connectionScore + networkScore + packetLossScore) / 3;
    
    if (averageScore >= 3.5) return 'excellent';
    if (averageScore >= 2.5) return 'good';
    if (averageScore >= 1.5) return 'fair';
    return 'poor';
  }
);

// Screen sharing status
export const selectScreenSharingParticipant = createSelector(
  [selectParticipants],
  (participants) => participants.find(p => p.isScreenSharing) || null
);

export const selectIsAnyoneScreenSharing = createSelector(
  [selectParticipants, selectIsScreenSharing],
  (participants, isLocalScreenSharing) => 
    isLocalScreenSharing || participants.some(p => p.isScreenSharing)
);

// Media device status
export const selectMediaDeviceStatus = createSelector(
  [selectHasLocalStream, selectIsMicEnabled, selectIsVideoEnabled],
  (hasStream, micEnabled, videoEnabled) => ({
    hasStream,
    micEnabled,
    videoEnabled,
    hasAudio: hasStream && micEnabled,
    hasVideo: hasStream && videoEnabled
  })
);