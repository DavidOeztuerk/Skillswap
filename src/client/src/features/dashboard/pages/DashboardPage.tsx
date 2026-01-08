import React, { useEffect, memo, useMemo, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  Event as AppointmentsIcon,
  VideoCall as VideoCallIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
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
  type SxProps,
  type Theme,
} from '@mui/material';
import { useLoading } from '../../../core/contexts/loadingContextHooks';
import { LoadingKeys } from '../../../core/contexts/loadingContextValue';
import ApiErrorHandler from '../../../shared/components/error/ApiErrorHandler';
import PageContainer from '../../../shared/components/layout/PageContainer';
import PageHeader from '../../../shared/components/layout/PageHeader';
import SkeletonLoader from '../../../shared/components/ui/SkeletonLoader';
import useApiErrorRecovery from '../../../shared/hooks/useApiErrorRecovery';
import { formatDateTimeRange } from '../../../shared/utils/dateUtils';
import { mixins } from '../../../styles/mixins';
import { gridConfigs } from '../../../styles/responsive';
import useDashboard from '../hooks/useDashboard';

// ============================================================================
// PERFORMANCE: Extract all sx objects as constants to prevent recreation
// ============================================================================

// Card Styles
const dashboardCardSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 4,
  },
};

const cardContentSx: SxProps<Theme> = {
  flexGrow: 1,
};

const cardIconContainerSx: SxProps<Theme> = {
  ...mixins.flexColumn,
  alignItems: 'center',
  mb: 2,
};

const cardActionsSx: SxProps<Theme> = {
  justifyContent: 'center',
  pb: 2,
};

// Create icon wrapper sx factory (memoized per color)
const createIconWrapperSx = (color: string): SxProps<Theme> => ({
  ...mixins.flexCenter,
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: `${color}15`,
  color,
  mb: 2,
  position: 'relative',
});

const badgeSx: SxProps<Theme> = {
  '& .MuiBadge-badge': {
    top: -8,
    right: -8,
  },
};

// Paper/Section Styles
const sectionPaperSx: SxProps<Theme> = {
  p: { xs: 2, sm: 3 },
  height: '100%',
};

const dividerSx: SxProps<Theme> = {
  mb: 2,
};

// List Styles
const listItemSx: SxProps<Theme> = {
  px: 0,
};

const listItemPrimarySx: SxProps<Theme> = {
  ...mixins.flexBetween,
};

const notesSx: SxProps<Theme> = {
  mt: 0.5,
  display: 'block',
};

// Action Button Container
const actionContainerSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
  mt: 2,
};

// Grid spacing constants
const GRID_SPACING = { xs: 2, md: 3 };

// Icon mapping for dashboard cards
const CARD_ICONS: Record<string, React.ReactNode> = {
  Skills: <SkillsIcon fontSize="large" />,
  Matches: <MatchmakingIcon fontSize="large" />,
  Termine: <AppointmentsIcon fontSize="large" />,
};

const getCardIcon = (title: string): React.ReactNode =>
  CARD_ICONS[title] ?? <PersonIcon fontSize="large" />;

// Helper to get error message string
function getErrorMessage(error: string | Error | null | undefined): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

/**
 * Dashboard-Seite der Anwendung
 * Optimized with extracted sx constants for performance
 */
