import React, { useRef, useEffect } from 'react';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  ScreenShare as ScreenShareIcon,
} from '@mui/icons-material';
import { Avatar, Box, Paper, Typography, useTheme, type SxProps, type Theme } from '@mui/material';

const statusIconContainerSx: SxProps<Theme> = {
  position: 'absolute',
  bottom: 4,
  left: 4,
  display: 'flex',
  gap: 0.5,
  zIndex: 1,
};

const statusIconBaseSx: SxProps<Theme> = {
  color: 'common.white',
  borderRadius: '50%',
  p: 0.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
};

const iconSizeSx: SxProps<Theme> = {
  fontSize: 14,
};

const usernameLabelContainerSx: SxProps<Theme> = {
  position: 'absolute',
  top: 4,
  left: 4,
  right: 4,
  zIndex: 1,
};

const usernameLabelSx: SxProps<Theme> = {
  bgcolor: 'rgba(0, 0, 0, 0.5)',
  color: 'common.white',
  px: 1,
  py: 0.5,
  borderRadius: 1,
  fontWeight: 'medium',
  backdropFilter: 'blur(4px)',
};

// ============================================================================
// Size configurations to avoid nested ternaries
// ============================================================================

interface SizeConfig {
  avatarSize: number;
  fontSize: number;
  width: number | string;
  height: number | string;
  bottom: number | string;
  right: number | string;
  zIndex: number;
  elevation: number;
}

const SIZE_CONFIGS: Record<'pip' | 'full', SizeConfig> = {
  pip: {
    avatarSize: 48,
    fontSize: 20,
    width: 180,
    height: 120,
    bottom: 80,
    right: 16,
    zIndex: 5,
    elevation: 3,
  },
  full: {
    avatarSize: 80,
    fontSize: 32,
    width: '100%',
    height: '100%',
    bottom: 'auto',
    right: 'auto',
    zIndex: 1,
    elevation: 0,
  },
};

// ============================================================================
// Sub-components
// ============================================================================

interface VideoPlaceholderProps {
  username: string;
  avatarUrl?: string;
  sizeConfig: SizeConfig;
  showLabel: boolean;
  primaryColor: string;
  bgColor: string;
}

const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  username,
  avatarUrl,
  sizeConfig,
  showLabel,
  primaryColor,
  bgColor,
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundColor: bgColor,
      p: 1,
    }}
  >
    <Avatar
      src={avatarUrl}
      alt={username}
      sx={{
        width: sizeConfig.avatarSize,
        height: sizeConfig.avatarSize,
        fontSize: sizeConfig.fontSize,
        bgcolor: primaryColor,
      }}
    >
      {avatarUrl ? null : username.charAt(0).toUpperCase()}
    </Avatar>

    {showLabel ? (
      <Typography variant="body2" align="center" color="white" sx={{ mt: 1, fontSize: '0.75rem' }}>
        Kamera ist ausgeschaltet
      </Typography>
    ) : null}
  </Box>
);

interface LocalVideoProps {
  stream: MediaStream | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  username: string;
  /** Avatar-URL für Anzeige bei Kamera-aus */
  avatarUrl?: string;
  /** When true, fills parent container instead of floating PiP */
  fullSize?: boolean;
}

/**
 * Komponente zur Anzeige des lokalen Videostreams in einem Videoanruf
 */
const LocalVideo: React.FC<LocalVideoProps> = ({
  stream,
  isMicEnabled,
  isVideoEnabled,
  isScreenSharing,
  username,
  avatarUrl,
  fullSize = false,
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sizeConfig = SIZE_CONFIGS[fullSize ? 'full' : 'pip'];
  const showVideo = stream && isVideoEnabled;

  // Wenn der Stream sich ändert, diesen dem Video-Element zuweisen
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;
    } else {
      // Safari: srcObject explizit auf null setzen für korrekten Cleanup
      videoElement.srcObject = null;
    }

    // Cleanup beim Unmount oder Stream-Wechsel
    return () => {
      // Safari: Erst srcObject auf null, dann wird die Medienpermission freigegeben
      videoElement.srcObject = null;
    };
  }, [stream]);

  return (
    <Paper
      elevation={sizeConfig.elevation}
      sx={{
        position: fullSize ? 'relative' : 'absolute',
        bottom: sizeConfig.bottom,
        right: sizeConfig.right,
        borderRadius: 2,
        overflow: 'hidden',
        width: sizeConfig.width,
        height: sizeConfig.height,
        zIndex: sizeConfig.zIndex,
        backgroundColor: theme.palette.background.paper,
        border: fullSize ? 'none' : `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Video element - always in DOM to keep srcObject */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Lokales Video immer stumm schalten, um Feedback zu vermeiden
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Spiegeln, damit es natürlicher wirkt (wie ein Spiegel)
          display: showVideo ? 'block' : 'none', // Hide with CSS instead of unmounting
        }}
      />

      {/* Placeholder when video is disabled - show Avatar or Initials */}
      {showVideo ? null : (
        <VideoPlaceholder
          username={username}
          avatarUrl={avatarUrl}
          sizeConfig={sizeConfig}
          showLabel={fullSize}
          primaryColor={theme.palette.primary.main}
          bgColor={theme.palette.grey[800]}
        />
      )}

      {/* Status-Icons */}
      <Box sx={statusIconContainerSx}>
        {/* Mikrofon-Status */}
        {isMicEnabled ? (
          <Box sx={{ ...statusIconBaseSx, bgcolor: 'success.main' }}>
            <MicIcon sx={iconSizeSx} />
          </Box>
        ) : (
          <Box sx={{ ...statusIconBaseSx, bgcolor: 'error.main' }}>
            <MicOffIcon sx={iconSizeSx} />
          </Box>
        )}

        {/* Bildschirmfreigabe-Status */}
        {isScreenSharing ? (
          <Box sx={{ ...statusIconBaseSx, bgcolor: 'info.main' }}>
            <ScreenShareIcon sx={iconSizeSx} />
          </Box>
        ) : null}
      </Box>

      {/* Benutzername */}
      <Box sx={usernameLabelContainerSx}>
        <Typography variant="caption" sx={usernameLabelSx}>
          {username} (Du)
        </Typography>
      </Box>
    </Paper>
  );
};

export default LocalVideo;
