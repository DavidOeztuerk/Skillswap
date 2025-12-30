import React from 'react';
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
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  useMediaQuery,
  type SxProps,
  type Theme,
} from '@mui/material';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const controlsContainerBaseSx: SxProps<Theme> = {
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 4,
  zIndex: 10,
};

interface CallControlsProps {
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
  onOpenSettings?: () => void;
  disabled?: boolean;
}

/**
 * Call control buttons for video calls (microphone, camera, screen share, etc.)
 */
const CallControls: React.FC<CallControlsProps> = ({
  isMicEnabled,
  isVideoEnabled,
  isScreenSharing,
  isChatOpen,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onEndCall,
  onOpenSettings,
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const controls = [
    {
      tooltip: isMicEnabled ? 'Mute microphone' : 'Unmute microphone',
      icon: isMicEnabled ? <MicIcon /> : <MicOffIcon />,
      color: isMicEnabled ? 'primary' : 'error',
      onClick: onToggleMic,
      'aria-label': 'Toggle microphone',
    },
    {
      tooltip: isVideoEnabled ? 'Turn off camera' : 'Turn on camera',
      icon: isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />,
      color: isVideoEnabled ? 'primary' : 'error',
      onClick: onToggleVideo,
      'aria-label': 'Toggle camera',
    },
    {
      tooltip: isScreenSharing ? 'Stop screen share' : 'Share screen',
      icon: isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />,
      color: isScreenSharing ? 'secondary' : 'primary',
      onClick: onToggleScreenShare,
      'aria-label': 'Toggle screen sharing',
    },
    {
      tooltip: isChatOpen ? 'Close chat' : 'Open chat',
      icon: <ChatIcon />,
      color: isChatOpen ? 'secondary' : 'primary',
      onClick: onToggleChat,
      'aria-label': 'Toggle chat',
    },
    {
      tooltip: 'End call',
      icon: <CallEndIcon />,
      color: 'error',
      onClick: onEndCall,
      'aria-label': 'End call',
    },
  ];

  // Optional: Add settings button if callback provided
  if (onOpenSettings) {
    controls.push({
      tooltip: 'Settings',
      icon: <SettingsIcon />,
      color: 'primary',
      onClick: onOpenSettings,
      'aria-label': 'Open settings',
    });
  }

  return (
    <Paper
      elevation={3}
      sx={{
        ...controlsContainerBaseSx,
        padding: isMobile ? 1 : 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: isMobile ? 0.5 : 1,
        }}
      >
        {controls.map((control) => (
          <Tooltip key={control['aria-label']} title={disabled ? '' : control.tooltip} arrow>
            <span>
              <IconButton
                color={control.color as 'primary' | 'secondary' | 'error'}
                onClick={control.onClick}
                aria-label={control['aria-label']}
                size={isMobile ? 'medium' : 'large'}
                disabled={disabled}
                sx={{
                  backgroundColor:
                    control.color === 'error' ? theme.palette.error.main : 'transparent',
                  color: control.color === 'error' ? theme.palette.error.contrastText : undefined,
                  '&:hover': {
                    backgroundColor:
                      control.color === 'error' ? theme.palette.error.dark : undefined,
                  },
                  ...(control.color === 'error' && {
                    width: isMobile ? 48 : 56,
                    height: isMobile ? 48 : 56,
                  }),
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(128, 128, 128, 0.5)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                {control.icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
};

export default CallControls;
