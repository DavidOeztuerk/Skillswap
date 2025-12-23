import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  EmojiObjects as SkillIcon,
} from '@mui/icons-material';
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
import useSkills from '../../../features/skills/hooks/useSkills';
import { useDebounce } from '../../hooks/useDebounce';
import type { Skill } from '../../../features/skills/types/Skill';

const BG_PAPER = 'background.paper';

interface MobileSearchBarProps {
  open: boolean;
  onClose: () => void;
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Skills aus dem Hook holen
  const { skills: skillsRaw, searchSkillsByQuery, isLoading } = useSkills();
  // Type guard to ensure skills is an array of the correct type
  const skills: Skill[] = Array.isArray(skillsRaw) ? skillsRaw : [];

  // Beliebte Suchvorschläge
  const popularSearches = [
    'python programming',
    'react js',
    'webentwicklung',
    'ai skills',
    'machine learning',
  ];

  useEffect(() => {
    if (debouncedQuery.length > 2) {
      void searchSkillsByQuery(debouncedQuery);
    }
  }, [debouncedQuery, searchSkillsByQuery]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = (): void => {
    setSearchQuery('');
  };

  const handleSearchSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (searchQuery.trim() !== '') {
      void navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  const handleSkillClick = (skillId: string): void => {
    void navigate(`/skills/${skillId}`);
    onClose();
  };

  const handlePopularSearchClick = (search: string): void => {
    setSearchQuery(search);
    void navigate(`/search?q=${encodeURIComponent(search)}`);
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
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
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
            {searchQuery ? (
              <IconButton size="small" onClick={handleClearSearch} aria-label="Suche zurücksetzen">
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : null}
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
                  bgcolor: BG_PAPER,
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
                  {skills.length > 0 ? (
                    <List disablePadding>
                      {skills.slice(0, MAX_SUGGESTIONS).map((skill: Skill) => (
                        <ListItem
                          key={skill.id}
                          onClick={() => {
                            handleSkillClick(skill.id);
                          }}
                          sx={{
                            py: 1.5,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <SkillIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={skill.name} secondary={skill.category.name} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ px: 2, py: 2, color: 'text.secondary' }}>
                      Keine Skills gefunden für &quot;{searchQuery}&quot;
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
                  bgcolor: BG_PAPER,
                }}
              >
                Benutzer
              </Typography>

              {/* Beispiel für Benutzersuche - ersetzt dies mit deiner tatsächlichen Implementierung */}
              <Typography variant="body2" sx={{ px: 2, py: 2, color: 'text.secondary' }}>
                Keine Benutzer gefunden für &quot;{searchQuery}&quot;
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
                bgcolor: BG_PAPER,
              }}
            >
              Beliebte Suchen
            </Typography>
            <List disablePadding>
              {popularSearches.map((search) => (
                <ListItem
                  key={search}
                  onClick={() => {
                    handlePopularSearchClick(search);
                  }}
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
                bgcolor: BG_PAPER,
              }}
            >
              Kürzlich gesucht
            </Typography>
            <List disablePadding>
              {/* Hier könnten kürzlich gesuchte Begriffe angezeigt werden - als Beispiel nehmen wir einige an */}
              {['javascript', 'soft skills', 'design thinking'].map((search) => (
                <ListItem
                  key={search}
                  onClick={() => {
                    handlePopularSearchClick(search);
                  }}
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
      </Box>
    </Dialog>
  );
};

export default MobileSearchBar;
