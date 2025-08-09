// src/hooks/useVideoCall.ts
import { useCallback, useEffect, useRef } from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { withDefault, ensureString, ensureArray } from '../utils/safeAccess';
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
  endVideoCall,
} from '../features/videocall/videoCallSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { VideoCallConfig } from '../types/models/VideoCallConfig';
import { SignalData } from '../types/states/VideoCallState';
import { ChatMessage } from '../types/models/ChatMessage';
import videoCallService from '../api/services/videoCallService';

/**
 * Hook für die Videoanruf-Funktionalität
 * Verwaltet WebRTC-Verbindung und SignalR für Signalisierung
 */
export const useVideoCall = () => {
  const dispatch = useAppDispatch();
  const {
    roomId,
    isConnected,
    // peerId,
    localStream,
    remoteStream,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    messages,
    isLoading,
    error,
  } = useAppSelector((state) => state.videoCall);

  // Referenzen für WebRTC und SignalR
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const signalRConnectionRef = useRef<HubConnection | null>(null);

  /**
   * Initialisiert einen Videoanruf mit den gegebenen Konfigurationsdaten
   * @param appointmentId - ID des Termins, für den der Anruf gestartet wird
   */
  const startVideoCall = async (appointmentId: string): Promise<void> => {
    try {
      dispatch(setLoading(true));
      
      // Hole Konfiguration oder erstelle neuen Raum
      let config: VideoCallConfig;
      try {
        config = await videoCallService.getCallConfig(appointmentId);
      } catch {
        // Falls kein Raum existiert, erstelle einen neuen
        config = await videoCallService.createCallRoom(appointmentId);
      }

      dispatch(initializeCall(config));
      await setupWebRTC(config);
      
      dispatch(setLoading(false));
    } catch (error) {
      console.error('Failed to start video call:', error);
      dispatch(setError({ message: 'Fehler beim Starten des Videoanrufs' }));
      dispatch(setLoading(false));
    }
  };

  /**
   * Konfiguriert WebRTC und startet Media-Streams
   * @param config - Konfiguration für den Videoanruf
   */
  const setupWebRTC = async (config: VideoCallConfig): Promise<void> => {
    try {
      // Media-Stream anfordern
      const stream = await navigator?.mediaDevices?.getUserMedia({
        video: true,
        audio: true,
      });

      if (!stream) {
        throw new Error('Could not access media devices');
      }

      dispatch(setLocalStream(stream));

      // WebRTC Peer Connection erstellen
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerRef.current = peerConnection;

      // Lokalen Stream zur Peer Connection hinzufügen
      const tracks = ensureArray(stream?.getTracks());
      tracks.forEach((track) => {
        if (track) {
          peerConnection.addTrack(track, stream);
        }
      });

      // Event-Handler für eingehende Streams
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          dispatch(setRemoteStream(event.streams[0]));
        }
      };

      // SignalR-Verbindung aufbauen
      await setupSignalR(config);

      // Raum beitreten
      dispatch(setConnected(true));
      dispatch(setConnected(true));
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      dispatch(setError({ message: 'Fehler beim Einrichten der WebRTC-Verbindung' }));
    }
  };

  /**
   * Konfiguriert SignalR für die Signalisierung
   * @param config - Konfiguration für den Videoanruf
   */
  const setupSignalR = async (config: VideoCallConfig): Promise<void> => {
    try {
      const connection = new HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/videocall/hub`)
        .configureLogging(LogLevel.Information)
        .build();

      // Event-Handler für eingehende Signale
      connection.on(
        'ReceiveSignal',
        async (senderId: string, signal: SignalData) => {
          if (senderId !== config.peerId || !peerRef.current) return;

          try {
            if (signal.type === 'offer') {
              await peerRef.current.setRemoteDescription(
                new RTCSessionDescription({
                  type: 'offer',
                  sdp: signal.sdp,
                })
              );

              const answer = await peerRef.current.createAnswer();
              await peerRef.current.setLocalDescription(answer);

              await connection.invoke('SendSignal', config.peerId, {
                type: 'answer',
                sdp: answer.sdp,
              });
            } else if (signal.type === 'answer') {
              await peerRef.current.setRemoteDescription(
                new RTCSessionDescription({
                  type: 'answer',
                  sdp: signal.sdp,
                })
              );
            } else if (signal.type === 'candidate') {
              await peerRef.current.addIceCandidate(
                new RTCIceCandidate(signal.candidate)
              );
            }
          } catch (error) {
            console.error('Error handling signal:', error);
          }
        }
      );

      // Event-Handler für eingehende Chat-Nachrichten
      connection.on('ReceiveMessage', (message: ChatMessage) => {
        dispatch(addMessage(message));
      });

      // Event-Handler für den Status anderer Benutzer
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

      // Verbindung starten
      await connection.start();
      signalRConnectionRef.current = connection;

      // Raum beitreten
      await connection.invoke('JoinRoom', config.roomId, config.userId);
    } catch (error) {
      console.error('Error setting up SignalR:', error);
      dispatch(setError({ message: 'Fehler beim Einrichten der SignalR-Verbindung' }));
    }
  };

  /**
   * Erstellt ein WebRTC-Angebot für die Verbindung
   */
  const createOffer = async (): Promise<void> => {
    const peerId = useAppSelector((state) => state.videoCall.peerId);
    
    if (!peerRef.current || !signalRConnectionRef.current || !peerId) return;

    try {
      // ICE-Kandidaten registrieren
      peerRef.current.onicecandidate = (event) => {
        if (event.candidate && signalRConnectionRef.current) {
          void signalRConnectionRef.current.invoke('SendSignal', peerId, {
            type: 'candidate',
            candidate: event.candidate,
          });
        }
      };

      // Angebot erstellen
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);

      // Angebot senden
      await signalRConnectionRef.current.invoke('SendSignal', peerId, {
        type: 'offer',
        sdp: offer.sdp,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  /**
   * Wechselt den Mikrofonstatus (an/aus)
   */
  const toggleMicrophone = (): void => {
    if (localStream) {
      const audioTracks = ensureArray(localStream?.getAudioTracks());
      audioTracks.forEach((track) => {
        if (track) {
          track.enabled = !track.enabled;
        }
      });
      dispatch(toggleMic());
    }
  };

  /**
   * Wechselt den Videostatus (an/aus)
   */
  const toggleCamera = (): void => {
    if (localStream) {
      const videoTracks = ensureArray(localStream?.getVideoTracks());
      videoTracks.forEach((track) => {
        if (track) {
          track.enabled = !track.enabled;
        }
      });
      dispatch(toggleVideo());
    }
  };

  /**
   * Wechselt zwischen Bildschirmfreigabe und Kamera
   */
  const toggleScreenSharing = async (): Promise<void> => {
    if (!peerRef.current) return;

    try {
      if (isScreenSharing) {
        // Zurück zur Kamera wechseln
        const stream = await navigator?.mediaDevices?.getUserMedia({
          video: true,
          audio: true,
        });

        if (!stream) {
          throw new Error('Could not access media devices');
        }

        // Alte Tracks entfernen
        const senders = peerRef.current.getSenders();
        senders.forEach((sender) => {
          if (sender.track && sender.track.kind === 'video') {
            peerRef.current?.removeTrack(sender);
          }
        });

        // Neue Tracks hinzufügen
        const newTracks = ensureArray(stream?.getTracks());
        newTracks.forEach((track) => {
          if (track) {
            peerRef.current?.addTrack(track, stream);
          }
        });

        dispatch(setLocalStream(stream));
      } else {
        // Zu Bildschirmfreigabe wechseln
        const screenStream = await navigator?.mediaDevices?.getDisplayMedia({
          video: true,
        });

        if (!screenStream) {
          throw new Error('Could not access display media');
        }

        // Alte Video-Tracks entfernen
        const senders = ensureArray(peerRef.current?.getSenders());
        senders.forEach((sender) => {
          if (sender?.track && sender.track.kind === 'video') {
            peerRef.current?.removeTrack(sender);
          }
        });

        // Bildschirmfreigabe-Track hinzufügen
        screenStream.getTracks().forEach((track) => {
          if (track.kind === 'video') {
            peerRef.current?.addTrack(track, screenStream);
          }
        });

        // Audio-Tracks vom ursprünglichen Stream behalten
        const newStream = new MediaStream();

        // Bildschirmfreigabe-Tracks hinzufügen
        const screenTracks = ensureArray(screenStream?.getTracks());
        screenTracks.forEach((track) => {
          if (track) {
            newStream.addTrack(track);
          }
        });

        // Audio-Tracks vom lokalen Stream hinzufügen
        if (localStream) {
          const audioTracks = ensureArray(localStream?.getAudioTracks());
          audioTracks.forEach((track) => {
            if (track) {
              newStream.addTrack(track);
            }
          });
        }

        dispatch(setLocalStream(newStream));

        // Event-Handler für das Ende der Bildschirmfreigabe
        const videoTracks = ensureArray(screenStream?.getVideoTracks());
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
      dispatch(setError({ message: 'Fehler beim Wechseln der Bildschirmfreigabe' }));
    }
  };

  /**
   * Öffnet/schließt das Chat-Panel
   */
  const toggleChatPanel = (): void => {
    dispatch(toggleChat());
  };

  const userId = ensureString(useAppSelector((state) => state.auth.user?.id));
  const username = withDefault(
    useAppSelector((state) => state.auth.user?.firstName),
    'Unbekannt'
  );

  /**
   * Sendet eine Chat-Nachricht
   * @param content - Inhalt der Nachricht
   */
  const sendChatMessage = async (content: string): Promise<void> => {
    if (!signalRConnectionRef.current || !roomId) return;

    try {
      const timestamp = new Date().toISOString();

      const message: ChatMessage = {
        id: `${userId}-${timestamp}`,
        senderId: userId,
        senderName: username,
        content,
        timestamp,
      };

      await signalRConnectionRef.current.invoke('SendMessage', roomId, message);
      dispatch(addMessage({ id: Date.now().toString(), timestamp: new Date().toISOString(), senderId: userId, senderName: username, content }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  /**
   * Beendet den Videoanruf
   */
  const hangUp = async (): Promise<void> => {
    if (roomId) {
      try {
        await videoCallService.endCall(roomId);
        dispatch(endVideoCall(roomId));
        cleanUp();
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
  };

  /**
   * Räumt Ressourcen nach dem Anruf auf
   */
  const cleanUp = useCallback((): void => {
    // SignalR-Verbindung schließen
    if (signalRConnectionRef.current) {
      void signalRConnectionRef.current.stop();
      signalRConnectionRef.current = null;
    }

    // WebRTC-Verbindung schließen
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    // Streams stoppen
    if (localStream) {
      const tracks = ensureArray(localStream?.getTracks());
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

  // Räumt Ressourcen auf, wenn die Komponente unmounted wird
  useEffect(() => {
    return () => {
      // Cleanup direkt ausführen ohne Dependency auf cleanUp
      // SignalR-Verbindung schließen
      if (signalRConnectionRef.current) {
        void signalRConnectionRef.current.stop();
        signalRConnectionRef.current = null;
      }

      // WebRTC-Verbindung schließen
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      // Streams stoppen
      if (localStream) {
        const tracks = ensureArray(localStream?.getTracks());
        tracks.forEach((track) => {
          if (track?.stop) {
            track.stop();
          }
        });
      }
    };
  }, []); // Leere Dependencies - nur beim Unmount

  return {
    // Zustand
    roomId,
    isConnected,
    localStream,
    remoteStream,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    messages,
    isLoading,
    error,

    // Aktionen
    startVideoCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenSharing,
    toggleChatPanel,
    sendChatMessage,
    hangUp,
  };
};
