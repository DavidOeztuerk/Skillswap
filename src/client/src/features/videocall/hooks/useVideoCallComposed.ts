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
 * - useVideoCallE2EE handles end-to-end encryption
 *
 * Note: Chat is now handled by VideoCallChatPanel using shared chat infrastructure.
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import {
  selectRoomId,
  selectPeerId,
  selectIsConnected,
  selectE2EEStatus,
  selectIsChatOpen,
  selectChatE2EEStatus,
  selectIsChatE2EEActive,
  selectChatE2EEStats,
  selectParticipants,
} from '../store/videoCallSelectors';
import { toggleChat } from '../store/videoCallSlice';
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
  const dispatch = useAppDispatch();
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
  const participants = useAppSelector(selectParticipants);

  // Chat E2EE selectors (for status display in VideoCallChatPanel)
  const chatE2EEStatus = useAppSelector(selectChatE2EEStatus);
  const isChatE2EEActive = useAppSelector(selectIsChatE2EEActive);
  const chatE2EEStats = useAppSelector(selectChatE2EEStats);

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

  // Toggle chat panel visibility
  const toggleChatPanel = useCallback(() => {
    dispatch(toggleChat());
  }, [dispatch]);

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

    if (e2eeStatus !== 'inactive') return;

    // FIX: Don't initialize E2EE if there are no remote participants
    // This prevents premature E2EE init after UserLeft when the remote user has left
    // but ICE is still connected for a moment
    const currentUserId = refs.userRef.current?.id;
    const hasRemoteParticipants = participants.some((p) => p.id !== currentUserId);
    if (!hasRemoteParticipants) {
      console.debug('🔒 E2EE: Skipping init - no remote participants');
      return;
    }

    const timer = setTimeout(() => {
      void e2ee.initializeE2EE();
    }, E2EE_INIT_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [roomId, peerId, e2eeStatus, isConnected, e2ee, refs, participants]);

  // ===== LAZY CHAT E2EE INITIALIZATION =====
  // Initialize Chat E2EE only when chat panel is opened (saves ~261ms ECDSA KeyGen)
  useEffect(() => {
    if (!isChatOpen) return;

    // Check if we have a pending key and Chat E2EE hasn't been initialized yet
    const pendingKey = refs.pendingChatE2EEKeyRef.current;
    if (!pendingKey) return;

    // Check if already initialized (localSigningKeyRef is set during init)
    if (refs.localSigningKeyRef.current) {
      console.debug('🔒 Chat E2EE: Already initialized, skipping');
      return;
    }

    console.debug('🔒 Chat E2EE: Lazy initialization triggered (chat panel opened)');
    void initializeChatE2EERef.current(
      pendingKey.encryptionKey,
      pendingKey.peerSigningPublicKey,
      pendingKey.peerSigningFingerprint
    );

    // Clear the pending key after initialization (intentional ref mutation)
    // eslint-disable-next-line react-hooks/immutability
    refs.pendingChatE2EEKeyRef.current = null;
  }, [isChatOpen, refs, initializeChatE2EERef]);

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

    // Chat state (panel visibility - chat content handled by VideoCallChatPanel)
    isChatOpen,

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

    // Chat panel toggle
    toggleChatPanel,

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

    // E2EE Chat status (for VideoCallChatPanel)
    chatE2EE: {
      status: chatE2EEStatus,
      isActive: isChatE2EEActive,
      localFingerprint: null, // Fingerprints now managed by shared chat
      peerFingerprint: null,
      stats: chatE2EEStats,
    },
  };
};

export default useVideoCallComposed;
