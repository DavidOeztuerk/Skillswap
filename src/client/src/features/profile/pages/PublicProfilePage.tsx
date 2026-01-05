import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  LocalOffer as OfferIcon,
  Star as StarIcon,
  CalendarMonth as CalendarIcon,
  Work as WorkIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Paper,
  Rating,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useNavigation } from '../../../shared/hooks/useNavigation';
import { useAuth } from '../../auth/hooks/useAuth';
import ReviewsSection from '../components/ReviewsSection';
import { usePublicProfile } from '../hooks/usePublicProfile';
import type { PublicProfile, UserExperience, UserEducation } from '../store/profileAdapter+State';

// ============================================================================
// Sub-components
// ============================================================================

interface ProfileHeaderProps {
  profile: PublicProfile;
  isMobile: boolean;
  isAuthenticated: boolean;
  onReviewsClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isMobile,
  isAuthenticated,
  onReviewsClick,
}) => {
  const theme = useTheme();
  const memberSinceDate = new Date(profile.memberSince);
  const memberSinceYear = memberSinceDate.getFullYear();

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 4 },
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }}
    >
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'center' : 'flex-start'}
        gap={3}
      >
        {/* Avatar */}
        <Avatar
          src={profile.avatarUrl}
          sx={{
            width: { xs: 80, sm: 120 },
            height: { xs: 80, sm: 120 },
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: 2,
          }}
        >
          <PersonIcon sx={{ fontSize: { xs: 40, sm: 60 } }} />
        </Avatar>

        {/* Info */}
        <Box flex={1} textAlign={isMobile ? 'center' : 'left'}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" gutterBottom>
            {profile.firstName} {profile.lastName}
          </Typography>

          {profile.headline ? (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {profile.headline}
            </Typography>
          ) : null}

          {/* Rating - clickable only if authenticated */}
          <Box
            onClick={isAuthenticated ? onReviewsClick : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: 1,
              mb: 1,
              cursor: isAuthenticated ? 'pointer' : 'default',
              borderRadius: 1,
              p: 0.5,
              mx: -0.5,
              '&:hover': isAuthenticated ? { bgcolor: 'action.hover' } : {},
            }}
          >
            <Rating value={profile.averageRating} readOnly precision={0.5} size="small" />
            <Typography
              variant="body2"
              color={isAuthenticated ? 'primary' : 'text.secondary'}
              sx={isAuthenticated ? { '&:hover': { textDecoration: 'underline' } } : {}}
            >
              {profile.averageRating.toFixed(1)} ({profile.totalReviews} Bewertungen)
              {isAuthenticated ? ' →' : ''}
            </Typography>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            justifyContent={isMobile ? 'center' : 'flex-start'}
            gap={0.5}
          >
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Mitglied seit {memberSinceYear}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

interface StatsCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label, color }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 2,
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ color: color ?? theme.palette.primary.main }}>{icon}</Box>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
};

interface ProfileStatsProps {
  profile: PublicProfile;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ profile }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          icon={<OfferIcon fontSize="large" />}
          value={profile.skillsOffered}
          label="Angebote"
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          icon={<SchoolIcon fontSize="large" />}
          value={profile.skillsLearned}
          label="Gesuche"
          color={theme.palette.secondary.main}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          icon={<CalendarIcon fontSize="large" />}
          value={profile.completedSessions}
          label="Sessions"
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          icon={<StarIcon fontSize="large" />}
          value={Number(profile.averageRating.toFixed(1))}
          label="Rating"
          color={theme.palette.warning.main}
        />
      </Grid>
    </Grid>
  );
};

interface BioSectionProps {
  bio?: string;
  firstName: string;
}

const BioSection: React.FC<BioSectionProps> = ({ bio, firstName }) => (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" fontWeight="bold" gutterBottom>
      Über mich
    </Typography>
    {bio ? (
      <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
        {bio}
      </Typography>
    ) : (
      <Box
        sx={{
          py: 3,
          textAlign: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 1,
        }}
      >
        <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {firstName} hat noch keine Biografie eingetragen.
        </Typography>
      </Box>
    )}
  </Paper>
);

interface ExperienceEducationSectionProps {
  experience?: UserExperience[];
  education?: UserEducation[];
  firstName: string;
}

const formatDateRange = (startDate: string, endDate?: string, isCurrent?: boolean): string => {
  const start = new Date(startDate);
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const startYear = start.getFullYear();
  const startStr = `${startMonth}.${startYear}`;

  if (isCurrent || !endDate) {
    return `${startStr} - heute`;
  }

  const end = new Date(endDate);
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endYear = end.getFullYear();
  return `${startStr} - ${endMonth}.${endYear}`;
};

interface EmptyStatePlaceholderProps {
  icon: React.ReactNode;
  message: string;
}

