import React, { useState, memo, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  MoreVert as MoreVertIcon,
  SwapHoriz as SwapIcon,
  School as LearnIcon,
  LocalOffer as OfferIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  CheckCircle as VerifiedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Rating,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Collapse,
  Stack,
  Divider,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Grid,
  alpha,
  type SxProps,
  type Theme,
} from '@mui/material';
import { usePerformance } from '../../../shared/hooks/usePerformance';
import { brandColors } from '../../../styles/tokens/colors';
import { spacing, componentSpacing } from '../../../styles/tokens/spacing';
import type { Skill } from '../types/Skill';

const cardBaseSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: 4,
    transform: 'translateY(-2px)',
  },
  position: 'relative',
  overflow: 'visible',
  borderRadius: spacing[2] / 8,
  padding: 0,
};

const titleSx: SxProps<Theme> = {
  wordBreak: 'break-word',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
};

const categoryChipSx: SxProps<Theme> = {
  bgcolor: 'primary.light',
  color: 'primary.dark',
  fontWeight: 'medium',
};

const touchTargetSx: SxProps<Theme> = {
  minWidth: { xs: 44, sm: 'auto' },
  minHeight: { xs: 44, sm: 'auto' },
};

const expandButtonSx: SxProps<Theme> = {
  ml: 'auto',
  minWidth: 'auto',
  px: 1,
};

const deleteMenuItemSx: SxProps<Theme> = {
  color: 'error.main',
};

const verifiedIconSx: SxProps<Theme> = {
  mt: 0.5,
  flexShrink: 0,
};

const actionButtonsTopSx: SxProps<Theme> = {
  mt: { xs: 1, sm: 0 },
};

interface SkillCardProps {
  skill: Skill;
  isOwner?: boolean;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skillId: string) => void;
  onBoost?: (skill: Skill) => void;
  onMatch?: (skill: Skill) => void;
  onToggleFavorite?: (skill: Skill) => void;
  isFavorite?: boolean;
  showMatchButton?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

// ============================================================================
// Sub-components to reduce cognitive complexity
// ============================================================================

