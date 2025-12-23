import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import { format, isAfter, isBefore, addMinutes, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  VideoCall as VideoCallIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Collapse,
  CircularProgress,
} from '@mui/material';
import { useLoading } from '../../../core/contexts/loadingContextHooks';
import JoinCallButton from './JoinCallButton';

interface MeetingLinkSectionProps {
  appointmentId: string;
  meetingUrl?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  isOrganizer: boolean;
  onGenerateLink?: () => Promise<string>;
  onRefreshLink?: () => Promise<string>;
  allowEarlyJoin?: boolean;
  earlyJoinMinutes?: number;
  activationDelayMinutes?: number;
  linkGeneratedAt?: string | null;
}

interface MeetingStatusResult {
  canJoin: boolean;
  status: 'cancelled' | 'pending' | 'ended' | 'waiting' | 'ready' | 'active';
  message: string;
}

/** Get chip color based on meeting status */
function getMeetingStatusColor(
  statusValue: string
): 'success' | 'primary' | 'warning' | 'error' | 'default' {
  switch (statusValue) {
    case 'active':
      return 'success';
    case 'ready':
      return 'primary';
    case 'waiting':
      return 'warning';
    case 'ended':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

/** Calculate meeting status based on current time and appointment times */
function calculateMeetingStatus(
  currentTime: Date,
  appointmentStart: Date,
  appointmentEnd: Date,
  earlyJoinMinutes: number,
  appointmentStatus: string
): MeetingStatusResult {
  const earlyJoinTime = addMinutes(appointmentStart, -earlyJoinMinutes);

  if (appointmentStatus === 'Cancelled') {
    return { canJoin: false, status: 'cancelled', message: 'Termin wurde abgesagt' };
  }

  if (appointmentStatus !== 'Confirmed') {
    return { canJoin: false, status: 'pending', message: 'Termin muss bestätigt werden' };
  }

  if (isAfter(currentTime, appointmentEnd)) {
    return { canJoin: false, status: 'ended', message: 'Termin ist beendet' };
  }

  if (isBefore(currentTime, earlyJoinTime)) {
    const minutesUntilJoin = differenceInMinutes(earlyJoinTime, currentTime);
    return {
      canJoin: false,
      status: 'waiting',
      message: `Beitritt in ${minutesUntilJoin} Minuten möglich`,
    };
  }

  if (isBefore(currentTime, appointmentStart)) {
    return { canJoin: true, status: 'ready', message: 'Bereit zum Beitritt' };
  }

  return { canJoin: true, status: 'active', message: 'Meeting läuft' };
}

/** Extract error message from axios error */
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const message = err.response?.data?.message as string | undefined;
    return message ?? 'Ein Fehler ist aufgetreten';
  }
  return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
}

/** Activation countdown alert */
const ActivationCountdown: React.FC<{
  timeUntilActivation: number;
  activationDelayMinutes: number;
}> = memo(({ timeUntilActivation, activationDelayMinutes }) => (
  <Alert severity="info" icon={<ScheduleIcon />} sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2">
        Meeting-Link wird in {Math.floor(timeUntilActivation / 60)}:
        {(timeUntilActivation % 60).toString().padStart(2, '0')} Minuten aktiviert
      </Typography>
      <CircularProgress
        variant="determinate"
        value={100 - (timeUntilActivation / (activationDelayMinutes * 60)) * 100}
        size={20}
      />
    </Box>
  </Alert>
));

ActivationCountdown.displayName = 'ActivationCountdown';

