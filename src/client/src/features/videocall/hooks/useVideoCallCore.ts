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
import { isSafari } from '../../../shared/detection';
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
  updateParticipant,
  setLoading,
  initializeCall,
  clearError,
  resetE2EE,
} from '../store/videoCallSlice';
import { joinVideoCall, leaveVideoCall } from '../store/videocallThunks';
import { type VideoCallSharedRefs, useRefSync } from './VideoCallContext';
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
  return 'Participant';
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
 * REJOIN FIX: If workers aren't ready yet, wait for them before applying transform
 */
async function handleSafariScriptTransform(
  refs: VideoCallSharedRefs,
  receiver: RTCRtpReceiver
): Promise<void> {
  const handler = refs.streamsHandlerRef.current;
  if (!handler || handler.getE2EEMethod() !== 'scriptTransform') return;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
  if (receiver.track === null) return;

  // REJOIN FIX: Wait for workers to be ready instead of just returning
  if (!handler.areWorkersInitialized()) {
    console.debug(`⏳ Safari: Workers not ready yet for ${receiver.track.kind}, waiting...`);
    try {
      await handler.waitForWorkersReady();
      console.debug(`✅ Safari: Workers now ready for ${receiver.track.kind}`);
    } catch (e) {
      console.error(`❌ Safari: Failed to wait for workers:`, e);
      return;
    }
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

interface TrackCleanupItem {
  sender: RTCRtpSender;
  track: MediaStreamTrack;
}

/**
 * Safari cleanup: Remove all tracks from PC, optionally stop them
 * @param stopTracks - If false, only removes from PC but keeps tracks live (for reconnect)
 */
async function cleanupTracksSafari(
  pc: RTCPeerConnection,
  tracksToCleanup: TrackCleanupItem[],
  stopTracks = true
): Promise<void> {
  // Step 1: Remove all tracks from PeerConnection
  for (const { sender, track } of tracksToCleanup) {
    try {
      console.debug(`🍎 Safari: Removing ${track.kind} track from PC...`);
      pc.removeTrack(sender);
    } catch (e) {
      console.warn(`Error removing ${track.kind} track from PC:`, e);
    }
  }

  // Step 2: CRITICAL - Safari needs 50ms delay between removeTrack and stop!
  console.debug('🍎 Safari: Waiting 50ms for camera release...');
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 50);
  });

  // Step 3: Stop all tracks (only if stopTracks is true)
  if (stopTracks) {
    for (const { track } of tracksToCleanup) {
      try {
        track.stop();
        track.enabled = false;
        console.debug(`🍎 Safari: Stopped ${track.kind} track`);
      } catch (e) {
        console.warn(`Error stopping ${track.kind} track:`, e);
      }
    }
  } else {
    console.debug('🍎 Safari: Partial cleanup - keeping tracks live for reconnect');
  }
}

/**
 * Chrome/Firefox cleanup: Remove tracks from PC, optionally stop them
 * @param stopTracks - If false, only removes from PC but keeps tracks live (for reconnect)
 */
function cleanupTracksStandard(
  pc: RTCPeerConnection,
  tracksToCleanup: TrackCleanupItem[],
  stopTracks = true
): void {
  for (const { sender, track } of tracksToCleanup) {
    try {
      if (stopTracks) {
        track.stop();
        track.enabled = false;
      }
      pc.removeTrack(sender);
      console.debug(
        stopTracks
          ? `✅ Stopped and removed ${track.kind} track`
          : `✅ Removed ${track.kind} track from PC (kept live for reconnect)`
      );
    } catch (e) {
      console.warn(`Error cleaning ${track.kind} track:`, e);
    }
  }
}

/**
 * Clean up PeerConnection and its tracks
 * CRITICAL: Safari requires removeTrack() BEFORE track.stop() to release camera indicator
 * IMPORTANT: This function MUST be called BEFORE StreamManager.destroyAllStreams()
 * @param stopTracks - If false, only removes tracks from PC but keeps them live (for reconnect)
 */
