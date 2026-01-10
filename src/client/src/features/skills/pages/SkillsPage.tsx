import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
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
import { isPagedResponse } from '../../../shared/types/api/UnifiedResponse';
import { Permissions } from '../../auth/components/permissions.constants';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePayment } from '../../payments';
import { profileService } from '../../profile/services/profileService';
import SkillFilterSidebar from '../components/SkillFilterSidebar';
import SkillForm from '../components/SkillForm';
import SkillList from '../components/SkillList';
import useSkills from '../hooks/useSkills';
import useUserListings from '../hooks/useUserListings';
import type { CreateSkillRequest } from '../types/CreateSkillRequest';
import type { Skill } from '../types/Skill';
import type { SkillFilters } from '../types/SkillFilter';
import type { SkillSearchResultResponse } from '../types/SkillResponses';
import type { UpdateSkillRequest } from '../types/UpdateSkillRequest';

// Sidebar width constant
const SIDEBAR_WIDTH = 280;

// Helper to convert SkillSearchResultResponse to Skill type
const mapSearchResultToSkill = (result: SkillSearchResultResponse): Skill => ({
  id: result.skillId,
  userId: result.userId,
  ownerUserName: result.ownerUserName,
  ownerFirstName: result.ownerFirstName,
  ownerLastName: result.ownerLastName,
  name: result.name,
  description: result.description,
  isOffered: result.isOffered,
  category: {
    id: result.category.categoryId,
    name: result.category.name,
    iconName: result.category.iconName,
    color: result.category.color,
    skillCount: result.category.skillCount,
  },
  tagsJson: result.tagsJson,
  averageRating: result.averageRating,
  reviewCount: result.reviewCount,
  endorsementCount: result.endorsementCount,
  estimatedDurationMinutes: result.estimatedDurationMinutes,
  createdAt: result.createdAt.toString(),
  lastActiveAt: result.lastActiveAt?.toString(),
  locationType: result.locationType,
  locationCity: result.locationCity,
  locationCountry: result.locationCountry,
  maxDistanceKm: result.maxDistanceKm,
});

// Helper to count active filters for badge
const countActiveFilters = (filters: SkillFilters): number => {
  let count = 0;
  if (filters.categoryId) count++;
  if (filters.isOffered === true || filters.isOffered === false) count++;
  if (filters.minRating != null && filters.minRating > 0) count++;
  if (filters.locationType) count++;
  if (filters.maxDistanceKm != null && filters.maxDistanceKm > 0) count++;
  return count;
};

// Helper to parse filters from URL search params
const parseFiltersFromParams = (searchParams: URLSearchParams): SkillFilters => {
  const typeParam = searchParams.get('type');
  const isOffered = typeParam === 'offer' ? true : typeParam === 'seek' ? false : undefined;

  return {
    searchTerm: searchParams.get('q') ?? undefined,
    categoryId: searchParams.get('category') ?? undefined,
    isOffered,
    minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    locationType: (searchParams.get('location') as SkillFilters['locationType']) ?? undefined,
    maxDistanceKm: searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined,
    sortBy: (searchParams.get('sort') as SkillFilters['sortBy']) ?? 'relevance',
    sortDirection: (searchParams.get('dir') ?? 'desc') as 'asc' | 'desc',
    userId: searchParams.get('userId') ?? undefined,
  };
};

// Helper to build URL params from filters (declarative approach to reduce complexity)
const buildFilterParams = (filters: SkillFilters): URLSearchParams => {
  const params = new URLSearchParams();

  // Define param mappings: [key, value, condition]
  const mappings: [string, string | undefined, boolean][] = [
    ['q', filters.searchTerm, Boolean(filters.searchTerm)],
    ['category', filters.categoryId, Boolean(filters.categoryId)],
    ['type', filters.isOffered ? 'offer' : 'seek', filters.isOffered !== undefined],
    ['rating', String(filters.minRating ?? ''), (filters.minRating ?? 0) > 0],
    ['location', filters.locationType, Boolean(filters.locationType)],
    ['distance', String(filters.maxDistanceKm ?? ''), (filters.maxDistanceKm ?? 0) > 0],
    ['sort', filters.sortBy, Boolean(filters.sortBy) && filters.sortBy !== 'relevance'],
    [
      'dir',
      filters.sortDirection,
      Boolean(filters.sortDirection) && filters.sortDirection !== 'desc',
    ],
    ['userId', filters.userId, typeof filters.userId === 'string'],
  ];

  mappings.forEach(([key, value, condition]) => {
    if (condition && value) params.set(key, value);
  });

  return params;
};

