import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  MyLocation as MyLocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Rating,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
  InputAdornment,
  type SelectChangeEvent,
} from '@mui/material';
import { useGeolocation } from '../../../shared/hooks/useGeolocation';
import { type SkillFilters, DISTANCE_OPTIONS, SORT_OPTIONS } from '../types/SkillFilter';
import type { SkillCategory } from '../types/Skill';

interface SkillFilterBarProps {
  categories: SkillCategory[];
  filters: SkillFilters;
  onFilterChange: (filters: SkillFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

// Helper to count active filters
const countActiveFilters = (filters: SkillFilters): number => {
  let count = 0;
  if (filters.searchTerm) count++;
  if (filters.categoryId) count++;
  if (filters.isOffered === true || filters.isOffered === false) count++;
  if (filters.minRating != null && filters.minRating > 0) count++;
  if (filters.locationType) count++;
  if (filters.maxDistanceKm != null && filters.maxDistanceKm > 0) count++;
  return count;
};

// Helper to get location type label
const getLocationTypeLabel = (type: string): string => {
  switch (type) {
    case 'remote':
      return 'Remote';
    case 'in_person':
      return 'Vor Ort';
    case 'both':
      return 'Beides';
    default:
      return '';
  }
};

// Helper to get geolocation tooltip
const getGeoTooltip = (latitude: number | null, geoLoading: boolean): string => {
  if (latitude != null) return 'Standort erkannt';
  if (geoLoading) return 'Standort wird ermittelt...';
  return 'Standort ermitteln';
};

// Return type for useFilterHandlers hook
interface FilterHandlers {
  clearFilter: (key: keyof SkillFilters) => void;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCategoryChange: (event: SelectChangeEvent) => void;
  handleIsOfferedChange: (_: React.MouseEvent<HTMLElement>, value: string | null) => void;
  handleRatingChange: (_: React.SyntheticEvent, value: number | null) => void;
  handleLocationTypeChange: (event: SelectChangeEvent) => void;
  handleDistanceChange: (event: SelectChangeEvent) => void;
  handleSortChange: (event: SelectChangeEvent) => void;
}

// Custom hook to manage filter handlers - reduces component cognitive complexity
const useFilterHandlers = (
  filters: SkillFilters,
  onFilterChange: (filters: SkillFilters) => void
): FilterHandlers => {
  const clearFilter = useCallback(
    (key: keyof SkillFilters) => {
      onFilterChange({ ...filters, [key]: undefined });
    },
    [filters, onFilterChange]
  );

  const setFilter = useCallback(
    <K extends keyof SkillFilters>(key: K, value: SkillFilters[K]) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange]
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const val = event.target.value;
      if (val) {
        setFilter('searchTerm', val);
      } else {
        clearFilter('searchTerm');
      }
    },
    [setFilter, clearFilter]
  );

  const handleCategoryChange = useCallback(
    (event: SelectChangeEvent) => {
      const val = event.target.value;
      if (val) {
        setFilter('categoryId', val);
      } else {
        clearFilter('categoryId');
      }
    },
    [setFilter, clearFilter]
  );

  const handleIsOfferedChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: string | null) => {
      if (value === 'offered') {
        setFilter('isOffered', true);
      } else if (value === 'requested') {
        setFilter('isOffered', false);
      } else {
        clearFilter('isOffered');
      }
    },
    [setFilter, clearFilter]
  );

  const handleRatingChange = useCallback(
    (_: React.SyntheticEvent, value: number | null) => {
      if (value != null && value > 0) {
        setFilter('minRating', value);
      } else {
        clearFilter('minRating');
      }
    },
    [setFilter, clearFilter]
  );

  const handleLocationTypeChange = useCallback(
    (event: SelectChangeEvent) => {
      const val = event.target.value;
      if (val === 'remote' || val === 'in_person' || val === 'both') {
        setFilter('locationType', val);
      } else {
        clearFilter('locationType');
      }
    },
    [setFilter, clearFilter]
  );

  const handleDistanceChange = useCallback(
    (event: SelectChangeEvent) => {
      const val = event.target.value;
      if (val) {
        setFilter('maxDistanceKm', Number(val));
      } else {
        clearFilter('maxDistanceKm');
      }
    },
    [setFilter, clearFilter]
  );

  const handleSortChange = useCallback(
    (event: SelectChangeEvent) => {
      const val = event.target.value as SkillFilters['sortBy'];
      setFilter('sortBy', val && val.length > 0 ? val : 'relevance');
    },
    [setFilter]
  );

  return {
    clearFilter,
    handleSearchChange,
    handleCategoryChange,
    handleIsOfferedChange,
    handleRatingChange,
    handleLocationTypeChange,
    handleDistanceChange,
    handleSortChange,
  };
};

