/**
 * SkillFilterSidebar - Vertical filter sidebar for Udemy-style skills page
 *
 * Features:
 * - Sticky positioning on desktop
 * - All filters vertically stacked
 * - No search bar (global search in header)
 * - Mobile: Shown in drawer via parent component
 */

import React, { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Rating,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  Paper,
  Badge,
  type SelectChangeEvent,
} from '@mui/material';
import { type SkillFilters, DISTANCE_OPTIONS, SORT_OPTIONS, EXPERIENCE_OPTIONS } from '../types/SkillFilter';
import type { SkillCategory } from '../types/Skill';

interface SkillFilterSidebarProps {
  categories: SkillCategory[];
  filters: SkillFilters;
  onFilterChange: (filters: SkillFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
  /** Optional: Show header with filter count */
  showHeader?: boolean;
  /** Geolocation state - REQUIRED: lifted from parent for shared state */
  geoLatitude: number | null;
  geoLoading: boolean;
  geoSupported: boolean;
  onRequestLocation: () => void;
  /** Called when location type changes away from 'in_person' to clear geolocation */
  onClearLocation?: () => void;
  /**
   * Current view mode - controls which filters are shown
   * - 'all': All filters (default)
   * - 'mine': Show locationType (remote/vor Ort), hide distance filter
   * - 'favorite': All filters
   */
  viewMode?: 'all' | 'mine' | 'favorite';
}

// Helper to count active filters
const countActiveFilters = (filters: SkillFilters): number => {
  let count = 0;
  if (filters.categoryId) count++;
  if (filters.isOffered === true || filters.isOffered === false) count++;
  if (filters.minRating != null && filters.minRating > 0) count++;
  if (filters.locationType) count++;
  if (filters.maxDistanceKm != null && filters.maxDistanceKm > 0) count++;
  // Experience filters (Phase 5)
  if (filters.minExperienceYears != null && filters.minExperienceYears > 0) count++;
  if (filters.maxExperienceYears != null) count++;
  return count;
};

// Helper to get geolocation tooltip
const getGeoTooltip = (latitude: number | null, geoLoading: boolean): string => {
  if (latitude != null) return 'Standort erkannt';
  if (geoLoading) return 'Standort wird ermittelt...';
  return 'Standort ermitteln';
};

// Custom hook to manage filter handlers
// IMPORTANT: Uses functional updates via filtersRef to avoid recreating callbacks on every filter change
const useFilterHandlers = (
  filters: SkillFilters,
  onFilterChange: (filters: SkillFilters) => void,
  onClearLocation?: () => void
): {
  handleCategoryChange: (event: SelectChangeEvent) => void;
  handleIsOfferedChange: (_: React.MouseEvent<HTMLElement>, value: string | null) => void;
  handleRatingChange: (_: React.SyntheticEvent, value: number | null) => void;
  handleLocationTypeChange: (event: SelectChangeEvent) => void;
  handleDistanceChange: (event: SelectChangeEvent) => void;
  handleSortChange: (event: SelectChangeEvent) => void;
  handleMinExperienceChange: (event: SelectChangeEvent) => void;
  handleMaxExperienceChange: (event: SelectChangeEvent) => void;
} => {
  // Use refs to access current values without recreating callbacks
  const filtersRef = React.useRef(filters);
  const onFilterChangeRef = React.useRef(onFilterChange);
  const onClearLocationRef = React.useRef(onClearLocation);

  // Update refs in useEffect to avoid updating during render
  React.useLayoutEffect(() => {
    filtersRef.current = filters;
    onFilterChangeRef.current = onFilterChange;
    onClearLocationRef.current = onClearLocation;
  });

  // These callbacks are now STABLE - they never change reference
  const handleCategoryChange = useCallback((event: SelectChangeEvent) => {
    const val = event.target.value;
    onFilterChangeRef.current({
      ...filtersRef.current,
      categoryId: val || undefined,
    });
  }, []);

  const handleIsOfferedChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: string | null) => {
      let isOffered: boolean | undefined;
      if (value === 'offered') {
        isOffered = true;
      } else if (value === 'requested') {
        isOffered = false;
      } else {
        isOffered = undefined;
      }
      onFilterChangeRef.current({
        ...filtersRef.current,
        isOffered,
      });
    },
    []
  );

  const handleRatingChange = useCallback((_: React.SyntheticEvent, value: number | null) => {
    onFilterChangeRef.current({
      ...filtersRef.current,
      minRating: value != null && value > 0 ? value : undefined,
    });
  }, []);

  const handleLocationTypeChange = useCallback((event: SelectChangeEvent) => {
    const val = event.target.value;
    let locationType: SkillFilters['locationType'];

    // Map UI values to filter values
    // 'all' = undefined (show all), 'remote' and 'in_person' pass through
    if (val === 'remote' || val === 'in_person') {
      locationType = val;
    } else {
      // 'all' or any other value means "Alle Orte" - no filter
      locationType = undefined;
    }

    // Only clear distance/geolocation when switching TO 'remote'
    // (distance filter is not relevant for remote-only skills)
    if (locationType === 'remote') {
      onFilterChangeRef.current({
        ...filtersRef.current,
        locationType,
        maxDistanceKm: undefined,
      });
      onClearLocationRef.current?.();
    } else {
      onFilterChangeRef.current({
        ...filtersRef.current,
        locationType,
      });
    }
  }, []);

  const handleDistanceChange = useCallback((event: SelectChangeEvent) => {
    const val = event.target.value;
    // 'none' or empty means no distance filter
    const maxDistanceKm = val && val !== 'none' ? Number(val) : undefined;
    onFilterChangeRef.current({
      ...filtersRef.current,
      maxDistanceKm,
    });
  }, []);

  const handleSortChange = useCallback((event: SelectChangeEvent) => {
    const val = event.target.value as SkillFilters['sortBy'];
    onFilterChangeRef.current({
      ...filtersRef.current,
      sortBy: val && val.length > 0 ? val : 'relevance',
    });
  }, []);

  // Experience filter handlers (Phase 5)
  const handleMinExperienceChange = useCallback((event: SelectChangeEvent) => {
    const val = event.target.value;
    const minExperienceYears = val && val !== 'none' ? Number(val) : undefined;
    onFilterChangeRef.current({
      ...filtersRef.current,
      minExperienceYears,
    });
  }, []);

  const handleMaxExperienceChange = useCallback((event: SelectChangeEvent) => {
    const val = event.target.value;
    const maxExperienceYears = val && val !== 'none' ? Number(val) : undefined;
    onFilterChangeRef.current({
      ...filtersRef.current,
      maxExperienceYears,
    });
  }, []);

  return {
    handleCategoryChange,
    handleIsOfferedChange,
    handleRatingChange,
    handleLocationTypeChange,
    handleDistanceChange,
    handleSortChange,
    handleMinExperienceChange,
    handleMaxExperienceChange,
  };
};

