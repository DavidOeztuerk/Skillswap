import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import CallControls from '../../components/videocall/CallControls';
import LocalVideo from '../../components/videocall/LocalVideo';
import RemoteVideo from '../../components/videocall/RemoteVideo';
import ChatPanel from '../../components/videocall/ChatPanel';
import ConnectionStatus from '../../components/videocall/ConnectionStatus';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useAuth } from '../../hooks/useAuth';

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();

  const {
    roomId,
    isConnected,
    localStream,
    remoteStream,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    messages,
    participants,
    isLoading,
    error,
    startVideoCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenSharing,
    toggleChatPanel,
    sendChatMessage,
    hangUp,
  } = useVideoCall();

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<
    'connecting' | 'poor' | 'fair' | 'good' | 'excellent' | 'disconnected'
  >('connecting');
  
  // 🔥 NEU: Verhindere Unmount während aktiver Verbindung
  const isCallActiveRef = useRef(false);
  // const hasInitializedRef = useRef(false);

  // 🔥 KORRIGIERT: Start call on mount mit Schutz vor doppelter Initialisierung
useEffect(() => {
  let isMounted = true;
  let initializationTimeout: NodeJS.Timeout;

  const initializeCall = async () => {
    if (!isMounted || !appointmentId) return;

    try {
      console.log('🚀 Starting video call initialization...');
      
      // Verzögerung um Race Conditions zu vermeiden
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) return;

      await startVideoCall(appointmentId);
      
      if (isMounted) {
        console.log('✅ Video call initialization completed');
      }
    } catch (error) {
      console.error('❌ Video call initialization failed:', error);
    }
  };

  // Start mit Verzögerung um React Lifecycle zu stabilisieren
  initializationTimeout = setTimeout(() => {
    initializeCall();
  }, 200);

  return () => {
    console.log('🧹 VideoCallPage cleanup');
    isMounted = false;
    clearTimeout(initializationTimeout);
    
    // Nur aufräumen wenn Komponente wirklich unmounted
    // Nicht bei Re-renders
  };
}, [appointmentId, startVideoCall]);

  // Handle connection state changes
  useEffect(() => {
    if (isConnected) {
      console.log('✅ Call connected successfully');
      setConnectionQuality('good');
    } else if (roomId && !isConnected) {
      setConnectionQuality('connecting');
    } else {
      setConnectionQuality('disconnected');
    }
  }, [isConnected, roomId]);

  // 🔥 NEU: Debug-Info für Entwickler
  useEffect(() => {
    const debugInfo = {
      appointmentId,
      roomId,
      isConnected,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream,
      localTracks: localStream?.getTracks().length || 0,
      remoteTracks: remoteStream?.getTracks().length || 0,
      participants: participants.length,
      isLoading,
      error: error || 'none'
    };
    
    console.log('📊 VideoCallPage State:', debugInfo);
  }, [appointmentId, roomId, isConnected, localStream, remoteStream, participants, isLoading, error]);

  // 🔥 KORRIGIERT: Sicheres Beenden des Calls
  const handleExitConfirm = () => {
    setExitConfirmOpen(true);
  };

  const handleExit = () => {
    console.log('📞 User initiated call end');
    isCallActiveRef.current = false;
    hangUp();
    setExitConfirmOpen(false);
    
    // Kurze Verzögerung für Cleanup
    setTimeout(() => {
      navigate('/appointments');
    }, 300);
  };

  // 🔥 NEU: Debug-Funktion für Entwickler
  const handleDebug = () => {
    console.group('🎥 WEBRTC DEBUG INFO');
    console.log('=== WEBRTC DEBUG ===');
    console.log('Local Stream:', localStream);
    console.log('Local Tracks:', localStream?.getTracks().map(t => ({
      kind: t.kind,
      id: t.id,
      enabled: t.enabled,
      readyState: t.readyState
    })));
    
    console.log('Remote Stream:', remoteStream);
    console.log('Remote Tracks:', remoteStream?.getTracks().map(t => ({
      kind: t.kind,
      id: t.id,
      enabled: t.enabled,
      readyState: t.readyState
    })));

    // Debug-Helper aus useVideoCall Hook
    // @ts-ignore
    if (window.__vcDebug) {
      // @ts-ignore
      const debug = window.__vcDebug;
      console.log('PeerConnection:', debug.getPeer());
      console.log('Senders:', debug.listSenders());
      console.log('Receivers:', debug.listReceivers());
      console.log('Connection State:', debug.getConnectionState());
    }

    // Prüfe Video-Elemente
    const localVideo = document.querySelector('#localVideo') as HTMLVideoElement;
    const remoteVideo = document.querySelector('#remoteVideo') as HTMLVideoElement;
    console.log('Local Video srcObject:', localVideo?.srcObject);
    console.log('Remote Video srcObject:', remoteVideo?.srcObject);
    console.log('Local Video readyState:', localVideo?.readyState);
    console.log('Remote Video readyState:', remoteVideo?.readyState);
    
    console.groupEnd();
  };

  if (error) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Fehler beim Herstellen des Videoanrufs
        </Typography>
        <Typography variant="body1" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/appointments')} sx={{ mt: 2 }}>
          Zurück zu den Terminen
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullPage message="Videoanruf wird gestartet..." />;
  }

  const remoteParticipant = participants.find(p => p.id !== user?.id);

  return (
    <Box sx={{ height: '100vh', width: '100vw', position: 'relative', bgcolor: 'black', overflow: 'hidden' }}>
      <ConnectionStatus quality={connectionQuality} hideWhenGood />

      {/* Haupt-Video-Container */}
      <Box sx={{ height: '100%', width: '100%' }}>
        <RemoteVideo
          stream={remoteStream}
          isConnected={isConnected}
          username={remoteParticipant?.name || 'Warten auf Teilnehmer...'}
          isMicMuted={remoteParticipant?.isMuted ?? false}
          isVideoOff={!(remoteParticipant?.isVideoEnabled ?? true)}
          isScreenSharing={remoteParticipant?.isScreenSharing ?? false}
          avatarUrl={remoteParticipant?.avatar}
        />
      </Box>

      {/* Lokales Video (Picture-in-Picture) */}
      <LocalVideo
        stream={localStream}
        isMicEnabled={isMicEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        username={user?.firstName || 'Du'}
      />

      {/* Chat Panel */}
      {isChatOpen && (
        <Box sx={{ position: 'absolute', top: 16, right: 16, height: 'calc(100% - 110px)', zIndex: 10 }}>
          <ChatPanel 
            messages={messages} 
            onSendMessage={sendChatMessage} 
            onClose={toggleChatPanel} 
            currentUserId={user?.id || ''} 
          />
        </Box>
      )}

      {/* Call Controls */}
      <CallControls
        isMicEnabled={isMicEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        onToggleMic={toggleMicrophone}
        onToggleVideo={toggleCamera}
        onToggleScreenShare={toggleScreenSharing}
        onToggleChat={toggleChatPanel}
        onEndCall={handleExitConfirm}
      />

      {/* Debug Button (nur im Development) */}
      {import.meta.env.DEV && (
        <Button 
          variant="outlined" 
          size="small"
          onClick={handleDebug}
          sx={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.9)',
            }
          }}
        >
          Debug
        </Button>
      )}

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        open={exitConfirmOpen}
        title="Anruf beenden"
        message="Möchtest du diesen Videoanruf wirklich beenden?"
        confirmLabel="Beenden"
        cancelLabel="Abbrechen"
        confirmColor="error"
        onConfirm={handleExit}
        onCancel={() => setExitConfirmOpen(false)}
      />
    </Box>
  );
};

export default VideoCallPage;
