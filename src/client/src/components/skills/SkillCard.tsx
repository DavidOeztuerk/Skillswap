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
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Stack,
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
import { useMobile, useMobileStyles } from '../../hooks/useMobile';

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
  const mobile = useMobile();
  const mobileStyles = useMobileStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Menu handlers
  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    onEdit(skill);
  };

  const handleDelete = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    onDelete(skill.id);
  };

  const handleViewDetails = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    onViewDetails(skill);
  };

  const handleMatch = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    handleMenuClose();
    onMatch?.(skill);
  };

  const handleCardClick = () => {
    onViewDetails(skill);
  };

  const handleToggleFavorite = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onToggleFavorite?.(skill);
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
        transition: mobile.isMobile ? 'none' : 'all 0.3s ease',
        border: '1px solid',
        borderColor: 'divider',
        margin: mobile.isMobile ? '4px 0' : 0,
        ...mobileStyles.touchStyles,
        '&:hover': mobile.isMobile ? {} : {
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

        {/* Owner chip */}
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

        {/* Favorite button */}
        {onToggleFavorite && (
          <IconButton
            aria-label={isFavorited ? 'Favorit entfernen' : 'Als Favorit markieren'}
            onClick={handleToggleFavorite}
            sx={{
              position: 'absolute',
              top: 8,
              right: 44,
              bgcolor: 'rgba(255,255,255,0.9)',
              zIndex: 2,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,1)',
                transform: 'scale(1.1)',
              },
              color: isFavorited ? theme.palette.warning.main : theme.palette.action.active,
            }}
          >
            {isFavorited ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
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
          id={`skill-menu-${skill.id}`}
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
          <MenuItem onClick={handleViewDetails}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            Details ansehen
          </MenuItem>
          
          {showMatchButton && !isOwner && onMatch && (
            <>
              <Divider />
              <MenuItem onClick={handleMatch}>
                <MessageIcon fontSize="small" sx={{ mr: 1 }} />
                {skill.isOffering ? 'Lernen anfragen' : 'Hilfe anbieten'}
              </MenuItem>
            </>
          )}

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
            minHeight: '3.6em',
          }}
        >
          {skill.description || 'Keine Beschreibung vorhanden.'}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions
        sx={{
          justifyContent: mobile.isMobile ? 'center' : 'space-between',
          flexDirection: mobile.isMobile ? 'column' : 'row',
          px: mobile.isMobile ? 1 : 2,
          pb: mobile.isMobile ? 1.5 : 2,
          pt: 0,
          gap: mobile.isMobile ? 1 : 0,
        }}
      >
        <Stack 
          direction={mobile.isMobile ? 'column' : 'row'} 
          spacing={mobile.isMobile ? 1 : 1}
          sx={{ width: mobile.isMobile ? '100%' : 'auto' }}
        >
          {showMatchButton && !isOwner && onMatch && (
            <Button
              size={mobile.isMobile ? 'medium' : 'small'}
              variant="contained"
              color="primary"
              onClick={handleMatch}
              startIcon={<MessageIcon />}
              fullWidth={mobile.isMobile}
              sx={{
                fontSize: mobile.isMobile ? '0.875rem' : '0.75rem',
                py: mobile.isMobile ? 1.5 : 0.5,
                px: mobile.isMobile ? 2 : 1,
                minHeight: mobile.isMobile ? 48 : 'auto',
              }}
            >
              {skill.isOffering ? 'Lernen' : 'Helfen'}
            </Button>
          )}

          <Button
            size={mobile.isMobile ? 'medium' : 'small'}
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              if (isOwner) {
                onEdit(skill);
              } else {
                onViewDetails(skill);
              }
            }}
            fullWidth={mobile.isMobile}
            startIcon={isOwner ? <EditIcon /> : <VisibilityIcon />}
            sx={{
              fontSize: mobile.isMobile ? '0.875rem' : '0.75rem',
              py: mobile.isMobile ? 1.5 : 0.5,
              px: mobile.isMobile ? 2 : 1,
              minHeight: mobile.isMobile ? 48 : 'auto',
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
        </Stack>
      </CardActions>
    </Card>
  );
});

SkillCard.displayName = 'SkillCard';

export default SkillCard;