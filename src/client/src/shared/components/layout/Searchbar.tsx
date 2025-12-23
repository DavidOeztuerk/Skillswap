import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  EmojiObjects as SkillIcon,
} from '@mui/icons-material';
import {
  Box,
  InputBase,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  ClickAwayListener,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { fetchAllSkills } from '../../../features/search/store/searchThunks';
import {
  selectAllSkills,
  selectSkillsLoading,
} from '../../../features/skills/store/skillsSelectors';
import { useDebounce } from '../../hooks/useDebounce';
import type { User } from '../../../features/user/types/User';

const POPULAR_SEARCHES = [
  'python programming',
  'react js',
  'webentwicklung',
  'ai skills',
  'machine learning',
];

const MAX_SUGGESTIONS = 5;

const SearchBar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [manuallyClosedDropdown, setManuallyClosedDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get search results from Redux state using selectors
  const skills = useAppSelector(selectAllSkills);
  const isLoading = useAppSelector(selectSkillsLoading);

  // Derived state: whether dropdown should be open
  // Opens when query is long enough, closes when manually closed or query empty
  const isOpen = useMemo(() => {
    if (manuallyClosedDropdown) return false;
    if (debouncedSearchQuery.length === 0) return false;
    return debouncedSearchQuery.length > 2;
  }, [debouncedSearchQuery, manuallyClosedDropdown]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
      void dispatch(
        fetchAllSkills({
          searchTerm: debouncedSearchQuery,
          pageNumber: 1,
          pageSize: MAX_SUGGESTIONS,
        })
      );
    }
  }, [debouncedSearchQuery, dispatch]);

  /**
   * Memoize search results to prevent unnecessary re-renders
   * Uses useMemo to compute derived state only when dependencies change
   */
  const searchResults = useMemo(
    () => ({
      skills: {
        items: skills,
        isLoading,
      },
      users: {
        items: [] as User[], // User search available in SearchResultsPage
        isLoading: false,
      },
      popularSearches: POPULAR_SEARCHES,
    }),
    [skills, isLoading]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
    if (event.target.value.length > 0) {
      setManuallyClosedDropdown(false);
    }
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setManuallyClosedDropdown(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (searchQuery.trim() !== '') {
        void navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        setManuallyClosedDropdown(true);
      }
    },
    [searchQuery, navigate]
  );

  const handleSkillClick = useCallback(
    (skillId: string) => {
      void navigate(`/skills/${skillId}`);
      setManuallyClosedDropdown(true);
    },
    [navigate]
  );

  const handleUserClick = useCallback(
    (userId: string) => {
      void navigate(`/profile/${userId}`);
      setManuallyClosedDropdown(true);
    },
    [navigate]
  );

  const handlePopularSearchClick = useCallback(
    (search: string) => {
      setSearchQuery(search);
      void navigate(`/search?q=${encodeURIComponent(search)}`);
      setManuallyClosedDropdown(true);
    },
    [navigate]
  );

  const handleClickAway = useCallback(() => {
    setManuallyClosedDropdown(true);
    setIsFocused(false);
  }, []);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', flexGrow: 1, mx: { xs: 1, md: 4 } }}>
        <Paper
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: 50,
            border: `1px solid ${isFocused ? theme.palette.primary.main : theme.palette.divider}`,
            boxShadow: isFocused ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}` : 'none',
            transition: 'all 0.2s ease-in-out',
            pl: 2,
            pr: 1,
            py: 0.5,
            bgcolor: 'background.paper',
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            inputRef={inputRef}
            placeholder="Skills, Personen oder Themen suchen..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              setIsFocused(true);
            }}
            sx={{
              flexGrow: 1,
              '& .MuiInputBase-input': {
                py: 1,
              },
            }}
            inputProps={{ 'aria-label': 'search' }}
          />
          {searchQuery ? (
            <IconButton size="small" onClick={handleClearSearch} aria-label="Suche zurücksetzen">
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Paper>

        {/* Dropdown für Suchergebnisse */}
        {isOpen ? (
          <Paper
            elevation={5}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              zIndex: 1000,
              maxHeight: '80vh',
              overflow: 'auto',
              borderRadius: 2,
            }}
          >
            {/* Eingabe bei der Suche */}
            {searchQuery.length > 0 && (
              <>
                {/* Gefundene Skills */}
                {searchResults.skills.isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 'bold' }}>
                      Skills
                    </Typography>
                    {searchResults.skills.items.length > 0 ? (
                      <List disablePadding>
                        {searchResults.skills.items.slice(0, MAX_SUGGESTIONS).map((skill) => (
                          <ListItem
                            key={skill.id}
                            component="button"
                            onClick={() => {
                              handleSkillClick(skill.id);
                            }}
                            dense
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <SkillIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={skill.name} secondary={skill.category.name} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                        Keine Skills gefunden
                      </Typography>
                    )}
                  </>
                )}

                <Divider />

                {/* Gefundene Benutzer */}
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 'bold' }}>
                  Benutzer
                </Typography>
                {searchResults.users.isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <>
                    {searchResults.users.items.length > 0 ? (
                      <List disablePadding>
                        {searchResults.users.items.slice(0, MAX_SUGGESTIONS).map((user) => (
                          <ListItem
                            key={user.id}
                            component="button"
                            onClick={() => {
                              handleUserClick(user.id);
                            }}
                            dense
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <PersonIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={`${user.firstName} ${user.lastName}`} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                        Keine Benutzer gefunden
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}

            {/* Populäre Suchen anzeigen, wenn keine Eingabe vorhanden ist oder zu Beginn der Eingabe */}
            {(!searchQuery ||
              (searchQuery.length <= 2 && searchResults.skills.items.length === 0)) && (
              <>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 'bold' }}>
                  Beliebte Themen
                </Typography>
                <List disablePadding>
                  {searchResults.popularSearches.map((search) => (
                    <ListItem
                      key={search}
                      component="button"
                      onClick={() => {
                        handlePopularSearchClick(search);
                      }}
                      dense
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <SearchIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={search} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar;
