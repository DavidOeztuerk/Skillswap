import React, { useState, useRef, useEffect } from 'react';
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
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  EmojiObjects as SkillIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSkills } from '../../hooks/useSkills';
import { Skill } from '../../types/models/Skill';
import { User } from '../../types/models/User';
import { useDebounce } from '../../hooks/useDebounce';

type SearchResult = {
  skills: {
    items: Skill[];
    isLoading: boolean;
  };
  users: {
    items: User[];
    isLoading: boolean;
  };
  popularSearches: string[];
};

const SearchBar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Skills aus dem Hook holen
  const { skills, searchSkillsByQuery, isLoading } = useSkills();

  // Beispiel-Zustand für die Suchergebnisse
  const [searchResults, setSearchResults] = useState<SearchResult>({
    skills: {
      items: [],
      isLoading: false,
    },
    users: {
      items: [],
      isLoading: false,
    },
    popularSearches: [
      'python programming',
      'react js',
      'webentwicklung',
      'ai skills',
      'machine learning',
    ],
  });

  // Effekt für die Suche
  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
      // Skills suchen
      searchSkillsByQuery(debouncedSearchQuery);

      // Hier könntest du weitere Suchoperationen durchführen, z.B. nach Benutzern suchen
      // Diese könnten aus einem useUsers Hook kommen

      setIsOpen(true);
    } else if (debouncedSearchQuery.length === 0) {
      setIsOpen(false);
    }
  }, [debouncedSearchQuery, searchSkillsByQuery]);

  // Wenn sich die Skills ändern, Suchergebnisse aktualisieren
  useEffect(() => {
    setSearchResults((prev) => ({
      ...prev,
      skills: {
        items: skills || [],
        isLoading: isLoading,
      },
    }));
  }, [skills, isLoading]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    if (event.target.value.length > 0) {
      setIsOpen(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
    }
  };

  const handleSkillClick = (skillId: string) => {
    navigate(`/skills/${skillId}`);
    setIsOpen(false);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    setIsOpen(false);
  };

  const handlePopularSearchClick = (search: string) => {
    setSearchQuery(search);
    navigate(`/search?q=${encodeURIComponent(search)}`);
    setIsOpen(false);
  };

  const handleClickAway = () => {
    setIsOpen(false);
    setIsFocused(false);
  };

  // Maximale Anzahl für Vorschläge
  const MAX_SUGGESTIONS = 5;

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
            boxShadow: isFocused
              ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
              : 'none',
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
            onFocus={() => setIsFocused(true)}
            sx={{
              flexGrow: 1,
              '& .MuiInputBase-input': {
                py: 1,
              },
            }}
            inputProps={{ 'aria-label': 'search' }}
          />
          {searchQuery && (
            <IconButton
              size="small"
              onClick={handleClearSearch}
              aria-label="Suche zurücksetzen"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Paper>

        {/* Dropdown für Suchergebnisse */}
        {isOpen && (
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
                    <Typography
                      variant="subtitle2"
                      sx={{ p: 2, pb: 1, fontWeight: 'bold' }}
                    >
                      Skills
                    </Typography>
                    {searchResults.skills.items.length > 0 ? (
                      <List disablePadding>
                        {searchResults.skills.items
                          .slice(0, MAX_SUGGESTIONS)
                          .map((skill) => (
                            <ListItem
                              key={skill.skillId}
                              component="button"
                              onClick={() => handleSkillClick(skill.skillId)}
                              dense
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <SkillIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={skill.name}
                                secondary={skill.category?.name}
                              />
                            </ListItem>
                          ))}
                      </List>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ px: 2, py: 1, color: 'text.secondary' }}
                      >
                        Keine Skills gefunden
                      </Typography>
                    )}
                  </>
                )}

                <Divider />

                {/* Gefundene Benutzer */}
                <Typography
                  variant="subtitle2"
                  sx={{ p: 2, pb: 1, fontWeight: 'bold' }}
                >
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
                        {searchResults.users.items
                          .slice(0, MAX_SUGGESTIONS)
                          .map((user) => (
                            <ListItem
                              key={user.id}
                              component="button"
                              onClick={() => handleUserClick(user.id)}
                              dense
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <PersonIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={user.firstName + ' ' + user.lastName}
                              />
                            </ListItem>
                          ))}
                      </List>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ px: 2, py: 1, color: 'text.secondary' }}
                      >
                        Keine Benutzer gefunden
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}

            {/* Populäre Suchen anzeigen, wenn keine Eingabe vorhanden ist oder zu Beginn der Eingabe */}
            {(!searchQuery ||
              (searchQuery.length <= 2 &&
                searchResults.skills.items.length === 0)) && (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ p: 2, pb: 1, fontWeight: 'bold' }}
                >
                  Beliebte Themen
                </Typography>
                <List disablePadding>
                  {searchResults.popularSearches.map((search, index) => (
                    <ListItem
                      key={index}
                      component="button"
                      onClick={() => handlePopularSearchClick(search)}
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
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar;
