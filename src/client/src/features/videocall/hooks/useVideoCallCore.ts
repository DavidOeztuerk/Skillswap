/**
 * useVideoCallCore Hook
 *
 * Core video call functionality: WebRTC, SignalR, connection management.
 * Orchestrates the entire video call lifecycle.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { HubConnectionState, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useStreams } from '../../../core/contexts/streamContextHooks';
import StreamManager from '../../../core/services/StreamManager';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { type ApiResponse, isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { getToken } from '../../../shared/utils/authHelpers';
import { E2EEManager } from '../../../shared/utils/crypto/e2eeVideoEncryption';
import { InsertableStreamsHandler } from '../../../shared/utils/crypto/insertableStreamsHandler';
import { getWebRTCConfiguration } from '../../../shared/utils/webrtcConfig';
import { selectAuthUser } from '../../auth/store/authSelectors';
import videoCallService from '../services/videoCallService';
import {
  selectSessionId,
  selectRoomId,
  selectIsConnected,
  selectPeerId,
  selectIsMicEnabled,
  selectIsVideoEnabled,
  selectIsScreenSharing,
  selectCallDuration,
  selectVideocallLoading,
  selectVideocallError,
  selectChatE2EEStatus,
} from '../store/videoCallSelectors';
import {
  setConnected,
  resetCall,
  setError,
  addParticipant,
  removeParticipant,
  incrementChatMessagesDecrypted,
  incrementChatVerificationFailures,
  addMessage,
  updateParticipant,
  setLoading,
  initializeCall,
  clearError,
} from '../store/videoCallSlice';
import { joinVideoCall, leaveVideoCall } from '../store/videocallThunks';
import { type VideoCallSharedRefs, useRefSync } from './VideoCallContext';
import type { EncryptedMessage } from '../../../shared/utils/crypto/e2eeChatEncryption';
import type { ChatMessage } from '../../chat/types/ChatMessage';
import type { VideoCallConfig } from '../types/VideoCallConfig';

// ============================================================================
// Constants
// ============================================================================

const MAX_ICE_BUFFER_SIZE = 50;
const RECONNECT_DELAYS = [0, 1000, 5000, 10000, 30000];
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 5000;

// ============================================================================
// Helper Functions (extracted to reduce cognitive complexity)
// ============================================================================

/**
 * Get participant name based on userId and config
 */
function getParticipantName(userId: string, config: VideoCallConfig): string {
  if (userId === config.initiatorUserId) {
    return config.initiatorName;
  }
  if (userId === config.participantUserId) {
    return config.participantName;
  }
  return 'Teilnehmer';
}

/**
 * Get participant avatar based on userId and config
 */
function getParticipantAvatar(userId: string, config: VideoCallConfig): string | null | undefined {
  if (userId === config.initiatorUserId) {
    return config.initiatorAvatarUrl;
  }
  if (userId === config.participantUserId) {
    return config.participantAvatarUrl;
  }
  return undefined;
}

/**
 * Atomic ref assignment helper to avoid race conditions
 */
function setRefValue<T>(ref: React.RefObject<T>, value: T): void {
  (ref as { current: T }).current = value;
}

/**
 * Handle Chrome encoded streams preparation for receiver
 */
function handleChromeEncodedStreams(refs: VideoCallSharedRefs, receiver: RTCRtpReceiver): void {
  const handler = refs.streamsHandlerRef.current;
  if (!handler || handler.getE2EEMethod() !== 'encodedStreams') return;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
  if (receiver.track === null) return;

  const kind = receiver.track.kind as 'video' | 'audio';
  if (refs.e2eeTransformsAppliedRef.current) {
    console.debug(`🔒 E2EE: Skipping early prepare for ${kind} - transforms already applied`);
    return;
  }

  console.debug(`🔒 E2EE: Preparing receiver streams BEFORE stream activation for ${kind}`);
  handler.prepareEncodedStreamsForReceiver(receiver, kind);
}

/**
 * Handle Safari script transform decryption
 */
