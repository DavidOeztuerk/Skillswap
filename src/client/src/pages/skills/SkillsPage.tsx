// src/pages/skills/SkillsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Fab,
  Tooltip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSkills } from '../../hooks/useSkills';
import SkillList from '../../components/skills/SkillList';
import SkillForm from '../../components/skills/SkillForm';
import { Skill } from '../../types/models/Skill';
import PaginationControls from '../../components/pagination/PaginationControls';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
import AlertMessage from '../../components/ui/AlertMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: string;
  value: string;
}

interface SkillsPageProps {
  showOnly: 'mine' | 'others';
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`skills-tabpanel-${index}`}
    aria-labelledby={`skills-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

function a11yProps(index: number) {
  return {
    id: `skills-tab-${index}`,
    'aria-controls': `skills-tabpanel-${index}`,
  };
}

// Form data interfaces
interface SkillFormData extends CreateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}

interface UpdateSkillFormData extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
  location?: string;
}

// Filter state interface
interface FilterState {
  categoryId: string;
  proficiencyLevelId: string;
  isOffering: boolean | undefined;
  tags: string[];
}

/**
 * Skills Page with improved state management and error handling
 */
const SkillsPage: React.FC<SkillsPageProps> = ({ showOnly }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Skills hook with improved state management
  const {
    getCurrentSkills,
    allSkills,
    userSkills,
    categories,
    proficiencyLevels,
    searchQuery,
    isSearchActive,
    pagination,
    errors,
    isLoading,
    isCreating,
    isUpdating,
    fetchAllSkills,
    fetchUserSkills,
    searchSkillsByQuery,
    searchUserSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    fetchCategories,
    fetchProficiencyLevels,
    updatePagination,
    dismissError,
    selectSkill,
    clearSkill,
    setQuery,
    clearSearch,
  } = useSkills();

  // Local state
  // const [activeTab, setActiveTab] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkillForEdit, setSelectedSkillForEdit] = useState<
    Skill | undefined
  >();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categoryId: '',
    proficiencyLevelId: '',
    isOffering: undefined,
    tags: [],
  });

  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string[];
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: [],
    severity: 'success',
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const navigate = useNavigate();

  const pageSizeOptions = [12, 24, 48, 96];

  // Load data for specific tab
  const loadTabData = useCallback(async () => {
    try {
      console.log(`📊 Loading data for tab ${showOnly}`);

      let success = false;

      if (showOnly === 'others') {
        // All skills tab
        if (isSearchActive && searchQuery) {
          success = await searchSkillsByQuery(
            searchQuery,
            pagination.pageNumber,
            pagination.pageSize
          );
        } else {
          success = await fetchAllSkills(pagination);
        }
      } else {
        // User skills tab
        if (isSearchActive && searchQuery) {
          success = await searchUserSkills(
            searchQuery,
            pagination.pageNumber,
            pagination.pageSize
          );
        } else {
          success = await fetchUserSkills(
            pagination.pageNumber,
            pagination.pageSize
          );
        }
      }

      if (!success) {
        console.warn('⚠️ Loading tab data returned false');
      }
    } catch (error) {
      console.error('❌ Error loading tab data:', error);
    }
  }, [
    showOnly,
    isSearchActive,
    searchQuery,
    searchSkillsByQuery,
    pagination,
    fetchAllSkills,
    searchUserSkills,
    fetchUserSkills,
  ]);

  // ✅ FIXED: useEffect hooks ohne Object Dependencies

  // 1. Load initial data ONCE on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🚀 Loading initial data...');

        // Load categories and proficiency levels first
        const [categoriesSuccess, proficiencySuccess] = await Promise.all([
          fetchCategories(),
          fetchProficiencyLevels(),
        ]);

        if (!categoriesSuccess || !proficiencySuccess) {
          setNotification({
            open: true,
            message: [
              'Fehler beim Laden der Kategorien oder Fertigkeitsstufen',
            ],
            severity: 'warning',
          });
        }

        console.log('✅ Initial metadata loaded');
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
        setNotification({
          open: true,
          message: ['Fehler beim Laden der Daten'],
          severity: 'error',
        });
      }
    };

    loadInitialData();
  }, [fetchCategories, fetchProficiencyLevels]); // ✅ Stabile Callbacks

  // 2. Load tab data when dependencies change
  useEffect(() => {
    // Only load if we have the required metadata
    if (categories.length === 0 || proficiencyLevels.length === 0) {
      console.log('⏳ Waiting for categories and proficiency levels...');
      return;
    }

    const loadTabData = async () => {
      try {
        console.log(`📊 Loading data for tab ${showOnly}`);

        let success = false;

        if (showOnly === 'others') {
          // All skills tab
          if (isSearchActive && searchQuery) {
            success = await searchSkillsByQuery(
              searchQuery,
              pagination.pageNumber,
              pagination.pageSize
            );
          } else {
            // ✅ Use primitive values instead of pagination object
            success = await fetchAllSkills({
              page: pagination.pageNumber,
              pageSize: pagination.pageSize,
            });
          }
        } else {
          // User skills tab
          if (isSearchActive && searchQuery) {
            success = await searchUserSkills(
              searchQuery,
              pagination.pageNumber,
              pagination.pageSize
            );
          } else {
            success = await fetchUserSkills(
              pagination.pageNumber,
              pagination.pageSize
            );
          }
        }

        if (!success) {
          console.warn('⚠️ Loading tab data returned false');
        }
      } catch (error) {
        console.error('❌ Error loading tab data:', error);
      }
    };

    loadTabData();
  }, [
    // ✅ ONLY primitive values and stable callbacks
    showOnly,
    isSearchActive,
    searchQuery,
    pagination.pageNumber, // ✅ Primitive value
    pagination.pageSize, // ✅ Primitive value
    categories.length, // ✅ Primitive value
    proficiencyLevels.length, // ✅ Primitive value
    searchSkillsByQuery, // ✅ Stable useCallback
    fetchAllSkills, // ✅ Stable useCallback
    searchUserSkills, // ✅ Stable useCallback
    fetchUserSkills, // ✅ Stable useCallback
  ]);

  // 3. Handle errors separately (unchanged)
  useEffect(() => {
    if (errors && errors.length > 0) {
      setNotification({
        open: true,
        message: errors,
        severity: 'error',
      });
    }
  }, [errors]);

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    console.log(`🔄 Switching to tab ${newValue}`);
    // setActiveTab(newValue);
    updatePagination({ pageNumber: 1 });
    clearSearch();
    setLocalSearchQuery('');
    dismissError();
  };

  // Search handlers
  const handleSearch = async () => {
    if (!localSearchQuery.trim()) {
      setNotification({
        open: true,
        message: ['Bitte gib einen Suchbegriff ein'],
        severity: 'warning',
      });
      return;
    }

    try {
      console.log('🔍 Starting search:', localSearchQuery);
      setQuery(localSearchQuery);
      updatePagination({ pageNumber: 1 });

      const success =
        showOnly === 'others'
          ? await searchSkillsByQuery(localSearchQuery, 1, pagination.pageSize)
          : await searchUserSkills(localSearchQuery, 1, pagination.pageSize);

      if (!success) {
        setNotification({
          open: true,
          message: ['Suche fehlgeschlagen. Bitte versuche es erneut.'],
          severity: 'error',
        });
      } else {
        console.log('✅ Search completed successfully');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setNotification({
        open: true,
        message: ['Fehler bei der Suche'],
        severity: 'error',
      });
    }
  };

  const handleClearSearch = async () => {
    try {
      console.log('🧹 Clearing search');
      setLocalSearchQuery('');
      clearSearch();
      updatePagination({ pageNumber: 1 });

      const success =
        showOnly === 'others'
          ? await fetchAllSkills(pagination)
          : await fetchUserSkills(pagination.pageNumber, pagination.pageSize);

      if (!success) {
        setNotification({
          open: true,
          message: ['Laden der Skills fehlgeschlagen.'],
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('❌ Clear search error:', error);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    console.log('📄 Page changed to:', page);
    updatePagination({ pageNumber: page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    console.log('📊 Page size changed to:', pageSize);
    updatePagination({ pageNumber: 1, pageSize });
  };

  // Form handlers
  const handleOpenCreateForm = () => {
    console.log('➕ Opening create form');
    setSelectedSkillForEdit(undefined);
    clearSkill();
    setIsFormOpen(true);
    dismissError();
  };

  const handleEditSkill = (skill: Skill) => {
    console.log('✏️ Opening edit form for skill:', skill.name);
    setSelectedSkillForEdit(skill);
    selectSkill(skill);
    setIsFormOpen(true);
    dismissError();
  };

  const handleCloseForm = () => {
    console.log('❌ Closing form');
    setIsFormOpen(false);
    setSelectedSkillForEdit(undefined);
    clearSkill();
    dismissError();
  };

  const handleViewSkillDetails = (skill: Skill) => {
    console.log('👁️ Viewing skill details:', skill.name);
    selectSkill(skill);
    // Could navigate to details page here
    navigate(`/skills/${skill.skillId}`);
  };

  // Delete handler with confirmation
  const handleDeleteSkill = (skillId: string) => {
    const currentSkills = getCurrentSkills(showOnly);
    const skill = currentSkills.find((s) => s.skillId === skillId);
    const skillName = skill?.name || 'diesen Skill';

    console.log('🗑️ Initiating delete for skill:', skillName);

    setConfirmDialog({
      open: true,
      title: 'Skill löschen',
      message: `Bist du sicher, dass du "${skillName}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`,
      onConfirm: () => confirmDeleteSkill(skillId),
    });
  };

  const confirmDeleteSkill = async (skillId: string) => {
    setConfirmDialog({ ...confirmDialog, open: false });

    try {
      console.log('🗑️ Confirming delete for skill:', skillId);
      const success = await deleteSkill(skillId);

      if (success) {
        setNotification({
          open: true,
          message: ['Skill erfolgreich gelöscht'],
          severity: 'success',
        });

        // Reload current tab data
        await loadTabData();
      } else {
        setNotification({
          open: true,
          message: ['Fehler beim Löschen des Skills'],
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      setNotification({
        open: true,
        message: ['Fehler beim Löschen des Skills'],
        severity: 'error',
      });
    }
  };

  // Form submission handler
  const handleSubmitSkill = async (
    skillData: SkillFormData | UpdateSkillFormData,
    skillId?: string
  ) => {
    try {
      let success = false;

      if (skillId) {
        // Update existing skill
        console.log('📝 Updating skill:', skillId);
        success = await updateSkill(skillId, skillData as UpdateSkillFormData);

        if (success) {
          setNotification({
            open: true,
            message: ['Skill erfolgreich aktualisiert'],
            severity: 'success',
          });
          setIsFormOpen(false);
          await loadTabData();
        }
      } else {
        // Create new skill
        console.log('✨ Creating new skill');
        success = await createSkill(skillData as SkillFormData);

        if (success) {
          setNotification({
            open: true,
            message: ['Skill erfolgreich erstellt'],
            severity: 'success',
          });
          setIsFormOpen(false);

          // Switch to user skills tab
          // setActiveTab(1);
          updatePagination({ pageNumber: 1 });

          // Force reload user skills with cache bypass
          console.log('🔄 Force reloading user skills after creation...');

          // Wait a moment for the backend to process, then reload
          setTimeout(async () => {
            // Clear any existing cache and reload
            dismissError();
            const reloadSuccess = await fetchUserSkills(1, pagination.pageSize);

            if (!reloadSuccess) {
              console.warn('⚠️ Failed to reload user skills after creation');
              // Fallback: try to reload again
              setTimeout(() => {
                fetchUserSkills(1, pagination.pageSize);
              }, 1000);
            }
          }, 500);
        }
      }

      if (!success) {
        setNotification({
          open: true,
          message: [
            skillId
              ? 'Fehler beim Aktualisieren des Skills'
              : 'Fehler beim Erstellen des Skills',
          ],
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('❌ Submit skill error:', error);
      setNotification({
        open: true,
        message: ['Ein unerwarteter Fehler ist aufgetreten'],
        severity: 'error',
      });
    }
  };

  // Notification handler
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
    dismissError();
  };

  // Filter handlers
  const handleFilterChange = (
    filterType: keyof FilterState,
    value: unknown
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleCategoryFilterChange = (event: SelectChangeEvent) => {
    handleFilterChange('categoryId', event.target.value);
  };

  const handleProficiencyFilterChange = (event: SelectChangeEvent) => {
    handleFilterChange('proficiencyLevelId', event.target.value);
  };

  const handleClearFilters = () => {
    setFilters({
      categoryId: '',
      proficiencyLevelId: '',
      isOffering: undefined,
      tags: [],
    });
  };

  const handleRefresh = async () => {
    try {
      console.log('🔄 Refreshing data');
      dismissError();
      clearSearch();
      setLocalSearchQuery('');
      updatePagination({ pageNumber: 1 });

      await loadTabData();

      setNotification({
        open: true,
        message: ['Skills erfolgreich aktualisiert'],
        severity: 'success',
      });
    } catch (error) {
      console.error('❌ Refresh error:', error);
      setNotification({
        open: true,
        message: ['Fehler beim Aktualisieren'],
        severity: 'error',
      });
    }
  };

  // Get current skills array based on active tab
  const currentSkills = getCurrentSkills(showOnly);
  const currentSkillsCount = currentSkills.length;

  // Loading states
  const isPageLoading = isLoading && currentSkillsCount === 0;
  const hasError = !!errors;
  const hasData = currentSkillsCount > 0;

  // Debug logging
  console.log('🔍 SkillsPage State:', {
    showOnly,
    isSearchActive,
    searchQuery,
    localSearchQuery,
    allSkillsCount: allSkills.length,
    userSkillsCount: userSkills.length,
    currentSkillsCount,
    isLoading,
    hasError,
    hasData,
    pagination,
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* Page header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Skills
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verwalte deine Fähigkeiten und entdecke neue Skills
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateForm}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            disabled={isLoading}
          >
            Neuen Skill erstellen
          </Button>
        </Box>
      </Box>

      {/* Error display */}
      {hasError && (
        <Box sx={{ mb: 3 }}>
          <AlertMessage
            message={errors!}
            severity="error"
            onClose={dismissError}
          />
        </Box>
      )}

      {/* Search and filter panel */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          {/* Search bar */}
          <TextField
            fullWidth
            placeholder="Skills durchsuchen..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {localSearchQuery && (
                    <IconButton
                      onClick={handleClearSearch}
                      edge="end"
                      aria-label="Suche zurücksetzen"
                      disabled={isLoading}
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Search controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={isLoading || !localSearchQuery.trim()}
              >
                Suchen
              </Button>

              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                disabled={isLoading}
              >
                Filter {showFilters ? 'ausblenden' : 'anzeigen'}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary">
              {isSearchActive && searchQuery
                ? `Suchergebnisse für "${searchQuery}"`
                : `${currentSkillsCount} Skills gefunden`}
            </Typography>
          </Box>

          {/* Filters */}
          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 2 }}
              >
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Kategorie</InputLabel>
                  <Select
                    value={filters.categoryId}
                    onChange={handleCategoryFilterChange}
                    label="Kategorie"
                    disabled={isLoading}
                  >
                    <MenuItem value="">Alle Kategorien</MenuItem>
                    {categories.map((category) => (
                      <MenuItem
                        key={category.categoryId}
                        value={category.categoryId}
                      >
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Fertigkeitsstufe</InputLabel>
                  <Select
                    value={filters.proficiencyLevelId}
                    onChange={handleProficiencyFilterChange}
                    label="Fertigkeitsstufe"
                    disabled={isLoading}
                  >
                    <MenuItem value="">Alle Stufen</MenuItem>
                    {proficiencyLevels.map((level) => (
                      <MenuItem key={level.levelId} value={level.levelId}>
                        {level.level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                  size="small"
                >
                  Filter zurücksetzen
                </Button>
              </Stack>

              {/* Active filters display */}
              {(filters.categoryId || filters.proficiencyLevelId) && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {filters.categoryId && (
                    <Chip
                      label={`Kategorie: ${categories.find((c) => c.categoryId === filters.categoryId)?.name}`}
                      onDelete={() => handleFilterChange('categoryId', '')}
                      size="small"
                    />
                  )}
                  {filters.proficiencyLevelId && (
                    <Chip
                      label={`Level: ${proficiencyLevels.find((l) => l.levelId === filters.proficiencyLevelId)?.level}`}
                      onDelete={() =>
                        handleFilterChange('proficiencyLevelId', '')
                      }
                      size="small"
                    />
                  )}
                </Stack>
              )}
            </Box>
          )}
        </Box>

        <Divider />

        {/* Tabs */}
        <Tabs
          value={showOnly}
          onChange={handleTabChange}
          aria-label="Skills-Tabs"
          variant={isMobile ? 'fullWidth' : 'standard'}
        >
          <Tab
            label={`Alle Skills (${allSkills.length})`}
            {...a11yProps(0)}
            disabled={isLoading}
          />
          <Tab
            label={`Meine Skills (${userSkills.length})`}
            {...a11yProps(1)}
            disabled={isLoading}
          />
        </Tabs>
      </Paper>

      {/* Content area */}
      {isPageLoading ? (
        <LoadingSpinner
          message="Skills werden geladen..."
          size={60}
          sx={{ py: 8 }}
        />
      ) : (
        <>
          <TabPanel value={showOnly} index={'others'}>
            <SkillList
              skills={currentSkills}
              loading={isLoading}
              errors={errors || undefined}
              onEditSkill={handleEditSkill}
              onDeleteSkill={handleDeleteSkill}
              onViewSkillDetails={handleViewSkillDetails}
            />
          </TabPanel>

          <TabPanel value={showOnly} index={'mine'}>
            <SkillList
              skills={currentSkills}
              loading={isLoading}
              errors={errors || undefined}
              onEditSkill={handleEditSkill}
              onDeleteSkill={handleDeleteSkill}
              onViewSkillDetails={handleViewSkillDetails}
            />
          </TabPanel>
        </>
      )}

      {/* Pagination */}
      {hasData && !isPageLoading && (
        <Box sx={{ mt: 3 }}>
          <PaginationControls
            totalItems={pagination.totalRecords || currentSkillsCount}
            currentPage={pagination.pageNumber}
            pageSize={pagination.pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Box>
      )}

      {/* Mobile floating action button */}
      <Tooltip title="Neuen Skill erstellen">
        <Fab
          color="primary"
          aria-label="Neuen Skill erstellen"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'inline-flex', sm: 'none' },
          }}
          onClick={handleOpenCreateForm}
          disabled={isLoading}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Skill form modal */}
      <SkillForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitSkill}
        categories={categories}
        proficiencyLevels={proficiencyLevels}
        loading={isCreating || isUpdating}
        skill={selectedSkillForEdit}
        title={
          selectedSkillForEdit ? 'Skill bearbeiten' : 'Neuen Skill erstellen'
        }
      />

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        confirmColor="error"
      />

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            notification.severity === 'error' ? (
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Erneut versuchen
              </Button>
            ) : undefined
          }
        >
          {notification.message.join(', ')}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SkillsPage;
