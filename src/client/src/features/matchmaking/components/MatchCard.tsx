import { memo, useMemo, useCallback } from 'react';
import {
  School as TeacherIcon,
  EmojiObjects as StudentIcon,
  CalendarToday as CalendarIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
  Event as ScheduleIcon,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  Box,
  Chip,
  Typography,
  Divider,
  Stack,
  CardActions,
  Button,
  type SxProps,
  type Theme,
} from '@mui/material';
import { usePerformance } from '../../../shared/hooks/usePerformance';
import { useThemeMode } from '../../../shared/hooks/useTheme';
import { formatDate } from '../../../shared/utils/dateUtils';
import {
  getMatchStatusLabel,
  getMatchStatusColor,
  getMatchStatusMessage,
} from '../utils/matchUtils';
import type { MatchDisplay } from '../types/MatchmakingDisplay';

// PERFORMANCE FIX: Extract sx objects as constants to prevent recreation on every render
// This allows React.memo to work properly
const cardSx = (hasClick: boolean): SxProps<Theme> => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: hasClick ? 'pointer' : 'default',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  },
});

const cardContentSx: SxProps<Theme> = { flexGrow: 1 };
const headerBoxSx: SxProps<Theme> = { display: 'flex', justifyContent: 'space-between', mb: 2 };
const userBoxSx: SxProps<Theme> = { display: 'flex', alignItems: 'center', mb: 2 };
const dateBoxSx: SxProps<Theme> = { display: 'flex', alignItems: 'center', mb: 1 };
const cardActionsSx: SxProps<Theme> = { p: 2, pt: 0 };
const actionsBoxSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  width: '100%',
  justifyContent: 'space-between',
  gap: { xs: 1, sm: 2 },
};
const rejectButtonSx: SxProps<Theme> = { order: { xs: 2, sm: 1 } };
const acceptButtonSx: SxProps<Theme> = { order: { xs: 1, sm: 2 } };
const chipSx: SxProps<Theme> = { fontWeight: 'medium' };
const smallChipSx: SxProps<Theme> = { mb: 0.5 };

interface MatchCardProps {
  match: MatchDisplay;
  isRequester?: boolean;
  onAccept?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  onSchedule?: (match: MatchDisplay) => void;
  onClick?: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = memo(
  ({ match, isRequester = false, onAccept, onReject, onSchedule, onClick }) => {
    const perfMetadata = useMemo(
      () => ({
        matchId: match.id,
        status: match.status,
        isRequester,
      }),
      [match.id, match.status, isRequester]
    );
    usePerformance('MatchCard', perfMetadata);
    const theme = useThemeMode();
    // Use new backend response format
    const otherUserName = match.partnerName || 'Unbekannt';

    const isTeacher =
      (!match.isLearningMode && isRequester) || (match.isLearningMode && !isRequester);

    const canRespond = useMemo(
      () => !isRequester && match.status.toLowerCase() === 'pending',
      [isRequester, match.status]
    );
    const canSchedule = useMemo(() => match.status.toLowerCase() === 'accepted', [match.status]);

    const handleCardClick = useCallback(() => {
      onClick?.(match.id);
    }, [onClick, match.id]);

    const handleAccept = useCallback(() => {
      onAccept?.(match.id);
    }, [onAccept, match.id]);

    const handleReject = useCallback(() => {
      onReject?.(match.id);
    }, [onReject, match.id]);

    const handleSchedule = useCallback(() => {
      onSchedule?.(match);
    }, [onSchedule, match]);

    // Memoize card sx to avoid recreation when hasClick doesn't change
    const computedCardSx = useMemo(() => cardSx(!!onClick), [onClick]);

    const statusChipSx = useMemo(
      () => ({
        bgcolor: getMatchStatusColor(match.status, theme.theme),
        color: 'white',
        fontWeight: 'medium',
      }),
      [match.status, theme.theme]
    );

    return (
      <Card elevation={2} onClick={handleCardClick} sx={computedCardSx}>
        <CardContent sx={cardContentSx}>
          <Box sx={headerBoxSx}>
            <Chip label={match.skillName || 'Unbekannt'} size="small" color="primary" sx={chipSx} />
            <Chip label={getMatchStatusLabel(match.status)} size="small" sx={statusChipSx} />
          </Box>

          <Box sx={userBoxSx}>
            <Box sx={{ ml: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {otherUserName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isTeacher ? (
                  <>
                    <StudentIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Sucht Lehrer:in
                  </>
                ) : (
                  <>
                    <TeacherIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Bietet Unterricht an
                  </>
                )}
              </Typography>
            </Box>
          </Box>

          <Box sx={dateBoxSx}>
            <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2">Erstellt am {formatDate(match.createdAt)}</Typography>
          </Box>

          {match.additionalNotes ? (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Notizen:</strong> {match.additionalNotes}
              </Typography>
            </>
          ) : null}

          {match.preferredDays.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Bevorzugte Tage:</strong>
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {match.preferredDays.map((day) => (
                  <Chip key={day} label={day} size="small" sx={smallChipSx} />
                ))}
              </Stack>
            </>
          )}

          {match.preferredTimes.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Bevorzugte Zeiten:</strong>
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {match.preferredTimes.map((time) => (
                  <Chip key={time} label={time} size="small" sx={smallChipSx} />
                ))}
              </Stack>
            </>
          )}
        </CardContent>

        <CardActions sx={cardActionsSx}>
          {canRespond ? (
            <Box sx={actionsBoxSx}>
              {onReject ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={handleReject}
                  fullWidth
                  sx={rejectButtonSx}
                >
                  Ablehnen
                </Button>
              ) : null}

              {onAccept ? (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<AcceptIcon />}
                  onClick={handleAccept}
                  fullWidth
                  sx={acceptButtonSx}
                >
                  Akzeptieren
                </Button>
              ) : null}
            </Box>
          ) : null}

          {canSchedule && onSchedule ? (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<ScheduleIcon />}
              onClick={handleSchedule}
            >
              Termin vereinbaren
            </Button>
          ) : null}

          {!canRespond && !canSchedule && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ width: '100%' }}
            >
              {getMatchStatusMessage(match.status)}
            </Typography>
          )}
        </CardActions>
      </Card>
    );
  }
);

MatchCard.displayName = 'MatchCard';

export default MatchCard;
