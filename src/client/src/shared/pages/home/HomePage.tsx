import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School as SchoolIcon,
  EmojiObjects as SkillsIcon,
  People as MatchmakingIcon,
  VideoCall as VideoCallIcon,
  TrendingUp as TrendingIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
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
import { useAppSelector } from '../../../core/store/hooks';
import useAuth from '../../../features/auth/hooks/useAuth';
import useSkills from '../../../features/skills/hooks/useSkills';
import { selectFeaturedSkills } from '../../../features/skills/store/skillsSelectors';
import { mixins } from '../../../styles/mixins';
import SEO from '../../components/seo/Seo';
import { trackSkillView, trackRegistrationClick } from '../../utils/analytics';
import {
  heroSectionSx,
  heroButtonContainerSx,
  primaryButtonSx,
  outlineButtonLightSx,
  heroImageContainerSx,
  heroImagePlaceholderSx,
  sectionContainerSx,
  sectionHeaderSx,
  sectionTitleBoxSx,
  subtitleSx,
  skillCardSx,
  skillCardContentSx,
  ratingBoxSx,
  chipContainerSx,
  cardActionsSx,
  emptyStateSx,
  ctaBoxSx,
  dividerSx,
  featuresSubtitleSx,
  featureCardSx,
  featureIconContainerSx,
  featureActionsSx,
  ctaSectionSx,
  ctaButtonContainerSx,
  footerSx,
  footerDividerSx,
  footerLinksBoxSx,
  footerCopyrightSx,
} from './homeStyles';

