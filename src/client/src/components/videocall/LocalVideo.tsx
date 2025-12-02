// src/components/videocall/LocalVideo.tsx
import React, { useRef, useEffect } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VideocamOff as VideoOffIcon,
  ScreenShare as ScreenShareIcon,
} from '@mui/icons-material';

interface LocalVideoProps {
  stream: MediaStream | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  username: string;
}

/**
 * Komponente zur Anzeige des lokalen Videostreams in einem Videoanruf
 */
const LocalVideo: React.FC<LocalVideoProps> = ({
  stream,
  isMicEnabled,
  isVideoEnabled,
  isScreenSharing,
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Wenn der Stream sich ändert, diesen dem Video-Element zuweisen
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 80, // Platz für die Steuerelemente lassen
        right: 16,
        borderRadius: 2,
        overflow: 'hidden',
        width: 180,
        height: 120,
        zIndex: 5,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
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

      {/* Placeholder when video is disabled */}
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
            backgroundColor: theme.palette.action.hover,
            p: 2,
          }}
        >
          {!isVideoEnabled && (
            <VideoOffIcon
              sx={{
                fontSize: 40,
                mb: 1,
                color: theme.palette.text.secondary,
              }}
            />
          )}

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            {!stream
              ? 'Warte auf Videostream...'
              : isVideoEnabled
                ? 'Kamera ist eingeschaltet'
                : 'Kamera ist ausgeschaltet'}
          </Typography>
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
          Du
        </Typography>
      </Box>
    </Paper>
  );
};

export default LocalVideo;
