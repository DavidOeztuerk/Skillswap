import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
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
import { VideoCallConfig } from '../types/models/VideoCallConfig';
import { ChatMessage } from '../types/models/ChatMessage';
import { EncryptionStats } from '../store/adapters/videoCallAdapter+State';
import videoCallService from '../api/services/videoCallService';
import { ApiResponse, isSuccessResponse } from '../types/api/UnifiedResponse';
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
import {
  E2EEManager,
  isInsertableStreamsSupported,
  getE2EECompatibility,
} from '../utils/crypto/e2eeVideoEncryption';
import { InsertableStreamsHandler } from '../utils/crypto/insertableStreamsHandler';
import { E2EEKeyExchangeManager, KeyExchangeEvents } from '../utils/crypto/e2eeKeyExchange';
import { E2EEChatManager, EncryptedMessage } from '../utils/crypto/e2eeChatEncryption';
import { useStreams } from '../contexts/StreamContext';

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

export const useVideoCall = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);

  const {
    localStream,
    remoteStream,
    setLocalStream,
    setRemoteStream,
    cleanup: cleanupStreams,
  } = useStreams();

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

  const compatibility = getE2EECompatibility();

  // ===== SYNC REFS WITH STATE =====
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { peerIdRef.current = peerId; }, [peerId]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { isMicEnabledRef.current = isMicEnabled; }, [isMicEnabled]);
  useEffect(() => { isVideoEnabledRef.current = isVideoEnabled; }, [isVideoEnabled]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);
  useEffect(() => { chatE2EEStatusRef.current = chatE2EEStatus; }, [chatE2EEStatus]);
  useEffect(() => { userRef.current = user; }, [user]);

  // ===== PEER CONNECTION MANAGEMENT =====
  const createPeerConnection = useCallback((config: VideoCallConfig): RTCPeerConnection => {
    console.log('🔧 Creating new RTCPeerConnection');

    const pc = new RTCPeerConnection(getWebRTCConfiguration());

    pc.ontrack = (event) => {
      console.log('🎥 ONTRACK EVENT:', {
        streams: event.streams.length,
        track: event.track?.kind,
        trackId: event.track?.id,
      });

      if (event.streams?.[0]) {
        const stream = event.streams[0];
        setRemoteStream(stream);
        dispatch(setRemoteStreamId(stream.id));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE Candidate found');
        const connection = signalRConnectionRef.current;
        const currentRoomId = roomIdRef.current;
        const currentUser = userRef.current;

        if (connection && currentRoomId && config) {
          const targetUserId = config.initiatorUserId === currentUser?.id
            ? config.participantUserId
            : config.initiatorUserId;

          if (targetUserId) {
            connection.invoke(
              'SendIceCandidate',
              currentRoomId,
              targetUserId,
              JSON.stringify(event.candidate.toJSON())
            ).catch((err) => console.error('Failed to send ICE candidate:', err));
          }
        }
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('🔗 PeerConnection State:', state);

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
              cleanupResources(false);
            }
          }
        }, CONNECTION_TIMEOUT);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('❄️ ICE Connection State:', pc.iceConnectionState);
    };

    return pc;
  }, [dispatch, setRemoteStream]);

  const ensurePeerConnection = useCallback((config: VideoCallConfig): RTCPeerConnection => {
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
            pc.addTrack(track, localStream);
            console.log(`✅ Added ${track.kind} track to PC`);
          } catch (e) {
            console.error(`Failed to add ${track.kind} track:`, e);
          }
        }
      });
    }

    return pc;
  }, [createPeerConnection, localStream]);

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
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerRef.current;

    if (!pc || !pc.remoteDescription) {
      if (iceCandidatesBuffer.current.length < MAX_ICE_BUFFER_SIZE) {
        iceCandidatesBuffer.current.push(candidate);
      } else {
        console.warn('ICE buffer full, dropping candidate');
      }
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  const createOfferForTarget = useCallback(async (
    config: VideoCallConfig,
    targetUserId: string
  ) => {
    if (!targetUserId || !config?.roomId) return;

    try {
      const pc = ensurePeerConnection(config);

      // Ensure we have tracks
      if (pc.getSenders().length === 0 && localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (track.readyState !== 'ended') {
            pc.addTrack(track, localStream);
          }
        });
      }

      const offer = await pc.createOffer();

      if (!offer.sdp || (!/m=audio/.test(offer.sdp) && !/m=video/.test(offer.sdp))) {
        console.error('CRITICAL: Offer SDP contains no media!');
        return;
      }

      await pc.setLocalDescription(offer);

      const connection = signalRConnectionRef.current;
      if (connection?.state === HubConnectionState.Connected) {
        await connection.invoke('SendOffer', config.roomId, targetUserId, offer.sdp);
        console.log('📤 Sent offer to', targetUserId);
      }
    } catch (err) {
      console.error('createOffer failed:', err);
    }
  }, [ensurePeerConnection, localStream]);

  // ===== CLEANUP =====
  const cleanupResources = useCallback((isFullCleanup: boolean = false) => {
    console.log('🧹 Cleaning up resources...', { isFullCleanup });

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

    // PeerConnection cleanup
    if (peerRef.current) {
      const pc = peerRef.current;
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;

        if (pc.signalingState !== 'closed') {
          pc.close();
        }
      } catch (e) {
        console.warn('Error closing PeerConnection:', e);
      }
      peerRef.current = null;
    }

    // SignalR cleanup
    if (signalRConnectionRef.current) {
      signalRConnectionRef.current.stop().catch(() => {});
      signalRConnectionRef.current = null;
    }

    // Clear buffers
    iceCandidatesBuffer.current = [];

    // E2EE cleanup
    e2eeManagerRef.current?.stopKeyRotation();
    e2eeManagerRef.current?.cleanup();
    streamsHandlerRef.current?.cleanup();
    keyExchangeManagerRef.current?.cleanup();

    const currentRoomId = roomIdRef.current;
    if (currentRoomId) {
      chatManagerRef.current.removeConversation(currentRoomId);
    }

    // Full cleanup
    if (isFullCleanup) {
      cleanupStreams();
      dispatch(resetCall());
      isInitializedRef.current = false;
    }
  }, [dispatch, cleanupStreams]);

  // ===== WEBRTC SETUP =====
  const setupWebRTC = useCallback(async (config: VideoCallConfig) => {
    if (isInitializedRef.current) {
      console.log('Already initialized, skipping');
      return;
    }

    isInitializedRef.current = true;
    configRef.current = config;

    try {
      console.log('🎥 Requesting media devices...');

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

      console.log('✅ MediaStream obtained:', stream.getTracks().length, 'tracks');

      setLocalStream(stream);
      dispatch(setLocalStreamId(stream.id));

      const pc = createPeerConnection(config);
      peerRef.current = pc;

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        if (track.readyState !== 'ended') {
          pc.addTrack(track, stream);
          console.log(`✅ Added ${track.kind} track`);
        }
      });

      await setupSignalR(config);

      console.log('✅ WebRTC Setup completed');
    } catch (err: unknown) {
      console.error('WebRTC Setup Error:', err);
      isInitializedRef.current = false;
      dispatch(setError(err instanceof Error ? err.message : 'Verbindungsaufbau fehlgeschlagen'));
      cleanupResources(true);
    }
  }, [dispatch, setLocalStream, createPeerConnection, cleanupResources]);

  // ===== SIGNALR SETUP =====
  const setupSignalR = useCallback(async (config: VideoCallConfig) => {
    const token = getToken();

    if (!token) {
      dispatch(setError('Authentifizierungsfehler'));
      return;
    }

    console.log('🔌 Starting SignalR connection...');

    const connection = new HubConnectionBuilder()
      .withUrl(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/videocall/hub?roomId=${config.roomId}`,
        { accessTokenFactory: () => token }
      )
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect(RECONNECT_DELAYS)
      .build();

    // UserJoined
    connection.on('UserJoined', async (data: { userId: string }) => {
      const joinedUserId = data.userId;
      const currentUser = userRef.current;

      console.log('👥 UserJoined:', joinedUserId);

      if (!joinedUserId || joinedUserId === currentUser?.id) return;

      // Add participant to state
      dispatch(addParticipant({
        id: joinedUserId,
        name: 'Participant',
        audioEnabled: true,
        videoEnabled: true,
      }));

      await new Promise((r) => setTimeout(r, 500));

      if (config.initiatorUserId === currentUser?.id) {
        console.log('I am initiator, creating offer');
        await createOfferForTarget(config, joinedUserId);
      }
    });

    // UserLeft
    connection.on('UserLeft', (data: { userId: string }) => {
      console.log('👋 UserLeft:', data.userId);
      dispatch(removeParticipant(data.userId));
    });

    // RoomJoined
    connection.on('RoomJoined', (data: { roomId: string; participants: string[] }) => {
      console.log('🏠 RoomJoined:', data);
    });

    // ReceiveOffer
    connection.on('ReceiveOffer', async (data: { fromUserId: string; offer: string }) => {
      console.log('📩 ReceiveOffer from', data.fromUserId);

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
          console.log('📤 Sent answer');
        }
      } catch (e) {
        console.error('Error handling offer:', e);
      }
    });

    // ReceiveAnswer
    connection.on('ReceiveAnswer', async (data: { fromUserId: string; answer: string }) => {
      console.log('📩 ReceiveAnswer from', data.fromUserId);
      await handleAnswer({ type: 'answer', sdp: data.answer });
    });

    // ReceiveIceCandidate
    connection.on('ReceiveIceCandidate', async (data: { fromUserId: string; candidate: string }) => {
      console.log('🧊 ReceiveIceCandidate from', data.fromUserId);
      try {
        const candidateObj = JSON.parse(data.candidate);
        await handleIceCandidate(candidateObj);
      } catch (e) {
        console.error('Error handling ICE candidate:', e);
      }
    });

    // ChatMessage
    connection.on('ChatMessage', async (data: { userId: string; message: string; timestamp: string }) => {
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
          const encryptedData: EncryptedMessage = JSON.parse(data.message);
          const decrypted = await chatManagerRef.current.decryptMessage(currentRoomId, encryptedData);
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
        sessionId: sessionIdRef.current || '',
        senderId: data.userId,
        senderName: 'Participant',
        message: messageContent,
        sentAt: data.timestamp,
        messageType: isEncrypted ? 'Encrypted' : 'Text',
        isEncrypted,
        isVerified,
      };

      dispatch(addMessage(chatMessage));
    });

    // MediaStateChanged
    connection.on('MediaStateChanged', (data: { userId: string; type: string; enabled: boolean }) => {
      dispatch(updateParticipant({
        id: data.userId,
        ...(data.type === 'audio' && { isMuted: !data.enabled }),
        ...(data.type === 'video' && { isVideoEnabled: data.enabled }),
        ...(data.type === 'screen' && { isScreenSharing: data.enabled }),
      }));
    });

    // Connection lifecycle
    connection.onclose((error) => {
      console.warn('🔌 SignalR closed', error);
      if (isMountedRef.current) {
        dispatch(setConnected(false));
      }

      if (signalRConnectionRef.current === connection) {
        signalRConnectionRef.current = null;
      }

      if (isInitializedRef.current && isMountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => setupSignalR(config), 2000);
      }
    });

    connection.onreconnected(async () => {
      console.log('✅ SignalR reconnected');
      dispatch(setConnected(true));

      // Re-join room after reconnect
      const currentRoomId = roomIdRef.current;
      if (currentRoomId) {
        try {
          await connection.invoke('JoinRoom', currentRoomId);
          console.log('✅ Re-joined room after reconnect');
        } catch (e) {
          console.warn('Failed to re-join room:', e);
        }
      }
    });

    connection.onreconnecting(() => {
      console.log('🔄 SignalR reconnecting...');
    });

    try {
      await connection.start();
      console.log('✅ SignalR connected');
      signalRConnectionRef.current = connection;
      dispatch(setConnected(true));

      if (config.roomId) {
        await connection.invoke('JoinRoom', config.roomId);
        console.log('✅ Joined room:', config.roomId);
      }

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(async () => {
        const currentRoomId = roomIdRef.current;
        if (connection.state === HubConnectionState.Connected && currentRoomId) {
          try {
            await connection.invoke('SendHeartbeat', currentRoomId);
          } catch (e) {
            console.warn('Heartbeat failed:', e);
          }
        }
      }, HEARTBEAT_INTERVAL);
    } catch (err) {
      console.error('SignalR start failed:', err);
      dispatch(setError('SignalR-Verbindung fehlgeschlagen'));
      throw err;
    }
  }, [
    dispatch,
    ensurePeerConnection,
    createOfferForTarget,
    handleAnswer,
    handleIceCandidate,
  ]);

  // ===== E2EE FUNCTIONS =====
  const initializeE2EE = useCallback(async () => {
    const currentRoomId = roomIdRef.current;
    const currentPeerId = peerIdRef.current;
    const currentUser = userRef.current;

    if (!peerRef.current || !signalRConnectionRef.current || !currentRoomId || !currentPeerId) {
      console.warn('E2EE: Missing dependencies');
      return;
    }

    if (!isInsertableStreamsSupported()) {
      dispatch(setE2EEStatus('unsupported'));
      return;
    }

    try {
      dispatch(setE2EEStatus('initializing'));
      console.log('🚀 E2EE: Initializing...');

      e2eeManagerRef.current = new E2EEManager();
      streamsHandlerRef.current = new InsertableStreamsHandler(e2eeManagerRef.current);
      await streamsHandlerRef.current.initializeWorkers();

      const keyExchangeEvents: KeyExchangeEvents = {
        onKeyExchangeComplete: (fingerprint, generation) => {
          console.log(`✅ E2EE: Key exchange complete (gen ${generation})`);
          dispatch(setE2EERemoteFingerprint(fingerprint));
          dispatch(setE2EEKeyGeneration(generation));
          applyE2EEToMediaTracks();

          const keyMaterial = e2eeManagerRef.current?.getCurrentKeyMaterial();
          if (keyMaterial && streamsHandlerRef.current) {
            streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
          }

          initializeChatE2EE(keyMaterial?.encryptionKey);
          dispatch(setE2EEStatus('active'));
        },
        onKeyRotation: (generation) => {
          console.log(`🔄 E2EE: Key rotated to gen ${generation}`);
          dispatch(setE2EEKeyGeneration(generation));
          lastKeyRotationRef.current = new Date().toISOString();

          const keyMaterial = e2eeManagerRef.current?.getCurrentKeyMaterial();
          if (keyMaterial && streamsHandlerRef.current) {
            streamsHandlerRef.current.updateWorkerKeys(keyMaterial);
          }
          dispatch(setE2EEStatus('active'));
        },
        onKeyExchangeError: (error) => {
          console.error('E2EE: Key exchange error:', error);
          dispatch(setE2EEStatus('error'));
          dispatch(setE2EEErrorMessage(error));
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
        isInitiator
      );

      const localFp = keyExchangeManagerRef.current.getLocalFingerprint();
      dispatch(setE2EELocalFingerprint(localFp));

      e2eeManagerRef.current.startKeyRotation(() => {
        dispatch(setE2EEStatus('key-rotation'));
        keyExchangeManagerRef.current?.rotateKeys();
      });

      statsIntervalRef.current = setInterval(() => {
        if (streamsHandlerRef.current && isMountedRef.current) {
          const frameStats = streamsHandlerRef.current.getStats();
          
          const encryptionStats: EncryptionStats = {
            totalFrames: frameStats.totalFrames,
            encryptedFrames: frameStats.encryptedFrames,
            decryptedFrames: frameStats.decryptedFrames,
            encryptionErrors: frameStats.encryptionErrors,
            decryptionErrors: frameStats.decryptionErrors,
            averageEncryptionTime: frameStats.averageEncryptionTime,
            averageDecryptionTime: frameStats.averageDecryptionTime,
            droppedFrames: 0, // Not tracked in FrameStats
            lastKeyRotation: lastKeyRotationRef.current,
          };
          
          dispatch(setE2EEEncryptionStats(encryptionStats));
        }
      }, STATS_UPDATE_INTERVAL);

      console.log('✅ E2EE: Initialization complete');
    } catch (error) {
      console.error('E2EE: Initialization error:', error);
      dispatch(setE2EEStatus('error'));
      dispatch(setE2EEErrorMessage(String(error)));
    }
  }, [dispatch]);

  const applyE2EEToMediaTracks = useCallback(() => {
    if (!peerRef.current || !streamsHandlerRef.current) return;

    console.log('🔒 E2EE: Applying to media tracks...');

    peerRef.current.getSenders().forEach((sender) => {
      if (sender.track) {
        const kind = sender.track.kind as 'video' | 'audio';
        try {
          streamsHandlerRef.current!.applyEncryptionToSender(sender, kind);
          console.log(`✅ E2EE: Encryption applied to ${kind} sender`);
        } catch (e) {
          console.error(`E2EE: Failed to apply to ${kind} sender:`, e);
        }
      }
    });

    peerRef.current.getReceivers().forEach((receiver) => {
      if (receiver.track) {
        const kind = receiver.track.kind as 'video' | 'audio';
        try {
          streamsHandlerRef.current!.applyDecryptionToReceiver(receiver, kind);
          console.log(`✅ E2EE: Decryption applied to ${kind} receiver`);
        } catch (e) {
          console.error(`E2EE: Failed to apply to ${kind} receiver:`, e);
        }
      }
    });
  }, []);

  const initializeChatE2EE = useCallback(async (sharedEncryptionKey: CryptoKey | undefined) => {
    const currentRoomId = roomIdRef.current;
    if (!sharedEncryptionKey || !currentRoomId) return;

    try {
      dispatch(setChatE2EEStatus('initializing'));

      const signingKeys = await chatManagerRef.current.generateSigningKeyPair();
      localSigningKeyRef.current = signingKeys.signingKey;
      localVerificationKeyRef.current = signingKeys.verificationKey;
      dispatch(setChatE2EELocalFingerprint(signingKeys.fingerprint));

      await chatManagerRef.current.initializeConversation(
        currentRoomId,
        sharedEncryptionKey,
        signingKeys.signingKey,
        signingKeys.verificationKey,
        signingKeys.fingerprint
      );

      dispatch(setChatE2EEStatus('active'));
      console.log('✅ Chat E2EE: Initialized');
    } catch (error) {
      console.error('Chat E2EE: Initialization error:', error);
      dispatch(setChatE2EEStatus('error'));
    }
  }, [dispatch]);

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

        localStream?.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
        setLocalStream(stream);
        dispatch(setLocalStreamId(stream.id));
        dispatch(toggleScreenShare());

        if (signalRConnectionRef.current && currentRoomId) {
          signalRConnectionRef.current.invoke('MediaStateChanged', currentRoomId, 'screen', false);
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          if (isScreenSharingRef.current) {
            handleToggleScreenSharing();
          }
        };

        const sender = peerRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        const newStream = new MediaStream([
          screenTrack,
          ...(localStream?.getAudioTracks() || []),
        ]);

        setLocalStream(newStream);
        dispatch(setLocalStreamId(newStream.id));
        dispatch(toggleScreenShare());

        if (signalRConnectionRef.current && currentRoomId) {
          signalRConnectionRef.current.invoke('MediaStateChanged', currentRoomId, 'screen', true);
        }
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
      dispatch(setError('Bildschirmfreigabe fehlgeschlagen'));
    }
  }, [dispatch, localStream, setLocalStream]);

  // ===== ACTIONS =====
  const actions = useMemo(() => ({
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

        if (!isSuccessResponse(configResponse) || !configResponse.data) {
          throw new Error('Konnte Anruf-Konfiguration nicht laden');
        }

        const config = configResponse.data;
        console.log('📞 Initializing call with config:', config.roomId);

        dispatch(initializeCall(config));
        await setupWebRTC(config);

        if (config.sessionId && signalRConnectionRef.current) {
          try {
            await dispatch(joinVideoCall({
              sessionId: config.sessionId,
              connectionId: signalRConnectionRef.current.connectionId ?? undefined,
              cameraEnabled: true,
              microphoneEnabled: true,
            })).unwrap();
          } catch (e) {
            console.warn('API Join failed:', e);
          }
        }
      } catch (err: unknown) {
        console.error('Start Video Call Failed:', err);
        dispatch(setError(err instanceof Error ? err.message : 'Fehler beim Starten'));
        cleanupResources(true);
      } finally {
        dispatch(setLoading(false));
      }
    },

    hangUp: async () => {
      console.log('📞 Hanging up...');

      const currentSessionId = sessionIdRef.current;
      if (currentSessionId) {
        try {
          await dispatch(leaveVideoCall(currentSessionId)).unwrap();
        } catch (e) {
          console.error('Failed to leave via API:', e);
        }
      }

      cleanupResources(true);
    },

    toggleMicrophone: () => {
      if (localStream) {
        const newEnabled = !isMicEnabledRef.current;
        localStream.getAudioTracks().forEach((t: MediaStreamTrack) => (t.enabled = newEnabled));
        dispatch(toggleMic());

        const currentRoomId = roomIdRef.current;
        if (signalRConnectionRef.current && currentRoomId) {
          signalRConnectionRef.current.invoke('MediaStateChanged', currentRoomId, 'audio', newEnabled);
        }
      }
    },

    toggleCamera: () => {
      if (localStream) {
        const newEnabled = !isVideoEnabledRef.current;
        localStream.getVideoTracks().forEach((t: MediaStreamTrack) => (t.enabled = newEnabled));
        dispatch(toggleVideo());

        const currentRoomId = roomIdRef.current;
        if (signalRConnectionRef.current && currentRoomId) {
          signalRConnectionRef.current.invoke('MediaStateChanged', currentRoomId, 'video', newEnabled);
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
  }), [
    dispatch,
    setupWebRTC,
    cleanupResources,
    handleToggleScreenSharing,
    localStream,
  ]);

  // ===== E2EE INITIALIZATION EFFECT =====
  useEffect(() => {
    if (!roomId || !peerId || !peerRef.current || !signalRConnectionRef.current || !isConnected) {
      return;
    }

    if (e2eeStatus !== 'disabled') return;

    const timer = setTimeout(initializeE2EE, E2EE_INIT_DELAY);
    return () => clearTimeout(timer);
  }, [roomId, peerId, e2eeStatus, isConnected, initializeE2EE]);

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      console.log('🔄 useVideoCall unmounting');
      isMountedRef.current = false;
      cleanupResources(true);
    };
  }, [cleanupResources]);

  // ===== DEBUG HELPERS =====
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const dbg = {
      getPeer: () => peerRef.current,
      getSignalR: () => signalRConnectionRef.current,
      getLocalStream: () => localStream,
      getRemoteStream: () => remoteStream,
      getSenders: () => peerRef.current?.getSenders().map((s) => ({
        kind: s.track?.kind,
        id: s.track?.id,
        enabled: s.track?.enabled,
      })) ?? [],
      getReceivers: () => peerRef.current?.getReceivers().map((r) => ({
        kind: r.track?.kind,
        id: r.track?.id,
      })) ?? [],
      getState: () => ({
        peer: peerRef.current?.connectionState,
        signalR: signalRConnectionRef.current?.state,
        initialized: isInitializedRef.current,
      }),
    };

    (window as any).__vcDebug = dbg;
    return () => {
      if ((window as any).__vcDebug === dbg) {
        (window as any).__vcDebug = undefined;
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