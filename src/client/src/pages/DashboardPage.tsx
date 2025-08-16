import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Grid,
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  Event as AppointmentsIcon,
  VideoCall as VideoCallIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import PageHeader from '../components/layout/PageHeader';
import PageContainer from '../components/layout/PageContainer';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import ApiErrorHandler from '../components/error/ApiErrorHandler';
import { useApiErrorRecovery } from '../hooks/useApiErrorRecovery';
import { useLoading, LoadingKeys } from '../contexts/LoadingContext';
import { useAuth } from '../hooks/useAuth';
import { useSkills } from '../hooks/useSkills';
import { useAppointments } from '../hooks/useAppointments';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { useNotifications } from '../hooks/useNotifications';
import { formatDateTimeRange } from '../utils/dateUtils';
import { withDefault } from '../utils/safeAccess';

/**
 * Dashboard-Seite der Anwendung
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { withLoading, isLoading } = useLoading();
  const { userSkills, fetchUserSkills, isLoading: skillsLoading } = useSkills();
  const {
    appointments,
    loadAppointments,
    isLoading: appointmentsLoading,
  } = useAppointments();
  const {
    matches,
    incomingRequests,
    // outgoingRequests,
    loadMatches,
    loadIncomingRequests,
    loadOutgoingRequests,
    isLoading: matchingLoading,
  } = useMatchmaking();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
  } = useNotifications();

  const {
    executeWithRecovery,
    error,
    isRetrying,
    retryCount,
    retry,
    getErrorType,
  } = useApiErrorRecovery();

  // Daten laden mit Error Recovery
  // const loadDashboardData = async () => {
  //   await executeWithRecovery(async () => {
  //     await Promise.all([
  //       fetchUserSkills(),
  //       loadAppointments(),
  //       loadMatches(),
  //       loadIncomingRequests(),
  //       loadOutgoingRequests(),
  //     ]);
  //   }, {
  //     maxRetries: 2,
  //     retryDelay: 1000,
  //     exponentialBackoff: true,
  //   });
  // };

  // Load data with loading context
  useEffect(() => {
    const loadData = async () => {
      await withLoading(LoadingKeys.FETCH_DATA, async () => {
        await executeWithRecovery(async () => {
          await Promise.all([
            fetchUserSkills(),
            loadAppointments(),
            loadMatches(),
            loadIncomingRequests(),
            loadOutgoingRequests(),
          ]);
        }, {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
        });
      });
    };
    
    void loadData();
  }, [withLoading]); // Added withLoading to dependencies

  // Statistiken berechnen
  const totalSkills = userSkills?.length;
  const teachingSkillsCount = userSkills?.filter(skill => skill?.isOffered).length;
  const pendingAppointments = appointments?.filter(appt => appt?.status === 'Pending').length;
  const totalMatches = matches?.length;
  const pendingMatchRequests = incomingRequests?.filter(req => req?.status === 'pending').length;

  // Dashboard-Karten mit echten Daten
  const dashboardCards = [
    {
      title: 'Skills',
      icon: <SkillsIcon fontSize="large" />,
      description: `${totalSkills} Skills • ${teachingSkillsCount} zum Lehren`,
      action: () => navigate('/skills'),
      color: '#4caf50',
      count: totalSkills,
    },
    {
      title: 'Matches',
      icon: <MatchmakingIcon fontSize="large" />,
      description: `${totalMatches} active matches${pendingMatchRequests > 0 ? ` • ${pendingMatchRequests} new requests` : ''}`,
      action: () => navigate('/matchmaking'),
      color: '#ff9800',
      count: totalMatches,
      badge: pendingMatchRequests,
    },
    {
      title: 'Termine',
      icon: <AppointmentsIcon fontSize="large" />,
      description: `${appointments.length} Termine${pendingAppointments > 0 ? ` • ${pendingAppointments} ausstehend` : ''}`,
      action: () => navigate('/appointments'),
      color: '#e91e63',
      count: appointments.length,
      badge: pendingAppointments,
    },
    {
      title: 'Benachrichtigungen',
      icon: <PersonIcon fontSize="large" />,
      description: `${notifications.length} messages${withDefault(unreadCount, 0) > 0 ? ` • ${unreadCount} unread` : ''}`,
      action: () => navigate('/profile'),
      color: '#3f51b5',
      count: notifications.length,
      badge: withDefault(unreadCount, 0),
    },
  ];

  // Aktuelle Lehrskills
  const teachingSkills = userSkills?.filter((skill) => skill?.isOffered);
  // Aktuelle Lernwünsche
  // const learningSkills = safeUserSkills.filter((skill) => skill?.isLearnable);

  // Anstehende Termine (max. 3)
  const upcomingAppointments = appointments
    .filter(
      (appt) =>
        appt?.startTime && new Date(appt.startTime) > new Date() && appt?.status === 'Confirmed'
    )
    .sort(
      (a, b) =>
        new Date(a?.startTime || 0).getTime() - new Date(b?.startTime || 0).getTime()
    )
    .slice(0, 3);

  const isDashboardLoading = isLoading(LoadingKeys.FETCH_DATA) || 
    skillsLoading || appointmentsLoading || matchingLoading || notificationsLoading;

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${withDefault(user?.firstName, 'User')}!`}
        subtitle="Here you'll find an overview of your activities"
      />

      {error && (
        <ApiErrorHandler
          error={{
            type: getErrorType().toUpperCase() as any,
            message: error.message,
          }}
          onRetry={retry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={3}
          showNetworkStatus={true}
        />
      )}

      {!error && isDashboardLoading ? (
        <Grid container columns={12} spacing={3}>
          {/* Dashboard Cards Skeleton */}
          <Grid size={{ xs: 12 }}>
            <Grid container columns={12} spacing={3}>
              {[1, 2, 3, 4].map(i => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <SkeletonLoader variant="card" />
                </Grid>
              ))}
            </Grid>
          </Grid>
          
          {/* Content Skeleton */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <SkeletonLoader variant="list" count={3} />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <SkeletonLoader variant="list" count={5} />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <SkeletonLoader variant="list" count={5} />
          </Grid>
        </Grid>
      ) : !error && (
        <Grid container columns={12} spacing={3}>
          {/* Übersichtskarten */}
          <Grid size={{ xs: 12 }}>
            <Grid container columns={12} spacing={3}>
              {dashboardCards.map((card, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            backgroundColor: `${card.color}15`,
                            color: card.color,
                            mb: 2,
                            position: 'relative',
                          }}
                        >
                          <Badge 
                            badgeContent={(card as typeof card & { badge?: number }).badge || 0} 
                            color="error"
                            invisible={!(card as typeof card & { badge?: number }).badge}
                            sx={{
                              '& .MuiBadge-badge': {
                                top: -8,
                                right: -8,
                              },
                            }}
                          >
                            {card.icon}
                          </Badge>
                        </Box>
                        <Typography variant="h6" component="h2" align="center">
                          {card.title}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        {card.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={card.action}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Öffnen
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Anstehende Termine */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Anstehende Termine
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {upcomingAppointments?.length > 0 ? (
                <List disablePadding>
                  {upcomingAppointments.map((appointment) => (
                    <React.Fragment key={appointment.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemIcon>
                          <VideoCallIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant="subtitle1">
                                {appointment.skill?.name || 'Skill'}
                              </Typography>
                              <Chip
                                label={formatDateTimeRange(
                                  appointment.startTime,
                                  appointment.endTime
                                )}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {appointment.teacherId === user?.id
                                  ? 'Schüler:in'
                                  : 'Lehrer:in'}
                                :{' '}
                                {appointment.teacherId === user?.id
                                  ? `${appointment.studentDetails?.firstName || ''} ${appointment.studentDetails?.lastName || ''}`
                                  : `${appointment.teacherDetails?.firstName || ''} ${appointment.teacherDetails?.lastName || ''}`}
                              </Typography>
                              {appointment.notes && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  {appointment.notes}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Keine anstehenden Termine.
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="text"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/appointments')}
                >
                  Alle Termine anzeigen
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Skills-Übersicht */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                I can teach
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {teachingSkills && teachingSkills?.length > 0 ? (
                <List disablePadding>
                  {teachingSkills.slice(0, 5).map((userSkill) => (
                    <React.Fragment key={userSkill.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <SkillsIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={userSkill.name}
                          secondary={`Level: ${userSkill.proficiencyLevel?.level}`}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Keine Lehrfähigkeiten festgelegt.
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="text"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/skills')}
                >
                  Alle Skills anzeigen
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Lernwünsche */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                I want to learn
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {userSkills && userSkills.length > 0 ? (
                <List disablePadding>
                  {userSkills.slice(0, 5).map((userSkill) => (
                    <React.Fragment key={userSkill.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <SkillsIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={userSkill.name}
                          secondary={`Level: ${userSkill.proficiencyLevel?.level}`}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Keine Lernwünsche festgelegt.
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="text"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/skills')}
                >
                  Lernwünsche hinzufügen
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </PageContainer>
  );
};

export default DashboardPage;
