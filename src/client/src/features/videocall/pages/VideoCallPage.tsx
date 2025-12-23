import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalCellularAlt1BarIcon from '@mui/icons-material/SignalCellularAlt1Bar';
import SignalCellularAlt2BarIcon from '@mui/icons-material/SignalCellularAlt2Bar';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Chip,
  Stack,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useStreams } from '../../../core/contexts/streamContextHooks';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import useNetworkStatus from '../../../shared/hooks/useNetworkStatus';
import browserInfo from '../../../shared/utils/browserDetection';
import { useAuth } from '../../auth/hooks/useAuth';
import CallControls from '../components/CallControls';
import ChatPanel from '../components/ChatPanel';
import ConnectionStatus from '../components/ConnectionStatus';
import E2EEDebugPanel from '../components/E2EeDebugPanel';
import E2EEStatus from '../components/E2EeStatus';
import LocalVideo from '../components/LocalVideo';
import PreCallLobby from '../components/PreCallLobby';
import RemoteVideo from '../components/RemoteVideo';
import VideoLayout, { type LayoutMode } from '../components/VideoLayout';
import useNetworkQuality, { type NetworkQualityStats } from '../hooks/useNetworkQuality';
import { useVideoCallComposed } from '../hooks/useVideoCallComposed';
import { VideoCallProvider } from '../hooks/VideoCallContext';
import { setLayoutMode } from '../store/videoCallSlice';

// Types
type ConnectionQualityType = 'connecting' | 'poor' | 'fair' | 'good' | 'excellent' | 'disconnected';

// ============================================================================
// Helper Functions
// ============================================================================

const determineConnectionQuality = (
  isConnected: boolean,
  roomId: string | null,
  webrtcQuality: NetworkQualityStats['quality'],
  networkStatus: { isSlowConnection: boolean; isOnline: boolean }
): ConnectionQualityType => {
  if (!isConnected) {
    return roomId ? 'connecting' : 'disconnected';
  }

  if (webrtcQuality !== 'unknown') {
    return webrtcQuality;
  }

  if (networkStatus.isSlowConnection) {
    return 'poor';
  }

  return networkStatus.isOnline ? 'good' : 'disconnected';
};

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const networkStatsContainerSx: SxProps<Theme> = {
  position: 'absolute',
  bottom: 100,
  left: 16,
  zIndex: 10,
  backgroundColor: 'rgba(0,0,0,0.75)',
  borderRadius: 2,
  p: 1.5,
  minWidth: 200,
};

const greyTextSx: SxProps<Theme> = {
  color: 'grey.400',
  display: 'block',
};

const errorContainerSx: SxProps<Theme> = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  p: 3,
  bgcolor: 'background.default',
};

const errorMessageSx: SxProps<Theme> = {
  maxWidth: 400,
  textAlign: 'center',
};

const mainContainerSx: SxProps<Theme> = {
  height: '100vh',
  width: '100vw',
  position: 'relative',
  bgcolor: 'black',
  overflow: 'hidden',
};

const e2eeStatusBoxSx: SxProps<Theme> = {
  position: 'absolute',
  top: 16,
  zIndex: 10,
};

const videoBoxSx: SxProps<Theme> = {
  position: 'relative',
  borderRadius: 2,
  overflow: 'hidden',
};

const fullSizeVideoSx: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  position: 'relative',
  borderRadius: 2,
  overflow: 'hidden',
};

const spotlightContainerSx: SxProps<Theme> = {
  display: 'flex',
  width: '100%',
  height: '100%',
  gap: 1,
  p: 1,
};

const spotlightMainSx: SxProps<Theme> = {
  flex: 1,
  position: 'relative',
  borderRadius: 2,
  overflow: 'hidden',
};

