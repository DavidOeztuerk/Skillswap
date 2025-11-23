import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import {
  initializeCall,
  toggleMic,
  toggleVideo,
  toggleScreenShare,
  toggleChat,
  addMessage,
  setLocalStream,
  setRemoteStream,
  setConnected,
  setLoading,
  setError,
  clearError,
} from '../features/videocall/videoCallSlice';
import { joinVideoCall, leaveVideoCall } from '../features/videocall/videocallThunks';
import { selectAuthUser } from '../store/selectors/authSelectors';
import { VideoCallConfig } from '../types/models/VideoCallConfig';
import { ChatMessage } from '../types/models/ChatMessage';
import videoCallService from '../api/services/videoCallService';
import { ApiResponse, isSuccessResponse } from '../types/api/UnifiedResponse';
import { withDefault } from '../utils/safeAccess';
import { getToken } from '../utils/authHelpers';
import {
  selectSessionId,
  selectRoomId,
  selectIsConnected,
  selectPeerId,
  selectLocalStream,
  selectRemoteStream,
  selectIsMicEnabled,
  selectIsVideoEnabled,
  selectIsScreenSharing,
  selectIsChatOpen,
  selectChatMessages,
  selectCallDuration,
  selectParticipants,
  selectVideocallLoading,
  selectVideocallError,
} from '../store/selectors/videoCallSelectors';
import { getWebRTCConfiguration } from '../utils/webrtcConfig';

