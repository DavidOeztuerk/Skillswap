import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
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
  Pagination,
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../../core/store/store.hooks';
import PageErrorBoundary from '../../../shared/components/error/PageErrorBoundary';
import SkillCard from '../../skills/components/SkillCard';
import { fetchUserSearchResults, fetchAllSkills } from '../store/searchThunks';

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
    userLoading,
    allSkillsLoading,
    userPagination,
    allSkillsPagination,
  } = useAppSelector((state) => state.search);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [searchType, setSearchType] = useState<'users' | 'skills' | 'all'>(
    (searchParams.get('type') as 'users' | 'skills' | 'all' | null) ?? 'all'
  );
  const [currentPage, setCurrentPage] = useState(
    Number.parseInt(searchParams.get('page') ?? '1', 10)
  );

  const performSearch = useCallback(
    async (query: string, type: string, pageNumber: number) => {
      if (!query.trim()) return;

      if (type === 'users' || type === 'all') {
        // Fetch user's skills matching the search
        await dispatch(fetchUserSearchResults({ pageNumber, pageSize: 10 }));
      }

      if (type === 'skills' || type === 'all') {
        // Fetch all skills with search query
        await dispatch(fetchAllSkills({ searchTerm: query, pageNumber, pageSize: 10 }));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    const handleSearch = async (): Promise<void> => {
      const query = searchParams.get('q');
      const type = searchParams.get('type') ?? 'all';
      const page = Number.parseInt(searchParams.get('page') ?? '1', 10);

      if (query) {
        setSearchQuery(query);
        setSearchType(type as 'users' | 'skills' | 'all');
        setCurrentPage(page);
        await performSearch(query, type, page);
      }
    };
    handleSearch().catch(() => {});
  }, [searchParams, performSearch]);

  const handleEditSkill = useCallback(() => {
    console.debug('Edit skill not implemented in search page');
  }, []);

  const handleDeleteSkill = useCallback(() => {
    console.debug('Delete skill not implemented in search page');
  }, []);

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setCurrentPage(1);

    const newParams = new URLSearchParams();
    if (query) newParams.set('q', query);
    if (searchType !== 'all') newParams.set('type', searchType);
    newParams.set('page', '1');

    setSearchParams(newParams);
  };

  const handleTypeChange = (type: 'users' | 'skills' | 'all'): void => {
    setSearchType(type);
    setCurrentPage(1);

    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('q', searchQuery);
    if (type !== 'all') newParams.set('type', type);
    newParams.set('page', '1');

    setSearchParams(newParams);
  };

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);

    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('q', searchQuery);
    if (searchType !== 'all') newParams.set('type', searchType);
    newParams.set('page', page.toString());

    setSearchParams(newParams);
  };

  const handleClearSearch = (): void => {
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
  };

  const loading = isLoading || userLoading || allSkillsLoading;
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment:
                  searchQuery === '' ? undefined : (
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
              },
            }}
            sx={{ mb: 2 }}
          />

          {/* Search Type Filters */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label="All"
              variant={searchType === 'all' ? 'filled' : 'outlined'}
              onClick={() => {
                handleTypeChange('all');
              }}
              color={searchType === 'all' ? 'primary' : 'default'}
            />
            <Chip
              label="Users"
              variant={searchType === 'users' ? 'filled' : 'outlined'}
              onClick={() => {
                handleTypeChange('users');
              }}
              color={searchType === 'users' ? 'primary' : 'default'}
            />
            <Chip
              label="Skills"
              variant={searchType === 'skills' ? 'filled' : 'outlined'}
              onClick={() => {
                handleTypeChange('skills');
              }}
              color={searchType === 'skills' ? 'primary' : 'default'}
            />
          </Stack>

          {/* Search Button */}
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => {
              handleSearch(searchQuery);
            }}
            disabled={!searchQuery.trim() || loading}
            sx={{ mr: 2 }}
          >
            Search
          </Button>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : null}

        {/* No Results */}
        {!loading && searchQuery !== '' && !hasResults && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No results found for &quot;{searchQuery}&quot;
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try adjusting your search terms or filters
            </Typography>
          </Box>
        )}

        {/* Results */}
        {!loading && hasResults ? (
          <>
            {/* User Skills Results */}
            {(searchType === 'all' || searchType === 'users') && userResults.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Your Skills ({userResults.length})
                </Typography>
                <Grid container spacing={2}>
                  {userResults.map((skill) => (
                    <Grid key={skill.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <SkillCard
                        skill={skill}
                        onEdit={handleEditSkill}
                        onDelete={handleDeleteSkill}
                      />
                    </Grid>
                  ))}
                </Grid>

                {userPagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={userPagination.totalPages}
                      page={currentPage}
                      onChange={(_, page) => {
                        handlePageChange(page);
                      }}
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
                        onEdit={handleEditSkill}
                        onDelete={handleDeleteSkill}
                      />
                    </Grid>
                  ))}
                </Grid>

                {allSkillsPagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={allSkillsPagination.totalPages}
                      page={currentPage}
                      onChange={(_, page) => {
                        handlePageChange(page);
                      }}
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : null}

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
