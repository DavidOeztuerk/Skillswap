import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  type HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import {
  initializeCall,
  resetCall,
  toggleMic,
  toggleVideo,
  toggleScreenShare,
  toggleChat,
  addMessage,
  setLocalStreamId,
  setRemoteStreamId,
  setConnected,
  setLoading,
  setError,
  clearError,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setE2EEStatus,
  setE2EELocalFingerprint,
  setE2EERemoteFingerprint,
  setE2EEKeyGeneration,
  setE2EEErrorMessage,
  setE2EEEncryptionStats,
  setChatE2EEStatus,
  setChatE2EELocalFingerprint,
  incrementChatMessagesEncrypted,
  incrementChatMessagesDecrypted,
  incrementChatVerificationFailures,
} from '../features/videocall/videoCallSlice';
import { joinVideoCall, leaveVideoCall } from '../features/videocall/videocallThunks';
import { selectAuthUser } from '../store/selectors/authSelectors';
import type { VideoCallConfig } from '../types/models/VideoCallConfig';
import type { ChatMessage } from '../types/models/ChatMessage';
import type { EncryptionStats } from '../store/adapters/videoCallAdapter+State';
import videoCallService from '../api/services/videoCallService';
import StreamManager from '../services/StreamManager';
import { type ApiResponse, isSuccessResponse } from '../types/api/UnifiedResponse';
import { withDefault } from '../utils/safeAccess';
import { getToken } from '../utils/authHelpers';
import {
  selectSessionId,
  selectRoomId,
  selectIsConnected,
  selectPeerId,
  selectIsMicEnabled,
  selectIsVideoEnabled,
  selectIsScreenSharing,
  selectIsChatOpen,
  selectChatMessages,
  selectCallDuration,
  selectParticipants,
  selectVideocallLoading,
  selectVideocallError,
  selectE2EEStatus,
  selectE2EELocalFingerprint,
  selectE2EERemoteFingerprint,
  selectE2EEKeyGeneration,
  selectE2EEEncryptionStats,
  selectE2EEErrorMessage,
  selectChatE2EEStatus,
  selectIsChatE2EEActive,
  selectChatE2EEStats,
} from '../store/selectors/videoCallSelectors';
import { getWebRTCConfiguration } from '../utils/webrtcConfig';
import { E2EEManager, getE2EECompatibility } from '../utils/crypto/e2eeVideoEncryption';
import { InsertableStreamsHandler } from '../utils/crypto/insertableStreamsHandler';
import { E2EEKeyExchangeManager, type KeyExchangeEvents } from '../utils/crypto/e2eeKeyExchange';
import { E2EEChatManager, type EncryptedMessage } from '../utils/crypto/e2eeChatEncryption';
import { getE2EESupport } from '../utils/crypto/e2eeBrowserSupport';
import { useStreams } from '@/contexts/streamContextHooks';

// ============================================================================
// Constants
// ============================================================================

const MAX_ICE_BUFFER_SIZE = 50;
const RECONNECT_DELAYS = [0, 1000, 5000, 10000, 30000];
const HEARTBEAT_INTERVAL = 30000;
const E2EE_INIT_DELAY = 1500;
const STATS_UPDATE_INTERVAL = 5000;
const CONNECTION_TIMEOUT = 5000;