/** Meeting details panel */
const MeetingDetailsPanel: React.FC<{
  appointmentStart: Date;
  appointmentEnd: Date;
  allowEarlyJoin: boolean;
  earlyJoinMinutes: number;
}> = memo(({ appointmentStart, appointmentEnd, allowEarlyJoin, earlyJoinMinutes }) => (
  <Box sx={{ mt: 2 }}>
    <Divider sx={{ mb: 2 }} />
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          Meeting-Zeit: {format(appointmentStart, 'HH:mm', { locale: de })} -{' '}
          {format(appointmentEnd, 'HH:mm', { locale: de })} Uhr
        </Typography>
      </Box>

      {allowEarlyJoin ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Früher Beitritt: {earlyJoinMinutes} Minuten vor Beginn möglich
          </Typography>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          Sicherer Meeting-Link mit Ende-zu-Ende Verschlüsselung
        </Typography>
      </Box>
    </Stack>

    <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
      <Typography variant="body2">
        <strong>Tipp:</strong> Teste deine Kamera und dein Mikrofon vor dem Meeting. Stelle sicher,
        dass du eine stabile Internetverbindung hast.
      </Typography>
    </Alert>
  </Box>
));

MeetingDetailsPanel.displayName = 'MeetingDetailsPanel';

/** Generate link section for when no URL exists */
const GenerateLinkSection: React.FC<{
  isOrganizer: boolean;
  onGenerateLink?: () => Promise<string>;
  isGenerating: boolean;
  onGenerate: () => void;
}> = memo(({ isOrganizer, onGenerateLink, isGenerating, onGenerate }) => (
  <>
    <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
      Noch kein Meeting-Link vorhanden.
      {isOrganizer
        ? ' Generiere einen Link für dieses Meeting.'
        : ' Der Organisator muss einen Link generieren.'}
    </Alert>

    {isOrganizer && onGenerateLink !== undefined ? (
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={
            isGenerating ? <CircularProgress size={20} color="inherit" /> : <VideoCallIcon />
          }
          onClick={onGenerate}
          disabled={isGenerating}
        >
          Meeting-Link generieren
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Generiere einen sicheren Video-Meeting Link für diesen Termin. Der Link wird automatisch
          an alle Teilnehmer gesendet.
        </Typography>
      </Box>
    ) : null}
  </>
));

GenerateLinkSection.displayName = 'GenerateLinkSection';

/** Meeting URL display section */
const MeetingUrlSection: React.FC<{
  meetingUrl: string;
  copied: boolean;
  onCopy: () => void;
  canJoin: boolean;
  status: 'cancelled' | 'pending' | 'ended' | 'waiting' | 'ready' | 'active';
  appointmentStart: Date;
  appointmentEnd: Date;
  onJoin: () => void;
  isOrganizer: boolean;
  onRefreshLink?: () => Promise<string>;
  isRefreshing: boolean;
  onRefresh: () => void;
  showDetails: boolean;
  toggleDetails: () => void;
  allowEarlyJoin: boolean;
  earlyJoinMinutes: number;
}> = memo(
  ({
    meetingUrl,
    copied,
    onCopy,
    canJoin,
    status,
    appointmentStart,
    appointmentEnd,
    onJoin,
    isOrganizer,
    onRefreshLink,
    isRefreshing,
    onRefresh,
    showDetails,
    toggleDetails,
    allowEarlyJoin,
    earlyJoinMinutes,
  }) => (
    <>
      <TextField
        fullWidth
        value={meetingUrl}
        variant="outlined"
        size="small"
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied ? 'Kopiert!' : 'Link kopieren'}>
                  <IconButton edge="end" onClick={onCopy} size="small">
                    {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2 }}
      />

      <Stack direction="row" spacing={2}>
        <JoinCallButton
          meetingUrl={meetingUrl}
          canJoin={canJoin}
          status={status}
          startTime={appointmentStart}
          endTime={appointmentEnd}
          onJoin={onJoin}
        />

        {isOrganizer && onRefreshLink !== undefined ? (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            Link erneuern
          </Button>
        ) : null}
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Button size="small" onClick={toggleDetails} endIcon={<InfoIcon />}>
          {showDetails ? 'Details ausblenden' : 'Details anzeigen'}
        </Button>

        <Collapse in={showDetails}>
          <MeetingDetailsPanel
            appointmentStart={appointmentStart}
            appointmentEnd={appointmentEnd}
            allowEarlyJoin={allowEarlyJoin}
            earlyJoinMinutes={earlyJoinMinutes}
          />
        </Collapse>
      </Box>
    </>
  )
);

MeetingUrlSection.displayName = 'MeetingUrlSection';

/** Calculate seconds until link activation */
function calculateSecondsUntilActivation(
  generatedAt: Date | null,
  activationDelayMinutes: number
): number {
  if (generatedAt == null || activationDelayMinutes <= 0) return 0;
  const activationTime = addMinutes(generatedAt, activationDelayMinutes);
  const now = new Date();
  return Math.max(0, Math.floor((activationTime.getTime() - now.getTime()) / 1000));
}

/**
 * Meeting Link Section Component
 * Displays and manages video call meeting links for appointments
 */
