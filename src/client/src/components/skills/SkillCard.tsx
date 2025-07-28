// src/components/skills/SkillCard.tsx
import React, { memo } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Box,
  useTheme,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Code as CodeIcon,
  Palette as PaletteIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Skill } from '../../types/models/Skill';

interface SkillCardProps {
  skill: Skill;
  isOwner?: boolean;
  showMatchButton?: boolean;
  onEdit: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
  onViewDetails: (skill: Skill) => void;
  onMatch?: (skill: Skill) => void;
  isFavorite?: (skillId: string) => boolean;
  onToggleFavorite?: (skill: Skill) => void;
}

const SkillCard: React.FC<SkillCardProps> = memo(({
  skill,
  isOwner = false,
  showMatchButton = false,
  onEdit,
  onDelete,
  onViewDetails,
  onMatch,
  isFavorite,
  onToggleFavorite,
}) => {
  const theme = useTheme();

  const handleCardClick = () => {
    onViewDetails(skill);
  };

  const handleToggleFavorite = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onToggleFavorite?.(skill);
  };

  const handleEdit = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onEdit(skill);
  };

  const handleDelete = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onDelete(skill.id);
  };

  const handleMatch = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onMatch?.(skill);
  };

  // Utility functions
  const getCategoryIcon = () => {
    const iconName = skill.category?.iconName?.toLowerCase();
    
    switch (iconName) {
      case 'code':
        return <CodeIcon />;
      case 'palette':
        return <PaletteIcon />;
      case 'business':
      case 'briefcase':
        return <BusinessIcon />;
      case 'school':
        return <SchoolIcon />;
      default:
        return <CodeIcon />;
    }
  };

  const getCategoryColor = () => {
    if (skill.category?.color) {
      return skill.category.color;
    }

    const categoryName = skill.category?.name?.toLowerCase() || '';
    if (categoryName.includes('programming') || categoryName.includes('code')) {
      return theme.palette.primary.main;
    } else if (categoryName.includes('design')) {
      return theme.palette.secondary.main;
    } else if (categoryName.includes('business')) {
      return theme.palette.warning.main;
    } else if (categoryName.includes('marketing')) {
      return theme.palette.success.main;
    }

    return theme.palette.primary.main;
  };

  const getProficiencyColor = () => {
    if (skill.proficiencyLevel?.color) {
      return skill.proficiencyLevel.color;
    }

    const rank = skill.proficiencyLevel?.rank || 1;
    const colors = {
      1: theme.palette.success.main,
      2: theme.palette.info.main,
      3: theme.palette.warning.main,
      4: theme.palette.error.main,
      5: theme.palette.error.main,
    };

    return colors[rank as keyof typeof colors] || theme.palette.primary.main;
  };

  const categoryColor = getCategoryColor();
  const proficiencyColor = getProficiencyColor();
  const starsCount = Math.min(skill.proficiencyLevel?.rank || 1, 5);
  const isFavorited = isFavorite?.(skill.id) || false;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px ${categoryColor}30`,
          borderColor: categoryColor,
          '& .skill-card-header': {
            transform: 'scale(1.02)',
          },
          '& .skill-card-avatar': {
            transform: 'scale(1.1)',
          },
        },
      }}
      onClick={handleCardClick}
    >
      {/* Modern Header */}
      <Box
        className="skill-card-header"
        sx={{
          height: 160,
          background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 50%, ${categoryColor}15 100%)`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2,
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Top row with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Status chip */}
          <Chip
            label={skill.isOffered ? 'Angeboten' : 'Gesucht'}
            size="small"
            sx={{
              bgcolor: skill.isOffered ? 'success.main' : 'secondary.main',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: 28,
              '& .MuiChip-label': {
                px: 1.5,
              },
            }}
          />

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Favorite button */}
            {onToggleFavorite && (
              <Tooltip title={isFavorited ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>
                <IconButton
                  onClick={handleToggleFavorite}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.9)',
                    color: isFavorited ? theme.palette.warning.main : theme.palette.action.active,
                    width: 36,
                    height: 36,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,1)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {isFavorited ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}

            {/* Owner actions */}
            {isOwner && (
              <>
                <Tooltip title="Bearbeiten">
                  <IconButton
                    onClick={handleEdit}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.9)',
                      color: theme.palette.primary.main,
                      width: 36,
                      height: 36,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,1)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Löschen">
                  <IconButton
                    onClick={handleDelete}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.9)',
                      color: theme.palette.error.main,
                      width: 36,
                      height: 36,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,1)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* Center - Category icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Avatar
            className="skill-card-avatar"
            sx={{
              width: 64,
              height: 64,
              bgcolor: `${categoryColor}20`,
              color: categoryColor,
              fontSize: '2rem',
              transition: 'transform 0.3s ease',
              border: `3px solid ${categoryColor}30`,
            }}
          >
            {getCategoryIcon()}
          </Avatar>
        </Box>

        {/* Bottom - Owner badge */}
        {isOwner && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Chip
              icon={<PersonIcon />}
              label="Mein Skill"
              size="small"
              variant="outlined"
              sx={{
                bgcolor: 'rgba(255,255,255,0.95)',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                fontSize: '0.75rem',
              }}
            />
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, p: 3, pb: 2 }}>
        {/* Title and rating */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              lineHeight: 1.2,
              mb: 1,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '2.4em',
            }}
          >
            {skill.name}
          </Typography>

          {/* Proficiency and rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {/* Proficiency stars */}
            {skill.proficiencyLevel && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ display: 'flex' }}>
                  {[...Array(5)].map((_, index) =>
                    index < starsCount ? (
                      <StarIcon
                        key={index}
                        fontSize="small"
                        sx={{
                          color: proficiencyColor,
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                        }}
                      />
                    ) : (
                      <StarBorderIcon
                        key={index}
                        fontSize="small"
                        sx={{ color: 'action.disabled' }}
                      />
                    )
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  {skill.proficiencyLevel.level}
                </Typography>
              </Box>
            )}

            {/* Average rating */}
            {skill.averageRating && skill.reviewCount && skill.reviewCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon fontSize="small" color="success" />
                <Typography variant="caption" color="text.secondary">
                  {skill.averageRating.toFixed(1)} ({skill.reviewCount})
                </Typography>
              </Box>
            )}
          </Box>

          {/* Category chip */}
          {skill.category && (
            <Chip
              label={skill.category.name}
              size="small"
              variant="outlined"
              sx={{
                borderColor: categoryColor,
                color: categoryColor,
                fontWeight: 500,
                mb: 2,
              }}
            />
          )}
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
            minHeight: '4.5em',
            mb: 2,
          }}
        >
          {skill.description || 'Keine Beschreibung vorhanden.'}
        </Typography>

        {/* Meta info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {new Date(skill.createdAt).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
          {skill.isRemoteAvailable && (
            <Chip
              label="Remote"
              size="small"
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          )}
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions
        sx={{
          p: 3,
          pt: 0,
          display: 'flex',
          gap: 1,
        }}
      >
        {showMatchButton && !isOwner && onMatch && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleMatch}
            startIcon={<MessageIcon />}
            fullWidth
            sx={{
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: `0 4px 12px ${categoryColor}40`,
              '&:hover': {
                boxShadow: `0 6px 16px ${categoryColor}60`,
              },
            }}
          >
            {skill.isOffered ? 'Lernen anfragen' : 'Hilfe anbieten'}
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(skill);
          }}
          startIcon={<VisibilityIcon />}
          fullWidth={!showMatchButton || isOwner}
          sx={{
            fontWeight: 600,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            borderColor: categoryColor,
            color: categoryColor,
            '&:hover': {
              borderColor: categoryColor,
              bgcolor: `${categoryColor}10`,
            },
          }}
        >
          Details ansehen
        </Button>
      </CardActions>
    </Card>
  );
});

SkillCard.displayName = 'SkillCard';

export default SkillCard;