// Helper to get page title for user profile view
const getUserProfileTitle = (isOffered: boolean | undefined): string => {
  if (isOffered === true) return 'Angebote';
  if (isOffered === false) return 'Gesuche';
  return 'Skills';
};

// Helper to get page description for user profile view
const getUserProfileDescription = (isOffered: boolean | undefined): string => {
  if (isOffered === true) return 'Skills die dieser Nutzer anbietet';
  if (isOffered === false) return 'Skills die dieser Nutzer lernen möchte';
  return 'Alle Skills dieses Nutzers';
};

// Helper to get displayed skills based on view type
const getDisplayedSkills = (
  showOnly: ViewType,
  isUserProfileView: boolean,
  skills: {
    userProfileSkills: SkillSearchResultResponse[];
    userSkills: Skill[];
    favoriteSkills: Skill[];
    allSkills: Skill[];
  }
): Skill[] => {
  if (isUserProfileView && showOnly === 'all') {
    return skills.userProfileSkills.map(mapSearchResultToSkill);
  }

  switch (showOnly) {
    case 'mine':
      return skills.userSkills;
    case 'favorite':
      return skills.favoriteSkills;
    case 'all':
    default:
      return skills.allSkills;
  }
};

// Helper to determine loading state based on view type
const getLoadingState = (
  showOnly: ViewType,
  isUserProfileView: boolean,
  loadingStates: {
    isLoadingUserProfile: boolean;
    isLoadingUser: boolean;
    isLoadingFavorites: boolean;
    isLoadingAll: boolean;
    isLoadingCategories: boolean;
  }
): boolean => {
  const { isLoadingCategories } = loadingStates;
  const metadataLoading = isLoadingCategories;

  if (isUserProfileView && showOnly === 'all') {
    return loadingStates.isLoadingUserProfile || metadataLoading;
  }

  switch (showOnly) {
    case 'mine':
      return loadingStates.isLoadingUser || metadataLoading;
    case 'favorite':
      return loadingStates.isLoadingFavorites || loadingStates.isLoadingAll || metadataLoading;
    case 'all':
    default:
      return loadingStates.isLoadingAll || metadataLoading;
  }
};