const MeetingLinkSection: React.FC<MeetingLinkSectionProps> = memo(
  ({
    appointmentId,
    meetingUrl,
    startTime,
    endTime,
    status,
    isOrganizer,
    onGenerateLink,
    onRefreshLink,
    allowEarlyJoin = true,
    earlyJoinMinutes = 5,
    activationDelayMinutes = 5,
    linkGeneratedAt,
  }) => {
    const navigate = useNavigate();
    const { withLoading, isLoading } = useLoading();
    const [copied, setCopied] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showDetails, setShowDetails] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [generatedAt, setGeneratedAt] = useState<Date | null>(
      linkGeneratedAt == null ? null : new Date(linkGeneratedAt)
    );
    const [error, setError] = useState<string | null>(null);
    const [timeUntilActivation, setTimeUntilActivation] = useState<number>(0);

    const appointmentStart = useMemo(() => new Date(startTime), [startTime]);
    const appointmentEnd = useMemo(() => new Date(endTime), [endTime]);
    const effectiveMeetingUrl = generatedUrl ?? meetingUrl;

    const toggleDetails = useCallback(() => {
      setShowDetails((prev) => !prev);
    }, []);

    const clearError = useCallback(() => {
      setError(null);
    }, []);

    // Timer effect for current time and activation countdown
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
        setTimeUntilActivation(
          calculateSecondsUntilActivation(generatedAt, activationDelayMinutes)
        );
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }, [generatedAt, activationDelayMinutes]);

    // Reset copied state after 3 seconds
    useEffect(() => {
      if (!copied) return;
      const timer = setTimeout(() => {
        setCopied(false);
      }, 3000);
      return () => {
        clearTimeout(timer);
      };
    }, [copied]);

    const meetingStatus = useMemo(
      () =>
        calculateMeetingStatus(
          currentTime,
          appointmentStart,
          appointmentEnd,
          earlyJoinMinutes,
          status
        ),
      [currentTime, appointmentStart, appointmentEnd, earlyJoinMinutes, status]
    );

    const handleCopyLink = useCallback(async () => {
      if (effectiveMeetingUrl == null) return;
      try {
        await navigator.clipboard.writeText(effectiveMeetingUrl);
        setCopied(true);
      } catch {
        setError('Fehler beim Kopieren des Links');
      }
    }, [effectiveMeetingUrl]);

    const handleGenerateLink = useCallback(async () => {
      if (onGenerateLink === undefined) return;
      await withLoading('generateMeetingLink', async () => {
        try {
          setError(null);
          const url = await onGenerateLink();
          setGeneratedUrl(url);
          setGeneratedAt(new Date());
          setTimeUntilActivation(activationDelayMinutes * 60);
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      });
    }, [onGenerateLink, withLoading, activationDelayMinutes]);

    const handleRefreshLink = useCallback(async () => {
      if (onRefreshLink === undefined) return;
      await withLoading('refreshMeetingLink', async () => {
        try {
          setError(null);
          const url = await onRefreshLink();
          setGeneratedUrl(url);
        } catch (err: unknown) {
          setError(extractErrorMessage(err));
        }
      });
    }, [onRefreshLink, withLoading]);

    const handleOpenMeeting = useCallback(() => {
      void navigate(`/videocall/${appointmentId}`);
    }, [appointmentId, navigate]);

    // No meeting URL and can't generate
    if (!effectiveMeetingUrl && !onGenerateLink) {
      return (
        <Paper sx={{ p: 3 }}>
          <Alert severity="info" icon={<InfoIcon />}>
            Für diesen Termin ist kein Video-Meeting verfügbar.
          </Alert>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoCallIcon color="primary" />
            <Typography variant="h6">Video-Meeting</Typography>
          </Box>
          <Chip
            size="small"
            label={meetingStatus.message}
            color={getMeetingStatusColor(meetingStatus.status)}
            icon={<ScheduleIcon />}
          />
        </Box>

        {/* Error message */}
        {error == null ? null : (
          <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Link activation countdown */}
        {timeUntilActivation > 0 && effectiveMeetingUrl !== null ? (
          <ActivationCountdown
            timeUntilActivation={timeUntilActivation}
            activationDelayMinutes={activationDelayMinutes}
          />
        ) : null}

        {/* Meeting URL available */}
        {effectiveMeetingUrl == null ? (
          <GenerateLinkSection
            isOrganizer={isOrganizer}
            onGenerateLink={onGenerateLink}
            isGenerating={isLoading('generateMeetingLink')}
            onGenerate={() => {
              void handleGenerateLink();
            }}
          />
        ) : (
          <MeetingUrlSection
            meetingUrl={effectiveMeetingUrl}
            copied={copied}
            onCopy={() => {
              void handleCopyLink();
            }}
            canJoin={meetingStatus.canJoin ? timeUntilActivation === 0 : false}
            status={timeUntilActivation > 0 ? 'waiting' : meetingStatus.status}
            appointmentStart={appointmentStart}
            appointmentEnd={appointmentEnd}
            onJoin={handleOpenMeeting}
            isOrganizer={isOrganizer}
            onRefreshLink={onRefreshLink}
            isRefreshing={isLoading('refreshMeetingLink')}
            onRefresh={() => {
              void handleRefreshLink();
            }}
            showDetails={showDetails}
            toggleDetails={toggleDetails}
            allowEarlyJoin={allowEarlyJoin}
            earlyJoinMinutes={earlyJoinMinutes}
          />
        )}
      </Paper>
    );
  }
);

MeetingLinkSection.displayName = 'MeetingLinkSection';

export default MeetingLinkSection;
