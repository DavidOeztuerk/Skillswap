/**
 * SkillListItem - Horizontal Udemy-style skill card for list view
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ┌─────────┐  Skill Name                    ⭐ 4.5 (23)  ♡   │
 * │  │  IMAGE  │  Category • Proficiency Level                  │
 * │  │ 160x100 │  Description text truncated to 2 lines...      │
 * │  └─────────┘  👤 Owner Name  •  📍 Remote/In-Person          │
 * │               🏷️ tag1, tag2, tag3     [Angeboten/Gesucht]   │
 * └──────────────────────────────────────────────────────────────┘
 */

import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Videocam as VideocamIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Rating,
  useTheme,
  useMediaQuery,
  Skeleton,
} from '@mui/material';
import { getLocationTypeLabel, type Skill, type SkillLocationType } from '../types/Skill';

interface SkillListItemProps {
  skill: Skill;
  isOwner?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (skill: Skill) => void;
  onClick?: (skill: Skill) => void;
}

// Helper to parse tags from tagsJson (JSON string like '["tag1","tag2"]')
const parseTags = (tagsJson: string | undefined): string[] => {
  if (!tagsJson) return [];

  try {
    // First, try to parse as JSON array
    const parsed: unknown = JSON.parse(tagsJson);
    if (Array.isArray(parsed)) {
      // Filter to ensure all elements are strings
      const stringTags = parsed.filter((item): item is string => typeof item === 'string');
      return stringTags.slice(0, 3);
    }
    // If not an array, treat as comma-separated string
    return tagsJson.split(',').filter(Boolean).slice(0, 3);
  } catch {
    // If JSON parsing fails, treat as comma-separated string
    return tagsJson.split(',').filter(Boolean).slice(0, 3);
  }
};