// Default pagination for favorites (no server-side pagination yet)
const DEFAULT_FAVORITE_PAGINATION = {
  totalPages: 1,
  pageNumber: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

// Pagination type
interface PaginationInfo {
  totalRecords: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Helper to get pagination based on view type
const getPagination = (
  showOnly: ViewType,
  isUserProfileView: boolean,
  paginationData: {
    userProfilePagination: PaginationInfo;
    userSkillsPagination: PaginationInfo;
    allSkillsPagination: PaginationInfo;
    favoritesLength: number;
  }
): PaginationInfo => {
  if (isUserProfileView && showOnly === 'all') {
    return paginationData.userProfilePagination;
  }

  switch (showOnly) {
    case 'mine':
      return paginationData.userSkillsPagination;
    case 'favorite':
      return {
        ...DEFAULT_FAVORITE_PAGINATION,
        totalRecords: paginationData.favoritesLength,
        pageSize: paginationData.favoritesLength || 12,
      };
    case 'all':
    default:
      return paginationData.allSkillsPagination;
  }
};

// Extracted component: Back to profile button
interface BackToProfileButtonProps {
  isUserProfileView: boolean;
  userId: string | undefined;
  navigate: (path: string) => void;
}

const BackToProfileButton: React.FC<BackToProfileButtonProps> = ({
  isUserProfileView,
  userId,
  navigate,
}) => {
  if (!isUserProfileView || typeof userId !== 'string') return null;

  const handleClick = (): void => {
    navigate(`/users/${userId}`);
  };

  return (
    <Button startIcon={<ArrowBackIcon />} onClick={handleClick} sx={{ mb: 1 }} size="small">
      Zurück zum Profil
    </Button>
  );
};

// Extracted component: Create skill button
interface CreateSkillButtonProps {
  isOwnerView: boolean;
  canCreate: boolean;
  isMobile: boolean;
  onClick: () => void;
}

const CreateSkillButton: React.FC<CreateSkillButtonProps> = ({
  isOwnerView,
  canCreate,
  isMobile,
  onClick,
}) => {
  if (!isOwnerView || !canCreate) return null;

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      onClick={onClick}
      size="medium"
    >
      {isMobile ? 'Neu' : 'Neuer Skill'}
    </Button>
  );
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

  // ⚡ useTransition for non-blocking filter updates
  const [isPending, startTransition] = useTransition();

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
    isLoadingAll,
    isLoadingUser,
    isLoadingCategories,
    isLoadingFavorites,
    error,
    // Actions (all memoized)
    fetchAllSkills,
    fetchUserSkills,
    fetchSkillById,
    fetchCategories,
    fetchFavoriteSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    addFavoriteSkill,
    removeFavoriteSkill,
    isFavoriteSkill,
    allSkillsPagination,
    userSkillsPagination,
    getSkillById,
  } = useSkills();

  // Payment/Boost functionality
  const { openModal: openBoostModal } = usePayment();
  const { getOrCreateListingForSkill, isSkillBoosted } = useUserListings(showOnly === 'mine');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>();
  const [isLoadingEditSkill, setIsLoadingEditSkill] = useState(false);

  // ⚡ PERFORMANCE: Single state object for user profile view
  // This reduces re-renders from 3 to 1 (loading + skills + pagination → single update)
  const [userProfileState, setUserProfileState] = useState<{
    skills: SkillSearchResultResponse[];
    pagination: {
      totalRecords: number;
      totalPages: number;
      pageNumber: number;
      pageSize: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    isLoading: boolean;
  }>({
    skills: [],
    pagination: {
      totalRecords: 0,
      totalPages: 1,
      pageNumber: 1,
      pageSize: 12,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    isLoading: false,
  });

  // Destructure for easier access (these are stable references due to single state)
  const userProfileSkills = userProfileState.skills;
  const userProfilePagination = userProfileState.pagination;
  const isLoadingUserProfile = userProfileState.isLoading;

  // ===== FILTER & PAGINATION STATE =====
  // Read filters from URL params (uses extracted helper)
  const filtersFromUrl = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);

  // Check if viewing another user's skills
  const isUserProfileView = Boolean(filtersFromUrl.userId);

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
  const baseConfig = PAGE_CONFIG[showOnly];

  // Override title/description for user profile view (uses extracted helpers)
  const pageTitle = isUserProfileView ? getUserProfileTitle(filters.isOffered) : baseConfig.title;

  const pageDescription = isUserProfileView
    ? getUserProfileDescription(filters.isOffered)
    : baseConfig.description;

  // ===== FILTER CHANGE HANDLERS =====
  // ⚡ startTransition wraps state updates to keep UI responsive
  const handleFilterChange = useCallback(
    (newFilters: SkillFilters) => {
      const mergedFilters: SkillFilters = { ...newFilters, userId: filters.userId };
      // URL update happens immediately (not in transition)
      setSearchParams(buildFilterParams(mergedFilters), { replace: true });
      // State updates are low priority - UI stays responsive
      startTransition(() => {
        setFilters(mergedFilters);
        setPageNumber(1);
      });
    },
    [setSearchParams, filters.userId, startTransition]
  );

  const handleClearFilters = useCallback(() => {
    const clearedFilters: SkillFilters = filters.userId ? { userId: filters.userId } : {};
    setSearchParams(buildFilterParams(clearedFilters), { replace: true });
    startTransition(() => {
      setFilters(clearedFilters);
      setPageNumber(1);
    });
  }, [setSearchParams, filters.userId, startTransition]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      startTransition(() => {
        setPageNumber(newPage);
      });
    },
    [startTransition]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      startTransition(() => {
        setPageSize(newPageSize);
        setPageNumber(1);
      });
    },
    [startTransition]
  );

  // ===== MEMOIZED DATA LOADING FUNCTIONS =====
  // Note: These functions return void (fire-and-forget dispatch)
  const loadMetadata = useCallback((): void => {
    fetchCategories();
    // Favorites loading is conditional but we call anyway - service handles auth
    fetchFavoriteSkills();
  }, [fetchCategories, fetchFavoriteSkills]);

  // Helper to load user profile skills (extracted to reduce complexity)
  // ⚡ PERFORMANCE: Uses startTransition to keep UI responsive during data updates
  const loadUserProfileSkills = useCallback(
    (params: {
      userId: string;
      isOffered?: boolean;
      pageNumber: number;
      pageSize: number;
      locationType?: 'remote' | 'in_person' | 'both';
      categoryId?: string;
    }): void => {
      // Set loading state immediately (high priority)
      setUserProfileState((prev) => ({ ...prev, isLoading: true }));

      profileService
        .getUserSkills(params.userId, {
          isOffered: params.isOffered,
          pageNumber: params.pageNumber,
          pageSize: params.pageSize,
          locationType: params.locationType,
          categoryId: params.categoryId,
        })
        .then((response) => {
          // ⚡ CRITICAL: startTransition marks this update as LOW PRIORITY
          // React can interrupt the list re-render to keep the UI responsive
          startTransition(() => {
            if (isPagedResponse(response)) {
              setUserProfileState({
                skills: response.data,
                pagination: {
                  totalRecords: response.totalRecords,
                  totalPages: response.totalPages,
                  pageNumber: response.pageNumber,
                  pageSize: response.pageSize,
                  hasNextPage: response.hasNextPage,
                  hasPreviousPage: response.hasPreviousPage,
                },
                isLoading: false,
              });
            } else {
              setUserProfileState((prev) => ({
                ...prev,
                skills: [],
                isLoading: false,
              }));
            }
          });
        })
        .catch((fetchError: unknown) => {
          errorService.addBreadcrumb('Failed to load user profile skills', 'error', { fetchError });
          startTransition(() => {
            setUserProfileState((prev) => ({
              ...prev,
              skills: [],
              isLoading: false,
            }));
          });
        });
    },
    [startTransition] // startTransition is stable from useTransition
  );

  const loadSkillsData = useCallback((): void => {
    // Route to appropriate loader based on view type
    if (showOnly === 'mine') {
      fetchUserSkills({
        pageNumber,
        pageSize,
        isOffered: filters.isOffered,
        categoryId: filters.categoryId,
        locationType: filters.locationType,
      });
      return;
    }

    if (showOnly === 'favorite' && user?.id) {
      fetchFavoriteSkills();
      fetchAllSkills({ pageNumber, pageSize });
      return;
    }

    if (typeof filters.userId === 'string') {
      // Simple direct call - no wrapper needed
      loadUserProfileSkills({
        userId: filters.userId,
        isOffered: filters.isOffered,
        pageNumber,
        pageSize,
        locationType: filters.locationType,
        categoryId: filters.categoryId,
      });
      return;
    }

    // Default: load all skills with filters
    const locationParams =
      (filters.maxDistanceKm ?? 0) > 0 && latitude != null && longitude != null
        ? { userLatitude: latitude, userLongitude: longitude }
        : {};

    fetchAllSkills({ ...filters, pageNumber, pageSize, ...locationParams });
    // Note: We intentionally don't include `filters` in deps to avoid double-triggers.
    // The individual filter values are already dependencies of loadUserProfileSkills/fetchUserSkills.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showOnly,
    user?.id,
    fetchUserSkills,
    fetchAllSkills,
    fetchFavoriteSkills,
    loadUserProfileSkills,
    // filters - removed to prevent double-trigger; filter values flow through loadUserProfileSkills
    filters.userId, // Only include userId for routing decision
    filters.isOffered,
    filters.categoryId,
    filters.locationType,
    filters.maxDistanceKm,
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
    async (skill: Skill): Promise<void> => {
      if (isOwnerView) {
        errorService.addBreadcrumb('Opening skill edit form', 'ui', { skillId: skill.id });

        // Fetch full skill details to get exchange/scheduling/location fields
        // The userSkills list doesn't include these fields
        setIsLoadingEditSkill(true);
        try {
          await fetchSkillById(skill.id);
          // Get the updated skill from the store (fetchSkillById updates the entity)
          const fullSkill = getSkillById(skill.id);
          setSelectedSkill(fullSkill ?? skill);
          setIsFormOpen(true);
        } catch (err) {
          errorService.addBreadcrumb('Failed to fetch skill details for edit', 'error', { err });
          // Fallback to partial skill data
          setSelectedSkill(skill);
          setIsFormOpen(true);
        } finally {
          setIsLoadingEditSkill(false);
        }
      } else {
        errorService.addBreadcrumb('Navigating to skill detail', 'navigation', {
          skillId: skill.id,
        });
        void navigate(`/skills/${skill.id}`);
      }
    },
    [isOwnerView, navigate, fetchSkillById, getSkillById]
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

  // Handle boost skill - get or create listing for skill and open boost modal
  // Uses getOrCreateListingForSkill which handles 409 gracefully
  const handleBoostSkill = useCallback(
    async (skill: Skill): Promise<void> => {
      // Check if already boosted
      if (isSkillBoosted(skill.id)) {
        errorService.addBreadcrumb('Skill is already boosted', 'info', { skillId: skill.id });
        return;
      }

      // Get existing listing or create new one (handles 409 gracefully)
      const listing = await getOrCreateListingForSkill(
        skill.id,
        skill.isOffered ? 'Offer' : 'Request'
      );

      if (!listing) {
        errorService.addBreadcrumb('Could not get or create listing for skill', 'error', {
          skillId: skill.id,
        });
        return;
      }

      // Open boost modal with the listing
      openBoostModal(listing.id, skill.name);
    },
    [getOrCreateListingForSkill, isSkillBoosted, openBoostModal]
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
  const displayedSkills = useMemo(
    () =>
      getDisplayedSkills(showOnly, isUserProfileView, {
        userProfileSkills,
        userSkills,
        favoriteSkills,
        allSkills,
      }),
    [showOnly, userSkills, favoriteSkills, allSkills, isUserProfileView, userProfileSkills]
  );

  const isLoading = useMemo(() => {
    const baseLoading = getLoadingState(showOnly, isUserProfileView, {
      isLoadingUserProfile,
      isLoadingUser,
      isLoadingFavorites,
      isLoadingAll,
      isLoadingCategories,
    });
    // Include isPending from useTransition to show loading during filter changes
    return baseLoading || isPending;
  }, [
    showOnly,
    isLoadingAll,
    isLoadingUser,
    isLoadingFavorites,
    isLoadingCategories,
    isUserProfileView,
    isLoadingUserProfile,
    isPending,
  ]);

  // Pagination pro View auswählen (uses extracted helper)
  const currentPagination = useMemo(
    () =>
      getPagination(showOnly, isUserProfileView, {
        userProfilePagination,
        userSkillsPagination,
        allSkillsPagination,
        favoritesLength: favoriteSkills.length,
      }),
    [
      showOnly,
      allSkillsPagination,
      userSkillsPagination,
      favoriteSkills.length,
      isUserProfileView,
      userProfilePagination,
    ]
  );

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
            {/* Back to Profile button when viewing another user's skills */}
            <BackToProfileButton
              isUserProfileView={isUserProfileView}
              userId={filters.userId}
              navigate={navigate}
            />
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

            <CreateSkillButton
              isOwnerView={isOwnerView}
              canCreate={canCreateOwnSkill}
              isMobile={isMobile}
              onClick={handleCreateSkill}
            />
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
              onBoostSkill={isOwnerView ? handleBoostSkill : undefined}
              onToggleFavorite={handleToggleFavoriteForList}
              isFavorite={isFavoriteSkill}
              isSkillBoosted={isOwnerView ? isSkillBoosted : undefined}
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
          loading={isLoading || isLoadingEditSkill}
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