interface StatusBadgeProps {
  isOffered: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = memo(({ isOffered }) => (
  <Box
    sx={{
      position: 'absolute',
      top: -spacing[1],
      right: { xs: spacing[1], sm: spacing[2] },
      bgcolor: isOffered ? brandColors.primary[500] : brandColors.secondary[500],
      color: 'white',
      px: { xs: spacing[1] / 8, sm: spacing[2] / 8 },
      py: componentSpacing.chip.paddingY / 8,
      borderRadius: spacing[2] / 8,
      fontSize: { xs: '0.7rem', sm: '0.75rem' },
      fontWeight: 'bold',
      boxShadow: 2,
      display: 'flex',
      alignItems: 'center',
      gap: componentSpacing.chip.paddingY / 8,
      zIndex: 1,
      maxWidth: { xs: 100, sm: 120 },
    }}
  >
    {isOffered ? <OfferIcon fontSize="small" /> : <LearnIcon fontSize="small" />}
    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
      {isOffered ? 'ANGEBOT' : 'GESUCHT'}
    </Box>
    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
      {isOffered ? 'ANGEBOT' : 'GESUCHT'}
    </Box>
  </Box>
));

StatusBadge.displayName = 'StatusBadge';

interface RatingDisplayProps {
  averageRating: number;
  totalReviews: number;
  isMobile: boolean;
}

const RatingDisplay: React.FC<RatingDisplayProps> = memo(
  ({ averageRating, totalReviews, isMobile }) => (
    <Box display="flex" alignItems="center" gap={1} sx={{ mb: { xs: 1, sm: 2 } }}>
      <Rating value={averageRating} readOnly size={isMobile ? 'small' : 'medium'} precision={0.5} />
      <Typography
        variant={isMobile ? 'caption' : 'body2'}
        color="text.secondary"
        sx={{ minWidth: isMobile ? 60 : 80 }}
      >
        {averageRating.toFixed(1)} ({totalReviews})
      </Typography>
    </Box>
  )
);

RatingDisplay.displayName = 'RatingDisplay';

interface MatchIndicatorsProps {
  isOwner: boolean;
  matchRequests: number;
  activeMatches: number;
}

const MatchIndicators: React.FC<MatchIndicatorsProps> = memo(
  ({ isOwner, matchRequests, activeMatches }) => {
    if (isOwner) return null;

    return (
      <Stack spacing={1} sx={{ mb: 2 }}>
        {matchRequests > 0 && (
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={matchRequests} color="primary" max={99}>
              <MessageIcon fontSize="small" color="action" />
            </Badge>
            <Typography variant="caption" color="text.secondary">
              {matchRequests} Anfrage{matchRequests === 1 ? '' : 'n'}
            </Typography>
          </Box>
        )}
        {activeMatches > 0 && (
          <Box display="flex" alignItems="center" gap={1}>
            <SwapIcon fontSize="small" color="success" />
            <Typography variant="caption" color="text.secondary">
              {activeMatches} aktive{activeMatches === 1 ? '' : 's'} Match
              {activeMatches === 1 ? '' : 'es'}
            </Typography>
          </Box>
        )}
      </Stack>
    );
  }
);

MatchIndicators.displayName = 'MatchIndicators';

interface OwnerStatsProps {
  isOwner: boolean;
  variant: 'default' | 'compact' | 'detailed';
  matchRequests: number;
  activeMatches: number;
  completionRate: number;
}

const OwnerStats: React.FC<OwnerStatsProps> = memo(
  ({ isOwner, variant, matchRequests, activeMatches, completionRate }) => {
    const theme = useTheme();

    if (!isOwner || variant === 'compact') return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Deine Statistik
        </Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption">Anfragen</Typography>
            <Chip label={matchRequests} size="small" color="primary" />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption">Aktive Matches</Typography>
            <Chip label={activeMatches} size="small" color="success" />
          </Box>
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption">Erfolgsrate</Typography>
              <Typography variant="caption" fontWeight="bold">
                {completionRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionRate}
              sx={{
                mt: 0.5,
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              }}
            />
          </Box>
        </Stack>
      </Box>
    );
  }
);

OwnerStats.displayName = 'OwnerStats';

interface DetailedInfoProps {
  showDetailedInfo: boolean;
  expanded: boolean;
  estimatedDurationMinutes: number | undefined;
  lastActive: string;
}

const DetailedInfo: React.FC<DetailedInfoProps> = memo(
  ({ showDetailedInfo, expanded, estimatedDurationMinutes, lastActive }) => {
    if (!showDetailedInfo) return null;

    return (
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Dauer: {estimatedDurationMinutes ?? 60} Min.
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Aktiv: {lastActive}
            </Typography>
          </Box>
        </Stack>
      </Collapse>
    );
  }
);

DetailedInfo.displayName = 'DetailedInfo';

interface SkillCardMenuProps {
  anchorEl: HTMLElement | null;
  isOwner: boolean;
  onClose: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}

const SkillCardMenu: React.FC<SkillCardMenuProps> = memo(
  ({ anchorEl, isOwner, onClose, onShare, onEdit, onDelete, onViewDetails }) => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      onClick={(e) => {
        e.stopPropagation();
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {!isOwner && (
        <MenuItem onClick={onShare}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Teilen</ListItemText>
        </MenuItem>
      )}
      {isOwner ? (
        <>
          <MenuItem onClick={onEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Bearbeiten</ListItemText>
          </MenuItem>
          <MenuItem onClick={onDelete} sx={deleteMenuItemSx}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Löschen</ListItemText>
          </MenuItem>
        </>
      ) : null}
      <MenuItem onClick={onViewDetails}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Details anzeigen</ListItemText>
      </MenuItem>
    </Menu>
  )
);

SkillCardMenu.displayName = 'SkillCardMenu';

interface MatchButtonProps {
  isOffered: boolean;
  isMobile: boolean;
  onMatch: (e: React.MouseEvent) => void;
}

const MatchButton: React.FC<MatchButtonProps> = memo(({ isOffered, isMobile, onMatch }) => (
  <Button
    fullWidth
    variant="contained"
    color={isOffered ? 'secondary' : 'primary'}
    startIcon={<SwapIcon />}
    onClick={onMatch}
    size={isMobile ? 'medium' : 'large'}
    sx={{
      fontWeight: 'bold',
      py: isMobile ? 1 : 1.25,
    }}
  >
    {isOffered ? 'Lernen anfragen' : 'Hilfe anbieten'}
  </Button>
));

MatchButton.displayName = 'MatchButton';

interface OwnerButtonsProps {
  isMobile: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onBoost?: (e: React.MouseEvent) => void;
}

const OwnerButtons: React.FC<OwnerButtonsProps> = memo(
  ({ isMobile, onEdit, onDelete, onBoost }) => (
    <Grid container spacing={1} width="100%">
      <Grid size={{ xs: onBoost ? 4 : 6 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onEdit}
          size={isMobile ? 'small' : 'medium'}
        >
          {isMobile ? 'Edit' : 'Bearbeiten'}
        </Button>
      </Grid>
      {onBoost ? (
        <Grid size={{ xs: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<TrendingIcon />}
            onClick={onBoost}
            size={isMobile ? 'small' : 'medium'}
          >
            Boost
          </Button>
        </Grid>
      ) : null}
      <Grid size={{ xs: onBoost ? 4 : 6 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
          size={isMobile ? 'small' : 'medium'}
        >
          Löschen
        </Button>
      </Grid>
    </Grid>
  )
);

OwnerButtons.displayName = 'OwnerButtons';

interface CardActionButtonsProps {
  isOwner: boolean;
  showMatchButton: boolean;
  isOffered: boolean;
  isMobile: boolean;
  onMatch: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onBoost?: (e: React.MouseEvent) => void;
}

const CardActionButtons: React.FC<CardActionButtonsProps> = memo(
  ({ isOwner, showMatchButton, isOffered, isMobile, onMatch, onEdit, onDelete, onBoost }) => {
    if (!isOwner && showMatchButton) {
      return <MatchButton isOffered={isOffered} isMobile={isMobile} onMatch={onMatch} />;
    }

    if (isOwner) {
      return (
        <OwnerButtons isMobile={isMobile} onEdit={onEdit} onDelete={onDelete} onBoost={onBoost} />
      );
    }

    return null;
  }
);

CardActionButtons.displayName = 'CardActionButtons';

interface ExpandButtonProps {
  showDetailedInfo: boolean;
  expanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

const ExpandButton: React.FC<ExpandButtonProps> = memo(
  ({ showDetailedInfo, expanded, onToggle }) => {
    if (!showDetailedInfo) return null;

    return (
      <Button
        size="small"
        onClick={onToggle}
        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={expandButtonSx}
      >
        {expanded ? 'Weniger' : 'Mehr'}
      </Button>
    );
  }
);

ExpandButton.displayName = 'ExpandButton';

interface CardHeaderProps {
  skill: Skill;
  isVerified: boolean;
  isMobile: boolean;
  isFavorite: boolean;
  isOwner: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
}

const CardHeader: React.FC<CardHeaderProps> = memo(
  ({ skill, isVerified, isMobile, isFavorite, isOwner, onToggleFavorite, onMenuOpen }) => (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      gap={1}
      flexDirection={isMobile ? 'column' : 'row'}
      mb={2}
    >
      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
          <Typography variant="h6" component="h3" fontWeight="bold" sx={titleSx}>
            {skill.name}
          </Typography>
          {isVerified ? (
            <Tooltip title="Verifizierter Skill">
              <VerifiedIcon fontSize="small" color="primary" sx={verifiedIconSx} />
            </Tooltip>
          ) : null}
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
          <Chip label={skill.category.name} size="small" sx={categoryChipSx} />
        </Box>

        {/* Owner Name */}
        {skill.ownerUserName != null && skill.ownerUserName !== '' && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <PersonIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary">
              {skill.ownerFirstName && skill.ownerLastName
                ? `${skill.ownerFirstName} ${skill.ownerLastName}`
                : skill.ownerUserName}
            </Typography>
          </Box>
        )}
      </Box>

      <Box display="flex" alignItems="center" gap={0.5} sx={actionButtonsTopSx}>
        {/* Only show favorite button for skills that are NOT owned by the current user */}
        {!isOwner && (
          <IconButton
            size={isMobile ? 'medium' : 'small'}
            onClick={onToggleFavorite}
            sx={{
              ...touchTargetSx,
              color: isFavorite ? 'primary.main' : 'text.secondary',
            }}
          >
            {isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        )}
        <IconButton size={isMobile ? 'medium' : 'small'} onClick={onMenuOpen} sx={touchTargetSx}>
          <MoreVertIcon />
        </IconButton>
      </Box>
    </Box>
  )
);

CardHeader.displayName = 'CardHeader';

const SkillCard: React.FC<SkillCardProps> = memo(
  ({
    skill,
    isOwner = false,
    onEdit,
    onDelete,
    onBoost,
    onMatch,
    onToggleFavorite,
    isFavorite = false,
    showMatchButton = true,
    variant = 'default',
  }) => {
    usePerformance('SkillCard', { skillId: skill.id, variant });

    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [expanded, setExpanded] = useState(false);

    // Event Handlers
    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleCardClick = useCallback(() => {
      void navigate(`/skills/${skill.id}`);
    }, [navigate, skill.id]);

    const handleMatch = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onMatch) {
          onMatch(skill);
        } else {
          void navigate(`/skills/${skill.id}?showMatchForm=true`);
        }
      },
      [onMatch, navigate, skill]
    );

    const handleToggleFavorite = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(skill);
      },
      [onToggleFavorite, skill]
    );

    const handleShare = useCallback(async () => {
      handleMenuClose();
      const shareUrl = `${window.location.origin}/skills/${skill.id}`;

      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: skill.name,
            text: skill.description,
            url: shareUrl,
          });
        } catch {
          // Share was cancelled, do nothing
        }
      } else {
        void navigator.clipboard.writeText(shareUrl);
      }
    }, [handleMenuClose, skill.name, skill.description, skill.id]);

    const toggleExpanded = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    }, []);

    // Memoized calculations
    const cardData = useMemo(() => {
      // Safe date parsing to avoid RangeError with invalid dates
      const getLastActiveText = (): string => {
        const dateValue = skill.lastActiveAt ?? skill.createdAt;
        if (!dateValue) return 'Unbekannt';

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return 'Unbekannt';

        return formatDistanceToNow(date, { addSuffix: true, locale: de });
      };

      return {
        matchRequests: skill.matchRequests ?? 0,
        activeMatches: skill.activeMatches ?? 0,
        completionRate: skill.completionRate ?? 0,
        averageRating: skill.averageRating ?? 0,
        totalReviews: skill.reviewCount ?? 0,
        isVerified: skill.isVerified ?? false,
        lastActive: getLastActiveText(),
      };
    }, [skill]);

    const {
      matchRequests,
      activeMatches,
      completionRate,
      averageRating,
      totalReviews,
      isVerified,
      lastActive,
    } = cardData;

    // Responsive configuration
    const responsiveConfig = useMemo(
      () => ({
        headerDirection: isMobile ? 'column' : ('row' as const),
        statsLayout: isMobile ? 'column' : ('row' as const),
        actionButtonSize: isMobile ? 'medium' : 'large',
        showCompactStats: variant === 'compact' || isMobile,
        showDetailedInfo: variant === 'detailed' && !isMobile,
      }),
      [isMobile, variant]
    );

    // Menu handlers for sub-component
    const handleMenuEdit = useCallback(() => {
      handleMenuClose();
      onEdit?.(skill);
    }, [handleMenuClose, onEdit, skill]);

    const handleMenuDelete = useCallback(() => {
      handleMenuClose();
      onDelete?.(skill.id);
    }, [handleMenuClose, onDelete, skill.id]);

    const handleViewDetails = useCallback(() => {
      handleMenuClose();
      void navigate(`/skills/${skill.id}`);
    }, [handleMenuClose, navigate, skill.id]);

    const handleCardEdit = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(skill);
      },
      [onEdit, skill]
    );

    const handleCardDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(skill.id);
      },
      [onDelete, skill.id]
    );

    const handleCardBoost = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onBoost?.(skill);
      },
      [onBoost, skill]
    );

    return (
      <Card sx={cardBaseSx} onClick={handleCardClick}>
        <StatusBadge isOffered={skill.isOffered} />

        <CardContent
          sx={{
            flex: 1,
            pt: componentSpacing.card.padding / 8,
            px: componentSpacing.card.padding / 8,
            pb: variant === 'compact' ? spacing[1] / 8 : componentSpacing.card.gap / 8,
            '&:last-child': {
              pb: variant === 'compact' ? spacing[1] / 8 : componentSpacing.card.gap / 8,
            },
          }}
        >
          {/* Header */}
          <CardHeader
            skill={skill}
            isVerified={isVerified}
            isMobile={isMobile}
            isFavorite={isFavorite}
            isOwner={isOwner}
            onToggleFavorite={handleToggleFavorite}
            onMenuOpen={handleMenuOpen}
          />

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'none' : variant === 'compact' ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.5,
            }}
          >
            {skill.description}
          </Typography>

          {/* Rating */}
          <RatingDisplay
            averageRating={averageRating}
            totalReviews={totalReviews}
            isMobile={isMobile}
          />

          {/* Match Activity */}
          <MatchIndicators
            isOwner={isOwner}
            matchRequests={matchRequests}
            activeMatches={activeMatches}
          />

          {/* Owner Stats */}
          <OwnerStats
            isOwner={isOwner}
            variant={variant}
            matchRequests={matchRequests}
            activeMatches={activeMatches}
            completionRate={completionRate}
          />

          {/* Detailed Info */}
          <DetailedInfo
            showDetailedInfo={responsiveConfig.showDetailedInfo}
            expanded={expanded}
            estimatedDurationMinutes={skill.estimatedDurationMinutes}
            lastActive={lastActive}
          />
        </CardContent>

        {/* Actions */}
        <CardActions
          sx={{
            p: componentSpacing.card.actionsPadding / 8,
            pt: variant === 'compact' ? 0 : spacing[1] / 8,
            gap: spacing[1] / 8,
          }}
        >
          <CardActionButtons
            isOwner={isOwner}
            showMatchButton={showMatchButton}
            isOffered={skill.isOffered}
            isMobile={isMobile}
            onMatch={handleMatch}
            onEdit={handleCardEdit}
            onDelete={handleCardDelete}
            onBoost={onBoost ? handleCardBoost : undefined}
          />
          <ExpandButton
            showDetailedInfo={responsiveConfig.showDetailedInfo}
            expanded={expanded}
            onToggle={toggleExpanded}
          />
        </CardActions>

        {/* Menu */}
        <SkillCardMenu
          anchorEl={anchorEl}
          isOwner={isOwner}
          onClose={handleMenuClose}
          onShare={handleShare}
          onEdit={handleMenuEdit}
          onDelete={handleMenuDelete}
          onViewDetails={handleViewDetails}
        />
      </Card>
    );
  }
);

SkillCard.displayName = 'SkillCard';

export default SkillCard;
