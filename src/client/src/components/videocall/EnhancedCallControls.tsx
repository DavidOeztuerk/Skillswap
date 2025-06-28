// src/components/videocall/EnhancedCallControls.tsx
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Slider,
  Typography,
  Divider,
  Badge,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideoIcon,
  VideocamOff as VideoOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  CallEnd as CallEndIcon,
  Settings as SettingsIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  PictureInPicture as PipIcon,
  Stop as StopIcon,
  FiberManualRecord as RecordIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface EnhancedCallControlsProps {
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isRecording?: boolean;
  isFullscreen?: boolean;
  isPictureInPicture?: boolean;
  volume: number;
  chatMessageCount?: number;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
  onToggleRecording?: () => void;
  onToggleFullscreen?: () => void;
  onTogglePictureInPicture?: () => void;
  onVolumeChange?: (volume: number) => void;
  onOpenSettings?: () => void;
}

const EnhancedCallControls: React.FC<EnhancedCallControlsProps> = ({
  isMicEnabled,
  isVideoEnabled,
  isScreenSharing,
  isChatOpen,
  isRecording = false,
  isFullscreen = false,
  isPictureInPicture = false,
  volume,
  chatMessageCount = 0,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onEndCall,
  onToggleRecording,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onVolumeChange,
  onOpenSettings,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setSettingsAnchorEl(null);
    setMoreAnchorEl(null);
  };

  const primaryControls = [
    {
      tooltip: isMicEnabled ? 'Mikrofon ausschalten' : 'Mikrofon einschalten',
      icon: isMicEnabled ? <MicIcon /> : <MicOffIcon />,
      color: isMicEnabled ? 'primary' : 'error',
      onClick: onToggleMic,
      'aria-label': 'Mikrofon umschalten',
      important: true,
    },
    {
      tooltip: isVideoEnabled ? 'Kamera ausschalten' : 'Kamera einschalten',
      icon: isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />,
      color: isVideoEnabled ? 'primary' : 'error',
      onClick: onToggleVideo,
      'aria-label': 'Kamera umschalten',
      important: true,
    },
    {
      tooltip: isScreenSharing ? 'Bildschirmfreigabe beenden' : 'Bildschirm freigeben',
      icon: isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />,
      color: isScreenSharing ? 'secondary' : 'primary',
      onClick: onToggleScreenShare,
      'aria-label': 'Bildschirmfreigabe umschalten',
    },
    {
      tooltip: isChatOpen ? 'Chat schließen' : 'Chat öffnen',
      icon: <ChatIcon />,
      color: isChatOpen ? 'secondary' : 'primary',
      onClick: onToggleChat,
      'aria-label': 'Chat umschalten',
      badge: chatMessageCount > 0 ? chatMessageCount : undefined,
    },
  ];

  const secondaryControls = [
    {
      tooltip: isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten',
      icon: isRecording ? <StopIcon /> : <RecordIcon />,
      color: isRecording ? 'error' : 'primary',
      onClick: onToggleRecording,
      'aria-label': 'Aufnahme umschalten',
      show: !!onToggleRecording,
    },
    {
      tooltip: isFullscreen ? 'Vollbild verlassen' : 'Vollbild',
      icon: isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />,
      color: 'primary',
      onClick: onToggleFullscreen,
      'aria-label': 'Vollbild umschalten',
      show: !!onToggleFullscreen,
    },
    {
      tooltip: isPictureInPicture ? 'PiP verlassen' : 'Picture-in-Picture',
      icon: <PipIcon />,
      color: isPictureInPicture ? 'secondary' : 'primary',
      onClick: onTogglePictureInPicture,
      'aria-label': 'Picture-in-Picture umschalten',
      show: !!onTogglePictureInPicture,
    },
  ];

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? 1 : 2,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: isMobile ? 0.5 : 1,
          alignItems: 'center',
        }}
      >
        {/* Primary controls */}
        {primaryControls.map((control, index) => {
          const IconComponent = control.badge !== undefined ? (
            <Badge badgeContent={control.badge} color="error">
              {control.icon}
            </Badge>
          ) : control.icon;

          return (
            <Tooltip key={index} title={control.tooltip} arrow>
              <IconButton
                color={control.color as 'primary' | 'secondary' | 'error'}
                onClick={control.onClick}
                aria-label={control['aria-label']}
                size={isMobile ? 'medium' : 'large'}
                sx={{
                  backgroundColor: control.important ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  ...(control.color === 'error' && {
                    backgroundColor: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.error.dark,
                    },
                  }),
                }}
              >
                {IconComponent}
              </IconButton>
            </Tooltip>
          );
        })}

        {!isMobile && (
          <>
            {/* Secondary controls */}
            {secondaryControls
              .filter(control => control.show)
              .map((control, index) => (
                <Tooltip key={`secondary-${index}`} title={control.tooltip} arrow>
                  <IconButton
                    color={control.color as 'primary' | 'secondary'}
                    onClick={control.onClick}
                    aria-label={control['aria-label']}
                    size="large"
                    sx={{
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    {control.icon}
                  </IconButton>
                </Tooltip>
              ))}

            {/* Volume control */}
            {onVolumeChange && (
              <Tooltip title="Lautstärke" arrow>
                <IconButton
                  onClick={handleSettingsClick}
                  size="large"
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  {volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
              </Tooltip>
            )}
          </>
        )}

        {/* More options for mobile */}
        {isMobile && (
          <Tooltip title="Weitere Optionen" arrow>
            <IconButton
              onClick={handleMoreClick}
              size="medium"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Settings */}
        {onOpenSettings && (
          <Tooltip title="Einstellungen" arrow>
            <IconButton
              onClick={onOpenSettings}
              size={isMobile ? 'medium' : 'large'}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* End call button */}
        <Tooltip title="Anruf beenden" arrow>
          <IconButton
            color="error"
            onClick={onEndCall}
            aria-label="Anruf beenden"
            size={isMobile ? 'medium' : 'large'}
            sx={{
              backgroundColor: theme.palette.error.main,
              color: 'white',
              ml: 2,
              '&:hover': {
                backgroundColor: theme.palette.error.dark,
              },
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Volume/Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            minWidth: 250,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Lautstärke
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <VolumeOffIcon />
            <Slider
              value={volume}
              onChange={(_, value) => onVolumeChange?.(value as number)}
              max={100}
              sx={{
                color: 'white',
                '& .MuiSlider-thumb': {
                  backgroundColor: 'white',
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'white',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            />
            <VolumeUpIcon />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {volume}%
          </Typography>
        </Box>
      </Menu>

      {/* Mobile More Options Menu */}
      <Menu
        anchorEl={moreAnchorEl}
        open={Boolean(moreAnchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
          },
        }}
      >
        {secondaryControls
          .filter(control => control.show)
          .map((control, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                control.onClick?.();
                handleClose();
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {control.icon}
              </ListItemIcon>
              <ListItemText primary={control.tooltip} />
            </MenuItem>
          ))}
        
        {onVolumeChange && (
          <>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lautstärke
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VolumeOffIcon />
                <Slider
                  value={volume}
                  onChange={(_, value) => onVolumeChange(value as number)}
                  max={100}
                  sx={{
                    color: 'white',
                    '& .MuiSlider-thumb': {
                      backgroundColor: 'white',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: 'white',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                />
                <VolumeUpIcon />
              </Box>
            </Box>
          </>
        )}
      </Menu>
    </Paper>
  );
};

export { EnhancedCallControls };