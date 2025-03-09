import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Tabs,
  Tab,
  Button,
  Pagination,
  SelectChangeEvent,
  OutlinedInput,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SkillCard from './SkillCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { SKILL_CATEGORIES } from '../../config/constants';
import { Skill } from '../../types/models/Skill';
import { UserSkill } from '../../types/models/UserSkill';

interface SkillListProps {
  skills: Skill[] | UserSkill[];
  isLoading?: boolean;
  error?: string | null;
  isUserSkillList?: boolean;
  onAddSkill?: (skill: Skill) => void;
  onEditSkill?: (userSkill: UserSkill) => void;
  onRemoveSkill?: (userSkill: UserSkill) => void;
  onTeachSkill?: (userSkill: UserSkill) => void;
  onLearnSkill?: (userSkill: UserSkill) => void;
}

/**
 * Komponente zur Anzeige einer Liste von Skills mit Filter- und Suchfunktionen
 */
const SkillList: React.FC<SkillListProps> = ({
  skills,
  isLoading = false,
  error = null,
  isUserSkillList = false,
  onAddSkill,
  onEditSkill,
  onRemoveSkill,
  onTeachSkill,
  onLearnSkill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const skillsPerPage = 12;

  // Tab-Werte
  const tabs = isUserSkillList
    ? ['Alle', 'Lehrbare Skills', 'Lernbare Skills']
    : ['Alle Skills'];

  // Filtern der Skills
  const filteredSkills = useMemo(() => {
    return skills.filter((skillItem) => {
      const skill = isUserSkillList
        ? (skillItem as UserSkill).skill
        : (skillItem as Skill);

      // Suchfilter
      const matchesSearch =
        !searchTerm ||
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Kategoriefilter
      const matchesCategory =
        !selectedCategory || skill.category === selectedCategory;

      // Tab-Filter (nur für UserSkill-Liste)
      let matchesTab = true;
      if (isUserSkillList) {
        const userSkill = skillItem as UserSkill;
        if (tabValue === 1) {
          matchesTab = userSkill.isTeachable;
        } else if (tabValue === 2) {
          matchesTab = userSkill.isLearnable;
        }
      }

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [skills, searchTerm, selectedCategory, tabValue, isUserSkillList]);

  // Pagination
  const pageCount = Math.ceil(filteredSkills.length / skillsPerPage);
  const displayedSkills = filteredSkills.slice(
    (currentPage - 1) * skillsPerPage,
    currentPage * skillsPerPage
  );

  // Handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setTabValue(0);
    setCurrentPage(1);
  };

  // Zustand: Laden / Fehler / Keine Daten
  if (isLoading) {
    return <LoadingSpinner message="Skills werden geladen..." />;
  }
  if (error) {
    return (
      <EmptyState
        title="Fehler beim Laden der Skills"
        description={error}
        actionLabel="Erneut versuchen"
        actionHandler={() => window.location.reload()}
      />
    );
  }
  if (!skills.length) {
    return (
      <EmptyState
        title={
          isUserSkillList ? 'Keine Skills hinzugefügt' : 'Keine Skills gefunden'
        }
        description={
          isUserSkillList
            ? 'Du hast bisher keine Skills zu deinem Profil hinzugefügt.'
            : 'Es wurden keine Skills gefunden, die deinen Filterkriterien entsprechen.'
        }
        actionLabel={
          isUserSkillList ? 'Skills entdecken' : 'Filter zurücksetzen'
        }
        actionPath={isUserSkillList ? '/skills/discover' : undefined}
        actionHandler={!isUserSkillList ? resetFilters : undefined}
      />
    );
  }

  return (
    <Box>
      {/* Filter-Bereich */}
      <Box mb={3}>
        <Grid container columns={12} spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              label="Skills durchsuchen"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-label">Kategorie</InputLabel>
              <Select
                labelId="category-label"
                label="Kategorie"
                value={selectedCategory}
                onChange={handleCategoryChange}
                input={
                  <OutlinedInput
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterListIcon />
                      </InputAdornment>
                    }
                  />
                }
              >
                <MenuItem value="">Alle Kategorien</MenuItem>
                <Divider />
                {SKILL_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={resetFilters}
              startIcon={<RestartAltIcon />}
              sx={{ height: '100%' }}
            >
              Zurücksetzen
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs (nur für UserSkill-Liste) */}
      {isUserSkillList && (
        <Box mb={3}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab} />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Ergebnisanzahl */}
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2" color="text.secondary">
          {filteredSkills.length}{' '}
          {filteredSkills.length === 1 ? 'Skill' : 'Skills'} gefunden
        </Typography>

        {pageCount > 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Seite {currentPage} von {pageCount}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Skills-Grid */}
      {displayedSkills.length > 0 ? (
        <Grid container columns={12} spacing={3}>
          {displayedSkills.map((skillItem) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              key={
                isUserSkillList
                  ? (skillItem as UserSkill).id
                  : (skillItem as Skill).id
              }
            >
              <SkillCard
                skill={skillItem}
                isUserSkill={isUserSkillList}
                onAddClick={
                  !isUserSkillList && onAddSkill
                    ? () => onAddSkill(skillItem as Skill)
                    : undefined
                }
                onEditClick={
                  isUserSkillList && onEditSkill
                    ? () => onEditSkill(skillItem as UserSkill)
                    : undefined
                }
                onRemoveClick={
                  isUserSkillList && onRemoveSkill
                    ? () => onRemoveSkill(skillItem as UserSkill)
                    : undefined
                }
                onTeachClick={
                  isUserSkillList && onTeachSkill
                    ? () => onTeachSkill(skillItem as UserSkill)
                    : undefined
                }
                onLearnClick={
                  isUserSkillList && onLearnSkill
                    ? () => onLearnSkill(skillItem as UserSkill)
                    : undefined
                }
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState
          title="Keine passenden Skills gefunden"
          description="Versuche, deine Suchkriterien anzupassen."
          actionLabel="Filter zurücksetzen"
          actionHandler={resetFilters}
        />
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <Box mt={4} display="flex" justifyContent="center">
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default SkillList;