export const useVideoCall = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);

  // ===== SELECTORS =====
  const sessionId = useAppSelector(selectSessionId);
  const roomId = useAppSelector(selectRoomId);
  const isConnected = useAppSelector(selectIsConnected);
  const peerId = useAppSelector(selectPeerId);
  const localStream = useAppSelector(selectLocalStream);
  const remoteStream = useAppSelector(selectRemoteStream);
  const isMicEnabled = useAppSelector(selectIsMicEnabled);
  const isVideoEnabled = useAppSelector(selectIsVideoEnabled);
  const isScreenSharing = useAppSelector(selectIsScreenSharing);
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const messages = useAppSelector(selectChatMessages);
  const callDuration = useAppSelector(selectCallDuration);
  const participants = useAppSelector(selectParticipants);
  const isLoading = useAppSelector(selectVideocallLoading);
  const error = useAppSelector(selectVideocallError);

  // ===== REFS =====
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const signalRConnectionRef = useRef<HubConnection | null>(null);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
  const isInitializedRef = useRef<boolean>(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===== KORRIGIERTE PEERCONNECTION MANAGEMENT =====
  const createPeerConnection = (config: VideoCallConfig): RTCPeerConnection => {
    console.log('🔧 Creating new RTCPeerConnection with config:', getWebRTCConfiguration());
    
    const pc = new RTCPeerConnection(getWebRTCConfiguration());
    
    console.log('🧊 ICE Servers:', getWebRTCConfiguration().iceServers);

    // WICHTIG: Event Handler vor dem Hinzufügen von Tracks setzen
    pc.ontrack = (event) => {
      console.log('🎥 ONTRACK EVENT FIRED!', {
        streams: event.streams.length,
        track: event.track?.kind,
        trackId: event.track?.id,
        trackState: event.track?.readyState
      });
      
      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];
        console.log('📹 Remote Stream erhalten mit Tracks:', 
          remoteStream.getTracks().map(t => ({
            kind: t.kind,
            id: t.id,
            enabled: t.enabled,
            readyState: t.readyState
          }))
        );
        
        dispatch(setRemoteStream(remoteStream));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE Candidate gefunden:', event.candidate);
        if (signalRConnectionRef.current && config.roomId) {
          const targetUserId = config.initiatorUserId === user?.id 
            ? config.participantUserId 
            : config.initiatorUserId;
          
          if (targetUserId) {
            signalRConnectionRef.current.invoke('SendIceCandidate', config.roomId, targetUserId, JSON.stringify(event.candidate.toJSON()))
              .catch(err => console.error('Failed to send ICE candidate:', err));
          }
        }
      } else {
        console.log('🧊 ICE Gathering complete');
      }
    };

    // VERBESSERT: Besseres Connection State Management
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('🔗 PeerConnection State:', state);
      
      if (state === 'connected') {
        dispatch(setConnected(true));
        console.log('✅ PeerConnection connected successfully');
      } else if (state === 'disconnected' || state === 'failed') {
        console.warn(`🔄 PeerConnection ${state}, attempting recovery...`);
        dispatch(setConnected(false));
        
        // VERBESSERT: Nicht sofort cleanen, erst nach Timeout
        setTimeout(() => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            console.warn('🔄 PeerConnection still disconnected, cleaning up...');
            cleanupResources(false);
          }
        }, 5000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('❄️ ICE Connection State:', pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling State:', pc.signalingState);
    };

    return pc;
  };

  const ensurePeerConnection = (config: VideoCallConfig): RTCPeerConnection => {
    const existingPc = peerRef.current;
    if (existingPc) {
      const isUsable = 
        existingPc.signalingState !== 'closed' && 
        existingPc.connectionState !== 'closed' &&
        existingPc.connectionState !== 'disconnected' &&
        existingPc.connectionState !== 'failed' &&
        existingPc.iceConnectionState !== 'disconnected' &&
        existingPc.iceConnectionState !== 'failed';
      
      if (isUsable) {
        console.log('✅ Reusing existing PeerConnection in state:', existingPc.connectionState);
        return existingPc;
      } else {
        console.log('🔄 Existing PC not usable, state:', {
          signaling: existingPc.signalingState,
          connection: existingPc.connectionState,
          ice: existingPc.iceConnectionState
        });
      }
    }

    // Neue PC erstellen
    console.log('🔄 Creating new PeerConnection');
    const pc = createPeerConnection(config);
    peerRef.current = pc;

    // Local Stream zur NEUEN PC hinzufügen
    const currentStream = localStreamRef.current;
    if (currentStream) {
      console.log('🎯 Adding local tracks to NEW PeerConnection');
      
      currentStream.getTracks().forEach(track => {
        try {
          if (track.readyState === 'ended') {
            console.warn(`⚠️ Track ${track.kind} is already ended, skipping`);
            return;
          }
          
          const sender = pc.addTrack(track, currentStream);
          console.log(`✅ Added ${track.kind} track to NEW PC, sender:`, sender);
        } catch (error) {
          console.error(`❌ Failed to add ${track.kind} track to NEW PC:`, error);
        }
      });
    } else {
      console.warn('⚠️ No local stream available for NEW PeerConnection');
    }
    
    return pc;
  };

  // 🔥 NEU: Handler für eingehende Answers
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerRef.current;
      if (!pc) {
        console.error('❌ No PeerConnection available for answer');
        return;
      }

      // Prüfe ob wir schon eine Remote Description haben
      if (pc.remoteDescription && pc.remoteDescription.type === 'answer') {
        console.warn('⚠️ Already have answer, ignoring duplicate');
        return;
      }

      console.log('📩 Setting remote description from answer');
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Verarbeite gepufferte ICE Candidates
      while (iceCandidatesBuffer.current.length > 0) {
        const candidate = iceCandidatesBuffer.current.shift();
        if (candidate) {
          try {
            await pc.addIceCandidate(candidate);
            console.log('🧊 Added buffered ICE candidate');
          } catch (e) {
            console.warn('⚠️ Failed to add buffered ICE candidate:', e);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  };

  // 🔥 NEU: Handler für eingehende ICE Candidates
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerRef.current;
      if (!pc) {
        console.warn('🧊 No PeerConnection yet, buffering ICE candidate');
        iceCandidatesBuffer.current.push(candidate);
        return;
      }

      // Prüfe ob wir schon eine Remote Description haben
      if (!pc.remoteDescription) {
        console.warn('🧊 No remote description yet, buffering ICE candidate');
        iceCandidatesBuffer.current.push(candidate);
        return;
      }

      await pc.addIceCandidate(candidate);
      console.log('🧊 Added incoming ICE candidate');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  };

  const createOfferForTarget = async (config: VideoCallConfig, targetUserId: string) => {
    try {
      if (!targetUserId) {
        console.warn('createOffer aborted: no targetUserId');
        return;
      }
      if (!config?.roomId) {
        console.warn('createOffer aborted: missing roomId in config');
        return;
      }

      console.log('🎯 Creating offer for target user:', targetUserId);

      const pc = ensurePeerConnection(config);

      if (!pc) {
        console.error('❌ createOffer: No PeerConnection available after ensure!');
        return;
      }

      // PRÜFE: Hat die PC Local Tracks?
      const senders = pc.getSenders();
      console.log('🔍 Current senders in PC:', senders.map(s => ({
        track: s.track?.kind,
        id: s.track?.id,
        enabled: s.track?.enabled,
        readyState: s.track?.readyState
      })));

      // FALLBACK: Wenn keine Tracks vorhanden sind, versuche Stream neu zu holen
      if (senders.length === 0) {
        console.log('🔄 No senders found, attempting to reacquire media stream...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });

          stream.getTracks().forEach(track => {
            try {
              pc.addTrack(track, stream);
              console.log(`✅ Added ${track.kind} track to PC during offer creation`);
            } catch (error) {
              console.error(`❌ Failed to add ${track.kind} track during offer:`, error);
            }
          });

          localStreamRef.current = stream;
          dispatch(setLocalStream(stream));
        } catch (streamError) {
          console.error('❌ Failed to reacquire media stream:', streamError);
        }
      }

      // Debug: Prüfe SDP vor createOffer
      console.log('🔍 PC state before createOffer:', {
        signalingState: pc.signalingState,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        senders: pc.getSenders().length
      });

      const offer = await pc.createOffer();

      // DEBUG: Prüfe das generierte SDP
      console.log('📋 Generated Offer SDP:', {
        type: offer.type,
        hasAudio: /m=audio/.test(offer.sdp || ''),
        hasVideo: /m=video/.test(offer.sdp || ''),
        hasBundle: /a=group:BUNDLE/.test(offer.sdp || '')
      });

      if (!offer.sdp || (!/m=audio/.test(offer.sdp) && !/m=video/.test(offer.sdp))) {
        console.error('❌ CRITICAL: Offer SDP contains no media lines!');
        console.log('SDP Content:', offer.sdp);
        return;
      }

      await pc.setLocalDescription(offer);

      if (!signalRConnectionRef.current) {
        console.warn('createOffer aborted: SignalR not connected');
        return;
      }

      console.log('📤 Sending offer to', targetUserId, 'room', config.roomId);
      await signalRConnectionRef.current.invoke('SendOffer', config.roomId, targetUserId, offer.sdp);

    } catch (err: any) {
      console.error('❌ createOffer failed:', err);
    }
  };

  // ===== KORRIGIERTE CLEANUP LOGIK =====
  const cleanupResources = useCallback((isFullCleanup: boolean = false) => {
    console.log('🧹 Cleaning up resources...', { 
      isFullCleanup, 
      isInitialized: isInitializedRef.current,
      hasPeerConnection: !!peerRef.current,
      hasSignalR: !!signalRConnectionRef.current
    });
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (!isInitializedRef.current && !peerRef.current && !signalRConnectionRef.current) {
      console.log('🔄 Skip cleanup - not initialized');
      return;
    }
    
    // PeerConnection schließen
    if (peerRef.current) {
      console.log('🔌 Closing PeerConnection');
      
      const pc = peerRef.current;
      console.log('📊 PeerConnection state before close:', {
        signalingState: pc.signalingState,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState
      });
      
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        pc.onsignalingstatechange = null;
      } catch (e) {
        console.warn('⚠️ Error removing PC event handlers:', e);
      }
      
      try {
        if (pc.signalingState !== 'closed' && pc.connectionState !== 'closed') {
          pc.close();
        }
      } catch (closeError) {
        console.warn('⚠️ Error closing PeerConnection:', closeError);
      }
      peerRef.current = null;
    }
    
    // SignalR Verbindung stoppen
    if (signalRConnectionRef.current) {
      console.log('📡 Stopping SignalR connection');
      try {
        signalRConnectionRef.current.stop().catch(err => 
          console.warn('⚠️ Error stopping SignalR:', err)
        );
      } catch (stopError) {
        console.warn('⚠️ Exception stopping SignalR:', stopError);
      }
      signalRConnectionRef.current = null;
    }
    
    // Clear ICE candidates buffer
    iceCandidatesBuffer.current = [];
    
    // Streams nur bei vollständigem Cleanup stoppen
    if (isFullCleanup) {
      const streamToStop = localStreamRef.current;
      if (streamToStop) {
        console.log('🛑 Stopping local stream tracks');
        streamToStop.getTracks().forEach(track => {
          try {
            if (track.readyState === 'live') {
              track.stop();
              console.log(`✅ Stopped ${track.kind} track`);
            }
          } catch (trackError) {
            console.warn(`⚠️ Error stopping ${track.kind} track:`, trackError);
          }
        });
        localStreamRef.current = null;
        dispatch(setLocalStream(null));
      }
      
      dispatch(setRemoteStream(null));
      dispatch(setConnected(false));
      
      isInitializedRef.current = false;
    }
  }, [dispatch]);

  // ===== KORRIGIERTE SETUP FUNKTIONEN =====
  const setupWebRTC = async (config: VideoCallConfig) => {
    if (isInitializedRef.current) {
      console.log('⚠️ setupWebRTC already initialized, skipping...');
      return;
    }

    isInitializedRef.current = true;

    try {
      console.log('🎥 Requesting media devices...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ MediaStream erhalten mit Tracks:', 
        stream.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      );
      
      localStreamRef.current = stream;
      dispatch(setLocalStream(stream));
      
      const pc = createPeerConnection(config);
      peerRef.current = pc;
      
      console.log('🔗 Adding tracks to initial PeerConnection');
      
      stream.getTracks().forEach(track => {
        try {
          if (track.readyState === 'ended') {
            console.warn(`⚠️ Track ${track.kind} is already ended, skipping`);
            return;
          }
          
          const sender = pc.addTrack(track, stream);
          console.log(`✅ Added ${track.kind} track to initial PC, sender:`, sender);
        } catch (error: any) {
          console.error(`❌ Failed to add ${track.kind} track:`, error);
        }
      });

      await setupSignalR(config);
      
      console.log('✅ WebRTC Setup completed with active stream');
      
    } catch (err: any) {
      console.error('❌ WebRTC Setup Error:', err);
      isInitializedRef.current = false;
      dispatch(setError(err?.message || 'Verbindungsaufbau fehlgeschlagen.'));
      cleanupResources(true);
    }
  };

  const setupSignalR = async (config: VideoCallConfig) => {
    const token = getToken();

    if (!token) {
      console.error("❌ Kein Token gefunden für SignalR");
      dispatch(setError("Authentifizierungsfehler beim Verbindungsaufbau"));
      return;
    }

    console.log("🔌 Starte SignalR Verbindung mit Token...");

    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/videocall/hub?roomId=${config.roomId}`, {
        accessTokenFactory: () => token
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 1000, 5000, 10000])
      .build();

    // 🔥 KORRIGIERT: UserJoined Event Handler
    connection.on('UserJoined', async (data: { userId: string; connectionId?: string }) => {
      try {
        const joinedUserId = data.userId;
        console.log('👥 UserJoined event received', {
          joinedUserId,
          me: user?.id,
          roomId: config.roomId
        });

        if (!joinedUserId || joinedUserId === user?.id) {
          console.log('👤 UserJoined: joiner is me -> ignore');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        if (config.initiatorUserId === user?.id) {
          console.log('🎯 I am initiator -> creating offer for', joinedUserId);
          await createOfferForTarget(config, joinedUserId);
        } else {
          console.log('👀 Not initiator -> waiting for offer');
        }
      } catch (err) {
        console.error('❌ UserJoined handler error:', err);
      }
    });

    // 🔥 KORRIGIERT: RoomJoined Event Handler
    connection.on('RoomJoined', (data: { roomId: string; participants: string[] }) => {
      console.log('🏠 RoomJoined', data);
    });

    // 🔥 KORRIGIERT: ReceiveOffer mit besserem Error Handling
    connection.on('ReceiveOffer', async (data: { fromUserId: string; offer: string }) => {
      const { fromUserId, offer } = data;
      console.log('📩 ReceiveOffer from', fromUserId);
      try {
        const pc = ensurePeerConnection(config);
        if (!pc) {
          throw new Error('PeerConnection not available for offer');
        }

        if (pc.remoteDescription && pc.remoteDescription.type) {
          console.warn('⚠️ Already have remote description, ignoring duplicate offer');
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offer }));

        // Verarbeite gepufferte ICE Candidates
        while (iceCandidatesBuffer.current.length > 0) {
          const candidate = iceCandidatesBuffer.current.shift();
          if (candidate) {
            try {
              await pc.addIceCandidate(candidate);
              console.log('🧊 Added buffered ICE candidate');
            } catch (e) {
              console.warn('⚠️ Failed to add buffered ICE candidate:', e);
            }
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (connection.state === 'Connected') {
          await connection.invoke('SendAnswer', config.roomId, fromUserId, answer.sdp);
          console.log('📤 Sent Answer to', fromUserId);
        } else {
          console.warn('⚠️ SignalR not connected, cannot send answer');
        }
      } catch (e) {
        console.error('❌ Error handling ReceiveOffer', e);
      }
    });

    // 🔥 NEU: ReceiveAnswer Handler
    connection.on('ReceiveAnswer', async (data: { fromUserId: string; answer: string }) => {
      const { fromUserId, answer } = data;
      console.log('📩 ReceiveAnswer from', fromUserId);
      try {
        await handleAnswer({ type: 'answer', sdp: answer });
      } catch (error) {
        console.error('❌ Error handling ReceiveAnswer:', error);
      }
    });

    // 🔥 NEU: ReceiveIceCandidate Handler
    connection.on('ReceiveIceCandidate', async (data: { fromUserId: string; candidate: string }) => {
      const { fromUserId, candidate } = data;
      console.log('🧊 ReceiveIceCandidate from', fromUserId);
      try {
        const candidateObj = JSON.parse(candidate);
        await handleIceCandidate(candidateObj);
      } catch (error) {
        console.error('❌ Error handling ReceiveIceCandidate:', error);
      }
    });

    // Chat message handler - receives messages from other users via SignalR
    connection.on('ChatMessage', (data: { userId: string; message: string; timestamp: string }) => {
      console.log('💬 ChatMessage received:', data);
      if (data.userId !== user?.id) {
        const chatMessage: ChatMessage = {
          id: Date.now().toString(),
          sessionId: sessionId || '',
          senderId: data.userId,
          senderName: 'Other User', // TODO: Get actual user name
          message: data.message,
          sentAt: data.timestamp,
          messageType: 'Text'
        };
        dispatch(addMessage(chatMessage));
      }
    });

    // Connection lifecycle
    connection.onclose((error) => {
      console.warn('🔌 SignalR connection closed', error);
      dispatch(setConnected(false));
      if (signalRConnectionRef.current === connection) {
        signalRConnectionRef.current = null;
      }

      if (isInitializedRef.current) {
        console.log('🔄 Attempting to reconnect...');
        reconnectTimeoutRef.current = setTimeout(() => setupSignalR(config), 2000);
      }
    });

    connection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting...', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected:', connectionId);
      dispatch(setConnected(true));
    });

    try {
      await connection.start();
      console.log('✅ SignalR connected, connectionId=', connection.connectionId);
      signalRConnectionRef.current = connection;
      dispatch(setConnected(true));

      if (config.roomId) {
        try {
          await connection.invoke('JoinRoom', config.roomId);
          console.log('✅ Joined room:', config.roomId);
        } catch (joinErr) {
          console.warn('⚠️ JoinRoom failed:', joinErr);
        }
      }
    } catch (startErr) {
      console.error('❌ SignalR start failed:', startErr);
      dispatch(setError('SignalR-Verbindung fehlgeschlagen'));
      throw startErr;
    }
  };

  // ===== KORRIGIERTE ACTIONS =====
  const handleToggleScreenSharing = useCallback(async () => {
    if (!peerRef.current) {
      console.warn('⚠️ Cannot toggle screen share: Peer connection not established');
      return;
    }

    try {
      if (isScreenSharing) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];

        const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
        localStreamRef.current = stream;
        dispatch(setLocalStream(stream));
        dispatch(toggleScreenShare());

        if (signalRConnectionRef.current && roomId) {
          signalRConnectionRef.current.invoke('StopScreenShare', roomId);
        }

      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          if (isScreenSharing) handleToggleScreenSharing();
        };

        const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        const newStream = new MediaStream([
          screenTrack,
          ...(localStreamRef.current?.getAudioTracks() || [])
        ]);

        localStreamRef.current = newStream;
        dispatch(setLocalStream(newStream));
        dispatch(toggleScreenShare());

        if (signalRConnectionRef.current && roomId) {
          signalRConnectionRef.current.invoke('StartScreenShare', roomId);
        }
      }
    } catch (err) {
      console.error('❌ Error toggling screen share:', err);
      dispatch(setError('Bildschirmfreigabe fehlgeschlagen'));
    }
  }, [dispatch, isScreenSharing, roomId]);

  const actions = useMemo(() => ({
    startVideoCall: async (appointmentId: string) => {
      try {
        if (isInitializedRef.current) {
          console.warn('⚠️ Video call already initialized, skipping start...');
          return;
        }

        dispatch(setLoading(true));

        let configResponse: ApiResponse<VideoCallConfig>;

        // Try to get existing call config first
        configResponse = await videoCallService.getCallConfig(appointmentId);

        // If failed (session ended/not found), create a new session
        if (!isSuccessResponse(configResponse)) {
          console.warn("📞 No active session found, creating new session for appointment:", appointmentId);
          configResponse = await videoCallService.createCallRoom(appointmentId);
        }

        if (!isSuccessResponse(configResponse) || !configResponse.data) {
          throw new Error('Konnte Anruf-Konfiguration nicht laden.');
        }

        const config = configResponse.data;
        console.log("📞 Initialisiere Call mit Config:", config);

        dispatch(initializeCall({
          ...config,
          peerId: config.participantUserId || ""
        }));

        await setupWebRTC(config);

        if (config.sessionId) {
          try {
            const connId = signalRConnectionRef.current?.connectionId ?? undefined;
            await dispatch(joinVideoCall({ sessionId: config.sessionId, connectionId: connId })).unwrap();
          } catch (joinError) {
            console.warn('⚠️ API Join failed (User likely already in session):', joinError);
          }
        }

      } catch (err: any) {
        console.error('❌ Start Video Call Failed:', err);
        dispatch(setError(err.message || 'Fehler beim Starten des Anrufs'));
        cleanupResources(true);
      } finally {
        dispatch(setLoading(false));
      }
    },

    endCall: async () => {
      console.log('📞 Ending call with full cleanup');

      // CRITICAL FIX: Wait for /leave API call to complete BEFORE cleanup
      // This ensures DB is updated before SignalR disconnect
      if (sessionId) {
        try {
          console.log('📡 Calling /leave API endpoint with sessionId:', sessionId);
          await dispatch(leaveVideoCall(sessionId)).unwrap();
          console.log('✅ Successfully left call via API');
        } catch (e) {
          console.error('❌ Failed to leave call via API:', e);
          // Continue with cleanup even if API call fails
        }
      } else {
        console.warn('⚠️ No sessionId available, skipping /leave API call');
      }

      // Now cleanup local resources and disconnect SignalR
      cleanupResources(true);
    },

    hangUp: async () => {
      console.log('📞 Hanging up call');
      await actions.endCall();
    },

    toggleMicrophone: async () => {
      const currentStream = localStreamRef.current || localStream;
      if (currentStream) {
        currentStream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
        dispatch(toggleMic());
        if (signalRConnectionRef.current && roomId) {
          signalRConnectionRef.current.invoke('ToggleMicrophone', roomId, !isMicEnabled);
        }
      }
    },

    toggleCamera: async () => {
      const currentStream = localStreamRef.current || localStream;
      if (currentStream) {
        currentStream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
        dispatch(toggleVideo());
        if (signalRConnectionRef.current && roomId) {
          signalRConnectionRef.current.invoke('ToggleCamera', roomId, !isVideoEnabled);
        }
      }
    },

    toggleChatPanel: () => {
      dispatch(toggleChat());
    },

    sendChatMessage: async (content: string) => {
      if (signalRConnectionRef.current && sessionId && roomId && user) {
        const senderName = withDefault(user.firstName, 'Ich');
        const msg: ChatMessage = {
          id: Date.now().toString(),
          sessionId: sessionId,
          senderId: user.id,
          senderName: senderName,
          message: content,
          sentAt: new Date().toISOString(),
          messageType: 'Text'
        };

        // Add message to local state immediately (optimistic update)
        dispatch(addMessage(msg));

        try {
          // Send message via SignalR for real-time delivery to other participants
          await signalRConnectionRef.current.invoke('SendChatMessage', roomId, content);
          console.log('✅ Chat message sent via SignalR');
        } catch (e) {
          console.error("❌ Error sending chat message:", e);
        }
      } else {
        console.warn('⚠️ Cannot send message - missing sessionId, roomId or user');
      }
    },

    toggleScreenSharing: handleToggleScreenSharing

  }), [
    dispatch, roomId, localStream, user, isMicEnabled, isVideoEnabled,
    handleToggleScreenSharing, cleanupResources
  ]);

  useEffect(() => {
    return () => {
      console.log('🔄 useVideoCall unmounting - performing cleanup');
      cleanupResources(true);
    };
  }, [cleanupResources]);

  // Debug helper
  useEffect(() => {
    try {
      const dbg = {
        getPeer: () => peerRef.current,
        getLocalStream: () => localStreamRef.current || localStream,
        getSignalR: () => signalRConnectionRef.current,
        isInitialized: () => isInitializedRef.current,
        listSenders: () => {
          const pc = peerRef.current;
          if (!pc) return [] as any[];
          return pc.getSenders().map(s => ({
            kind: s.track?.kind,
            state: s.track?.readyState,
            id: s.track?.id,
            enabled: s.track?.enabled
          }));
        },
        listReceivers: () => {
          const pc = peerRef.current;
          if (!pc) return [] as any[];
          return pc.getReceivers().map(r => ({
            kind: r.track?.kind,
            state: r.track?.readyState,
            id: r.track?.id
          }));
        },
        getConnectionState: () => ({
          peer: peerRef.current?.connectionState,
          signalR: signalRConnectionRef.current?.state,
          initialized: isInitializedRef.current
        })
      };
      (window as any).__vcDebug = dbg;
      return () => {
        try {
          if ((window as any).__vcDebug === dbg) (window as any).__vcDebug = undefined;
        } catch { }
      };
    } catch (e) {
      console.warn('Could not install vc debug helpers', e);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 Redux State Update - Local Stream:',
      localStream ? `HAS STREAM (${localStream.getTracks().length} tracks)` : 'NO STREAM'
    );
  }, [localStream]);

  // Heartbeat system - keep session alive by sending heartbeat every 30 seconds
  useEffect(() => {
    if (!isConnected || !roomId || !signalRConnectionRef.current) {
      return;
    }

    console.log('💓 [Heartbeat] Starting heartbeat timer for session:', roomId);

    const heartbeatInterval = setInterval(async () => {
      if (signalRConnectionRef.current && roomId) {
        try {
          await signalRConnectionRef.current.invoke('SendHeartbeat', roomId);
          console.log('💓 [Heartbeat] Sent heartbeat for session:', roomId);
        } catch (error) {
          console.error('❌ [Heartbeat] Failed to send heartbeat:', error);
        }
      }
    }, 30000); // Every 30 seconds

    // Cleanup on unmount or disconnect
    return () => {
      console.log('💓 [Heartbeat] Stopping heartbeat timer');
      clearInterval(heartbeatInterval);
    };
  }, [isConnected, roomId]);

  return {
    sessionId, roomId, isConnected, peerId, localStream, remoteStream,
    isMicEnabled, isVideoEnabled, isScreenSharing, isChatOpen,
    messages, callDuration, participants, isLoading, error,
    ...actions,
    toggleScreenSharing: actions.toggleScreenSharing,
    hangUp: actions.hangUp,
    clearError: () => dispatch(clearError())
  };
};