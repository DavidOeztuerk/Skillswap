// src/components/skills/SkillCard.tsx - KORRIGIERTE VERSION
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Box,
  Menu,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
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
} from '@mui/icons-material';
import { Skill } from '../../types/models/Skill';

interface SkillCardProps {
  skill: Skill;
  isOwner?: boolean; // Indicates if this is the owner's view page
  showMatchButton?: boolean; // Controls if match functionality should be available
  onEdit: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
  onViewDetails: (skill: Skill) => void;
  onMatch?: (skill: Skill) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  isOwner = false,
  showMatchButton = false,
  onEdit,
  onDelete,
  onViewDetails,
  onMatch,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Debug logging
  console.log('🎴 SkillCard render:', {
    id: skill.skillId,
    name: skill.name,
    isOwner,
    showMatchButton,
    hasCategory: !!skill.category,
    hasProficiencyLevel: !!skill.proficiencyLevel,
  });

  // Menu handlers
  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Action handlers
  const handleEdit = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    onEdit(skill);
  };

  const handleDelete = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    onDelete(skill.skillId);
  };

  const handleViewDetails = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    onViewDetails(skill);
  };

  const handleMatch = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    if (onMatch) {
      onMatch(skill);
    }
  };

  const handleCardClick = () => {
    onViewDetails(skill);
  };

  // Utility functions
  const getCategoryIcon = () => {
    if (!skill.category?.iconName) return <CodeIcon />;

    switch (skill.category.iconName.toLowerCase()) {
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

    // Fallback colors based on category name
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

    // Fallback colors based on rank
    if (!skill.proficiencyLevel?.rank) return theme.palette.primary.main;

    switch (skill.proficiencyLevel.rank) {
      case 1:
        return theme.palette.success.main; // Beginner - Green
      case 2:
        return theme.palette.info.main; // Intermediate - Blue
      case 3:
        return theme.palette.warning.main; // Advanced - Orange
      case 4:
      case 5:
        return theme.palette.error.main; // Expert/Master - Red
      default:
        return theme.palette.primary.main;
    }
  };

  const getStarsCount = () => {
    return Math.min(skill.proficiencyLevel?.rank || 1, 5);
  };

  const categoryColor = getCategoryColor();
  const proficiencyColor = getProficiencyColor();
  const starsCount = getStarsCount();

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[8],
          borderColor: categoryColor,
        },
      }}
      onClick={handleCardClick}
    >
      {/* Header with category background */}
      <Box
        sx={{
          height: 120,
          background: `linear-gradient(135deg, ${categoryColor}20 0%, ${categoryColor}10 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: `2px solid ${categoryColor}30`,
        }}
      >
        {/* Category icon */}
        <Box
          sx={{
            color: categoryColor,
            opacity: 0.7,
            fontSize: '3rem',
          }}
        >
          {getCategoryIcon()}
        </Box>

        {/* Offering/Seeking chip */}
        <Chip
          label={skill.isOffering ? 'Angeboten' : 'Gesucht'}
          color={skill.isOffering ? 'success' : 'secondary'}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontWeight: 'bold',
          }}
        />

        {/* Owner chip - nur anzeigen wenn es wirklich der Owner ist */}
        {isOwner && (
          <Chip
            label="Mein Skill"
            color="primary"
            variant="outlined"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 50,
              fontWeight: 'bold',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            }}
          />
        )}

        {/* Menu button */}
        <IconButton
          aria-label="Optionen"
          onClick={handleMenuClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)',
              transform: 'scale(1.1)',
            },
          }}
        >
          <MoreVertIcon />
        </IconButton>

        {/* Context menu */}
        <Menu
          id={`skill-menu-${skill.skillId}`}
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            elevation: 8,
            sx: {
              mt: 1,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          }}
        >
          {/* Details immer verfügbar */}
          <MenuItem onClick={handleViewDetails}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            Details ansehen
          </MenuItem>
          
          {/* Match-Funktionalität nur für fremde Skills */}
          {showMatchButton && !isOwner && onMatch && (
            <>
              <Divider />
              <MenuItem onClick={handleMatch}>
                <MessageIcon fontSize="small" sx={{ mr: 1 }} />
                {skill.isOffering ? 'Lernen anfragen' : 'Hilfe anbieten'}
              </MenuItem>
            </>
          )}

          {/* Edit/Delete nur für eigene Skills */}
          {isOwner && (
            <>
              <Divider />
              <MenuItem onClick={handleEdit}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                Bearbeiten
              </MenuItem>
              <MenuItem
                onClick={handleDelete}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    bgcolor: theme.palette.error.light + '20',
                  },
                }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Löschen
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1 }}>
        {/* Title and proficiency stars */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1.5,
            gap: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              fontSize: '1.1rem',
              lineHeight: 1.2,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {skill.name}
          </Typography>

          {/* Proficiency stars */}
          {skill.proficiencyLevel && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
                    sx={{ color: 'text.disabled' }}
                  />
                )
              )}
            </Box>
          )}
        </Box>

        {/* Category and proficiency level chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {skill.category && (
            <Chip
              label={skill.category.name}
              size="small"
              variant="outlined"
              sx={{
                borderColor: categoryColor,
                color: categoryColor,
                '& .MuiChip-label': {
                  fontWeight: 500,
                },
              }}
            />
          )}

          {skill.proficiencyLevel && (
            <Chip
              label={skill.proficiencyLevel.level}
              size="small"
              sx={{
                bgcolor: proficiencyColor,
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-label': {
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                },
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
            lineHeight: 1.4,
            minHeight: '3.6em', // Reserve space for 3 lines
          }}
        >
          {skill.description || 'Keine Beschreibung vorhanden.'}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions
        sx={{
          justifyContent: 'space-between',
          px: 2,
          pb: 2,
          pt: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Skill ID for debugging (can be removed in production) */}
          <Typography variant="caption" color="text.disabled">
            #{skill.skillId.slice(-6)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Match button nur für fremde Skills */}
          {showMatchButton && !isOwner && onMatch && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={handleMatch}
              startIcon={<MessageIcon />}
              sx={{
                fontSize: '0.75rem',
                py: 0.5,
                px: 1,
              }}
            >
              {skill.isOffering ? 'Lernen' : 'Helfen'}
            </Button>
          )}

          {/* Details/Edit button */}
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              if (isOwner) {
                onEdit(skill); // Für eigene Skills -> Edit
              } else {
                onViewDetails(skill); // Für fremde Skills -> Details
              }
            }}
            sx={{
              borderColor: categoryColor,
              color: categoryColor,
              '&:hover': {
                borderColor: categoryColor,
                bgcolor: categoryColor + '10',
              },
            }}
          >
            {isOwner ? 'Bearbeiten' : 'Details'}
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

export default SkillCard;