/**
 * Startseite der Anwendung
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const { fetchAllSkills, isLoading: loadingSkills } = useSkills();
  const featuredSkills = useAppSelector(selectFeaturedSkills);

  useEffect(() => {
    fetchAllSkills();
  }, [fetchAllSkills]);

  const handleSkillClick = async (skillId: string): Promise<void> => {
    trackSkillView(skillId, isAuthenticated);
    await navigate(`/skills/${skillId}`);
  };

  const handleRegisterClick = async (source: string): Promise<void> => {
    trackRegistrationClick(source);
    await navigate('/auth/register');
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
      description: 'Bringe anderen deine Fähigkeiten bei und hilf ihnen, sich zu verbessern.',
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
        keywords={[
          'Skills lernen',
          'Online-Unterricht',
          'Skill Exchange',
          'Weiterbildung',
          'Lehrer finden',
          'Wissen teilen',
        ]}
      />
      {/* Hero-Bereich */}
      <Box sx={heroSectionSx}>
        <Container maxWidth="lg">
          <Grid container columns={12} spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                Entdecke neue Fähigkeiten und teile dein Wissen
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                SkillSwap ist eine Plattform, die Menschen verbindet, die Fähigkeiten lehren und
                lernen möchten
              </Typography>

              <Box sx={heroButtonContainerSx}>
                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={() => navigate('/dashboard')}
                    sx={primaryButtonSx}
                  >
                    Zum Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      color="secondary"
                      onClick={async () => {
                        await handleRegisterClick('hero_section');
                      }}
                      sx={primaryButtonSx}
                    >
                      Jetzt registrieren
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/auth/login')}
                      sx={outlineButtonLightSx}
                    >
                      Anmelden
                    </Button>
                  </>
                )}
              </Box>
            </Grid>

            {!isMobile && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Box sx={heroImageContainerSx}>
                  {/* Hier könnte ein Bild oder eine Animation eingefügt werden */}
                  <Box sx={heroImagePlaceholderSx}>
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
      <Container maxWidth="lg" sx={sectionContainerSx}>
        <Box sx={sectionHeaderSx}>
          <Box sx={sectionTitleBoxSx}>
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

        <Typography variant="h6" color="text.secondary" sx={subtitleSx}>
          Entdecke die beliebtesten Skills unserer Community und finde deinen nächsten Lehrer
        </Typography>

        <Grid container columns={12} spacing={3}>
          {loadingSkills ? (
            <>
              {Array.from({ length: 6 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
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
              ))}
            </>
          ) : null}
          {!loadingSkills && featuredSkills.length > 0 ? (
            <>
              {featuredSkills.map((skill) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={skill.id}>
                  <Card
                    elevation={2}
                    sx={skillCardSx}
                    onClick={async () => {
                      await handleSkillClick(skill.id);
                    }}
                  >
                    <CardContent sx={skillCardContentSx}>
                      <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                        {skill.name}
                      </Typography>

                      {skill.ownerUserName ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          von {skill.ownerUserName}
                        </Typography>
                      ) : null}

                      <Box sx={ratingBoxSx}>
                        <Rating
                          value={skill.averageRating ?? 0}
                          precision={0.5}
                          size="small"
                          readOnly
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({skill.reviewCount ?? 0})
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {skill.description.slice(0, 120)}
                        {skill.description.length > 120 ? '...' : ''}
                      </Typography>

                      <Box sx={chipContainerSx}>
                        <Chip
                          label={skill.category.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={skill.proficiencyLevel.level}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>

                    <CardActions sx={cardActionsSx}>
                      <Button
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleSkillClick(skill.id);
                        }}
                      >
                        Details ansehen
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </>
          ) : null}
          {!loadingSkills && featuredSkills.length === 0 ? (
            <Grid size={12}>
              <Box sx={emptyStateSx}>
                <Typography variant="h6" color="text.secondary">
                  Keine Skills gefunden.{' '}
                  {isAuthenticated ? null : 'Registriere dich und erstelle den ersten Skill!'}
                </Typography>
              </Box>
            </Grid>
          ) : null}
        </Grid>

        {!isAuthenticated && featuredSkills.length > 0 && (
          <Box sx={ctaBoxSx}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Bereit, deine Lernreise zu starten?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Registriere dich jetzt kostenlos und beginne mit dem Lernen
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={async () => {
                await handleRegisterClick('featured_skills_section');
              }}
              sx={primaryButtonSx}
            >
              Jetzt kostenlos registrieren
            </Button>
          </Box>
        )}
      </Container>

      <Divider sx={dividerSx} />

      {/* Features-Bereich */}
      <Container maxWidth="lg" sx={sectionContainerSx}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom fontWeight="bold">
          Unsere Features
        </Typography>

        <Typography variant="h6" textAlign="center" color="text.secondary" sx={featuresSubtitleSx}>
          Entdecke, wie SkillSwap dir dabei helfen kann, neue Fähigkeiten zu erlernen oder dein
          Wissen mit anderen zu teilen.
        </Typography>

        <Grid container columns={12} spacing={4}>
          {features.map((feature) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.title}>
              <Card elevation={2} sx={featureCardSx}>
                <Box sx={featureIconContainerSx}>
                  <Box
                    sx={{
                      ...mixins.flexCenter,
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

                <CardContent sx={skillCardContentSx}>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    textAlign="center"
                    fontWeight="medium"
                  >
                    {feature.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {feature.description}
                  </Typography>
                </CardContent>

                <CardActions sx={featureActionsSx}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth/register')}
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
      <Box sx={ctaSectionSx}>
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" textAlign="center" gutterBottom fontWeight="bold">
            Bereit, neue Fähigkeiten zu entdecken?
          </Typography>

          <Typography variant="h6" textAlign="center" sx={{ mb: 4, opacity: 0.9 }}>
            Tritt noch heute der SkillSwap-Community bei und beginne deine Lernreise.
          </Typography>

          <Box sx={ctaButtonContainerSx}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={async () => {
                if (isAuthenticated) {
                  await navigate('/dashboard');
                } else {
                  await handleRegisterClick('cta_section');
                }
              }}
              sx={primaryButtonSx}
            >
              {isAuthenticated ? 'Zum Dashboard' : 'Jetzt starten'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={footerSx}>
        <Container maxWidth="lg">
          <Divider sx={footerDividerSx} />

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
              <Box sx={footerLinksBoxSx}>
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

          <Box sx={footerCopyrightSx}>
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
