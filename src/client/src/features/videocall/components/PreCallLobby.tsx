import React, { useEffect, useCallback } from 'react';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Settings as SettingsIcon,
  VolumeUp as VolumeUpIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  LinearProgress,
  Tooltip,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import browserInfo from '../../../shared/utils/browserDetection';
import useAuth from '../../auth/hooks/useAuth';
import usePreCall from '../hooks/usePreCall';
import type { DeviceCheckStatus } from '../store/preCallSlice';

// ============================================================================
// Types
// ============================================================================

interface PreCallLobbyProps {
  appointmentId: string;
  appointmentTitle?: string;
  otherPartyName?: string;
  otherPartyAvatarUrl?: string;
  scheduledTime?: string;
  onJoinCall: () => void;
  onCancel: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const getAudioLevelColor = (level: number): string => {
  if (level > 70) return 'success.main';
  if (level > 30) return 'warning.main';
  return 'grey.500';
};

const getDeviceCheckIcon = (status: DeviceCheckStatus): React.ReactElement | null => {
  switch (status) {
    case 'success':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'error':
    case 'not-found':
      return <WarningIcon color="error" fontSize="small" />;
    case 'pending':
    case 'checking':
      return null;
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
};

// ============================================================================
// Sub-components
// ============================================================================

interface MeetingHeaderProps {
  otherPartyName?: string;
  otherPartyAvatarUrl?: string;
  scheduledTime?: string;
}

const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  otherPartyName,
  otherPartyAvatarUrl,
  scheduledTime,
}) => {
  if (!otherPartyName) return null;

  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
      <Avatar src={otherPartyAvatarUrl} sx={{ width: 48, height: 48 }}>
        {otherPartyName[0]}
      </Avatar>
      <Box>
        <Typography variant="body1">Meeting mit {otherPartyName}</Typography>
        {scheduledTime ? (
          <Typography variant="body2" color="text.secondary">
            Geplant: {scheduledTime}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
};

interface VideoPreviewContentProps {
  isLoading: boolean;
  isCameraEnabled: boolean;
  userInitial: string;
  setVideoPreviewRef: (el: HTMLVideoElement | null) => void;
}

const VideoPreviewContent: React.FC<VideoPreviewContentProps> = ({
  isLoading,
  isCameraEnabled,
  userInitial,
  setVideoPreviewRef,
}) => {
  if (isLoading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LinearProgress sx={{ width: '60%' }} />
      </Box>
    );
  }

  if (isCameraEnabled) {
    return (
      <video
        ref={setVideoPreviewRef}
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
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>{userInitial}</Avatar>
      <Typography color="grey.400">Kamera ausgeschaltet</Typography>
    </Box>
  );
};

interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface DeviceStatusListProps {
  deviceCheckStatus: {
    camera: DeviceCheckStatus;
    microphone: DeviceCheckStatus;
    speaker: DeviceCheckStatus;
  };
  cameras: DeviceInfo[];
  microphones: DeviceInfo[];
  speakers: DeviceInfo[];
}

const DeviceStatusList: React.FC<DeviceStatusListProps> = ({
  deviceCheckStatus,
  cameras,
  microphones,
  speakers,
}) => {
  const getSpeakerStatus = (): string => {
    if (speakers.length > 0) return 'Verfügbar';
    return browserInfo.isSafari ? 'Standard (Safari)' : 'Nicht gefunden';
  };

  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        {getDeviceCheckIcon(deviceCheckStatus.camera)}
        <Typography variant="body2">
          Kamera: {cameras.length > 0 ? 'Verfügbar' : 'Nicht gefunden'}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {getDeviceCheckIcon(deviceCheckStatus.microphone)}
        <Typography variant="body2">
          Mikrofon: {microphones.length > 0 ? 'Verfügbar' : 'Nicht gefunden'}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {getDeviceCheckIcon(deviceCheckStatus.speaker)}
        <Typography variant="body2">Lautsprecher: {getSpeakerStatus()}</Typography>
      </Stack>
    </Stack>
  );
};

// ============================================================================
// Component
// ============================================================================

const PreCallLobby: React.FC<PreCallLobbyProps> = ({
  appointmentTitle = 'Video Call',
  otherPartyName,
  otherPartyAvatarUrl,
  scheduledTime,
  onJoinCall,
  onCancel,
}) => {
  const { user } = useAuth();

  // PreCall Hook (Redux-basiert)
  const {
    // State
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    cameras,
    microphones,
    speakers,
    isCameraEnabled,
    isMicEnabled,
    audioLevel,
    deviceCheckStatus,
    showDeviceSettings,
    isLoading,
    error,
    joinWithVideo,
    joinWithAudio,
    hasDeviceError,

    // Actions
    startPreview,
    toggleCamera,
    toggleMic,
    toggleSettings,
    selectCamera,
    selectMicrophone,
    selectSpeaker,
    setJoinWithVideo,
    setJoinWithAudio,
    prepareForJoin,
    cleanup,

    // Refs
    setVideoPreviewRef,
  } = usePreCall();

  // ========================================================================
  // Effects
  // ========================================================================

  // Start preview on mount only - device changes are handled by user clicking Refresh
  // FIXED: Removed second useEffect that caused infinite loop
  // The loop occurred because:
  // 1. startPreview() -> enumerateDevices() -> Redux dispatch
  // 2. Redux updated selectedCamera/selectedMicrophone
  // 3. Second useEffect had these as dependencies -> triggered startPreview()
  // 4. Back to step 1 -> infinite loop
  useEffect(() => {
    // Start preview on mount
    startPreview().catch((err: unknown) => {
      console.error('Failed to start preview:', err);
    });

    // Cleanup on unmount (cleanup is synchronous, not async)
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleJoinCall = useCallback(async () => {
    await prepareForJoin();
    onJoinCall();
  }, [prepareForJoin, onJoinCall]);

  // Compute user initial for avatar
  const userInitial = user?.firstName.startsWith('') === true ? user.firstName[0] : 'U';

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 900,
          width: '100%',
          p: 4,
          borderRadius: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {appointmentTitle}
          </Typography>
          <MeetingHeader
            otherPartyName={otherPartyName}
            otherPartyAvatarUrl={otherPartyAvatarUrl}
            scheduledTime={scheduledTime}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Error Alert */}
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* Video Preview */}
          <Box sx={{ flex: '1 1 400px', minWidth: 300 }}>
            <Paper
              sx={{
                position: 'relative',
                aspectRatio: '16/9',
                bgcolor: 'grey.900',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <VideoPreviewContent
                isLoading={isLoading}
                isCameraEnabled={isCameraEnabled}
                userInitial={userInitial}
                setVideoPreviewRef={setVideoPreviewRef}
              />

              {/* User Name Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="white">
                  {user?.firstName} {user?.lastName} (Du)
                </Typography>
              </Box>
            </Paper>

            {/* Controls */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              <Tooltip title={isMicEnabled ? 'Mikrofon ausschalten' : 'Mikrofon einschalten'}>
                <IconButton
                  onClick={toggleMic}
                  sx={{
                    bgcolor: isMicEnabled ? 'primary.main' : 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: isMicEnabled ? 'primary.dark' : 'error.dark',
                    },
                  }}
                >
                  {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={isCameraEnabled ? 'Kamera ausschalten' : 'Kamera einschalten'}>
                <IconButton
                  onClick={toggleCamera}
                  sx={{
                    bgcolor: isCameraEnabled ? 'primary.main' : 'error.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: isCameraEnabled ? 'primary.dark' : 'error.dark',
                    },
                  }}
                >
                  {isCameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Einstellungen">
                <IconButton onClick={toggleSettings}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Geräte aktualisieren">
                <span>
                  <IconButton onClick={startPreview} disabled={isLoading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {/* Audio Level Indicator */}
            {isMicEnabled ? (
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VolumeUpIcon fontSize="small" color="action" />
                  <LinearProgress
                    variant="determinate"
                    value={audioLevel}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.300',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getAudioLevelColor(audioLevel),
                      },
                    }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Mikrofonpegel - Sprechen Sie, um zu testen
                </Typography>
              </Box>
            ) : null}
          </Box>

          {/* Settings Panel */}
          <Box sx={{ flex: '1 1 300px', minWidth: 250 }}>
            {/* Device Status */}
            <Typography variant="subtitle2" gutterBottom>
              Gerätestatus
            </Typography>
            <DeviceStatusList
              deviceCheckStatus={deviceCheckStatus}
              cameras={cameras}
              microphones={microphones}
              speakers={speakers}
            />

            {/* Device Selection (when settings expanded) */}
            {showDeviceSettings ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Geräteauswahl
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Kamera</InputLabel>
                    <Select
                      value={selectedCamera ?? ''}
                      label="Kamera"
                      onChange={(e) => {
                        selectCamera(e.target.value);
                      }}
                    >
                      {cameras.map((cam) => (
                        <MenuItem key={cam.deviceId} value={cam.deviceId}>
                          {cam.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Mikrofon</InputLabel>
                    <Select
                      value={selectedMicrophone ?? ''}
                      label="Mikrofon"
                      onChange={(e) => {
                        selectMicrophone(e.target.value);
                      }}
                    >
                      {microphones.map((mic) => (
                        <MenuItem key={mic.deviceId} value={mic.deviceId}>
                          {mic.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Lautsprecher</InputLabel>
                    <Select
                      value={selectedSpeaker ?? ''}
                      label="Lautsprecher"
                      onChange={(e) => {
                        selectSpeaker(e.target.value);
                      }}
                    >
                      {speakers.map((spk) => (
                        <MenuItem key={spk.deviceId} value={spk.deviceId}>
                          {spk.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </>
            ) : null}

            {/* Join Options */}
            <Divider sx={{ my: 3 }} />
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={joinWithVideo}
                    onChange={(e) => {
                      setJoinWithVideo(e.target.checked);
                    }}
                  />
                }
                label="Mit Video beitreten"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={joinWithAudio}
                    onChange={(e) => {
                      setJoinWithAudio(e.target.checked);
                    }}
                  />
                }
                label="Mit Audio beitreten"
              />
            </Stack>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="outlined" size="large" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleJoinCall}
            disabled={isLoading || hasDeviceError}
          >
            Beitreten
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PreCallLobby;
