// src/components/videocall/CallControls.tsx
import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  useMediaQuery,
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
} from '@mui/icons-material';

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
}

/**
 * Steuerelemente für einen Videoanruf (Mikrofon, Kamera, Bildschirmfreigabe, etc.)
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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const controls = [
    {
      tooltip: isMicEnabled ? 'Mikrofon ausschalten' : 'Mikrofon einschalten',
      icon: isMicEnabled ? <MicIcon /> : <MicOffIcon />,
      color: isMicEnabled ? 'primary' : 'error',
      onClick: onToggleMic,
      'aria-label': 'Mikrofon umschalten',
    },
    {
      tooltip: isVideoEnabled ? 'Kamera ausschalten' : 'Kamera einschalten',
      icon: isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />,
      color: isVideoEnabled ? 'primary' : 'error',
      onClick: onToggleVideo,
      'aria-label': 'Kamera umschalten',
    },
    {
      tooltip: isScreenSharing
        ? 'Bildschirmfreigabe beenden'
        : 'Bildschirm freigeben',
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
    },
    {
      tooltip: 'Anruf beenden',
      icon: <CallEndIcon />,
      color: 'error',
      onClick: onEndCall,
      'aria-label': 'Anruf beenden',
    },
  ];

  // Optional: Einstellungen-Button hinzufügen, wenn Callback vorhanden
  if (onOpenSettings) {
    controls.push({
      tooltip: 'Einstellungen',
      icon: <SettingsIcon />,
      color: 'primary',
      onClick: onOpenSettings,
      'aria-label': 'Einstellungen öffnen',
    });
  }

  return (
    <Paper
      elevation={3}
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
        backgroundColor: theme.palette.background.paper,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: isMobile ? 0.5 : 1,
        }}
      >
        {controls.map((control, index) => (
          <Tooltip key={index} title={control.tooltip} arrow>
            <IconButton
              color={control.color as 'primary' | 'secondary' | 'error'}
              onClick={control.onClick}
              aria-label={control['aria-label']}
              size={isMobile ? 'medium' : 'large'}
              sx={{
                backgroundColor:
                  control.color === 'error'
                    ? theme.palette.error.main
                    : 'transparent',
                color:
                  control.color === 'error'
                    ? theme.palette.error.contrastText
                    : undefined,
                '&:hover': {
                  backgroundColor:
                    control.color === 'error'
                      ? theme.palette.error.dark
                      : undefined,
                },
                ...(control.color === 'error' && {
                  width: isMobile ? 48 : 56,
                  height: isMobile ? 48 : 56,
                }),
              }}
            >
              {control.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
};

export default CallControls;
