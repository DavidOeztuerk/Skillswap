// src/hooks/useVideoCall.ts
import { useCallback, useEffect, useRef } from 'react';
import {
  HubConnection,
  // HubConnectionBuilder,
  // LogLevel,
} from '@microsoft/signalr';
import {
  // initializeCall,
  // joinRoom,
  leaveRoom,
  // toggleMic,
  // toggleVideo,
  // toggleScreenShare,
  toggleChat,
  sendMessage,
  // addMessage,
  setLocalStream,
  setRemoteStream,
  setConnected,
  endCall,
} from '../features/videocall/videoCallSlice';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
// import { VideoCallConfig } from '../types/models/VideoCallConfig';
// import { SignalData } from '../types/states/VideoCallState';
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
  // const startVideoCall = async (appointmentId: string): Promise<void> => {
  //   try {
  //     // const response = await videoCallService.getCallConfig(appointmentId);
  //     // if (response.success && response.data) {
  //     //   const config = response.data as VideoCallConfig;
  //     //   dispatch(initializeCall(config));
  //     //   await setupWebRTC(config);
  //     // }
  //     // dispatch(initializeCall(response));
  //     // await setupWebRTC(response);
  //   } catch (error) {
  //     console.error('Failed to start video call:', error);
  //   }
  // };

  /**
   * Konfiguriert WebRTC und startet Media-Streams
   * @param config - Konfiguration für den Videoanruf
   */
  // const setupWebRTC = async (config: VideoCallConfig): Promise<void> => {
  //   try {
  //     // Media-Stream anfordern
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: true,
  //       audio: true,
  //     });

  //     dispatch(setLocalStream(stream));

  //     // WebRTC Peer Connection erstellen
  //     const peerConnection = new RTCPeerConnection({
  //       iceServers: [
  //         { urls: 'stun:stun.l.google.com:19302' },
  //         { urls: 'stun:stun1.l.google.com:19302' },
  //       ],
  //     });

  //     peerRef.current = peerConnection;

  //     // Lokalen Stream zur Peer Connection hinzufügen
  //     stream.getTracks().forEach((track) => {
  //       peerConnection.addTrack(track, stream);
  //     });

  //     // Event-Handler für eingehende Streams
  //     peerConnection.ontrack = (event) => {
  //       if (event.streams && event.streams[0]) {
  //         dispatch(setRemoteStream(event.streams[0]));
  //       }
  //     };

  //     // SignalR-Verbindung aufbauen
  //     await setupSignalR(config);

  //     // Raum beitreten
  //     dispatch(joinRoom(config.roomId));
  //     dispatch(setConnected(true));
  //   } catch (error) {
  //     console.error('Error setting up WebRTC:', error);
  //   }
  // };

  /**
   * Konfiguriert SignalR für die Signalisierung
   * @param config - Konfiguration für den Videoanruf
   */
  // const setupSignalR = async (config: VideoCallConfig): Promise<void> => {
  //   try {
  //     const connection = new HubConnectionBuilder()
  //       .withUrl(`${import.meta.env.VITE_API_BASE_URL}/api/videocall/hub`)
  //       .configureLogging(LogLevel.Information)
  //       .build();

  //     // Event-Handler für eingehende Signale
  //     connection.on(
  //       'ReceiveSignal',
  //       async (senderId: string, signal: SignalData) => {
  //         if (senderId !== config.peerId || !peerRef.current) return;

  //         try {
  //           if (signal.type === 'offer') {
  //             await peerRef.current.setRemoteDescription(
  //               new RTCSessionDescription({
  //                 type: 'offer',
  //                 sdp: signal.sdp,
  //               })
  //             );

  //             const answer = await peerRef.current.createAnswer();
  //             await peerRef.current.setLocalDescription(answer);

  //             connection.invoke('SendSignal', config.peerId, {
  //               type: 'answer',
  //               sdp: answer.sdp,
  //             });
  //           } else if (signal.type === 'answer') {
  //             await peerRef.current.setRemoteDescription(
  //               new RTCSessionDescription({
  //                 type: 'answer',
  //                 sdp: signal.sdp,
  //               })
  //             );
  //           } else if (signal.type === 'candidate') {
  //             await peerRef.current.addIceCandidate(
  //               new RTCIceCandidate(signal.candidate)
  //             );
  //           }
  //         } catch (error) {
  //           console.error('Error handling signal:', error);
  //         }
  //       }
  //     );

  //     // Event-Handler für eingehende Chat-Nachrichten
  //     connection.on('ReceiveMessage', (message: ChatMessage) => {
  //       dispatch(addMessage(message));
  //     });

  //     // Event-Handler für den Status anderer Benutzer
  //     connection.on('UserJoined', (userId: string) => {
  //       if (userId === config.peerId && peerRef.current) {
  //         createOffer();
  //       }
  //     });

  //     connection.on('UserLeft', () => {
  //       dispatch(setRemoteStream(null));
  //     });

  //     connection.on('CallEnded', () => {
  //       dispatch(endCall());
  //       cleanUp();
  //     });

  //     // Verbindung starten
  //     await connection.start();
  //     signalRConnectionRef.current = connection;

  //     // Raum beitreten
  //     await connection.invoke('JoinRoom', config.roomId, config.userId);
  //   } catch (error) {
  //     console.error('Error setting up SignalR:', error);
  //   }
  // };

  /**
   * Erstellt ein WebRTC-Angebot für die Verbindung
   */
  // const createOffer = async (): Promise<void> => {
  //   if (!peerRef.current || !signalRConnectionRef.current || !peerId) return;

  //   try {
  //     // ICE-Kandidaten registrieren
  //     peerRef.current.onicecandidate = (event) => {
  //       if (event.candidate && signalRConnectionRef.current) {
  //         signalRConnectionRef.current.invoke('SendSignal', peerId, {
  //           type: 'candidate',
  //           candidate: event.candidate,
  //         });
  //       }
  //     };

  //     // Angebot erstellen
  //     const offer = await peerRef.current.createOffer();
  //     await peerRef.current.setLocalDescription(offer);

  //     // Angebot senden
  //     signalRConnectionRef.current.invoke('SendSignal', peerId, {
  //       type: 'offer',
  //       sdp: offer.sdp,
  //     });
  //   } catch (error) {
  //     console.error('Error creating offer:', error);
  //   }
  // };

  // /**
  //  * Wechselt den Mikrofonstatus (an/aus)
  //  */
  // const toggleMicrophone = (): void => {
  //   if (localStream) {
  //     const audioTracks = localStream.getAudioTracks();
  //     audioTracks.forEach((track) => {
  //       track.enabled = !track.enabled;
  //     });
  //     dispatch(toggleMic());
  //   }
  // };

  // /**
  //  * Wechselt den Videostatus (an/aus)
  //  */
  // const toggleCamera = (): void => {
  //   if (localStream) {
  //     const videoTracks = localStream.getVideoTracks();
  //     videoTracks.forEach((track) => {
  //       track.enabled = !track.enabled;
  //     });
  //     dispatch(toggleVideo());
  //   }
  // };

  // /**
  //  * Wechselt zwischen Bildschirmfreigabe und Kamera
  //  */
  // const toggleScreenSharing = async (): Promise<void> => {
  //   if (!peerRef.current) return;

  //   try {
  //     if (isScreenSharing) {
  //       // Zurück zur Kamera wechseln
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: true,
  //         audio: true,
  //       });

  //       // Alte Tracks entfernen
  //       const senders = peerRef.current.getSenders();
  //       senders.forEach((sender) => {
  //         if (sender.track && sender.track.kind === 'video') {
  //           peerRef.current?.removeTrack(sender);
  //         }
  //       });

  //       // Neue Tracks hinzufügen
  //       stream.getTracks().forEach((track) => {
  //         peerRef.current?.addTrack(track, stream);
  //       });

  //       dispatch(setLocalStream(stream));
  //     } else {
  //       // Zu Bildschirmfreigabe wechseln
  //       const screenStream = await navigator.mediaDevices.getDisplayMedia({
  //         video: true,
  //       });

  //       // Alte Video-Tracks entfernen
  //       const senders = peerRef.current.getSenders();
  //       senders.forEach((sender) => {
  //         if (sender.track && sender.track.kind === 'video') {
  //           peerRef.current?.removeTrack(sender);
  //         }
  //       });

  //       // Bildschirmfreigabe-Track hinzufügen
  //       screenStream.getTracks().forEach((track) => {
  //         if (track.kind === 'video') {
  //           peerRef.current?.addTrack(track, screenStream);
  //         }
  //       });

  //       // Audio-Tracks vom ursprünglichen Stream behalten
  //       const newStream = new MediaStream();

  //       // Bildschirmfreigabe-Tracks hinzufügen
  //       screenStream.getTracks().forEach((track) => {
  //         newStream.addTrack(track);
  //       });

  //       // Audio-Tracks vom lokalen Stream hinzufügen
  //       if (localStream) {
  //         localStream.getAudioTracks().forEach((track) => {
  //           newStream.addTrack(track);
  //         });
  //       }

  //       dispatch(setLocalStream(newStream));

  //       // Event-Handler für das Ende der Bildschirmfreigabe
  //       screenStream.getVideoTracks()[0].onended = () => {
  //         dispatch(toggleScreenShare());
  //         void toggleScreenSharing();
  //       };
  //     }

  //     dispatch(toggleScreenShare());
  //   } catch (error) {
  //     console.error('Error toggling screen share:', error);
  //   }
  // };

  /**
   * Öffnet/schließt das Chat-Panel
   */
  const toggleChatPanel = (): void => {
    dispatch(toggleChat());
  };

  const userId = useAppSelector((state) => state.auth.user?.id) || '';
  const username =
    useAppSelector((state) => state.auth.user?.firstName) || 'Unbekannt';

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
      dispatch(sendMessage(message));
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
        dispatch(endCall());
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
      localStream.getTracks().forEach((track) => track.stop());
      dispatch(setLocalStream(null));
    }

    if (remoteStream) {
      dispatch(setRemoteStream(null));
    }

    dispatch(setConnected(false));
    dispatch(leaveRoom());
  }, [dispatch, localStream, remoteStream]);

  // Räumt Ressourcen auf, wenn die Komponente unmounted wird
  useEffect(() => {
    return () => {
      cleanUp();
    };
  }, [cleanUp]);

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
    // startVideoCall,
    // toggleMicrophone,
    // toggleCamera,
    // toggleScreenSharing,
    toggleChatPanel,
    sendChatMessage,
    hangUp,
  };
};