const spotlightSideSx: SxProps<Theme> = {
  width: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const spotlightSideItemSx: SxProps<Theme> = {
  flex: 1,
  position: 'relative',
  borderRadius: 1,
  overflow: 'hidden',
};

const screenShareContainerSx: SxProps<Theme> = {
  display: 'flex',
  width: '100%',
  height: '100%',
  gap: 1,
  p: 1,
};

const screenShareSidebarSx: SxProps<Theme> = {
  width: 180,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const screenShareVideoSx: SxProps<Theme> = {
  height: 100,
  position: 'relative',
  borderRadius: 1,
  overflow: 'hidden',
};

const screenShareMainSx: SxProps<Theme> = {
  flex: 1,
  position: 'relative',
  backgroundColor: '#000',
  borderRadius: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const fullSizeContainerSx: SxProps<Theme> = {
  height: '100%',
  width: '100%',
};

const chatPanelContainerSx: SxProps<Theme> = {
  position: 'absolute',
  top: 16,
  right: 16,
  height: 'calc(100% - 110px)',
  zIndex: 10,
};

const debugContainerSx: SxProps<Theme> = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 1000,
  display: 'flex',
  gap: 1,
};

const debugButtonSx: SxProps<Theme> = {
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' },
};

// ============================================================================
// Layout Props Interfaces
// ============================================================================

interface LayoutRenderProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isConnected: boolean;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  userName: string;
  localUserAvatarUrl: string | undefined;
  remoteParticipant:
    | {
        name?: string;
        isMuted?: boolean;
        isVideoEnabled?: boolean;
        isScreenSharing?: boolean;
        avatar?: string;
      }
    | undefined;
  mainParticipant?: { isLocal?: boolean };
}

// ============================================================================
// Layout Render Functions
// ============================================================================

const renderGridLayout = (props: LayoutRenderProps): React.ReactNode => {
  const {
    localStream,
    remoteStream,
    isConnected,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    userName,
    localUserAvatarUrl,
    remoteParticipant,
  } = props;
  const hasRemoteStream = !!remoteStream;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: hasRemoteStream ? '1fr 1fr' : '1fr',
        gridTemplateRows: '1fr',
        gap: 1,
        width: '100%',
        height: '100%',
        p: 1,
      }}
    >
      {hasRemoteStream ? (
        <Box sx={videoBoxSx}>
          <RemoteVideo
            stream={remoteStream}
            isConnected={isConnected}
            username={remoteParticipant?.name ?? 'Teilnehmer'}
            isMicMuted={remoteParticipant?.isMuted ?? false}
            isVideoOff={!(remoteParticipant?.isVideoEnabled ?? true)}
            isScreenSharing={remoteParticipant?.isScreenSharing ?? false}
            avatarUrl={remoteParticipant?.avatar}
          />
        </Box>
      ) : null}
      <Box sx={videoBoxSx}>
        <LocalVideo
          stream={localStream}
          isMicEnabled={isMicEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          username={userName}
          avatarUrl={localUserAvatarUrl}
          fullSize
        />
      </Box>
    </Box>
  );
};

