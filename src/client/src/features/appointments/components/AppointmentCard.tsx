import React, { useMemo, useCallback, memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  CalendarToday as CalendarIcon,
  School as TeacherIcon,
  Person as StudentIcon,
  VideoCall as VideoCallIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  DoneAll as CompleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  IconButton,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { isPastDate, formatDateTimeRange } from '../../../shared/utils/dateUtils';
import { featureColors } from '../../../styles/tokens/colors';
import { spacing, componentSpacing } from '../../../styles/tokens/spacing';
import { type Appointment, AppointmentStatus } from '../types/Appointment';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation on render
// This allows React.memo to work properly
// ============================================================================

const cardSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  borderRadius: spacing[2] / 8,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  },
};

const cardContentSx: SxProps<Theme> = {
  flexGrow: 1,
  p: componentSpacing.card.padding / 8,
};

const headerBoxSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  mb: componentSpacing.card.gap / 8,
};

const userBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  mb: componentSpacing.card.gap / 8,
};

const userInfoBoxSx: SxProps<Theme> = {
  ml: componentSpacing.chip.paddingX / 8,
};

const dateBoxSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  mb: spacing[1] / 8,
};

const cardActionsSx: SxProps<Theme> = {
  p: componentSpacing.card.actionsPadding / 8,
  pt: 0,
};

const actionsContainerSx: SxProps<Theme> = {
  width: '100%',
};

const actionsBoxSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: { xs: 0.5, sm: 1 },
};

const chipSx: SxProps<Theme> = {
  fontWeight: 'medium',
};

const iconSx: SxProps<Theme> = {
  verticalAlign: 'middle',
  mr: spacing[0.5] / 8,
};

const calendarIconSx: SxProps<Theme> = {
  color: 'text.secondary',
  mr: spacing[1] / 8,
};

const dividerSx: SxProps<Theme> = {
  my: componentSpacing.chip.paddingX / 8,
};

const joinCallButtonSx: SxProps<Theme> = {
  mb: 1,
};

const iconButtonSx: SxProps<Theme> = {
  minWidth: 44,
  minHeight: 44,
};

// ============================================================================
// Helper functions extracted outside component for performance
// ============================================================================

/** Get status color based on appointment status */
function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.Pending:
      return featureColors.appointmentStatus.scheduled;
    case AppointmentStatus.Confirmed:
      return featureColors.appointmentStatus.confirmed;
    case AppointmentStatus.Cancelled:
      return featureColors.appointmentStatus.cancelled;
    case AppointmentStatus.Completed:
      return featureColors.appointmentStatus.completed;
    case AppointmentStatus.Rescheduled:
      return featureColors.appointmentStatus.scheduled;
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

/** Get status label based on appointment status */
function getStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.Pending:
      return 'Ausstehend';
    case AppointmentStatus.Confirmed:
      return 'Bestätigt';
    case AppointmentStatus.Cancelled:
      return 'Abgesagt';
    case AppointmentStatus.Completed:
      return 'Abgeschlossen';
    case AppointmentStatus.Rescheduled:
      return 'Verschoben';
    default: {
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
    }
  }
}

// ============================================================================
// Component
// ============================================================================

interface AppointmentCardProps {
  appointment: Appointment;
  isTeacher?: boolean;
  onConfirm?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onComplete?: (appointmentId: string) => void;
}

/**
 * Karte zur Anzeige eines Termins mit entsprechenden Aktionen
 */
