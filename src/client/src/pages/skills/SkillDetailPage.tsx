// src/pages/skills/SkillDetailPage.tsx
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Grid,
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
} from '@mui/icons-material';

import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import MatchForm from '../../components/matchmaking/MatchForm';
import { useSkills } from '../../hooks/useSkills';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/dateUtils';
import { MatchRequest } from '../../types/contracts/requests/MatchRequest';

// Mock data für Reviews und ähnliche Skills
interface SkillReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface SimilarSkill {
  id: string;
  name: string;
  description: string;
  averageRating: number;
  reviewCount: number;
  category: string;
}

const SkillDetailPage: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const {
    selectedSkill,
    fetchSkillById,
    deleteSkill,
    rateSkill,
    endorseSkill,
    isLoading,
    errors,
  } = useSkills();

  // Local state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reviews, setReviews] = useState<SkillReview[]>([]);
  const [similarSkills, setSimilarSkills] = useState<SimilarSkill[]>([]);
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

  // Load skill data
  useEffect(() => {
    if (skillId) {
      fetchSkillById(skillId);
      loadMockData();
    }
  }, [skillId, fetchSkillById]);

  // Mock data loading
  const loadMockData = () => {
    // Mock reviews
    setReviews([
      {
        id: '1',
        userId: 'user1',
        userName: 'Anna Müller',
        rating: 5,
        comment: 'Fantastischer Skill! Sehr gut erklärt und praxisnah.',
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Max Schmidt',
        rating: 4,
        comment: 'Gute Grundlagen, könnte aber mehr Tiefe haben.',
        createdAt: '2024-01-10T14:20:00Z',
      },
    ]);

    // Mock similar skills
    setSimilarSkills([
      {
        id: 'skill1',
        name: 'Advanced React Patterns',
        description: 'Erweiterte React-Konzepte und Design Patterns',
        averageRating: 4.8,
        reviewCount: 23,
        category: 'Frontend Development',
      },
      {
        id: 'skill2',
        name: 'TypeScript Best Practices',
        description: 'Best Practices für TypeScript in großen Projekten',
        averageRating: 4.6,
        reviewCount: 18,
        category: 'Programming',
      },
    ]);
  };

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
    if (!skillId || rating === null) return;

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
        // Reload reviews in real app
      }
    } catch (error) {
      setStatusMessage({
        text: 'Fehler beim Bewerten' + ' ' + error,
        type: 'error',
      });
    }
  };

  const handleEndorseSkill = async () => {
    if (!skillId) return;

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
    } catch (error) {
      setStatusMessage({
        text: 'Fehler beim Empfehlen' + ' ' + error,
        type: 'error',
      });
    }
  };

  const handleDeleteSkill = async () => {
    if (!skillId) return;

    try {
      const success = await deleteSkill(skillId);
      if (success) {
        navigate('/skills');
      }
    } catch (error) {
      setStatusMessage({
        text: 'Fehler beim Löschen' + ' ' + error,
        type: 'error',
      });
    }
  };

  const handleCreateMatch = () => {
    setMatchFormOpen(true);
  };

  const handleMatchSubmit = async (data: MatchRequest) => {
    // Implementation would go here
    console.log('Match request:', data);
    setMatchFormOpen(false);
    setStatusMessage({
      text: 'Match-Anfrage erfolgreich erstellt',
      type: 'success',
    });
  };

  // Loading state
  if (isLoading && !selectedSkill) {
    return <LoadingSpinner fullPage message="Skill wird geladen..." />;
  }

  // Error state
  if (errors && !selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description="Der angeforderte Skill existiert nicht oder ist nicht verfügbar."
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
          description="Der angeforderte Skill existiert nicht oder ist nicht verfügbar."
          actionLabel="Zurück zu Skills"
          actionHandler={() => navigate('/skills')}
        />
      </Container>
    );
  }

  const isOwner = user?.id === 'current-user'; // Replace with actual ownership check
  const averageRating = 4.5; // Mock data
  const reviewCount = reviews.length;

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {/* Status messages */}
      {statusMessage && (
        <AlertMessage
          message={[statusMessage.text]}
          severity={statusMessage.type}
          onClose={() => setStatusMessage(null)}
        />
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/skills')}
          sx={{ mb: 2 }}
        >
          Zurück zu Skills
        </Button>
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
                {isOwner && (
                  <>
                    <Tooltip title="Bearbeiten">
                      <IconButton
                        onClick={() => navigate(`/skills/${skillId}/edit`)}
                      >
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

            {/* Action buttons */}
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
            </Box>
          </Paper>

          {/* Reviews section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bewertungen ({reviewCount})
            </Typography>

            {reviews.length > 0 ? (
              <List>
                {reviews.map((review, index) => (
                  <React.Fragment key={review.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar src={review.userAvatar} alt={review.userName}>
                          {review.userName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="subtitle2">
                              {review.userName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(review.createdAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Rating
                              value={review.rating}
                              readOnly
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2">
                              {review.comment}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < reviews.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Noch keine Bewertungen vorhanden.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Owner info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Anbieter
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 56, height: 56 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">Max Mustermann</Typography>
                <Typography variant="body2" color="text.secondary">
                  Mitglied seit 2023
                </Typography>
                <Rating value={4.8} readOnly size="small" />
              </Box>
            </Box>
            {!isOwner && (
              <Button variant="outlined" fullWidth>
                Profil ansehen
              </Button>
            )}
          </Paper>

          {/* Similar skills */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ähnliche Skills
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {similarSkills.map((skill) => (
                <Card
                  key={skill.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/skills/${skill.id}`)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {skill.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {skill.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating
                        value={skill.averageRating}
                        readOnly
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        ({skill.reviewCount})
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Rating Dialog */}
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
          <Button onClick={() => setRatingDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleRateSkill}
            variant="contained"
            disabled={rating === null || rating === 0}
          >
            Bewertung abgeben
          </Button>
        </DialogActions>
      </Dialog>

      {/* Endorse Dialog */}
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
          <Button onClick={() => setEndorseDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleEndorseSkill} variant="contained">
            Empfehlen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Match Form */}
      {selectedSkill && (
        <MatchForm
          open={matchFormOpen}
          onClose={() => setMatchFormOpen(false)}
          onSubmit={handleMatchSubmit}
          skill={selectedSkill}
          isLoading={false}
        />
      )}

      {/* Delete Confirmation */}
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
    </Container>
  );
};

export default SkillDetailPage;
