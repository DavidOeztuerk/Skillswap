/**
 * SkillReviewsSection Component
 *
 * Displays the reviews section for a skill.
 */

import React from 'react';
import { School as SchoolIcon } from '@mui/icons-material';
import { Box, Typography, Paper } from '@mui/material';
import type { SkillReviewsSectionProps } from '../../types/types';

export const SkillReviewsSection: React.FC<SkillReviewsSectionProps> = ({
  reviewCount,
  isOwner,
}) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      Bewertungen ({reviewCount})
    </Typography>

    {reviewCount === 0 ? (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Noch keine Bewertungen vorhanden
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isOwner
            ? 'Dein Skill wurde noch nicht bewertet.'
            : 'Sei der erste, der diesen Skill bewertet!'}
        </Typography>
      </Box>
    ) : (
      <Typography variant="body2" color="text.secondary">
        Bewertungen werden hier angezeigt, sobald sie verfügbar sind.
      </Typography>
    )}
  </Paper>
);

export default SkillReviewsSection;
