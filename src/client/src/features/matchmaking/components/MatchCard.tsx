import { memo, useMemo, useCallback } from 'react';
import {
  School as TeacherIcon,
  EmojiObjects as StudentIcon,
  CalendarToday as CalendarIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
  Event as ScheduleIcon,
  SwapHoriz as SwapIcon,
  Euro as EuroIcon,
  VolunteerActivism as FreeIcon,
  AccessTime as SessionIcon,
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

// ============================================================================
// Sub-components to reduce cognitive complexity
// ============================================================================

interface ExchangeInfoChipsProps {
  match: MatchDisplay;
}

const ExchangeInfoChips: React.FC<ExchangeInfoChipsProps> = memo(({ match }) => {
  if (match.isSkillExchange) {
    return (
      <Chip
        icon={<SwapIcon />}
        label={match.exchangeSkillName ? `Tausch: ${match.exchangeSkillName}` : 'Skill-Tausch'}
        size="small"
        color="secondary"
        variant="outlined"
      />
    );
  }

  if (match.isMonetary && match.offeredAmount !== undefined && match.offeredAmount > 0) {
    return (
      <Chip
        icon={<EuroIcon />}
        label={`${match.offeredAmount.toFixed(2)} ${match.currency ?? 'EUR'}`}
        size="small"
        color="success"
        variant="outlined"
      />
    );
  }

  return (
    <Chip icon={<FreeIcon />} label="Kostenlos" size="small" color="info" variant="outlined" />
  );
});

ExchangeInfoChips.displayName = 'ExchangeInfoChips';

interface SessionInfoChipProps {
  sessionInfo: MatchDisplay['sessionInfo'];
}

const SessionInfoChip: React.FC<SessionInfoChipProps> = memo(({ sessionInfo }) => {
  if (!sessionInfo) return null;

  const isComplete = sessionInfo.completedSessions === sessionInfo.totalSessions;

  return (
    <Chip
      icon={<SessionIcon />}
      label={`${sessionInfo.completedSessions}/${sessionInfo.totalSessions} Sessions`}
      size="small"
      color={isComplete ? 'success' : 'default'}
      variant="filled"
    />
  );
});

SessionInfoChip.displayName = 'SessionInfoChip';

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
const sessionInfoBoxSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
  mb: 2,
  p: 1.5,
  borderRadius: 1,
  bgcolor: 'action.hover',
};

// ============================================================================
// MatchCardActions sub-component (defined after sx constants)
// ============================================================================

interface MatchCardActionsProps {
  canRespond: boolean;
  canSchedule: boolean;
  onAccept?: (e: React.MouseEvent) => void;
  onReject?: (e: React.MouseEvent) => void;
  onSchedule?: (e: React.MouseEvent) => void;
  statusMessage: string;
}

const MatchCardActions: React.FC<MatchCardActionsProps> = memo(
  ({ canRespond, canSchedule, onAccept, onReject, onSchedule, statusMessage }) => {
    if (canRespond) {
      return (
        <Box sx={actionsBoxSx}>
          {onReject ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={onReject}
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
              onClick={onAccept}
              fullWidth
              sx={acceptButtonSx}
            >
              Akzeptieren
            </Button>
          ) : null}
        </Box>
      );
    }

    if (canSchedule && onSchedule) {
      return (
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<ScheduleIcon />}
          onClick={onSchedule}
        >
          Termin vereinbaren
        </Button>
      );
    }

    return (
      <Typography variant="body2" color="text.secondary" align="center" sx={{ width: '100%' }}>
        {statusMessage}
      </Typography>
    );
  }
);

MatchCardActions.displayName = 'MatchCardActions';

// ============================================================================
// Main Component
// ============================================================================

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

    const handleAccept = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click navigation
        onAccept?.(match.id);
      },
      [onAccept, match.id]
    );

    const handleReject = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click navigation
        onReject?.(match.id);
      },
      [onReject, match.id]
    );

    const handleSchedule = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click navigation
        onSchedule?.(match);
      },
      [onSchedule, match]
    );

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

          {/* Session & Exchange Info */}
          <Box sx={sessionInfoBoxSx}>
            <ExchangeInfoChips match={match} />
            <SessionInfoChip sessionInfo={match.sessionInfo} />
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
          <MatchCardActions
            canRespond={canRespond}
            canSchedule={canSchedule}
            onAccept={handleAccept}
            onReject={handleReject}
            onSchedule={handleSchedule}
            statusMessage={getMatchStatusMessage(match.status)}
          />
        </CardActions>
      </Card>
    );
  }
);

MatchCard.displayName = 'MatchCard';

export default MatchCard;
