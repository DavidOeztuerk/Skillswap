// src/components/skills/SkillCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  EmojiObjects as SkillIcon,
} from '@mui/icons-material';
import { Skill } from '../../types/models/Skill';
import { useSkills } from '../../hooks/useSkills';

interface SkillCardProps {
  skill: Skill;
  isOwner?: boolean;
  categoryName?: string; // Optional prop für den Kategorienamen
  proficiencyLevelName?: string; // Optional prop für den Fertigkeitsstufennamen
  onEdit?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  isOwner = false,
  categoryName,
  proficiencyLevelName,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { removeSkill, categories, proficiencyLevels } = useSkills();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Kategorie und Fertigkeitsstufe aus den globalen Daten ermitteln, falls nicht explizit übergeben
  const resolvedCategoryName =
    categoryName ||
    categories.find((cat) => cat.id === skill.skillCategoryId)?.name ||
    'Unbekannte Kategorie';

  const resolvedProficiencyLevelName =
    proficiencyLevelName ||
    proficiencyLevels.find((level) => level.id === skill.proficiencyLevelId)
      ?.level ||
    'Unbekanntes Level';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/skills/edit/${skill.id}`);
    }
  };

  const handleDelete = async () => {
    handleMenuClose();
    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete();
      } else {
        const result = await removeSkill(skill.id);
        if (!result.success) {
          console.error(result.error);
        }
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect();
    } else {
      navigate(`/skills/${skill.id}`);
    }
  };

  // Truncate description if it's too long
  const truncateDescription = (text: string | undefined, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        position: 'relative',
        overflow: 'hidden',
        // Highlight card if it's owner's skill
        ...(isOwner && {
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            borderWidth: '0 40px 40px 0',
            borderStyle: 'solid',
            borderColor: `${alpha(theme.palette.primary.main, 0.2)} transparent`,
            zIndex: 1,
          },
        }),
      }}
    >
      {/* Category indicator at the top */}
      {resolvedCategoryName && (
        <Box
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            px: 2,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SkillIcon
            fontSize="small"
            sx={{ color: theme.palette.primary.main, mr: 1 }}
          />
          <Typography variant="caption" color="primary" fontWeight="medium">
            {resolvedCategoryName}
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '3.6rem',
            }}
          >
            {skill.name}
          </Typography>

          {/* Proficiency level and isOffering chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 2 }}>
            {resolvedProficiencyLevelName && (
              <Chip
                label={resolvedProficiencyLevelName}
                size="small"
                sx={{ mr: 1 }}
                color="primary"
                variant="outlined"
              />
            )}
            <Chip
              label={skill.isOffering ? 'Biete an' : 'Suche'}
              size="small"
              color={skill.isOffering ? 'success' : 'info'}
              sx={{ ml: 'auto' }}
            />
          </Box>

          {/* Description */}
          {skill.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 2,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minHeight: '4.5rem',
              }}
            >
              {truncateDescription(skill.description)}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 2,
          pb: 2,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={handleSelect}
          color="primary"
        >
          Details
        </Button>

        {isOwner && (
          <Box>
            <Tooltip title="Skill-Optionen">
              <IconButton
                aria-label="Skill-Optionen"
                onClick={handleMenuOpen}
                size="small"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleEdit} disabled={isDeleting}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                Bearbeiten
              </MenuItem>
              <MenuItem onClick={handleDelete} disabled={isDeleting}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Löschen
              </MenuItem>
            </Menu>
          </Box>
        )}
      </CardActions>
    </Card>
  );
};

export default SkillCard;
