// src/components/matchmaking/MatchRequestCard.tsx
import React from 'react';
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
  location?: string;
  isRemote: boolean;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onMessage?: (id: string) => void;
  onViewProfile?: (userId: string) => void;
}

const MatchRequestCard: React.FC<MatchRequestCardProps> = ({
  id,
  requesterName,
  requesterAvatar,
  requesterRating,
  skillName,
  requestType,
  message,
  preferredDays,
  preferredTimes,
  location,
  isRemote,
  createdAt,
  status,
  onAccept,
  onReject,
  onMessage,
  onViewProfile,
}) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'accepted':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'accepted':
        return 'Akzeptiert';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return 'Ausstehend';
    }
  };

  const getRequestTypeLabel = () => {
    return requestType === 'teach' ? 'Möchte lehren' : 'Möchte lernen';
  };

  const getRequestTypeColor = () => {
    return requestType === 'teach' ? 'primary' : 'secondary';
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Avatar
              src={requesterAvatar}
              alt={requesterName}
              sx={{ width: 48, height: 48, cursor: 'pointer' }}
              onClick={() => onViewProfile?.(id)}
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
                onClick={() => onViewProfile?.(id)}
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
              label={getStatusLabel()}
              size="small"
              sx={{
                bgcolor: getStatusColor(),
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
            label={getRequestTypeLabel()}
            color={getRequestTypeColor()}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Message */}
        {message && (
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
          {preferredDays?.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Bevorzugte Tage:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {preferredDays.slice(0, 4).map((day) => (
                  <Chip key={day} label={day} size="small" variant="outlined" />
                ))}
                {preferredDays?.length > 4 && (
                  <Chip
                    label={`+${preferredDays?.length - 4}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Times */}
          {preferredTimes?.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Bevorzugte Zeiten:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {preferredTimes.slice(0, 2).join(', ')}
                  {preferredTimes?.length > 2 && ` (+${preferredTimes?.length - 2})`}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {isRemote ? 'Online' : location || 'Vor Ort'}
            </Typography>
          </Box>
        </Box>

        {/* Time stamp */}
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: de })}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {status === 'pending' && (
            <>
              {onReject && (
                <Tooltip title="Ablehnen">
                  <IconButton
                    color="error"
                    onClick={() => onReject(id)}
                    size="small"
                  >
                    <RejectIcon />
                  </IconButton>
                </Tooltip>
              )}
              {onAccept && (
                <Tooltip title="Akzeptieren">
                  <IconButton
                    color="success"
                    onClick={() => onAccept(id)}
                    size="small"
                  >
                    <AcceptIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
          
          {onMessage && (
            <Tooltip title="Nachricht senden">
              <IconButton
                color="primary"
                onClick={() => onMessage(id)}
                size="small"
              >
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
            onClick={() => onAccept(id)}
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
            onClick={() => onMessage?.(id)}
            startIcon={<MessageIcon />}
          >
            Nachricht
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default MatchRequestCard;