// ============================================================================
// Hook
// ============================================================================

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Return type is complex and inferred correctly
export const useVideoCall = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);

  const { localStream, remoteStream, setLocalStream, setRemoteStream, cleanup } = useStreams();

  // ===== SELECTORS =====
  const sessionId = useAppSelector(selectSessionId);
  const roomId = useAppSelector(selectRoomId);
  const isConnected = useAppSelector(selectIsConnected);
  const peerId = useAppSelector(selectPeerId);
  const isMicEnabled = useAppSelector(selectIsMicEnabled);
  const isVideoEnabled = useAppSelector(selectIsVideoEnabled);
  const isScreenSharing = useAppSelector(selectIsScreenSharing);
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const messages = useAppSelector(selectChatMessages);
  const callDuration = useAppSelector(selectCallDuration);
  const participants = useAppSelector(selectParticipants);
  const isLoading = useAppSelector(selectVideocallLoading);
  const error = useAppSelector(selectVideocallError);

  // E2EE Selectors
  const e2eeStatus = useAppSelector(selectE2EEStatus);
  const localKeyFingerprint = useAppSelector(selectE2EELocalFingerprint);
  const remotePeerFingerprint = useAppSelector(selectE2EERemoteFingerprint);
  const keyGeneration = useAppSelector(selectE2EEKeyGeneration);
  const e2eeErrorMessage = useAppSelector(selectE2EEErrorMessage);
  const encryptionStats = useAppSelector(selectE2EEEncryptionStats);
  const chatE2EEStatus = useAppSelector(selectChatE2EEStatus);
  const chatStats = useAppSelector(selectChatE2EEStats);
  const isChatE2EEActive = useAppSelector(selectIsChatE2EEActive);

  // ===== REFS =====
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const signalRConnectionRef = useRef<HubConnection | null>(null);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKeyRotationRef = useRef<string | null>(null);

  const roomIdRef = useRef(roomId);
  const sessionIdRef = useRef(sessionId);
  const peerIdRef = useRef(peerId);
  const isConnectedRef = useRef(isConnected);
  const isMicEnabledRef = useRef(isMicEnabled);
  const isVideoEnabledRef = useRef(isVideoEnabled);
  const isScreenSharingRef = useRef(isScreenSharing);
  const chatE2EEStatusRef = useRef(chatE2EEStatus);
  const userRef = useRef(user);

  // E2EE Refs
  const e2eeManagerRef = useRef<E2EEManager | null>(null);
  const streamsHandlerRef = useRef<InsertableStreamsHandler | null>(null);
  const keyExchangeManagerRef = useRef<E2EEKeyExchangeManager | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatManagerRef = useRef<E2EEChatManager>(new E2EEChatManager());
  const localSigningKeyRef = useRef<CryptoKey | null>(null);
  const localVerificationKeyRef = useRef<CryptoKey | null>(null);
  const configRef = useRef<VideoCallConfig | null>(null);

  // NEU: Flag ob E2EE Transform Pipelines bereits auf die Senders angewendet wurden
  const e2eeTransformsAppliedRef = useRef(false);

  // NEU: Track ob bereits ein SDP-Offer für einen Peer gesendet wurde
  // Verhindert doppelte Offers (von UserJoined UND RoomJoined gleichzeitig)
  const offerSentForPeerRef = useRef<Set<string>>(new Set());

  const compatibility = getE2EECompatibility();

  // Function refs to break circular dependencies
  const cleanupResourcesRef = useRef<(isFullCleanup?: boolean) => Promise<void>>(async () => {});
  const setupSignalRRef = useRef<(config: VideoCallConfig) => Promise<void>>(async () => {});
  const applyE2EEToMediaTracksRef = useRef<() => void>(() => {});
  const initializeChatE2EERef = useRef<
    (
      sharedEncryptionKey: CryptoKey | undefined,
      peerSigningPublicKey?: string,
      peerSigningFingerprint?: string
    ) => Promise<void>
  >(async () => {});

  // ===== SYNC REFS WITH STATE =====
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);
  useEffect(() => {
    peerIdRef.current = peerId;
  }, [peerId]);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);
  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);
  useEffect(() => {
    isVideoEnabledRef.current = isVideoEnabled;
  }, [isVideoEnabled]);
  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);
  useEffect(() => {
    chatE2EEStatusRef.current = chatE2EEStatus;
  }, [chatE2EEStatus]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ===== PEER CONNECTION MANAGEMENT =====
  const createPeerConnection = useCallback(
    (config: VideoCallConfig): RTCPeerConnection => {
      console.debug('🔧 Creating new RTCPeerConnection');

      // NEU: E2EE Manager und StreamsHandler FRÜH initialisieren (vor addTrack!)
      // Für Chrome müssen wir createEncodedStreams VOR createOffer aufrufen
      e2eeManagerRef.current ??= new E2EEManager();
      if (!streamsHandlerRef.current) {
        streamsHandlerRef.current = new InsertableStreamsHandler(e2eeManagerRef.current);
        console.debug(
          '🔒 E2EE: StreamsHandler early initialized, method:',
          streamsHandlerRef.current.getE2EEMethod()
        );

        // KRITISCH FÜR SAFARI: Workers früh initialisieren damit Transforms in ontrack angewendet werden können!
        // Safari's RTCRtpScriptTransform braucht einen initialisierten Worker.
        // Für Chrome/Firefox ist das nicht notwendig da deren Transforms anders funktionieren.
        if (streamsHandlerRef.current.getE2EEMethod() === 'scriptTransform') {
          console.debug('🍎 Safari: Pre-initializing E2EE workers for early transform application');
          streamsHandlerRef.current.initializeWorkers().catch((e: unknown) => {
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

        // KRITISCH: Für Chrome - Receiver Encoded Streams ZUERST erstellen!
        // MUSS vor setRemoteStream passieren, sonst ist der Track bereits "aktiv"
        // und createEncodedStreams schlägt mit "Too late" fehl!
        // ABER: Nur wenn Transforms noch NICHT angewendet wurden!
        // Nach applyTransformPipelines werden Streams direkt in applyDecryptionChrome erstellt.
        if (
          streamsHandlerRef.current !== null &&
          streamsHandlerRef.current.getE2EEMethod() === 'encodedStreams'
        ) {
          const { receiver } = event;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
          if (receiver.track !== null) {
            const kind = receiver.track.kind as 'video' | 'audio';

            // Wenn Transforms bereits angewendet wurden, wurden Streams schon in
            // applyDecryptionChrome erstellt - kein erneutes Prepare nötig
            if (e2eeTransformsAppliedRef.current) {
              console.debug(
                `🔒 E2EE: Skipping early prepare for ${kind} - transforms already applied`
              );
            } else {
              console.debug(
                `🔒 E2EE: Preparing receiver streams BEFORE stream activation for ${kind}`
              );
              streamsHandlerRef.current.prepareEncodedStreamsForReceiver(receiver, kind);
            }
          }
        }

        // KRITISCH FÜR SAFARI: Decryption Transform SOFORT anwenden!
        // Safari's RTCRtpScriptTransform muss FRÜH angewendet werden, sonst verpassen wir die ersten Frames.
        // Der Transform startet im Passthrough-Modus (kein Key), bis der Key Exchange abgeschlossen ist.
        // Dann werden Frames automatisch entschlüsselt.
        if (
          streamsHandlerRef.current !== null &&
          streamsHandlerRef.current.getE2EEMethod() === 'scriptTransform'
        ) {
          const { receiver } = event;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
          if (receiver.track !== null && streamsHandlerRef.current.areWorkersInitialized()) {
            const kind = receiver.track.kind as 'video' | 'audio';
            console.debug(
              `🍎 Safari: Applying decryption transform IMMEDIATELY in ontrack for ${kind}`
            );
            try {
              streamsHandlerRef.current.applyDecryptionToReceiver(receiver, kind);
              console.debug(`✅ Safari: Early decryption transform applied for ${kind}`);
            } catch (e) {
              console.warn(`🍎 Safari: Failed to apply early decryption transform for ${kind}:`, e);
            }
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
          } else if (receiver.track !== null) {
            console.debug(
              `⏳ Safari: Workers not ready yet, transform will be applied later for ${receiver.track.kind}`
            );
          }
        }

        // NACH dem Prepared der Encoded Streams können wir den Stream setzen
        if (event.streams.length > 0) {
          const stream = event.streams[0];
          setRemoteStream(stream);
          dispatch(setRemoteStreamId(stream.id));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.debug('🧊 ICE Candidate found');
          const connection = signalRConnectionRef.current;
          const currentRoomId = roomIdRef.current;
          const currentUser = userRef.current;

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- config can be undefined at runtime
          if (connection !== null && currentRoomId !== '' && config !== undefined) {
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

        if (!isMountedRef.current) return;

        if (state === 'connected') {
          dispatch(setConnected(true));
        } else if (state === 'disconnected' || state === 'failed') {
          console.warn(`🔄 PeerConnection ${state}`);
          dispatch(setConnected(false));

          // Delayed cleanup
          setTimeout(() => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
              if (isMountedRef.current) {
                void cleanupResourcesRef.current(false); // Fire-and-forget async cleanup
              }
            }
          }, CONNECTION_TIMEOUT);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.debug('❄️ ICE Connection State:', pc.iceConnectionState);
      };

      return pc;
    },
    [dispatch, setRemoteStream]
  );

  const ensurePeerConnection = useCallback(
    (config: VideoCallConfig): RTCPeerConnection => {
      const existingPc = peerRef.current;

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
      peerRef.current = pc;

      // Add existing tracks
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState !== 'ended') {
            try {
              const sender = pc.addTrack(track, localStream);
              console.debug(`✅ Added ${track.kind} track to PC`);

              // NEU: Für Chrome - Encoded Streams SOFORT nach addTrack erstellen!
              if (streamsHandlerRef.current?.getE2EEMethod() === 'encodedStreams') {
                const kind = track.kind as 'video' | 'audio';
                streamsHandlerRef.current.prepareEncodedStreamsForSender(sender, kind);
              }
            } catch (e) {
              console.error(`Failed to add ${track.kind} track:`, e);
            }
          }
        });
      }

      return pc;
    },
    [createPeerConnection, localStream]
  );

  // ===== SIGNALING HANDLERS =====
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerRef.current;
    if (!pc) return;

    if (pc.remoteDescription?.type === 'answer') {
      console.warn('Already have answer, ignoring');
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Process buffered candidates
      while (iceCandidatesBuffer.current.length > 0) {
        const candidate = iceCandidatesBuffer.current.shift();
        if (candidate) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (e) {
            console.warn('Failed to add buffered ICE candidate:', e);
          }
        }
      }
    } catch (answerError) {
      console.error('Error handling answer:', answerError);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerRef.current;

    if (!pc?.remoteDescription) {
      if (iceCandidatesBuffer.current.length < MAX_ICE_BUFFER_SIZE) {
        iceCandidatesBuffer.current.push(candidate);
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
  }, []);

  const createOfferForTarget = useCallback(
    async (config: VideoCallConfig, targetUserId: string) => {
      if (!targetUserId || !config.roomId) return;

      // DEDUPLIZIERUNG: Prüfe ob bereits ein Offer für diesen Peer gesendet wurde
      // Dies verhindert doppelte Offers wenn UserJoined und RoomJoined gleichzeitig feuern
      if (offerSentForPeerRef.current.has(targetUserId)) {
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

              // NEU: Für Chrome - Encoded Streams SOFORT nach addTrack erstellen!
              if (streamsHandlerRef.current?.getE2EEMethod() === 'encodedStreams') {
                const kind = track.kind as 'video' | 'audio';
                streamsHandlerRef.current.prepareEncodedStreamsForSender(sender, kind);
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

        const connection = signalRConnectionRef.current;
        if (connection?.state === HubConnectionState.Connected) {
          // Markiere diesen Peer als "Offer gesendet" BEVOR wir senden
          offerSentForPeerRef.current.add(targetUserId);

          await connection.invoke('SendOffer', config.roomId, targetUserId, offer.sdp);
          console.debug('📤 Sent offer to', targetUserId);
        }
      } catch (err) {
        console.error('createOffer failed:', err);
        // Bei Fehler entfernen, damit ein Retry möglich ist
        offerSentForPeerRef.current.delete(targetUserId);
      }
    },
    [ensurePeerConnection, localStream]
  );

  // ===== CLEANUP =====
  const cleanupResources = useCallback(
    async (isFullCleanup = false) => {
      console.debug('🧹 Cleaning up resources...', { isFullCleanup });

      // WICHTIG: Stoppe Key Rotation und E2EE ZUERST
      // Dies verhindert dass verschlüsselte Frames nach Cleanup gesendet werden
      e2eeManagerRef.current?.stopKeyRotation();

      // Disable encryption in workers SOFORT
      // Dadurch werden alle pending Frames im Passthrough-Modus verarbeitet
      streamsHandlerRef.current?.disableEncryption();

      // Clear timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }

      // E2EE cleanup - unregisters SignalR handlers for key exchange
      // This prevents "No client method with name 'receivekeyoffer' found" warnings
      keyExchangeManagerRef.current?.cleanup();
      e2eeManagerRef.current?.cleanup();
      streamsHandlerRef.current?.cleanup();
      e2eeTransformsAppliedRef.current = false;

      // Small delay to allow pending SignalR messages to be processed
      await new Promise((resolve) => setTimeout(resolve, 50));

      // SAFARI FIX: LocalStream Tracks stoppen wenn ein Call aktiv war
      // WICHTIG: Nur wenn peerRef.current existiert (also ein Call initialisiert wurde)!
      // Sonst werden Tracks während React Strict Mode mount/unmount Cycle gestoppt.
      if (localStream && peerRef.current) {
        console.debug('🎥 Stopping local stream tracks for camera release...');
        localStream.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
            console.debug(`✅ Stopped local ${track.kind} track`);
          } catch (e) {
            console.warn(`Error stopping local ${track.kind} track:`, e);
          }
        });
      }

      // PeerConnection cleanup - KRITISCH FÜR SAFARI CAMERA RELEASE!
      // Safari gibt die Kamera nur frei wenn:
      // 1. Tracks von Sendern entfernt werden
      // 2. Tracks gestoppt werden
      // 3. PeerConnection geschlossen wird (in dieser Reihenfolge!)
      if (peerRef.current) {
        const pc = peerRef.current;
        try {
          // SAFARI FIX: Zuerst alle Tracks von Sendern entfernen!
          // Dies ist KRITISCH damit Safari die Kamera freigibt.
          const senders = pc.getSenders();
          console.debug(`🧹 Cleanup: Removing ${String(senders.length)} tracks from senders`);
          for (const sender of senders) {
            if (sender.track) {
              try {
                // Track stoppen BEVOR wir ihn entfernen
                sender.track.stop();
                sender.track.enabled = false;
                // Track vom Sender entfernen
                pc.removeTrack(sender);
              } catch (e) {
                console.warn('Error removing track from sender:', e);
              }
            }
          }

          // Event Handler entfernen
          pc.onicecandidate = null;
          pc.ontrack = null;
          pc.onconnectionstatechange = null;
          pc.oniceconnectionstatechange = null;

          // Kleine Verzögerung für Safari damit Track-Cleanup abgeschlossen wird
          await new Promise((resolve) => setTimeout(resolve, 50));

          if (pc.signalingState !== 'closed') {
            pc.close();
          }
        } catch (e) {
          console.warn('Error closing PeerConnection:', e);
        }
        peerRef.current = null;
      }

      // SignalR cleanup AFTER E2EE handlers are removed
      if (signalRConnectionRef.current) {
        try {
          await signalRConnectionRef.current.stop();
        } catch {
          // Ignore stop errors
        }
        signalRConnectionRef.current = null;
      }

      // Clear buffers
      iceCandidatesBuffer.current = [];

      // SDP offer tracking zurücksetzen
      offerSentForPeerRef.current.clear();

      const currentRoomId = roomIdRef.current;
      if (currentRoomId) {
        chatManagerRef.current.removeConversation(currentRoomId);
      }

      // Full cleanup - SYNCHRONOUS stream cleanup for Safari camera release!
      if (isFullCleanup) {
        console.debug('🧹 Full cleanup: Stopping all streams via cleanupStreams()');
        // cleanupStreams() now uses StreamManager which handles Safari-specific cleanup
        cleanup();
        dispatch(resetCall());
        isInitializedRef.current = false;
      }
    },
    [dispatch, cleanup, localStream]
  );

  // Sync cleanupResources to ref
  useEffect(() => {
    cleanupResourcesRef.current = cleanupResources;
  }, [cleanupResources]);

  // ===== WEBRTC SETUP =====
  const setupWebRTC = useCallback(
    async (config: VideoCallConfig) => {
      if (isInitializedRef.current) {
        console.debug('Already initialized, skipping');
        return;
      }

      isInitializedRef.current = true;
      configRef.current = config;

      try {
        console.debug('🎥 Requesting media devices...');

        const stream = await navigator.mediaDevices.getUserMedia({
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
        console.debug('📹 useVideoCall: About to call setLocalStream with stream:', stream.id);

        setLocalStream(stream);
        console.debug('📹 useVideoCall: setLocalStream completed, dispatching setLocalStreamId');
        dispatch(setLocalStreamId(stream.id));

        const pc = createPeerConnection(config);
        peerRef.current = pc;

        stream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState !== 'ended') {
            const sender = pc.addTrack(track, stream);
            console.debug(`✅ Added ${track.kind} track`);

            // NEU: Für Chrome - Encoded Streams SOFORT nach addTrack erstellen!
            // KRITISCH: Muss VOR createOffer passieren!
            if (streamsHandlerRef.current?.getE2EEMethod() === 'encodedStreams') {
              const kind = track.kind as 'video' | 'audio';
              streamsHandlerRef.current.prepareEncodedStreamsForSender(sender, kind);
            }
          }
        });

        await setupSignalRRef.current(config);

        console.debug('✅ WebRTC Setup completed');
      } catch (err: unknown) {
        console.error('WebRTC Setup Error:', err);
        isInitializedRef.current = false;
        dispatch(setError(err instanceof Error ? err.message : 'Verbindungsaufbau fehlgeschlagen'));
        await cleanupResources(true);
      }
    },
    [dispatch, setLocalStream, createPeerConnection, cleanupResources]
  );

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
        const currentUser = userRef.current;

        console.debug('👥 UserJoined:', joinedUserId);
        console.debug('👥 UserJoined Debug:', {
          joinedUserId,
          currentUserId: currentUser?.id,
          configInitiatorUserId: config.initiatorUserId,
          configParticipantUserId: config.participantUserId,
          isInitiator: config.initiatorUserId === currentUser?.id,
        });

        if (!joinedUserId || joinedUserId === currentUser?.id) return;

        // Ermittle echten Namen und Avatar basierend auf User-ID
        const participantName =
          joinedUserId === config.initiatorUserId
            ? config.initiatorName
            : joinedUserId === config.participantUserId
              ? config.participantName
              : 'Teilnehmer';

        const participantAvatar =
          joinedUserId === config.initiatorUserId
            ? config.initiatorAvatarUrl
            : joinedUserId === config.participantUserId
              ? config.participantAvatarUrl
              : undefined;

        console.debug('👤 Participant info:', { joinedUserId, participantName, participantAvatar });

        // Add participant to state
        dispatch(
          addParticipant({
            id: joinedUserId,
            name: participantName,
            avatar: participantAvatar ?? undefined,
            audioEnabled: true,
            videoEnabled: true,
          })
        );

        await new Promise((r) => setTimeout(r, 500));

        // Check if current user is the initiator - they should create the offer
        const isInitiator = config.initiatorUserId === currentUser?.id;
        console.debug('🎯 Initiator check:', {
          isInitiator,
          initiatorId: config.initiatorUserId,
          myId: currentUser?.id,
        });

        if (isInitiator) {
          console.debug('📤 I am initiator, creating offer for:', joinedUserId);
          await createOfferForTarget(config, joinedUserId);

          // E2EE Key Exchange: Neu starten wenn Peer jetzt da ist und noch nicht complete
          if (keyExchangeManagerRef.current) {
            const keyExchangeState = keyExchangeManagerRef.current.getState();
            console.debug('🔐 E2EE: UserJoined - Key exchange state:', keyExchangeState);

            if (keyExchangeState !== 'complete') {
              console.debug('🔐 E2EE: Peer joined! Re-triggering key exchange...');
              // Cleanup alter Timeout und neu starten
              void keyExchangeManagerRef.current.retriggerKeyExchange();
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

      // RoomJoined - Handle existing participants in the room
      // Backend returns participant objects with: userId, connectionId, joinedAt, cameraEnabled, etc.
      interface RoomParticipant {
        userId: string;
        connectionId: string;
        joinedAt: string;
        cameraEnabled: boolean;
        microphoneEnabled: boolean;
        screenShareEnabled: boolean;
        isInitiator: boolean;
      }

      connection.on(
        'RoomJoined',
        async (data: { roomId: string; participants: RoomParticipant[] }) => {
          console.debug('🏠 RoomJoined:', data);
          const currentUser = userRef.current;

          // Process existing participants (those who joined before us)
          if (data.participants.length > 0) {
            console.debug('👥 Room has existing participants:', data.participants);

            for (const participant of data.participants) {
              // Extract userId from participant object
              const participantUserId = participant.userId;

              // Skip ourselves
              if (participantUserId === currentUser?.id) continue;

              // Ermittle echten Namen und Avatar basierend auf User-ID
              const existingParticipantName =
                participantUserId === config.initiatorUserId
                  ? config.initiatorName
                  : participantUserId === config.participantUserId
                    ? config.participantName
                    : 'Teilnehmer';

              const existingParticipantAvatar =
                participantUserId === config.initiatorUserId
                  ? config.initiatorAvatarUrl
                  : participantUserId === config.participantUserId
                    ? config.participantAvatarUrl
                    : undefined;

              console.debug('👤 Existing participant info:', {
                participantUserId,
                existingParticipantName,
                existingParticipantAvatar,
                cameraEnabled: participant.cameraEnabled,
                microphoneEnabled: participant.microphoneEnabled,
              });

              // Add participant to state with their actual media state
              dispatch(
                addParticipant({
                  id: participantUserId,
                  name: existingParticipantName,
                  avatar: existingParticipantAvatar ?? undefined,
                  audioEnabled: participant.microphoneEnabled,
                  videoEnabled: participant.cameraEnabled,
                })
              );

              // If we are the initiator and there's already a participant, create offer
              // Verwende createOfferForTarget für konsistente Deduplizierung
              const isInitiator = config.initiatorUserId === currentUser?.id;
              if (isInitiator) {
                console.debug(
                  '📤 Room already has participant, I am initiator - creating offer for:',
                  participantUserId
                );
                await new Promise((r) => setTimeout(r, 500)); // Small delay for stability
                await createOfferForTarget(config, participantUserId);
              }
            }
          }
        }
      );

      // HeartbeatAck - acknowledge heartbeat from server
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

          // Process buffered candidates
          while (iceCandidatesBuffer.current.length > 0) {
            const candidate = iceCandidatesBuffer.current.shift();
            if (candidate) {
              try {
                await pc.addIceCandidate(candidate);
              } catch (e) {
                console.warn('Failed to add buffered candidate:', e);
              }
            }
          }

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
          const currentUser = userRef.current;
          if (data.userId === currentUser?.id) return;

          let messageContent = data.message;
          let isEncrypted = false;
          let isVerified = false;

          // Try to decrypt
          const currentChatE2EEStatus = chatE2EEStatusRef.current;
          const currentRoomId = roomIdRef.current;

          if (currentChatE2EEStatus === 'active' && currentRoomId) {
            try {
              const encryptedData = JSON.parse(data.message) as EncryptedMessage;
              const decrypted = await chatManagerRef.current.decryptMessage(
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
            sessionId: sessionIdRef.current ?? '',
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
        if (isMountedRef.current) {
          dispatch(setConnected(false));
        }

        if (signalRConnectionRef.current === connection) {
          signalRConnectionRef.current = null;
        }

        if (isInitializedRef.current && isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            void setupSignalR(config);
          }, 2000);
        }
      });

      connection.onreconnected(() => {
        console.debug('✅ SignalR reconnected');
        dispatch(setConnected(true));

        // Re-join room after reconnect
        const currentRoomId = roomIdRef.current;
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
        signalRConnectionRef.current = connection;
        dispatch(setConnected(true));

        if (config.roomId) {
          await connection.invoke('JoinRoom', config.roomId);
          console.debug('✅ Joined room:', config.roomId);
        }

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          const currentRoomId = roomIdRef.current;
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
    [dispatch, ensurePeerConnection, createOfferForTarget, handleAnswer, handleIceCandidate]
  );

  // Sync setupSignalR to ref
  useEffect(() => {
    setupSignalRRef.current = setupSignalR;
  }, [setupSignalR]);

  // ===== E2EE FUNCTIONS =====
  const initializeE2EE = useCallback(async () => {
    const currentRoomId = roomIdRef.current;
    const currentUser = userRef.current;
    const config = configRef.current;

    // WICHTIG: Berechne peerId korrekt basierend auf der Rolle des aktuellen Users!
    const currentPeerId =
      config?.initiatorUserId === currentUser?.id
        ? config?.participantUserId
        : config?.initiatorUserId;

    console.debug('🔐 E2EE: Computed peerId:', {
      currentUserId: currentUser?.id,
      initiatorUserId: config?.initiatorUserId,
      participantUserId: config?.participantUserId,
      computedPeerId: currentPeerId,
      reduxPeerId: peerIdRef.current,
    });

    if (!peerRef.current || !signalRConnectionRef.current || !currentRoomId || !currentPeerId) {
      console.warn('E2EE: Missing dependencies', {
        hasPeer: !!peerRef.current,
        hasSignalR: !!signalRConnectionRef.current,
        roomId: currentRoomId,
        peerId: currentPeerId,
      });
      return;
    }

    // Prüfe E2EE Support
    const e2eeSupport = getE2EESupport();

    if (!e2eeSupport.supported) {
      console.debug(`🔒 E2EE: Not supported - ${e2eeSupport.technicalDetails}`);
      dispatch(setE2EEStatus('unsupported'));
      dispatch(setE2EEErrorMessage(e2eeSupport.userMessage));
      return;
    }

    console.debug(`🔒 E2EE: Initializing with method: ${e2eeSupport.method}`);

    try {
      dispatch(setE2EEStatus('initializing'));
      console.debug('🚀 E2EE: Initializing...');

      // E2EE Manager und StreamsHandler wurden bereits in createPeerConnection initialisiert
      // Falls nicht (Fallback), erstellen wir sie hier
      e2eeManagerRef.current ??= new E2EEManager();
      streamsHandlerRef.current ??= new InsertableStreamsHandler(e2eeManagerRef.current);

      // Initialize workers (funktioniert jetzt für alle Browser)
      await streamsHandlerRef.current.initializeWorkers();

      const keyExchangeEvents: KeyExchangeEvents = {
        onKeyExchangeComplete: (
          fingerprint,
          generation,
          peerSigningPublicKey,
          peerSigningFingerprint
        ) => {
          void (async () => {
            console.debug(`✅ E2EE: Key exchange complete (gen ${String(generation)})`);
            console.debug(`✅ E2EE: Peer signing key available: ${String(!!peerSigningPublicKey)}`);
            dispatch(setE2EERemoteFingerprint(fingerprint));
            dispatch(setE2EEKeyGeneration(generation));

            const keyMaterial = e2eeManagerRef.current?.getCurrentKeyMaterial();
            if (!keyMaterial || !streamsHandlerRef.current) {
              console.error('❌ E2EE: Missing keyMaterial or streamsHandler!');
              return;
            }

            // ========================================================================
            // KRITISCHE REIHENFOLGE FÜR CROSS-BROWSER E2EE:
            // 1. Transform Pipelines ZUERST anwenden (wichtig für Chrome!)
            // 2. Keys an Worker senden UND WARTEN
            // 3. SYNCHRONISATIONS-DELAY um sicherzustellen beide Peers bereit sind
            // 4. Encryption aktivieren im Worker
            // ========================================================================

            // KRITISCH FÜR SAFARI:
            // Safari's RTCRtpScriptTransform löst 'rtctransform' Event SOFORT aus wenn
            // ein Transform angewendet wird. Das Event wird im Worker verarbeitet BEVOR
            // nachfolgende postMessage() Aufrufe. Deshalb MÜSSEN wir für Safari die Keys
            // ZUERST senden, BEVOR wir die Transforms anwenden!
            //
            // Für Chrome/Firefox ist die Reihenfolge egal, da deren Transforms die Keys
            // dynamisch beim Frame-Processing abrufen.

            const isSafari = streamsHandlerRef.current.getE2EEMethod() === 'scriptTransform';

            if (isSafari) {
              // SAFARI: Keys ZUERST, dann Transforms
              console.debug('🔑 E2EE: Step 1 (Safari) - Updating worker keys FIRST...');
              await streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
              console.debug('✅ E2EE: Worker keys confirmed');

              console.debug('🔒 E2EE: Step 2 (Safari) - Applying transform pipelines...');
              applyE2EEToMediaTracksRef.current();

              // Kurz warten damit onrtctransform im Worker vollständig verarbeitet wird
              await new Promise((resolve) => setTimeout(resolve, 100));
              console.debug('✅ E2EE: Transform pipelines applied and initialized');
            } else {
              // CHROME/FIREFOX: Transforms zuerst, dann Keys
              console.debug('🔒 E2EE: Step 1 - Applying transform pipelines (passthrough mode)...');
              applyE2EEToMediaTracksRef.current();
              console.debug('✅ E2EE: Transform pipelines applied');

              console.debug('🔑 E2EE: Step 2 - Updating worker keys...');
              await streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
              console.debug('✅ E2EE: Worker keys updated');
            }

            // SCHRITT 3: KURZER SYNCHRONISATIONS-DELAY
            // Da Decryption jetzt immer versucht wenn Key vorhanden und wir auf Worker-
            // Bestätigung warten, ist ein langer Delay nicht mehr nötig.
            // Kurzer Delay nur um sicherzustellen dass beide Peers ihre Transforms initialisiert haben.
            const SYNC_DELAY_MS = 200; // Reduziert von 1000ms auf 200ms
            console.debug(`⏳ E2EE: Step 3 - Short sync delay (${String(SYNC_DELAY_MS)}ms)...`);
            await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));
            console.debug('✅ E2EE: Sync delay complete');

            // SCHRITT 4: Encryption aktivieren
            console.debug('🔐 E2EE: Step 4 - Enabling encryption in workers...');
            streamsHandlerRef.current.enableEncryption();

            // Kurz warten damit Worker die Messages verarbeiten können
            await new Promise((resolve) => setTimeout(resolve, 100));
            console.debug('✅ E2EE: Encryption enabled in all workers');

            // Chat E2EE initialisieren
            void initializeChatE2EERef.current(
              keyMaterial.encryptionKey,
              peerSigningPublicKey,
              peerSigningFingerprint
            );
            dispatch(setE2EEStatus('active'));
          })();
        },

        onKeyRotation: (generation) => {
          void (async () => {
            console.debug(`🔄 E2EE: Key rotated to gen ${String(generation)}`);
            dispatch(setE2EEKeyGeneration(generation));
            lastKeyRotationRef.current = new Date().toISOString();

            const keyMaterial = e2eeManagerRef.current?.getCurrentKeyMaterial();
            if (keyMaterial && streamsHandlerRef.current) {
              // WICHTIG: Auch bei Rotation AWAITEN!
              await streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
            }
            dispatch(setE2EEStatus('active'));
          })();
        },

        onKeyExchangeError: (keyExchangeErr) => {
          console.error('E2EE: Key exchange error:', keyExchangeErr);
          dispatch(setE2EEStatus('error'));
          dispatch(setE2EEErrorMessage(keyExchangeErr));
        },

        onVerificationRequired:
          e2eeSupport.method === 'scriptTransform'
            ? undefined
            : () => {
                console.debug('🔐 E2EE: Verification required');
              },
      };

      keyExchangeManagerRef.current = new E2EEKeyExchangeManager(
        e2eeManagerRef.current,
        keyExchangeEvents
      );

      dispatch(setE2EEStatus('key-exchange'));
      const isInitiator = configRef.current?.initiatorUserId === currentUser?.id;
      await keyExchangeManagerRef.current.initialize(
        signalRConnectionRef.current,
        currentRoomId,
        currentPeerId,
        isInitiator,
        currentUser?.id
      );

      const localFp = keyExchangeManagerRef.current.getLocalFingerprint();
      dispatch(setE2EELocalFingerprint(localFp));

      // Key Rotation aktivieren - NUR INITIATOR startet Rotation!
      // KRITISCH: Wenn beide Seiten unabhängig Rotationen starten, geraten die
      // Key-Generationen aus dem Sync (Chrome Gen 6, Safari Gen 3) und Decryption schlägt fehl!
      // Participant reagiert nur auf Rotation-Anfragen vom Initiator.
      if (isInitiator) {
        e2eeManagerRef.current.startKeyRotation(() => {
          dispatch(setE2EEStatus('key-rotation'));
          void keyExchangeManagerRef.current?.rotateKeys();
        });
        console.debug('🔄 E2EE: Key rotation timer started (INITIATOR only)');
      } else {
        console.debug(
          '🔄 E2EE: Key rotation timer NOT started (PARTICIPANT - will respond to initiator rotations)'
        );
      }

      // Stats Interval
      statsIntervalRef.current = setInterval(() => {
        if (streamsHandlerRef.current && isMountedRef.current) {
          const frameStats = streamsHandlerRef.current.getStats();

          const stats: EncryptionStats = {
            totalFrames: frameStats.totalFrames,
            encryptedFrames: frameStats.encryptedFrames,
            decryptedFrames: frameStats.decryptedFrames,
            encryptionErrors: frameStats.encryptionErrors,
            decryptionErrors: frameStats.decryptionErrors,
            averageEncryptionTime: frameStats.averageEncryptionTime,
            averageDecryptionTime: frameStats.averageDecryptionTime,
            droppedFrames: 0,
            lastKeyRotation: lastKeyRotationRef.current,
          };

          dispatch(setE2EEEncryptionStats(stats));
        }
      }, STATS_UPDATE_INTERVAL);

      console.debug(`✅ E2EE: Initialization complete for ${e2eeSupport.browserName}`);
    } catch (initError) {
      console.error('E2EE: Initialization error:', initError);
      dispatch(setE2EEStatus('error'));
      dispatch(setE2EEErrorMessage(String(initError)));
    }
  }, [dispatch]);

  // E2EE auf Media Tracks anwenden - Jetzt für alle Browser
  // Für Chrome werden die gecachten Encoded Streams verwendet
  const applyE2EEToMediaTracks = useCallback(() => {
    if (!peerRef.current || !streamsHandlerRef.current) return;

    // Prüfe ob Transforms bereits angewendet wurden
    if (e2eeTransformsAppliedRef.current) {
      console.debug('🔒 E2EE: Transforms already applied, skipping');
      return;
    }

    console.debug('🔒 E2EE: Applying transform pipelines to media tracks...');

    const streamsHandler = streamsHandlerRef.current;

    peerRef.current.getSenders().forEach((sender) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
      if (sender.track !== null && streamsHandler !== null) {
        const kind = sender.track.kind as 'video' | 'audio';
        try {
          streamsHandler.applyEncryptionToSender(sender, kind);
          console.debug(`✅ E2EE: Encryption pipeline applied to ${kind} sender`);
        } catch (e) {
          console.error(`E2EE: Failed to apply to ${kind} sender:`, e);
        }
      }
    });

    peerRef.current.getReceivers().forEach((receiver) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- WebRTC types can be null at runtime
      if (receiver.track !== null && streamsHandler !== null) {
        const kind = receiver.track.kind as 'video' | 'audio';
        try {
          streamsHandler.applyDecryptionToReceiver(receiver, kind);
          console.debug(`✅ E2EE: Decryption pipeline applied to ${kind} receiver`);
        } catch (e) {
          console.error(`E2EE: Failed to apply to ${kind} receiver:`, e);
        }
      }
    });

    e2eeTransformsAppliedRef.current = true;
    console.debug('✅ E2EE: All transform pipelines applied');
  }, []);

  // Sync applyE2EEToMediaTracks to ref
  useEffect(() => {
    applyE2EEToMediaTracksRef.current = applyE2EEToMediaTracks;
  }, [applyE2EEToMediaTracks]);

  const initializeChatE2EE = useCallback(
    async (
      sharedEncryptionKey: CryptoKey | undefined,
      peerSigningPublicKey?: string,
      peerSigningFingerprint?: string
    ) => {
      const currentRoomId = roomIdRef.current;
      if (!sharedEncryptionKey || !currentRoomId) return;

      try {
        dispatch(setChatE2EEStatus('initializing'));

        const signingKeys = await chatManagerRef.current.generateSigningKeyPair();
        localSigningKeyRef.current = signingKeys.signingKey;
        localVerificationKeyRef.current = signingKeys.verificationKey;
        dispatch(setChatE2EELocalFingerprint(signingKeys.fingerprint));

        // NEU: Übergebe Peer's Signing Key für Nachrichtenverifikation
        console.debug(
          `🔐 Chat E2EE: Initializing with peer signing key: ${String(!!peerSigningPublicKey)}`
        );
        await chatManagerRef.current.initializeConversation(
          currentRoomId,
          sharedEncryptionKey,
          signingKeys.signingKey,
          signingKeys.verificationKey,
          signingKeys.fingerprint,
          peerSigningPublicKey, // NEU: Für Signature Verification
          peerSigningFingerprint // NEU: Peer Fingerprint
        );

        dispatch(setChatE2EEStatus('active'));
        console.debug('✅ Chat E2EE: Initialized with peer verification key');
      } catch (chatInitError) {
        console.error('Chat E2EE: Initialization error:', chatInitError);
        dispatch(setChatE2EEStatus('error'));
      }
    },
    [dispatch]
  );

  // Sync initializeChatE2EE to ref
  useEffect(() => {
    initializeChatE2EERef.current = initializeChatE2EE;
  }, [initializeChatE2EE]);

  // ===== MEDIA CONTROLS =====
  const handleToggleScreenSharing = useCallback(async () => {
    if (!peerRef.current) return;

    const currentIsScreenSharing = isScreenSharingRef.current;
    const currentRoomId = roomIdRef.current;

    try {
      if (currentIsScreenSharing) {
        // Stop screen sharing
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];

        const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        localStream?.getVideoTracks().forEach((t: MediaStreamTrack) => {
          t.stop();
        });
        setLocalStream(stream);
        dispatch(setLocalStreamId(stream.id));
        dispatch(toggleScreenShare());

        if (signalRConnectionRef.current && currentRoomId) {
          void signalRConnectionRef.current.invoke(
            'MediaStateChanged',
            currentRoomId,
            'screen',
            false
          );
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          if (isScreenSharingRef.current) {
            void handleToggleScreenSharing();
          }
        };

        const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        const newStream = new MediaStream([screenTrack, ...(localStream?.getAudioTracks() ?? [])]);

        setLocalStream(newStream);
        dispatch(setLocalStreamId(newStream.id));
        dispatch(toggleScreenShare());

        if (signalRConnectionRef.current && currentRoomId) {
          void signalRConnectionRef.current.invoke(
            'MediaStateChanged',
            currentRoomId,
            'screen',
            true
          );
        }
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
      dispatch(setError('Bildschirmfreigabe fehlgeschlagen'));
    }
  }, [dispatch, localStream, setLocalStream]);

  // ===== ACTIONS =====
  const actions = useMemo(
    () => ({
      startVideoCall: async (appointmentId: string) => {
        if (isInitializedRef.current) {
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
          console.debug('📞 Full config:', {
            roomId: config.roomId,
            sessionId: config.sessionId,
            initiatorUserId: config.initiatorUserId,
            participantUserId: config.participantUserId,
            initiatorName: config.initiatorName,
            participantName: config.participantName,
          });

          dispatch(initializeCall(config));
          await setupWebRTC(config);

          if (config.sessionId && signalRConnectionRef.current) {
            try {
              await dispatch(
                joinVideoCall({
                  sessionId: config.sessionId,
                  connectionId: signalRConnectionRef.current.connectionId ?? undefined,
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

        const currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
          try {
            await dispatch(leaveVideoCall(currentSessionId)).unwrap();
          } catch (e) {
            console.error('Failed to leave via API:', e);
          }
        }

        await cleanupResources(true);
      },

      toggleMicrophone: () => {
        if (localStream) {
          const newEnabled = !isMicEnabledRef.current;
          localStream.getAudioTracks().forEach((t: MediaStreamTrack) => {
            t.enabled = newEnabled;
          });
          dispatch(toggleMic());

          const currentRoomId = roomIdRef.current;
          if (signalRConnectionRef.current && currentRoomId) {
            void signalRConnectionRef.current.invoke(
              'MediaStateChanged',
              currentRoomId,
              'audio',
              newEnabled
            );
          }
        }
      },

      toggleCamera: () => {
        if (localStream) {
          const newEnabled = !isVideoEnabledRef.current;
          localStream.getVideoTracks().forEach((t: MediaStreamTrack) => {
            t.enabled = newEnabled;
          });
          dispatch(toggleVideo());

          const currentRoomId = roomIdRef.current;
          if (signalRConnectionRef.current && currentRoomId) {
            void signalRConnectionRef.current.invoke(
              'MediaStateChanged',
              currentRoomId,
              'video',
              newEnabled
            );
          }
        }
      },

      toggleChatPanel: () => {
        dispatch(toggleChat());
      },

      toggleScreenSharing: handleToggleScreenSharing,

      sendChatMessage: async (content: string) => {
        const connection = signalRConnectionRef.current;
        const currentSessionId = sessionIdRef.current;
        const currentRoomId = roomIdRef.current;
        const currentUser = userRef.current;
        const currentChatE2EEStatus = chatE2EEStatusRef.current;

        if (!connection || !currentSessionId || !currentRoomId || !currentUser) return;

        const senderName = withDefault(currentUser.firstName, 'Ich');
        let messageContent = content;
        let encryptedData: EncryptedMessage | null = null;

        if (currentChatE2EEStatus === 'active') {
          try {
            encryptedData = await chatManagerRef.current.encryptMessage(currentRoomId, content);
            messageContent = JSON.stringify(encryptedData);
            dispatch(incrementChatMessagesEncrypted());
          } catch {
            // Fall back to unencrypted
          }
        }

        const msg: ChatMessage = {
          id: Date.now().toString(),
          sessionId: currentSessionId,
          senderId: currentUser.id,
          senderName,
          message: content, // Show original to self
          sentAt: new Date().toISOString(),
          messageType: encryptedData ? 'Encrypted' : 'Text',
          isEncrypted: !!encryptedData,
          isVerified: true,
        };

        dispatch(addMessage(msg));

        try {
          await connection.invoke('SendChatMessage', currentRoomId, messageContent);
        } catch (e) {
          console.error('Error sending chat message:', e);
        }
      },
    }),
    [dispatch, setupWebRTC, cleanupResources, handleToggleScreenSharing, localStream]
  );

  // ===== E2EE INITIALIZATION EFFECT =====
  useEffect(() => {
    if (!roomId || !peerId || !peerRef.current || !signalRConnectionRef.current || !isConnected) {
      return;
    }

    if (e2eeStatus !== 'disabled') return;

    const timer = setTimeout(() => {
      void initializeE2EE();
    }, E2EE_INIT_DELAY);
    return () => {
      clearTimeout(timer);
    };
  }, [roomId, peerId, e2eeStatus, isConnected, initializeE2EE]);

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      console.debug('🔄 useVideoCall unmounting');
      isMountedRef.current = false;
      void cleanupResources(true); // Fire-and-forget on unmount (cleanup callbacks can't be async)
    };
  }, [cleanupResources]);

  // ===== SAFARI EMERGENCY CLEANUP - beforeunload Handler =====
  // Safari gibt die Kamera manchmal nicht frei wenn die Seite verlassen wird
  // ohne dass cleanupResources aufgerufen wurde (Tab schließen, Navigation, etc.)
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      console.debug('🚨 beforeunload: Emergency camera cleanup');

      // Synchroner Cleanup für Safari
      // 1. Tracks direkt stoppen
      if (peerRef.current) {
        try {
          const senders = peerRef.current.getSenders();
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

      // 2. LocalStream Tracks stoppen
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {
            /* ignore */
          }
        });
      }

      // 3. StreamManager cleanup (synchron)
      try {
        const streamManager = StreamManager.getInstance();
        streamManager.destroyAllStreams();
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload); // iOS Safari

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [localStream]);

  // ===== DEBUG HELPERS =====
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const dbg = {
      getPeer: () => peerRef.current,
      getSignalR: () => signalRConnectionRef.current,
      getLocalStream: () => localStream,
      getRemoteStream: () => remoteStream,
      getSenders: () =>
        peerRef.current?.getSenders().map((s) => ({
          kind: s.track?.kind ?? 'unknown',
          id: s.track?.id ?? '',
          enabled: s.track?.enabled ?? false,
        })) ?? [],
      getReceivers: () =>
        peerRef.current?.getReceivers().map((r) => ({
          kind: r.track.kind,
          id: r.track.id,
        })) ?? [],
      getState: () => ({
        peer: peerRef.current?.connectionState,
        signalR: signalRConnectionRef.current?.state,
        initialized: isInitializedRef.current,
      }),
    };

    (window as unknown as Record<string, unknown>).__vcDebug = dbg;
    return () => {
      if ((window as unknown as Record<string, unknown>).__vcDebug === dbg) {
        (window as unknown as Record<string, unknown>).__vcDebug = undefined;
      }
    };
  }, [localStream, remoteStream]);

  // ===== RETURN =====
  return {
    // State
    sessionId,
    roomId,
    isConnected,
    peerId,
    localStream,
    remoteStream,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    messages,
    callDuration,
    participants,
    isLoading,
    error,
    callConfig: configRef.current,

    // Actions
    ...actions,
    clearError: () => dispatch(clearError()),

    peerConnection: peerRef.current,

    // E2EE Video
    e2ee: {
      status: e2eeStatus,
      isActive: e2eeStatus === 'active',
      localKeyFingerprint,
      remotePeerFingerprint,
      formattedLocalFingerprint: localKeyFingerprint
        ? E2EEKeyExchangeManager.formatFingerprintForDisplay(localKeyFingerprint)
        : null,
      formattedRemoteFingerprint: remotePeerFingerprint
        ? E2EEKeyExchangeManager.formatFingerprintForDisplay(remotePeerFingerprint)
        : null,
      keyGeneration,
      encryptionStats,
      compatibility,
      errorMessage: e2eeErrorMessage,
      rotateKeys: async () => {
        if (keyExchangeManagerRef.current) {
          dispatch(setE2EEStatus('key-rotation'));
          await keyExchangeManagerRef.current.rotateKeys();
        }
      },
    },

    // E2EE Chat
    chatE2EE: {
      status: chatE2EEStatus,
      isActive: isChatE2EEActive,
      localFingerprint: null,
      peerFingerprint: null,
      stats: chatStats,
    },
  };
};

export default useVideoCall;
