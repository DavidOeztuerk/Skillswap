// src/components/skills/SkillCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  School as SchoolIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EmojiObjects as SkillIcon,
} from '@mui/icons-material';
import { Skill, SkillCategory } from '../../types/models/Skill';
import { ProficiencyLevel, UserSkill } from '../../types/models/UserSkill';

interface SkillCardProps {
  skill: Skill | UserSkill;
  isUserSkill?: boolean;
  onAddClick?: (skill: Skill) => void;
  onEditClick?: (userSkill: UserSkill | null) => void;
  onRemoveClick?: (userSkill: UserSkill | null) => void;
  onTeachClick?: (userSkill: UserSkill) => void;
  onLearnClick?: (userSkill: UserSkill) => void;
}

/**
 * Karte zur Anzeige eines Skills mit verschiedenen Aktionen
 */
const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  isUserSkill = false,
  onAddClick,
  onEditClick,
  onRemoveClick,
  onTeachClick,
  onLearnClick,
}) => {
  const theme = useTheme();

  // Bestimme, ob es sich um einen UserSkill oder einen Skill handelt
  const userSkill = isUserSkill ? (skill as UserSkill) : null;
  const basicSkill = isUserSkill
    ? (skill as UserSkill).skill
    : (skill as Skill);

  // Hilfsfunktionen für Styling und Labels
  const getCategoryColor = (category: SkillCategory): string => {
    switch (category) {
      case 'Programming':
        return theme.palette.info.main;
      case 'Language':
        return theme.palette.success.main;
      case 'Music':
        return theme.palette.secondary.main;
      case 'Art':
        return theme.palette.warning.main;
      case 'Science':
        return theme.palette.primary.main;
      case 'Math':
        return theme.palette.error.main;
      case 'Business':
        return theme.palette.info.dark;
      default:
        return theme.palette.grey[500];
    }
  };

  const getLevelColor = (level: ProficiencyLevel): string => {
    switch (level) {
      case 'Beginner':
        return theme.palette.success.light;
      case 'Intermediate':
        return theme.palette.success.main;
      case 'Advanced':
        return theme.palette.warning.main;
      case 'Expert':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getLevelLabel = (level: ProficiencyLevel): string => {
    switch (level) {
      case 'Beginner':
        return 'Anfänger';
      case 'Intermediate':
        return 'Fortgeschritten';
      case 'Advanced':
        return 'Sehr erfahren';
      case 'Expert':
        return 'Experte';
      default:
        return level;
    }
  };

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip
            label={basicSkill.category}
            size="small"
            sx={{
              bgcolor: getCategoryColor(basicSkill.category),
              color: 'white',
              fontWeight: 'medium',
            }}
            icon={<SkillIcon style={{ color: 'white' }} />}
          />
          {userSkill && (
            <Chip
              label={getLevelLabel(userSkill.proficiencyLevel)}
              size="small"
              sx={{
                bgcolor: getLevelColor(userSkill.proficiencyLevel),
                color: 'white',
                fontWeight: 'medium',
              }}
            />
          )}
        </Box>

        <Typography variant="h6" component="h2" gutterBottom>
          {basicSkill.name}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {basicSkill.description}
        </Typography>

        {userSkill && userSkill.description && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.primary">
              <strong>Meine Erfahrung:</strong> {userSkill.description}
            </Typography>
          </>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {isUserSkill ? (
          // Aktionen für User-Skills
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              {userSkill?.isTeachable && onTeachClick && (
                <Tooltip title="Als Lehrer:in anbieten">
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<SchoolIcon />}
                    onClick={() => onTeachClick(userSkill)}
                  >
                    Lehren
                  </Button>
                </Tooltip>
              )}

              {userSkill?.isLearnable && onLearnClick && (
                <Tooltip title="Lehrer:in finden">
                  <Button
                    size="small"
                    color="secondary"
                    onClick={() => onLearnClick(userSkill)}
                  >
                    Lernen
                  </Button>
                </Tooltip>
              )}
            </Box>

            <Box>
              {onEditClick && (
                <Tooltip title="Skill bearbeiten">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEditClick(userSkill)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}

              {onRemoveClick && (
                <Tooltip title="Skill entfernen">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onRemoveClick(userSkill)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        ) : (
          // Aktionen für nicht-User-Skills
          onAddClick && (
            <Button
              size="small"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => onAddClick(basicSkill)}
              fullWidth
              variant="outlined"
            >
              Zu meinen Skills hinzufügen
            </Button>
          )
        )}
      </CardActions>
    </Card>
  );
};

export default SkillCard;
