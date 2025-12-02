import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Snackbar, Alert, Chip, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar';
import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';

// Components
import CallControls from '../../components/videocall/CallControls';
import LocalVideo from '../../components/videocall/LocalVideo';
import RemoteVideo from '../../components/videocall/RemoteVideo';
import ChatPanel from '../../components/videocall/ChatPanel';
import ConnectionStatus from '../../components/videocall/ConnectionStatus';
import E2EEStatus from '../../components/videocall/E2EEStatus';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// Hooks
import { useVideoCall } from '../../hooks/useVideoCall';
import { useAuth } from '../../hooks/useAuth';
import { useStreams } from '../../contexts/StreamContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useNetworkQuality, NetworkQualityStats } from '../../hooks/useNetworkQuality';

// Types
type ConnectionQualityType = 'connecting' | 'poor' | 'fair' | 'good' | 'excellent' | 'disconnected';

// ============================================================================
// Helper Components
// ============================================================================

interface NetworkStatsDisplayProps {
  stats: NetworkQualityStats;
  visible: boolean;
}

const NetworkStatsDisplay: React.FC<NetworkStatsDisplayProps> = ({ stats, visible }) => {
  if (!visible) return null;

  const getQualityIcon = () => {
    switch (stats.quality) {
      case 'excellent':
        return <SignalCellularAltIcon sx={{ color: 'success.main' }} />;
      case 'good':
        return <SignalCellularAlt2BarIcon sx={{ color: 'success.light' }} />;
      case 'fair':
        return <SignalCellularAlt1BarIcon sx={{ color: 'warning.main' }} />;
      case 'poor':
        return <SignalCellularConnectedNoInternet0BarIcon sx={{ color: 'error.main' }} />;
      default:
        return <SignalCellularConnectedNoInternet0BarIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getQualityColor = (): 'success' | 'warning' | 'error' | 'default' => {
    switch (stats.quality) {
      case 'excellent':
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 100,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 200,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {getQualityIcon()}
        <Chip
          label={stats.quality.toUpperCase()}
          size="small"
          color={getQualityColor()}
        />
      </Stack>
      
      <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
        Video: {stats.videoBandwidth} kbps | Audio: {stats.audioBandwidth} kbps
      </Typography>
      <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
        RTT: {stats.roundTripTime}ms | Jitter: {stats.videoJitter}ms
      </Typography>
      <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
        Packet Loss: {stats.videoPacketsLostPerSecond}/s (video) | {stats.audioPacketsLostPerSecond}/s (audio)
      </Typography>
    </Box>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const { localStream, remoteStream, cleanup: cleanupStreams } = useStreams();
  const networkStatus = useNetworkStatus();

  // Video Call Hook
  const {
    roomId,
    isConnected,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    messages,
    participants,
    isLoading,
    error,
    callDuration,
    startVideoCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenSharing,
    toggleChatPanel,
    sendChatMessage,
    hangUp,
    e2ee,
    chatE2EE,
    peerConnection,
  } = useVideoCall();

  const webrtcQuality = useNetworkQuality(peerConnection, {
    interval: 2000,
    enableLogging: process.env.NODE_ENV === 'development',
    onQualityChange: (quality) => {
      if (quality === 'poor') {
        setNetworkWarning('Schlechte Verbindungsqualität erkannt. Videoqualität könnte beeinträchtigt sein.');
      } else if (quality === 'fair') {
        setNetworkWarning('Mittelmäßige Verbindungsqualität.');
      } else {
        setNetworkWarning(null);
      }
    },
  });

  // Local State
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQualityType>('connecting');
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const [showNetworkStats, setShowNetworkStats] = useState(false);

  const isCallActiveRef = useRef(false);
  const hangUpRef = useRef(hangUp);
  const roomIdRef = useRef(roomId);
  const callDurationRef = useRef(callDuration);
  const isConnectedRef = useRef(isConnected);

  // ========================================================================
  // Sync Refs with State
  // ========================================================================

  useEffect(() => { hangUpRef.current = hangUp; }, [hangUp]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  // ========================================================================
  // Call Initialization
  // ========================================================================

  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: ReturnType<typeof setTimeout>;

    const initializeCall = async () => {
      if (!isMounted || !appointmentId) return;

      try {
        console.log('🚀 Starting video call initialization...');

        // Small delay to stabilize React lifecycle
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!isMounted) return;

        await startVideoCall(appointmentId);

        if (isMounted) {
          console.log('✅ Video call initialization completed');
          isCallActiveRef.current = true;
        }
      } catch (err) {
        console.error('❌ Video call initialization failed:', err);
        isCallActiveRef.current = false;
      }
    };

    initializationTimeout = setTimeout(initializeCall, 200);

    return () => {
      console.log('🧹 VideoCallPage cleanup triggered');
      isMounted = false;
      clearTimeout(initializationTimeout);

      if (isCallActiveRef.current) {
        console.log('🔌 Cleaning up active call on unmount');
        hangUpRef.current();
        cleanupStreams();
        isCallActiveRef.current = false;
      }
    };
  }, [appointmentId, startVideoCall, cleanupStreams]);

  // ========================================================================
  // Browser Close / Tab Close Handler
  // ========================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCallActiveRef.current && isConnectedRef.current) {
        // Synchronous cleanup
        hangUpRef.current();
        cleanupStreams();

        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isCallActiveRef.current) {
        console.log('📱 Tab hidden - call still active');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cleanupStreams]);

  // ========================================================================
  // Connection Quality Monitoring
  // ========================================================================

  useEffect(() => {
    if (!isConnected) {
      setConnectionQuality(roomId ? 'connecting' : 'disconnected');
      return;
    }

    if (webrtcQuality.quality !== 'unknown') {
      setConnectionQuality(webrtcQuality.quality);
    } else if (networkStatus.isSlowConnection) {
      setConnectionQuality('poor');
    } else if (!networkStatus.isOnline) {
      setConnectionQuality('disconnected');
    } else {
      setConnectionQuality('good');
    }
  }, [isConnected, roomId, webrtcQuality.quality, networkStatus]);

  // ========================================================================
  // Debug Info (Development only)
  // ========================================================================

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const debugInfo = {
      appointmentId,
      roomId,
      isConnected,
      hasLocalStream: !!localStream,
      hasRemoteStream: !!remoteStream,
      localTracks: localStream?.getTracks().length ?? 0,
      remoteTracks: remoteStream?.getTracks().length ?? 0,
      participants: participants.length,
      isLoading,
      error: error ?? 'none',
      networkQuality: webrtcQuality.quality,
      isCallActive: isCallActiveRef.current,
    };

    console.log('📊 VideoCallPage State:', debugInfo);
  }, [
    appointmentId,
    roomId,
    isConnected,
    localStream,
    remoteStream,
    participants,
    isLoading,
    error,
    webrtcQuality.quality,
  ]);

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handleExitConfirm = useCallback(() => {
    setExitConfirmOpen(true);
  }, []);

  const handleExit = useCallback(async () => {
    console.log('📞 User initiated call end');
    setExitConfirmOpen(false);

    try {
      isCallActiveRef.current = false;
      await hangUpRef.current();
      cleanupStreams();
    } catch (err) {
      console.error('Exit cleanup error:', err);
    } finally {
      navigate('/appointments');
    }
  }, [navigate, cleanupStreams]);

  const handleCancelExit = useCallback(() => {
    setExitConfirmOpen(false);
  }, []);

  const handleCloseNetworkWarning = useCallback(() => {
    setNetworkWarning(null);
  }, []);

  const handleToggleNetworkStats = useCallback(() => {
    setShowNetworkStats((prev) => !prev);
  }, []);

  // Debug Handler
  const handleDebug = useCallback(() => {
    console.group('🎥 WEBRTC DEBUG INFO');
    console.log('=== STREAMS ===');
    console.log('Local Stream:', localStream);
    console.log(
      'Local Tracks:',
      localStream?.getTracks().map((t) => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted,
      }))
    );

    console.log('Remote Stream:', remoteStream);
    console.log(
      'Remote Tracks:',
      remoteStream?.getTracks().map((t) => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState,
      }))
    );

    console.log('=== STATE ===');
    console.log('isCallActive:', isCallActiveRef.current);
    console.log('isConnected:', isConnected);
    console.log('roomId:', roomId);
    console.log('callDuration:', callDuration);

    console.log('=== NETWORK ===');
    console.log('Browser Status:', networkStatus);
    console.log('WebRTC Quality:', webrtcQuality);

    console.log('=== E2EE ===');
    console.log('Video E2EE:', e2ee);
    console.log('Chat E2EE:', chatE2EE);

    // Check video elements
    const localVideo = document.querySelector('#localVideo') as HTMLVideoElement;
    const remoteVideo = document.querySelector('#remoteVideo') as HTMLVideoElement;
    console.log('=== VIDEO ELEMENTS ===');
    console.log('Local Video srcObject:', localVideo?.srcObject);
    console.log('Remote Video srcObject:', remoteVideo?.srcObject);

    console.groupEnd();
  }, [localStream, remoteStream, isConnected, roomId, callDuration, networkStatus, webrtcQuality, e2ee, chatE2EE]);

  // ========================================================================
  // Error State
  // ========================================================================

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
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Fehler beim Herstellen des Videoanrufs
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          gutterBottom
          sx={{ maxWidth: 400, textAlign: 'center' }}
        >
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/appointments')}
          sx={{ mt: 3 }}
        >
          Zurück zu den Terminen
        </Button>
      </Box>
    );
  }

  // ========================================================================
  // Loading State
  // ========================================================================

  if (isLoading) {
    return <LoadingSpinner fullPage message="Videoanruf wird gestartet..." />;
  }

  // ========================================================================
  // Derived Data
  // ========================================================================

  const remoteParticipant = participants.find((p) => p.id !== user?.id);

  // ========================================================================
  // Render
  // ========================================================================

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
      {/* Connection Status */}
      <ConnectionStatus quality={connectionQuality} hideWhenGood />

      {/* E2EE Status Indicator */}
      {e2ee && e2ee.status !== 'disabled' && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: isChatOpen ? 16 : 'auto',
            right: isChatOpen ? 'auto' : 16,
            zIndex: 10,
          }}
        >
          <E2EEStatus
            status={e2ee.status}
            isActive={e2ee.isActive}
            localFingerprint={e2ee.formattedLocalFingerprint}
            remoteFingerprint={e2ee.formattedRemoteFingerprint}
            keyGeneration={e2ee.keyGeneration}
            encryptionStats={e2ee.encryptionStats}
            errorMessage={e2ee.errorMessage}
            onRotateKeys={e2ee.rotateKeys}
          />
        </Box>
      )}

      {/* Main Video Container */}
      <Box sx={{ height: '100%', width: '100%' }}>
        <RemoteVideo
          stream={remoteStream}
          isConnected={isConnected}
          username={remoteParticipant?.name ?? 'Warten auf Teilnehmer...'}
          isMicMuted={remoteParticipant?.isMuted ?? false}
          isVideoOff={!(remoteParticipant?.isVideoEnabled ?? true)}
          isScreenSharing={remoteParticipant?.isScreenSharing ?? false}
          avatarUrl={remoteParticipant?.avatar}
        />
      </Box>

      {/* Local Video (Picture-in-Picture) */}
      <LocalVideo
        stream={localStream}
        isMicEnabled={isMicEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        username={user?.firstName ?? 'Du'}
      />

      {/* Network Stats Display */}
      <NetworkStatsDisplay stats={webrtcQuality} visible={showNetworkStats} />

      {/* Chat Panel */}
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
            currentUserId={user?.id ?? ''}
            e2eeStatus={chatE2EE?.status}
            isE2EEActive={chatE2EE?.isActive}
            messagesEncrypted={chatE2EE?.stats?.messagesEncrypted ?? 0}
            messagesDecrypted={chatE2EE?.stats?.messagesDecrypted ?? 0}
            verificationFailures={chatE2EE?.stats?.verificationFailures ?? 0}
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

      {/* Debug & Stats Buttons (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            display: 'flex',
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={handleDebug}
            sx={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' },
            }}
          >
            Debug
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleToggleNetworkStats}
            sx={{
              backgroundColor: showNetworkStats ? 'rgba(76,175,80,0.7)' : 'rgba(0,0,0,0.7)',
              color: 'white',
              '&:hover': { backgroundColor: showNetworkStats ? 'rgba(76,175,80,0.9)' : 'rgba(0,0,0,0.9)' },
            }}
          >
            Stats
          </Button>
        </Box>
      )}

      {/* Network Warning Snackbar */}
      <Snackbar
        open={!!networkWarning}
        autoHideDuration={6000}
        onClose={handleCloseNetworkWarning}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNetworkWarning} severity="warning" sx={{ width: '100%' }}>
          {networkWarning}
        </Alert>
      </Snackbar>

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        open={exitConfirmOpen}
        title="Anruf beenden"
        message="Möchtest du diesen Videoanruf wirklich beenden?"
        confirmLabel="Beenden"
        cancelLabel="Abbrechen"
        confirmColor="error"
        onConfirm={handleExit}
        onCancel={handleCancelExit}
      />
    </Box>
  );
};

export default VideoCallPage;
