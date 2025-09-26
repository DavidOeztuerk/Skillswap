import React, { useState, memo, useCallback, useMemo } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Rating,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Collapse,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  MoreVert as MoreVertIcon,
  SwapHoriz as SwapIcon,
  School as LearnIcon,
  LocalOffer as OfferIcon,
  Person as PersonIcon,
  // LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion'; // Removed for performance
import { Skill } from '../../types/models/Skill';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface EnhancedSkillCardProps {
  skill: Skill;
  isOwner?: boolean;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skillId: string) => void;
  onMatch?: (skill: Skill) => void;
  onToggleFavorite?: (skill: Skill) => void;
  isFavorite?: boolean; // ⚡ PERFORMANCE: Changed from function to boolean for stability
  showMatchButton?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const EnhancedSkillCard: React.FC<EnhancedSkillCardProps> = memo(({
  skill,
  isOwner = false,
  onEdit,
  onDelete,
  onMatch,
  onToggleFavorite,
  isFavorite = false,
  showMatchButton = true,
  variant = 'default',
}) => {
  // ⚡ PERFORMANCE: Simplified performance tracking
  usePerformance('EnhancedSkillCard', { skillId: skill.id });
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleCardClick = useCallback(() => {
    navigate(`/skills/${skill.id}`);
  }, [navigate, skill.id]);

  const handleMatch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMatch) {
      onMatch(skill);
    } else {
      navigate(`/skills/${skill.id}?showMatchForm=true`);
    }
  }, [onMatch, navigate, skill]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(skill);
    }
  }, [onToggleFavorite, skill]);

  const handleShare = useCallback(() => {
    handleMenuClose();
    if (navigator.share) {
      navigator.share({
        title: skill.name,
        text: skill.description,
        url: `${window.location.origin}/skills/${skill.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/skills/${skill.id}`);
    }
  }, [handleMenuClose, skill.name, skill.description, skill.id]);

  // ⚡ PERFORMANCE: Simple memoization for basic calculations only  
  const cardData = useMemo(() => ({
    matchRequests: skill.matchRequests || 0,
    activeMatches: skill.activeMatches || 0,
    completionRate: skill.completionRate || 0,
    averageRating: skill.averageRating || 0,
    totalReviews: skill.reviewCount || 0,
    isVerified: skill.isVerified || false
  }), [skill.matchRequests, skill.activeMatches, skill.completionRate, skill.averageRating, skill.reviewCount, skill.isVerified]);

  // Now destructure the memoized card data
  const { matchRequests, activeMatches, completionRate, averageRating, totalReviews, isVerified } = cardData;
  
  // REMOVE EXPENSIVE ANIMATION - Major performance fix
  return (
    <div>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 4,
          },
          position: 'relative',
          overflow: 'visible',
        }}
        onClick={handleCardClick}
      >
        {/* Status Indicator */}
        {skill.isOffered && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: 16,
              bgcolor: 'primary.main',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              boxShadow: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <OfferIcon fontSize="small" />
            ANGEBOT
          </Box>
        )}
        {!skill.isOffered && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: 16,
              bgcolor: 'secondary.main',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              boxShadow: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <LearnIcon fontSize="small" />
            GESUCHT
          </Box>
        )}

        <CardContent sx={{ flex: 1, pt: 3 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" component="h3" fontWeight="bold">
                  {skill.name}
                </Typography>
                {isVerified && (
                  <Tooltip title="Verifizierter Skill">
                    <VerifiedIcon fontSize="small" color="primary" />
                  </Tooltip>
                )}
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                <Chip
                  label={skill.category.name}
                  size="small"
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    fontWeight: 'medium',
                  }}
                />
                <Chip
                  label={skill.proficiencyLevel.level}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5}>
              <IconButton
                size="small"
                onClick={handleToggleFavorite}
                sx={{ color: isFavorite ? 'primary.main' : 'text.secondary' }}
              >
                {isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'none' : 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {skill.description}
          </Typography>

          {/* Stats */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Rating value={averageRating} readOnly size="small" precision={0.5} />
              <Typography variant="body2" color="text.secondary">
                {averageRating.toFixed(1)} ({totalReviews})
              </Typography>
            </Box>
          </Box>

          {/* Match Activity Indicators */}
          {!isOwner && (
            <Stack spacing={1}>
              {matchRequests > 0 && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Badge badgeContent={matchRequests} color="primary" max={9}>
                    <MessageIcon fontSize="small" color="action" />
                  </Badge>
                  <Typography variant="caption" color="text.secondary">
                    {matchRequests} aktive Anfragen
                  </Typography>
                </Box>
              )}
              {activeMatches > 0 && (
                <Box display="flex" alignItems="center" gap={1}>
                  <SwapIcon fontSize="small" color="success" />
                  <Typography variant="caption" color="text.secondary">
                    {activeMatches} aktive Matches
                  </Typography>
                </Box>
              )}
            </Stack>
          )}

          {/* Owner Stats */}
          {isOwner && variant !== 'compact' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Deine Skill-Statistiken
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption">Anfragen</Typography>
                  <Chip label={matchRequests} size="small" color="primary" />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption">Aktive Matches</Typography>
                  <Chip label={activeMatches} size="small" color="success" />
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption">Erfolgsrate</Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {completionRate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={completionRate}
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Box>
              </Stack>
            </Box>
          )}

          {/* Additional Info (Expandable) */}
          {variant === 'detailed' && (
            <Collapse in={expanded}>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                {/* <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {skill.isRemoteAvailable ? 'Remote verfügbar' : 'Nur vor Ort'}
                  </Typography>
                </Box> */}
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    Geschätzte Dauer: {skill.estimatedDurationMinutes || 60} Min.
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    Zuletzt aktiv:{' '}
                    {formatDistanceToNow(new Date(skill.lastActiveAt || skill.createdAt || new Date()), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Collapse>
          )}
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ p: 2, pt: 0 }}>
          {!isOwner && showMatchButton ? (
            <Button
              fullWidth
              variant="contained"
              color={skill.isOffered ? 'secondary' : 'primary'}
              startIcon={<SwapIcon />}
              onClick={handleMatch}
              sx={{
                fontWeight: 'bold',
                py: 1,
              }}
            >
              {skill.isOffered ? 'Lernen anfragen' : 'Hilfe anbieten'}
            </Button>
          ) : isOwner ? (
            <Box display="flex" gap={1} width="100%">
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(skill);
                }}
              >
                Bearbeiten
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(skill.id);
                }}
              >
                Löschen
              </Button>
            </Box>
          ) : null}

          {variant === 'detailed' && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{ ml: 'auto' }}
            >
              {expanded ? 'Weniger' : 'Mehr'} anzeigen
            </Button>
          )}
        </CardActions>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          {!isOwner && (
            <MenuItem onClick={handleShare}>
              <ListItemIcon>
                <ShareIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Teilen</ListItemText>
            </MenuItem>
          )}
          {isOwner && [
              <MenuItem
                key="edit"
                onClick={() => {
                  handleMenuClose();
                  onEdit?.(skill);
                }}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Bearbeiten</ListItemText>
              </MenuItem>,
              <MenuItem
                key="delete"
                onClick={() => {
                  handleMenuClose();
                  onDelete?.(skill.id);
                }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Löschen</ListItemText>
              </MenuItem>
            ]}
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate(`/skills/${skill.id}`);
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Details anzeigen</ListItemText>
          </MenuItem>
        </Menu>
      </Card>
    </div>
  );
});

EnhancedSkillCard.displayName = 'EnhancedSkillCard';

export default EnhancedSkillCard;