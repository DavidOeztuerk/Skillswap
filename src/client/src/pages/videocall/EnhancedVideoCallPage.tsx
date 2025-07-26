import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Badge,
  AppBar,
  Toolbar,
  Fab,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  CallEnd as CallEndIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  RecordVoiceOver as RecordIcon,
  Stop as StopIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  SignalCellular4Bar as Signal4Icon,
  SignalCellular3Bar as Signal3Icon,
  SignalCellular2Bar as Signal2Icon,
  SignalCellular1Bar as Signal1Icon,
  SignalCellularOff as SignalOffIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import {
  getCallConfig,
  joinVideoCall,
  leaveVideoCall,
  startRecording,
  stopRecording,
  toggleMic,
  toggleVideo,
  toggleScreenShare,
  toggleChat,
  addMessage,
  resetCall,
} from '../../features/videocall/videoCallSlice';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import { formatDuration } from '../../utils/formatters';

const EnhancedVideoCallPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Local state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [volume, setVolume] = useState(100);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [callTimer, setCallTimer] = useState(0);

  // Redux state
  const {
    roomId,
    isConnected,
    isInitializing,
    localStream,
    remoteStream,
    callStartTime,
    connectionQuality,
    isMicEnabled,
    isVideoEnabled,
    isScreenSharing,
    isChatOpen,
    isRecording,
    messages,
    callStatistics,
    isLoading,
    error,
  } = useAppSelector((state) => state.videoCall);

  useEffect(() => {
    if (appointmentId) {
      dispatch(getCallConfig(appointmentId));
    }

    return () => {
      dispatch(resetCall());
    };
  }, [appointmentId, dispatch]);

  // Start call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallTimer(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected, callStartTime]);

  const handleJoinCall = useCallback(() => {
    if (roomId) {
      dispatch(joinVideoCall(roomId));
    }
  }, [roomId, dispatch]);

  const handleLeaveCall = useCallback(() => {
    if (roomId) {
      dispatch(leaveVideoCall(roomId));
      navigate('/appointments');
    }
  }, [roomId, dispatch, navigate]);

  const handleToggleMic = useCallback(() => {
    dispatch(toggleMic());
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, [dispatch, localStream]);

  const handleToggleVideo = useCallback(() => {
    dispatch(toggleVideo());
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, [dispatch, localStream]);

  const handleToggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        dispatch(toggleScreenShare());
      } else {
        dispatch(toggleScreenShare());
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing, dispatch]);

  const handleToggleRecording = useCallback(() => {
    if (roomId) {
      if (isRecording) {
        dispatch(stopRecording(roomId));
      } else {
        dispatch(startRecording(roomId));
      }
    }
  }, [roomId, isRecording, dispatch]);

  const handleSendMessage = useCallback(() => {
    if (chatMessage.trim() && roomId) {
      const message = {
        id: Date.now().toString(),
        senderId: 'current-user',
        senderName: 'You',
        content: chatMessage.trim(),
        timestamp: new Date(),
        type: 'text' as const,
      };
      dispatch(addMessage({
        ...message,
        timestamp: message.timestamp.toISOString(),
      }));
      setChatMessage('');
    }
  }, [chatMessage, roomId, dispatch]);

  const handleVolumeChange = useCallback((_event: Event, newValue: number | number[]) => {
    const volumeValue = Array.isArray(newValue) ? newValue[0] : newValue;
    setVolume(volumeValue);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = volumeValue / 100;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const getConnectionIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return <Signal4Icon color="success" />;
      case 'good':
        return <Signal3Icon color="success" />;
      case 'fair':
        return <Signal2Icon color="warning" />;
      case 'poor':
        return <Signal1Icon color="error" />;
      default:
        return <SignalOffIcon color="error" />;
    }
  };

  const handleReportIssue = () => {
    setReportDialogOpen(false);
    setReportIssue('');
    setReportDescription('');
  };

  if (isLoading || isInitializing) {
    return <LoadingSpinner fullPage message="Verbindung wird hergestellt..." />;
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <AlertMessage
          severity="error"
          message={[error.message]}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      {/* Main Video Area */}
      <Box display="flex" sx={{ height: '100%' }}>
        {/* Remote Video (Main) */}
        <Box sx={{ flex: isChatOpen ? '0 0 75%' : '1 1 100%', position: 'relative', height: '100%' }}>
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
              sx={{ background: 'linear-gradient(45deg, #1e3c72, #2a5298)' }}
            >
              <Box textAlign="center">
                <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}>
                  <PersonIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h5" color="white">
                  Warten auf Teilnehmer...
                </Typography>
                {!isConnected && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleJoinCall}
                    sx={{ mt: 3 }}
                  >
                    Call beitreten
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {localStream && (
            <Paper
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 200,
                height: 150,
                overflow: 'hidden',
                borderRadius: 2,
                zIndex: 10,
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />
            </Paper>
          )}

          {/* Connection Quality Indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 10,
            }}
          >
            <Chip
              icon={getConnectionIcon(connectionQuality)}
              label={connectionQuality.toUpperCase()}
              color={connectionQuality === 'poor' ? 'error' : connectionQuality === 'fair' ? 'warning' : 'success'}
              variant="filled"
            />
          </Box>

          {/* Call Duration */}
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            <Chip
              label={formatDuration(callTimer)}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>

          {/* Recording Indicator */}
          {isRecording && (
            <Box
              sx={{
                position: 'absolute',
                top: 70,
                left: 20,
                zIndex: 10,
              }}
            >
              <Chip
                icon={<RecordIcon />}
                label="AUFNAHME"
                color="error"
                variant="filled"
                sx={{ animation: 'pulse 1.5s infinite' }}
              />
            </Box>
          )}
        </Box>

        {/* Chat Panel */}
        {isChatOpen && (
          <Box sx={{ flex: '0 0 25%', height: '100%', backgroundColor: '#f5f5f5' }}>
            <Box display="flex" flexDirection="column" height="100%">
              {/* Chat Header */}
              <AppBar position="static" color="default" elevation={0}>
                <Toolbar sx={{ minHeight: '48px !important' }}>
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    Chat
                  </Typography>
                  <IconButton size="small" onClick={() => dispatch(toggleChat())}>
                    <CloseIcon />
                  </IconButton>
                </Toolbar>
              </AppBar>

              {/* Messages */}
              <Box flex={1} sx={{ overflow: 'auto', p: 1 }}>
                {messages.map((message) => (
                  <Box key={message.id} mb={1}>
                    <Paper
                      sx={{
                        p: 1,
                        backgroundColor: message.senderId === 'current-user' ? '#e3f2fd' : '#f3e5f5',
                        ml: message.senderId === 'current-user' ? 2 : 0,
                        mr: message.senderId === 'current-user' ? 0 : 2,
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {message.senderName}
                      </Typography>
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              {/* Message Input */}
              <Box p={1}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nachricht eingeben..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <IconButton onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Controls Bar */}
      {(showControls || !isConnected) && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            p: 2,
            zIndex: 20,
          }}
        >
          <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
            {/* Main Controls */}
            <Tooltip title={isMicEnabled ? 'Mikrofon stummschalten' : 'Mikrofon aktivieren'}>
              <Fab
                color={isMicEnabled ? 'default' : 'error'}
                onClick={handleToggleMic}
                disabled={!isConnected}
              >
                {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
              </Fab>
            </Tooltip>

            <Tooltip title={isVideoEnabled ? 'Kamera ausschalten' : 'Kamera einschalten'}>
              <Fab
                color={isVideoEnabled ? 'default' : 'error'}
                onClick={handleToggleVideo}
                disabled={!isConnected}
              >
                {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </Fab>
            </Tooltip>

            <Tooltip title={isScreenSharing ? 'Bildschirmfreigabe beenden' : 'Bildschirm freigeben'}>
              <Fab
                color={isScreenSharing ? 'secondary' : 'default'}
                onClick={handleToggleScreenShare}
                disabled={!isConnected}
              >
                {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </Fab>
            </Tooltip>

            <Tooltip title="Call beenden">
              <Fab
                color="error"
                onClick={handleLeaveCall}
                sx={{ mx: 2 }}
              >
                <CallEndIcon />
              </Fab>
            </Tooltip>

            <Tooltip title={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}>
              <Fab
                color={isRecording ? 'error' : 'default'}
                onClick={handleToggleRecording}
                disabled={!isConnected}
              >
                {isRecording ? <StopIcon /> : <RecordIcon />}
              </Fab>
            </Tooltip>

            <Tooltip title="Chat">
              <Badge badgeContent={messages.length} color="primary">
                <Fab
                  color={isChatOpen ? 'primary' : 'default'}
                  onClick={() => dispatch(toggleChat())}
                  disabled={!isConnected}
                >
                  <ChatIcon />
                </Fab>
              </Badge>
            </Tooltip>

            <Tooltip title="Einstellungen">
              <Fab
                color="default"
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon />
              </Fab>
            </Tooltip>

            <Tooltip title={isFullscreen ? 'Vollbild verlassen' : 'Vollbild'}>
              <Fab
                color="default"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Call-Einstellungen</DialogTitle>
        <DialogContent>
          <Box py={2}>
            {/* Audio Settings */}
            <Typography variant="h6" gutterBottom>
              Audio
            </Typography>
            <Box mb={3}>
              <Typography gutterBottom>Lautstärke</Typography>
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>

            {/* Call Statistics */}
            <Typography variant="h6" gutterBottom>
              Verbindungsstatistiken
            </Typography>
            <Box>
              <Typography variant="body2">
                Netzwerk-Qualität: {callStatistics.networkQuality}
              </Typography>
              <Typography variant="body2">
                Bandbreite: {callStatistics.bandwidth} kbps
              </Typography>
              <Typography variant="body2">
                Verlorene Pakete: {callStatistics.packetsLost}
              </Typography>
              <Typography variant="body2">
                Audio-Level: {callStatistics.audioLevel}%
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<WarningIcon />}
              onClick={() => {
                setSettingsOpen(false);
                setReportDialogOpen(true);
              }}
              sx={{ mt: 2 }}
            >
              Technisches Problem melden
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Technisches Problem melden</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Problem-Typ</InputLabel>
            <Select
              value={reportIssue}
              label="Problem-Typ"
              onChange={(e) => setReportIssue(e.target.value)}
            >
              <MenuItem value="audio">Audio-Probleme</MenuItem>
              <MenuItem value="video">Video-Probleme</MenuItem>
              <MenuItem value="connection">Verbindungsprobleme</MenuItem>
              <MenuItem value="lag">Verzögerung/Lag</MenuItem>
              <MenuItem value="other">Sonstiges</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Beschreibung"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="Beschreiben Sie das Problem im Detail..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleReportIssue} variant="contained" disabled={!reportIssue}>
            Melden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedVideoCallPage;