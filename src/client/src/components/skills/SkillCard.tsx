import React, { useState, memo, useCallback, useMemo } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
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
} from '@mui/material';
import { spacing, componentSpacing, brandColors } from '../../styles/tokens';
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
import { useNavigate } from 'react-router-dom';
import type { Skill } from '../../types/models/Skill';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface SkillCardProps {
  skill: Skill;
  isOwner?: boolean;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skillId: string) => void;
  onMatch?: (skill: Skill) => void;
  onToggleFavorite?: (skill: Skill) => void;
  isFavorite?: boolean;
  showMatchButton?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const SkillCard: React.FC<SkillCardProps> = memo(
  ({
    skill,
    isOwner = false,
    onEdit,
    onDelete,
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
    const cardData = useMemo(
      () => ({
        matchRequests: skill.matchRequests ?? 0,
        activeMatches: skill.activeMatches ?? 0,
        completionRate: skill.completionRate ?? 0,
        averageRating: skill.averageRating ?? 0,
        totalReviews: skill.reviewCount ?? 0,
        isVerified: skill.isVerified ?? false,
        lastActive: formatDistanceToNow(
          new Date(skill.lastActiveAt ?? skill.createdAt ?? new Date()),
          {
            addSuffix: true,
            locale: de,
          }
        ),
      }),
      [skill]
    );

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

    // Status badge component
    const StatusBadge = useMemo(
      () => (
        <Box
          sx={{
            position: 'absolute',
            top: -spacing[1],
            right: { xs: spacing[1], sm: spacing[2] },
            bgcolor: skill.isOffered ? brandColors.primary[500] : brandColors.secondary[500],
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
          {skill.isOffered ? <OfferIcon fontSize="small" /> : <LearnIcon fontSize="small" />}
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {skill.isOffered ? 'ANGEBOT' : 'GESUCHT'}
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            {skill.isOffered ? 'ANGEBOT' : 'GESUCHT'}
          </Box>
        </Box>
      ),
      [skill.isOffered]
    );

    // Rating display component
    const RatingDisplay = useMemo(
      () => (
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: { xs: 1, sm: 2 } }}>
          <Rating
            value={averageRating}
            readOnly
            size={isMobile ? 'small' : 'medium'}
            precision={0.5}
          />
          <Typography
            variant={isMobile ? 'caption' : 'body2'}
            color="text.secondary"
            sx={{ minWidth: isMobile ? 60 : 80 }}
          >
            {averageRating.toFixed(1)} ({String(totalReviews)})
          </Typography>
        </Box>
      ),
      [averageRating, totalReviews, isMobile]
    );

    // Match activity indicators
    const MatchIndicators = useMemo(
      () =>
        !isOwner ? (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {matchRequests > 0 && (
              <Box display="flex" alignItems="center" gap={1}>
                <Badge badgeContent={matchRequests} color="primary" max={99}>
                  <MessageIcon fontSize="small" color="action" />
                </Badge>
                <Typography variant="caption" color="text.secondary">
                  {String(matchRequests)} Anfrage{matchRequests !== 1 ? 'n' : ''}
                </Typography>
              </Box>
            )}
            {activeMatches > 0 && (
              <Box display="flex" alignItems="center" gap={1}>
                <SwapIcon fontSize="small" color="success" />
                <Typography variant="caption" color="text.secondary">
                  {String(activeMatches)} aktive{activeMatches !== 1 ? 's' : ''} Match
                  {activeMatches !== 1 ? 'es' : ''}
                </Typography>
              </Box>
            )}
          </Stack>
        ) : null,
      [isOwner, matchRequests, activeMatches]
    );

    // Owner statistics
    const OwnerStats = useMemo(
      () =>
        isOwner && variant !== 'compact' ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Deine Statistik
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption">Anfragen</Typography>
                <Chip label={String(matchRequests)} size="small" color="primary" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption">Aktive Matches</Typography>
                <Chip label={String(activeMatches)} size="small" color="success" />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption">Erfolgsrate</Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {String(completionRate)}%
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
        ) : null,
      [isOwner, variant, matchRequests, activeMatches, completionRate, theme]
    );

    // Detailed info section
    const DetailedInfo = useMemo(
      () =>
        responsiveConfig.showDetailedInfo ? (
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Dauer: {String(skill.estimatedDurationMinutes ?? 60)} Min.
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
        ) : null,
      [responsiveConfig.showDetailedInfo, expanded, skill.estimatedDurationMinutes, lastActive]
    );

    return (
      <Card
        sx={{
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
        }}
        onClick={handleCardClick}
      >
        {StatusBadge}

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
                <Typography
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                  sx={{
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {skill.name}
                </Typography>
                {isVerified && (
                  <Tooltip title="Verifizierter Skill">
                    <VerifiedIcon
                      fontSize="small"
                      color="primary"
                      sx={{ mt: 0.5, flexShrink: 0 }}
                    />
                  </Tooltip>
                )}
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                <Chip
                  label={skill.category.name}
                  size="small"
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    fontWeight: 'medium',
                  }}
                />
                <Chip label={skill.proficiencyLevel.level} size="small" variant="outlined" />
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: { xs: 1, sm: 0 } }}>
              <IconButton
                size={isMobile ? 'medium' : 'small'}
                onClick={handleToggleFavorite}
                sx={{
                  color: isFavorite ? 'primary.main' : 'text.secondary',
                  // Ensure minimum 44px touch target
                  minWidth: { xs: 44, sm: 'auto' },
                  minHeight: { xs: 44, sm: 'auto' },
                }}
              >
                {isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
              <IconButton
                size={isMobile ? 'medium' : 'small'}
                onClick={handleMenuOpen}
                sx={{
                  minWidth: { xs: 44, sm: 'auto' },
                  minHeight: { xs: 44, sm: 'auto' },
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

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
          {RatingDisplay}

          {/* Match Activity */}
          {MatchIndicators}

          {/* Owner Stats */}
          {OwnerStats}

          {/* Detailed Info */}
          {DetailedInfo}
        </CardContent>

        {/* Actions */}
        <CardActions
          sx={{
            p: componentSpacing.card.actionsPadding / 8,
            pt: variant === 'compact' ? 0 : spacing[1] / 8,
            gap: spacing[1] / 8,
          }}
        >
          {!isOwner && showMatchButton ? (
            <Button
              fullWidth
              variant="contained"
              color={skill.isOffered ? 'secondary' : 'primary'}
              startIcon={<SwapIcon />}
              onClick={handleMatch}
              size={isMobile ? 'medium' : 'large'}
              sx={{
                fontWeight: 'bold',
                py: isMobile ? 1 : 1.25,
              }}
            >
              {skill.isOffered ? 'Lernen anfragen' : 'Hilfe anbieten'}
            </Button>
          ) : isOwner ? (
            <Grid container spacing={1} width="100%">
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(skill);
                  }}
                  size={isMobile ? 'small' : 'medium'}
                >
                  {isMobile ? 'Edit' : 'Bearbeiten'}
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(skill.id);
                  }}
                  size={isMobile ? 'small' : 'medium'}
                >
                  Löschen
                </Button>
              </Grid>
            </Grid>
          ) : null}

          {responsiveConfig.showDetailedInfo ? (
            <Button
              size="small"
              onClick={toggleExpanded}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                ml: 'auto',
                minWidth: 'auto',
                px: 1,
              }}
            >
              {expanded ? 'Weniger' : 'Mehr'}
            </Button>
          ) : null}
        </CardActions>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => {
            e.stopPropagation();
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {!isOwner ? (
            <MenuItem onClick={handleShare}>
              <ListItemIcon>
                <ShareIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Teilen</ListItemText>
            </MenuItem>
          ) : null}
          {isOwner
            ? [
                <MenuItem
                  key="edit"
                  onClick={() => {
                    handleMenuClose();
                    onEdit?.(skill);
                  }}
                >
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Bearbeiten</ListItemText>
                </MenuItem>,
                <MenuItem
                  key="delete"
                  onClick={() => {
                    handleMenuClose();
                    onDelete?.(skill.id);
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Löschen</ListItemText>
                </MenuItem>,
              ]
            : null}
          <MenuItem
            onClick={() => {
              handleMenuClose();
              void navigate(`/skills/${skill.id}`);
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Details anzeigen</ListItemText>
          </MenuItem>
        </Menu>
      </Card>
    );
  }
);

SkillCard.displayName = 'SkillCard';

export default SkillCard;
