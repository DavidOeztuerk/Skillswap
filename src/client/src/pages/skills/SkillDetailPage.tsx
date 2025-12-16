import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Rating,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ThumbUp as ThumbUpIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { LoadingButton } from '../../components/ui/LoadingButton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import MatchForm from '../../components/matchmaking/MatchForm';
import { useSkills } from '../../hooks/useSkills';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { useLoading } from '../../contexts/loadingContextHooks';
import { LoadingKeys } from '../../contexts/loadingContextValue';
import { useEmailVerificationContext } from '../../contexts/emailVerificationContextHook';
import type { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import type { MatchRequestDisplay } from '../../types/contracts/MatchmakingDisplay';
import SkillErrorBoundary from '../../components/error/SkillErrorBoundary';
import errorService from '../../services/errorService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { usePermissions } from '../../contexts/permissionContextHook';
import { Permissions } from '../../components/auth/permissions.constants';
import SEO from '../../components/seo/SEO';
import { trackMatchRequestClick } from '../../utils/analytics';

const SkillDetailPage: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const { hasPermission } = usePermissions();

  // Memoize permission checks for own skills
  const canUpdateOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.UPDATE_OWN),
    [hasPermission]
  );
  const canDeleteOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.DELETE_OWN),
    [hasPermission]
  );

  const { withLoading, isLoading } = useLoading();
  const {
    selectedSkill,
    userSkills,
    fetchSkillById,
    deleteSkill,
    rateSkill,
    endorseSkill,
    isLoading: skillsLoading,
    errorMessage,
    dismissError,
    isFavoriteSkill,
    addFavoriteSkill,
    removeFavoriteSkill,
  } = useSkills();

  // Local state - removed isBookmarked as we use the real favorites API now
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [endorseDialogOpen, setEndorseDialogOpen] = useState(false);
  const [matchFormOpen, setMatchFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(0);
  const [review, setReview] = useState('');
  const [endorseMessage, setEndorseMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);
  const {
    sendMatchRequest,
    outgoingRequests,
    loadOutgoingRequests,
    isLoading: isMatchmakingLoading,
    error: matchmakingError,
  } = useMatchmaking();

  const { needsVerification, openVerificationModal } = useEmailVerificationContext();

  // Load skill data
  useEffect(() => {
    if (skillId) {
      void withLoading(LoadingKeys.FETCH_DATA, async () => {
        errorService.addBreadcrumb('Loading skill details', 'navigation', { skillId });
        fetchSkillById(skillId);
        return Promise.resolve();
      });
    }
  }, [skillId, fetchSkillById, withLoading]);

  // Robust isOwner check - uses user.id (immediately available after login)
  // with fallback to userSkills (for offline/cache scenarios)
  const isOwner = useMemo(() => {
    if (!selectedSkill) return false;

    // Primary: Check via user.id (immediately available after login)
    if (user?.id && selectedSkill.userId) {
      return user.id === selectedSkill.userId;
    }

    // Fallback: Check via userSkills (for offline/cache scenarios)
    return userSkills.some((userSkill) => userSkill.id === selectedSkill.id);
  }, [selectedSkill, user, userSkills]);

  // Use refs to prevent double execution in StrictMode and redirect loops
  const hasOpenedMatchForm = useRef(false);
  const hasRedirectedOwnSkill = useRef(false);

  // Check for automatic match form opening (handles login redirect with ?showMatchForm=true)
  useEffect(() => {
    const shouldShowMatchForm = searchParams.get('showMatchForm') === 'true';

    if (!shouldShowMatchForm || !selectedSkill) return;

    // Wait until user is loaded after login redirect (important for isOwner check!)
    if (isAuthenticated && !user) return;

    // Case 1: Own skill - redirect to dashboard with toast
    if (isOwner) {
      // Guard against multiple redirects (setSearchParams triggers re-render before navigation completes)
      if (hasRedirectedOwnSkill.current) return;
      hasRedirectedOwnSkill.current = true;

      // Clean up URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showMatchForm');
      setSearchParams(newSearchParams, { replace: true });
      toast.info('Das ist dein eigener Skill - du wurdest zum Dashboard weitergeleitet.');
      void navigate('/dashboard', { replace: true });
      return;
    }

    // Case 2: Foreign skill - open match form
    if (!hasOpenedMatchForm.current) {
      hasOpenedMatchForm.current = true;

      // Clean up URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showMatchForm');
      setSearchParams(newSearchParams, { replace: true });

      console.debug('🚀 Auto-opening match form from URL parameter');
      queueMicrotask(() => {
        setMatchFormOpen(true);
      });
    }
  }, [
    selectedSkill,
    isOwner,
    isAuthenticated,
    user,
    searchParams,
    setSearchParams,
    toast,
    navigate,
  ]);

  const [cameFromMySkills, setCameFromMySkills] = useState(false);

  useEffect(() => {
    // Prüfe die Referrer-URL oder verwende eine andere Logik
    const { referrer } = document;
    const cameFromMy = referrer.includes('/skills/my-skills') || isOwner;
    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => {
      setCameFromMySkills(cameFromMy);
    });
  }, [isOwner]);

  // Handlers
  const handleBookmark = (): void => {
    if (!selectedSkill?.id) return;

    const isFav = isFavoriteSkill(selectedSkill.id);
    if (isFav) {
      errorService.addBreadcrumb('Removing skill from favorites', 'action', {
        skillId: selectedSkill.id,
      });
      removeFavoriteSkill(selectedSkill.id);
      setStatusMessage({
        text: 'Aus Favoriten entfernt',
        type: 'success',
      });
    } else {
      errorService.addBreadcrumb('Adding skill to favorites', 'action', {
        skillId: selectedSkill.id,
      });
      addFavoriteSkill(selectedSkill.id);
      setStatusMessage({
        text: 'Zu Favoriten hinzugefügt',
        type: 'success',
      });
    }
  };

  const handleShare = async (): Promise<void> => {
    if (selectedSkill) {
      try {
        errorService.addBreadcrumb('Sharing skill via native share', 'action', {
          skillId: selectedSkill.id,
        });
        await navigator.share({
          title: selectedSkill.name,
          text: selectedSkill.description,
          url: window.location.href,
        });
      } catch (err) {
        errorService.addBreadcrumb('Share cancelled by user', 'ui', { skillId: selectedSkill.id });
        console.debug('Share canceled', err);
      }
    } else {
      // Fallback: Copy to clipboard
      errorService.addBreadcrumb('Copying skill link to clipboard', 'action', {
        skillId: selectedSkill,
      });
      void navigator.clipboard.writeText(window.location.href);
      setStatusMessage({
        text: 'Link in Zwischenablage kopiert',
        type: 'success',
      });
    }
  };

  const handleRateSkill = (): void => {
    if (!skillId || rating === null || isOwner) return;

    errorService.addBreadcrumb('Rating skill', 'form', { skillId, rating });
    rateSkill(skillId, rating, review);
    errorService.addBreadcrumb('Skill rated successfully', 'form', { skillId, rating });
    setStatusMessage({
      text: 'Bewertung erfolgreich abgegeben',
      type: 'success',
    });
    setRatingDialogOpen(false);
    setRating(0);
    setReview('');
  };

  const handleEndorseSkill = (): void => {
    if (!skillId || isOwner) return;

    errorService.addBreadcrumb('Endorsing skill', 'form', { skillId });
    endorseSkill(skillId, endorseMessage);
    errorService.addBreadcrumb('Skill endorsed successfully', 'form', { skillId });
    setStatusMessage({
      text: 'Empfehlung erfolgreich abgegeben',
      type: 'success',
    });
    setEndorseDialogOpen(false);
    setEndorseMessage('');
  };

  const handleDeleteSkill = (): void => {
    if (!skillId || !isOwner) return;

    errorService.addBreadcrumb('Deleting skill', 'action', { skillId });
    deleteSkill(skillId);
    errorService.addBreadcrumb('Skill deleted successfully', 'action', { skillId });
    void navigate('/skills/my-skills');
  };

  const handleCreateMatch = async (): Promise<void> => {
    if (!selectedSkill) return;

    // Check authentication first - redirect guests to login
    if (!isAuthenticated) {
      errorService.addBreadcrumb(
        'Guest tried to create match - redirecting to login',
        'navigation',
        {
          skillId: selectedSkill.id,
        }
      );
      trackMatchRequestClick(selectedSkill.id, false);
      await navigate('/auth/login', {
        state: {
          from: location,
          action: 'createMatch',
          skillId: selectedSkill.id,
        },
      });
      return;
    }

    if (isOwner) {
      errorService.addBreadcrumb('User tried to match own skill', 'ui', {
        skillId: selectedSkill.id,
      });
      setStatusMessage({
        text: 'Du kannst kein Match mit deinem eigenen Skill erstellen',
        type: 'info',
      });
      return;
    }

    errorService.addBreadcrumb('Opening match form', 'ui', { skillId: selectedSkill.id });
    setMatchFormOpen(true);
  };

  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

  const handleMatchSubmit = (data: CreateMatchRequest): Promise<boolean> => {
    if (!selectedSkill) {
      errorService.addBreadcrumb('Match submit failed - no skill selected', 'error');
      setStatusMessage({
        text: 'Fehler: Kein Skill ausgewählt',
        type: 'error',
      });
      return Promise.resolve(false);
    }

    // Prevent double submission
    if (isSubmittingMatch) {
      console.warn('⚠️ Match request already being submitted');
      return Promise.resolve(false);
    }

    // Check if user already has a pending request for this skill
    const existingRequest = outgoingRequests.find(
      (req: MatchRequestDisplay) =>
        req.skillId === selectedSkill.id && (req.status === 'pending' || req.status === 'accepted')
    );

    if (existingRequest) {
      setStatusMessage({
        text: 'Sie haben bereits eine laufende Anfrage für diesen Skill',
        type: 'warning',
      });
      console.warn('⚠️ User already has a pending request for this skill');
      return Promise.resolve(false);
    }

    // Check if user email is verified
    if (needsVerification) {
      errorService.addBreadcrumb('Match request blocked - email not verified', 'validation', {
        skillId: selectedSkill.id,
      });
      setStatusMessage({
        text: 'Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse, um Match-Anfragen senden zu können.',
        type: 'warning',
      });
      openVerificationModal();
      return Promise.resolve(false);
    }

    setIsSubmittingMatch(true);

    errorService.addBreadcrumb('Submitting match request', 'form', {
      skillId: selectedSkill.id,
      targetUserId: selectedSkill.userId,
    });
    console.debug('🤝 Submitting match request from detail page:', data);
    console.debug('📋 Selected skill:', selectedSkill);

    const command: CreateMatchRequest = {
      skillId: selectedSkill.id,
      targetUserId: selectedSkill.userId,
      message: data.message,
      isSkillExchange: data.isSkillExchange,
      exchangeSkillId: data.exchangeSkillId,
      isMonetary: data.isMonetary,
      offeredAmount: data.offeredAmount,
      currency: data.currency,
      sessionDurationMinutes: data.sessionDurationMinutes,
      totalSessions: data.totalSessions,
      preferredDays: data.preferredDays,
      preferredTimes: data.preferredTimes,
      // Frontend-only fields
      description: data.description ?? 'Match-Anfrage von Skill-Detail-Seite',
      skillName: selectedSkill.name,
      exchangeSkillName: data.exchangeSkillName,
    };

    console.debug('📤 Sending CreateMatchRequestCommand:', command);

    // Fire-and-forget - Redux handles success/error state
    sendMatchRequest(command);

    errorService.addBreadcrumb('Match request created successfully', 'form', {
      skillId: selectedSkill.id,
    });
    setMatchFormOpen(false);
    setStatusMessage({
      text: 'Match-Anfrage erfolgreich erstellt! Sie werden zu Ihren Anfragen weitergeleitet...',
      type: 'success',
    });

    // Reload outgoing requests
    loadOutgoingRequests();

    // Navigate to match requests page after short delay to show success message
    setTimeout(() => {
      void navigate('/matchmaking?tab=1');
    }, 1500);

    setIsSubmittingMatch(false);
    return Promise.resolve(true);
  };

  const handleEdit = (): void => {
    if (!skillId || !isOwner) {
      errorService.addBreadcrumb('User tried to edit skill they do not own', 'ui', { skillId });
      setStatusMessage({
        text: 'Du kannst nur deine eigenen Skills bearbeiten',
        type: 'error',
      });
      return;
    }
    errorService.addBreadcrumb('Navigating to skill edit', 'navigation', { skillId });
    void navigate(`/skills/${skillId}/edit`);
  };

  const handleBack = (): void => {
    // Navigate back based on authentication status and ownership
    let targetRoute: string;

    if (!isAuthenticated) {
      // Unauthenticated users came from homepage
      targetRoute = '/';
    } else if (isOwner || cameFromMySkills) {
      targetRoute = '/skills/my-skills';
    } else {
      targetRoute = '/skills';
    }

    errorService.addBreadcrumb('Navigating back from skill detail', 'navigation', { targetRoute });
    void navigate(targetRoute);
  };

  // Loading state
  const isPageLoading = isLoading(LoadingKeys.FETCH_DATA) || (skillsLoading && !selectedSkill);

  if (isPageLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        {/* Navigation skeleton */}
        <Box sx={{ mb: 3 }}>
          <SkeletonLoader variant="text" width={80} height={32} sx={{ mb: 2 }} />
          <SkeletonLoader variant="text" width={300} height={20} />
        </Box>

        <Grid container spacing={3}>
          {/* Main content skeleton */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <SkeletonLoader variant="text" width={80} height={24} />
                    <SkeletonLoader variant="text" width={100} height={24} />
                  </Box>
                  <SkeletonLoader variant="text" width="70%" height={40} sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <SkeletonLoader variant="text" width={120} height={20} />
                    <SkeletonLoader variant="text" width={150} height={20} />
                    <SkeletonLoader variant="text" width={80} height={24} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <SkeletonLoader variant="text" width={40} height={40} />
                  <SkeletonLoader variant="text" width={40} height={40} />
                  <SkeletonLoader variant="text" width={40} height={40} />
                </Box>
              </Box>
              <SkeletonLoader variant="text" width="100%" height={60} sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <SkeletonLoader variant="text" width={120} height={36} />
                <SkeletonLoader variant="text" width={100} height={36} />
                <SkeletonLoader variant="text" width={110} height={36} />
              </Box>
            </Paper>
            <Paper sx={{ p: 3 }}>
              <SkeletonLoader variant="text" width={150} height={24} sx={{ mb: 2 }} />
              <SkeletonLoader variant="text" width="100%" height={100} />
            </Paper>
          </Grid>

          {/* Sidebar skeleton */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <SkeletonLoader variant="text" width={80} height={24} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'grey.300' }} />
                <Box>
                  <SkeletonLoader variant="text" width={120} height={20} />
                  <SkeletonLoader variant="text" width={100} height={16} />
                  <SkeletonLoader variant="text" width={80} height={16} />
                </Box>
              </Box>
              <SkeletonLoader variant="text" width="100%" height={36} />
            </Paper>
            <SkeletonLoader variant="profile" />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Error state
  if (errorMessage && !selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description={'Der angeforderte Skill existiert nicht oder ist nicht verfügbar.'}
          actionLabel="Zurück zu Skills"
          actionHandler={() => navigate('/skills')}
        />
      </Container>
    );
  }

  if (!selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description={'Der angeforderte Skill existiert nicht oder ist nicht verfügbar.'}
          actionLabel="Zurück zu Skills"
          actionHandler={() => navigate('/skills')}
        />
      </Container>
    );
  }

  const averageRating = selectedSkill.averageRating ?? 0;
  const reviewCount = selectedSkill.reviewCount ?? 0;

  const getOwnerName = (): string => {
    if (isOwner) return 'Du';
    if (selectedSkill.ownerUserName) return selectedSkill.ownerUserName;
    if (selectedSkill.ownerFirstName && selectedSkill.ownerLastName) {
      return `${selectedSkill.ownerFirstName} ${selectedSkill.ownerLastName}`;
    }
    return 'Skill-Besitzer';
  };

  const skillOwner = {
    name: getOwnerName(),
    memberSince: selectedSkill.ownerMemberSince
      ? new Date(selectedSkill.ownerMemberSince).getFullYear().toString()
      : '2024',
    rating: selectedSkill.ownerRating ?? 0,
    avatar: '',
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {selectedSkill.id && (
        <SEO
          title={`${selectedSkill.name} - ${selectedSkill.category.name || 'Skill'}`}
          description={
            selectedSkill.description ||
            `Lerne ${selectedSkill.name}. ${selectedSkill.proficiencyLevel.level || ''} Niveau.`
          }
          keywords={[
            selectedSkill.name,
            selectedSkill.category.name || '',
            selectedSkill.proficiencyLevel.level || '',
            'Skill lernen',
          ]}
          type="article"
        />
      )}
      {/* Status messages */}
      {statusMessage && (
        <Alert
          severity={statusMessage.type}
          onClose={() => {
            setStatusMessage(null);
          }}
          sx={{ mb: 2 }}
        >
          {statusMessage.text}
        </Alert>
      )}

      {/* Error messages */}
      {errorMessage && (
        <AlertMessage
          message={errorMessage ? [errorMessage] : ['Ein unerwarteter Fehler ist aufgetreten']}
          severity="error"
          onClose={dismissError}
        />
      )}

      {/* Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Zurück
        </Button>

        <Breadcrumbs aria-label="breadcrumb">
          <Link
            color="inherit"
            href={
              !isAuthenticated ? '/' : isOwner || cameFromMySkills ? '/skills/my-skills' : '/skills'
            }
            onClick={(e) => {
              e.preventDefault();
              handleBack();
            }}
            sx={{ cursor: 'pointer' }}
          >
            {!isAuthenticated
              ? 'Startseite'
              : isOwner || cameFromMySkills
                ? 'Meine Skills'
                : 'Alle Skills'}
          </Link>
          <Typography color="text.primary">{selectedSkill.name}</Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Skill header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={selectedSkill.isOffered ? 'Angeboten' : 'Gesucht'}
                    color={selectedSkill.isOffered ? 'success' : 'secondary'}
                    size="small"
                  />
                  {selectedSkill.category.id && (
                    <Chip label={selectedSkill.category.name} variant="outlined" size="small" />
                  )}
                  {isOwner && (
                    <Chip label="Mein Skill" color="primary" size="small" variant="outlined" />
                  )}
                </Box>

                <Typography variant="h4" component="h1" gutterBottom>
                  {selectedSkill.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Rating value={averageRating} readOnly precision={0.5} />
                  <Typography variant="body2" color="text.secondary">
                    {averageRating.toFixed(1)} ({reviewCount} Bewertungen)
                  </Typography>
                  {selectedSkill.proficiencyLevel.id && (
                    <Chip
                      label={selectedSkill.proficiencyLevel.level}
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip
                  title={
                    selectedSkill.id && isFavoriteSkill(selectedSkill.id)
                      ? 'Aus Favoriten entfernen'
                      : 'Zu Favoriten hinzufügen'
                  }
                >
                  <IconButton onClick={handleBookmark}>
                    {selectedSkill.id && isFavoriteSkill(selectedSkill.id) ? (
                      <BookmarkIcon />
                    ) : (
                      <BookmarkBorderIcon />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Teilen">
                  <IconButton onClick={handleShare}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
                {isOwner && canUpdateOwnSkill && (
                  <Tooltip title="Bearbeiten">
                    <IconButton onClick={handleEdit}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {isOwner && canDeleteOwnSkill && (
                  <Tooltip title="Löschen">
                    <IconButton
                      onClick={() => {
                        setDeleteDialogOpen(true);
                      }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedSkill.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {!isOwner && isAuthenticated && (
                <>
                  <LoadingButton
                    variant="contained"
                    color="primary"
                    startIcon={<MessageIcon />}
                    onClick={handleCreateMatch}
                    loading={isMatchmakingLoading}
                  >
                    {selectedSkill.isOffered ? 'Lernen anfragen' : 'Hilfe anbieten'}
                  </LoadingButton>
                  <Button
                    variant="outlined"
                    startIcon={<StarIcon />}
                    onClick={() => {
                      setRatingDialogOpen(true);
                    }}
                  >
                    Bewerten
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => {
                      setEndorseDialogOpen(true);
                    }}
                  >
                    Empfehlen
                  </Button>
                </>
              )}
              {isOwner && canUpdateOwnSkill && (
                <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
                  Skill bearbeiten
                </Button>
              )}
            </Box>
          </Paper>

          {/* Reviews section - placeholder for future implementation */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bewertungen ({reviewCount})
            </Typography>

            {reviewCount === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Noch keine Bewertungen vorhanden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isOwner
                    ? 'Dein Skill wurde noch nicht bewertet.'
                    : 'Sei der erste, der diesen Skill bewertet!'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Bewertungen werden hier angezeigt, sobald sie verfügbar sind.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {!isOwner && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Anbieter
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56 }} src={skillOwner.avatar}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">{skillOwner.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mitglied seit {skillOwner.memberSince}
                  </Typography>
                  <Rating value={skillOwner.rating} readOnly size="small" />
                </Box>
              </Box>
              <Button variant="outlined" fullWidth>
                Profil ansehen
              </Button>
            </Paper>
          )}

          {/* Skill info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Skill-Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Kategorie
              </Typography>
              <Typography variant="body1">
                {selectedSkill.category.name || 'Keine Kategorie'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fertigkeitsstufe
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1">
                  {selectedSkill.proficiencyLevel.level || 'Keine Angabe'}
                </Typography>
                {selectedSkill.proficiencyLevel.rank && selectedSkill.proficiencyLevel.rank > 0 && (
                  <Box sx={{ display: 'flex' }}>
                    {Array.from({ length: selectedSkill.proficiencyLevel.rank }, (_, i) => (
                      <StarIcon key={i} sx={{ fontSize: 16, color: 'primary.main' }} />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Typ
              </Typography>
              <Typography variant="body1">
                {selectedSkill.isOffered ? 'Wird angeboten' : 'Wird gesucht'}
              </Typography>
            </Box>
          </Paper>

          {!isOwner && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Interessiert?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedSkill.isOffered
                  ? 'Möchtest du diesen Skill lernen? Erstelle eine Match-Anfrage!'
                  : 'Kannst du bei diesem Skill helfen? Biete deine Hilfe an!'}
              </Typography>
              <LoadingButton
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCreateMatch}
                startIcon={<MessageIcon />}
                loading={isMatchmakingLoading}
              >
                {!isAuthenticated
                  ? 'Einloggen um Match anzufragen'
                  : selectedSkill.isOffered
                    ? 'Lernen anfragen'
                    : 'Hilfe anbieten'}
              </LoadingButton>
            </Paper>
          )}

          {isOwner && (canUpdateOwnSkill || canDeleteOwnSkill) && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dein Skill
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Dies ist dein eigener Skill. Du kannst ihn bearbeiten oder löschen.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {canUpdateOwnSkill && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleEdit}
                    startIcon={<EditIcon />}
                  >
                    Bearbeiten
                  </Button>
                )}
                {canDeleteOwnSkill && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => {
                      setDeleteDialogOpen(true);
                    }}
                    startIcon={<DeleteIcon />}
                  >
                    Löschen
                  </Button>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {!isOwner && (
        <Dialog
          open={ratingDialogOpen}
          onClose={() => {
            setRatingDialogOpen(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Skill bewerten</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography component="legend" gutterBottom>
                Bewertung
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => {
                  setRating(newValue);
                }}
                size="large"
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Kommentar (optional)"
              value={review}
              onChange={(e) => {
                setReview(e.target.value);
              }}
              placeholder="Teile deine Erfahrungen mit diesem Skill..."
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setRatingDialogOpen(false);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleRateSkill}
              variant="contained"
              disabled={rating === null || rating === 0}
            >
              Bewertung abgeben
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ✅ KORRIGIERT: Endorse Dialog nur für fremde Skills */}
      {!isOwner && (
        <Dialog
          open={endorseDialogOpen}
          onClose={() => {
            setEndorseDialogOpen(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Skill empfehlen</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Empfehlungstext (optional)"
              value={endorseMessage}
              onChange={(e) => {
                setEndorseMessage(e.target.value);
              }}
              placeholder="Warum empfiehlst du diesen Skill?"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEndorseDialogOpen(false);
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleEndorseSkill} variant="contained">
              Empfehlen
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {selectedSkill.id && !isOwner && (
        <MatchForm
          open={matchFormOpen}
          onClose={() => {
            setMatchFormOpen(false);
          }}
          onSubmit={handleMatchSubmit}
          skill={selectedSkill}
          targetUserId={selectedSkill.userId}
          targetUserName={getOwnerName()}
          isLoading={isMatchmakingLoading}
          error={matchmakingError}
        />
      )}

      {isOwner && canDeleteOwnSkill && (
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Skill löschen"
          message={`Bist du sicher, dass du "${selectedSkill.name}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`}
          confirmLabel="Löschen"
          cancelLabel="Abbrechen"
          confirmColor="error"
          onConfirm={handleDeleteSkill}
          onCancel={() => {
            setDeleteDialogOpen(false);
          }}
        />
      )}
    </Container>
  );
};

const WrappedSkillDetailPage: React.FC = () => (
  <SkillErrorBoundary>
    <SkillDetailPage />
  </SkillErrorBoundary>
);

export default WrappedSkillDetailPage;
