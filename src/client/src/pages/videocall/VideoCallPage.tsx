// src/pages/videocall/VideoCallPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

/**
 * Seite für Videoanrufe mit WebRTC
 */
const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();

  const {
    // roomId,
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
    startVideoCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenSharing,
    toggleChatPanel,
    sendChatMessage,
    hangUp,
  } = useVideoCall();

  // Dialog-States
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<
    'connecting' | 'poor' | 'fair' | 'good' | 'excellent' | 'disconnected'
  >('connecting');

  // Bei Initialisierung Videoanruf starten
  useEffect(() => {
    if (appointmentId) {
      startVideoCall(appointmentId);

      // Simulierte Verbindungsqualität für Demo-Zwecke
      const timeout = setTimeout(() => {
        setConnectionQuality('good');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [appointmentId, startVideoCall]);

  // Behandlung von Fehlern
  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Fehler beim Herstellen des Videoanrufs
        </Typography>
        <Typography variant="body1" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/appointments')}
          sx={{ mt: 2 }}
        >
          Zurück zu den Terminen
        </Button>
      </Box>
    );
  }

  // Ladeanzeige
  if (isLoading) {
    return <LoadingSpinner fullPage message="Videoanruf wird gestartet..." />;
  }

  // Bestätigungsdialog für das Verlassen des Anrufs
  const handleExitConfirm = () => {
    setExitConfirmOpen(true);
  };

  const handleExit = () => {
    hangUp();
    navigate('/appointments');
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        bgcolor: 'black',
        overflow: 'hidden',
      }}
    >
      {/* Verbindungsstatus */}
      <ConnectionStatus quality={connectionQuality} />

      {/* Haupt-Video (Remote) */}
      <Box sx={{ height: '100%', width: '100%' }}>
        <RemoteVideo
          stream={remoteStream}
          isConnected={isConnected}
          username="Name des anderen Teilnehmers" // Im echten Code müsste dies aus der Appointment-Info kommen
          isMicMuted={false} // Diese Info müsste über SignalR synchronisiert werden
          isVideoOff={false} // Diese Info müsste über SignalR synchronisiert werden
          isScreenSharing={false} // Diese Info müsste über SignalR synchronisiert werden
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

      {/* Chat-Panel */}
      {isChatOpen && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            height: 'calc(100% - 110px)',
            zIndex: 10,
          }}
        >
          <ChatPanel
            messages={messages}
            onSendMessage={sendChatMessage}
            onClose={toggleChatPanel}
            currentUserId={user?.id || ''}
          />
        </Box>
      )}

      {/* Steuerelemente */}
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

      {/* Bestätigungsdialog für das Verlassen des Anrufs */}
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
