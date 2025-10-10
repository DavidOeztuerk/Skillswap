import React, { memo, useCallback, useMemo } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  useTheme,
  Stack,
} from '@mui/material';
import {
  School as TeacherIcon,
  EmojiObjects as StudentIcon,
  CalendarToday as CalendarIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
  Event as ScheduleIcon,
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';
import { MatchDisplay } from '../../types/contracts/MatchmakingDisplay';

interface MatchCardProps {
  match: MatchDisplay;
  isRequester?: boolean;
  onAccept?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  onSchedule?: (match: MatchDisplay) => void;
}

const MatchCard: React.FC<MatchCardProps> = memo(({
  match,
  isRequester = false,
  onAccept,
  onReject,
  onSchedule,
}) => {
  usePerformance('MatchCard', {
    matchId: match.id,
    status: match.status,
    isRequester
  });
  const theme = useTheme();
  // Use new backend response format
  const otherUserName = match.partnerName || 'Unbekannt';

  const isTeacher =
    (!match.isLearningMode && isRequester) ||
    (match.isLearningMode && !isRequester);

  const getStatusColor = useCallback((status: string): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    switch (normalizedStatus) {
      case 'pending':
        return theme.palette.warning.main;
      case 'accepted':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      case 'expired':
        return theme.palette.grey[500];
      case 'completed':
        return theme.palette.info.main;
      case 'cancelled':
        return theme.palette.error.main;
      case 'active':
        return theme.palette.success.main;
      case 'dissolved':
        return theme.palette.grey[600];
      default:
        return theme.palette.grey[500];
    }
  }, [theme]);

  const getStatusLabel = useCallback((status: string): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    switch (normalizedStatus) {
      case 'pending':
        return 'Ausstehend';
      case 'accepted':
        return 'Akzeptiert';
      case 'rejected':
        return 'Abgelehnt';
      case 'expired':
        return 'Abgelaufen';
      case 'completed':
        return 'Abgeschlossen';
      case 'cancelled':
        return 'Abgebrochen';
      case 'active':
        return 'Aktiv';
      case 'dissolved':
        return 'Aufgelöst';
      default:
        return status;
    }
  }, []);

  const canRespond = useMemo(() => !isRequester && match.status?.toLowerCase() === 'pending', [isRequester, match.status]);
  const canSchedule = useMemo(() => match.status?.toLowerCase() === 'accepted', [match.status]);

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip
            label={match.skillName || 'Unbekannt'}
            size="small"
            color="primary"
            sx={{ fontWeight: 'medium' }}
          />
          <Chip
            label={getStatusLabel(match.status)}
            size="small"
            sx={{
              bgcolor: getStatusColor(match.status),
              color: 'white',
              fontWeight: 'medium',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {otherUserName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isTeacher ? (
                <>
                  <StudentIcon
                    fontSize="small"
                    sx={{ verticalAlign: 'middle', mr: 0.5 }}
                  />
                  Sucht Lehrer:in
                </>
              ) : (
                <>
                  <TeacherIcon
                    fontSize="small"
                    sx={{ verticalAlign: 'middle', mr: 0.5 }}
                  />
                  Bietet Unterricht an
                </>
              )}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarIcon
            fontSize="small"
            sx={{ color: 'text.secondary', mr: 1 }}
          />
          <Typography variant="body2">
            Erstellt am {formatDate(match.createdAt)}
          </Typography>
        </Box>

        {match.additionalNotes && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Notizen:</strong> {match.additionalNotes}
            </Typography>
          </>
        )}

        {match.preferredDays && match.preferredDays?.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Bevorzugte Tage:</strong>
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              {match.preferredDays.map((day) => (
                <Chip key={day} label={day} size="small" sx={{ mb: 0.5 }} />
              ))}
            </Stack>
          </>
        )}

        {match.preferredTimes && match.preferredTimes?.length > 0 && (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Bevorzugte Zeiten:</strong>
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {match.preferredTimes.map((time) => (
                <Chip key={time} label={time} size="small" sx={{ mb: 0.5 }} />
              ))}
            </Stack>
          </>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {canRespond && (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            {onReject && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => onReject(match.id)}
              >
                Ablehnen
              </Button>
            )}

            {onAccept && (
              <Button
                variant="contained"
                color="success"
                startIcon={<AcceptIcon />}
                onClick={() => onAccept(match.id)}
              >
                Akzeptieren
              </Button>
            )}
          </Box>
        )}

        {canSchedule && onSchedule && (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<ScheduleIcon />}
            onClick={() => onSchedule(match)}
          >
            Termin vereinbaren
          </Button>
        )}

        {!canRespond && !canSchedule && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ width: '100%' }}
          >
            {(() => {
              const s = (match.status || '').toLowerCase();
              if (s === 'rejected') return 'Match wurde abgelehnt';
              if (s === 'expired') return 'Match ist abgelaufen';
              if (s === 'completed') return 'Match ist abgeschlossen';
              if (s === 'cancelled' || s === 'canceled') return 'Match wurde abgebrochen';
              return 'Warte auf Antwort...';
            })()}
          </Typography>
        )}
      </CardActions>
    </Card>
  );
});

MatchCard.displayName = 'MatchCard';

export default MatchCard;
