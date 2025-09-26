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
import { Match, MatchStatus } from '../../types/models/Match';

interface MatchCardProps {
  match: Match;
  isRequester?: boolean;
  onAccept?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  onSchedule?: (match: Match) => void;
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
  const otherUser = isRequester
    ? match.responderDetails
    : match.requesterDetails;

  const isTeacher =
    (!match.isLearningMode && isRequester) ||
    (match.isLearningMode && !isRequester);

  const getStatusColor = useCallback((status: MatchStatus): string => {
    switch (status) {
      case 'Pending':
        return theme.palette.warning.main;
      case 'Accepted':
        return theme.palette.success.main;
      case 'Rejected':
        return theme.palette.error.main;
      case 'Expired':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  }, [theme]);

  const getStatusLabel = useCallback((status: MatchStatus): string => {
    switch (status) {
      case 'Pending':
        return 'Ausstehend';
      case 'Accepted':
        return 'Akzeptiert';
      case 'Rejected':
        return 'Abgelehnt';
      case 'Expired':
        return 'Abgelaufen';
      default:
        return status;
    }
  }, []);

  const canRespond = useMemo(() => !isRequester && match.status === 'Pending', [isRequester, match.status]);
  const canSchedule = useMemo(() => match.status === 'Accepted', [match.status]);

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
            label={match.skill.name}
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
              {otherUser.firstName} {otherUser.lastName}
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
            {match.status === 'Rejected'
              ? 'Match wurde abgelehnt'
              : match.status === 'Expired'
                ? 'Match ist abgelaufen'
                : 'Warte auf Antwort...'}
          </Typography>
        )}
      </CardActions>
    </Card>
  );
});

MatchCard.displayName = 'MatchCard';

export default MatchCard;
