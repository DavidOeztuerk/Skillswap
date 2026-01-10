import React, { memo, useCallback, useMemo } from 'react';
import { Box, Typography, Alert, Stack } from '@mui/material';
import SkillListItem, { SkillListItemSkeleton } from './SkillListItem';
import type { Skill } from '../types/Skill';

interface SkillListProps {
  skills: Skill[] | undefined;
  loading: boolean;
  errors?: string[];
  isOwnerView?: boolean;
  isFavorite?: (skillId: string) => boolean;
  isSkillBoosted?: (skillId: string) => boolean;
  onToggleFavorite?: (skill: Skill) => void;
  onEditSkill?: (skill: Skill) => void;
  onDeleteSkill?: (skillId: string) => void;
  onBoostSkill?: (skill: Skill) => void;
}

const SkillList: React.FC<SkillListProps> = memo(
  ({
    skills,
    loading,
    errors,
    isOwnerView = false,
    isFavorite,
    isSkillBoosted,
    onToggleFavorite,
    onBoostSkill,
  }) => {
    const handleToggleFavorite = useCallback(
      (skill: Skill) => {
        onToggleFavorite?.(skill);
      },
      [onToggleFavorite]
    );

    const handleBoost = useCallback(
      (skill: Skill) => {
        onBoostSkill?.(skill);
      },
      [onBoostSkill]
    );

    const validSkills = useMemo(() => skills ?? [], [skills]);

    // Loading state: Show skeleton loaders
    if (loading) {
      return (
        <Stack spacing={2}>
          {Array.from({ length: 6 }, (_, i) => (
            <SkillListItemSkeleton key={i} />
          ))}
        </Stack>
      );
    }

    // Error state
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

    // Empty state
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

    // List layout: Horizontal Udemy-style items stacked vertically
    return (
      <Stack spacing={2}>
        {validSkills.map((skill) => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            isOwner={isOwnerView}
            isFavorite={isFavorite?.(skill.id) ?? false}
            isBoosted={isSkillBoosted?.(skill.id) ?? skill.isCurrentlyBoosted ?? false}
            onToggleFavorite={handleToggleFavorite}
            onBoost={
              isOwnerView && onBoostSkill && !isSkillBoosted?.(skill.id) ? handleBoost : undefined
            }
          />
        ))}
      </Stack>
    );
  }
);

SkillList.displayName = 'SkillList';

export default SkillList;
