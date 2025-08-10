import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { LoadingButton } from '../../components/common/LoadingButton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import MatchForm from '../../components/matchmaking/MatchForm';
import { useSkills } from '../../hooks/useSkills';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { useLoading, LoadingKeys } from '../../contexts/LoadingContext';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { useAuth } from '../../hooks/useAuth';
import SkillErrorBoundary from '../../components/error/SkillErrorBoundary';
import errorService from '../../services/errorService';
// import { useUserById } from '../../hooks/useUserById';

const SkillDetailPage: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();
  const { withLoading, isLoading } = useLoading();
  const {
    selectedSkill,
    userSkills, // ✅ HINZUGEFÜGT: Um zu prüfen ob Skill in userSkills ist
    fetchSkillById,
    deleteSkill,
    rateSkill,
    endorseSkill,
    isLoading: skillsLoading,
    error,
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
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const { sendMatchRequest, isLoading: isMatchmakingLoading } =
    useMatchmaking();
  // const { user } = useUserById(selectedSkill?.userId);

  // Load skill data
  useEffect(() => {
    if (skillId) {
      withLoading(LoadingKeys.FETCH_DATA, async () => {
        errorService.addBreadcrumb('Loading skill details', 'navigation', { skillId });
        console.log('🎯 Loading skill details for ID:', skillId);
        await fetchSkillById(skillId);
      });
    }
  }, [skillId, fetchSkillById, withLoading]);

  // ✅ KORRIGIERTE OWNERSHIP-LOGIK: Prüft ob Skill in userSkills ist
  const isOwner =
    selectedSkill &&
    userSkills?.some((userSkill) => userSkill.id === selectedSkill.id);

  // Check for automatic match form opening
  useEffect(() => {
    const shouldShowMatchForm = searchParams.get('showMatchForm') === 'true';
    if (shouldShowMatchForm && selectedSkill && !isOwner) {
      console.log('🚀 Auto-opening match form from URL parameter');
      setMatchFormOpen(true);
      // Clean up URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showMatchForm');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [selectedSkill, isOwner, searchParams, setSearchParams]);

  // ✅ HINZUGEFÜGT: Bestimme von welcher Seite der User kam
  const [cameFromMySkills, setCameFromMySkills] = useState(false);

  useEffect(() => {
    // Prüfe die Referrer-URL oder verwende eine andere Logik
    const referrer = document.referrer;
    const cameFromMy =
      referrer?.includes('/skills/my-skills') || Boolean(isOwner);
    setCameFromMySkills(cameFromMy);
  }, [isOwner]);

  // Handlers
  const handleBookmark = async () => {
    if (!selectedSkill?.id) return;
    
    const isFav = isFavoriteSkill(selectedSkill.id);
    try {
      if (isFav) {
        errorService.addBreadcrumb('Removing skill from favorites', 'action', { skillId: selectedSkill.id });
        await removeFavoriteSkill(selectedSkill.id);
        setStatusMessage({
          text: 'Aus Favoriten entfernt',
          type: 'success',
        });
      } else {
        errorService.addBreadcrumb('Adding skill to favorites', 'action', { skillId: selectedSkill.id });
        await addFavoriteSkill(selectedSkill.id);
        setStatusMessage({
          text: 'Zu Favoriten hinzugefügt',
          type: 'success',
        });
      }
    } catch (error) {
      errorService.addBreadcrumb('Error toggling favorite', 'error', { skillId: selectedSkill.id, error: error instanceof Error ? error.message : 'Unknown error' });
      setStatusMessage({
        text: 'Fehler beim Aktualisieren der Favoriten',
        type: 'error',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && selectedSkill) {
      try {
        errorService.addBreadcrumb('Sharing skill via native share', 'action', { skillId: selectedSkill.id });
        await navigator.share({
          title: selectedSkill.name,
          text: selectedSkill.description,
          url: window.location.href,
        });
      } catch (error) {
        errorService.addBreadcrumb('Share cancelled by user', 'ui', { skillId: selectedSkill.id });
        console.log('Share canceled', error);
      }
    } else {
      // Fallback: Copy to clipboard
      errorService.addBreadcrumb('Copying skill link to clipboard', 'action', { skillId: selectedSkill?.id });
      navigator.clipboard.writeText(window.location.href);
      setStatusMessage({
        text: 'Link in Zwischenablage kopiert',
        type: 'success',
      });
    }
  };

  const handleRateSkill = async () => {
    if (!skillId || rating === null || isOwner) return;

    try {
      errorService.addBreadcrumb('Rating skill', 'form', { skillId, rating });
      const success = await rateSkill(skillId, rating, review);
      if (success) {
        errorService.addBreadcrumb('Skill rated successfully', 'form', { skillId, rating });
        setStatusMessage({
          text: 'Bewertung erfolgreich abgegeben',
          type: 'success',
        });
        setRatingDialogOpen(false);
        setRating(0);
        setReview('');
        // In real app: reload skill data to get updated rating
      }
    } catch (error) {
      errorService.addBreadcrumb('Error rating skill', 'error', { skillId, error: error instanceof Error ? error.message : 'Unknown error' });
      setStatusMessage({
        text: 'Fehler beim Bewerten',
        type: 'error',
      });
    }
  };

  const handleEndorseSkill = async () => {
    if (!skillId || isOwner) return;

    try {
      errorService.addBreadcrumb('Endorsing skill', 'form', { skillId });
      const success = await endorseSkill(skillId, endorseMessage);
      if (success) {
        errorService.addBreadcrumb('Skill endorsed successfully', 'form', { skillId });
        setStatusMessage({
          text: 'Empfehlung erfolgreich abgegeben',
          type: 'success',
        });
        setEndorseDialogOpen(false);
        setEndorseMessage('');
      }
    } catch (error) {
      errorService.addBreadcrumb('Error endorsing skill', 'error', { skillId, error: error instanceof Error ? error.message : 'Unknown error' });
      setStatusMessage({
        text: 'Fehler beim Empfehlen',
        type: 'error',
      });
    }
  };

  const handleDeleteSkill = async () => {
    if (!skillId || !isOwner) return;

    try {
      errorService.addBreadcrumb('Deleting skill', 'action', { skillId });
      const success = await deleteSkill(skillId);
      if (success) {
        errorService.addBreadcrumb('Skill deleted successfully', 'action', { skillId });
        navigate('/skills/my-skills');
      }
    } catch (error) {
      errorService.addBreadcrumb('Error deleting skill', 'error', { skillId, error: error instanceof Error ? error.message : 'Unknown error' });
      setStatusMessage({
        text: 'Fehler beim Löschen',
        type: 'error',
      });
    }
  };

  const handleCreateMatch = () => {
    if (!selectedSkill) return;

    if (isOwner) {
      errorService.addBreadcrumb('User tried to match own skill', 'ui', { skillId: selectedSkill.id });
      setStatusMessage({
        text: 'Du kannst kein Match mit deinem eigenen Skill erstellen',
        type: 'info',
      });
      return;
    }

    errorService.addBreadcrumb('Opening match form', 'ui', { skillId: selectedSkill.id });
    setMatchFormOpen(true);
  };

  const handleMatchSubmit = async (data: CreateMatchRequest) => {
    if (!selectedSkill) {
      errorService.addBreadcrumb('Match submit failed - no skill selected', 'error');
      setStatusMessage({
        text: 'Fehler: Kein Skill ausgewählt',
        type: 'error',
      });
      return;
    }

    try {
      errorService.addBreadcrumb('Submitting match request', 'form', { skillId: selectedSkill.id, targetUserId: selectedSkill.userId });
      console.log('🤝 Submitting match request from detail page:', data);
      console.log('📋 Selected skill:', selectedSkill);

      const command: CreateMatchRequest = {
        skillId: selectedSkill.id,
        description: data.description || 'Match-Anfrage von Skill-Detail-Seite',
        message: data.message || 'Ich bin interessiert an diesem Skill!',
        targetUserId: selectedSkill.userId, 
        skillName: selectedSkill.name, 
      };

      console.log('📤 Sending CreateMatchRequestCommand:', command);

      const success = await sendMatchRequest(command);

      if (success) {
        errorService.addBreadcrumb('Match request created successfully', 'form', { skillId: selectedSkill.id });
        setMatchFormOpen(false);
        setStatusMessage({
          text: 'Match-Anfrage erfolgreich erstellt',
          type: 'success',
        });
      } else {
        errorService.addBreadcrumb('Match request creation failed', 'error', { skillId: selectedSkill.id });
        setStatusMessage({
          text: 'Fehler beim Erstellen der Match-Anfrage',
          type: 'error',
        });
      }
    } catch (error) {
      errorService.addBreadcrumb('Error submitting match request', 'error', { skillId: selectedSkill.id, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('❌ Match submission error:', error);
      setStatusMessage({
        text: 'Fehler beim Erstellen der Match-Anfrage',
        type: 'error',
      });
    }
  };

  const handleEdit = () => {
    if (!skillId || !isOwner) {
      errorService.addBreadcrumb('User tried to edit skill they do not own', 'ui', { skillId });
      setStatusMessage({
        text: 'Du kannst nur deine eigenen Skills bearbeiten',
        type: 'error',
      });
      return;
    }
    errorService.addBreadcrumb('Navigating to skill edit', 'navigation', { skillId });
    navigate(`/skills/${skillId}/edit`);
  };

  const handleBack = () => {
    // Navigate back to the appropriate skills page based on ownership
    const targetRoute = (isOwner || cameFromMySkills) ? '/skills/my-skills' : '/skills';
    errorService.addBreadcrumb('Navigating back from skill detail', 'navigation', { targetRoute });
    if (isOwner || cameFromMySkills) {
      navigate('/skills/my-skills');
    } else {
      navigate('/skills');
    }
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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
  if (error && !selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description={"Der angeforderte Skill existiert nicht oder ist nicht verfügbar."}
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
          description={"Der angeforderte Skill existiert nicht oder ist nicht verfügbar."}
          actionLabel="Zurück zu Skills"
          actionHandler={() => navigate('/skills')}
        />
      </Container>
    );
  }

  // Mock data for demonstration - in real app, this would come from API
  const averageRating = 4.5;
  const reviewCount = 0; // Would come from API
  const skillOwner = {
    name: isOwner ? 'Du' : 'Skill-Besitzer', // ✅ KORRIGIERT: Zeige "Du" für eigene Skills
    memberSince: '2023',
    rating: 4.8,
    avatar: '',
  };

  console.log('🔍 SkillDetailPage Debug:', {
    skillId,
    isOwner,
    selectedSkillId: selectedSkill?.id,
    userSkillsCount: userSkills?.length,
    cameFromMySkills,
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {/* Status messages */}
      {statusMessage && (
        <Alert
          severity={statusMessage.type}
          onClose={() => setStatusMessage(null)}
          sx={{ mb: 2 }}
        >
          {statusMessage.text}
        </Alert>
      )}

      {/* Error messages */}
      {error && (
        <AlertMessage
          message={error.message ? [error.message] : ['Ein unerwarteter Fehler ist aufgetreten']}
          severity="error"
          onClose={dismissError}
        />
      )}

      {/* Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Zurück
        </Button>

        <Breadcrumbs aria-label="breadcrumb">
          <Link
            color="inherit"
            href={isOwner || cameFromMySkills ? '/skills/my-skills' : '/skills'}
            onClick={(e) => {
              e.preventDefault();
              navigate(
                isOwner || cameFromMySkills ? '/skills/my-skills' : '/skills'
              );
            }}
            sx={{ cursor: 'pointer' }}
          >
            {isOwner || cameFromMySkills ? 'Meine Skills' : 'Alle Skills'}
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
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Chip
                    label={selectedSkill.isOffered ? 'Angeboten' : 'Gesucht'}
                    color={selectedSkill.isOffered ? 'success' : 'secondary'}
                    size="small"
                  />
                  {selectedSkill.category && (
                    <Chip
                      label={selectedSkill.category.name}
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {isOwner && (
                    <Chip
                      label="Mein Skill"
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Typography variant="h4" component="h1" gutterBottom>
                  {selectedSkill.name}
                </Typography>

                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Rating value={averageRating} readOnly precision={0.5} />
                  <Typography variant="body2" color="text.secondary">
                    {averageRating.toFixed(1)} ({reviewCount} Bewertungen)
                  </Typography>
                  {selectedSkill.proficiencyLevel && (
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
                    selectedSkill && isFavoriteSkill(selectedSkill.id)
                      ? 'Aus Favoriten entfernen'
                      : 'Zu Favoriten hinzufügen'
                  }
                >
                  <IconButton onClick={handleBookmark}>
                    {selectedSkill && isFavoriteSkill(selectedSkill.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Teilen">
                  <IconButton onClick={handleShare}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
                {/* ✅ KORRIGIERT: Edit/Delete nur für Owner */}
                {isOwner && (
                  <>
                    <Tooltip title="Bearbeiten">
                      <IconButton onClick={handleEdit}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton
                        onClick={() => setDeleteDialogOpen(true)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="body1" paragraph>
              {selectedSkill.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* ✅ KORRIGIERTE Action buttons - basierend auf Ownership */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {!isOwner && (
                <>
                  <LoadingButton
                    variant="contained"
                    color="primary"
                    startIcon={<MessageIcon />}
                    onClick={handleCreateMatch}
                    loading={isMatchmakingLoading}
                  >
                    {selectedSkill.isOffered
                      ? 'Lernen anfragen'
                      : 'Hilfe anbieten'}
                  </LoadingButton>
                  <Button
                    variant="outlined"
                    startIcon={<StarIcon />}
                    onClick={() => setRatingDialogOpen(true)}
                  >
                    Bewerten
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => setEndorseDialogOpen(true)}
                  >
                    Empfehlen
                  </Button>
                </>
              )}
              {isOwner && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
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
                <SchoolIcon
                  sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                />
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
          {/* ✅ KORRIGIERT: Owner info nur für fremde Skills */}
          {!isOwner && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Anbieter
              </Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
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
                {selectedSkill.category?.name || 'Keine Kategorie'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fertigkeitsstufe
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1">
                  {selectedSkill.proficiencyLevel?.level || 'Keine Angabe'}
                </Typography>
                {selectedSkill.proficiencyLevel?.rank && (
                  <Box sx={{ display: 'flex' }}>
                    {[...Array(selectedSkill.proficiencyLevel.rank)].map(
                      (_, i) => (
                        <StarIcon
                          key={i}
                          sx={{ fontSize: 16, color: 'primary.main' }}
                        />
                      )
                    )}
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

          {/* ✅ KORRIGIERT: Action info nur für fremde Skills */}
          {!isOwner && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Interessiert?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
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
                {selectedSkill.isOffered
                  ? 'Lernen anfragen'
                  : 'Hilfe anbieten'}
              </LoadingButton>
            </Paper>
          )}

          {/* ✅ HINZUGEFÜGT: Owner-spezifische Sidebar für eigene Skills */}
          {isOwner && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dein Skill
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Dies ist dein eigener Skill. Du kannst ihn bearbeiten oder
                löschen.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleEdit}
                  startIcon={<EditIcon />}
                >
                  Bearbeiten
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setDeleteDialogOpen(true)}
                  startIcon={<DeleteIcon />}
                >
                  Löschen
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* ✅ KORRIGIERT: Rating Dialog nur für fremde Skills */}
      {!isOwner && (
        <Dialog
          open={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
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
                onChange={(_, newValue) => setRating(newValue)}
                size="large"
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Kommentar (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Teile deine Erfahrungen mit diesem Skill..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRatingDialogOpen(false)}>
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
          onClose={() => setEndorseDialogOpen(false)}
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
              onChange={(e) => setEndorseMessage(e.target.value)}
              placeholder="Warum empfiehlst du diesen Skill?"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEndorseDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEndorseSkill} variant="contained">
              Empfehlen
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ✅ KORRIGIERT: Match Form nur für fremde Skills */}
      {selectedSkill && !isOwner && (
        <MatchForm
          open={matchFormOpen}
          onClose={() => setMatchFormOpen(false)}
          onSubmit={handleMatchSubmit}
          skill={selectedSkill}
          targetUserId={selectedSkill.userId} // ✅ VEREINFACHT: Direkt userId aus Skill
          targetUserName={user?.userName || user?.firstName || 'Skill-Besitzer'} // ✅ Optional: Name für Anzeige
          isLoading={isMatchmakingLoading}
        />
      )}

      {/* ✅ KORRIGIERT: Delete Confirmation nur für Owner */}
      {isOwner && (
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Skill löschen"
          message={`Bist du sicher, dass du "${selectedSkill?.name}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`}
          confirmLabel="Löschen"
          cancelLabel="Abbrechen"
          confirmColor="error"
          onConfirm={handleDeleteSkill}
          onCancel={() => setDeleteDialogOpen(false)}
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
