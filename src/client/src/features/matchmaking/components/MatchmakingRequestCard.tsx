import React, { memo, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { featureColors } from '../../../styles/tokens/colors';
import { spacing, componentSpacing } from '../../../styles/tokens/spacing';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation on render
// ============================================================================

const cardSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 8,
  },
  borderRadius: spacing[2] / 8,
};

const cardContentSx: SxProps<Theme> = {
  flexGrow: 1,
  pb: spacing[1] / 8,
};

const headerBoxSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  mb: componentSpacing.card.gap / 8,
};

const userInfoBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  flex: 1,
};

const avatarSx: SxProps<Theme> = {
  width: 48,
  height: 48,
  cursor: 'pointer',
};

const userNameContainerSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
};

const userNameSx: SxProps<Theme> = {
  cursor: 'pointer',
  '&:hover': { color: 'primary.main' },
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const ratingBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

const starIconSx: SxProps<Theme> = {
  fontSize: 16,
  color: 'warning.main',
};

const statusChipContainerSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1] / 8,
};

const skillSectionSx: SxProps<Theme> = {
  mb: componentSpacing.card.gap / 8,
};

const messageSectionSx: SxProps<Theme> = {
  mb: componentSpacing.card.gap / 8,
};

const messageBoxSx: SxProps<Theme> = {
  bgcolor: 'background.default',
  p: 1.5,
  borderRadius: spacing[1] / 8,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'divider',
  fontStyle: 'italic',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
};

const preferencesSectionSx: SxProps<Theme> = {
  mb: componentSpacing.card.gap / 8,
};

const daysContainerSx: SxProps<Theme> = {
  mb: spacing[1] / 8,
};

const chipsContainerSx: SxProps<Theme> = {
  display: 'flex',
  gap: 0.5,
  flexWrap: 'wrap',
};

const timesContainerSx: SxProps<Theme> = {
  mb: spacing[1] / 8,
};

const timesInnerBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

const smallIconSx: SxProps<Theme> = {
  fontSize: 16,
  color: 'text.secondary',
};

const locationBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
};

const cardActionsSx: SxProps<Theme> = {
  p: componentSpacing.card.actionsPadding / 8,
  pt: 0,
  justifyContent: 'space-between',
};

const actionsLeftBoxSx: SxProps<Theme> = {
  display: 'flex',
  gap: spacing[1] / 8,
};

// ============================================================================
// Helper functions
// ============================================================================

