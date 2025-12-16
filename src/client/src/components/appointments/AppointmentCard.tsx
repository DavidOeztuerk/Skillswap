import React, { useMemo, useCallback, memo } from 'react';
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
  useTheme,
} from '@mui/material';
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
import { Link as RouterLink } from 'react-router-dom';
import { formatDateTimeRange, isPastDate } from '../../utils/dateUtils';
import { type Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { spacing, componentSpacing, featureColors } from '../../styles/tokens';
// import ProfileAvatar from '../ui/ProfilAvatar';

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
    const theme = useTheme();

    const otherUser = useMemo(
      () => (isTeacher ? appointment.studentDetails : appointment.teacherDetails),
      [isTeacher, appointment.studentDetails, appointment.teacherDetails]
    );

    const getStatusColor = useCallback(
      (status: AppointmentStatus): string => {
        switch (status) {
          case AppointmentStatus.Pending:
            return featureColors.appointmentStatus.scheduled;
          case AppointmentStatus.Confirmed:
            return featureColors.appointmentStatus.confirmed;
          case AppointmentStatus.Cancelled:
            return featureColors.appointmentStatus.cancelled;
          case AppointmentStatus.Completed:
            return featureColors.appointmentStatus.completed;
          default:
            return theme.palette.grey[500];
        }
      },
      [theme.palette.grey]
    );

    const getStatusLabel = useCallback((status: AppointmentStatus): string => {
      switch (status) {
        case AppointmentStatus.Pending:
          return 'Ausstehend';
        case AppointmentStatus.Confirmed:
          return 'Bestätigt';
        case AppointmentStatus.Cancelled:
          return 'Abgesagt';
        case AppointmentStatus.Completed:
          return 'Abgeschlossen';
        default:
          return status;
      }
    }, []);

    const { canJoinCall, canConfirm, canCancel, canComplete } = useMemo(
      () => ({
        canJoinCall:
          appointment.status === AppointmentStatus.Confirmed &&
          appointment.videocallUrl &&
          appointment.endTime &&
          !isPastDate(appointment.endTime),
        // FIX: Only the PARTICIPANT (not the organizer) can accept the appointment
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
      <Card
        elevation={2}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          borderRadius: spacing[2] / 8,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: componentSpacing.card.padding / 8 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: componentSpacing.card.gap / 8,
            }}
          >
            <Chip
              label={appointment.skill?.name ?? 'Skill'}
              size="small"
              color="primary"
              sx={{ fontWeight: 'medium' }}
            />
            <Chip
              label={getStatusLabel(appointment.status)}
              size="small"
              sx={{
                bgcolor: getStatusColor(appointment.status),
                color: 'white',
                fontWeight: 'medium',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: componentSpacing.card.gap / 8 }}>
            {/* <ProfileAvatar
            src={otherUser.profilePicture || undefined}
            alt={`${otherUser.firstName} ${otherUser.lastName}`}
            size={40}
          /> */}
            <Box sx={{ ml: componentSpacing.chip.paddingX / 8 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {otherUser?.firstName ?? ''} {otherUser?.lastName ?? ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isTeacher ? (
                  <>
                    <StudentIcon
                      fontSize="small"
                      sx={{ verticalAlign: 'middle', mr: spacing[0.5] / 8 }}
                    />
                    Lernende:r
                  </>
                ) : (
                  <>
                    <TeacherIcon
                      fontSize="small"
                      sx={{ verticalAlign: 'middle', mr: spacing[0.5] / 8 }}
                    />
                    Lehrende:r
                  </>
                )}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: spacing[1] / 8 }}>
            <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: spacing[1] / 8 }} />
            <Typography variant="body2">
              {formatDateTimeRange(appointment.startTime, appointment.endTime)}
            </Typography>
          </Box>

          {appointment.notes && (
            <>
              <Divider sx={{ my: componentSpacing.chip.paddingX / 8 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Notizen:</strong> {appointment.notes}
              </Typography>
            </>
          )}
        </CardContent>

        <CardActions sx={{ p: componentSpacing.card.actionsPadding / 8, pt: 0 }}>
          <Box sx={{ width: '100%' }}>
            {canJoinCall === true && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                component={RouterLink}
                to={`/videocall/${appointment.id}`}
                startIcon={<VideoCallIcon />}
                sx={{ mb: 1 }}
              >
                Videoanruf beitreten
              </Button>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: { xs: 0.5, sm: 1 },
              }}
            >
              {canConfirm && onConfirm !== undefined && (
                <Tooltip title="Termin bestätigen">
                  <IconButton
                    color="success"
                    onClick={handleConfirm}
                    size="medium"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
              )}

              {canCancel === true && onCancel !== undefined && (
                <Tooltip title="Termin absagen">
                  <IconButton
                    color="error"
                    onClick={handleCancel}
                    size="medium"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              )}

              {canComplete === true && onComplete !== undefined && (
                <Tooltip title="Termin als abgeschlossen markieren">
                  <IconButton
                    color="info"
                    onClick={handleComplete}
                    size="medium"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
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
                  sx={{ minWidth: 44, minHeight: 44 }}
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
