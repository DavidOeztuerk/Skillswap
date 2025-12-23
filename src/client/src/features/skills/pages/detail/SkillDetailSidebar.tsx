/**
 * SkillDetailSidebar Component
 *
 * Displays the sidebar with owner info, skill details, and CTAs.
 */

import React from 'react';
import {
  Person as PersonIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Box, Typography, Paper, Button, Avatar, Rating } from '@mui/material';
import LoadingButton from '../../../../shared/components/ui/LoadingButton';
import type { SkillDetailSidebarProps } from '../../types/types';

export const SkillDetailSidebar: React.FC<SkillDetailSidebarProps> = ({
  skill,
  skillOwner,
  isOwner,
  isAuthenticated,
  canUpdateOwnSkill,
  canDeleteOwnSkill,
  isMatchmakingLoading,
  onCreateMatch,
  onEdit,
  onDelete,
}) => (
  <>
    {/* Owner card - only for non-owners */}
    {!isOwner && (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Anbieter
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56 }} src={skillOwner.avatar}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1">{skillOwner.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Mitglied seit {skillOwner.memberSince}
            </Typography>
            <Rating value={skillOwner.rating} readOnly size="small" />
          </Box>
        </Box>
        <Button variant="outlined" fullWidth>
          Profil ansehen
        </Button>
      </Paper>
    )}

    {/* Skill info card */}
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Skill-Details
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Kategorie
        </Typography>
        <Typography variant="body1">{skill.category.name || 'Keine Kategorie'}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Fertigkeitsstufe
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">{skill.proficiencyLevel.level || 'Keine Angabe'}</Typography>
          {skill.proficiencyLevel.rank && skill.proficiencyLevel.rank > 0 ? (
            <Box sx={{ display: 'flex' }}>
              {Array.from({ length: skill.proficiencyLevel.rank }, (_, i) => (
                <StarIcon key={i} sx={{ fontSize: 16, color: 'primary.main' }} />
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Typ
        </Typography>
        <Typography variant="body1">
          {skill.isOffered ? 'Wird angeboten' : 'Wird gesucht'}
        </Typography>
      </Box>
    </Paper>

    {/* CTA card for non-owners */}
    {!isOwner && (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Interessiert?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {skill.isOffered
            ? 'Möchtest du diesen Skill lernen? Erstelle eine Match-Anfrage!'
            : 'Kannst du bei diesem Skill helfen? Biete deine Hilfe an!'}
        </Typography>
        <LoadingButton
          variant="contained"
          color="primary"
          fullWidth
          onClick={onCreateMatch}
          startIcon={<MessageIcon />}
          loading={isMatchmakingLoading}
        >
          {isAuthenticated
            ? skill.isOffered
              ? 'Lernen anfragen'
              : 'Hilfe anbieten'
            : 'Einloggen um Match anzufragen'}
        </LoadingButton>
      </Paper>
    )}

    {/* Owner actions card */}
    {isOwner && (canUpdateOwnSkill || canDeleteOwnSkill) ? (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dein Skill
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Dies ist dein eigener Skill. Du kannst ihn bearbeiten oder löschen.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {canUpdateOwnSkill ? (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={onEdit}
              startIcon={<EditIcon />}
            >
              Bearbeiten
            </Button>
          ) : null}
          {canDeleteOwnSkill ? (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={onDelete}
              startIcon={<DeleteIcon />}
            >
              Löschen
            </Button>
          ) : null}
        </Box>
      </Paper>
    ) : null}
  </>
);

export default SkillDetailSidebar;
