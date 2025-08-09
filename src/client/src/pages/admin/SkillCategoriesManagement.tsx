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
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../contexts/PermissionContext';
import apiClient from '../../services/apiClient';
import { Grid } from '../../components/common/GridCompat';

interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  skillCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

const SkillCategoriesManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#2196f3',
    icon: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/categories');
      // apiClient returns ApiResponse, check structure
      const categoriesData = response?.data || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasPermission('skills:manage_categories')) {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [hasPermission, navigate]);

  const handleOpenDialog = (category?: SkillCategory) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color || '#2196f3',
        icon: category.icon || ''
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        color: '#2196f3',
        icon: ''
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#2196f3',
      icon: ''
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CategoryFormData, string>> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      errors.name = 'Category name must not exceed 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = 'Description must not exceed 200 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCategory = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (selectedCategory) {
        // Update existing category
        await apiClient.put(`/api/admin/skills/categories/${selectedCategory.id}`, formData);
      } else {
        // Create new category
        await apiClient.post('/api/admin/skills/categories', formData);
      }
      await fetchCategories();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await apiClient.delete(`/api/admin/skills/categories/${selectedCategory.id}`);
      await fetchCategories();
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleOpenDeleteDialog = (category: SkillCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const predefinedColors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];

  if (loading && categories.length === 0) {
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
          Skill Categories Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage skill categories and their properties
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
                    Total Categories
                  </Typography>
                  <Typography variant="h4">
                    {categories.length}
                  </Typography>
                </Box>
                <CategoryIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
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
                    Active Categories
                  </Typography>
                  <Typography variant="h4">
                    {categories.filter(c => c.isActive).length}
                  </Typography>
                </Box>
                <CategoryIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
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
                    {categories.reduce((sum, c) => sum + c.skillCount, 0)}
                  </Typography>
                </Box>
                <CategoryIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
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
                    Avg Skills/Category
                  </Typography>
                  <Typography variant="h4">
                    {categories.length > 0 
                      ? Math.round(categories.reduce((sum, c) => sum + c.skillCount, 0) / categories.length)
                      : 0}
                  </Typography>
                </Box>
                <CategoryIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
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
            Add Category
          </Button>
          <IconButton onClick={fetchCategories}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Paper>

      {/* Categories Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="center">Skills</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {category.icon && (
                      <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                    )}
                    <Typography fontWeight="medium">{category.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  {category.color && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          backgroundColor: category.color,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                      <Typography variant="caption">{category.color}</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip label={category.skillCount} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={category.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={category.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(category)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(category)}
                        disabled={category.skillCount > 0}
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
          {selectedCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              required
            />
            
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
              label="Icon (Emoji)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              fullWidth
              placeholder="e.g., 💻 or 🎨"
              inputProps={{ maxLength: 2 }}
            />
            
            <Box>
              <Typography gutterBottom variant="body2">
                Category Color
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
              <TextField
                label="Custom Color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
            onClick={handleSaveCategory}
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
            Are you sure you want to delete the category "{selectedCategory?.name}"?
            {selectedCategory?.skillCount ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This category has {selectedCategory.skillCount} skills associated with it.
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
            onClick={handleDeleteCategory}
            color="error"
            variant="contained"
            disabled={(selectedCategory?.skillCount ?? 0) > 0}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default SkillCategoriesManagement;