// src/components/skills/SkillList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Pagination,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Menu,
  SelectChangeEvent,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { Skill, SkillCategory, ProficiencyLevel } from '../../types/models/Skill';
import { useSkills } from '../../hooks/useSkills';
import SkillCard from './SkillCard';

interface SkillListProps {
  userSkillsOnly?: boolean;
  title?: string;
  showActions?: boolean;
  limit?: number;
  categoryId?: string;
  onSkillSelect?: (skill: Skill) => void;
  offeringOnly?: boolean; // Nur "angebotene" Skills anzeigen
  seekingOnly?: boolean; // Nur "gesuchte" Skills anzeigen
}

type SortOption = {
  value: string;
  label: string;
};

const sortOptions: SortOption[] = [
  { value: 'nameAsc', label: 'Name (A-Z)' },
  { value: 'nameDesc', label: 'Name (Z-A)' },
  { value: 'newestFirst', label: 'Neueste zuerst' },
  { value: 'oldestFirst', label: 'Älteste zuerst' },
];

const SkillList: React.FC<SkillListProps> = ({
  userSkillsOnly = false,
  title,
  showActions = true,
  limit,
  categoryId,
  onSkillSelect,
  offeringOnly = false,
  seekingOnly = false
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    skills,
    userSkills,
    categories,
    proficiencyLevels,
    status,
    getSkills,
    getUserSkills,
    getCategories,
    getProficiencyLevels,
    pagination,
    changePagination,
    searchAllSkills,
    searchMySkills,
  } = useSkills();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || '');
  const [selectedProficiency, setSelectedProficiency] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('nameAsc');
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [isOffering, setIsOffering] = useState<boolean | null>(
    offeringOnly ? true : (seekingOnly ? false : null)
  );
  
  // Constants
  const PAGE_SIZE = 12;
  const isLoading = userSkillsOnly ? status.userSkills === 'loading' : status.skills === 'loading';
  
  // Load data on component mount
  useEffect(() => {
    if (userSkillsOnly) {
      getUserSkills(page, PAGE_SIZE);
    } else {
      getSkills(page, PAGE_SIZE);
    }
    
    if (categories.length === 0) {
      getCategories();
    }
    
    if (proficiencyLevels.length === 0) {
      getProficiencyLevels();
    }
  }, [
    getSkills,
    getUserSkills,
    getCategories,
    getProficiencyLevels,
    userSkillsOnly,
    page,
    categories.length,
    proficiencyLevels.length,
  ]);
  
  // When categoryId prop changes
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [categoryId]);
  
  // When offeringOnly or seekingOnly props change
  useEffect(() => {
    setIsOffering(offeringOnly ? true : (seekingOnly ? false : null));
  }, [offeringOnly, seekingOnly]);
  
  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearch = () => {
    if (userSkillsOnly) {
      searchMySkills(searchQuery, 1, PAGE_SIZE);
    } else {
      searchAllSkills(searchQuery, 1, PAGE_SIZE);
    }
    setPage(1);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    if (userSkillsOnly) {
      getUserSkills(1, PAGE_SIZE);
    } else {
      getSkills(1, PAGE_SIZE);
    }
    setPage(1);
  };
  
  const handleCategoryChange = (e: SelectChangeEvent<string>) => {
    setSelectedCategory(e.target.value);
  };
  
  const handleProficiencyChange = (e: SelectChangeEvent<string>) => {
    setSelectedProficiency(e.target.value);
  };

  const handleOfferingChange = (e: SelectChangeEvent<"all" | "offering" | "seeking">) => {
    const value = e.target.value;
    setIsOffering(value === 'all' ? null : value === 'offering');
  };
  
  const handleSortChange = (e: SelectChangeEvent<string>) => {
    setSortBy(e.target.value);
  };
  
  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    changePagination(newPage, PAGE_SIZE);
    
    if (searchQuery) {
      if (userSkillsOnly) {
        searchMySkills(searchQuery, newPage, PAGE_SIZE);
      } else {
        searchAllSkills(searchQuery, newPage, PAGE_SIZE);
      }
    } else {
      if (userSkillsOnly) {
        getUserSkills(newPage, PAGE_SIZE);
      } else {
        getSkills(newPage, PAGE_SIZE);
      }
    }
  };
  
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };
  
  const handleAddSkill = () => {
    navigate('/skills/create');
  };
  
  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedProficiency('');
    setSortBy('nameAsc');
    setIsOffering(offeringOnly ? true : (seekingOnly ? false : null)); // Reset to prop-driven defaults
  };
  
  // Filter and sort skills
  const filterAndSortSkills = (skillsToProcess: Skill[]): Skill[] => {
    // Make a copy to avoid modifying the original array
    let processedSkills = [...skillsToProcess];
    
    // Apply category filter
    if (selectedCategory) {
      processedSkills = processedSkills.filter(skill => skill.skillCategoryId === selectedCategory);
    }
    
    // Apply proficiency level filter
    if (selectedProficiency) {
      processedSkills = processedSkills.filter(skill => skill.proficiencyLevelId === selectedProficiency);
    }
    
    // Apply offering/seeking filter
    if (isOffering !== null) {
      processedSkills = processedSkills.filter(skill => skill.isOffering === isOffering);
    }
    
    // Apply sorting
    processedSkills.sort((a, b) => {
      switch (sortBy) {
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'newestFirst':
          // Fallback to name sorting if we don't have creation dates
          return a.name.localeCompare(b.name);
        case 'oldestFirst':
          // Fallback to name sorting if we don't have creation dates
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    // Apply limit if specified
    if (limit && processedSkills.length > limit) {
      processedSkills = processedSkills.slice(0, limit);
    }
    
    return processedSkills;
  };
  
  // Determine which skills to display
  const displayedSkills = filterAndSortSkills(userSkillsOnly ? userSkills : skills);
  
  // Check if filters are active
  const hasActiveFilters = !!selectedCategory || !!selectedProficiency || sortBy !== 'nameAsc' || isOffering !== null;
  
  // Current active category name (for display)
  const activeCategoryName = selectedCategory ? 
    categories.find(cat => cat.id === selectedCategory)?.name || 'Unbekannte Kategorie' : '';
  
  // Current active proficiency level name (for display)
  const activeProficiencyName = selectedProficiency ?
    proficiencyLevels.find(level => level.id === selectedProficiency)?.level || 'Unbekanntes Level' : '';
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Title and Actions Bar */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3 
        }}
      >
        <Typography variant="h5" component="h1" fontWeight="bold">
          {title || (userSkillsOnly ? 'Meine Skills' : 'Alle Skills')}
        </Typography>

        {showActions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {userSkillsOnly && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddSkill}
                size={isMobile ? 'small' : 'medium'}
              >
                Skill hinzufügen
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Search and Filter Area */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-end">
            {/* Search Field */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Skills suchen"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                        aria-label="Suche zurücksetzen"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Offering/Seeking Filter (if not fixed by props) */}
            {!offeringOnly && !seekingOnly && !isMobile && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="offering-filter-label">Typ</InputLabel>
                  <Select<"all" | "offering" | "seeking">
                    labelId="offering-filter-label"
                    id="offering-filter"
                    value={isOffering === null ? 'all' : (isOffering ? 'offering' : 'seeking')}
                    onChange={handleOfferingChange}
                    label="Typ"
                  >
                    <MenuItem value="all">Alle Typen</MenuItem>
                    <MenuItem value="offering">Angeboten</MenuItem>
                    <MenuItem value="seeking">Gesucht</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Sort By Field (Desktop/Tablet) */}
            {!isMobile && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="sort-by-label">Sortieren nach</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    id="sort-by"
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Sortieren nach"
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon />
                      </InputAdornment>
                    }
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Category Filter (Desktop only) */}
            {!isTablet && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="category-filter-label">Kategorie</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    label="Kategorie"
                  >
                    <MenuItem value="">Alle Kategorien</MenuItem>
                    {categories.map((category: SkillCategory) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Filter Button (Mobile/Tablet) */}
            {isTablet && (
              <Grid item xs={isMobile ? 6 : 3}>
                <Button
                  fullWidth
                  variant={hasActiveFilters ? "contained" : "outlined"}
                  color={hasActiveFilters ? "primary" : "inherit"}
                  startIcon={<FilterListIcon />}
                  onClick={handleFilterMenuOpen}
                  sx={{ height: '56px' }}
                >
                  Filter {hasActiveFilters && <Box component="span" sx={{ ml: 1 }}>(✓)</Box>}
                </Button>
              </Grid>
            )}

            {/* Search Button (Mobile) */}
            {isMobile && (
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  sx={{ height: '56px' }}
                >
                  Suchen
                </Button>
              </Grid>
            )}
          </Grid>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                Aktive Filter:
              </Typography>
              
              {selectedCategory && (
                <Chip
                  label={`Kategorie: ${activeCategoryName}`}
                  onDelete={() => setSelectedCategory('')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {selectedProficiency && (
                <Chip
                  label={`Level: ${activeProficiencyName}`}
                  onDelete={() => setSelectedProficiency('')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {isOffering !== null && !offeringOnly && !seekingOnly && (
                <Chip
                  label={`Typ: ${isOffering ? 'Angeboten' : 'Gesucht'}`}
                  onDelete={() => setIsOffering(null)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {sortBy !== 'nameAsc' && (
                <Chip
                  label={`Sortierung: ${sortOptions.find(opt => opt.value === sortBy)?.label}`}
                  onDelete={() => setSortBy('nameAsc')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ ml: 'auto' }}
              >
                Filter zurücksetzen
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filter Menu for Mobile/Tablet */}
      <Menu
        anchorEl={filterMenuAnchorEl}
        open={Boolean(filterMenuAnchorEl)}
        onClose={handleFilterMenuClose}
        PaperProps={{
          sx: {
            maxWidth: '90vw',
            width: 350,
            p: 2,
          },
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Filter und Sortierung
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="menu-sort-by-label">Sortieren nach</InputLabel>
          <Select
            labelId="menu-sort-by-label"
            id="menu-sort-by"
            value={sortBy}
            onChange={handleSortChange}
            label="Sortieren nach"
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Skill Type in Menu (if not fixed by props) */}
        {!offeringOnly && !seekingOnly && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="menu-offering-filter-label">Typ</InputLabel>
            <Select<"all" | "offering" | "seeking">
              labelId="menu-offering-filter-label"
              id="menu-offering-filter"
              value={isOffering === null ? 'all' : (isOffering ? 'offering' : 'seeking')}
              onChange={handleOfferingChange}
              label="Typ"
            >
              <MenuItem value="all">Alle Typen</MenuItem>
              <MenuItem value="offering">Angeboten</MenuItem>
              <MenuItem value="seeking">Gesucht</MenuItem>
            </Select>
          </FormControl>
        )}
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="menu-category-filter-label">Kategorie</InputLabel>
          <Select
            labelId="menu-category-filter-label"
            id="menu-category-filter"
            value={selectedCategory}
            onChange={handleCategoryChange}
            label="Kategorie"
          >
            <MenuItem value="">Alle Kategorien</MenuItem>
            {categories.map((category: SkillCategory) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="menu-proficiency-filter-label">Fertigkeitsstufe</InputLabel>
          <Select
            labelId="menu-proficiency-filter-label"
            id="menu-proficiency-filter"
            value={selectedProficiency}
            onChange={handleProficiencyChange}
            label="Fertigkeitsstufe"
          >
            <MenuItem value="">Alle Stufen</MenuItem>
            {proficiencyLevels.map((level: ProficiencyLevel) => (
              <MenuItem key={level.id} value={level.id}>
                {level.level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            onClick={handleClearFilters}
            color="inherit"
          >
            Zurücksetzen
          </Button>
          <Button 
            variant="contained" 
            onClick={handleFilterMenuClose}
          >
            Filter anwenden
          </Button>
        </Box>
      </Menu>

      {/* Skills Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : displayedSkills.length > 0 ? (
        <Grid container spacing={3}>
          {displayedSkills.map((skill) => (
            <Grid item key={skill.id} xs={12} sm={6} md={4} lg={3}>
              <SkillCard
                skill={skill}
                isOwner={userSkillsOnly}
                // Kategorienamen und Fertigkeitsstufennamen aus den globalen Listen ermitteln
                categoryName={categories.find(cat => cat.id === skill.skillCategoryId)?.name}
                proficiencyLevelName={proficiencyLevels.find(level => level.id === skill.proficiencyLevelId)?.level}
                onSelect={() => {
                  if (onSkillSelect) {
                    onSkillSelect(skill);
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box 
          sx={{ 
            py: 8, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" textAlign="center" color="text.secondary" gutterBottom>
            {searchQuery ? (
              <>Keine Skills gefunden für "{searchQuery}"</>
            ) : hasActiveFilters ? (
              <>Keine Skills entsprechen den gewählten Filtern</>
            ) : userSkillsOnly ? (
              <>Du hast noch keine Skills angelegt</>
            ) : (
              <>Keine Skills verfügbar</>
            )}
          </Typography>
          
          {userSkillsOnly && !searchQuery && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddSkill}
              sx={{ mt: 2 }}
            >
              Ersten Skill hinzufügen
            </Button>
          )}
          
          {(searchQuery || hasActiveFilters) && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setSearchQuery('');
                handleClearFilters();
                if (userSkillsOnly) {
                  getUserSkills(1, PAGE_SIZE);
                } else {
                  getSkills(1, PAGE_SIZE);
                }
              }}
              sx={{ mt: 2 }}
            >
              Filter zurücksetzen
            </Button>
          )}
        </Box>
      )}

      {/* Pagination */}
      {!limit && displayedSkills.length > 0 && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
      )}
    </Box>
  );
};

export default SkillList;