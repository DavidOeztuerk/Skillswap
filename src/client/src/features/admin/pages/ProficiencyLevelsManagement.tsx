import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TrendingUp as LevelIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Tooltip,
  Card,
  CardContent,
  Slider,
  Grid,
} from '@mui/material';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { Permissions } from '../../auth/components/permissions.constants';
import { selectProficiencyLevels } from '../../skills/store/proficiencyLevelSelectors';
import {
  fetchProficiencyLevels,
  updateProficiencyLevel,
  createProficiencyLevel,
  deleteProficiencyLevel,
} from '../../skills/store/thunks/proficiencyLevelThunks';
import type { ProficiencyLevel } from '../../skills/types/Skill';

interface LevelFormData {
  level: string;
  rank: number;
  color: string;
}

/** Type guard for axios-like errors with response data */
function isAxiosError(e: unknown): e is { response: { data: { message?: string } } } {
  return typeof e === 'object' && e !== null && 'response' in e;
}

/** Extract error message from unknown error with fallback */
function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return err.response.data.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

const ProficiencyLevelsManagement: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermissions();

  // Memoize permission checks
  const canManageProficiency = useMemo(
    () => hasPermission(Permissions.Skills.MANAGE_PROFICIENCY),
    [hasPermission]
  );

  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<LevelFormData>({
    level: '',
    rank: 1,
    color: '#2196f3',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LevelFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  // Get proficiency levels from Redux store
  const proficiencyLevels = useAppSelector(selectProficiencyLevels);

  // Fetch function
  const loadProficiencyLevels = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await dispatch(fetchProficiencyLevels()).unwrap();
      setError(null);
    } catch {
      setError('Failed to load proficiency levels');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      if (!canManageProficiency) {
        await navigate('/');
        return;
      }

      await loadProficiencyLevels();
    };
    initialize().catch(() => {});
  }, [canManageProficiency, navigate, dispatch, loadProficiencyLevels]);

  const handleOpenDialog = (level?: ProficiencyLevel): void => {
    if (level) {
      setSelectedLevel(level);
      setFormData({
        level: level.level,
        rank: level.rank,
        color: level.color ?? '#2196f3',
      });
    } else {
      setSelectedLevel(null);
      const nextRank =
        proficiencyLevels.length > 0 ? Math.max(...proficiencyLevels.map((l) => l.rank)) + 1 : 1;
      setFormData({
        level: '',
        rank: nextRank,
        color: '#2196f3',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = (): void => {
    setDialogOpen(false);
    setSelectedLevel(null);
    setFormData({
      level: '',
      rank: 1,
      color: '#2196f3',
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof LevelFormData, string>> = {};

    if (!formData.level.trim()) {
      errors.level = 'Level name is required';
    } else if (formData.level.length < 2) {
      errors.level = 'Level name must be at least 2 characters';
    } else if (formData.level.length > 50) {
      errors.level = 'Level name must not exceed 50 characters';
    }

    if (formData.rank < 1 || formData.rank > 10) {
      errors.rank = 'Rank must be between 1 and 10';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveLevel = async (): Promise<void> => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (selectedLevel) {
        // Update existing level
        await dispatch(
          updateProficiencyLevel({
            id: selectedLevel.id,
            level: formData.level,
            rank: formData.rank,
          })
        ).unwrap();
      } else {
        // Create new level
        await dispatch(
          createProficiencyLevel({
            level: formData.level,
            rank: formData.rank,
          })
        ).unwrap();
      }

      // Refresh levels and close dialog
      await loadProficiencyLevels();
      handleCloseDialog();
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save proficiency level'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLevel = async (): Promise<void> => {
    if (!selectedLevel) return;

    try {
      await dispatch(deleteProficiencyLevel(selectedLevel.id)).unwrap();

      // Refresh levels and close dialog
      await loadProficiencyLevels();
      setDeleteDialogOpen(false);
      setSelectedLevel(null);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete proficiency level'));
    }
  };

  const handleOpenDeleteDialog = (level: ProficiencyLevel): void => {
    setSelectedLevel(level);
    setDeleteDialogOpen(true);
  };

  const getLevelIcon = (rank: number): React.ReactNode => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rank) {
        stars.push(<StarIcon key={i} sx={{ fontSize: 16, color: 'warning.main' }} />);
      } else {
        stars.push(<StarBorderIcon key={i} sx={{ fontSize: 16, color: 'action.disabled' }} />);
      }
    }
    return <Box display="flex">{stars}</Box>;
  };

  const predefinedColors = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#673ab7',
    '#3f51b5',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffeb3b',
    '#ffc107',
    '#ff9800',
    '#ff5722',
  ];

  const predefinedLevelNames = [
    { name: 'Beginner', rank: 1, color: '#4caf50' },
    { name: 'Elementary', rank: 2, color: '#8bc34a' },
    { name: 'Intermediate', rank: 3, color: '#ffeb3b' },
    { name: 'Advanced', rank: 4, color: '#ff9800' },
    { name: 'Expert', rank: 5, color: '#f44336' },
  ];

  if (loading && proficiencyLevels.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Proficiency Levels Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage skill proficiency levels
        </Typography>
      </Box>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            setError(null);
          }}
        >
          {error}
        </Alert>
      ) : null}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Levels
                  </Typography>
                  <Typography variant="h4">{proficiencyLevels.length}</Typography>
                </Box>
                <LevelIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Skills
                  </Typography>
                  <Typography variant="h4">
                    {proficiencyLevels.reduce((sum, l) => sum + (l.skillCount ?? 0), 0)}
                  </Typography>
                </Box>
                <LevelIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Rank Range
                  </Typography>
                  <Typography variant="h4">1-10</Typography>
                </Box>
                <LevelIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          {canManageProficiency ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                handleOpenDialog();
              }}
            >
              Add Proficiency Level
            </Button>
          ) : null}
          <IconButton
            onClick={async () => {
              await loadProficiencyLevels();
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Paper>

      {/* Proficiency Levels Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Visual</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="center">Skills</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proficiencyLevels.map((level) => (
              <TableRow key={level.id}>
                <TableCell>
                  <Typography fontWeight="medium">{level.rank}</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 24,
                        borderRadius: 1,
                        backgroundColor: level.color ?? '#2196f3',
                      }}
                    />
                    <Typography fontWeight="medium">{level.level}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{getLevelIcon(level.rank)}</TableCell>
                <TableCell>
                  {level.color ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          backgroundColor: level.color,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <Typography variant="caption">{level.color}</Typography>
                    </Box>
                  ) : null}
                </TableCell>
                <TableCell align="center">
                  <Chip label={level.skillCount ?? 0} size="small" />
                </TableCell>
                {/* <TableCell align="center">
                  <Chip
                    label={level.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={level.isActive ? 'success' : 'default'}
                  />
                </TableCell> */}
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {canManageProficiency ? (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleOpenDialog(level);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    {canManageProficiency ? (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleOpenDeleteDialog(level);
                          }}
                          disabled={(level.skillCount ?? 0) > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedLevel ? 'Edit Proficiency Level' : 'Add New Proficiency Level'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Quick Templates */}
            {!selectedLevel && (
              <Box>
                <Typography gutterBottom variant="body2">
                  Quick Templates
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {predefinedLevelNames.map((template) => (
                    <Chip
                      key={template.name}
                      label={template.name}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          level: template.name,
                          rank: template.rank,
                          color: template.color,
                        });
                      }}
                      variant={formData.level === template.name ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              label="Level Name"
              value={formData.level}
              onChange={(e) => {
                setFormData({ ...formData, level: e.target.value });
              }}
              error={!!formErrors.level}
              helperText={formErrors.level}
              fullWidth
              required
            />

            <Box>
              <Typography gutterBottom>Rank: {formData.rank}</Typography>
              <Slider
                value={formData.rank}
                onChange={(_, value) => {
                  setFormData({ ...formData, rank: value });
                }}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
              {formErrors.rank ? (
                <Typography color="error" variant="caption">
                  {formErrors.rank}
                </Typography>
              ) : null}
            </Box>

            <Box>
              <Typography gutterBottom variant="body2">
                Level Color
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {predefinedColors.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => {
                      setFormData({ ...formData, color });
                    }}
                    sx={{
                      p: 0.5,
                      border: formData.color === color ? 2 : 0,
                      borderColor: 'primary.main',
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: color,
                        borderRadius: 1,
                      }}
                    />
                  </IconButton>
                ))}
              </Stack>
              <TextField
                label="Custom Color"
                type="color"
                value={formData.color}
                onChange={(e) => {
                  setFormData({ ...formData, color: e.target.value });
                }}
                fullWidth
                sx={{ mt: 2 }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLevel}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the proficiency level &quot;{selectedLevel?.level}
            &quot;?
            {selectedLevel?.skillCount != null && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This level has {selectedLevel.skillCount} skills associated with it. You cannot
                delete it until all skills are removed or reassigned.
              </Alert>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteLevel}
            color="error"
            variant="contained"
            disabled={(selectedLevel?.skillCount ?? 0) > 0}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProficiencyLevelsManagement;