function handleSafariScriptTransform(refs: VideoCallSharedRefs, receiver: RTCRtpReceiver): void {
  const handler = refs.streamsHandlerRef.current;
  if (!handler || handler.getE2EEMethod() !== 'scriptTransform') return;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
  if (receiver.track === null) return;

  if (!handler.areWorkersInitialized()) {
    console.debug(`⏳ Safari: Workers not ready yet for ${receiver.track.kind}`);
    return;
  }

  const kind = receiver.track.kind as 'video' | 'audio';
  console.debug(`🍎 Safari: Applying decryption transform IMMEDIATELY in ontrack for ${kind}`);
  try {
    handler.applyDecryptionToReceiver(receiver, kind);
    console.debug(`✅ Safari: Early decryption transform applied for ${kind}`);
  } catch (e) {
    console.warn(`🍎 Safari: Failed to apply early decryption transform for ${kind}:`, e);
  }
}

/**
 * Clear all timers (timeouts and intervals)
 */
function cleanupTimers(refs: VideoCallSharedRefs): void {
  if (refs.reconnectTimeoutRef.current) {
    clearTimeout(refs.reconnectTimeoutRef.current);
    refs.reconnectTimeoutRef.current = null;
  }

  if (refs.heartbeatIntervalRef.current) {
    clearInterval(refs.heartbeatIntervalRef.current);
    refs.heartbeatIntervalRef.current = null;
  }

  if (refs.statsIntervalRef.current) {
    clearInterval(refs.statsIntervalRef.current);
    refs.statsIntervalRef.current = null;
  }
}

/**
 * Clean up E2EE related resources
 */
function cleanupE2EE(refs: VideoCallSharedRefs): void {
  refs.e2eeManagerRef.current?.stopKeyRotation();
  refs.streamsHandlerRef.current?.disableEncryption();
  refs.keyExchangeManagerRef.current?.cleanup();
  refs.e2eeManagerRef.current?.cleanup();
  refs.streamsHandlerRef.current?.cleanup();
  refs.e2eeTransformsAppliedRef.current = false;
}

/**
 * Clean up PeerConnection and its tracks
 */
async function cleanupPeerConnection(refs: VideoCallSharedRefs): Promise<void> {
  if (!refs.peerRef.current) return;

  const pc = refs.peerRef.current;
  try {
    const senders = pc.getSenders();
    console.debug(`🧹 Cleanup: Removing ${senders.length} tracks from senders`);
    for (const sender of senders) {
      if (sender.track) {
        try {
          sender.track.stop();
          sender.track.enabled = false;
          pc.removeTrack(sender);
        } catch (e) {
          console.warn('Error removing track from sender:', e);
        }
      }
    }

    pc.onicecandidate = null;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.oniceconnectionstatechange = null;

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });

    if (pc.signalingState !== 'closed') {
      pc.close();
    }
  } catch (e) {
    console.warn('Error closing PeerConnection:', e);
  }
  setRefValue(refs.peerRef, null);
}

// ============================================================================
// Types
// ============================================================================

interface RoomParticipant {
  userId: string;
  connectionId: string;
  joinedAt: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenShareEnabled: boolean;
  isInitiator: boolean;
}

export interface UseVideoCallCoreReturn {
  // State
  sessionId: string | null;
  roomId: string;
  isConnected: boolean;
  peerId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  isLoading: boolean;
  error: string | null;
  callConfig: VideoCallConfig | null;

  // Actions
  startVideoCall: (appointmentId: string) => Promise<void>;
  hangUp: () => Promise<void>;
  clearCallError: () => void;

  // Refs access for other hooks
  peerConnection: RTCPeerConnection | null;
}

// ============================================================================
// Hook
// ============================================================================

