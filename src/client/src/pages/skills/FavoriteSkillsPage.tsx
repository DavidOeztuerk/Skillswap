import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Pagination,
  IconButton,
  Avatar,
  Rating,
  Tooltip,
  Paper,
  Skeleton,
  Grid,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocalOffer as OfferIcon,
  RequestPage as RequestIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  RemoveRedEye as ViewIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import skillService from '../../api/services/skillsService';
import { toast } from 'react-toastify';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

interface FavoriteSkillDetail {
  skillId: string;
  name: string;
  description: string;
  category: string;
  proficiencyLevel: string;
  isOffered: boolean;
  price?: number;
  currency?: string;
  rating: number;
  reviewCount: number;
  matchCount: number;
  addedToFavoritesAt: string;
  thumbnailUrl?: string;
  tags: string[];
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl?: string;
}

const FavoriteSkillsPage: React.FC = () => {
  const navigate = useNavigate();
  const [favoriteSkills, setFavoriteSkills] = useState<FavoriteSkillDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    loadFavoriteSkills();
  }, [page]);

  const loadFavoriteSkills = async () => {
    try {
      setLoading(true);
      const response = await skillService.getFavoriteSkillsWithDetails(page, pageSize);
      
      if (response.data) {
        setFavoriteSkills(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalCount(response.totalRecords || 0);
      }
    } catch (error: any) {
      console.error('Error loading favorite skills:', error);
      toast.error('Fehler beim Laden der Favoriten');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (skillId: string) => {
    try {
      setRemoving(skillId);
      const response = await skillService.removeFavoriteSkill(skillId);
      
      if (response.success) {
        setFavoriteSkills(prev => prev.filter(s => s.skillId !== skillId));
        setTotalCount(prev => prev - 1);
        toast.success('Skill aus Favoriten entfernt');
      }
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast.error('Fehler beim Entfernen aus Favoriten');
    } finally {
      setRemoving(null);
    }
  };

  const handleViewDetails = (skillId: string) => {
    navigate(`/skills/${skillId}`);
  };

  const handleStartMatchRequest = (skillId: string) => {
    navigate(`/skills/${skillId}`, { state: { openMatchDialog: true } });
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && favoriteSkills.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader
          title="Meine Favoriten"
          subtitle="Skills die du als Favorit markiert hast"
        />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!loading && favoriteSkills.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader
          title="Meine Favoriten"
          subtitle="Skills die du als Favorit markiert hast"
        />
        <EmptyState
          icon={<FavoriteBorderIcon />}
          title="Keine Favoriten"
          description="Du hast noch keine Skills als Favorit markiert"
          actionLabel="Skills entdecken"
          actionPath="/skills"
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Meine Favoriten"
        subtitle={`${totalCount} Skills als Favorit markiert`}
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {favoriteSkills.map((skill) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={skill.skillId}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              {/* Favorite Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFavorite(skill.skillId)}
                  disabled={removing === skill.skillId}
                  sx={{
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'error.lighter' },
                  }}
                >
                  {removing === skill.skillId ? (
                    <CircularProgress size={20} />
                  ) : (
                    <FavoriteIcon color="error" />
                  )}
                </IconButton>
              </Box>

              {/* Skill Type Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 1,
                }}
              >
                <Chip
                  size="small"
                  icon={skill.isOffered ? <OfferIcon /> : <RequestIcon />}
                  label={skill.isOffered ? 'Angebot' : 'Gesuch'}
                  color={skill.isOffered ? 'success' : 'info'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {/* Thumbnail or Placeholder */}
              <Box
                sx={{
                  height: 180,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {skill.thumbnailUrl ? (
                  <img
                    src={skill.thumbnailUrl}
                    alt={skill.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <CategoryIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                {/* Title */}
                <Typography variant="h6" gutterBottom noWrap>
                  {skill.name}
                </Typography>

                {/* Owner Info */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar
                    src={skill.ownerAvatarUrl}
                    sx={{ width: 24, height: 24 }}
                  >
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {skill.ownerName}
                  </Typography>
                </Stack>

                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {skill.description}
                </Typography>

                {/* Category & Level */}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip
                    size="small"
                    label={skill.category}
                    icon={<CategoryIcon />}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={skill.proficiencyLevel}
                    variant="outlined"
                    color="primary"
                  />
                </Stack>

                {/* Stats */}
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  {/* Rating */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Rating
                      value={skill.rating}
                      readOnly
                      size="small"
                      precision={0.5}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({skill.reviewCount})
                    </Typography>
                  </Stack>
                </Stack>

                {/* Match Count */}
                <Stack direction="row" spacing={2}>
                  <Tooltip title="Erfolgreiche Matches">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <HandshakeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {skill.matchCount} Matches
                      </Typography>
                    </Stack>
                  </Tooltip>
                </Stack>

                {/* Tags */}
                {skill.tags.length > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 2 }} flexWrap="wrap">
                    {skill.tags.slice(0, 3).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        icon={<TagIcon />}
                        sx={{ mb: 0.5 }}
                      />
                    ))}
                    {skill.tags.length > 3 && (
                      <Chip
                        label={`+${skill.tags.length - 3}`}
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                    )}
                  </Stack>
                )}

                {/* Price if monetary */}
                {skill.price && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2,
                      p: 1,
                      bgcolor: 'primary.lighter',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {skill.price} {skill.currency || '€'}
                    </Typography>
                  </Paper>
                )}
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  onClick={() => handleViewDetails(skill.skillId)}
                  startIcon={<ViewIcon />}
                >
                  Details
                </Button>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleStartMatchRequest(skill.skillId)}
                  startIcon={<HandshakeIcon />}
                >
                  Anfrage
                </Button>
              </CardActions>

              {/* Added to favorites date */}
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Favorit seit: {new Date(skill.addedToFavoritesAt).toLocaleDateString('de-DE')}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
};

export default FavoriteSkillsPage;