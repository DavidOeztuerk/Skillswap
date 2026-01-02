import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  Fab,
  Tooltip,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import errorService from '../../../core/services/errorService';
import SkillErrorBoundary from '../../../shared/components/error/SkillErrorBoundary';
import PaginationControls from '../../../shared/components/pagination/PaginationControls';
import { useGeolocation } from '../../../shared/hooks/useGeolocation';
import { Permissions } from '../../auth/components/permissions.constants';
import { useAuth } from '../../auth/hooks/useAuth';
import SkillFilterSidebar from '../components/SkillFilterSidebar';
import SkillForm from '../components/SkillForm';
import SkillList from '../components/SkillList';
import useSkills from '../hooks/useSkills';
import type { CreateSkillRequest } from '../types/CreateSkillRequest';
import type { Skill } from '../types/Skill';
import type { SkillFilters } from '../types/SkillFilter';
import type { UpdateSkillRequest } from '../types/UpdateSkillRequest';

// Sidebar width constant
const SIDEBAR_WIDTH = 280;

// Helper to count active filters for badge
const countActiveFilters = (filters: SkillFilters): number => {
  let count = 0;
  if (filters.categoryId) count++;
  if (filters.proficiencyLevelId) count++;
  if (filters.isOffered === true || filters.isOffered === false) count++;
  if (filters.minRating != null && filters.minRating > 0) count++;
  if (filters.locationType) count++;
  if (filters.maxDistanceKm != null && filters.maxDistanceKm > 0) count++;
  return count;
};

// Extracted component to reduce cognitive complexity
interface MobileFilterButtonProps {
  activeFilterCount: number;
  onClick: () => void;
}

const MobileFilterButton: React.FC<MobileFilterButtonProps> = ({ activeFilterCount, onClick }) => (
  <Button variant="outlined" onClick={onClick} sx={{ gap: 5 }}>
    <Badge badgeContent={activeFilterCount} color="primary" invisible={activeFilterCount === 0}>
      <FilterListIcon />
    </Badge>
    <Box component="span" sx={{ ml: activeFilterCount > 0 ? 1 : 0 }}>
      Filter
    </Box>
  </Button>
);

interface SkillsPageProps {
  showOnly?: 'all' | 'mine' | 'favorite';
}

type ViewType = 'all' | 'mine' | 'favorite';

const PAGE_CONFIG: Record<ViewType, { title: string; description: string }> = {
  all: { title: 'Alle Skills', description: 'Entdecke Skills von anderen Nutzern' },
  mine: { title: 'Meine Skills', description: 'Verwalte deine Skills' },
  favorite: { title: 'Favoriten', description: 'Deine favorisierten Skills' },
};