const EmptyStatePlaceholder: React.FC<EmptyStatePlaceholderProps> = ({ icon, message }) => (
  <Box
    sx={{
      py: 2,
      px: 3,
      textAlign: 'center',
      backgroundColor: 'action.hover',
      borderRadius: 1,
    }}
  >
    <Box sx={{ color: 'text.disabled', mb: 0.5 }}>{icon}</Box>
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

const ExperienceEducationSection: React.FC<ExperienceEducationSectionProps> = ({
  experience,
  education,
  firstName,
}) => {
  const hasExperience = experience && experience.length > 0;
  const hasEducation = education && education.length > 0;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Erfahrung & Qualifikationen
      </Typography>

      {/* Berufserfahrung */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <WorkIcon color="primary" />
            <Typography fontWeight="medium">Berufserfahrung</Typography>
            {hasExperience ? (
              <Chip label={experience.length} size="small" sx={{ ml: 1, height: 20 }} />
            ) : null}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {hasExperience ? (
            <List disablePadding>
              {experience.map((exp) => (
                <ListItem key={exp.id} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <WorkIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="baseline">
                        <Typography fontWeight="medium">{exp.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {exp.company}
                        </Typography>
                        {exp.description ? (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {exp.description}
                          </Typography>
                        ) : null}
                      </>
                    }
                    slotProps={{ secondary: { component: 'div' } }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyStatePlaceholder
              icon={<WorkIcon />}
              message={`${firstName} hat noch keine Berufserfahrung eingetragen.`}
            />
          )}
        </AccordionDetails>
      </Accordion>

      {/* Ausbildung */}
      <Accordion defaultExpanded disableGutters elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <SchoolIcon color="secondary" />
            <Typography fontWeight="medium">Ausbildung</Typography>
            {hasEducation ? (
              <Chip label={education.length} size="small" sx={{ ml: 1, height: 20 }} />
            ) : null}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {hasEducation ? (
            <List disablePadding>
              {education.map((edu) => (
                <ListItem key={edu.id} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <SchoolIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="baseline">
                        <Typography fontWeight="medium">{edu.degree}</Typography>
                        {edu.graduationYear == null ? null : (
                          <Typography variant="caption" color="text.secondary">
                            {edu.graduationMonth == null
                              ? edu.graduationYear
                              : `${String(edu.graduationMonth).padStart(2, '0')}.${edu.graduationYear}`}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {edu.institution}
                        </Typography>
                        {edu.description ? (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {edu.description}
                          </Typography>
                        ) : null}
                      </>
                    }
                    slotProps={{ secondary: { component: 'div' } }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyStatePlaceholder
              icon={<SchoolIcon />}
              message={`${firstName} hat noch keine Ausbildung eingetragen.`}
            />
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();

  // Use centralized navigation with context
  const { contextualBreadcrumbs, navigateWithContext, navigationContext } = useNavigation();

  // Use the public profile hook
  const { profile, isLoading, error } = usePublicProfile(userId);

  // Navigation handlers
  const handleViewOffers = useCallback((): void => {
    if (userId) void navigate(`/skills?userId=${userId}&type=offer`);
  }, [navigate, userId]);

  const handleViewRequests = useCallback((): void => {
    if (userId) void navigate(`/skills?userId=${userId}&type=seek`);
  }, [navigate, userId]);

  const handleViewReviews = useCallback((): void => {
    if (userId && profile) {
      // Pass enriched navigation context so ReviewsPage shows correct breadcrumbs
      // Include profile info AND preserve skill context if we came from a skill
      void navigateWithContext(`/users/${userId}/reviews`, {
        ...navigationContext,
        from: 'profile',
        userId,
        userName: `${profile.firstName} ${profile.lastName}`,
      });
    }
  }, [navigateWithContext, userId, navigationContext, profile]);

  // Handler for breadcrumb navigation with context preservation
  const handleBreadcrumbClick = useCallback(
    (href: string, label: string) => {
      if (href === '/') {
        void navigateWithContext(href);
      } else if (href.startsWith('/skills/') && href !== '/skills') {
        // Navigating back to a skill - use 'home' as source so skill shows simple breadcrumbs
        // (Startseite > Skill Name) instead of complex chain
        void navigateWithContext(href, {
          from: 'home',
          skillName: label,
        });
      } else if (href === '/skills') {
        void navigateWithContext(href, { from: 'home' });
      } else {
        void navigateWithContext(href, navigationContext);
      }
    },
    [navigateWithContext, navigationContext]
  );

  // Render loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error ?? 'Profil nicht gefunden'}</Alert>
      </Container>
    );
  }

  // Render blocked state
  if (profile.isBlocked) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Dieses Profil ist nicht verfügbar.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* Breadcrumb Navigation - uses centralized useNavigation hook */}
      <Breadcrumbs sx={{ mb: 2 }}>
        {contextualBreadcrumbs.map((item, index) => {
          const isLast = index === contextualBreadcrumbs.length - 1;

          if (isLast || item.isActive === true) {
            return (
              <Typography key={item.label} color="text.primary">
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={item.label}
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => {
                if (item.href) {
                  handleBreadcrumbClick(item.href, item.label);
                }
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>

      {/* Header */}
      <ProfileHeader
        profile={profile}
        isMobile={isMobile}
        isAuthenticated={isAuthenticated}
        onReviewsClick={handleViewReviews}
      />

      {/* Stats */}
      <ProfileStats profile={profile} />

      {/* Bio */}
      <BioSection bio={profile.bio} firstName={profile.firstName} />

      {/* Experience & Education */}
      <ExperienceEducationSection
        experience={profile.experience}
        education={profile.education}
        firstName={profile.firstName}
      />

      {/* Skills Section - Links to SkillsPage with filters */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Skills
        </Typography>

        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            size="large"
            startIcon={<OfferIcon />}
            onClick={handleViewOffers}
            sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
          >
            {profile.skillsOffered} Angebote ansehen
          </Button>
          <Button
            variant="outlined"
            size="large"
            color="secondary"
            startIcon={<SchoolIcon />}
            onClick={handleViewRequests}
            sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
          >
            {profile.skillsLearned} Gesuche ansehen
          </Button>
        </Box>
      </Paper>

      {/* Reviews Section */}
      {userId ? <ReviewsSection userId={userId} totalReviews={profile.totalReviews} /> : null}
    </Container>
  );
};

export default PublicProfilePage;