const renderSpotlightLayout = (props: LayoutRenderProps): React.ReactNode => {
  const {
    localStream,
    remoteStream,
    isConnected,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    userName,
    localUserAvatarUrl,
    remoteParticipant,
    mainParticipant,
  } = props;
  const hasRemoteStream = !!remoteStream;

  if (!hasRemoteStream) {
    return (
      <Box sx={{ width: '100%', height: '100%', p: 1 }}>
        <Box sx={fullSizeVideoSx}>
          <LocalVideo
            stream={localStream}
            isMicEnabled={isMicEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            username={userName}
            avatarUrl={localUserAvatarUrl}
            fullSize
          />
        </Box>
      </Box>
    );
  }

  const showRemoteAsMain = !mainParticipant?.isLocal;

  return (
    <Box sx={spotlightContainerSx}>
      <Box sx={spotlightMainSx}>
        {showRemoteAsMain ? (
          <RemoteVideo
            stream={remoteStream}
            isConnected={isConnected}
            username={remoteParticipant?.name ?? 'Teilnehmer'}
            isMicMuted={remoteParticipant?.isMuted ?? false}
            isVideoOff={!(remoteParticipant?.isVideoEnabled ?? true)}
            isScreenSharing={remoteParticipant?.isScreenSharing ?? false}
            avatarUrl={remoteParticipant?.avatar}
          />
        ) : (
          <LocalVideo
            stream={localStream}
            isMicEnabled={isMicEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            username={userName}
            avatarUrl={localUserAvatarUrl}
            fullSize
          />
        )}
      </Box>
      <Box sx={spotlightSideSx}>
        <Box sx={spotlightSideItemSx}>
          {showRemoteAsMain ? (
            <LocalVideo
              stream={localStream}
              isMicEnabled={isMicEnabled}
              isVideoEnabled={isVideoEnabled}
              isScreenSharing={isScreenSharing}
              username={userName}
              avatarUrl={localUserAvatarUrl}
              fullSize
            />
          ) : (
            <RemoteVideo
              stream={remoteStream}
              isConnected={isConnected}
              username={remoteParticipant?.name ?? 'Teilnehmer'}
              isMicMuted={remoteParticipant?.isMuted ?? false}
              isVideoOff={!(remoteParticipant?.isVideoEnabled ?? true)}
              isScreenSharing={false}
              avatarUrl={remoteParticipant?.avatar}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

const renderScreenShareLayout = (props: LayoutRenderProps): React.ReactNode => {
  const {
    localStream,
    remoteStream,
    screenStream,
    isConnected,
    isMicEnabled,
    isVideoEnabled,
    userName,
    localUserAvatarUrl,
    remoteParticipant,
  } = props;
  const hasRemoteStream = !!remoteStream;

  return (
    <Box sx={screenShareContainerSx}>
      <Box sx={screenShareSidebarSx}>
        <Box sx={screenShareVideoSx}>
          <LocalVideo
            stream={localStream}
            isMicEnabled={isMicEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={false}
            username={userName}
            avatarUrl={localUserAvatarUrl}
            fullSize
          />
        </Box>
        {hasRemoteStream ? (
          <Box sx={screenShareVideoSx}>
            <RemoteVideo
              stream={remoteStream}
              isConnected={isConnected}
              username={remoteParticipant?.name ?? 'Teilnehmer'}
              isMicMuted={remoteParticipant?.isMuted ?? false}
              isVideoOff={!(remoteParticipant?.isVideoEnabled ?? true)}
              isScreenSharing={false}
              avatarUrl={remoteParticipant?.avatar}
            />
          </Box>
        ) : null}
      </Box>
      <Box sx={screenShareMainSx}>
        {screenStream ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- Live screen share stream, captions not applicable
          <video
            autoPlay
            playsInline
            ref={(el): void => {
              if (el) {
                el.srcObject = screenStream;
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <Typography color="white" variant="body2">
            Keine Bildschirmfreigabe aktiv
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const renderPipLayout = (props: LayoutRenderProps): React.ReactNode => {
  const {
    localStream,
    remoteStream,
    isConnected,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    userName,
    localUserAvatarUrl,
    remoteParticipant,
  } = props;
  const hasRemoteStream = !!remoteStream;

  if (!hasRemoteStream) {
    return (
      <Box sx={fullSizeContainerSx}>
        <LocalVideo
          stream={localStream}
          isMicEnabled={isMicEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          username={userName}
          avatarUrl={localUserAvatarUrl}
          fullSize
        />
      </Box>
    );
  }

  return (
    <>
      <Box sx={fullSizeContainerSx}>
        <RemoteVideo
          stream={remoteStream}
          isConnected={isConnected}
          username={remoteParticipant?.name ?? 'Teilnehmer'}
          isMicMuted={remoteParticipant?.isMuted ?? false}
          isVideoOff={!(remoteParticipant?.isVideoEnabled ?? true)}
          isScreenSharing={remoteParticipant?.isScreenSharing ?? false}
          avatarUrl={remoteParticipant?.avatar}
        />
      </Box>
      <LocalVideo
        stream={localStream}
        isMicEnabled={isMicEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        username={userName}
        avatarUrl={localUserAvatarUrl}
      />
    </>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

interface NetworkStatsDisplayProps {
  stats: NetworkQualityStats;
  visible: boolean;
}

const NetworkStatsDisplay: React.FC<NetworkStatsDisplayProps> = ({ stats, visible }) => {
  if (!visible) return null;

  const getQualityIcon = (): React.ReactNode => {
    switch (stats.quality) {
      case 'excellent':
        return <SignalCellularAltIcon sx={{ color: 'success.main' }} />;
      case 'good':
        return <SignalCellularAlt2BarIcon sx={{ color: 'success.light' }} />;
      case 'fair':
        return <SignalCellularAlt1BarIcon sx={{ color: 'warning.main' }} />;
      case 'poor':
        return <SignalCellularConnectedNoInternet0BarIcon sx={{ color: 'error.main' }} />;
      case 'unknown':
        return <SignalCellularConnectedNoInternet0BarIcon sx={{ color: 'grey.500' }} />;
      default: {
        const _exhaustiveCheck: never = stats.quality;
        return _exhaustiveCheck;
      }
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
      case 'unknown':
        return 'default';
      default: {
        const _exhaustiveCheck: never = stats.quality;
        return _exhaustiveCheck;
      }
    }
  };

  return (
    <Box sx={networkStatsContainerSx}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {getQualityIcon()}
        <Chip label={stats.quality.toUpperCase()} size="small" color={getQualityColor()} />
      </Stack>

      <Typography variant="caption" sx={greyTextSx}>
        Video: {stats.videoBandwidth} kbps | Audio: {stats.audioBandwidth} kbps
      </Typography>
      <Typography variant="caption" sx={greyTextSx}>
        RTT: {stats.roundTripTime}ms | Jitter: {stats.videoJitter}ms
      </Typography>
      <Typography variant="caption" sx={greyTextSx}>
        Packet Loss: {stats.videoPacketsLostPerSecond}/s (video) | {stats.audioPacketsLostPerSecond}
        /s (audio)
      </Typography>
    </Box>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const VideoCallPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const { localStream, remoteStream, screenStream, cleanup: cleanupStreams } = useStreams();
  const networkStatus = useNetworkStatus();
  const dispatch = useAppDispatch();

  // Layout state from Redux
  const layoutMode = useAppSelector((state) => state.videoCall.layoutMode);
  const activeSpeakerId = useAppSelector((state) => state.videoCall.activeSpeakerId);

  // Video Call Hook (using composed modular hooks)
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
    callConfig,
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
  } = useVideoCallComposed();

  // Local State (defined before hooks that use them)
  const [callPhase, setCallPhase] = useState<'lobby' | 'call' | 'ended'>('lobby');
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQualityType>('connecting');
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const [showNetworkStats, setShowNetworkStats] = useState(false);

  // Berechne lokale Avatar-URL basierend auf Rolle (Initiator oder Participant)
  const localUserAvatarUrl = useMemo(() => {
    if (!callConfig || !user?.id) return;
    return user.id === callConfig.initiatorUserId
      ? callConfig.initiatorAvatarUrl
      : callConfig.participantAvatarUrl;
  }, [callConfig, user?.id]);

  const webrtcQuality = useNetworkQuality(peerConnection, {
    interval: 2000,
    enableLogging: import.meta.env.VITE_VERBOSE_NETWORK_QUALITY === 'true',
    onQualityChange: (quality) => {
      if (quality === 'poor') {
        setNetworkWarning(
          'Schlechte Verbindungsqualität erkannt. Videoqualität könnte beeinträchtigt sein.'
        );
      } else if (quality === 'fair') {
        setNetworkWarning('Mittelmäßige Verbindungsqualität.');
      } else {
        setNetworkWarning(null);
      }
    },
  });

  const isCallActiveRef = useRef(false);
  const hangUpRef = useRef(hangUp);
  const roomIdRef = useRef(roomId);
  const callDurationRef = useRef(callDuration);
  const isConnectedRef = useRef(isConnected);

  // ========================================================================
  // Sync Refs with State (konsolidiert für bessere Performance)
  // ========================================================================

  useEffect(() => {
    hangUpRef.current = hangUp;
    roomIdRef.current = roomId;
    callDurationRef.current = callDuration;
    isConnectedRef.current = isConnected;
  }, [hangUp, roomId, callDuration, isConnected]);

  // ========================================================================
  // Call Initialization (only when user joins from lobby)
  // ========================================================================

  const handleJoinFromLobby = useCallback(async () => {
    if (!appointmentId) return;

    try {
      console.debug('🚀 Starting video call initialization from lobby...');
      if (browserInfo.isSafari) {
        console.debug('🍎 Safari detected - using Safari-specific WebRTC configuration');
      }
      setCallPhase('call');

      await startVideoCall(appointmentId);

      console.debug('✅ Video call initialization completed');
      isCallActiveRef.current = true;
    } catch (err) {
      console.error('❌ Video call initialization failed:', err);
      isCallActiveRef.current = false;
      setCallPhase('lobby');
    }
  }, [appointmentId, startVideoCall]);

  const handleCancelFromLobby = useCallback((): void => {
    void navigate('/appointments');
  }, [navigate]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      console.debug('🧹 VideoCallPage cleanup triggered');

      if (isCallActiveRef.current) {
        console.debug('🔌 Cleaning up active call on unmount');
        void hangUpRef.current();
        cleanupStreams();
        isCallActiveRef.current = false;
      }
    },
    [cleanupStreams]
  );

  // ========================================================================
  // Browser Close / Tab Close Handler
  // ========================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
      if (isCallActiveRef.current && isConnectedRef.current) {
        // Synchronous cleanup
        void hangUpRef.current();
        cleanupStreams();

        e.preventDefault();
        // Modern browsers ignore the return value, but we still need to set it for legacy support
        return '';
      }
      return undefined;
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden' && isCallActiveRef.current) {
        console.debug('📱 Tab hidden - call still active');
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
    const quality = determineConnectionQuality(
      isConnected,
      roomId,
      webrtcQuality.quality,
      networkStatus
    );
    setConnectionQuality(quality);
  }, [isConnected, roomId, webrtcQuality.quality, networkStatus]);

  // ========================================================================
  // Debug Info (Development only)
  // ========================================================================

  useEffect(() => {
    // Only log if explicitly enabled via env var to avoid console spam
    if (import.meta.env.VITE_VERBOSE_VIDEOCALL !== 'true') return;

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

    console.debug('📊 VideoCallPage State:', debugInfo);
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

  const handleExit = useCallback(async (): Promise<void> => {
    console.debug('📞 User initiated call end');
    setExitConfirmOpen(false);

    try {
      isCallActiveRef.current = false;
      await hangUpRef.current();
      cleanupStreams();
    } catch (err) {
      console.error('Exit cleanup error:', err);
    } finally {
      void navigate('/appointments');
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

  const handleLayoutChange = useCallback(
    (mode: LayoutMode) => {
      dispatch(setLayoutMode(mode));
    },
    [dispatch]
  );

  // Debug Handler
  const handleDebug = useCallback((): void => {
    console.debug('🎥 WEBRTC DEBUG INFO');
    console.debug('=== STREAMS ===');
    console.debug('Local Stream:', localStream);
    console.debug(
      'Local Tracks:',
      localStream?.getTracks().map((t: MediaStreamTrack) => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted,
      }))
    );

    console.debug('Remote Stream:', remoteStream);
    console.debug(
      'Remote Tracks:',
      remoteStream?.getTracks().map((t: MediaStreamTrack) => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState,
      }))
    );

    console.debug('=== STATE ===');
    console.debug('isCallActive:', isCallActiveRef.current);
    console.debug('isConnected:', isConnected);
    console.debug('roomId:', roomId);
    console.debug('callDuration:', callDuration);

    console.debug('=== NETWORK ===');
    console.debug('Browser Status:', networkStatus);
    console.debug('WebRTC Quality:', webrtcQuality);

    console.debug('=== E2EE ===');
    console.debug('Video E2EE:', e2ee);
    console.debug('Chat E2EE:', chatE2EE);

    // Check video elements
    const localVideo = document.querySelector<HTMLVideoElement>('#localVideo');
    const remoteVideo = document.querySelector<HTMLVideoElement>('#remoteVideo');
    console.debug('=== VIDEO ELEMENTS ===');
    console.debug('Local Video srcObject:', localVideo?.srcObject);
    console.debug('Remote Video srcObject:', remoteVideo?.srcObject);
  }, [
    localStream,
    remoteStream,
    isConnected,
    roomId,
    callDuration,
    networkStatus,
    webrtcQuality,
    e2ee,
    chatE2EE,
  ]);

  // ========================================================================
  // Derived Data (MUST be before early returns to follow Rules of Hooks!)
  // ========================================================================

  const remoteParticipant = participants.find((p) => p.id !== user?.id);

  // Create participants array for VideoLayout
  // WICHTIG: Remote-Teilnehmer nur hinzufügen wenn remoteStream existiert!
  // Das verhindert "Warte-Platzhalter" bevor der User wirklich gejoint ist.
  const layoutParticipants = useMemo(() => {
    const participantsList = [];

    // Add local user (immer hinzufügen wenn localStream existiert)
    if (user && localStream) {
      participantsList.push({
        id: user.id,
        name: user.firstName || 'Du',
        videoStream: localStream,
        isLocal: true,
        isSpeaking: activeSpeakerId === user.id,
        isScreenSharing,
      });
    }

    // Add remote participant NUR wenn remoteStream existiert
    // (nicht nur wenn remoteParticipant im Redux-State ist)
    if (remoteParticipant && remoteStream) {
      participantsList.push({
        id: remoteParticipant.id,
        name: remoteParticipant.name,
        videoStream: remoteStream,
        isLocal: false,
        isSpeaking: activeSpeakerId === remoteParticipant.id,
        isScreenSharing: remoteParticipant.isScreenSharing,
      });
    }

    return participantsList;
  }, [user, localStream, remoteStream, remoteParticipant, activeSpeakerId, isScreenSharing]);

  // ========================================================================
  // Error State
  // ========================================================================

  if (error && callPhase === 'call') {
    return (
      <Box sx={errorContainerSx}>
        <Typography variant="h5" color="error" gutterBottom>
          Fehler beim Herstellen des Videoanrufs
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={errorMessageSx}>
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
  // Loading State (only during call phase)
  // ========================================================================

  if (isLoading && callPhase === 'call') {
    return <LoadingSpinner fullPage message="Videoanruf wird gestartet..." />;
  }

  // ========================================================================
  // Pre-Call Lobby Phase
  // ========================================================================

  if (callPhase === 'lobby') {
    return (
      <PreCallLobby
        appointmentId={appointmentId ?? ''}
        appointmentTitle="Skill-Austausch Session"
        onJoinCall={handleJoinFromLobby}
        onCancel={handleCancelFromLobby}
      />
    );
  }

  // ========================================================================
  // Active Call Render
  // ========================================================================

  return (
    <Box sx={mainContainerSx}>
      {/* Connection Status */}
      <ConnectionStatus quality={connectionQuality} hideWhenGood />

      {/* E2EE Status Indicator (Chip) */}
      {e2ee.status !== 'disabled' && (
        <Box
          sx={{
            ...e2eeStatusBoxSx,
            left: isChatOpen ? 16 : 'auto',
            right: isChatOpen ? 'auto' : 16,
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

      {/* E2EE Debug Panel (Development Only) */}
      {import.meta.env.DEV ? (
        <E2EEDebugPanel
          status={e2ee.status}
          localFingerprint={e2ee.localKeyFingerprint}
          remoteFingerprint={e2ee.remotePeerFingerprint}
          keyGeneration={e2ee.keyGeneration}
          encryptionStats={e2ee.encryptionStats}
          errorMessage={e2ee.errorMessage}
          onRotateKeys={e2ee.rotateKeys}
          chatStatus={chatE2EE.status}
          chatLocalFingerprint={chatE2EE.localFingerprint}
          chatStats={chatE2EE.stats}
          compact={isChatOpen}
        />
      ) : null}

      {/* Video Layout Container */}
      <VideoLayout
        participants={layoutParticipants}
        localStream={localStream ?? undefined}
        screenShareStream={screenStream ?? undefined}
        activeLayoutMode={layoutMode}
        onLayoutChange={handleLayoutChange}
        activeSpeakerId={activeSpeakerId ?? undefined}
        showLayoutControls
      >
        {({ mode, mainParticipant, sideParticipants: _sideParticipants }) => {
          const layoutProps: LayoutRenderProps = {
            localStream,
            remoteStream,
            screenStream,
            isConnected,
            isMicEnabled,
            isVideoEnabled,
            isScreenSharing,
            userName: user?.firstName ?? 'Du',
            localUserAvatarUrl: localUserAvatarUrl ?? undefined,
            remoteParticipant,
            mainParticipant,
          };

          switch (mode) {
            case 'grid':
              return renderGridLayout(layoutProps);
            case 'spotlight':
              return renderSpotlightLayout(layoutProps);
            case 'screenShare':
              return renderScreenShareLayout(layoutProps);
            case 'pip':
              return renderPipLayout(layoutProps);
            default: {
              // Exhaustiveness check - this should never be reached
              const _exhaustiveCheck: never = mode;
              return _exhaustiveCheck;
            }
          }
        }}
      </VideoLayout>

      {/* Network Stats Display */}
      <NetworkStatsDisplay stats={webrtcQuality} visible={showNetworkStats} />

      {/* Chat Panel */}
      {isChatOpen ? (
        <Box sx={chatPanelContainerSx}>
          <ChatPanel
            messages={messages}
            onSendMessage={sendChatMessage}
            onClose={toggleChatPanel}
            currentUserId={user?.id ?? ''}
            e2eeStatus={chatE2EE.status}
            isE2EEActive={chatE2EE.isActive}
            messagesEncrypted={chatE2EE.stats.messagesEncrypted}
            messagesDecrypted={chatE2EE.stats.messagesDecrypted}
            verificationFailures={chatE2EE.stats.verificationFailures}
          />
        </Box>
      ) : null}

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
        <Box sx={debugContainerSx}>
          <Button variant="outlined" size="small" onClick={handleDebug} sx={debugButtonSx}>
            Debug
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleToggleNetworkStats}
            sx={{
              ...debugButtonSx,
              backgroundColor: showNetworkStats ? 'rgba(76,175,80,0.7)' : 'rgba(0,0,0,0.7)',
              '&:hover': {
                backgroundColor: showNetworkStats ? 'rgba(76,175,80,0.9)' : 'rgba(0,0,0,0.9)',
              },
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

// ============================================================================
// Wrapper Component with Provider
// ============================================================================

const VideoCallPage: React.FC = () => (
  <VideoCallProvider>
    <VideoCallPageContent />
  </VideoCallProvider>
);

export default VideoCallPage;
