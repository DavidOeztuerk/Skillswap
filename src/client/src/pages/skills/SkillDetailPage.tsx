import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import MatchForm from '../../components/matchmaking/MatchForm';
import { useSkills } from '../../hooks/useSkills';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { useUserById } from '../../hooks/useUserById';
import { User } from '../../types/models/User';

const SkillDetailPage: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();

  // const { user } = useAuth(); // ✅ ENTFERNT: wird nicht verwendet
  const {
    selectedSkill,
    userSkills, // ✅ HINZUGEFÜGT: Um zu prüfen ob Skill in userSkills ist
    fetchSkillById,
    deleteSkill,
    rateSkill,
    endorseSkill,
    isLoading,
    error,
    dismissError,
  } = useSkills();

  // Local state
  const [isBookmarked, setIsBookmarked] = useState(false);
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
  const { user } = useUserById(selectedSkill?.userId);

  // Load skill data
  useEffect(() => {
    if (skillId) {
      console.log('🎯 Loading skill details for ID:', skillId);
      fetchSkillById(skillId);
    }
  }, [skillId, fetchSkillById]);

  // ✅ KORRIGIERTE OWNERSHIP-LOGIK: Prüft ob Skill in userSkills ist
  const isOwner =
    selectedSkill &&
    userSkills.some((userSkill) => userSkill.id === selectedSkill.id);

  // ✅ HINZUGEFÜGT: Bestimme von welcher Seite der User kam
  const [cameFromMySkills, setCameFromMySkills] = useState(false);

  useEffect(() => {
    // Prüfe die Referrer-URL oder verwende eine andere Logik
    const referrer = document.referrer;
    const cameFromMy =
      referrer.includes('/skills/my-skills') || Boolean(isOwner);
    setCameFromMySkills(cameFromMy);
  }, [isOwner]);

  // Handlers
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    setStatusMessage({
      text: isBookmarked
        ? 'Aus Favoriten entfernt'
        : 'Zu Favoriten hinzugefügt',
      type: 'success',
    });
  };

  const handleShare = async () => {
    if (navigator.share && selectedSkill) {
      try {
        await navigator.share({
          title: selectedSkill.name,
          text: selectedSkill.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share canceled', error);
      }
    } else {
      // Fallback: Copy to clipboard
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
      const success = await rateSkill(skillId, rating, review);
      if (success) {
        setStatusMessage({
          text: 'Bewertung erfolgreich abgegeben',
          type: 'success',
        });
        setRatingDialogOpen(false);
        setRating(0);
        setReview('');
        // In real app: reload skill data to get updated rating
      }
    } catch {
      setStatusMessage({
        text: 'Fehler beim Bewerten',
        type: 'error',
      });
    }
  };

  const handleEndorseSkill = async () => {
    if (!skillId || isOwner) return;

    try {
      const success = await endorseSkill(skillId, endorseMessage);
      if (success) {
        setStatusMessage({
          text: 'Empfehlung erfolgreich abgegeben',
          type: 'success',
        });
        setEndorseDialogOpen(false);
        setEndorseMessage('');
      }
    } catch {
      setStatusMessage({
        text: 'Fehler beim Empfehlen',
        type: 'error',
      });
    }
  };

  const handleDeleteSkill = async () => {
    if (!skillId || !isOwner) return;

    try {
      const success = await deleteSkill(skillId);
      if (success) {
        navigate('/skills/my-skills');
      }
    } catch {
      setStatusMessage({
        text: 'Fehler beim Löschen',
        type: 'error',
      });
    }
  };

  const handleCreateMatch = () => {
    if (!selectedSkill) return;

    if (isOwner) {
      setStatusMessage({
        text: 'Du kannst kein Match mit deinem eigenen Skill erstellen',
        type: 'info',
      });
      return;
    }

    setMatchFormOpen(true);
  };

  const handleMatchSubmit = async (data: CreateMatchRequest) => {
    if (!selectedSkill) {
      setStatusMessage({
        text: 'Fehler: Kein Skill ausgewählt',
        type: 'error',
      });
      return;
    }

    try {
      console.log('🤝 Submitting match request from detail page:', data);
      console.log('📋 Selected skill:', selectedSkill);

      // ✅ Konvertiere zu CreateMatchRequestCommand
      const command: CreateMatchRequest = {
        targetUserId: selectedSkill.userId, // ✅ User-ID vom Skill-Besitzer!
        skillId: selectedSkill.id,
        message: data.message || 'Ich bin interessiert an diesem Skill!',
        isLearningMode: selectedSkill.isOffering, // ✅ Wenn Skill angeboten wird, will ich lernen
      };

      console.log('📤 Sending CreateMatchRequestCommand:', command);

      const success = await sendMatchRequest(command);

      if (success) {
        setMatchFormOpen(false);
        setStatusMessage({
          text: 'Match-Anfrage erfolgreich erstellt',
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: 'Fehler beim Erstellen der Match-Anfrage',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('❌ Match submission error:', error);
      setStatusMessage({
        text: 'Fehler beim Erstellen der Match-Anfrage',
        type: 'error',
      });
    }
  };

  const handleEdit = () => {
    if (!skillId || !isOwner) {
      setStatusMessage({
        text: 'Du kannst nur deine eigenen Skills bearbeiten',
        type: 'error',
      });
      return;
    }
    navigate(`/skills/${skillId}/edit`);
  };

  const handleBack = () => {
    // Navigate back to the appropriate skills page based on ownership
    if (isOwner || cameFromMySkills) {
      navigate('/skills/my-skills');
    } else {
      navigate('/skills');
    }
  };

  // Loading state
  if (isLoading && !selectedSkill) {
    return <LoadingSpinner fullPage message="Skill wird geladen..." />;
  }

  // Error state
  if (error && !selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description={{message:"Der angeforderte Skill existiert nicht oder ist nicht verfügbar."}}
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
          description={{message:"Der angeforderte Skill existiert nicht oder ist nicht verfügbar."}}
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
    userSkillsCount: userSkills.length,
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
                    label={selectedSkill.isOffering ? 'Angeboten' : 'Gesucht'}
                    color={selectedSkill.isOffering ? 'success' : 'secondary'}
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
                    isBookmarked
                      ? 'Aus Favoriten entfernen'
                      : 'Zu Favoriten hinzufügen'
                  }
                >
                  <IconButton onClick={handleBookmark}>
                    {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
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
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MessageIcon />}
                    onClick={handleCreateMatch}
                  >
                    {selectedSkill.isOffering
                      ? 'Lernen anfragen'
                      : 'Hilfe anbieten'}
                  </Button>
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
                {selectedSkill.isOffering ? 'Wird angeboten' : 'Wird gesucht'}
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
                {selectedSkill.isOffering
                  ? 'Möchtest du diesen Skill lernen? Erstelle eine Match-Anfrage!'
                  : 'Kannst du bei diesem Skill helfen? Biete deine Hilfe an!'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCreateMatch}
                startIcon={<MessageIcon />}
              >
                {selectedSkill.isOffering
                  ? 'Lernen anfragen'
                  : 'Hilfe anbieten'}
              </Button>
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
          targetUser={user as User}
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

export default SkillDetailPage;