const SkillFilterBar: React.FC<SkillFilterBarProps> = memo(
  // eslint-disable-next-line sonarjs/cognitive-complexity -- Filter UI requires multiple conditionals
  ({ categories, filters, onFilterChange, onClearFilters, loading = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [expanded, setExpanded] = useState(!isMobile);

    const { latitude, loading: geoLoading, requestLocation, isSupported } = useGeolocation();

    const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

    const {
      clearFilter,
      handleSearchChange,
      handleCategoryChange,
      handleIsOfferedChange,
      handleRatingChange,
      handleLocationTypeChange,
      handleDistanceChange,
      handleSortChange,
    } = useFilterHandlers(filters, onFilterChange);

    const isOfferedValue = useMemo(() => {
      if (filters.isOffered === true) return 'offered';
      if (filters.isOffered === false) return 'requested';
      return 'all';
    }, [filters.isOffered]);

    const getCategoryName = useCallback(
      (id: string): string => categories.find((c) => c.id === id)?.name ?? '',
      [categories]
    );

    const isGeoDisabled = geoLoading || !isSupported;
    const hasActiveIsOffered = typeof filters.isOffered === 'boolean';

    return (
      <Box sx={{ mb: 3 }}>
        {/* Search Bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Skills suchen..."
            value={filters.searchTerm ?? ''}
            onChange={handleSearchChange}
            disabled={loading}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => clearFilter('searchTerm')} edge="end">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <Button
            variant={expanded ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon />}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
            sx={{ minWidth: 120, whiteSpace: 'nowrap' }}
          >
            Filter
            {activeFilterCount > 0 ? (
              <Chip
                size="small"
                label={activeFilterCount}
                color="primary"
                sx={{ ml: 1, height: 20, minWidth: 20 }}
              />
            ) : null}
          </Button>
        </Box>

        {/* Filter Section */}
        <Collapse in={expanded}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <FormControl size="small" fullWidth>
              <InputLabel id="category-filter-label">Kategorie</InputLabel>
              <Select
                labelId="category-filter-label"
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

            <FormControl size="small" fullWidth>
              <InputLabel id="location-filter-label">Ort</InputLabel>
              <Select
                labelId="location-filter-label"
                value={filters.locationType ?? ''}
                onChange={handleLocationTypeChange}
                label="Ort"
                disabled={loading}
              >
                <MenuItem value="">Alle Orte</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="in_person">Vor Ort</MenuItem>
                <MenuItem value="both">Beides</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="distance-filter-label">Entfernung</InputLabel>
                <Select
                  labelId="distance-filter-label"
                  value={filters.maxDistanceKm?.toString() ?? ''}
                  onChange={handleDistanceChange}
                  label="Entfernung"
                  disabled={loading || !isSupported}
                >
                  <MenuItem value="">Keine Einschränkung</MenuItem>
                  {DISTANCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title={getGeoTooltip(latitude, geoLoading)}>
                <span>
                  <IconButton
                    onClick={requestLocation}
                    disabled={isGeoDisabled}
                    color={latitude == null ? 'default' : 'primary'}
                    size="small"
                  >
                    <MyLocationIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            <FormControl size="small" fullWidth>
              <InputLabel id="sort-filter-label">Sortierung</InputLabel>
              <Select
                labelId="sort-filter-label"
                value={filters.sortBy ?? 'relevance'}
                onChange={handleSortChange}
                label="Sortierung"
                disabled={loading}
              >
                {SORT_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Min. Bewertung
              </Typography>
              <Rating
                value={filters.minRating ?? 0}
                onChange={handleRatingChange}
                size="medium"
                disabled={loading}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Typ
              </Typography>
              <ToggleButtonGroup
                value={isOfferedValue}
                exclusive
                onChange={handleIsOfferedChange}
                size="small"
                disabled={loading}
                fullWidth
              >
                <ToggleButton value="all">Alle</ToggleButton>
                <ToggleButton value="offered">Angebote</ToggleButton>
                <ToggleButton value="requested">Gesuche</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="text"
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
                disabled={loading || activeFilterCount === 0}
                fullWidth
              >
                Filter zurücksetzen
              </Button>
            </Box>
          </Box>
        </Collapse>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && !expanded ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {filters.categoryId ? (
              <Chip
                size="small"
                label={`Kategorie: ${getCategoryName(filters.categoryId)}`}
                onDelete={() => clearFilter('categoryId')}
              />
            ) : null}
            {hasActiveIsOffered ? (
              <Chip
                size="small"
                label={filters.isOffered ? 'Angebote' : 'Gesuche'}
                onDelete={() => clearFilter('isOffered')}
              />
            ) : null}
            {filters.locationType ? (
              <Chip
                size="small"
                label={`Ort: ${getLocationTypeLabel(filters.locationType)}`}
                onDelete={() => clearFilter('locationType')}
              />
            ) : null}
            {filters.maxDistanceKm != null && filters.maxDistanceKm > 0 ? (
              <Chip
                size="small"
                label={`Max. ${filters.maxDistanceKm} km`}
                onDelete={() => clearFilter('maxDistanceKm')}
              />
            ) : null}
            {filters.minRating != null && filters.minRating > 0 ? (
              <Chip
                size="small"
                label={`Min. ${filters.minRating}★`}
                onDelete={() => clearFilter('minRating')}
              />
            ) : null}
          </Box>
        ) : null}
      </Box>
    );
  }
);

SkillFilterBar.displayName = 'SkillFilterBar';

export default SkillFilterBar;
