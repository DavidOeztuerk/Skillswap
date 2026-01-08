/**
 * SkillDetailHeader Component
 *
 * Displays the skill header with title, chips, rating, and action buttons.
 */

import React from 'react';
import {
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Box, Typography, Chip, Rating, IconButton, Tooltip } from '@mui/material';
import type { SkillDetailHeaderProps } from '../../types/types';

export const SkillDetailHeader: React.FC<SkillDetailHeaderProps> = ({
  skill,
  isOwner,
  isFavorite,
  canUpdateOwnSkill,
  canDeleteOwnSkill,
  onBookmark,
  onShare,
  onEdit,
  onDelete,
}) => {
  const averageRating = skill.averageRating ?? 0;
  const reviewCount = skill.reviewCount ?? 0;
  const categoryId = skill.category.id;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 2,
      }}
    >
      <Box sx={{ flex: 1 }}>
        {/* Chips row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip
            label={skill.isOffered ? 'Angeboten' : 'Gesucht'}
            color={skill.isOffered ? 'success' : 'secondary'}
            size="small"
          />
          {categoryId.length > 0 && (
            <Chip label={skill.category.name} variant="outlined" size="small" />
          )}
          {isOwner ? (
            <Chip label="Mein Skill" color="primary" size="small" variant="outlined" />
          ) : null}
        </Box>

        {/* Title */}
        <Typography variant="h4" component="h1" gutterBottom>
          {skill.name}
        </Typography>

        {/* Rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Rating value={averageRating} readOnly precision={0.5} />
          <Typography variant="body2" color="text.secondary">
            {averageRating.toFixed(1)} ({reviewCount} Bewertungen)
          </Typography>
        </Box>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Only show favorite button for skills that are NOT owned by the current user */}
        {!isOwner && (
          <Tooltip title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>
            <IconButton onClick={onBookmark}>
              {isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Teilen">
          <IconButton onClick={onShare}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
        {isOwner && canUpdateOwnSkill ? (
          <Tooltip title="Bearbeiten">
            <IconButton onClick={onEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {isOwner && canDeleteOwnSkill ? (
          <Tooltip title="Löschen">
            <IconButton onClick={onDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    </Box>
  );
};

export default SkillDetailHeader;
