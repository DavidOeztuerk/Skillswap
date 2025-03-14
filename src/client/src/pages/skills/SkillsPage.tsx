// SkillsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Fab,
  Tooltip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useSkills } from '../../hooks/useSkills';
import SkillList from '../../components/skills/SkillList';
import SkillForm from '../../components/skills/SkillForm';
import { Skill } from '../../types/models/Skill';
import PaginationControls from '../../components/pagination/PaginationControls';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`skills-tabpanel-${index}`}
    aria-labelledby={`skills-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

function a11yProps(index: number) {
  return {
    id: `skills-tab-${index}`,
    'aria-controls': `skills-tabpanel-${index}`,
  };
}

/* --------------------------------
   Form Data Interface
-----------------------------------*/
interface SkillFormData {
  name: string;
  description: string;
  isOffering: boolean;
  skillCategoryId: string;
  proficiencyLevelId: string;
}

const SkillsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    skills,
    userSkills,
    categories,
    proficiencyLevels,
    error,
    pagination,
    searchQuery,
    getSkills,
    getUserSkills,
    searchAllSkills,
    searchMySkills,
    addSkill,
    editSkill,
    removeSkill,
    changePagination,
    isLoading,
    isCreating,
    isUpdating,
  } = useSkills();

  const [activeTab, setActiveTab] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const pageSizeOptions = [12, 24, 48, 96];

  useEffect(() => {
    if (activeTab === 0) {
      if (searchQuery) {
        searchAllSkills(
          searchQuery,
          pagination.currentPage,
          pagination.pageSize
        );
      } else {
        getSkills(pagination.currentPage, pagination.pageSize);
      }
    } else {
      if (searchQuery) {
        searchMySkills(
          searchQuery,
          pagination.currentPage,
          pagination.pageSize
        );
      } else {
        getUserSkills(pagination.currentPage, pagination.pageSize);
      }
    }
  }, [
    activeTab,
    pagination.currentPage,
    pagination.pageSize,
    searchQuery,
    getSkills,
    getUserSkills,
    searchAllSkills,
    searchMySkills,
  ]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    changePagination(1, pagination.pageSize);
  };

  const handleSearch = () => {
    if (activeTab === 0) {
      searchAllSkills(localSearchQuery, 1, pagination.pageSize);
    } else {
      searchMySkills(localSearchQuery, 1, pagination.pageSize);
    }
    changePagination(1, pagination.pageSize);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    if (activeTab === 0) {
      getSkills(1, pagination.pageSize);
    } else {
      getUserSkills(1, pagination.pageSize);
    }
    changePagination(1, pagination.pageSize);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    changePagination(page, pagination.pageSize);
  };
  const handlePageSizeChange = (pageSize: number) => {
    changePagination(1, pageSize);
  };

  const handleOpenCreateForm = () => {
    setSelectedSkill(undefined);
    setIsFormOpen(true);
  };
  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSkill(undefined);
  };

  const handleViewSkillDetails = (skill: Skill) => {
    console.log('[View Skill Details]', skill);
  };

  const handleDeleteSkill = async (skillId: string) => {
    console.log(skillId);

    const result = await removeSkill(skillId);
    if (result.success) {
      setNotification({
        open: true,
        message: 'Skill erfolgreich gelöscht',
        severity: 'success',
      });
      if (activeTab === 0) {
        getSkills(pagination.currentPage, pagination.pageSize);
      } else {
        getUserSkills(pagination.currentPage, pagination.pageSize);
      }
    } else {
      setNotification({
        open: true,
        message: `Fehler beim Löschen: ${result.error}`,
        severity: 'error',
      });
    }
  };

  // Log die Daten, bevor sie an addSkill/editSkill gehen
  const handleSubmitSkill = async (
    skillData: SkillFormData,
    skillId?: string
  ) => {
    console.log(
      '[SkillsPage] handleSubmitSkill -> skillData:',
      skillData,
      ' skillId:',
      skillId
    );

    if (skillId) {
      const result = await editSkill(skillId, skillData);
      console.log('[SkillsPage] editSkill result:', result);
      if (result.success) {
        setNotification({
          open: true,
          message: 'Skill erfolgreich aktualisiert',
          severity: 'success',
        });
        setIsFormOpen(false);

        if (activeTab === 0) {
          getSkills(pagination.currentPage, pagination.pageSize);
        } else {
          getUserSkills(pagination.currentPage, pagination.pageSize);
        }
      } else {
        setNotification({
          open: true,
          message: `Fehler beim Aktualisieren: ${result.error}`,
          severity: 'error',
        });
      }
    } else {
      const result = await addSkill(skillData);
      console.log('[SkillsPage] addSkill result:', result);
      if (result.success) {
        setNotification({
          open: true,
          message: 'Skill erfolgreich erstellt',
          severity: 'success',
        });
        setIsFormOpen(false);

        setActiveTab(1);
        changePagination(1, pagination.pageSize);
        getUserSkills(1, pagination.pageSize);
      } else {
        setNotification({
          open: true,
          message: `Fehler beim Erstellen: ${result.error}`,
          severity: 'error',
        });
      }
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Skills
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateForm}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          Neuen Skill erstellen
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Skills durchsuchen..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: localSearchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearSearch}
                    edge="end"
                    aria-label="Suche zurücksetzen"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={isLoading}
            >
              Suchen
            </Button>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? `Suchergebnisse für "${searchQuery}"`
                : 'Alle verfügbaren Skills'}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Skills-Tabs"
          variant={isMobile ? 'fullWidth' : 'standard'}
        >
          <Tab label="Alle Skills" {...a11yProps(0)} />
          <Tab label="Meine Skills" {...a11yProps(1)} />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <SkillList
          skills={skills}
          loading={isLoading}
          error={error || undefined}
          onEditSkill={handleEditSkill}
          onDeleteSkill={handleDeleteSkill}
          onViewSkillDetails={handleViewSkillDetails}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <SkillList
          skills={userSkills}
          loading={isLoading}
          error={error || undefined}
          onEditSkill={handleEditSkill}
          onDeleteSkill={handleDeleteSkill}
          onViewSkillDetails={handleViewSkillDetails}
        />
      </TabPanel>

      <Box sx={{ mt: 3 }}>
        <PaginationControls
          totalItems={
            pagination.totalItems ||
            (activeTab === 0 ? skills.length : userSkills.length)
          }
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Box>

      <Tooltip title="Neuen Skill erstellen">
        <Fab
          color="primary"
          aria-label="Neuen Skill erstellen"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'inline-flex', sm: 'none' },
          }}
          onClick={handleOpenCreateForm}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <SkillForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitSkill}
        categories={categories}
        proficiencyLevels={proficiencyLevels}
        loading={isCreating || isUpdating}
        skill={selectedSkill}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SkillsPage;
