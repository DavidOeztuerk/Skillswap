import React, { useEffect, memo, useMemo } from 'react';
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
import { useDashboard } from '../hooks/useDashboard';
import { formatDateTimeRange } from '../utils/dateUtils';
import { withDefault } from '../utils/safeAccess';

/**
 * Dashboard-Seite der Anwendung
 */
const DashboardPage: React.FC = memo(() => {
  const navigate = useNavigate();
  const { 
    user,
    cards,
    teachingSkills,
    learningSkills,
    upcomingAppointments,
    loadDashboardData,
    isLoading,
    hasErrors,
    errors,
  } = useDashboard();
  const { withLoading, isLoading: contextLoading } = useLoading();

  const {
    executeWithRecovery,
    error: recoveryError,
    isRetrying,
    retryCount,
    retry,
    getErrorType,
  } = useApiErrorRecovery();

  useEffect(() => {
    // Load dashboard data once on mount
    const loadData = async () => {
      await withLoading(LoadingKeys.FETCH_DATA, async () => {
        await executeWithRecovery(async () => {
          await loadDashboardData();
        }, {
          maxRetries: 1,
          retryDelay: 2000,
          exponentialBackoff: false,
        });
      });
    };

    void loadData();
    // Only run once on mount
  }, []); 

  const dashboardCards = useMemo(() => cards.map(card => ({
    ...card,
    icon: card.title === 'Skills' ? <SkillsIcon fontSize="large" /> :
          card.title === 'Matches' ? <MatchmakingIcon fontSize="large" /> :
          card.title === 'Termine' ? <AppointmentsIcon fontSize="large" /> :
          <PersonIcon fontSize="large" />,
    action: () => navigate(card.path),
  })), [cards, navigate]);

  const isDashboardLoading = useMemo(() => 
    contextLoading(LoadingKeys.FETCH_DATA) || isLoading, 
    [contextLoading, isLoading]
  );
  
  const displayError = useMemo(() => 
    hasErrors ? errors[0] : recoveryError, 
    [hasErrors, errors, recoveryError]
  );

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${withDefault(user?.firstName, 'User')}!`}
        subtitle="Here you'll find an overview of your activities"
      />

      {displayError && (
        <ApiErrorHandler
          error={{
            type: getErrorType().toUpperCase() as any,
            message: typeof displayError === 'string' ? displayError : displayError?.message || 'Unknown error',
          }}
          onRetry={retry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={3}
          showNetworkStatus={true}
        />
      )}

      {!displayError && isDashboardLoading ? (
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
      ) : !displayError && (
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
                                {appointment.organizerUserId === user?.id
                                  ? 'Teilnehmer:in'
                                  : 'Organisator:in'}
                                :{' '}
                                {appointment.otherPartyName || 'Unbekannt'}
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

              {learningSkills && learningSkills.length > 0 ? (
                <List disablePadding>
                  {learningSkills.slice(0, 5).map((userSkill) => (
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
});

// Add display name for debugging
DashboardPage.displayName = 'DashboardPage';

export default DashboardPage;
