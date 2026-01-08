/**
 * SkillDetailSidebar Component
 *
 * Displays the sidebar with owner info, skill details, and CTAs.
 */

import React, { useCallback } from 'react';
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
import { useNavigation } from '../../../../shared/hooks/useNavigation';
import { getLocationTypeLabel, formatSkillSchedule } from '../../types/Skill';
import type { Skill } from '../../types/Skill';
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

// Helper to format hourly rate
const formatHourlyRate = (rate: number | undefined, currency: string | undefined): string => {
  if (rate != null && rate > 0 && currency) {
    return `${rate} ${currency}/Std.`;
  }
  return 'Bezahlung';
};

// Helper to format location address
const formatLocationAddress = (
  city?: string,
  postalCode?: string,
  country?: string,
  maxDistance?: number
): string => {
  const parts = [city, postalCode, country].filter(Boolean).join(', ');
  if (maxDistance != null && maxDistance > 0) {
    return `${parts} • max. ${maxDistance} km`;
  }
  return parts;
};

// Sub-component: Owner Card
const OwnerCard: React.FC<{
  skill: Skill;
  skillOwner: SkillDetailSidebarProps['skillOwner'];
}> = ({ skill, skillOwner }) => {
  const { navigateToProfile } = useNavigation();

  const handleViewProfile = useCallback(async () => {
    if (skill.userId) {
      // navigateToProfile übergibt automatisch den Skill-Kontext
      await navigateToProfile(skill.userId, {
        skillName: skill.name,
        userName: skillOwner.name,
      });
    }
  }, [navigateToProfile, skill.userId, skill.name, skillOwner.name]);

  return (
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
      <Button variant="outlined" fullWidth onClick={handleViewProfile}>
        Profil ansehen
      </Button>
    </Paper>
  );
};

// Sub-component: Skill Info Card
const SkillInfoCard: React.FC<{
  skill: SkillDetailSidebarProps['skill'];
}> = ({ skill }) => {
  const isPayment = skill.exchangeType === 'payment';

  return (
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
              {isPayment ? (
                <>
                  <PaymentsIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  <Typography variant="body1">
                    {formatHourlyRate(skill.hourlyRate, skill.currency)}
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
  );
};

// Sub-component: Location & Schedule Card
const LocationScheduleCard: React.FC<{
  skill: SkillDetailSidebarProps['skill'];
}> = ({ skill }) => {
  const isRemote = skill.locationType === 'remote';
  const hasPhysicalLocation =
    (skill.locationType === 'in_person' || skill.locationType === 'both') &&
    Boolean(skill.locationCity);
  const hasSessionInfo =
    (skill.sessionDurationMinutes != null && skill.sessionDurationMinutes > 0) ||
    (skill.totalSessions != null && skill.totalSessions > 0);
  const hasPreferredDays = skill.preferredDays && skill.preferredDays.length > 0;
  const hasPreferredTimes = skill.preferredTimes && skill.preferredTimes.length > 0;

  return (
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
          {isRemote ? (
            <VideocamIcon sx={{ fontSize: 18, color: 'info.main', mt: 0.3 }} />
          ) : (
            <LocationIcon sx={{ fontSize: 18, color: 'error.main', mt: 0.3 }} />
          )}
          <Box>
            <Typography variant="body1">
              {getLocationTypeLabel(skill.locationType ?? 'remote')}
            </Typography>
            {hasPhysicalLocation ? (
              <Typography variant="body2" color="text.secondary">
                {formatLocationAddress(
                  skill.locationCity,
                  skill.locationPostalCode,
                  skill.locationCountry,
                  skill.maxDistanceKm
                )}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>

      {/* Schedule */}
      {hasSessionInfo ? (
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
      {hasPreferredDays ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Bevorzugte Tage
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {skill.preferredDays?.map((day) => (
              <Chip key={day} label={getDayLabel(day)} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      ) : null}

      {/* Preferred Times */}
      {hasPreferredTimes ? (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Bevorzugte Zeiten
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {skill.preferredTimes?.map((time) => (
              <Chip key={time} label={getTimeLabel(time)} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      ) : null}
    </Paper>
  );
};

// Sub-component: CTA Card for non-owners
const NonOwnerCTACard: React.FC<{
  skill: SkillDetailSidebarProps['skill'];
  isAuthenticated: boolean;
  isMatchmakingLoading: boolean;
  onCreateMatch: () => void;
}> = ({ skill, isAuthenticated, isMatchmakingLoading, onCreateMatch }) => {
  const buttonText = isAuthenticated
    ? skill.isOffered
      ? 'Lernen anfragen'
      : 'Hilfe anbieten'
    : 'Einloggen um Match anzufragen';

  return (
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
        {buttonText}
      </LoadingButton>
    </Paper>
  );
};

// Sub-component: Owner Actions Card
const OwnerActionsCard: React.FC<{
  canUpdateOwnSkill: boolean;
  canDeleteOwnSkill: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ canUpdateOwnSkill, canDeleteOwnSkill, onEdit, onDelete }) => (
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
);

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
}) => {
  const showOwnerActions = isOwner && (canUpdateOwnSkill || canDeleteOwnSkill);

  return (
    <>
      {/* Owner card - only for non-owners */}
      {isOwner ? null : <OwnerCard skill={skill} skillOwner={skillOwner} />}

      {/* Skill info card */}
      <SkillInfoCard skill={skill} />

      {/* Location & Schedule card */}
      <LocationScheduleCard skill={skill} />

      {/* CTA card for non-owners */}
      {isOwner ? null : (
        <NonOwnerCTACard
          skill={skill}
          isAuthenticated={isAuthenticated}
          isMatchmakingLoading={isMatchmakingLoading}
          onCreateMatch={onCreateMatch}
        />
      )}

      {/* Owner actions card */}
      {showOwnerActions ? (
        <OwnerActionsCard
          canUpdateOwnSkill={canUpdateOwnSkill}
          canDeleteOwnSkill={canDeleteOwnSkill}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
    </>
  );
};

export default SkillDetailSidebar;
