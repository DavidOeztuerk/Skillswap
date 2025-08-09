import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TrendingUp as LevelIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../contexts/PermissionContext';
import apiClient from '../../services/apiClient';
import { Grid } from '../../components/common/GridCompat';

interface ProficiencyLevel {
  id: string;
  name: string;
  level: number;
  description?: string;
  color?: string;
  minScore: number;
  maxScore: number;
  displayOrder: number;
  isActive: boolean;
  skillCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface LevelFormData {
  name: string;
  level: number;
  description: string;
  color: string;
  minScore: number;
  maxScore: number;
  displayOrder: number;
}

const ProficiencyLevelsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [levels, setLevels] = useState<ProficiencyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel | null>(null);
  const [formData, setFormData] = useState<LevelFormData>({
    name: '',
    level: 1,
    description: '',
    color: '#2196f3',
    minScore: 0,
    maxScore: 100,
    displayOrder: 1
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LevelFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/proficiency-levels');
      // apiClient returns ApiResponse, check structure
      const levelsData = response?.data || response || [];
      const sortedLevels = (Array.isArray(levelsData) ? levelsData : []).sort(
        (a: ProficiencyLevel, b: ProficiencyLevel) => a.displayOrder - b.displayOrder
      );
      setLevels(sortedLevels);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load proficiency levels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasPermission('skills:manage_proficiency')) {
      navigate('/');
      return;
    }
    fetchLevels();
  }, [hasPermission, navigate]);

  const handleOpenDialog = (level?: ProficiencyLevel) => {
    if (level) {
      setSelectedLevel(level);
      setFormData({
        name: level.name,
        level: level.level,
        description: level.description || '',
        color: level.color || '#2196f3',
        minScore: level.minScore,
        maxScore: level.maxScore,
        displayOrder: level.displayOrder
      });
    } else {
      setSelectedLevel(null);
      const nextOrder = levels.length > 0 
        ? Math.max(...levels.map(l => l.displayOrder)) + 1 
        : 1;
      setFormData({
        name: '',
        level: levels.length + 1,
        description: '',
        color: '#2196f3',
        minScore: 0,
        maxScore: 100,
        displayOrder: nextOrder
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLevel(null);
    setFormData({
      name: '',
      level: 1,
      description: '',
      color: '#2196f3',
      minScore: 0,
      maxScore: 100,
      displayOrder: 1
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof LevelFormData, string>> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Level name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Level name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      errors.name = 'Level name must not exceed 50 characters';
    }

    if (formData.level < 1 || formData.level > 10) {
      errors.level = 'Level must be between 1 and 10';
    }

    if (formData.minScore < 0 || formData.minScore > 100) {
      errors.minScore = 'Min score must be between 0 and 100';
    }

    if (formData.maxScore < 0 || formData.maxScore > 100) {
      errors.maxScore = 'Max score must be between 0 and 100';
    }

    if (formData.minScore >= formData.maxScore) {
      errors.maxScore = 'Max score must be greater than min score';
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = 'Description must not exceed 200 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveLevel = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (selectedLevel) {
        // Update existing level
        await apiClient.put(`/api/admin/skills/proficiency-levels/${selectedLevel.id}`, formData);
      } else {
        // Create new level
        await apiClient.post('/api/admin/skills/proficiency-levels', formData);
      }
      await fetchLevels();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save proficiency level');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLevel = async () => {
    if (!selectedLevel) return;

    try {
      await apiClient.delete(`/api/admin/skills/proficiency-levels/${selectedLevel.id}`);
      await fetchLevels();
      setDeleteDialogOpen(false);
      setSelectedLevel(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete proficiency level');
    }
  };

  const handleOpenDeleteDialog = (level: ProficiencyLevel) => {
    setSelectedLevel(level);
    setDeleteDialogOpen(true);
  };

  const getLevelIcon = (level: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < level) {
        stars.push(<StarIcon key={i} sx={{ fontSize: 16, color: 'warning.main' }} />);
      } else {
        stars.push(<StarBorderIcon key={i} sx={{ fontSize: 16, color: 'action.disabled' }} />);
      }
    }
    return <Box display="flex">{stars}</Box>;
  };

  const predefinedColors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];

  const predefinedLevelNames = [
    { name: 'Beginner', level: 1, color: '#4caf50' },
    { name: 'Elementary', level: 2, color: '#8bc34a' },
    { name: 'Intermediate', level: 3, color: '#ffeb3b' },
    { name: 'Advanced', level: 4, color: '#ff9800' },
    { name: 'Expert', level: 5, color: '#f44336' },
  ];

  if (loading && levels.length === 0) {
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
          Manage skill proficiency levels and their scoring ranges
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Levels
                  </Typography>
                  <Typography variant="h4">
                    {levels.length}
                  </Typography>
                </Box>
                <LevelIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Levels
                  </Typography>
                  <Typography variant="h4">
                    {levels.filter(l => l.isActive).length}
                  </Typography>
                </Box>
                <LevelIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Skills
                  </Typography>
                  <Typography variant="h4">
                    {levels.reduce((sum, l) => sum + l.skillCount, 0)}
                  </Typography>
                </Box>
                <LevelIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Score Range
                  </Typography>
                  <Typography variant="h4">
                    0-100
                  </Typography>
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Proficiency Level
          </Button>
          <IconButton onClick={fetchLevels}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Paper>

      {/* Proficiency Levels Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Score Range</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Skills</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {levels.map((level) => (
              <TableRow key={level.id}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DragIcon sx={{ color: 'action.disabled' }} />
                    <Typography>{level.displayOrder}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 24,
                        borderRadius: 1,
                        backgroundColor: level.color || '#2196f3'
                      }}
                    />
                    <Typography fontWeight="medium">{level.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{getLevelIcon(level.level)}</TableCell>
                <TableCell>
                  <Chip
                    label={`${level.minScore} - ${level.maxScore}`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{level.description || '-'}</TableCell>
                <TableCell align="center">
                  <Chip label={level.skillCount} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={level.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={level.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(level)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(level)}
                        disabled={level.skillCount > 0}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
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
                      onClick={() => setFormData({
                        ...formData,
                        name: template.name,
                        level: template.level,
                        color: template.color
                      })}
                      variant={formData.name === template.name ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              label="Level Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              required
            />
            
            <Box>
              <Typography gutterBottom>
                Level: {formData.level}
              </Typography>
              <Slider
                value={formData.level}
                onChange={(_, value) => setFormData({ ...formData, level: value as number })}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
              {formErrors.level && (
                <Typography color="error" variant="caption">
                  {formErrors.level}
                </Typography>
              )}
            </Box>
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Min Score"
                type="number"
                value={formData.minScore}
                onChange={(e) => setFormData({ ...formData, minScore: Number(e.target.value) })}
                error={!!formErrors.minScore}
                helperText={formErrors.minScore}
                fullWidth
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
              
              <TextField
                label="Max Score"
                type="number"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                error={!!formErrors.maxScore}
                helperText={formErrors.maxScore}
                fullWidth
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Stack>
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={!!formErrors.description}
              helperText={formErrors.description}
              fullWidth
              multiline
              rows={3}
            />
            
            <TextField
              label="Display Order"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
            />
            
            <Box>
              <Typography gutterBottom variant="body2">
                Level Color
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {predefinedColors.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      p: 0.5,
                      border: formData.color === color ? 2 : 0,
                      borderColor: 'primary.main'
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: color,
                        borderRadius: 1
                      }}
                    />
                  </IconButton>
                ))}
              </Stack>
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
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the proficiency level "{selectedLevel?.name}"?
            {selectedLevel?.skillCount ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This level has {selectedLevel.skillCount} skills associated with it.
                You cannot delete it until all skills are removed or reassigned.
              </Alert>
            ) : (
              ' This action cannot be undone.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
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