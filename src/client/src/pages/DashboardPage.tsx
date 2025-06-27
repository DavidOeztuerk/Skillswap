// src/pages/DashboardPage.tsx

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
} from '@mui/material';
import Grid from '@mui/material/Grid2'; // <-- Grid2 statt altem Grid
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
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useSkills } from '../hooks/useSkills';
import { useAppointments } from '../hooks/useAppointments';
import { formatDateTimeRange } from '../utils/dateUtils';

/**
 * Dashboard-Seite der Anwendung
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userSkills, fetchUserSkills, isLoading: skillsLoading } = useSkills();
  const {
    appointments,
    loadAppointments,
    isLoading: appointmentsLoading,
  } = useAppointments();

  // Daten laden
  useEffect(() => {
    fetchUserSkills();
    loadAppointments();
  }, [fetchUserSkills, loadAppointments]);

  // Dashboard-Karten
  const dashboardCards = [
    {
      title: 'Mein Profil',
      icon: <PersonIcon fontSize="large" />,
      description: 'Bearbeite deine persönlichen Informationen',
      action: () => navigate('/profile'),
      color: '#3f51b5',
    },
    {
      title: 'Skills',
      icon: <SkillsIcon fontSize="large" />,
      description: 'Verwalte deine Fähigkeiten und entdecke neue',
      action: () => navigate('/skills'),
      color: '#4caf50',
    },
    {
      title: 'Matches',
      icon: <MatchmakingIcon fontSize="large" />,
      description: 'Finde passende Lehrer oder Schüler',
      action: () => navigate('/matchmaking'),
      color: '#ff9800',
    },
    {
      title: 'Termine',
      icon: <AppointmentsIcon fontSize="large" />,
      description: 'Verwalte deine Lehr- und Lerntermine',
      action: () => navigate('/appointments'),
      color: '#e91e63',
    },
  ];

  // Aktuelle Lehrskills
  const teachingSkills = userSkills.filter((skill) => skill.isOffering);
  // Aktuelle Lernwünsche
  // const learningSkills = userSkills.filter((skill) => skill.isLearnable);

  // Anstehende Termine (max. 3)
  const upcomingAppointments = appointments
    .filter(
      (appt) =>
        new Date(appt.startTime) > new Date() && appt.status === 'Confirmed'
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 3);

  const isLoading = skillsLoading || appointmentsLoading;

  return (
    <PageContainer>
      <PageHeader
        title={`Willkommen, ${user?.firstName || 'Benutzer'}!`}
        subtitle="Hier findest du einen Überblick über deine Aktivitäten"
      />

      {isLoading ? (
        <LoadingSpinner message="Dashboard wird geladen..." />
      ) : (
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
                          }}
                        >
                          {card.icon}
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

              {upcomingAppointments.length > 0 ? (
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
                                {appointment.skill.name}
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
                                  ? `${appointment.studentDetails.firstName} ${appointment.studentDetails.lastName}`
                                  : `${appointment.teacherDetails.firstName} ${appointment.teacherDetails.lastName}`}
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
                Ich kann lehren
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {teachingSkills.length > 0 ? (
                <List disablePadding>
                  {teachingSkills.slice(0, 5).map((userSkill) => (
                    <React.Fragment key={userSkill.skillId}>
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
                Ich möchte lernen
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {userSkills.length > 0 ? (
                <List disablePadding>
                  {userSkills.slice(0, 5).map((userSkill) => (
                    <React.Fragment key={userSkill.skillId}>
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
