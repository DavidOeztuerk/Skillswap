import React from 'react';
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
import { formatDateTimeRange } from '../../utils/dateUtils';
import { isPastDate } from '../../utils/dateUtils';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
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
const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  isTeacher = false,
  onConfirm,
  onCancel,
  onComplete,
}) => {
  const theme = useTheme();
  //   const currentUserId = isTeacher
  //     ? appointment.teacherId
  //     : appointment.studentId;
  const otherUser = isTeacher
    ? appointment.studentDetails
    : appointment.teacherDetails;

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case 'Pending':
        return theme.palette.warning.main;
      case 'Confirmed':
        return theme.palette.success.main;
      case 'Cancelled':
        return theme.palette.error.main;
      case 'Completed':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: AppointmentStatus): string => {
    switch (status) {
      case 'Pending':
        return 'Ausstehend';
      case 'Confirmed':
        return 'Bestätigt';
      case 'Cancelled':
        return 'Abgesagt';
      case 'Completed':
        return 'Abgeschlossen';
      default:
        return status;
    }
  };

  const canJoinCall =
    appointment.status === 'Confirmed' &&
    appointment.videocallUrl &&
    !isPastDate(appointment.endTime);

  const canConfirm = isTeacher && appointment.status === 'Pending';

  const canCancel =
    appointment.status === 'Pending' ||
    (appointment.status === 'Confirmed' && !isPastDate(appointment.startTime));

  const canComplete =
    isTeacher &&
    appointment.status === 'Confirmed' &&
    isPastDate(appointment.endTime) &&
    !isPastDate(appointment.endTime + 7); // Innerhalb von 7 Tagen nach Ende

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
            label={appointment.skill.name}
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

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {/* <ProfileAvatar
            src={otherUser.profilePicture || undefined}
            alt={`${otherUser.firstName} ${otherUser.lastName}`}
            size={40}
          /> */}
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
                  Lernende:r
                </>
              ) : (
                <>
                  <TeacherIcon
                    fontSize="small"
                    sx={{ verticalAlign: 'middle', mr: 0.5 }}
                  />
                  Lehrende:r
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
            {formatDateTimeRange(appointment.startTime, appointment.endTime)}
          </Typography>
        </Box>

        {appointment.notes && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Notizen:</strong> {appointment.notes}
            </Typography>
          </>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ width: '100%' }}>
          {canJoinCall && (
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {canConfirm && onConfirm && (
              <Tooltip title="Termin bestätigen">
                <IconButton
                  color="success"
                  onClick={() => onConfirm(appointment.id)}
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>
            )}

            {canCancel && onCancel && (
              <Tooltip title="Termin absagen">
                <IconButton
                  color="error"
                  onClick={() => onCancel(appointment.id)}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            )}

            {canComplete && onComplete && (
              <Tooltip title="Termin als abgeschlossen markieren">
                <IconButton
                  color="info"
                  onClick={() => onComplete(appointment.id)}
                >
                  <CompleteIcon />
                </IconButton>
              </Tooltip>
            )}

            {!canConfirm && !canCancel && !canComplete && (
              <Box /> // Leerer Platzhalter, um das Layout konsistent zu halten
            )}

            {/* Bearbeiten-Button immer auf der rechten Seite */}
            <Tooltip title="Details anzeigen">
              <IconButton
                component={RouterLink}
                to={`/appointments/${appointment.id}`}
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardActions>
    </Card>
  );
};

export default AppointmentCard;
