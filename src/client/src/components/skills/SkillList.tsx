// src/components/skills/SkillList.tsx
import React from 'react';
import { Box, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import SkillCard from './SkillCard';
import { Skill } from '../../types/models/Skill';

interface SkillListProps {
  skills: Skill[];
  loading: boolean;
  errors?: string[];
  isOwnerView?: boolean;
  showMatchButtons?: boolean;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  onViewSkillDetails: (skill: Skill) => void;
  onMatchSkill?: (skill: Skill) => void;
  // FAVORITES
  favoriteSkillIds?: string[];
  isFavorite?: (skillId: string) => boolean;
  onToggleFavorite?: (skill: Skill) => void;
}

const SkillList: React.FC<SkillListProps> = ({
  skills,
  loading,
  errors,
  isOwnerView = false,
  showMatchButtons = false,
  onEditSkill,
  onDeleteSkill,
  onViewSkillDetails,
  onMatchSkill,
  // favoriteSkillIds,
  isFavorite,
  onToggleFavorite,
}) => {
  console.log('📋 SkillList render:', {
    skillsCount: skills.length,
    loading,
    hasErrors: !!errors?.length,
    isOwnerView,
    showMatchButtons,
    skills: skills.map((s) =>
      s ? { skillId: s.skillId, name: s.name } : 'undefined skill'
    ),
  });

  // Filter out any undefined or null skills
  const validSkills = skills.filter(
    (skill) => skill && (skill.skillId || skill.skillId) && skill.name
  );

  if (validSkills.length !== skills.length) {
    console.warn('⚠️ Found invalid skills in list:', {
      total: skills.length,
      valid: validSkills.length,
      invalid: skills.length - validSkills.length,
    });
  }

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

  if (errors && errors.length > 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="error" variant="filled">
          <Typography variant="h6" gutterBottom>
            Es ist ein Fehler aufgetreten
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            {errors.map((error, index) => (
              <li key={index}>
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
    <Grid container spacing={3}>
      {validSkills.map((skill) => (
        <Grid key={skill.skillId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <SkillCard
            skill={skill}
            isOwner={isOwnerView}
            showMatchButton={showMatchButtons && !isOwnerView}
            onEdit={onEditSkill}
            onDelete={onDeleteSkill}
            onViewDetails={onViewSkillDetails}
            onMatch={onMatchSkill}
            // FAVORITES
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default SkillList;