const SkillsPage: React.FC<SkillsPageProps> = ({ showOnly = 'all' }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const {
    latitude,
    longitude,
    loading: geoLoading,
    isSupported: geoSupported,
    requestLocation,
    clearLocation,
  } = useGeolocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile filter drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ⚡ PERFORMANCE: Use transition for non-blocking filter updates
  const [isFilterPending, startFilterTransition] = useTransition();

  // Memoize permission checks for user skills
  const canCreateOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.CREATE_OWN),
    [hasPermission]
  );
  const canUpdateOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.UPDATE_OWN),
    [hasPermission]
  );
  const canDeleteOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.DELETE_OWN),
    [hasPermission]
  );

  // 🚀 NEW: Use the robust useSkills hook
  const {
    allSkills,
    userSkills,
    favoriteSkills,
    categories,
    proficiencyLevels,
    isLoadingAll,
    isLoadingUser,
    isLoadingCategories,
    isLoadingProficiencyLevels,
    isLoadingFavorites,
    error,
    // Actions (all memoized)
    fetchAllSkills,
    fetchUserSkills,
    fetchCategories,
    fetchProficiencyLevels,
    fetchFavoriteSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    addFavoriteSkill,
    removeFavoriteSkill,
    isFavoriteSkill,
    allSkillsPagination,
    userSkillsPagination,
  } = useSkills();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>();

  // ===== FILTER & PAGINATION STATE =====
  // Read filters from URL params
  const filtersFromUrl = useMemo(
    (): SkillFilters => ({
      searchTerm: searchParams.get('q') ?? undefined,
      categoryId: searchParams.get('category') ?? undefined,
      proficiencyLevelId: searchParams.get('level') ?? undefined,
      isOffered:
        searchParams.get('type') === 'offer'
          ? true
          : searchParams.get('type') === 'seek'
            ? false
            : undefined,
      minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
      locationType: (searchParams.get('location') as SkillFilters['locationType']) ?? undefined,
      maxDistanceKm: searchParams.get('distance')
        ? Number(searchParams.get('distance'))
        : undefined,
      sortBy: (searchParams.get('sort') as SkillFilters['sortBy']) ?? 'relevance',
      sortDirection: (searchParams.get('dir') ?? 'desc') as 'asc' | 'desc',
    }),
    [searchParams]
  );

  const [filters, setFilters] = useState<SkillFilters>(filtersFromUrl);
  const [pageNumber, setPageNumber] = useState(() => {
    const page = searchParams.get('page');
    return page ? Number(page) : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const size = searchParams.get('size');
    return size ? Number(size) : 12;
  });

  // Determine view properties
  const isOwnerView = showOnly === 'mine';
  const { title: pageTitle, description: pageDescription } = PAGE_CONFIG[showOnly];

  // ===== FILTER CHANGE HANDLERS =====
  // ⚡ PERFORMANCE: Use startTransition to make filter updates non-blocking
  // This prevents the UI from freezing when rapidly changing filters
  const handleFilterChange = useCallback(
    (newFilters: SkillFilters) => {
      // Wrap state updates in transition for non-blocking behavior
      startFilterTransition(() => {
        setFilters(newFilters);
        setPageNumber(1); // Reset to first page on filter change
      });

      // URL update outside transition for immediate feedback
      const params = new URLSearchParams();
      if (newFilters.searchTerm) params.set('q', newFilters.searchTerm);
      if (newFilters.categoryId) params.set('category', newFilters.categoryId);
      if (newFilters.proficiencyLevelId) params.set('level', newFilters.proficiencyLevelId);
      if (newFilters.isOffered !== undefined)
        params.set('type', newFilters.isOffered ? 'offer' : 'seek');
      if (newFilters.minRating != null && newFilters.minRating > 0)
        params.set('rating', String(newFilters.minRating));
      if (newFilters.locationType) params.set('location', newFilters.locationType);
      if (newFilters.maxDistanceKm != null && newFilters.maxDistanceKm > 0)
        params.set('distance', String(newFilters.maxDistanceKm));
      if (newFilters.sortBy && newFilters.sortBy !== 'relevance')
        params.set('sort', newFilters.sortBy);
      if (newFilters.sortDirection && newFilters.sortDirection !== 'desc')
        params.set('dir', newFilters.sortDirection);

      setSearchParams(params, { replace: true });
    },
    [setSearchParams, startFilterTransition]
  );

  const handleClearFilters = useCallback(() => {
    startFilterTransition(() => {
      setFilters({});
      setPageNumber(1);
    });
    setSearchParams({}, { replace: true });
  }, [setSearchParams, startFilterTransition]);

  const handlePageChange = useCallback((newPage: number) => {
    setPageNumber(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1); // Reset to first page
  }, []);

  // ===== MEMOIZED DATA LOADING FUNCTIONS =====
  // Note: These functions return void (fire-and-forget dispatch)
  const loadMetadata = useCallback((): void => {
    fetchCategories();
    fetchProficiencyLevels();
    // Always load favorites when user is logged in so we know which skills are favorited
    if (user?.id) {
      fetchFavoriteSkills();
    }
  }, [fetchCategories, fetchProficiencyLevels, fetchFavoriteSkills, user?.id]);

  const loadSkillsData = useCallback((): void => {
    if (showOnly === 'mine') {
      fetchUserSkills({
        pageNumber,
        pageSize,
        isOffered: filters.isOffered,
        categoryId: filters.categoryId,
        proficiencyLevelId: filters.proficiencyLevelId,
        locationType: filters.locationType,
      });
    } else if (showOnly === 'favorite' && user?.id) {
      fetchFavoriteSkills();
      fetchAllSkills({ pageNumber, pageSize }); // Needed for favorite filtering
    } else {
      // Build search params with filters
      const hasDistanceFilter =
        filters.maxDistanceKm != null &&
        filters.maxDistanceKm > 0 &&
        latitude != null &&
        longitude != null;

      fetchAllSkills({
        ...filters,
        pageNumber,
        pageSize,
        // Add location coordinates if distance filter is set
        ...(hasDistanceFilter ? { userLatitude: latitude, userLongitude: longitude } : {}),
      });
    }
  }, [
    showOnly,
    user?.id,
    fetchUserSkills,
    fetchAllSkills,
    fetchFavoriteSkills,
    filters,
    pageNumber,
    pageSize,
    latitude,
    longitude,
  ]);

  // ===== STABLE DATA LOADING useEffect =====
  // Load metadata once
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Load skills data when filters, pagination, or view changes
  // Note: loadSkillsData already depends on filters, pageNumber, pageSize, so we don't need
  // to include them in the dependency array - doing so would cause redundant checks
  useEffect(() => {
    errorService.addBreadcrumb(`Loading skills page: ${showOnly}`, 'navigation', {
      showOnly,
      userId: user?.id,
    });

    loadSkillsData();

    errorService.addBreadcrumb(`Successfully loaded ${showOnly} skills`, 'data');
  }, [showOnly, user?.id, loadSkillsData]);

  // ===== MEMOIZED EVENT HANDLERS =====
  const handleCreateSkill = useCallback(() => {
    if (!isOwnerView) return;

    errorService.addBreadcrumb('Opening skill creation form', 'ui');
    setSelectedSkill(undefined);
    setIsFormOpen(true);
  }, [isOwnerView]);

  const handleEditSkill = useCallback(
    (skill: Skill): void => {
      if (isOwnerView) {
        errorService.addBreadcrumb('Opening skill edit form', 'ui', { skillId: skill.id });
        setSelectedSkill(skill);
        setIsFormOpen(true);
      } else {
        errorService.addBreadcrumb('Navigating to skill detail', 'navigation', {
          skillId: skill.id,
        });
        void navigate(`/skills/${skill.id}`);
      }
    },
    [isOwnerView, navigate]
  );

  // Note: Hook functions return void (fire-and-forget dispatch), so we close the form immediately
  // Success/error feedback is handled via Redux state changes
  const handleCreate = useCallback(
    (skillData: CreateSkillRequest): void => {
      createSkill(skillData);
      setIsFormOpen(false);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill creation dispatched', 'action');
    },
    [createSkill]
  );

  const handleUpdate = useCallback(
    (skillId: string, updateData: UpdateSkillRequest): void => {
      updateSkill(skillId, updateData);
      setIsFormOpen(false);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill update dispatched', 'action');
    },
    [updateSkill]
  );

  const handleDelete = useCallback(
    (skillId: string, reason?: string): void => {
      deleteSkill(skillId, reason);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill deletion dispatched', 'action');
    },
    [deleteSkill]
  );

  const handleToggleFavorite = useCallback(
    (skillId: string, currentlyFavorite: boolean): void => {
      if (currentlyFavorite) {
        removeFavoriteSkill(skillId);
      } else {
        addFavoriteSkill(skillId);
      }
    },
    [addFavoriteSkill, removeFavoriteSkill]
  );

  // ⚡ PERFORMANCE: Stable callback for SkillList - avoids re-creating function on every render
  const handleToggleFavoriteForList = useCallback(
    (skill: Skill): void => {
      // Use isFavoriteSkill function to check actual favorite state from Redux store
      const currentlyFavorite = isFavoriteSkill(skill.id);
      handleToggleFavorite(skill.id, currentlyFavorite);
    },
    [handleToggleFavorite, isFavoriteSkill]
  );

  // ⚡ PERFORMANCE: Stable callback for delete - avoids inline arrow function
  const handleDeleteForList = useCallback(
    (skillId: string): void => {
      handleDelete(skillId);
    },
    [handleDelete]
  );

  const handleRefresh = useCallback((): void => {
    // Trigger data refresh (fire-and-forget - Redux tracks loading)
    loadMetadata();
    loadSkillsData();
    errorService.addBreadcrumb('Data refresh dispatched', 'action');
  }, [loadMetadata, loadSkillsData]);

  // Mobile filter drawer handlers
  const handleOpenFilterDrawer = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const handleCloseFilterDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  // Stable callbacks for mobile drawer filter sidebar
  const handleMobileFilterChange = useCallback(
    (newFilters: SkillFilters) => {
      handleFilterChange(newFilters);
      // Note: Don't close drawer on every filter change - let user adjust multiple filters
    },
    [handleFilterChange]
  );

  const handleMobileClearFilters = useCallback(() => {
    handleClearFilters();
    handleCloseFilterDrawer();
  }, [handleClearFilters, handleCloseFilterDrawer]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // ===== MEMOIZED DATA SELECTORS =====
  const displayedSkills = useMemo(() => {
    switch (showOnly) {
      case 'mine':
        return userSkills;
      case 'favorite':
        return favoriteSkills;
      case 'all':
        return allSkills;
      default: {
        const _exhaustiveCheck: never = showOnly;
        return _exhaustiveCheck;
      }
    }
  }, [showOnly, userSkills, favoriteSkills, allSkills]);

  const isLoading = useMemo(() => {
    // Include isFilterPending for immediate loading feedback during transitions
    const baseLoading = (() => {
      switch (showOnly) {
        case 'mine':
          return isLoadingUser || isLoadingCategories || isLoadingProficiencyLevels;
        case 'favorite':
          return (
            isLoadingFavorites || isLoadingAll || isLoadingCategories || isLoadingProficiencyLevels
          );
        case 'all':
          return isLoadingAll || isLoadingCategories || isLoadingProficiencyLevels;
        default: {
          const _exhaustiveCheck: never = showOnly;
          return _exhaustiveCheck;
        }
      }
    })();
    return baseLoading || isFilterPending;
  }, [
    showOnly,
    isLoadingAll,
    isLoadingUser,
    isLoadingFavorites,
    isLoadingCategories,
    isLoadingProficiencyLevels,
    isFilterPending,
  ]);

  // Pagination pro View auswählen
  const currentPagination = useMemo(() => {
    switch (showOnly) {
      case 'mine':
        return userSkillsPagination;
      case 'favorite':
        // Favoriten haben noch keine Server-Pagination (kommt in Sprint 2)
        // Nutze Client-seitige "Pagination" basierend auf Array-Länge
        return {
          totalRecords: favoriteSkills.length,
          totalPages: 1,
          pageNumber: 1,
          pageSize: favoriteSkills.length || 12,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      case 'all':
        return allSkillsPagination;
      default: {
        const _exhaustiveCheck: never = showOnly;
        return _exhaustiveCheck;
      }
    }
  }, [showOnly, allSkillsPagination, userSkillsPagination, favoriteSkills.length]);

  // Pagination nur anzeigen wenn es mehr als eine Seite gibt
  const showPagination = showOnly !== 'favorite' && currentPagination.totalPages > 1;

  // ===== RENDER =====
  // Filter und List-Layout sind jetzt für ALLE Views aktiviert (nicht nur 'all')

  return (
    <SkillErrorBoundary>
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          // Let content flow naturally - MainLayout handles scrolling
        }}
      >
        {/* Page Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {pageTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {pageDescription}
            </Typography>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            {/* Mobile Filter Button */}
            {isMobile ? (
              <MobileFilterButton
                activeFilterCount={activeFilterCount}
                onClick={handleOpenFilterDrawer}
              />
            ) : null}

            <Button
              loading={isLoading}
              onClick={handleRefresh}
              variant="outlined"
              startIcon={<RefreshIcon />}
              size="medium"
            >
              {isMobile ? '' : 'Aktualisieren'}
            </Button>

            {isOwnerView && canCreateOwnSkill ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateSkill}
                size="medium"
              >
                {isMobile ? 'Neu' : 'Neuer Skill'}
              </Button>
            ) : null}
          </Box>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}

        {/* Main Content Area - 2 Column Layout */}
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            alignItems: 'flex-start',
          }}
        >
          {/* Filter Sidebar - Desktop only - STICKY position */}
          {isMobile ? null : (
            <Box
              sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                // Sticky positioning - stays visible while scrolling within MainLayout
                position: 'sticky',
                top: 0, // Stick to top of scroll container
                alignSelf: 'flex-start',
                // Limit height to prevent sidebar from extending beyond viewport
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
              }}
            >
              <SkillFilterSidebar
                categories={categories}
                proficiencyLevels={proficiencyLevels}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                loading={isLoading}
                geoLatitude={latitude}
                geoLoading={geoLoading}
                geoSupported={geoSupported}
                onRequestLocation={requestLocation}
                onClearLocation={clearLocation}
                viewMode={showOnly}
              />
            </Box>
          )}

          {/* Skills Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SkillList
              skills={displayedSkills}
              loading={isLoading}
              onEditSkill={canUpdateOwnSkill ? handleEditSkill : undefined}
              onDeleteSkill={canDeleteOwnSkill ? handleDeleteForList : undefined}
              onToggleFavorite={handleToggleFavoriteForList}
              isFavorite={isFavoriteSkill}
              isOwnerView={isOwnerView}
            />

            {/* Pagination Controls - nur wenn mehr als 1 Seite */}
            {showPagination && !isLoading && displayedSkills.length > 0 ? (
              <Box sx={{ mt: 3 }}>
                <PaginationControls
                  totalItems={currentPagination.totalRecords}
                  currentPage={pageNumber}
                  pageSize={pageSize}
                  pageSizeOptions={[12, 24, 36, 48]}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Box>
            ) : null}
          </Box>
        </Box>

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="left"
          open={isFilterDrawerOpen}
          onClose={handleCloseFilterDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 300,
              maxWidth: '85vw',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Filter
            </Typography>
            <IconButton onClick={handleCloseFilterDrawer} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 2, overflowY: 'auto' }}>
            <SkillFilterSidebar
              categories={categories}
              proficiencyLevels={proficiencyLevels}
              filters={filters}
              onFilterChange={handleMobileFilterChange}
              onClearFilters={handleMobileClearFilters}
              loading={isLoading}
              showHeader={false}
              geoLatitude={latitude}
              geoLoading={geoLoading}
              geoSupported={geoSupported}
              onRequestLocation={requestLocation}
              onClearLocation={clearLocation}
              viewMode={showOnly}
            />
          </Box>
        </Drawer>

        {/* Skill Form Dialog */}
        <SkillForm
          open={isFormOpen}
          skill={selectedSkill}
          categories={categories}
          proficiencyLevels={proficiencyLevels}
          loading={isLoading}
          userOfferedSkills={userSkills.filter((s) => s.isOffered)}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedSkill(undefined);
          }}
          onSubmit={(skillData, skillId) => {
            if (skillId) {
              handleUpdate(skillId, skillData as UpdateSkillRequest);
            } else {
              handleCreate(skillData);
            }
          }}
        />

        {/* Floating Action Button for mobile - Create Skill */}
        {isOwnerView && canCreateOwnSkill ? (
          <Tooltip title="Neuen Skill erstellen">
            <Fab
              color="primary"
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                display: { xs: 'flex', md: 'none' },
              }}
              onClick={handleCreateSkill}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        ) : null}
      </Container>
    </SkillErrorBoundary>
  );
};

export default SkillsPage;
