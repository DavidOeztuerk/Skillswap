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
  LocationOn as LocationIcon,
  Videocam as VideocamIcon,
  Schedule as ScheduleIcon,
  Payments as PaymentsIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { Box, Typography, Paper, Button, Avatar, Rating, Chip, Divider } from '@mui/material';
import LoadingButton from '../../../../shared/components/ui/LoadingButton';
import { getLocationTypeLabel, formatSkillSchedule } from '../../types/Skill';
import type { SkillDetailSidebarProps } from '../../types/types';

// Helper function to get German day label
const getDayLabel = (day: string): string => {
  const dayLabels: Record<string, string> = {
    monday: 'Mo',
    tuesday: 'Di',
    wednesday: 'Mi',
    thursday: 'Do',
    friday: 'Fr',
    saturday: 'Sa',
    sunday: 'So',
  };
  return dayLabels[day.toLowerCase()] ?? day;
};

// Helper function to get German time label
const getTimeLabel = (time: string): string => {
  const timeLabels: Record<string, string> = {
    morning: 'Morgens',
    afternoon: 'Nachmittags',
    evening: 'Abends',
  };
  return timeLabels[time.toLowerCase()] ?? time;
};

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

      {/* Exchange Type */}
      {skill.exchangeType ? (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Austausch
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {skill.exchangeType === 'payment' ? (
                <>
                  <PaymentsIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  <Typography variant="body1">
                    {skill.hourlyRate && skill.currency
                      ? `${skill.hourlyRate} ${skill.currency}/Std.`
                      : 'Bezahlung'}
                  </Typography>
                </>
              ) : (
                <>
                  <SwapIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body1">Skill-Tausch</Typography>
                </>
              )}
            </Box>
          </Box>
        </>
      ) : null}
    </Paper>

    {/* Location & Schedule card */}
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ort & Zeit
      </Typography>

      {/* Location */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Standort
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {skill.locationType === 'remote' ? (
            <VideocamIcon sx={{ fontSize: 18, color: 'info.main', mt: 0.3 }} />
          ) : (
            <LocationIcon sx={{ fontSize: 18, color: 'error.main', mt: 0.3 }} />
          )}
          <Box>
            <Typography variant="body1">
              {getLocationTypeLabel(skill.locationType ?? 'remote')}
            </Typography>
            {(skill.locationType === 'in_person' || skill.locationType === 'both') &&
            skill.locationCity ? (
              <Typography variant="body2" color="text.secondary">
                {[skill.locationCity, skill.locationPostalCode, skill.locationCountry]
                  .filter(Boolean)
                  .join(', ')}
                {skill.maxDistanceKm && skill.maxDistanceKm > 0 ? (
                  <> • max. {skill.maxDistanceKm} km</>
                ) : null}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>

      {/* Schedule */}
      {skill.sessionDurationMinutes || skill.totalSessions ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Sessions
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body1">
              {formatSkillSchedule(skill) || `${skill.sessionDurationMinutes ?? 60} min`}
            </Typography>
          </Box>
        </Box>
      ) : null}

      {/* Preferred Days */}
      {skill.preferredDays && skill.preferredDays.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Bevorzugte Tage
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {skill.preferredDays.map((day) => (
              <Chip key={day} label={getDayLabel(day)} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      ) : null}

      {/* Preferred Times */}
      {skill.preferredTimes && skill.preferredTimes.length > 0 ? (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Bevorzugte Zeiten
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {skill.preferredTimes.map((time) => (
              <Chip key={time} label={getTimeLabel(time)} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      ) : null}
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