const AppointmentCard: React.FC<AppointmentCardProps> = memo(
  ({ appointment, isTeacher = false, onConfirm, onCancel, onComplete }) => {
    const otherUser = useMemo(
      () => (isTeacher ? appointment.studentDetails : appointment.teacherDetails),
      [isTeacher, appointment.studentDetails, appointment.teacherDetails]
    );

    const { canJoinCall, canConfirm, canCancel, canComplete } = useMemo(
      () => ({
        canJoinCall:
          appointment.status === AppointmentStatus.Confirmed &&
          appointment.videocallUrl &&
          appointment.endTime &&
          !isPastDate(appointment.endTime),
        canConfirm: !appointment.isOrganizer && appointment.status === AppointmentStatus.Pending,
        canCancel:
          appointment.status === AppointmentStatus.Pending ||
          (appointment.status === AppointmentStatus.Confirmed &&
            appointment.startTime &&
            !isPastDate(appointment.startTime)),
        canComplete:
          isTeacher &&
          appointment.status === AppointmentStatus.Confirmed &&
          appointment.endTime &&
          isPastDate(appointment.endTime) &&
          !isPastDate(
            new Date(
              new Date(appointment.endTime).getTime() + 7 * 24 * 60 * 60 * 1000
            ).toISOString()
          ), // Innerhalb von 7 Tagen nach Ende
      }),
      [
        appointment.status,
        appointment.videocallUrl,
        appointment.endTime,
        appointment.isOrganizer,
        appointment.startTime,
        isTeacher,
      ]
    );

    // Memoized status chip sx
    const statusChipSx = useMemo(
      (): SxProps<Theme> => ({
        bgcolor: getStatusColor(appointment.status),
        color: 'white',
        fontWeight: 'medium',
      }),
      [appointment.status]
    );

    // Memoized event handlers
    const handleConfirm = useCallback(
      () => onConfirm?.(appointment.id),
      [onConfirm, appointment.id]
    );
    const handleCancel = useCallback(() => onCancel?.(appointment.id), [onCancel, appointment.id]);
    const handleComplete = useCallback(
      () => onComplete?.(appointment.id),
      [onComplete, appointment.id]
    );

    return (
      <Card elevation={2} sx={cardSx}>
        <CardContent sx={cardContentSx}>
          <Box sx={headerBoxSx}>
            <Chip
              label={appointment.skill?.name ?? 'Skill'}
              size="small"
              color="primary"
              sx={chipSx}
            />
            <Chip label={getStatusLabel(appointment.status)} size="small" sx={statusChipSx} />
          </Box>

          <Box sx={userBoxSx}>
            <Box sx={userInfoBoxSx}>
              <Typography variant="subtitle1" fontWeight="medium">
                {otherUser?.firstName ?? ''} {otherUser?.lastName ?? ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isTeacher ? (
                  <>
                    <StudentIcon fontSize="small" sx={iconSx} />
                    Lernende:r
                  </>
                ) : (
                  <>
                    <TeacherIcon fontSize="small" sx={iconSx} />
                    Lehrende:r
                  </>
                )}
              </Typography>
            </Box>
          </Box>

          <Box sx={dateBoxSx}>
            <CalendarIcon fontSize="small" sx={calendarIconSx} />
            <Typography variant="body2">
              {formatDateTimeRange(appointment.startTime, appointment.endTime)}
            </Typography>
          </Box>

          {appointment.notes ? (
            <>
              <Divider sx={dividerSx} />
              <Typography variant="body2" color="text.secondary">
                <strong>Notizen:</strong> {appointment.notes}
              </Typography>
            </>
          ) : null}
        </CardContent>

        <CardActions sx={cardActionsSx}>
          <Box sx={actionsContainerSx}>
            {canJoinCall === true && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                component={RouterLink}
                to={`/videocall/${appointment.id}`}
                startIcon={<VideoCallIcon />}
                sx={joinCallButtonSx}
              >
                Videoanruf beitreten
              </Button>
            )}

            <Box sx={actionsBoxSx}>
              {canConfirm && onConfirm !== undefined ? (
                <Tooltip title="Termin bestätigen">
                  <IconButton
                    color="success"
                    onClick={handleConfirm}
                    size="medium"
                    sx={iconButtonSx}
                  >
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
              ) : null}

              {canCancel === true && onCancel !== undefined && (
                <Tooltip title="Termin absagen">
                  <IconButton color="error" onClick={handleCancel} size="medium" sx={iconButtonSx}>
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              )}

              {canComplete === true && onComplete !== undefined && (
                <Tooltip title="Termin als abgeschlossen markieren">
                  <IconButton color="info" onClick={handleComplete} size="medium" sx={iconButtonSx}>
                    <CompleteIcon />
                  </IconButton>
                </Tooltip>
              )}

              {!canConfirm && canCancel === false && canComplete === false && (
                <Box /> // Leerer Platzhalter, um das Layout konsistent zu halten
              )}

              {/* Bearbeiten-Button immer auf der rechten Seite */}
              <Tooltip title="Details anzeigen">
                <IconButton
                  component={RouterLink}
                  to={`/appointments/${appointment.id}`}
                  color="primary"
                  size="medium"
                  sx={iconButtonSx}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardActions>
      </Card>
    );
  }
);

AppointmentCard.displayName = 'AppointmentCard';

export default AppointmentCard;
