import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
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
  resetCall,
  clearError,
} from '../features/videocall/videoCallSlice';
import {
  endVideoCall,
} from '../features/videocall/videocallThunks';
import { selectAuthUser } from '../store/selectors/authSelectors';
import { VideoCallConfig } from '../types/models/VideoCallConfig';
import { SignalData } from '../store/adapters/videoCallAdapter+State';
import { ChatMessage } from '../types/models/ChatMessage';
import videoCallService from '../api/services/videoCallService';
import { ApiResponse, isSuccessResponse } from '../types/api/UnifiedResponse';
import { withDefault } from '../utils/safeAccess';
import { selectRoomId, selectIsConnected, selectPeerId, selectLocalStream, selectRemoteStream, selectIsMicEnabled, selectIsVideoEnabled, selectIsScreenSharing, selectIsChatOpen, selectChatMessages, selectCallDuration, selectParticipants, selectVideocallLoading, selectVideocallError } from '../store/selectors/videoCallSelectors';

/**
 * 🚀 ROBUSTE USEVIDEOCALL HOOK 
 * 
 * ✅ Stateless Design - nur Redux State + Actions
 * ✅ Memoized Functions - prevents unnecessary re-renders
 * ✅ WebRTC + SignalR Integration
 * 
 * CRITICAL: Contains WebRTC logic that requires careful state management
 * Complex real-time communication requires some useEffect for cleanup
 */