export const useVideoCallCore = (
  refs: VideoCallSharedRefs,
  cleanupResourcesRef: React.RefObject<(isFullCleanup?: boolean) => Promise<void>>,
  setupSignalRRef: React.RefObject<(config: VideoCallConfig) => Promise<void>>,
  _applyE2EEToMediaTracksRef: React.RefObject<() => void>,
  _initializeChatE2EERef: React.RefObject<
    (
      sharedEncryptionKey: CryptoKey | undefined,
      peerSigningPublicKey?: string,
      peerSigningFingerprint?: string
    ) => Promise<void>
  >
): UseVideoCallCoreReturn => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const { localStream, remoteStream, createLocalStream, registerRemoteStream, cleanup } =
    useStreams();

  // Selectors
  const sessionId = useAppSelector(selectSessionId);
  const roomId = useAppSelector(selectRoomId);
  const isConnected = useAppSelector(selectIsConnected);
  const peerId = useAppSelector(selectPeerId);
  const isMicEnabled = useAppSelector(selectIsMicEnabled);
  const isVideoEnabled = useAppSelector(selectIsVideoEnabled);
  const isScreenSharing = useAppSelector(selectIsScreenSharing);
  const callDuration = useAppSelector(selectCallDuration);
  const isLoading = useAppSelector(selectVideocallLoading);
  const error = useAppSelector(selectVideocallError);
  const chatE2EEStatus = useAppSelector(selectChatE2EEStatus);

  // Local ref for cleanup callback
  const localStreamRef = useRef(localStream);
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Sync Redux state to shared refs
  useRefSync(refs, {
    roomId: roomId ?? '',
    sessionId,
    peerId,
    isConnected,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    chatE2EEStatus,
    user: user ?? null,
  });

  // ===== PEER CONNECTION MANAGEMENT =====
  const createPeerConnection = useCallback(
    (config: VideoCallConfig): RTCPeerConnection => {
      console.debug('🔧 Creating new RTCPeerConnection');

      // Initialize E2EE managers early (before addTrack for Chrome)
      refs.e2eeManagerRef.current ??= new E2EEManager();
      if (!refs.streamsHandlerRef.current) {
        refs.streamsHandlerRef.current = new InsertableStreamsHandler(refs.e2eeManagerRef.current);
        console.debug(
          '🔒 E2EE: StreamsHandler early initialized, method:',
          refs.streamsHandlerRef.current.getE2EEMethod()
        );

        // Safari: Pre-initialize workers
        if (refs.streamsHandlerRef.current.getE2EEMethod() === 'scriptTransform') {
          console.debug('🍎 Safari: Pre-initializing E2EE workers');
          refs.streamsHandlerRef.current.initializeWorkers().catch((e: unknown) => {
            console.error('🍎 Safari worker early init failed:', e);
          });
        }
      }

      const pc = new RTCPeerConnection(getWebRTCConfiguration());

      pc.ontrack = (event) => {
        console.debug('🎥 ONTRACK EVENT:', {
          streams: event.streams.length,
          track: event.track.kind,
          trackId: event.track.id,
        });

        // Handle E2EE for different browser implementations
        handleChromeEncodedStreams(refs, event.receiver);
        handleSafariScriptTransform(refs, event.receiver);

        // Set remote stream after encoded streams prepared
        if (event.streams.length > 0) {
          const stream = event.streams[0];
          // registerRemoteStream handles both context state and Redux dispatch via StreamManager events
          registerRemoteStream(stream);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.debug('🧊 ICE Candidate found');
          const connection = refs.signalRConnectionRef.current;
          const currentRoomId = refs.roomIdRef.current;
          const currentUser = refs.userRef.current;

          if (connection !== null && currentRoomId !== '') {
            const targetUserId =
              config.initiatorUserId === currentUser?.id
                ? config.participantUserId
                : config.initiatorUserId;

            if (targetUserId) {
              connection
                .invoke(
                  'SendIceCandidate',
                  currentRoomId,
                  targetUserId,
                  JSON.stringify(event.candidate.toJSON())
                )
                .catch((err: unknown) => {
                  console.error('Failed to send ICE candidate:', err);
                });
            }
          }
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.debug('🔗 PeerConnection State:', state);

        if (!refs.isMountedRef.current) return;

        if (state === 'connected') {
          dispatch(setConnected(true));
        } else if (state === 'disconnected' || state === 'failed') {
          console.warn(`🔄 PeerConnection ${state}`);
          dispatch(setConnected(false));

          setTimeout(() => {
            if (
              (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') &&
              refs.isMountedRef.current
            ) {
              void cleanupResourcesRef.current(false);
            }
          }, CONNECTION_TIMEOUT);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.debug('❄️ ICE Connection State:', pc.iceConnectionState);
      };

      return pc;
    },
    [dispatch, registerRemoteStream, refs, cleanupResourcesRef]
  );

  const ensurePeerConnection = useCallback(
    (config: VideoCallConfig): RTCPeerConnection => {
      const existingPc = refs.peerRef.current;

      if (existingPc) {
        const isUsable =
          existingPc.signalingState !== 'closed' &&
          existingPc.connectionState !== 'closed' &&
          existingPc.connectionState !== 'failed';

        if (isUsable) {
          return existingPc;
        }
      }

      const pc = createPeerConnection(config);
      refs.peerRef.current = pc;

      // Add existing tracks
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState !== 'ended') {
            try {
              const sender = pc.addTrack(track, localStream);
              console.debug(`✅ Added ${track.kind} track to PC`);

              // Chrome: Prepare encoded streams immediately after addTrack
              if (refs.streamsHandlerRef.current?.getE2EEMethod() === 'encodedStreams') {
                const kind = track.kind as 'video' | 'audio';
                refs.streamsHandlerRef.current.prepareEncodedStreamsForSender(sender, kind);
              }
            } catch (e) {
              console.error(`Failed to add ${track.kind} track:`, e);
            }
          }
        });
      }

      return pc;
    },
    [createPeerConnection, localStream, refs]
  );

  // ===== SIGNALING HANDLERS =====
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const pc = refs.peerRef.current;
      if (!pc) return;

      if (pc.remoteDescription?.type === 'answer') {
        console.warn('Already have answer, ignoring');
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Process buffered candidates (must be sequential for WebRTC)
        for (const candidate of refs.iceCandidatesBuffer.current) {
          try {
            // eslint-disable-next-line no-await-in-loop -- ICE candidates must be added sequentially
            await pc.addIceCandidate(candidate);
          } catch (e) {
            console.warn('Failed to add buffered ICE candidate:', e);
          }
        }
        setRefValue(refs.iceCandidatesBuffer, []);
      } catch (answerError) {
        console.error('Error handling answer:', answerError);
      }
    },
    [refs]
  );

  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      const pc = refs.peerRef.current;

      if (!pc?.remoteDescription) {
        if (refs.iceCandidatesBuffer.current.length < MAX_ICE_BUFFER_SIZE) {
          refs.iceCandidatesBuffer.current.push(candidate);
        } else {
          console.warn('ICE buffer full, dropping candidate');
        }
        return;
      }

      try {
        await pc.addIceCandidate(candidate);
      } catch (iceError) {
        console.error('Error adding ICE candidate:', iceError);
      }
    },
    [refs]
  );

  const createOfferForTarget = useCallback(
    async (config: VideoCallConfig, targetUserId: string) => {
      if (!targetUserId || !config.roomId) return;

      // Deduplication: Skip if offer already sent for this peer
      if (refs.offerSentForPeerRef.current.has(targetUserId)) {
        console.debug('⏭️ Skipping duplicate offer for', targetUserId, '- already sent');
        return;
      }

      try {
        const pc = ensurePeerConnection(config);

        // Ensure we have tracks
        if (pc.getSenders().length === 0 && localStream) {
          localStream.getTracks().forEach((track: MediaStreamTrack) => {
            if (track.readyState !== 'ended') {
              const sender = pc.addTrack(track, localStream);

              // Chrome: Prepare encoded streams immediately after addTrack
              if (refs.streamsHandlerRef.current?.getE2EEMethod() === 'encodedStreams') {
                const kind = track.kind as 'video' | 'audio';
                refs.streamsHandlerRef.current.prepareEncodedStreamsForSender(sender, kind);
              }
            }
          });
        }

        const offer = await pc.createOffer();

        if (!offer.sdp || (!offer.sdp.includes('m=audio') && !offer.sdp.includes('m=video'))) {
          console.error('CRITICAL: Offer SDP contains no media!');
          return;
        }

        await pc.setLocalDescription(offer);

        const connection = refs.signalRConnectionRef.current;
        if (connection?.state === HubConnectionState.Connected) {
          refs.offerSentForPeerRef.current.add(targetUserId);
          await connection.invoke('SendOffer', config.roomId, targetUserId, offer.sdp);
          console.debug('📤 Sent offer to', targetUserId);
        }
      } catch (err) {
        console.error('createOffer failed:', err);
        refs.offerSentForPeerRef.current.delete(targetUserId);
      }
    },
    [ensurePeerConnection, localStream, refs]
  );

  // ===== CLEANUP =====
  const cleanupResources = useCallback(
    async (isFullCleanup?: boolean) => {
      const fullCleanup = isFullCleanup ?? false;
      console.debug('🧹 Cleaning up resources...', { isFullCleanup: fullCleanup });

      // Clean up E2EE and timers
      cleanupE2EE(refs);
      cleanupTimers(refs);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      // Stop local stream tracks if call was active
      const currentLocalStream = localStreamRef.current;
      if (currentLocalStream && refs.peerRef.current) {
        console.debug('🎥 Stopping local stream tracks for camera release...');
        currentLocalStream.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
            console.debug(`✅ Stopped local ${track.kind} track`);
          } catch (e) {
            console.warn(`Error stopping local ${track.kind} track:`, e);
          }
        });
      }

      // PeerConnection cleanup - critical for Safari camera release
      await cleanupPeerConnection(refs);

      // SignalR cleanup after E2EE handlers removed
      if (refs.signalRConnectionRef.current) {
        try {
          await refs.signalRConnectionRef.current.stop();
        } catch {
          // Ignore stop errors
        }
        setRefValue(refs.signalRConnectionRef, null);
      }

      // Clear buffers
      setRefValue(refs.iceCandidatesBuffer, []);
      refs.offerSentForPeerRef.current.clear();

      const currentRoomId = refs.roomIdRef.current;
      if (currentRoomId) {
        refs.chatManagerRef.current.removeConversation(currentRoomId);
      }

      // Full cleanup
      if (isFullCleanup) {
        console.debug('🧹 Full cleanup: Stopping all streams');
        cleanup();
        dispatch(resetCall());
        setRefValue(refs.isInitializedRef, false);
      }
    },
    [dispatch, cleanup, refs]
  );

  // Sync cleanupResources to ref
  useEffect(() => {
    cleanupResourcesRef.current = cleanupResources;
  }, [cleanupResources, cleanupResourcesRef]);

  // ===== SIGNALR SETUP =====
  const setupSignalR = useCallback(
    async (config: VideoCallConfig) => {
      const token = getToken();

      if (!token) {
        dispatch(setError('Authentifizierungsfehler'));
        return;
      }

      console.debug('🔌 Starting SignalR connection...');

      const connection = new HubConnectionBuilder()
        .withUrl(
          `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/videocall/hub?roomId=${config.roomId}`,
          { accessTokenFactory: () => token }
        )
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect(RECONNECT_DELAYS)
        .build();

      // UserJoined
      connection.on('UserJoined', async (data: { userId: string }) => {
        const joinedUserId = data.userId;
        const currentUser = refs.userRef.current;

        console.debug('👥 UserJoined:', joinedUserId);

        if (!joinedUserId || joinedUserId === currentUser?.id) return;

        const participantName = getParticipantName(joinedUserId, config);
        const participantAvatar = getParticipantAvatar(joinedUserId, config);

        dispatch(
          addParticipant({
            id: joinedUserId,
            name: participantName,
            avatar: participantAvatar ?? undefined,
            audioEnabled: true,
            videoEnabled: true,
          })
        );

        await new Promise<void>((r) => {
          setTimeout(r, 500);
        });

        const isInitiator = config.initiatorUserId === currentUser?.id;

        if (isInitiator) {
          console.debug('📤 I am initiator, creating offer for:', joinedUserId);
          await createOfferForTarget(config, joinedUserId);

          // Re-trigger key exchange if peer joined
          if (refs.keyExchangeManagerRef.current) {
            const keyExchangeState = refs.keyExchangeManagerRef.current.getState();
            if (keyExchangeState !== 'complete') {
              console.debug('🔐 E2EE: Peer joined! Re-triggering key exchange...');
              void refs.keyExchangeManagerRef.current.retriggerKeyExchange();
            }
          }
        } else {
          console.debug('⏳ I am NOT initiator, waiting for offer from:', config.initiatorUserId);
        }
      });

      // UserLeft
      connection.on('UserLeft', (data: { userId: string }) => {
        console.debug('👋 UserLeft:', data.userId);
        dispatch(removeParticipant(data.userId));
      });

      // RoomJoined
      connection.on(
        'RoomJoined',
        async (data: { roomId: string; participants: RoomParticipant[] }) => {
          console.debug('🏠 RoomJoined:', data);
          const currentUser = refs.userRef.current;

          if (data.participants.length > 0) {
            for (const participant of data.participants) {
              const participantUserId = participant.userId;
              if (participantUserId === currentUser?.id) continue;

              const existingParticipantName = getParticipantName(participantUserId, config);
              const existingParticipantAvatar = getParticipantAvatar(participantUserId, config);

              dispatch(
                addParticipant({
                  id: participantUserId,
                  name: existingParticipantName,
                  avatar: existingParticipantAvatar ?? undefined,
                  audioEnabled: participant.microphoneEnabled,
                  videoEnabled: participant.cameraEnabled,
                })
              );

              const isInitiator = config.initiatorUserId === currentUser?.id;
              if (isInitiator) {
                console.debug('📤 Room has participant, creating offer for:', participantUserId);
                // eslint-disable-next-line no-await-in-loop -- Sequential offer creation required for WebRTC
                await new Promise<void>((r) => {
                  setTimeout(r, 500);
                });
                // eslint-disable-next-line no-await-in-loop -- Sequential offer creation required for WebRTC
                await createOfferForTarget(config, participantUserId);
              }
            }
          }
        }
      );

      // HeartbeatAck
      connection.on('HeartbeatAck', (data: { timestamp: string; acknowledged: boolean }) => {
        console.debug('💓 HeartbeatAck received:', data);
      });

      // ReceiveOffer
      connection.on('ReceiveOffer', async (data: { fromUserId: string; offer: string }) => {
        console.debug('📩 ReceiveOffer from', data.fromUserId);

        try {
          const pc = ensurePeerConnection(config);

          if (pc.remoteDescription?.type) {
            console.warn('Already have remote description');
            return;
          }

          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'offer', sdp: data.offer })
          );

          // Process buffered candidates (must be sequential for WebRTC)
          for (const candidate of refs.iceCandidatesBuffer.current) {
            try {
              // eslint-disable-next-line no-await-in-loop -- ICE candidates must be added sequentially
              await pc.addIceCandidate(candidate);
            } catch (e) {
              console.warn('Failed to add buffered candidate:', e);
            }
          }
          setRefValue(refs.iceCandidatesBuffer, []);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (connection.state === HubConnectionState.Connected) {
            await connection.invoke('SendAnswer', config.roomId, data.fromUserId, answer.sdp);
            console.debug('📤 Sent answer');
          }
        } catch (e) {
          console.error('Error handling offer:', e);
        }
      });

      // ReceiveAnswer
      connection.on('ReceiveAnswer', async (data: { fromUserId: string; answer: string }) => {
        console.debug('📩 ReceiveAnswer from', data.fromUserId);
        await handleAnswer({ type: 'answer', sdp: data.answer });
      });

      // ReceiveIceCandidate
      connection.on(
        'ReceiveIceCandidate',
        async (data: { fromUserId: string; candidate: string }) => {
          console.debug('🧊 ReceiveIceCandidate from', data.fromUserId);
          try {
            const candidateObj = JSON.parse(data.candidate) as RTCIceCandidateInit;
            await handleIceCandidate(candidateObj);
          } catch (e) {
            console.error('Error handling ICE candidate:', e);
          }
        }
      );

      // ChatMessage
      connection.on(
        'ChatMessage',
        async (data: { userId: string; message: string; timestamp: string }) => {
          const currentUser = refs.userRef.current;
          if (data.userId === currentUser?.id) return;

          let messageContent = data.message;
          let isEncrypted = false;
          let isVerified = false;

          const currentChatE2EEStatus = refs.chatE2EEStatusRef.current;
          const currentRoomId = refs.roomIdRef.current;

          if (currentChatE2EEStatus === 'active' && currentRoomId) {
            try {
              const encryptedData = JSON.parse(data.message) as EncryptedMessage;
              const decrypted = await refs.chatManagerRef.current.decryptMessage(
                currentRoomId,
                encryptedData
              );
              messageContent = decrypted.content;
              isEncrypted = true;
              isVerified = decrypted.isVerified;

              dispatch(incrementChatMessagesDecrypted());
              if (!isVerified) {
                dispatch(incrementChatVerificationFailures());
              }
            } catch {
              // Use original message
            }
          }

          const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            sessionId: refs.sessionIdRef.current ?? '',
            senderId: data.userId,
            senderName: 'Participant',
            message: messageContent,
            sentAt: data.timestamp,
            messageType: isEncrypted ? 'Encrypted' : 'Text',
            isEncrypted,
            isVerified,
          };

          dispatch(addMessage(chatMessage));
        }
      );

      // MediaStateChanged
      connection.on(
        'MediaStateChanged',
        (data: { userId: string; type: string; enabled: boolean }) => {
          dispatch(
            updateParticipant({
              id: data.userId,
              ...(data.type === 'audio' && { isMuted: !data.enabled }),
              ...(data.type === 'video' && { isVideoEnabled: data.enabled }),
              ...(data.type === 'screen' && { isScreenSharing: data.enabled }),
            })
          );
        }
      );

      // Connection lifecycle
      connection.onclose((closeError) => {
        console.warn('🔌 SignalR closed', closeError);
        if (refs.isMountedRef.current) {
          dispatch(setConnected(false));
        }

        if (refs.signalRConnectionRef.current === connection) {
          refs.signalRConnectionRef.current = null;
        }

        if (refs.isInitializedRef.current && refs.isMountedRef.current) {
          refs.reconnectTimeoutRef.current = setTimeout(() => {
            void setupSignalR(config);
          }, 2000);
        }
      });

      connection.onreconnected(() => {
        console.debug('✅ SignalR reconnected');
        dispatch(setConnected(true));

        const currentRoomId = refs.roomIdRef.current;
        if (currentRoomId) {
          void connection
            .invoke('JoinRoom', currentRoomId)
            .then(() => {
              console.debug('✅ Re-joined room after reconnect');
            })
            .catch((e: unknown) => {
              console.warn('Failed to re-join room:', e);
            });
        }
      });

      connection.onreconnecting(() => {
        console.debug('🔄 SignalR reconnecting...');
      });

      try {
        await connection.start();
        console.debug('✅ SignalR connected');
        refs.signalRConnectionRef.current = connection;
        dispatch(setConnected(true));

        if (config.roomId) {
          await connection.invoke('JoinRoom', config.roomId);
          console.debug('✅ Joined room:', config.roomId);
        }

        // Start heartbeat
        refs.heartbeatIntervalRef.current = setInterval(() => {
          const currentRoomId = refs.roomIdRef.current;
          if (connection.state === HubConnectionState.Connected && currentRoomId) {
            void connection.invoke('SendHeartbeat', currentRoomId).catch((e: unknown) => {
              console.warn('Heartbeat failed:', e);
            });
          }
        }, HEARTBEAT_INTERVAL);
      } catch (err) {
        console.error('SignalR start failed:', err);
        dispatch(setError('SignalR-Verbindung fehlgeschlagen'));
        throw err;
      }
    },
    [dispatch, ensurePeerConnection, createOfferForTarget, handleAnswer, handleIceCandidate, refs]
  );

  // Sync setupSignalR to ref
  useEffect(() => {
    setupSignalRRef.current = setupSignalR;
  }, [setupSignalR, setupSignalRRef]);

  // ===== WEBRTC SETUP =====
  const setupWebRTC = useCallback(
    async (config: VideoCallConfig) => {
      if (refs.isInitializedRef.current) {
        console.debug('Already initialized, skipping');
        return;
      }

      refs.isInitializedRef.current = true;
      refs.configRef.current = config;

      try {
        console.debug('🎥 Requesting media devices...');

        // createLocalStream handles getUserMedia, context state, and Redux dispatch via StreamManager events
        const stream = await createLocalStream({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        console.debug('✅ MediaStream obtained:', stream.getTracks().length, 'tracks');

        const pc = createPeerConnection(config);
        setRefValue(refs.peerRef, pc);

        stream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState !== 'ended') {
            const sender = pc.addTrack(track, stream);
            console.debug(`✅ Added ${track.kind} track`);

            // Chrome: Prepare encoded streams immediately after addTrack
            if (refs.streamsHandlerRef.current?.getE2EEMethod() === 'encodedStreams') {
              const kind = track.kind as 'video' | 'audio';
              refs.streamsHandlerRef.current.prepareEncodedStreamsForSender(sender, kind);
            }
          }
        });

        await setupSignalRRef.current(config);

        console.debug('✅ WebRTC Setup completed');
      } catch (err: unknown) {
        console.error('WebRTC Setup Error:', err);
        setRefValue(refs.isInitializedRef, false);
        dispatch(setError(err instanceof Error ? err.message : 'Verbindungsaufbau fehlgeschlagen'));
        await cleanupResources(true);
      }
    },
    [dispatch, createLocalStream, createPeerConnection, cleanupResources, refs, setupSignalRRef]
  );

  // ===== ACTIONS =====
  const actions = useMemo(
    () => ({
      startVideoCall: async (appointmentId: string) => {
        if (refs.isInitializedRef.current) {
          console.warn('Already initialized');
          return;
        }

        try {
          dispatch(setLoading(true));

          let configResponse: ApiResponse<VideoCallConfig>;
          configResponse = await videoCallService.getCallConfig(appointmentId);

          if (!isSuccessResponse(configResponse)) {
            configResponse = await videoCallService.createCallRoom(appointmentId);
          }

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- data can be undefined after isSuccessResponse
          if (!isSuccessResponse(configResponse) || configResponse.data === undefined) {
            throw new Error('Konnte Anruf-Konfiguration nicht laden');
          }

          const config = configResponse.data;
          console.debug('📞 Initializing call with config:', config.roomId);

          dispatch(initializeCall(config));
          await setupWebRTC(config);

          if (config.sessionId && refs.signalRConnectionRef.current) {
            try {
              await dispatch(
                joinVideoCall({
                  sessionId: config.sessionId,
                  connectionId: refs.signalRConnectionRef.current.connectionId ?? undefined,
                  cameraEnabled: true,
                  microphoneEnabled: true,
                })
              ).unwrap();
            } catch (e) {
              console.warn('API Join failed:', e);
            }
          }
        } catch (err: unknown) {
          console.error('Start Video Call Failed:', err);
          dispatch(setError(err instanceof Error ? err.message : 'Fehler beim Starten'));
          await cleanupResources(true);
        } finally {
          dispatch(setLoading(false));
        }
      },

      hangUp: async () => {
        console.debug('📞 Hanging up...');

        const currentSessionId = refs.sessionIdRef.current;
        if (currentSessionId) {
          try {
            await dispatch(leaveVideoCall(currentSessionId)).unwrap();
          } catch (e) {
            console.error('Failed to leave via API:', e);
          }
        }

        await cleanupResources(true);
      },
    }),
    [dispatch, setupWebRTC, cleanupResources, refs]
  );

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    refs.isMountedRef.current = true;

    return () => {
      console.debug('🔄 useVideoCallCore unmounting');
      refs.isMountedRef.current = false;
      void cleanupResources(true);
    };
  }, [cleanupResources, refs]);

  // ===== SAFARI EMERGENCY CLEANUP =====
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      console.debug('🚨 beforeunload: Emergency camera cleanup');

      if (refs.peerRef.current) {
        try {
          const senders = refs.peerRef.current.getSenders();
          senders.forEach((sender) => {
            if (sender.track) {
              sender.track.stop();
              sender.track.enabled = false;
            }
          });
        } catch {
          /* ignore */
        }
      }

      const currentLocalStream = localStreamRef.current;
      if (currentLocalStream) {
        currentLocalStream.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {
            /* ignore */
          }
        });
      }

      try {
        const streamManager = StreamManager.getInstance();
        streamManager.destroyAllStreams();
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [refs]);

  // ===== DEBUG HELPERS =====
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const dbg = {
      getPeer: () => refs.peerRef.current,
      getSignalR: () => refs.signalRConnectionRef.current,
      getLocalStream: () => localStream,
      getRemoteStream: () => remoteStream,
      getSenders: () =>
        refs.peerRef.current?.getSenders().map((s) => ({
          kind: s.track?.kind ?? 'unknown',
          id: s.track?.id ?? '',
          enabled: s.track?.enabled ?? false,
        })) ?? [],
      getReceivers: () =>
        refs.peerRef.current?.getReceivers().map((r) => ({
          kind: r.track.kind,
          id: r.track.id,
        })) ?? [],
      getState: () => ({
        peer: refs.peerRef.current?.connectionState,
        signalR: refs.signalRConnectionRef.current?.state,
        initialized: refs.isInitializedRef.current,
      }),
    };

    (window as unknown as Record<string, unknown>).__vcDebug = dbg;
    return () => {
      if ((window as unknown as Record<string, unknown>).__vcDebug === dbg) {
        (window as unknown as Record<string, unknown>).__vcDebug = undefined;
      }
    };
  }, [localStream, remoteStream, refs]);

  return {
    // State
    sessionId,
    roomId: roomId ?? '',
    isConnected,
    peerId,
    localStream,
    remoteStream,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    callDuration,
    isLoading,
    error: error ?? null,
    callConfig: refs.configRef.current,

    // Actions
    ...actions,
    clearCallError: () => dispatch(clearError()),

    // Refs access
    peerConnection: refs.peerRef.current,
  };
};

export default useVideoCallCore;
