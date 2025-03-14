import React from 'react';
import Grid from '@mui/material/Grid2';
import { Box, Typography, CircularProgress } from '@mui/material';
import SkillCard from './SkillCard';
import { Skill } from '../../types/models/Skill';

interface SkillListProps {
  skills: Skill[];
  loading: boolean;
  error?: string;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  onViewSkillDetails: (skill: Skill) => void;
}

const SkillList: React.FC<SkillListProps> = ({
  skills,
  loading,
  error,
  onEditSkill,
  onDeleteSkill,
  onViewSkillDetails,
}) => {
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
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Es ist ein Fehler aufgetreten
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  if (skills.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Keine Skills gefunden
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Versuche, die Suchkriterien zu ändern oder einen neuen Skill
          anzulegen.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {skills.map((skill) => (
        <Grid key={skill.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <SkillCard
            skill={skill}
            onEdit={onEditSkill}
            onDelete={onDeleteSkill}
            onViewDetails={onViewSkillDetails}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default SkillList;
