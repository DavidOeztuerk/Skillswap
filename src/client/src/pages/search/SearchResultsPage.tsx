// src/pages/search/SearchResultsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { fetchUserSearchResults, fetchAllSkills, selectSearchError } from '../../features/search/searchSlice';
import PageErrorBoundary from '../../components/error/PageErrorBoundary';
import SkillCard from '../../components/skills/SkillCard';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';

/**
 * Search Results Page - Displays search results for users and skills
 */
const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  
  const {
    userResults,
    allSkills,
    isLoading,
    userPagination,
    allSkillsPagination,
  } = useAppSelector((state) => state.search);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'users' | 'skills' | 'all'>(
    (searchParams.get('type') as 'users' | 'skills' | 'all') || 'all'
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  useEffect(() => {
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (query) {
      setSearchQuery(query);
      setSearchType(type as 'users' | 'skills' | 'all');
      setCurrentPage(page);
      performSearch(query, type as 'users' | 'skills' | 'all', page);
    }
  }, [searchParams]);

  const performSearch = (query: string, type: string, page: number = 1) => {
    if (!query.trim()) return;

    if (type === 'users' || type === 'all') {
      dispatch(fetchUserSearchResults({
         page, pageSize: 10 
      }));
    }

    if (type === 'skills' || type === 'all') {
      dispatch(fetchAllSkills({
         page, pageSize: 10 
      }));
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    
    const newParams = new URLSearchParams();
    if (query) newParams.set('q', query);
    if (searchType !== 'all') newParams.set('type', searchType);
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  const handleTypeChange = (type: 'users' | 'skills' | 'all') => {
    setSearchType(type);
    setCurrentPage(1);
    
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('q', searchQuery);
    if (type !== 'all') newParams.set('type', type);
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('q', searchQuery);
    if (searchType !== 'all') newParams.set('type', searchType);
    newParams.set('page', page.toString());
    
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
  };

  // const isLoading = loading || userLoading || allSkillsLoading;
  const hasError = selectSearchError.length > 0;
  const hasResults = userResults.length > 0 || allSkills.length > 0;

  return (
    <PageErrorBoundary pageName="Search Results">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Search Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search Results
          </Typography>
          
          {/* Search Input */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for users or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleClearSearch}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <ClearIcon />
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Search Type Filters */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label="All"
              variant={searchType === 'all' ? 'filled' : 'outlined'}
              onClick={() => handleTypeChange('all')}
              color={searchType === 'all' ? 'primary' : 'default'}
            />
            <Chip
              label="Users"
              variant={searchType === 'users' ? 'filled' : 'outlined'}
              onClick={() => handleTypeChange('users')}
              color={searchType === 'users' ? 'primary' : 'default'}
            />
            <Chip
              label="Skills"
              variant={searchType === 'skills' ? 'filled' : 'outlined'}
              onClick={() => handleTypeChange('skills')}
              color={searchType === 'skills' ? 'primary' : 'default'}
            />
          </Stack>

          {/* Search Button */}
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => handleSearch(searchQuery)}
            disabled={!searchQuery.trim() || isLoading}
            sx={{ mr: 2 }}
          >
            Search
          </Button>
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {hasError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {hasError}
          </Alert>
        )}

        {/* No Results */}
        {!isLoading && !hasError && searchQuery && !hasResults && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No results found for "{searchQuery}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try adjusting your search terms or filters
            </Typography>
          </Box>
        )}

        {/* Results */}
        {!isLoading && !hasError && hasResults && (
          <>
            {/* User Skills Results */}
            {(searchType === 'all' || searchType === 'users') && userResults.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Your Skills ({userResults.length})
                </Typography>
                <Grid container spacing={2}>
                  {userResults.map((skill) => (
                    <Grid key={skill.id} sx={{xs:12, sm:6, md:4}}>
                      <SkillCard 
                        skill={skill} 
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onViewDetails={() => {}}
                      />
                    </Grid>
                  ))}
                </Grid>
                
                {userPagination && userPagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={userPagination.totalPages}
                      page={currentPage}
                      onChange={(_, page) => handlePageChange(page)}
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* Skills Results */}
            {(searchType === 'all' || searchType === 'skills') && allSkills.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Skills ({allSkills.length})
                </Typography>
                <Grid container spacing={2}>
                  {allSkills.map((skill) => (
                    <Grid key={skill.id} sx={{ xs: 12, sm: 6, md: 4 }}>
                      <SkillCard 
                        skill={skill} 
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onViewDetails={() => {}}
                      />
                    </Grid>
                  ))}
                </Grid>
                
                {allSkillsPagination && allSkillsPagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={allSkillsPagination.totalPages}
                      page={currentPage}
                      onChange={(_, page) => handlePageChange(page)}
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            )}
          </>
        )}

        {/* Initial State */}
        {!searchQuery && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Enter a search term to find users and skills
            </Typography>
          </Box>
        )}
      </Container>
    </PageErrorBoundary>
  );
};

export default SearchResultsPage;