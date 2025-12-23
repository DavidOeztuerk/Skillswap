/**
 * useVideoCallComposed Hook
 *
 * Composing hook that orchestrates all modular video call hooks.
 * This is the main entry point for video call functionality.
 *
 * Architecture:
 * - VideoCallContext provides shared refs between hooks
 * - useVideoCallCore handles WebRTC/SignalR connection
 * - useVideoCallMedia handles media controls (mic, camera, screen share)
 * - useVideoCallParticipants handles participant list
 * - useVideoCallChat handles in-call chat
 * - useVideoCallE2EE handles end-to-end encryption
 */

import { useEffect } from 'react';
import { useAppSelector } from '../../../core/store/store.hooks';
import {
  selectRoomId,
  selectPeerId,
  selectIsConnected,
  selectE2EEStatus,
  selectIsChatOpen,
  selectChatMessages,
  selectParticipants,
} from '../store/videoCallSelectors';
import { useVideoCallChat } from './useVideoCallChat';
import { useVideoCallCore } from './useVideoCallCore';
import { useVideoCallE2EE } from './useVideoCallE2Ee';
import { useVideoCallMedia } from './useVideoCallMedia';
import { useVideoCallContext } from './VideoCallContext';
import type { UseVideoCallReturn } from './types';

// ============================================================================
// Constants
// ============================================================================

const E2EE_INIT_DELAY = 1500;

// ============================================================================
// Hook
// ============================================================================

export const useVideoCallComposed = (): UseVideoCallReturn => {
  const {
    refs,
    cleanupResourcesRef,
    setupSignalRRef,
    applyE2EEToMediaTracksRef,
    initializeChatE2EERef,
  } = useVideoCallContext();

  // Selectors for E2EE init effect
  const roomId = useAppSelector(selectRoomId);
  const peerId = useAppSelector(selectPeerId);
  const isConnected = useAppSelector(selectIsConnected);
  const e2eeStatus = useAppSelector(selectE2EEStatus);

  // Additional selectors for return value
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const messages = useAppSelector(selectChatMessages);
  const participants = useAppSelector(selectParticipants);

  // ===== MODULAR HOOKS =====

  // E2EE Hook (must be before Core to provide refs)
  const e2ee = useVideoCallE2EE(refs, initializeChatE2EERef, applyE2EEToMediaTracksRef);

  // Core Hook (WebRTC, SignalR, connection management)
  const core = useVideoCallCore(
    refs,
    cleanupResourcesRef,
    setupSignalRRef,
    applyE2EEToMediaTracksRef,
    initializeChatE2EERef
  );

  // Media Hook (mic, camera, screen share)
  const media = useVideoCallMedia(refs);

  // Chat Hook (in-call chat with E2EE)
  const chat = useVideoCallChat(refs);

  // ===== E2EE INITIALIZATION EFFECT =====
  useEffect(() => {
    if (
      !roomId ||
      !peerId ||
      !refs.peerRef.current ||
      !refs.signalRConnectionRef.current ||
      !isConnected
    ) {
      return;
    }

    if (e2eeStatus !== 'disabled') return;

    const timer = setTimeout(() => {
      void e2ee.initializeE2EE();
    }, E2EE_INIT_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [roomId, peerId, e2eeStatus, isConnected, e2ee, refs]);

  // ===== RETURN COMPOSED API =====
  return {
    // State from Core
    sessionId: core.sessionId,
    roomId: core.roomId,
    isConnected: core.isConnected,
    peerId: core.peerId,
    localStream: core.localStream,
    remoteStream: core.remoteStream,
    isMicEnabled: core.isMicEnabled,
    isVideoEnabled: core.isVideoEnabled,
    isScreenSharing: core.isScreenSharing,
    callDuration: core.callDuration,
    isLoading: core.isLoading,
    error: core.error,
    callConfig: core.callConfig,

    // Chat state
    isChatOpen,
    messages,

    // Participants
    participants,

    // Actions from Core
    startVideoCall: core.startVideoCall,
    hangUp: core.hangUp,
    clearError: core.clearCallError,

    // Actions from Media
    toggleMicrophone: media.toggleMicrophone,
    toggleCamera: media.toggleCamera,
    toggleScreenSharing: media.toggleScreenSharing,

    // Actions from Chat
    toggleChatPanel: chat.toggleChatPanel,
    sendChatMessage: chat.sendMessage,

    // PeerConnection access
    peerConnection: core.peerConnection,

    // E2EE Video
    e2ee: {
      status: e2ee.status,
      isActive: e2ee.isActive,
      localKeyFingerprint: e2ee.localKeyFingerprint,
      remotePeerFingerprint: e2ee.remotePeerFingerprint,
      formattedLocalFingerprint: e2ee.formattedLocalFingerprint,
      formattedRemoteFingerprint: e2ee.formattedRemoteFingerprint,
      keyGeneration: e2ee.keyGeneration,
      encryptionStats: e2ee.encryptionStats,
      compatibility: e2ee.compatibility,
      errorMessage: e2ee.errorMessage,
      rotateKeys: e2ee.rotateKeys,
    },

    // E2EE Chat
    chatE2EE: chat.chatE2EE,
  };
};

export default useVideoCallComposed;