async function cleanupPeerConnection(refs: VideoCallSharedRefs, stopTracks = true): Promise<void> {
  if (!refs.peerRef.current) {
    console.debug('🧹 cleanupPeerConnection: No PeerConnection to clean up');
    return;
  }

  const pc = refs.peerRef.current;
  const isSafariBrowser = isSafari();

  try {
    // Collect all tracks BEFORE any removal (sender.track becomes null after removeTrack in Safari)
    const tracksToCleanup: TrackCleanupItem[] = pc
      .getSenders()
      .filter((s): s is RTCRtpSender & { track: MediaStreamTrack } => s.track !== null)
      .map((sender) => ({ sender, track: sender.track }));

    console.debug(
      `🧹 Cleanup: Processing ${tracksToCleanup.length} active tracks (Safari: ${isSafariBrowser}, stopTracks: ${stopTracks})`
    );

    // Browser-specific cleanup
    if (isSafariBrowser) {
      await cleanupTracksSafari(pc, tracksToCleanup, stopTracks);
    } else {
      cleanupTracksStandard(pc, tracksToCleanup, stopTracks);
    }

    // Clear event handlers
    pc.onicecandidate = null;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.oniceconnectionstatechange = null;

    // Small delay before closing
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
    // FIX: Sync to shared context ref for use in callbacks like ensurePeerConnection
    // Without this, refs.localStreamRef.current is null when creating new PC on rejoin
    setRefValue(refs.localStreamRef, localStream);
  }, [localStream, refs]);

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

        // Pre-initialize workers for ALL browsers (Chrome + Safari)
        // This prevents frame drops when ontrack fires before workers are ready
        console.debug(
          '🔧 E2EE: Pre-initializing workers for',
          refs.streamsHandlerRef.current.getE2EEMethod()
        );
        refs.streamsHandlerRef.current.initializeWorkers().catch((e: unknown) => {
          console.error('⚠️ E2EE worker early init failed:', e);
        });
      }

      const pc = new RTCPeerConnection(getWebRTCConfiguration());

      // Set PC reference for E2EE keyframe requests (Chrome workaround)
      refs.streamsHandlerRef.current.setPeerConnection(pc);

      pc.ontrack = (event) => {
        console.debug('🎥 ONTRACK EVENT:', {
          streams: event.streams.length,
          track: event.track.kind,
          trackId: event.track.id,
        });

        // Handle E2EE for different browser implementations
        handleChromeEncodedStreams(refs, event.receiver);
        // Safari: Fire and forget - the async function waits for workers internally
        void handleSafariScriptTransform(refs, event.receiver);

        // Set remote stream after encoded streams prepared
        if (event.streams.length > 0) {
          const stream = event.streams[0];
          // Get peer userId from config for UserLeft cleanup support
          const currentUser = refs.userRef.current;
          const remotePeerId =
            config.initiatorUserId === currentUser?.id
              ? config.participantUserId
              : config.initiatorUserId;
          // registerRemoteStream handles both context state and Redux dispatch via StreamManager events
          registerRemoteStream(stream, remotePeerId);
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
    // eslint-disable-next-line sonarjs/cognitive-complexity
    (config: VideoCallConfig): RTCPeerConnection => {
      const existingPc = refs.peerRef.current;

      // CRITICAL FIX: Initialize E2EE handlers if missing, even for existing PC
      // This is needed for Safari (responder) after UserLeft cleanup
      if (!refs.streamsHandlerRef.current) {
        console.debug('🔒 ensurePeerConnection: Initializing E2EE handlers...');
        refs.e2eeManagerRef.current ??= new E2EEManager();
        refs.streamsHandlerRef.current = new InsertableStreamsHandler(refs.e2eeManagerRef.current);
        // Initialize workers asynchronously - they'll be ready by the time key exchange completes
        void refs.streamsHandlerRef.current.initializeWorkers();
      }

      if (existingPc) {
        // REJOIN FIX: A disconnected PC is NOT usable for new offers!
        // When the peer leaves and rejoins, they send a new offer.
        // We need a fresh PC to handle it - the old one has stale remote description.
        const isUsable =
          existingPc.signalingState !== 'closed' &&
          existingPc.connectionState !== 'closed' &&
          existingPc.connectionState !== 'failed' &&
          existingPc.connectionState !== 'disconnected';

        if (isUsable) {
          return existingPc;
        }

        // Clean up the unusable PC before creating a new one
        console.debug(
          '🔄 ensurePeerConnection: Replacing unusable PC (state:',
          existingPc.connectionState,
          ')'
        );
        try {
          existingPc.close();
        } catch {
          // Ignore close errors
        }
      }

      const pc = createPeerConnection(config);
      refs.peerRef.current = pc;

      // Add existing tracks - use ref instead of stale closure!
      let streamToUse = refs.localStreamRef.current;

      // FIX: Fallback to StreamManager if refs.localStreamRef is null (happens on rejoin)
      if (!streamToUse) {
        console.warn(
          '⚠️ ensurePeerConnection: refs.localStreamRef is null, trying StreamManager...'
        );
        const streamManager = StreamManager.getInstance();
        const existingStream = streamManager.getCameraStream();

        if (existingStream != null) {
          const hasLiveTracks = existingStream.getTracks().some((t) => t.readyState !== 'ended');
          if (hasLiveTracks) {
            console.debug('✅ ensurePeerConnection: Got stream from StreamManager');

            setRefValue(refs.localStreamRef, existingStream);
            streamToUse = existingStream;
          }
        }
        if (!streamToUse) {
          console.error('❌ ensurePeerConnection: No usable stream available!');
        }
      }

      if (streamToUse) {
        const capturedStream = streamToUse; // Capture for closure (avoid shadowing localStream)
        capturedStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState !== 'ended') {
            try {
              const sender = pc.addTrack(track, capturedStream);
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
    [createPeerConnection, refs]
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
    // eslint-disable-next-line sonarjs/cognitive-complexity -- Complex logic required for WebRTC offer creation with rejoin support
    async (config: VideoCallConfig, targetUserId: string) => {
      if (!targetUserId || !config.roomId) return;

      // Deduplication: Skip if offer already sent for this peer
      if (refs.offerSentForPeerRef.current.has(targetUserId)) {
        console.debug('⏭️ Skipping duplicate offer for', targetUserId, '- already sent');
        return;
      }

      // CRITICAL: Mark as sent IMMEDIATELY to prevent race conditions!
      // If two UserJoined events fire simultaneously, both would pass the check above
      // before either adds to the Set. By adding here, the second call will be blocked.
      refs.offerSentForPeerRef.current.add(targetUserId);
      console.debug('🔒 Reserved offer slot for', targetUserId);

      try {
        const pc = ensurePeerConnection(config);

        // REJOIN FIX: Check if PC has senders WITH tracks (not just any senders)
        const sendersWithTracks = pc
          .getSenders()
          .filter((s) => s.track && s.track.readyState !== 'ended');

        if (sendersWithTracks.length === 0) {
          console.debug('⚠️ No senders with live tracks - attempting to add tracks...');

          // Use ref instead of stale closure
          let currentLocalStream = refs.localStreamRef.current;

          // Check if we have live tracks
          const liveTracks =
            currentLocalStream?.getTracks().filter((t) => t.readyState !== 'ended') ?? [];

          if (liveTracks.length === 0) {
            // All tracks ended or no stream - get fresh stream from StreamManager
            console.debug('📹 createOfferForTarget: All tracks ended, getting fresh stream...');
            const streamManager = StreamManager.getInstance();
            // Try existing stream first, then create new one
            let freshStream = streamManager.getCameraStream();

            if (
              freshStream == null ||
              freshStream.getTracks().every((t) => t.readyState === 'ended')
            ) {
              freshStream = await streamManager.createCameraStream({ audio: true, video: true });
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- freshStream can be null/undefined
            if (freshStream) {
              // eslint-disable-next-line require-atomic-updates -- refs is stable from useRef
              refs.localStreamRef.current = freshStream;
              // eslint-disable-next-line require-atomic-updates -- intentional reassignment after async
              currentLocalStream = freshStream;
              console.debug(
                '✅ Got fresh camera stream with',
                freshStream.getTracks().length,
                'tracks'
              );
            }
          }

          // Add tracks to PC
          if (currentLocalStream) {
            currentLocalStream.getTracks().forEach((track: MediaStreamTrack) => {
              if (track.readyState !== 'ended') {
                const sender = pc.addTrack(track, currentLocalStream);
                console.debug(`✅ Added ${track.kind} track to PC`);

                // Chrome: Prepare encoded streams immediately after addTrack
                if (refs.streamsHandlerRef.current?.getE2EEMethod() === 'encodedStreams') {
                  const kind = track.kind as 'video' | 'audio';
                  refs.streamsHandlerRef.current.prepareEncodedStreamsForSender(sender, kind);
                }
              }
            });
          }
        }

        const offer = await pc.createOffer();

        if (!offer.sdp || (!offer.sdp.includes('m=audio') && !offer.sdp.includes('m=video'))) {
          console.error('CRITICAL: Offer SDP contains no media!');
          // Log diagnostic info
          console.error(
            'Diagnostic: senders=',
            pc.getSenders().length,
            'localStream=',
            refs.localStreamRef.current?.getTracks().length
          );
          return;
        }

        await pc.setLocalDescription(offer);

        const connection = refs.signalRConnectionRef.current;
        if (connection?.state === HubConnectionState.Connected) {
          await connection.invoke('SendOffer', config.roomId, targetUserId, offer.sdp);
          console.debug('📤 Sent offer to', targetUserId);
        } else {
          // Connection not ready - remove reservation so we can retry later
          refs.offerSentForPeerRef.current.delete(targetUserId);
          console.warn('⚠️ SignalR not connected, releasing offer slot for', targetUserId);
        }
      } catch (err) {
        console.error('createOffer failed:', err);
        refs.offerSentForPeerRef.current.delete(targetUserId);
      }
    },

    [ensurePeerConnection, refs]
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

      // CRITICAL FIX: PeerConnection cleanup MUST run FIRST for Safari!
      // Safari requires pc.removeTrack(sender) while tracks still exist
      // If StreamManager runs first, sender.track will be null and removeTrack won't work
      // NOTE: For partial cleanup (reconnect), we DON'T stop tracks - just remove from PC
      console.debug('🍎 Safari Fix: Running PeerConnection cleanup BEFORE StreamManager...');
      await cleanupPeerConnection(refs, fullCleanup);

      // THEN use StreamManager to clean up streams
      // StreamManager handles both Safari and Chrome track cleanup
      try {
        const streamManager = StreamManager.getInstance();
        if (fullCleanup) {
          // Full cleanup: destroy ALL streams (local + remote)
          console.debug('🎥 Full cleanup: Destroying all streams...');
          streamManager.destroyAllStreams();
        } else {
          // Partial cleanup: Only destroy REMOTE streams, keep local for reconnect
          // This prevents "Offer SDP contains no media!" error on reconnect
          console.debug('🎥 Partial cleanup: Destroying only remote streams (keeping local)...');

          const remoteStreamIds: string[] = streamManager.getStreamsByType('remote');

          remoteStreamIds.forEach((streamId: string) => {
            streamManager.destroyStream(streamId);
          });
        }
      } catch (e) {
        console.warn('StreamManager cleanup error:', e);
      }

      // Fallback: Also stop local stream tracks directly in case StreamManager missed any
      // ONLY for full cleanup - partial cleanup keeps local stream for reconnect
      if (fullCleanup) {
        const currentLocalStream = localStreamRef.current;
        if (currentLocalStream) {
          console.debug('🎥 Fallback: Stopping remaining local stream tracks...');
          currentLocalStream.getTracks().forEach((track) => {
            try {
              if (track.readyState === 'live') {
                track.stop();
                track.enabled = false;
                console.debug(`✅ Fallback stopped local ${track.kind} track`);
              }
            } catch (e) {
              console.warn(`Error stopping local ${track.kind} track:`, e);
            }
          });
        }
      }

      // SignalR cleanup - IMPORTANT: Remove handlers BEFORE stop() to prevent memory leaks
      const connection = refs.signalRConnectionRef.current;
      if (connection) {
        try {
          // Remove ALL event handlers before stopping
          const signalREvents = [
            'UserJoined',
            'UserLeft',
            'RoomJoined',
            'HeartbeatAck',
            'ReceiveOffer',
            'ReceiveAnswer',
            'ReceiveIceCandidate',
            'ChatMessage',
            'MediaStateChanged',
          ];

          console.debug('🔌 SignalR: Removing event handlers before stop...');
          signalREvents.forEach((event) => {
            try {
              connection.off(event);
            } catch {
              // Ignore removal errors
            }
          });

          // Now stop the connection
          await connection.stop();
          console.debug('✅ SignalR: Connection stopped cleanly');
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
      // Guard against race condition: don't setup if component unmounted
      if (!refs.isMountedRef.current) {
        console.debug('🔌 SignalR setup skipped - component unmounted');
        return;
      }

      const token = getToken();

      if (!token) {
        dispatch(setError('Authentication error'));
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

      // Track processed UserJoined events to prevent duplicate processing
      const processedUserJoined = new Set<string>();

      // UserJoined - Handles both initial join and rejoin after UserLeft
      connection.on('UserJoined', async (data: { userId: string }) => {
        const joinedUserId = data.userId;
        const currentUser = refs.userRef.current;

        if (!joinedUserId || joinedUserId === currentUser?.id) return;

        // Deduplication: Prevent processing same UserJoined multiple times
        // Server may send duplicate events, and we must only process once
        // NOTE: UserLeft handler removes user from this set, enabling rejoin
        if (processedUserJoined.has(joinedUserId)) {
          console.debug('⏭️ Skipping duplicate UserJoined for', joinedUserId);
          return;
        }
        processedUserJoined.add(joinedUserId);

        console.debug('👥 UserJoined:', joinedUserId);

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
            if (keyExchangeState === 'idle' || keyExchangeState === 'error') {
              console.debug(
                `🔐 E2EE: Peer joined! Starting key exchange (was ${keyExchangeState})...`
              );
              void refs.keyExchangeManagerRef.current.retriggerKeyExchange();
            } else {
              console.debug(
                `🔐 E2EE: Peer joined but already in state '${keyExchangeState}', skipping`
              );
            }
          }
        } else {
          console.debug('⏳ I am NOT initiator, waiting for offer from:', config.initiatorUserId);
        }
      });

      // UserLeft - Complete cleanup for potential rejoin
      connection.on('UserLeft', (data: { userId: string }) => {
        const leftUserId = data.userId;
        console.debug('👋 UserLeft:', leftUserId);

        // 1. Remove from participants list
        dispatch(removeParticipant(leftUserId));

        // 2. Clear remote stream via StreamManager
        // StreamManager emits 'streamDestroyed' → StreamContext updates React state
        const streamManager = StreamManager.getInstance();
        const remoteStreamId = streamManager.getStreamIdByPeerId(leftUserId);
        if (remoteStreamId) {
          console.debug('🧹 UserLeft: Destroying remote stream', remoteStreamId);
          streamManager.destroyStream(remoteStreamId);
        }

        // 2b. CRITICAL FIX: Close PeerConnection so rejoin creates fresh one
        // createEncodedStreams() can only be called ONCE per sender/receiver!
        // If we keep the PC but clean InsertableStreamsHandler, encoded streams cannot be recreated.
        if (refs.peerRef.current) {
          console.debug('🧹 UserLeft: Closing PeerConnection for clean rejoin');
          try {
            refs.peerRef.current.close();
          } catch (e) {
            console.warn('UserLeft: Error closing PC:', e);
          }
          refs.peerRef.current = null;
        }

        // 3. E2EE cleanup - reset for potential rejoin
        if (refs.keyExchangeManagerRef.current) {
          console.debug('🧹 UserLeft: Cleaning up KeyExchangeManager');
          refs.keyExchangeManagerRef.current.cleanup();
          refs.keyExchangeManagerRef.current = null;
        }
        if (refs.streamsHandlerRef.current) {
          console.debug('🧹 UserLeft: Cleaning up InsertableStreamsHandler');
          refs.streamsHandlerRef.current.cleanup();
          refs.streamsHandlerRef.current = null;
        }
        if (refs.e2eeManagerRef.current) {
          console.debug('🧹 UserLeft: Cleaning up E2EEManager (resets generation counter)');
          refs.e2eeManagerRef.current.cleanup();
          refs.e2eeManagerRef.current = null;
        }
        refs.e2eeTransformsAppliedRef.current = false;
        refs.lastWorkerKeyGenerationRef.current = 0;
        refs.pendingChatE2EEKeyRef.current = null;

        // 4. Reset E2EE Redux state
        dispatch(resetE2EE());

        // 5. Clear offer deduplication for this peer (allow new offer on rejoin)
        refs.offerSentForPeerRef.current.delete(leftUserId);

        // 6. Clear processedUserJoined to allow rejoin
        processedUserJoined.delete(leftUserId);

        console.debug('✅ UserLeft: Cleanup complete for', leftUserId);
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

              // REJOIN FIX: Add to processedUserJoined to prevent duplicate processing
              // when UserJoined event fires immediately after RoomJoined
              processedUserJoined.add(participantUserId);

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
        // eslint-disable-next-line require-atomic-updates -- refs is stable context reference
        refs.signalRConnectionRef.current = connection;
        dispatch(setConnected(true));

        if (config.roomId) {
          await connection.invoke('JoinRoom', config.roomId);
          console.debug('✅ Joined room:', config.roomId);
        }

        // Start heartbeat
        // eslint-disable-next-line require-atomic-updates -- refs is stable context reference
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
        dispatch(setError('SignalR connection failed'));
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
        dispatch(setError(err instanceof Error ? err.message : 'Connection setup failed'));
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
            throw new Error('Could not load call configuration');
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
          dispatch(setError(err instanceof Error ? err.message : 'Error starting call'));
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
  // IMPORTANT: Empty dependency array! Only cleanup on actual unmount.
  // cleanupResourcesRef.current is used instead of cleanupResources directly,
  // so this effect won't re-trigger on callback changes.
  useEffect(() => {
    refs.isMountedRef.current = true;

    return () => {
      console.debug('🔄 useVideoCallCore unmounting');
      refs.isMountedRef.current = false;
      // Use ref to get current cleanupResources without dependency
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ref.current can be null at unmount
      if (cleanupResourcesRef.current != null) {
        void cleanupResourcesRef.current(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount/unmount
  }, []);

  // ===== SAFARI EMERGENCY CLEANUP =====
  useEffect(() => {
    // Use centralized browser detection (cached)
    const isSafariBrowser = isSafari();

    const handleBeforeUnload = (): void => {
      console.debug(`🚨 beforeunload: Emergency camera cleanup (Safari: ${isSafariBrowser})`);

      const pc = refs.peerRef.current;
      if (pc) {
        try {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            // Destructure track from sender for ESLint prefer-destructuring
            const { track } = sender;
            if (track) {
              try {
                // CRITICAL: Safari requires removeTrack BEFORE stop() for camera indicator release
                if (isSafariBrowser) {
                  pc.removeTrack(sender);
                  console.debug(`🍎 Safari beforeunload: Removed ${track.kind} track from PC`);
                }
                // Use saved reference, NOT sender.track (which is now null!)
                track.stop();
                track.enabled = false;
              } catch {
                /* ignore individual track errors */
              }
            }
          });
        } catch {
          /* ignore */
        }
      }

      const currentLocalStream = localStreamRef.current;
      if (currentLocalStream) {
        const tracks = currentLocalStream.getTracks();

        // Safari: Remove tracks from stream BEFORE stopping
        if (isSafariBrowser) {
          tracks.forEach((track) => {
            try {
              currentLocalStream.removeTrack(track);
            } catch {
              /* ignore */
            }
          });
        }

        // Now stop all tracks
        tracks.forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {
            /* ignore */
          }
        });
      }

      // StreamManager handles Safari-specific cleanup internally
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