// Filter section wrapper component
const FilterSection: React.FC<{
  label: string;
  children: React.ReactNode;
}> = memo(({ label, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={600}
      sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}
    >
      {label}
    </Typography>
    {children}
  </Box>
));

FilterSection.displayName = 'FilterSection';

const SkillFilterSidebar: React.FC<SkillFilterSidebarProps> = memo(
  ({
    categories,
    filters,
    onFilterChange,
    onClearFilters,
    loading = false,
    showHeader = true,
    geoLatitude,
    geoLoading,
    geoSupported,
    onRequestLocation,
    onClearLocation,
    viewMode = 'all',
  }) => {
    // Determine which filters to show based on viewMode
    // - 'mine': Show locationType (remote/vor Ort), but hide distance filter
    // - 'favorite': Show all filters (favorites can be from different users/locations)
    // - 'all': Show all filters
    const showDistanceFilter = viewMode !== 'mine';
    // Use ref to stabilize requestLocation callback for useEffect
    const requestLocationRef = useRef(onRequestLocation);
    useEffect(() => {
      requestLocationRef.current = onRequestLocation;
    }, [onRequestLocation]);

    const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

    const {
      handleCategoryChange,
      handleIsOfferedChange,
      handleRatingChange,
      handleLocationTypeChange,
      handleDistanceChange,
      handleSortChange,
      handleMinExperienceChange,
      handleMaxExperienceChange,
    } = useFilterHandlers(filters, onFilterChange, onClearLocation);

    const isOfferedValue = useMemo(() => {
      if (filters.isOffered === true) return 'offered';
      if (filters.isOffered === false) return 'requested';
      return 'all';
    }, [filters.isOffered]);

    const isGeoDisabled = geoLoading || !geoSupported;

    // Auto-trigger geolocation when distance filter is selected but location not yet obtained
    // Uses ref to prevent effect from re-running when requestLocation reference changes
    useEffect(() => {
      if (
        filters.maxDistanceKm != null &&
        filters.maxDistanceKm > 0 &&
        geoLatitude == null &&
        geoSupported &&
        !geoLoading
      ) {
        requestLocationRef.current();
      }
    }, [filters.maxDistanceKm, geoLatitude, geoSupported, geoLoading]);

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Header */}
        {showHeader ? (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge
                  badgeContent={activeFilterCount}
                  color="primary"
                  invisible={activeFilterCount === 0}
                >
                  <FilterListIcon color="primary" />
                </Badge>
                <Typography variant="h6" fontWeight="bold">
                  Filter
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 2.5 }} />
          </>
        ) : null}

        {/* Skill Type Toggle */}
        <FilterSection label="Typ">
          <ToggleButtonGroup
            value={isOfferedValue}
            exclusive
            onChange={handleIsOfferedChange}
            size="small"
            disabled={loading}
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                py: 0.75,
                fontSize: '0.8rem',
              },
            }}
          >
            <ToggleButton value="all">Alle</ToggleButton>
            <ToggleButton value="offered">Angebote</ToggleButton>
            <ToggleButton value="requested">Gesuche</ToggleButton>
          </ToggleButtonGroup>
        </FilterSection>

        {/* Category */}
        <FilterSection label="Kategorie">
          <FormControl size="small" fullWidth>
            <InputLabel id="sidebar-category-label">Kategorie</InputLabel>
            <Select
              labelId="sidebar-category-label"
              value={filters.categoryId ?? ''}
              onChange={handleCategoryChange}
              label="Kategorie"
              disabled={loading}
            >
              <MenuItem value="">Alle Kategorien</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FilterSection>

        {/* Location Type - Always shown (remote/vor Ort is useful for all views) */}
        <FilterSection label="Standort">
          <FormControl size="small" fullWidth>
            <InputLabel id="sidebar-location-label">Ort</InputLabel>
            <Select
              labelId="sidebar-location-label"
              value={filters.locationType ?? 'all'}
              onChange={handleLocationTypeChange}
              label="Ort"
              disabled={loading}
            >
              <MenuItem value="all">Alle Orte</MenuItem>
              <MenuItem value="remote">Remote</MenuItem>
              <MenuItem value="in_person">Vor Ort</MenuItem>
            </Select>
          </FormControl>
        </FilterSection>

        {/* Distance - Shown for 'Alle Orte' and 'Vor Ort', hidden for 'Remote' and 'mine' view */}
        {showDistanceFilter && filters.locationType !== 'remote' ? (
          <FilterSection label="Maximale Entfernung">
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="sidebar-distance-label">Entfernung</InputLabel>
                <Select
                  labelId="sidebar-distance-label"
                  value={filters.maxDistanceKm?.toString() ?? 'none'}
                  onChange={handleDistanceChange}
                  label="Entfernung"
                  disabled={loading || !geoSupported}
                >
                  <MenuItem value="none">Beliebig</MenuItem>
                  {DISTANCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title={getGeoTooltip(geoLatitude, geoLoading)}>
                <span>
                  <IconButton
                    onClick={onRequestLocation}
                    disabled={isGeoDisabled}
                    color={geoLatitude == null ? 'default' : 'primary'}
                    size="small"
                  >
                    <MyLocationIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </FilterSection>
        ) : null}

        {/* Min Rating */}
        <FilterSection label="Mindestbewertung">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating
              value={filters.minRating ?? 0}
              onChange={handleRatingChange}
              size="medium"
              disabled={loading}
            />
            {filters.minRating != null && filters.minRating > 0 && (
              <Typography variant="caption" color="text.secondary">
                {filters.minRating}+ Sterne
              </Typography>
            )}
          </Box>
        </FilterSection>

        {/* Experience Filter (Phase 5) - Only shown in 'all' view */}
        {viewMode === 'all' ? (
          <FilterSection label="Berufserfahrung">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="sidebar-min-experience-label">Mindestens</InputLabel>
                <Select
                  labelId="sidebar-min-experience-label"
                  value={filters.minExperienceYears?.toString() ?? 'none'}
                  onChange={handleMinExperienceChange}
                  label="Mindestens"
                  disabled={loading}
                >
                  <MenuItem value="none">Beliebig</MenuItem>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel id="sidebar-max-experience-label">Höchstens</InputLabel>
                <Select
                  labelId="sidebar-max-experience-label"
                  value={filters.maxExperienceYears?.toString() ?? 'none'}
                  onChange={handleMaxExperienceChange}
                  label="Höchstens"
                  disabled={loading}
                >
                  <MenuItem value="none">Beliebig</MenuItem>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </FilterSection>
        ) : null}

        {/* Sort */}
        <FilterSection label="Sortierung">
          <FormControl size="small" fullWidth>
            <InputLabel id="sidebar-sort-label">Sortieren nach</InputLabel>
            <Select
              labelId="sidebar-sort-label"
              value={filters.sortBy ?? 'relevance'}
              onChange={handleSortChange}
              label="Sortieren nach"
              disabled={loading}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FilterSection>

        {/* Clear Filters Button */}
        <Divider sx={{ my: 2 }} />
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={onClearFilters}
          disabled={loading || activeFilterCount === 0}
          fullWidth
          size="medium"
        >
          Filter zurücksetzen
        </Button>
      </Paper>
    );
  }
);

SkillFilterSidebar.displayName = 'SkillFilterSidebar';

export default SkillFilterSidebar;
