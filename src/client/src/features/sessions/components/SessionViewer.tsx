import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayArrow, Stop, Close, VideoCall } from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Typography,
  Divider,
  Avatar,
  Button as MuiButton,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { setShowRatingForm, clearCurrentSession } from '../store/sessionsSlice';
import { completeSession, startSession } from '../store/sessionsThunks';
import type { RootState } from '../../../core/store/store';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const cardSx: SxProps<Theme> = {
  height: '100%',
};

const statusContainerSx: SxProps<Theme> = {
  mb: 3,
};

const participantInfoSx: SxProps<Theme> = {
  mb: 3,
  p: 2,
  bgcolor: 'grey.50',
  borderRadius: 1,
};

const participantAvatarSx: SxProps<Theme> = {
  width: 56,
  height: 56,
};

const timerDisplaySx: SxProps<Theme> = {
  mb: 3,
  p: 2,
  bgcolor: 'info.light',
  borderRadius: 1,
  textAlign: 'center',
};

const timerTextSx: SxProps<Theme> = {
  fontFamily: 'monospace',
  fontWeight: '700',
};

const meetingLinkContainerSx: SxProps<Theme> = {
  mb: 3,
};

const errorAlertSx: SxProps<Theme> = {
  mb: 2,
};

interface SessionViewerProps {
  sessionId: string;
  appointmentId: string;
  participantName: string;
  participantAvatar?: string;
  scheduledDate: Date;
  durationMinutes: number;
  meetingLink?: string;
  onClose?: () => void;
}

/**
 * SessionViewer Component
 *
 * Real-time session interface that displays:
 * - Session timer (countdown/elapsed time)
 * - Participant information
 * - Video call link
 * - Session action buttons (start, complete)
 * - Session status
 */
const SessionViewer: React.FC<SessionViewerProps> = ({
  sessionId,
  appointmentId,
  participantName,
  participantAvatar,
  scheduledDate,
  durationMinutes,
  meetingLink,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state: RootState) => state.sessions);

  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'active' | 'completed'>('pending');

  // Timer effect
  useEffect(() => {
    if (!sessionStarted) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      setTimeRemaining((prev) => Math.max(prev - 1, 0));

      if (timeRemaining <= 0) {
        clearInterval(interval);
        setSessionStatus('completed');
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionStarted, timeRemaining]);

  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle start session
  const handleStartSession = async (): Promise<void> => {
    try {
      const result = await dispatch(startSession(appointmentId));
      if (result.meta.requestStatus === 'fulfilled') {
        setSessionStarted(true);
        setSessionStatus('active');
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  // Handle complete session
  const handleCompleteSession = async (): Promise<void> => {
    try {
      const result = await dispatch(
        completeSession({
          appointmentId,
          request: {
            isNoShow: false,
            noShowReason: null,
          },
        })
      );

      if (result.meta.requestStatus === 'fulfilled') {
        setSessionStatus('completed');
        setSessionStarted(false);
        // Show rating form
        dispatch(setShowRatingForm(true));
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  // Handle mark no-show
  const handleMarkNoShow = async (): Promise<void> => {
    try {
      const result = await dispatch(
        completeSession({
          appointmentId,
          request: {
            isNoShow: true,
            noShowReason: 'Participant did not show up',
          },
        })
      );

      if (result.meta.requestStatus === 'fulfilled') {
        setSessionStatus('completed');
        setSessionStarted(false);
      }
    } catch (err) {
      console.error('Failed to mark no-show:', err);
    }
  };

  const handleClose = (): void => {
    dispatch(clearCurrentSession());
    onClose?.();
  };

  const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <Card className="session-viewer" sx={cardSx}>
      <CardHeader
        title="Session Viewer"
        subheader={`Session ${sessionId.slice(0, 8)}...`}
        action={
          <MuiButton
            variant="text"
            size="small"
            onClick={handleClose}
            aria-label="Close session viewer"
          >
            <Close />
          </MuiButton>
        }
      />

      <Divider />

      <CardContent>
        {error ? (
          <Alert severity="error" sx={errorAlertSx}>
            {error.message ?? 'An error occurred during the session'}
          </Alert>
        ) : null}

        {/* Session Status */}
        <Box sx={statusContainerSx}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={`Status: ${sessionStatus.toUpperCase()}`}
              color={getStatusColor(sessionStatus)}
              variant="outlined"
            />
            <Chip label={`Duration: ${durationMinutes} min`} variant="outlined" />
          </Stack>
        </Box>

        {/* Participant Info */}
        <Box sx={participantInfoSx}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar alt={participantName} src={participantAvatar} sx={participantAvatarSx}>
              {participantName.charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="600">
                {participantName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Scheduled: {new Date(scheduledDate).toLocaleString('en-DE')}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Timer Display */}
        {sessionStarted ? (
          <Box sx={timerDisplaySx}>
            <Typography variant="caption" color="textSecondary">
              Elapsed Time
            </Typography>
            <Typography variant="h3" sx={timerTextSx}>
              {formatTime(elapsedTime)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Time Remaining: {formatTime(timeRemaining)}
            </Typography>
          </Box>
        ) : null}

        {/* Meeting Link */}
        {meetingLink ? (
          <Box sx={meetingLinkContainerSx}>
            <MuiButton
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<VideoCall />}
              onClick={() => navigate(`/videocall/${appointmentId}`)}
              disabled={!sessionStarted}
            >
              Join Video Call
            </MuiButton>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              {sessionStarted
                ? 'Click to join video call with WebRTC'
                : 'Start session to join video call'}
            </Typography>
          </Box>
        ) : null}

        {/* Action Buttons */}
        <Stack spacing={2}>
          {!sessionStarted && sessionStatus === 'pending' && (
            <MuiButton
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrow />}
              onClick={handleStartSession}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Start Session'}
            </MuiButton>
          )}

          {sessionStarted && sessionStatus === 'active' ? (
            <>
              <MuiButton
                variant="contained"
                color="error"
                size="large"
                fullWidth
                startIcon={<Stop />}
                onClick={handleCompleteSession}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Complete Session'}
              </MuiButton>

              <MuiButton
                variant="outlined"
                color="warning"
                size="large"
                fullWidth
                onClick={handleMarkNoShow}
                disabled={isLoading}
              >
                Mark as No-Show
              </MuiButton>
            </>
          ) : null}

          {sessionStatus === 'completed' && (
            <Alert severity="success">Session completed. You can now rate this session.</Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SessionViewer;
