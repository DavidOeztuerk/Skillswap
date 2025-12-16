import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Avatar, CircularProgress, useTheme } from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideoIcon,
  ScreenShare as ScreenShareIcon,
  VideocamOff as VideocamOffIcon,
} from '@mui/icons-material';

interface RemoteVideoProps {
  stream: MediaStream | null;
  isConnected: boolean;
  isMicMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  username: string;
  avatarUrl?: string;
}

/**
 * Komponente zur Anzeige des entfernten Videostreams in einem Videoanruf
 */
const RemoteVideo: React.FC<RemoteVideoProps> = ({
  stream,
  isConnected,
  isMicMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  username,
  avatarUrl,
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoActive, setVideoActive] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Track mounted state to prevent play() during cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Wenn der Stream sich ändert, diesen dem Video-Element zuweisen
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      // Versuche das Video automatisch zu starten (kann durch Autoplay-Policy blockiert werden)
      // Fehler werden nur geloggt, damit die UI nicht abstürzt.
      // Only attempt play if component is still mounted
      if (isMountedRef.current) {
        // play() gibt ein Promise zurück, handle mögliche Ablehnungen
        const playPromise = videoRef.current.play();
        void playPromise.catch((e: unknown) => {
          // Don't log AbortError during unmount - this is expected behavior
          if (!isMountedRef.current || (e instanceof Error && e.name === 'AbortError')) {
            return; // Silent during cleanup
          }
          // Silent debug for other errors (e.g. autoplay policy)
          console.debug('RemoteVideo: play() rejected', e);
        });
      }

      // Überwache, ob Video-Tracks aktiv sind
      const checkVideoTracks = (): void => {
        const hasVideoTracks = stream.getVideoTracks().some((track) => track.enabled);
        setVideoActive(hasVideoTracks);
      };

      // Initial prüfen
      checkVideoTracks();

      // Bei Track-Änderungen prüfen
      const handleTrackChange = (): void => {
        checkVideoTracks();
      };

      stream.addEventListener('addtrack', handleTrackChange);
      stream.addEventListener('removetrack', handleTrackChange);

      return () => {
        stream.removeEventListener('addtrack', handleTrackChange);
        stream.removeEventListener('removetrack', handleTrackChange);
      };
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      } catch (_e) {
        // ignore
      }
    }
    const timer = setTimeout(() => {
      setVideoActive(false);
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [stream]);

  // Anzeige des Stream-Status
  const renderStatus = (): React.ReactElement | null => {
    if (!isConnected) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="white">
            Verbindung wird hergestellt...
          </Typography>
        </Box>
      );
    }

    if (!stream || isVideoOff || !videoActive) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {avatarUrl ? (
            <Avatar
              src={avatarUrl}
              alt={username}
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                bgcolor: theme.palette.primary.main,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                fontSize: 48,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Typography variant="h6" color="white">
            {username}
          </Typography>
          <Typography variant="body2" color="white" sx={{ mt: 1 }}>
            Kamera ist ausgeschaltet
          </Typography>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.common.black,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Hintergrundbild oder -farbe, wenn kein Video aktiv ist */}
      {(!stream || isVideoOff || !videoActive) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 0,
          }}
        />
      )}

      {/* Video-Element – immer gerendert, aber transparent wenn kein Bild */}
      {stream !== null && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- Live video call stream, captions not applicable
        <video
          ref={videoRef}
          autoPlay
          playsInline
          aria-label={`Video von ${username}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isScreenSharing ? 'contain' : 'cover',
            opacity: videoActive && !isVideoOff ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 0,
          }}
        />
      )}

      {/* Status-Anzeige (Verbindung wird hergestellt, Kamera ausgeschaltet) */}
      {renderStatus()}

      {/* Status-Icons */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          gap: 1,
          zIndex: 1,
        }}
      >
        {/* Mikrofon-Status */}
        {isMicMuted ? (
          <Box
            sx={{
              bgcolor: 'error.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <MicOffIcon />
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: 'success.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <MicIcon />
          </Box>
        )}

        {/* Video-Status */}
        {isVideoOff || !videoActive ? (
          <Box
            sx={{
              bgcolor: 'error.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <VideocamOffIcon />
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: 'success.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <VideoIcon />
          </Box>
        )}

        {/* Bildschirmfreigabe-Status */}
        {isScreenSharing && (
          <Box
            sx={{
              bgcolor: 'info.main',
              color: 'common.white',
              borderRadius: '50%',
              p: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <ScreenShareIcon />
          </Box>
        )}
      </Box>

      {/* Benutzername */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            color: 'common.white',
            px: 2,
            py: 0.75,
            borderRadius: 1,
            fontWeight: 'medium',
            backdropFilter: 'blur(4px)',
          }}
        >
          {username}
        </Typography>
      </Box>
    </Box>
  );
};

export default RemoteVideo;
