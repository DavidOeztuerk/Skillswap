import React, { useRef, useEffect } from 'react';
import { Avatar, Box, Paper, Typography, useTheme } from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  ScreenShare as ScreenShareIcon,
} from '@mui/icons-material';

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
      elevation={fullSize ? 0 : 3}
      sx={{
        position: fullSize ? 'relative' : 'absolute',
        bottom: fullSize ? 'auto' : 80,
        right: fullSize ? 'auto' : 16,
        borderRadius: 2,
        overflow: 'hidden',
        width: fullSize ? '100%' : 180,
        height: fullSize ? '100%' : 120,
        zIndex: fullSize ? 1 : 5,
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
          display: stream && isVideoEnabled ? 'block' : 'none', // Hide with CSS instead of unmounting
        }}
      />

      {/* Placeholder when video is disabled - show Avatar or Initials */}
      {(!stream || !isVideoEnabled) && (
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
            backgroundColor: theme.palette.grey[800],
            p: 1,
          }}
        >
          {/* Avatar oder Initialen - Größe angepasst für PiP */}
          {avatarUrl ? (
            <Avatar
              src={avatarUrl}
              alt={username}
              sx={{
                width: fullSize ? 80 : 48,
                height: fullSize ? 80 : 48,
                bgcolor: theme.palette.primary.main,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: fullSize ? 80 : 48,
                height: fullSize ? 80 : 48,
                fontSize: fullSize ? 32 : 20,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
          )}

          {/* Nur im fullSize-Modus zusätzlichen Text anzeigen */}
          {fullSize && (
            <Typography
              variant="body2"
              align="center"
              color="white"
              sx={{ mt: 1, fontSize: '0.75rem' }}
            >
              Kamera ist ausgeschaltet
            </Typography>
          )}
        </Box>
      )}

      {/* Status-Icons */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          display: 'flex',
          gap: 0.5,
          zIndex: 1,
        }}
      >
        {/* Mikrofon-Status */}
        {isMicEnabled ? (
          <Box
            sx={{
              bgcolor: 'success.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
            }}
          >
            <MicIcon sx={{ fontSize: 14 }} />
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: 'error.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
            }}
          >
            <MicOffIcon sx={{ fontSize: 14 }} />
          </Box>
        )}

        {/* Bildschirmfreigabe-Status */}
        {isScreenSharing && (
          <Box
            sx={{
              bgcolor: 'info.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
            }}
          >
            <ScreenShareIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>

      {/* Benutzername */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          left: 4,
          right: 4,
          zIndex: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            color: 'common.white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 'medium',
            backdropFilter: 'blur(4px)',
          }}
        >
          {username} (Du)
        </Typography>
      </Box>
    </Paper>
  );
};

export default LocalVideo;