function getStatusColor(status: 'pending' | 'accepted' | 'rejected'): string {
  switch (status) {
    case 'accepted':
      return featureColors.matchStatus.accepted;
    case 'rejected':
      return featureColors.matchStatus.declined;
    case 'pending':
      return featureColors.matchStatus.pending;
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

function getStatusLabel(status: 'pending' | 'accepted' | 'rejected'): string {
  switch (status) {
    case 'accepted':
      return 'Akzeptiert';
    case 'rejected':
      return 'Abgelehnt';
    case 'pending':
      return 'Ausstehend';
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

function getRequestTypeLabel(requestType: 'teach' | 'learn'): string {
  return requestType === 'teach' ? 'Möchte lehren' : 'Möchte lernen';
}

function getRequestTypeColor(requestType: 'teach' | 'learn'): 'primary' | 'secondary' {
  return requestType === 'teach' ? 'primary' : 'secondary';
}

// ============================================================================
// Component
// ============================================================================

interface MatchRequestCardProps {
  id: string;
  requesterName: string;
  requesterAvatar?: string;
  requesterRating: number;
  skillName: string;
  requestType: 'teach' | 'learn';
  message?: string;
  preferredDays: string[];
  preferredTimes: string[];
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onMessage?: (id: string) => void;
  onViewProfile?: (userId: string) => void;
}

const MatchRequestCard: React.FC<MatchRequestCardProps> = memo(
  ({
    id,
    requesterName,
    requesterAvatar,
    requesterRating,
    skillName,
    requestType,
    message,
    preferredDays,
    preferredTimes,
    createdAt,
    status,
    onAccept,
    onReject,
    onMessage,
    onViewProfile,
  }) => {
    // Memoized status chip sx
    const statusChipSx = useMemo(
      (): SxProps<Theme> => ({
        bgcolor: getStatusColor(status),
        color: 'white',
        fontWeight: 'medium',
      }),
      [status]
    );

    // Memoized callbacks
    const handleAccept = useCallback(() => onAccept?.(id), [onAccept, id]);
    const handleReject = useCallback(() => onReject?.(id), [onReject, id]);
    const handleMessage = useCallback(() => onMessage?.(id), [onMessage, id]);
    const handleViewProfile = useCallback(() => onViewProfile?.(id), [onViewProfile, id]);

    // Memoized formatted time
    const timeAgo = useMemo(
      () => formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: de }),
      [createdAt]
    );

    return (
      <Card elevation={2} sx={cardSx}>
        <CardContent sx={cardContentSx}>
          {/* Header with user info and status */}
          <Box sx={headerBoxSx}>
            <Box sx={userInfoBoxSx}>
              <Avatar
                src={requesterAvatar}
                alt={requesterName}
                sx={avatarSx}
                onClick={handleViewProfile}
              >
                <PersonIcon />
              </Avatar>
              <Box sx={userNameContainerSx}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  sx={userNameSx}
                  onClick={handleViewProfile}
                >
                  {requesterName}
                </Typography>
                <Box sx={ratingBoxSx}>
                  <StarIcon sx={starIconSx} />
                  <Typography variant="body2" color="text.secondary">
                    {requesterRating.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={statusChipContainerSx}>
              <Chip label={getStatusLabel(status)} size="small" sx={statusChipSx} />
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Skill and request type */}
          <Box sx={skillSectionSx}>
            <Typography variant="h6" gutterBottom>
              {skillName}
            </Typography>
            <Chip
              label={getRequestTypeLabel(requestType)}
              color={getRequestTypeColor(requestType)}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Message */}
          {message && message.length > 0 ? (
            <Box sx={messageSectionSx}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nachricht:
              </Typography>
              <Typography variant="body2" sx={messageBoxSx}>
                &quot;{message}&quot;
              </Typography>
            </Box>
          ) : null}

          {/* Preferences */}
          <Box sx={preferencesSectionSx}>
            {/* Days */}
            {preferredDays.length > 0 && (
              <Box sx={daysContainerSx}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Bevorzugte Tage:
                </Typography>
                <Box sx={chipsContainerSx}>
                  {preferredDays.slice(0, 4).map((day) => (
                    <Chip key={day} label={day} size="small" variant="outlined" />
                  ))}
                  {preferredDays.length > 4 && (
                    <Chip
                      label={`+${preferredDays.length - 4}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Times */}
            {preferredTimes.length > 0 && (
              <Box sx={timesContainerSx}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Bevorzugte Zeiten:
                </Typography>
                <Box sx={timesInnerBoxSx}>
                  <ScheduleIcon sx={smallIconSx} />
                  <Typography variant="body2">
                    {preferredTimes.slice(0, 2).join(', ')}
                    {preferredTimes.length > 2 && ` (+${preferredTimes.length - 2})`}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Location */}
            <Box sx={locationBoxSx}>
              <LocationIcon sx={smallIconSx} />
              <Typography variant="body2" color="text.secondary">
                Online (Video-Session)
              </Typography>
            </Box>
          </Box>

          {/* Time stamp */}
          <Typography variant="caption" color="text.secondary">
            {timeAgo}
          </Typography>
        </CardContent>

        {/* Actions */}
        <CardActions sx={cardActionsSx}>
          <Box sx={actionsLeftBoxSx}>
            {status === 'pending' && (
              <>
                {onReject ? (
                  <Tooltip title="Ablehnen">
                    <IconButton color="error" onClick={handleReject} size="small">
                      <RejectIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {onAccept ? (
                  <Tooltip title="Akzeptieren">
                    <IconButton color="success" onClick={handleAccept} size="small">
                      <AcceptIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </>
            )}

            {onMessage ? (
              <Tooltip title="Nachricht senden">
                <IconButton color="primary" onClick={handleMessage} size="small">
                  <MessageIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>

          {status === 'pending' && onAccept ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleAccept}
              startIcon={<AcceptIcon />}
            >
              Akzeptieren
            </Button>
          ) : null}

          {status === 'accepted' && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleMessage}
              startIcon={<MessageIcon />}
            >
              Nachricht
            </Button>
          )}
        </CardActions>
      </Card>
    );
  }
);

MatchRequestCard.displayName = 'MatchRequestCard';

export default MatchRequestCard;
