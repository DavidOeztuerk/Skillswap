import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  useTheme,
  useMediaQuery,
  Grid,
  Chip,
  Rating,
  Skeleton,
} from '@mui/material';
import {
  School as SchoolIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  VideoCall as VideoCallIcon,
  TrendingUp as TrendingIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import { useAuth } from '../hooks/useAuth';
import { withDefault } from '../utils/safeAccess';
import { trackSkillView, trackRegistrationClick } from '../utils/analytics';
import SEO from '../components/seo/SEO';
import { useSkills } from '../hooks/useSkills';

/**
 * Startseite der Anwendung
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const { skills, fetchAllSkills, isLoading: loadingSkills } = useSkills();

  useEffect(() => {
    fetchAllSkills();
  }, [fetchAllSkills]);

  const handleSkillClick = (skillId: string) => {
    trackSkillView(skillId, isAuthenticated);
    navigate(`/skills/${skillId}`);
  };

  const handleRegisterClick = (source: string) => {
    trackRegistrationClick(source);
    navigate('/auth/register');
  };

  // Features der Plattform
  const features = [
    {
      title: 'Lerne neue Fähigkeiten',
      description:
        'Entdecke eine Vielzahl von Skills und finde Lehrer, die dir dabei helfen, dich weiterzuentwickeln.',
      icon: <SchoolIcon fontSize="large" />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Teile dein Wissen',
      description:
        'Bringe anderen deine Fähigkeiten bei und hilf ihnen, sich zu verbessern.',
      icon: <SkillsIcon fontSize="large" />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Finde passende Lernpartner',
      description:
        'Unser intelligentes Matchmaking-System verbindet dich mit den besten Lehrern oder Schülern.',
      icon: <MatchmakingIcon fontSize="large" />,
      color: theme.palette.info.main,
    },
    {
      title: 'Videoanrufe & Online-Unterricht',
      description:
        'Halte Unterrichtsstunden bequem von zu Hause aus über unsere integrierte Videoanruf-Funktion.',
      icon: <VideoCallIcon fontSize="large" />,
      color: theme.palette.success.main,
    },
  ];

  return (
    <div>
      <SEO
        title="SkillSwap - Lerne und teile Fähigkeiten"
        description="Entdecke neue Fähigkeiten, teile dein Wissen und verbinde dich mit Lernenden und Lehrenden in unserer Community. Kostenlose Registrierung."
        keywords={['Skills lernen', 'Online-Unterricht', 'Skill Exchange', 'Weiterbildung', 'Lehrer finden', 'Wissen teilen']}
      />
      {/* Hero-Bereich */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container columns={12} spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="h2"
                component="h1"
                fontWeight="bold"
                gutterBottom
              >
                Entdecke neue Fähigkeiten und teile dein Wissen
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                SkillSwap ist eine Plattform, die Menschen verbindet, die
                Fähigkeiten lehren und lernen möchten
              </Typography>

              <Box
                sx={{
                  mt: 4,
                  display: 'flex',
                  gap: 2,
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                }}
              >
                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={() => navigate('/dashboard')}
                    sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
                  >
                    Zum Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      color="secondary"
                      onClick={() => handleRegisterClick('hero_section')}
                      sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
                    >
                      Jetzt registrieren
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/auth/login')}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: 'bold',
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Anmelden
                    </Button>
                  </>
                )}
              </Box>
            </Grid>

            {!isMobile && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    position: 'relative',
                    height: 400,
                    width: '100%',
                    bgcolor: 'background.paper',
                    borderRadius: 4,
                    boxShadow: 8,
                    overflow: 'hidden',
                  }}
                >
                  {/* Hier könnte ein Bild oder eine Animation eingefügt werden */}
                  <Box
                    sx={{
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'primary.main',
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold">
                      SkillSwap
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Featured Skills Bereich */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingIcon color="primary" fontSize="large" />
            <Typography variant="h3" component="h2" fontWeight="bold">
              Beliebte Skills
            </Typography>
          </Box>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(isAuthenticated ? '/skills' : '/auth/register')}
          >
            Alle Skills anzeigen
          </Button>
        </Box>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 800 }}
        >
          Entdecke die beliebtesten Skills unserer Community und finde deinen nächsten Lehrer
        </Typography>

        <Grid container columns={12} spacing={3}>
          {loadingSkills ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
                    <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Skeleton variant="rounded" width={80} height={24} />
                      <Skeleton variant="rounded" width={100} height={24} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : skills.length > 0 ? (
            skills.slice(0, 6).map((skill) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={skill.id}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => handleSkillClick(skill.id)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                      {skill.name}
                    </Typography>

                    {skill.ownerUserName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        von {skill.ownerUserName}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={skill.averageRating || 0} precision={0.5} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary">
                        ({skill.reviewCount || 0})
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {skill.description?.substring(0, 120)}
                      {skill.description?.length > 120 ? '...' : ''}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={skill.category?.name || 'Kategorie'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={skill.proficiencyLevel?.level || 'Level'}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkillClick(skill.id);
                      }}
                    >
                      Details ansehen
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={12}>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  Keine Skills gefunden. {!isAuthenticated && 'Registriere dich und erstelle den ersten Skill!'}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {!isAuthenticated && skills.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Bereit, deine Lernreise zu starten?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Registriere dich jetzt kostenlos und beginne mit dem Lernen
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => handleRegisterClick('featured_skills_section')}
              sx={{ px: 6, py: 1.5, fontWeight: 'bold' }}
            >
              Jetzt kostenlos registrieren
            </Button>
          </Box>
        )}
      </Container>

      <Divider sx={{ my: 4 }} />

      {/* Features-Bereich */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          fontWeight="bold"
        >
          Unsere Features
        </Typography>

        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 8, maxWidth: 800, mx: 'auto' }}
        >
          Entdecke, wie SkillSwap dir dabei helfen kann, neue Fähigkeiten zu
          erlernen oder dein Wissen mit anderen zu teilen.
        </Typography>

        <Grid container columns={12} spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    pt: 3,
                    pb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      bgcolor: `${feature.color}15`,
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    textAlign="center"
                    fontWeight="medium"
                  >
                    {feature.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    {feature.description}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() =>
                      navigate(isAuthenticated ? '/dashboard' : '/auth/register')
                    }
                  >
                    Mehr erfahren
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Aufruf zum Handeln */}
      <Box
        sx={{
          bgcolor: 'secondary.main',
          color: 'secondary.contrastText',
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h2"
            textAlign="center"
            gutterBottom
            fontWeight="bold"
          >
            Bereit, neue Fähigkeiten zu entdecken?
          </Typography>

          <Typography
            variant="h6"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.9 }}
          >
            Tritt noch heute der SkillSwap-Community bei und beginne deine
            Lernreise.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={() =>
                isAuthenticated ? navigate('/dashboard') : handleRegisterClick('cta_section')
              }
              sx={{ px: 6, py: 1.5, fontWeight: 'bold' }}
            >
              {withDefault(isAuthenticated, false) ? 'Zum Dashboard' : 'Jetzt starten'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', py: 4 }}>
        <Container maxWidth="lg">
          <Divider sx={{ mb: 4 }} />

          <Grid container columns={12} spacing={4}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                SkillSwap
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Entdecke, lerne und teile Fähigkeiten in unserer Community.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Über uns
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Datenschutz
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AGB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kontakt
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Kontakt
              </Typography>
              <Typography variant="body2" color="text.secondary">
                info@skillswap-plattform.de
              </Typography>
              <Typography variant="body2" color="text.secondary">
                +49 123 456789
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} SkillSwap. Alle Rechte vorbehalten.
            </Typography>
          </Box>
        </Container>
      </Box>
    </div>
  );
};

export default HomePage;
