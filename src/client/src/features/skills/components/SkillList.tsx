import React, { memo, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import SkillCard from './SkillCard';
import type { Skill } from '../types/Skill';

interface SkillListProps {
  skills: Skill[] | undefined;
  loading: boolean;
  errors?: string[];
  isOwnerView?: boolean;
  showMatchButtons?: boolean;
  onEditSkill?: (skill: Skill) => void;
  onDeleteSkill?: (skillId: string) => void;
  onMatchSkill?: (skill: Skill) => void;
  // favoriteSkillIds?: string[];
  isFavorite?: (skillId: string) => boolean;
  onToggleFavorite?: (skill: Skill) => void;
}

const SkillList: React.FC<SkillListProps> = memo(
  ({
    skills,
    loading,
    errors,
    isOwnerView = false,
    showMatchButtons = false,
    onEditSkill,
    onDeleteSkill,
    onMatchSkill,
    // favoriteSkillIds,
    isFavorite,
    onToggleFavorite,
  }) => {
    const handleEditSkill = useCallback(
      (skill: Skill) => {
        onEditSkill?.(skill);
      },
      [onEditSkill]
    );

    const handleDeleteSkill = useCallback(
      (skillId: string) => {
        onDeleteSkill?.(skillId);
      },
      [onDeleteSkill]
    );

    const handleMatchSkill = useCallback(
      (skill: Skill) => {
        onMatchSkill?.(skill);
      },
      [onMatchSkill]
    );

    const handleToggleFavorite = useCallback(
      (skill: Skill) => {
        onToggleFavorite?.(skill);
      },
      [onToggleFavorite]
    );

    const validSkills = useMemo(() => skills ?? [], [skills]);

    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      );
    }

    if (errors !== undefined && errors.length > 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error" variant="filled">
            <Typography variant="h6" gutterBottom>
              Es ist ein Fehler aufgetreten
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              {errors.map((error) => (
                <li key={error}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        </Box>
      );
    }

    if (validSkills.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom sx={{ opacity: 0.7 }}>
            {isOwnerView ? 'Keine eigenen Skills gefunden' : 'Keine Skills gefunden'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {isOwnerView
              ? 'Du hast noch keine Skills erstellt. Erstelle deinen ersten Skill!'
              : 'Versuche, die Suchkriterien zu ändern oder schaue später wieder vorbei.'}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid
        container
        spacing={{ xs: 2, sm: 3, md: 3 }}
        sx={{
          '& .MuiGrid-item': {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {validSkills.map((skill) => (
          <Grid
            key={skill.id}
            size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 3 }}
            sx={{ display: 'flex' }}
          >
            <SkillCard
              skill={skill}
              isOwner={isOwnerView}
              showMatchButton={showMatchButtons ? !isOwnerView : undefined}
              onEdit={handleEditSkill}
              onDelete={handleDeleteSkill}
              onMatch={handleMatchSkill}
              isFavorite={isFavorite?.(skill.id) ?? false}
              onToggleFavorite={handleToggleFavorite}
            />
          </Grid>
        ))}
      </Grid>
    );
  }
);

SkillList.displayName = 'SkillList';

export default SkillList;