export const useVideoCall = () => {
  const dispatch = useAppDispatch();
  
  // ===== SELECTORS =====
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
  const user = useAppSelector(selectAuthUser);

  // ===== WEBRTC REFS (Required for real-time communication) =====
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const signalRConnectionRef = useRef<HubConnection | null>(null);

  // ===== MEMOIZED ACTIONS =====
  const actions = useMemo(() => ({
    
    // === CALL MANAGEMENT ===
    startVideoCall: async (appointmentId: string) => {
      try {
        dispatch(setLoading(true));
        
        // Get configuration or create new room
        let config: ApiResponse<VideoCallConfig>;
        try {
          config = await videoCallService.getCallConfig(appointmentId);
        } catch {
          // If no room exists, create a new one
          config = await videoCallService.createCallRoom(appointmentId);
        }

        if (isSuccessResponse(config)) {
          dispatch(initializeCall(config.data));
          await setupWebRTC(config.data);
        }
        
        dispatch(setLoading(false));
      } catch (error) {
        console.error('Failed to start video call:', error);
        dispatch(setError('Failed to start video call'));
        dispatch(setLoading(false));
      }
    },

    endCall: () => {
      return dispatch(endVideoCall(roomId || ''));
    },

    // === MEDIA CONTROLS ===
    toggleMicrophone: () => {
      if (localStream) {
        const audioTracks = localStream?.getAudioTracks();
        audioTracks.forEach((track) => {
          if (track) {
            track.enabled = !track.enabled;
          }
        });
        dispatch(toggleMic());
      }
    },

    toggleCamera: () => {
      if (localStream) {
        const videoTracks = localStream?.getVideoTracks();
        videoTracks.forEach((track) => {
          if (track) {
            track.enabled = !track.enabled;
          }
        });
        dispatch(toggleVideo());
      }
    },

    toggleChatPanel: () => {
      dispatch(toggleChat());
    },

    // === CHAT OPERATIONS ===
    sendChatMessage: async (content: string) => {
      if (!signalRConnectionRef.current || !roomId) return;

      try {
        const timestamp = new Date().toISOString();
        const userId = user?.id;
        const username = withDefault(user?.firstName, 'Unbekannt');

        const message: ChatMessage = {
          id: `${userId}-${timestamp}`,
          senderId: userId ?? "",
          senderName: username,
          content,
          timestamp,
        };

        await signalRConnectionRef.current.invoke('SendMessage', roomId, message);
        dispatch(addMessage({ 
          id: Date.now().toString(), 
          timestamp: new Date().toISOString(), 
          senderId: userId ?? "", 
          senderName: username, 
          content 
        }));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },

  }), [dispatch, roomId, localStream, user]);

  // ===== SCREEN SHARING ACTION (Complex WebRTC logic) =====
  const toggleScreenSharing = useCallback(async (): Promise<void> => {
    if (!peerRef.current) return;

    try {
      if (isScreenSharing) {
        // Switch back to camera
        const stream = await navigator?.mediaDevices?.getUserMedia({
          video: true,
          audio: true,
        });

        if (!stream) {
          throw new Error('Could not access media devices');
        }

        // Remove old tracks
        const senders = peerRef.current.getSenders();
        senders.forEach((sender) => {
          if (sender.track && sender.track.kind === 'video') {
            peerRef.current?.removeTrack(sender);
          }
        });

        // Add new tracks
        const newTracks = stream?.getTracks();
        newTracks.forEach((track) => {
          if (track) {
            peerRef.current?.addTrack(track, stream);
          }
        });

        dispatch(setLocalStream(stream));
      } else {
        // Switch to screen sharing
        const screenStream = await navigator?.mediaDevices?.getDisplayMedia({
          video: true,
        });

        if (!screenStream) {
          throw new Error('Could not access display media');
        }

        // Remove old video tracks
        const senders = peerRef.current?.getSenders();
        senders.forEach((sender) => {
          if (sender?.track && sender.track.kind === 'video') {
            peerRef.current?.removeTrack(sender);
          }
        });

        // Add screen share track
        screenStream.getTracks().forEach((track) => {
          if (track.kind === 'video') {
            peerRef.current?.addTrack(track, screenStream);
          }
        });

        // Keep audio tracks from original stream
        const newStream = new MediaStream();

        // Add screen share tracks
        const screenTracks = screenStream?.getTracks();
        screenTracks.forEach((track) => {
          if (track) {
            newStream.addTrack(track);
          }
        });

        // Add audio tracks from local stream
        if (localStream) {
          const audioTracks = localStream?.getAudioTracks();
          audioTracks.forEach((track) => {
            if (track) {
              newStream.addTrack(track);
            }
          });
        }

        dispatch(setLocalStream(newStream));

        // Event handler for end of screen sharing
        const videoTracks = screenStream?.getVideoTracks();
        if (videoTracks[0]) {
          videoTracks[0].onended = () => {
            dispatch(toggleScreenShare());
            void toggleScreenSharing();
          };
        }
      }

      dispatch(toggleScreenShare());
    } catch (error) {
      console.error('Error toggling screen share:', error);
      dispatch(setError('Failed to toggle screen sharing'));
    }
  }, [dispatch, isScreenSharing, localStream]);

  // ===== WEBRTC SETUP FUNCTIONS (Internal - Complex real-time logic) =====
  const setupWebRTC = async (config: VideoCallConfig): Promise<void> => {
    try {
      // Request media stream
      const stream = await navigator?.mediaDevices?.getUserMedia({
        video: true,
        audio: true,
      });

      if (!stream) {
        throw new Error('Could not access media devices');
      }

      dispatch(setLocalStream(stream));

      // Create WebRTC Peer Connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerRef.current = peerConnection;

      // Add local stream to peer connection
      const tracks = stream?.getTracks();
      tracks.forEach((track) => {
        if (track) {
          peerConnection.addTrack(track, stream);
        }
      });

      // Event handler for incoming streams
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          dispatch(setRemoteStream(event.streams[0]));
        }
      };

      // Setup SignalR connection
      await setupSignalR(config);

      // Join room
      dispatch(setConnected(true));
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      dispatch(setError('Failed to setup WebRTC'));
    }
  };

  // ===== SIGNALR SETUP (Complex real-time signaling) =====
  const setupSignalR = async (config: VideoCallConfig): Promise<void> => {
    try {
      const connection = new HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/videocall/hub`)
        .configureLogging(LogLevel.Information)
        .build();

      // Setup event handlers for WebRTC signaling and chat
      connection.on('ReceiveSignal', async (senderId: string, signal: SignalData) => {
        if (senderId !== config.peerId || !peerRef.current) return;
        // Handle WebRTC signaling (offer/answer/candidate)
        try {
          if (signal.type === 'offer') {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription({
              type: 'offer', sdp: signal.sdp,
            }));
            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            await connection.invoke('SendSignal', config.peerId, {
              type: 'answer', sdp: answer.sdp,
            });
          } else if (signal.type === 'answer') {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription({
              type: 'answer', sdp: signal.sdp,
            }));
          } else if (signal.type === 'candidate') {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } catch (error) {
          console.error('Error handling signal:', error);
        }
      });

      connection.on('ReceiveMessage', (message: ChatMessage) => {
        dispatch(addMessage(message));
      });

      connection.on('UserJoined', (userId: string) => {
        if (userId === config.peerId && peerRef.current) {
          void createOffer();
        }
      });

      connection.on('UserLeft', () => {
        dispatch(setRemoteStream(null));
      });

      connection.on('CallEnded', () => {
        dispatch(resetCall());
        cleanUp();
      });

      await connection.start();
      signalRConnectionRef.current = connection;
      await connection.invoke('JoinRoom', config.roomId, config.userId);
    } catch (error) {
      console.error('Error setting up SignalR:', error);
      dispatch(setError('Failed to setup SignalR'));
    }
  };

  const createOffer = async (): Promise<void> => {
    if (!peerRef.current || !signalRConnectionRef.current || !peerId) return;
    try {
      peerRef.current.onicecandidate = (event) => {
        if (event.candidate && signalRConnectionRef.current) {
          void signalRConnectionRef.current.invoke('SendSignal', peerId, {
            type: 'candidate', candidate: event.candidate,
          });
        }
      };
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      await signalRConnectionRef.current.invoke('SendSignal', peerId, {
        type: 'offer', sdp: offer.sdp,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // ===== CLEANUP FUNCTION (Required for WebRTC resources) =====
  const hangUp = useCallback(async (): Promise<void> => {
    if (roomId) {
      try {
        await videoCallService.endCall(roomId);
        dispatch(endVideoCall(roomId));
        cleanUp();
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
  }, [roomId, dispatch]);

  const cleanUp = useCallback((): void => {
    // Close SignalR connection
    if (signalRConnectionRef.current) {
      void signalRConnectionRef.current.stop();
      signalRConnectionRef.current = null;
    }

    // Close WebRTC connection
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    // Stop streams
    if (localStream) {
      const tracks = localStream?.getTracks();
      tracks.forEach((track) => {
        if (track?.stop) {
          track.stop();
        }
      });
      dispatch(setLocalStream(null));
    }

    if (remoteStream) {
      dispatch(setRemoteStream(null));
    }

    dispatch(setConnected(false));
    dispatch(resetCall());
  }, [dispatch, localStream, remoteStream]);

  // ===== CLEANUP ON UNMOUNT (Required for WebRTC resources) =====
  useEffect(() => {
    return () => {
      // Direct cleanup without dependency on cleanUp function
      if (signalRConnectionRef.current) {
        void signalRConnectionRef.current.stop();
        signalRConnectionRef.current = null;
      }

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      if (localStream) {
        const tracks = localStream?.getTracks();
        tracks.forEach((track) => {
          if (track?.stop) {
            track.stop();
          }
        });
      }
    };
  }, []); // Empty dependencies - only on unmount

  // ===== RETURN OBJECT =====
  return {
    // === STATE DATA ===
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
    
    // === LOADING STATES ===
    isLoading,
    
    // === ERROR STATES ===
    error,
    
    // === ACTIONS ===
    ...actions,
    toggleScreenSharing,
    hangUp,

    // === LEGACY COMPATIBILITY ===
    startVideoCall: actions.startVideoCall,
    toggleMicrophone: actions.toggleMicrophone,
    toggleCamera: actions.toggleCamera,
    toggleChatPanel: actions.toggleChatPanel,
    sendChatMessage: actions.sendChatMessage,
    endCall: actions.endCall,
    clearError: () => dispatch(clearError()),
  };
};
