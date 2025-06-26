// src/components/search/MobileSearchBar.tsx
import React, { useState } from 'react';
import {
  Box,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  InputBase,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  EmojiObjects as SkillIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { useSkills } from '../../hooks/useSkills';

interface MobileSearchBarProps {
  open: boolean;
  onClose: () => void;
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Skills aus dem Hook holen
  const { skills, searchSkillsByQuery, isLoading } = useSkills();

  // Beliebte Suchvorschläge
  const popularSearches = [
    'python programming',
    'react js',
    'webentwicklung',
    'ai skills',
    'machine learning',
  ];

  // Effekt für die Suche
  React.useEffect(() => {
    if (debouncedQuery.length > 2) {
      searchSkillsByQuery(debouncedQuery);
    }
  }, [debouncedQuery, searchSkillsByQuery]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  const handleSkillClick = (skillId: string) => {
    navigate(`/skills/${skillId}`);
    onClose();
  };

  const handlePopularSearchClick = (search: string) => {
    setSearchQuery(search);
    navigate(`/search?q=${encodeURIComponent(search)}`);
    onClose();
  };

  // Maximale Anzahl für Vorschläge
  const MAX_SUGGESTIONS = 5;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
        },
      }}
    >
      <AppBar position="sticky" elevation={0} color="inherit">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <ArrowBackIcon />
          </IconButton>

          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
              ml: 1,
              position: 'relative',
            }}
          >
            <InputBase
              placeholder="Skills, Personen oder Themen suchen..."
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
              sx={{
                flexGrow: 1,
                py: 0.5,
                '& input': {
                  py: 1,
                  pl: 0,
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
          </Box>

          <IconButton
            type="submit"
            color="inherit"
            onClick={handleSearchSubmit}
            disabled={!searchQuery}
            sx={{ ml: 1 }}
          >
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 0 }}>
        {/* Suchergebnisse zeigen */}
        {searchQuery.length > 2 && (
          <>
            {/* Gefundene Skills */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  px: 2,
                  py: 1,
                  fontWeight: 'bold',
                  bgcolor: 'background.paper',
                }}
              >
                Skills
              </Typography>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  {skills && skills.length > 0 ? (
                    <List disablePadding>
                      {skills.slice(0, MAX_SUGGESTIONS).map((skill) => (
                        <ListItem
                          key={skill.id}
                          onClick={() => handleSkillClick(skill.id)}
                          sx={{
                            py: 1.5,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <SkillIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={skill.name}
                            secondary={skill.skillCategory?.name}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ px: 2, py: 2, color: 'text.secondary' }}
                    >
                      Keine Skills gefunden für "{searchQuery}"
                    </Typography>
                  )}
                </>
              )}
            </Box>

            {/* Hier könnten weitere Suchergebnisse wie Benutzer angezeigt werden */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  px: 2,
                  py: 1,
                  fontWeight: 'bold',
                  bgcolor: 'background.paper',
                }}
              >
                Benutzer
              </Typography>

              {/* Beispiel für Benutzersuche - ersetzt dies mit deiner tatsächlichen Implementierung */}
              <Typography
                variant="body2"
                sx={{ px: 2, py: 2, color: 'text.secondary' }}
              >
                Keine Benutzer gefunden für "{searchQuery}"
              </Typography>
            </Box>
          </>
        )}

        {/* Beliebte Suchvorschläge anzeigen, wenn keine Ergebnisse oder am Anfang */}
        {searchQuery.length <= 2 && (
          <>
            <Typography
              variant="subtitle2"
              sx={{
                px: 2,
                py: 1,
                fontWeight: 'bold',
                bgcolor: 'background.paper',
              }}
            >
              Beliebte Suchen
            </Typography>
            <List disablePadding>
              {popularSearches.map((search, index) => (
                <ListItem
                  key={index}
                  onClick={() => handlePopularSearchClick(search)}
                  sx={{
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SearchIcon />
                  </ListItemIcon>
                  <ListItemText primary={search} />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Kürzlich gesuchte Begriffe - optionaler Abschnitt */}
        {searchQuery.length <= 2 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              sx={{
                px: 2,
                py: 1,
                fontWeight: 'bold',
                bgcolor: 'background.paper',
              }}
            >
              Kürzlich gesucht
            </Typography>
            <List disablePadding>
              {/* Hier könnten kürzlich gesuchte Begriffe angezeigt werden - als Beispiel nehmen wir einige an */}
              {['javascript', 'soft skills', 'design thinking'].map(
                (search, index) => (
                  <ListItem
                    key={index}
                    onClick={() => handlePopularSearchClick(search)}
                    sx={{
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <SearchIcon />
                    </ListItemIcon>
                    <ListItemText primary={search} />
                  </ListItem>
                )
              )}
            </List>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default MobileSearchBar;
