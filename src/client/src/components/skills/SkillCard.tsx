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
} from '@mui/icons-material';

interface SkillCategory {
  id: string;
  name: string;
}

interface ProficiencyLevel {
  id: string;
  level: string;
  rank: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  isOffering: boolean;
  skillCategoryId: string;
  proficiencyLevelId: string;
  category?: SkillCategory;
  proficiencyLevel?: ProficiencyLevel;
}

interface SkillCardProps {
  skill: Skill;
  onEdit: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
  onViewDetails: (skill: Skill) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Menu open/close
  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Edit/Delete
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

  // Click auf gesamte Card → Detailanzeige
  const handleCardClick = () => {
    onViewDetails(skill);
  };

  const getProficiencyColor = () => {
    if (!skill.proficiencyLevel) return theme.palette.primary.main;
    switch (skill.proficiencyLevel.rank) {
      case 1:
        return theme.palette.success.main;
      case 2:
        return theme.palette.info.main;
      case 3:
        return theme.palette.warning.main;
      case 4:
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={handleCardClick}
    >
      <Box
        sx={{
          height: 140,
          bgcolor: skill.category
            ? `rgba(${
                parseInt(skill.category.id.slice(0, 2), 16) || 0
              }, ${
                parseInt(skill.category.id.slice(2, 4), 16) || 0
              }, ${
                parseInt(skill.category.id.slice(4, 6), 16) || 120
              }, 0.2)`
            : 'rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Typography variant="h3" sx={{ opacity: 0.5 }}>
          {skill.name.charAt(0).toUpperCase()}
        </Typography>

        {/* Offering/Seeking-Chip */}
        <Chip
          label={skill.isOffering ? 'Angeboten' : 'Gesucht'}
          color={skill.isOffering ? 'success' : 'secondary'}
          size="small"
          sx={{ position: 'absolute', top: 8, left: 8 }}
        />

        {/* Menü-Button */}
        <IconButton
          aria-label="Optionen"
          onClick={handleMenuClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            },
          }}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id={`skill-menu-${skill.id}`}
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          PaperProps={{ onClick: (e: { stopPropagation: () => unknown; }) => e.stopPropagation() }}
        >
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Bearbeiten
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleDelete}
            sx={{ color: theme.palette.error.main }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Löschen
          </MenuItem>
        </Menu>
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Typography gutterBottom variant="h6" sx={{ fontWeight: 'bold' }}>
            {skill.name}
          </Typography>
          {skill.proficiencyLevel && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {[...Array(5)].map((_, index) =>
                skill.proficiencyLevel && index < skill.proficiencyLevel.rank ? (
                  <StarIcon
                    key={index}
                    fontSize="small"
                    sx={{ color: getProficiencyColor() }}
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

        {skill.category && (
          <Chip
            label={skill.category.name}
            size="small"
            variant="outlined"
            sx={{ mb: 1.5 }}
          />
        )}
        {skill.proficiencyLevel && (
          <Chip
            label={skill.proficiencyLevel.level}
            size="small"
            sx={{
              ml: skill.category ? 1 : 0,
              mb: 1.5,
              bgcolor: getProficiencyColor(),
              color: 'white',
            }}
          />
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {skill.description || 'Keine Beschreibung vorhanden.'}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(skill);
          }}
        >
          Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default SkillCard;