// Sub-component: Skill Image/Thumbnail
const SkillThumbnail: React.FC<{ skill: Skill; isMobile: boolean }> = memo(
  ({ skill, isMobile }) => {
    const imageSize = isMobile ? { width: 100, height: 70 } : { width: 160, height: 100 };

    return (
      <Box
        sx={{
          ...imageSize,
          flexShrink: 0,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: skill.category.color ?? 'primary.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Category icon or placeholder */}
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          sx={{ color: 'white', fontWeight: 'bold', opacity: 0.9 }}
        >
          {skill.category.name.charAt(0) || 'S'}
        </Typography>

        {/* Offered/Requested badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            bgcolor: skill.isOffered ? 'primary.main' : 'secondary.main',
            color: 'white',
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.65rem',
            fontWeight: 'bold',
          }}
        >
          {skill.isOffered ? 'ANGEBOT' : 'GESUCHT'}
        </Box>
      </Box>
    );
  }
);

SkillThumbnail.displayName = 'SkillThumbnail';

// Sub-component: Rating and favorite
const RatingSection: React.FC<{
  rating: number;
  reviewCount: number;
  isFavorite: boolean;
  isOwner: boolean;
  isMobile: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}> = memo(({ rating, reviewCount, isFavorite, isOwner, isMobile, onToggleFavorite }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
    <Rating
      value={rating}
      readOnly
      size="small"
      precision={0.5}
      sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
    />
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
      {rating.toFixed(1)} ({reviewCount})
    </Typography>
    {!isOwner && (
      <IconButton
        size="small"
        onClick={onToggleFavorite}
        sx={{
          ml: 0.5,
          color: isFavorite ? 'primary.main' : 'text.secondary',
        }}
      >
        {isFavorite ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
      </IconButton>
    )}
  </Box>
));

RatingSection.displayName = 'RatingSection';

// Sub-component: Owner and Location info
const MetaInfo: React.FC<{
  ownerName: string | undefined;
  locationType: SkillLocationType | undefined;
  isMobile: boolean;
}> = memo(({ ownerName, locationType, isMobile }) => {
  const isRemote = locationType === 'remote' || !locationType;
  const locationLabel = getLocationTypeLabel(locationType ?? 'remote');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 1 : 2,
        flexWrap: 'wrap',
        color: 'text.secondary',
      }}
    >
      {ownerName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PersonIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">{ownerName}</Typography>
        </Box>
      ) : null}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isRemote ? (
          <VideocamIcon sx={{ fontSize: 14, color: 'info.main' }} />
        ) : (
          <LocationIcon sx={{ fontSize: 14, color: 'error.main' }} />
        )}
        <Typography variant="caption">{locationLabel}</Typography>
      </Box>
    </Box>
  );
});

MetaInfo.displayName = 'MetaInfo';

// Sub-component: Tags display
const TagsDisplay: React.FC<{ tags: string[] }> = memo(({ tags }) => {
  if (tags.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
      <TagIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      ))}
    </Box>
  );
});

TagsDisplay.displayName = 'TagsDisplay';

// Main component
const SkillListItem: React.FC<SkillListItemProps> = memo(
  ({ skill, isOwner = false, isFavorite = false, onToggleFavorite, onClick }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Memoized data
    const { rating, reviewCount, ownerName, tags } = useMemo(
      () => ({
        rating: skill.averageRating ?? 0,
        reviewCount: skill.reviewCount ?? 0,
        ownerName:
          skill.ownerFirstName && skill.ownerLastName
            ? `${skill.ownerFirstName} ${skill.ownerLastName}`
            : skill.ownerUserName,
        tags: parseTags(skill.tagsJson),
      }),
      [skill]
    );

    // Event handlers
    const handleClick = useCallback(() => {
      if (onClick) {
        onClick(skill);
      } else {
        void navigate(`/skills/${skill.id}`);
      }
    }, [onClick, navigate, skill]);

    const handleToggleFavorite = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(skill);
      },
      [onToggleFavorite, skill]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      },
      [handleClick]
    );

    return (
      <Paper
        component="article"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        elevation={1}
        sx={{
          display: 'flex',
          gap: isMobile ? 1.5 : 2,
          p: isMobile ? 1.5 : 2,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 3,
            bgcolor: 'action.hover',
          },
          '&:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          borderRadius: 1,
        }}
      >
        {/* Thumbnail */}
        <SkillThumbnail skill={skill} isMobile={isMobile} />

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Header: Title + Rating */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              flexWrap: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                component="h3"
                fontWeight="bold"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                }}
              >
                {skill.name}
              </Typography>
            </Box>

            <RatingSection
              rating={rating}
              reviewCount={reviewCount}
              isFavorite={isFavorite}
              isOwner={isOwner}
              isMobile={isMobile}
              onToggleFavorite={handleToggleFavorite}
            />
          </Box>

          {/* Category + Proficiency */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={skill.category.name}
              size="small"
              sx={{
                bgcolor: skill.category.color ?? 'primary.light',
                color: 'white',
                fontWeight: 500,
                height: 22,
                fontSize: '0.75rem',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {skill.proficiencyLevel.level}
            </Typography>
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: isMobile ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
              mt: 0.5,
            }}
          >
            {skill.description}
          </Typography>

          {/* Meta info: Owner + Location */}
          <MetaInfo ownerName={ownerName} locationType={skill.locationType} isMobile={isMobile} />

          {/* Tags */}
          {isMobile ? null : <TagsDisplay tags={tags} />}
        </Box>
      </Paper>
    );
  }
);

SkillListItem.displayName = 'SkillListItem';

// Skeleton loader for list item
export const SkillListItemSkeleton: React.FC<{ isMobile?: boolean }> = memo(
  ({ isMobile = false }) => (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        gap: isMobile ? 1.5 : 2,
        p: isMobile ? 1.5 : 2,
        borderRadius: 1,
      }}
    >
      <Skeleton
        variant="rectangular"
        width={isMobile ? 100 : 160}
        height={isMobile ? 70 : 100}
        sx={{ borderRadius: 1, flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="text" width="70%" height={28} />
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="100%" height={40} />
        <Skeleton variant="text" width="50%" height={16} />
      </Box>
    </Paper>
  )
);

SkillListItemSkeleton.displayName = 'SkillListItemSkeleton';

export default SkillListItem;
