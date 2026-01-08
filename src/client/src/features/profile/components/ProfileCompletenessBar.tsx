import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
  AccountCircle as AccountCircleIcon,
  Title as TitleIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Link as LinkIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Skeleton,
} from '@mui/material';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { profileService } from '../services/profileService';
import type {
  ProfileCompletenessResponse,
  ProfileCompletenessItem,
  ProfileCompletenessLevel,
} from '../services/profileService';

// Icon mapping for completeness items
const iconMap: Record<string, React.ReactNode> = {
  Description: <DescriptionIcon />,
  AccountCircle: <AccountCircleIcon />,
  Title: <TitleIcon />,
  Work: <WorkIcon />,
  School: <SchoolIcon />,
  Psychology: <PsychologyIcon />,
  Link: <LinkIcon />,
};

// Level colors and labels
const levelConfig: Record<
  ProfileCompletenessLevel,
  { color: 'error' | 'warning' | 'info' | 'success'; label: string }
> = {
  Beginner: { color: 'error', label: 'Anfänger' },
  Basic: { color: 'warning', label: 'Basis' },
  Intermediate: { color: 'info', label: 'Fortgeschritten' },
  Advanced: { color: 'success', label: 'Profi' },
  Expert: { color: 'success', label: 'Experte' },
};

interface ProfileCompletenessBarProps {
  /** Whether to show expanded details by default */
  defaultExpanded?: boolean;
  /** Callback when an action item is clicked */
  onActionClick?: (actionUrl: string) => void;
  /** Whether to show only the progress bar (compact mode) */
  compact?: boolean;
}

const ProfileCompletenessBar: React.FC<ProfileCompletenessBarProps> = ({
  defaultExpanded = false,
  onActionClick,
  compact = false,
}) => {
  const [data, setData] = useState<ProfileCompletenessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const fetchCompleteness = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileService.getProfileCompleteness();

      if (isSuccessResponse(response)) {
        setData(response.data);
      } else {
        setError('Fehler beim Laden der Profilvollständigkeit');
      }
    } catch {
      setError('Fehler beim Laden der Profilvollständigkeit');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCompleteness();
  }, [fetchCompleteness]);

  const handleItemClick = (item: ProfileCompletenessItem): void => {
    if (!item.isCompleted && item.actionUrl && onActionClick) {
      onActionClick(item.actionUrl);
    }
  };

  const getProgressColor = (percentage: number): 'error' | 'warning' | 'info' | 'success' => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'info';
    if (percentage >= 25) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }} elevation={0}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="rectangular" height={8} sx={{ my: 1, borderRadius: 1 }} />
        <Skeleton variant="text" width="60%" />
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const levelInfo = levelConfig[data.level];

  // Compact mode - just the progress bar
  if (compact) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
        >
          <Typography variant="body2" color="text.secondary">
            Profil: {data.percentage}%
          </Typography>
          <Chip label={levelInfo.label} size="small" color={levelInfo.color} variant="outlined" />
        </Box>
        <LinearProgress
          variant="determinate"
          value={data.percentage}
          color={getProgressColor(data.percentage)}
          sx={{ height: 6, borderRadius: 1 }}
        />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={0}>
      {/* Header with progress */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon color={levelInfo.color} />
          <Typography variant="h6">Profilvollständigkeit</Typography>
          <Chip label={levelInfo.label} size="small" color={levelInfo.color} variant="outlined" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold" color={`${levelInfo.color}.main`}>
            {data.percentage}%
          </Typography>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={data.percentage}
        color={getProgressColor(data.percentage)}
        sx={{ height: 10, borderRadius: 1, mb: 1 }}
      />

      {/* Summary text */}
      <Typography variant="body2" color="text.secondary">
        {data.completedCount} von {data.totalCount} Schritten abgeschlossen
        {data.suggestedActions.length > 0 && !expanded && (
          <> – Nächster Schritt: {data.suggestedActions[0]?.label}</>
        )}
      </Typography>

      {/* Expandable details */}
      <Collapse in={expanded}>
        <List dense sx={{ mt: 2 }}>
          {data.items.map((item) => (
            <ListItem
              key={item.key}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor: item.isCompleted ? 'success.50' : 'action.hover',
                cursor: !item.isCompleted && item.actionUrl ? 'pointer' : 'default',
                '&:hover':
                  !item.isCompleted && item.actionUrl ? { bgcolor: 'action.selected' } : {},
              }}
              onClick={() => handleItemClick(item)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.isCompleted ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <UncheckedIcon color="disabled" />
                )}
              </ListItemIcon>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {item.icon !== undefined && iconMap[item.icon] !== undefined ? (
                  iconMap[item.icon]
                ) : (
                  <DescriptionIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.isCompleted ? undefined : item.hint}
                slotProps={{
                  primary: {
                    sx: {
                      textDecoration: item.isCompleted ? 'line-through' : 'none',
                      color: item.isCompleted ? 'text.secondary' : 'text.primary',
                    },
                  },
                }}
              />
              <Tooltip title={`${item.weight}% des Profils`}>
                <Chip
                  label={`+${item.weight}%`}
                  size="small"
                  variant={item.isCompleted ? 'filled' : 'outlined'}
                  color={item.isCompleted ? 'success' : 'default'}
                />
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Paper>
  );
};

export default ProfileCompletenessBar;
