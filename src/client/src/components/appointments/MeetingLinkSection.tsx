import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { format, isAfter, isBefore, addMinutes, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { useLoading } from '../../contexts/LoadingContext';
import JoinCallButton from './JoinCallButton';
import axios from 'axios';

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

/**
 * Meeting Link Section Component
 * Displays and manages video call meeting links for appointments
 */
const MeetingLinkSection: React.FC<MeetingLinkSectionProps> = ({
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
  const [generatedAt, setGeneratedAt] = useState<Date | null>(linkGeneratedAt ? new Date(linkGeneratedAt) : null);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilActivation, setTimeUntilActivation] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      if (generatedAt && activationDelayMinutes > 0) {
        const activationTime = addMinutes(generatedAt, activationDelayMinutes);
        const now = new Date();
        const secondsUntilActivation = Math.max(0, Math.floor((activationTime.getTime() - now.getTime()) / 1000));
        setTimeUntilActivation(secondsUntilActivation);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [generatedAt, activationDelayMinutes]);
  // Reset copied state after 3 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const appointmentStart = new Date(startTime);
  const appointmentEnd = new Date(endTime);
  const effectiveMeetingUrl = generatedUrl || meetingUrl;

  // Calculate meeting status
  const getMeetingStatus = () => {
    const now = currentTime;
    const earlyJoinTime = addMinutes(appointmentStart, -earlyJoinMinutes);
    
    if (status === 'Cancelled') {
      return { 
        canJoin: false, 
        status: 'cancelled',
        message: 'Termin wurde abgesagt' 
      };
    }
    
    if (status !== 'Confirmed') {
      return { 
        canJoin: false, 
        status: 'pending',
        message: 'Termin muss bestätigt werden' 
      };
    }
    
    if (isAfter(now, appointmentEnd)) {
      return { 
        canJoin: false, 
        status: 'ended',
        message: 'Termin ist beendet' 
      };
    }
    
    if (isBefore(now, earlyJoinTime)) {
      const minutesUntilJoin = differenceInMinutes(earlyJoinTime, now);
      return { 
        canJoin: false, 
        status: 'waiting',
        message: `Beitritt in ${minutesUntilJoin} Minuten möglich` 
      };
    }
    
    if (isBefore(now, appointmentStart)) {
      return { 
        canJoin: true, 
        status: 'ready',
        message: 'Bereit zum Beitritt' 
      };
    }
    
    return { 
      canJoin: true, 
      status: 'active',
      message: 'Meeting läuft' 
    };
  };

  const meetingStatus = getMeetingStatus();

  const handleCopyLink = async () => {
    if (!effectiveMeetingUrl) return;
    
    try {
      await navigator.clipboard.writeText(effectiveMeetingUrl);
      setCopied(true);
    } catch (err) {
      setError('Fehler beim Kopieren des Links');
    }
  };

  const handleGenerateLink = async () => {
    if (!onGenerateLink) return;
    
    await withLoading('generateMeetingLink', async () => {
      try {
        setError(null);
        const url = await onGenerateLink();
        setGeneratedUrl(url);
        setGeneratedAt(new Date());
        setTimeUntilActivation(activationDelayMinutes * 60);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message || 
            'Fehler beim Generieren des Meeting-Links'
          );
        } else {
          setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
      }
    });
  };

  // Refresh meeting link
  const handleRefreshLink = async () => {
    if (!onRefreshLink) return;
    
    await withLoading('refreshMeetingLink', async () => {
      try {
        setError(null);
        const url = await onRefreshLink();
        setGeneratedUrl(url);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
            'Fehler beim Aktualisieren des Meeting-Links'
          );
        } else {
          setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
      }
    });
  };

  // Navigate to video call page in same window
  const handleOpenMeeting = () => {
    if (appointmentId) {
      navigate(`/videocall/${appointmentId}`);
    }
  };

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
          <Typography variant="h6">
            Video-Meeting
          </Typography>
        </Box>
        
        <Chip
          size="small"
          label={meetingStatus.message}
          color={
            meetingStatus.status === 'active' ? 'success' :
            meetingStatus.status === 'ready' ? 'primary' :
            meetingStatus.status === 'waiting' ? 'warning' :
            meetingStatus.status === 'ended' ? 'error' :
            'default'
          }
          icon={<ScheduleIcon />}
        />
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Link activation countdown */}
      {timeUntilActivation > 0 && effectiveMeetingUrl && (
        <Alert severity="info" icon={<ScheduleIcon />} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              Meeting-Link wird in {Math.floor(timeUntilActivation / 60)}:{(timeUntilActivation % 60).toString().padStart(2, '0')} Minuten aktiviert
            </Typography>
            <CircularProgress
              variant="determinate"
              value={100 - (timeUntilActivation / (activationDelayMinutes * 60)) * 100}
              size={20}
            />
          </Box>
        </Alert>
      )}

      {/* Meeting URL available */}
      {effectiveMeetingUrl ? (
        <>
          {/* Link display */}
          <TextField
            fullWidth
            value={effectiveMeetingUrl}
            variant="outlined"
            size="small"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={copied ? 'Kopiert!' : 'Link kopieren'}>
                    <IconButton
                      edge="end"
                      onClick={handleCopyLink}
                      size="small"
                    >
                      {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Action buttons */}
          <Stack direction="row" spacing={2}>
            <JoinCallButton
              meetingUrl={effectiveMeetingUrl}
              canJoin={meetingStatus.canJoin && timeUntilActivation === 0}
              status={timeUntilActivation > 0 ? 'waiting' : meetingStatus.status as 'waiting' | 'ready' | 'active' | 'ended' | 'cancelled' | 'pending'}
              startTime={appointmentStart}
              endTime={appointmentEnd}
              onJoin={handleOpenMeeting}
            />

            {isOrganizer && onRefreshLink && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshLink}
                disabled={isLoading('refreshMeetingLink')}
              >
                Link erneuern
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<VideoCallIcon />}
              onClick={handleOpenMeeting}
              disabled={!meetingStatus.canJoin}
            >
              Zum Videoanruf
            </Button>
          </Stack>

          {/* Meeting details */}
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              endIcon={<InfoIcon />}
            >
              {showDetails ? 'Details ausblenden' : 'Details anzeigen'}
            </Button>
            
            <Collapse in={showDetails}>
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Meeting-Zeit: {format(appointmentStart, 'HH:mm', { locale: de })} - {format(appointmentEnd, 'HH:mm', { locale: de })} Uhr
                    </Typography>
                  </Box>
                  
                  {allowEarlyJoin && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Früher Beitritt: {earlyJoinMinutes} Minuten vor Beginn möglich
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Sicherer Meeting-Link mit Ende-zu-Ende Verschlüsselung
                    </Typography>
                  </Box>
                </Stack>
                
                {/* Tips */}
                <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Tipp:</strong> Teste deine Kamera und dein Mikrofon vor dem Meeting.
                    Stelle sicher, dass du eine stabile Internetverbindung hast.
                  </Typography>
                </Alert>
              </Box>
            </Collapse>
          </Box>
        </>
      ) : (
        <>
          {/* No link available - Generate option */}
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            Noch kein Meeting-Link vorhanden.
            {isOrganizer ? ' Generiere einen Link für dieses Meeting.' : ' Der Organisator muss einen Link generieren.'}
          </Alert>
          
          {isOrganizer && onGenerateLink && (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={
                  isLoading('generateMeetingLink') ? 
                  <CircularProgress size={20} color="inherit" /> : 
                  <VideoCallIcon />
                }
                onClick={handleGenerateLink}
                disabled={isLoading('generateMeetingLink')}
              >
                Meeting-Link generieren
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Generiere einen sicheren Video-Meeting Link für diesen Termin.
                Der Link wird automatisch an alle Teilnehmer gesendet.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default MeetingLinkSection;