import React, { memo, useMemo, useCallback } from 'react';
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
  useTheme,
} from '@mui/material';
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
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { featureColors } from '../../styles/tokens';

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
    const theme = useTheme();

    // Memoized status styling
    const { statusColor, statusLabel } = useMemo(
      () => ({
        statusColor:
          status === 'accepted'
            ? featureColors.matchStatus.accepted
            : status === 'rejected'
              ? featureColors.matchStatus.declined
              : featureColors.matchStatus.pending,
        statusLabel:
          status === 'accepted' ? 'Akzeptiert' : status === 'rejected' ? 'Abgelehnt' : 'Ausstehend',
      }),
      [status]
    );

    const { requestTypeLabel, requestTypeColor } = useMemo(
      () => ({
        requestTypeLabel: requestType === 'teach' ? 'Möchte lehren' : 'Möchte lernen',
        requestTypeColor: requestType === 'teach' ? ('primary' as const) : ('secondary' as const),
      }),
      [requestType]
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
      <Card
        elevation={2}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header with user info and status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Avatar
                src={requesterAvatar}
                alt={requesterName}
                sx={{ width: 48, height: 48, cursor: 'pointer' }}
                onClick={handleViewProfile}
              >
                <PersonIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={handleViewProfile}
                >
                  {requesterName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {requesterRating.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={statusLabel}
                size="small"
                sx={{
                  bgcolor: statusColor,
                  color: 'white',
                  fontWeight: 'medium',
                }}
              />
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Skill and request type */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {skillName}
            </Typography>
            <Chip
              label={requestTypeLabel}
              color={requestTypeColor}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Message */}
          {message && message.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nachricht:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'background.default',
                  p: 1.5,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  fontStyle: 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                "{message}"
              </Typography>
            </Box>
          )}

          {/* Preferences */}
          <Box sx={{ mb: 2 }}>
            {/* Days */}
            {preferredDays.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Bevorzugte Tage:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {preferredDays.slice(0, 4).map((day) => (
                    <Chip key={day} label={day} size="small" variant="outlined" />
                  ))}
                  {preferredDays.length > 4 && (
                    <Chip
                      label={`+${String(preferredDays.length - 4)}`}
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
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Bevorzugte Zeiten:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {preferredTimes.slice(0, 2).join(', ')}
                    {preferredTimes.length > 2 && ` (+${String(preferredTimes.length - 2)})`}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
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
        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {status === 'pending' && (
              <>
                {onReject && (
                  <Tooltip title="Ablehnen">
                    <IconButton color="error" onClick={handleReject} size="small">
                      <RejectIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {onAccept && (
                  <Tooltip title="Akzeptieren">
                    <IconButton color="success" onClick={handleAccept} size="small">
                      <AcceptIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}

            {onMessage && (
              <Tooltip title="Nachricht senden">
                <IconButton color="primary" onClick={handleMessage} size="small">
                  <MessageIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {status === 'pending' && onAccept && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleAccept}
              startIcon={<AcceptIcon />}
            >
              Akzeptieren
            </Button>
          )}

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
