import React, { useRef, useEffect, useState } from 'react';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideoIcon,
  ScreenShare as ScreenShareIcon,
  VideocamOff as VideocamOffIcon,
} from '@mui/icons-material';
import { Box, Typography, Avatar, CircularProgress, useTheme } from '@mui/material';

// Color constants
const ICON_COLOR = 'common.white';

type E2EEStatusType =
  | 'inactive'
  | 'initializing'
  | 'key-exchange'
  | 'key-rotation'
  | 'active'
  | 'verified'
  | 'error'
  | 'unsupported';

interface RemoteVideoProps {
  stream: MediaStream | null;
  isConnected: boolean;
  isMicMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  username: string;
  avatarUrl?: string;
  /** E2EE status for showing encryption initialization overlay */
  e2eeStatus?: E2EEStatusType;
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
  e2eeStatus = 'inactive',
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoActive, setVideoActive] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // CHROME FIX: Force video element remount when E2EE becomes active
  // Incrementing this key causes React to destroy and recreate the video element
  const [videoElementKey, setVideoElementKey] = useState<number>(0);

  // Track previous videoActive for logging without adding to dependencies
  const prevVideoActiveRef = useRef<boolean>(false);

  // Track mounted state to prevent play() during cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Track previous E2EE status to detect when encryption becomes active
  const prevE2EEStatusRef = useRef<E2EEStatusType>(e2eeStatus);

  // CHROME FIX: Track the effective stream to use (may be wrapped for Chrome recovery)
  const [effectiveStream, setEffectiveStream] = useState<MediaStream | null>(stream);

  // CHROME FIX: Track cloned tracks for cleanup (prevent memory leaks)
  const clonedTracksRef = useRef<MediaStreamTrack[]>([]);

  // Helper to stop and cleanup cloned tracks
  const cleanupClonedTracks = (): void => {
    if (clonedTracksRef.current.length > 0) {
      console.debug(`🧹 RemoteVideo: Stopping ${clonedTracksRef.current.length} cloned tracks`);
      clonedTracksRef.current.forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      clonedTracksRef.current = [];
    }
  };

  // Sync effectiveStream when stream prop changes
  useEffect(() => {
    // Clean up old clones when stream changes
    cleanupClonedTracks();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEffectiveStream(stream);
  }, [stream]);

  // Cleanup cloned tracks on unmount
  useEffect(() => cleanupClonedTracks, []);

  // CHROME FIX: When E2EE transitions from 'key-exchange' to 'active',
  // Chrome has muted the video track because initial frames couldn't be decoded.
  // Chrome does NOT automatically unmute the track even when frames decode successfully!
  //
  // CRITICAL: Chrome's track.muted is READ-ONLY and persists even after video element remount.
  // Creating a new MediaStream wrapper with the SAME tracks does NOT help - track stays muted.
  //
  // SOLUTION: Clone the video track using track.clone(). The clone:
  // - Starts with a fresh muted=false state (not inherited from original)
  // - Still receives the same decoded frames from the WebRTC/E2EE pipeline
  // - Is a "live" copy connected to the same underlying media source
  useEffect(() => {
    const wasInitializing =
      // eslint-disable-next-line sonarjs/no-duplicate-string
      prevE2EEStatusRef.current === 'key-exchange' || prevE2EEStatusRef.current === 'initializing';
    const isNowActive = e2eeStatus === 'active';

    // Update the ref for next comparison
    prevE2EEStatusRef.current = e2eeStatus;

    // Only trigger when transitioning TO active state
    if (wasInitializing && isNowActive && stream) {
      // Capture stream for async callbacks (ESLint knows it's truthy here)
      const currentStream = stream;

      console.debug(
        '🔄 RemoteVideo: E2EE now active, triggering video element remount for Chrome recovery'
      );

      // Log track state for debugging
      const videoTracks = currentStream.getVideoTracks();
      const hasMutedVideoTrack = videoTracks.some((t) => t.muted);
      console.debug(
        `🔄 RemoteVideo: Video tracks - count=${videoTracks.length}, hasMuted=${hasMutedVideoTrack}`
      );

      // CHROME FIX: Wait for keyframes to arrive before attempting recovery
      // The peer sends keyframes at 0ms, 500ms, 1500ms, 3000ms after key exchange
      // We check at 1000ms, 2500ms, 4500ms to give time for keyframes to arrive

      // First check at 1000ms - force video element refresh
      setTimeout(() => {
        if (isMountedRef.current && videoRef.current) {
          const isVideoShowing =
            videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0;
          if (isVideoShowing) {
            console.debug('✅ RemoteVideo: Video showing after first keyframe');
          } else {
            console.debug(
              '🔄 RemoteVideo: Video not showing after 1000ms, forcing element refresh'
            );
            // Increment key to force video element recreation
            setVideoElementKey((prev) => prev + 1);
          }
        }
      }, 1000);

      // Second check at 2500ms - refresh element again if needed
      // NOTE: Track cloning was REMOVED - it breaks E2EE by disconnecting from decrypt pipeline!
      // Cloned tracks receive raw (encrypted) frames, not decrypted ones.
      setTimeout(() => {
        if (isMountedRef.current && videoRef.current) {
          const isVideoShowing =
            videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0;
          if (isVideoShowing) {
            console.debug('✅ RemoteVideo: Video showing after second keyframe');
          } else {
            console.debug('🔄 RemoteVideo: Video not showing after 2500ms, refreshing element');
            setVideoElementKey((prev) => prev + 1);
          }
        }
      }, 2500);

      // Third check at 4500ms - final status
      setTimeout(() => {
        if (isMountedRef.current && videoRef.current) {
          const isVideoShowing =
            videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0;
          if (isVideoShowing) {
            console.debug('✅ RemoteVideo: Video is now displaying correctly');
          } else {
            console.debug(
              '⚠️ RemoteVideo: Video still not showing after all recovery attempts. ' +
                'This may indicate a codec or decoder issue.'
            );
          }
        }
      }, 4500);
    }
  }, [e2eeStatus, stream]);

  // Wenn der Stream sich ändert, diesen dem Video-Element zuweisen
  // CHROME FIX: Use effectiveStream which may be a new MediaStream wrapper for recovery
  useEffect(() => {
    if (videoRef.current && effectiveStream) {
      videoRef.current.srcObject = effectiveStream;

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
        const videoTracks = effectiveStream.getVideoTracks();
        // Check both enabled AND not muted (Chrome mutes tracks when frames can't decode)
        const hasActiveVideoTracks = videoTracks.some((track) => track.enabled && !track.muted);

        // CHROME FIX: Check if video is actually rendering (videoWidth/videoHeight > 0)
        // This is the ONLY RELIABLE check for E2EE since Chrome's muted state can be stale
        const videoElement = videoRef.current;
        const isVideoRendering = videoElement
          ? videoElement.videoWidth > 0 && videoElement.videoHeight > 0
          : false;

        // CRITICAL FIX: ALWAYS use isVideoRendering as the reliable state
        // Chrome may report tracks as "enabled" but the decoder can be stuck
        // The muted flag is unreliable after insertable streams failures
        //
        // Previously we showed video as "active" during e2eeStatus='inactive' based on
        // hasActiveVideoTracks, but this caused a flicker:
        // 1. inactive → videoActive=true (tracks enabled, but no frames yet)
        // 2. initializing → videoActive=false (forced)
        // 3. active → videoActive=true (actually rendering)
        //
        // FIX: Always wait for actual video rendering, regardless of E2EE status
        let isActive: boolean;

        if (e2eeStatus === 'key-exchange' || e2eeStatus === 'initializing') {
          // During E2EE setup: Always show as loading (video can't work yet)
          isActive = false;
        } else {
          // All other states (inactive, active, verified, key-rotation, etc.):
          // Trust ONLY the actual rendering state - this prevents flickering
          isActive = isVideoRendering;
        }

        // Log state changes using ref to avoid dependency issues
        if (isActive !== prevVideoActiveRef.current) {
          console.debug(
            `🎬 RemoteVideo: videoActive changed: ${prevVideoActiveRef.current} -> ${isActive}`,
            {
              hasActiveVideoTracks,
              isVideoRendering,
              videoWidth: videoElement?.videoWidth ?? 0,
              videoHeight: videoElement?.videoHeight ?? 0,
              e2eeStatus,
            }
          );
          prevVideoActiveRef.current = isActive;
        }

        setVideoActive(isActive);
      };

      // Initial prüfen
      checkVideoTracks();

      // Bei Track-Änderungen prüfen
      const handleTrackChange = (): void => {
        checkVideoTracks();
      };

      // Listen for unmute events (when Chrome recovers)
      const handleUnmute = (): void => {
        console.debug('🔊 RemoteVideo: Track unmuted event received');
        checkVideoTracks();
      };

      // CHROME FIX: Attach event listeners to effectiveStream (the MediaStream wrapper)
      effectiveStream.addEventListener('addtrack', handleTrackChange);
      effectiveStream.addEventListener('removetrack', handleTrackChange);

      // Also listen on individual tracks for mute/unmute
      effectiveStream.getVideoTracks().forEach((track) => {
        track.addEventListener('unmute', handleUnmute);
        track.addEventListener('mute', handleTrackChange);
      });

      // CHROME FIX: Periodic check for track state changes
      // Chrome doesn't always fire unmute events reliably after E2EE key exchange
      const periodicCheck = setInterval(() => {
        if (isMountedRef.current && e2eeStatus === 'active') {
          checkVideoTracks();
        }
      }, 500);

      return () => {
        effectiveStream.removeEventListener('addtrack', handleTrackChange);
        effectiveStream.removeEventListener('removetrack', handleTrackChange);
        effectiveStream.getVideoTracks().forEach((track) => {
          track.removeEventListener('unmute', handleUnmute);
          track.removeEventListener('mute', handleTrackChange);
        });
        clearInterval(periodicCheck);
      };
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      } catch {
        // ignore
      }
    }
    const timer = setTimeout(() => {
      setVideoActive(false);
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [effectiveStream, e2eeStatus, videoElementKey]); // CHROME FIX: Use effectiveStream (wrapper), videoElementKey triggers re-assignment

  // Helper to check if E2EE is still initializing OR video is recovering from Chrome mute
  const isE2EEInitializing = e2eeStatus === 'initializing' || e2eeStatus === 'key-exchange';

  // CHROME FIX: Video is "recovering" when:
  // - E2EE is active (encryption working)
  // - But video isn't showing yet (track muted by Chrome)
  // - And user hasn't deliberately turned off camera
  // - And we have a stream
  // This shows "Video wird geladen" instead of "Kamera ist ausgeschaltet"
  const isVideoRecovering =
    e2eeStatus === 'active' && !videoActive && !isVideoOff && stream !== null;

  // Show loading state during E2EE init OR video recovery
  const isWaitingForVideo = isE2EEInitializing || isVideoRecovering;

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

    // Show E2EE initialization status - this is why video takes a few seconds to appear!
    // During E2EE key exchange, frames are dropped until encryption is established.
    // CHROME FIX: Also show this during video recovery (when track is muted by Chrome)
    // Note: At this point isConnected is always true (we returned early if false)
    if (stream && isWaitingForVideo && !videoActive) {
      // Determine the message based on the current state
      let statusMessage = 'Verbindung wird gesichert...';
      if (e2eeStatus === 'key-exchange') {
        statusMessage = 'Verschlüsselung wird eingerichtet...';
      } else if (isVideoRecovering) {
        statusMessage = 'Video wird geladen...';
      }

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
                width: 100,
                height: 100,
                mb: 2,
                bgcolor: theme.palette.primary.main,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                fontSize: 40,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <CircularProgress size={24} sx={{ mb: 1 }} />
          <Typography variant="body2" color="white">
            {statusMessage}
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
      {!stream || isVideoOff || !videoActive ? (
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
      ) : null}

      {/* Video-Element – immer gerendert, aber transparent wenn kein Bild */}
      {/* CHROME FIX: key={videoElementKey} forces React to destroy and recreate the element */}
      {/* This clears Chrome's internal "muted" state that persists after E2EE key exchange */}
      {stream !== null && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- Live video call stream, captions not applicable
        <video
          key={`remote-video-${videoElementKey}`}
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
              color: ICON_COLOR,
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
              color: ICON_COLOR,
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
              color: ICON_COLOR,
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
              color: ICON_COLOR,
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
        {isScreenSharing ? (
          <Box
            sx={{
              bgcolor: 'info.main',
              color: ICON_COLOR,
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
        ) : null}
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
            color: ICON_COLOR,
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