const DashboardPage: React.FC = memo((): JSX.Element => {
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
    const loadData = async (): Promise<void> => {
      await withLoading(LoadingKeys.FETCH_DATA, async () => {
        await executeWithRecovery(
          (): Promise<void> => {
            loadDashboardData();
            return Promise.resolve();
          },
          {
            maxRetries: 1,
            retryDelay: 2000,
            exponentialBackoff: false,
          }
        );
      });
    };

    void loadData();
  }, [withLoading, executeWithRecovery, loadDashboardData]);

  // Memoize icon wrapper styles per card color
  const iconWrapperStyles = useMemo(
    () =>
      cards.reduce<Record<string, SxProps<Theme>>>((acc, card) => {
        acc[card.color] = createIconWrapperSx(card.color);
        return acc;
      }, {}),
    [cards]
  );

  const dashboardCards = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        icon: getCardIcon(card.title),
        action: (): void => {
          void navigate(card.path);
        },
        iconWrapperSx: iconWrapperStyles[card.color],
      })),
    [cards, navigate, iconWrapperStyles]
  );

  const isDashboardLoading = useMemo(
    () => contextLoading(LoadingKeys.FETCH_DATA) || isLoading,
    [contextLoading, isLoading]
  );

  const displayError = useMemo(
    () => (hasErrors ? (errors[0] ?? null) : (recoveryError ?? null)),
    [hasErrors, errors, recoveryError]
  );

  // Memoize navigation handlers
  const handleNavigateAppointments = useMemo(
    () => (): void => {
      void navigate('/appointments');
    },
    [navigate]
  );

  const handleNavigateSkills = useMemo(
    () => (): void => {
      void navigate('/skills');
    },
    [navigate]
  );

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${user?.firstName ?? 'User'}!`}
        subtitle="Here you'll find an overview of your activities"
      />

      {displayError !== null && (
        <ApiErrorHandler
          error={{
            type: getErrorType(),
            message: getErrorMessage(displayError),
          }}
          onRetry={retry}
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={3}
          showNetworkStatus
        />
      )}

      {displayError === null && isDashboardLoading ? (
        <Grid container columns={12} spacing={GRID_SPACING}>
          {/* Dashboard Cards Skeleton */}
          <Grid size={{ xs: 12 }}>
            <Grid container columns={12} spacing={GRID_SPACING}>
              {[1, 2, 3, 4].map((i) => (
                <Grid size={gridConfigs.stats} key={i}>
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
      ) : displayError === null ? (
        <Grid container columns={12} spacing={GRID_SPACING}>
          {/* Overview Cards */}
          <Grid size={{ xs: 12 }}>
            <Grid container columns={12} spacing={GRID_SPACING}>
              {dashboardCards.map((card) => (
                <Grid size={gridConfigs.stats} key={card.title}>
                  <Card elevation={2} sx={dashboardCardSx}>
                    <CardContent sx={cardContentSx}>
                      <Box sx={cardIconContainerSx}>
                        <Box sx={card.iconWrapperSx}>
                          <Badge
                            badgeContent={(card as typeof card & { badge?: number }).badge ?? 0}
                            color="error"
                            invisible={
                              ((card as typeof card & { badge?: number }).badge ?? 0) === 0
                            }
                            sx={badgeSx}
                          >
                            {card.icon}
                          </Badge>
                        </Box>
                        <Typography variant="h6" component="h2" align="center">
                          {card.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" align="center">
                        {card.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={cardActionsSx}>
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

          {/* Upcoming Appointments */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper sx={sectionPaperSx}>
              <Typography variant="h6" gutterBottom>
                Anstehende Termine
              </Typography>
              <Divider sx={dividerSx} />

              {upcomingAppointments.length > 0 ? (
                <List disablePadding>
                  {upcomingAppointments.map((appointment) => (
                    <React.Fragment key={appointment.id}>
                      <ListItem alignItems="flex-start" sx={listItemSx}>
                        <ListItemIcon>
                          <VideoCallIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={listItemPrimarySx}>
                              <Typography variant="subtitle1">
                                {appointment.skill?.name ?? 'Skill'}
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
                              <Typography component="span" variant="body2" color="text.primary">
                                {appointment.organizerUserId === user?.id
                                  ? 'Teilnehmer:in'
                                  : 'Organisator:in'}
                                : {appointment.otherPartyName ?? 'Unbekannt'}
                              </Typography>
                              {(appointment.notes?.length ?? 0) > 0 && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                  sx={notesSx}
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

              <Box sx={actionContainerSx}>
                <Button
                  variant="text"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNavigateAppointments}
                >
                  Alle Termine anzeigen
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Teaching Skills */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Paper sx={sectionPaperSx}>
              <Typography variant="h6" gutterBottom>
                I can teach
              </Typography>
              <Divider sx={dividerSx} />

              {teachingSkills.length > 0 ? (
                <List disablePadding>
                  {teachingSkills.slice(0, 5).map((userSkill) => (
                    <React.Fragment key={userSkill.id}>
                      <ListItem sx={listItemSx}>
                        <ListItemIcon>
                          <SkillsIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={userSkill.name}
                          secondary={userSkill.category?.name ?? 'Kategorie'}
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

              <Box sx={actionContainerSx}>
                <Button
                  variant="text"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNavigateSkills}
                >
                  Alle Skills anzeigen
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Learning Skills */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Paper sx={sectionPaperSx}>
              <Typography variant="h6" gutterBottom>
                I want to learn
              </Typography>
              <Divider sx={dividerSx} />

              {learningSkills.length > 0 ? (
                <List disablePadding>
                  {learningSkills.slice(0, 5).map((userSkill) => (
                    <React.Fragment key={userSkill.id}>
                      <ListItem sx={listItemSx}>
                        <ListItemIcon>
                          <SkillsIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={userSkill.name}
                          secondary={userSkill.category?.name ?? 'Kategorie'}
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

              <Box sx={actionContainerSx}>
                <Button
                  variant="text"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNavigateSkills}
                >
                  Lernwünsche hinzufügen
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </PageContainer>
  );
});

DashboardPage.displayName = 'DashboardPage';

export default DashboardPage;
