// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Typography,
//   Button,
//   Container,
//   Paper,
//   TextField,
//   InputAdornment,
//   IconButton,
//   Fab,
//   Tooltip,
//   Snackbar,
//   Alert,
//   Chip,
//   Stack,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   SelectChangeEvent,
//   Tabs,
//   Tab,
//   ToggleButton,
//   ToggleButtonGroup,
// } from '@mui/material';
// import {
//   Search as SearchIcon,
//   Add as AddIcon,
//   Clear as ClearIcon,
//   FilterList as FilterIcon,
//   Refresh as RefreshIcon,
// } from '@mui/icons-material';
// import { useSkills } from '../../hooks/useSkills';
// import SkillList from '../../components/skills/SkillList';
// import SkillForm from '../../components/skills/SkillForm';
// import { Skill } from '../../types/models/Skill';
// import PaginationControls from '../../components/pagination/PaginationControls';
// import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
// import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';
// import AlertMessage from '../../components/ui/AlertMessage';
// import LoadingSpinner from '../../components/ui/LoadingSpinner';
// import ConfirmDialog from '../../components/ui/ConfirmDialog';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';

import { Container } from "@mui/material";

// import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
// import MatchForm from '../../components/matchmaking/MatchForm';
// import { useMatchmaking } from '../../hooks/useMatchmaking';
// import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
// import { useUserById } from '../../hooks/useUserById';

// Form data interfaces
// interface SkillFormData extends CreateSkillRequest {
//   tags?: string[];
//   remoteAvailable?: boolean;
//   location?: string;
// }

// interface UpdateSkillFormData extends UpdateSkillRequest {
//   tags?: string[];
//   remoteAvailable?: boolean;
//   location?: string;
// }

// // Filter state interface
// interface FilterState {
//   categoryId: string;
//   proficiencyLevelId: string;
//   isOffering: boolean | undefined;
//   tags: string[];
// }

interface SkillsPageProps {
  showOnly:  'all' | 'mine' | "favorite";
}

// /**
//  * Skill Page 
// */
const SkillsPage: React.FC<SkillsPageProps> = ({ showOnly }) => {
//   // Toggle für Angebote/Gesuche in "Meine Skills"
//   // const [mySkillType, setMySkillType] = useState<'all' | 'offer' | 'search'>('all');
//   const navigate = useNavigate();

//   // Skills hook
//   const {
//     getCurrentSkills,
//     userSkills,
//     categories,
//     proficiencyLevels,
//     searchQuery,
//     isSearchActive,
//     pagination,
//     errors,
//     isLoading,
//     isCreating,
//     isUpdating,
//     fetchAllSkills,
//     fetchUserSkills,
//     searchSkillsByQuery,
//     searchUserSkills,
//     createSkill,
//     updateSkill,
//     deleteSkill,
//     fetchCategories,
//     fetchProficiencyLevels,
//     updatePagination,
//     dismissError,
//     selectSkill,
//     clearSkill,
//     setQuery,
//     clearSearch,
//     // FAVORITES
//     favoriteSkillIds,
//     fetchFavoriteSkills,
//     addFavoriteSkill,
//     removeFavoriteSkill,
//   } = useSkills();

//   const { user } = useAuth();

//   // Helper: Is skill a favorite?
//   const isFavorite = (skillId: string) => favoriteSkillIds.includes(skillId);

//   // Handler: Add/remove favorite
//   const handleToggleFavorite = async (skill: Skill) => {
//    if (user) {
//      if (isFavorite(skill.skillId)) {
//       await removeFavoriteSkill(user.id, skill.skillId);
//     } else {
//       await addFavoriteSkill(user.id, skill.skillId);
//     }
//    }
//   };

//   // Local state
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   // const [isMatchFormOpen, setIsMatchFormOpen] = useState(false); // ✅ HINZUGEFÜGT
//   const [selectedSkillForEdit, setSelectedSkillForEdit] = useState<
//     Skill | undefined
//   >();
//   // const [selectedSkillForMatch, setSelectedSkillForMatch] = useState<
//   //   Skill | undefined
//   // >(); // ✅ HINZUGEFÜGT
//   const [localSearchQuery, setLocalSearchQuery] = useState('');
//   const [showFilters, setShowFilters] = useState(false);
//   const [filters, setFilters] = useState<FilterState>({
//     categoryId: '',
//     proficiencyLevelId: '',
//     isOffering: undefined,
//     tags: [],
//   });

//   // Notification state
//   const [notification, setNotification] = useState<{
//     open: boolean;
//     message: string[];
//     severity: 'success' | 'error' | 'info' | 'warning';
//   }>({
//     open: false,
//     message: [],
//     severity: 'success',
//   });

//   // Confirmation dialog state
//   const [confirmDialog, setConfirmDialog] = useState<{
//     open: boolean;
//     title: string;
//     message: string;
//     onConfirm: () => void;
//   }>({
//     open: false,
//     title: '',
//     message: '',
//     onConfirm: () => {},
//   });

//   const pageSizeOptions = [12, 24, 48, 96];

//   // Determine view properties based on tab
//   const isOwnerView = showOnly === 'mine';

//   // const { sendMatchRequest } = useMatchmaking();

//   // const { user } = useUserById(?.userId);

//   // Load initial data
//   useEffect(() => {
//     const loadInitialData = async () => {
//       try {
//         console.log('🚀 Loading initial data...');

//         const [categoriesSuccess, proficiencySuccess] = await Promise.all([
//           fetchCategories(),
//           fetchProficiencyLevels(),
//         ]);

//         if (!categoriesSuccess || !proficiencySuccess) {
//           setNotification({
//             open: true,
//             message: [
//               'Fehler beim Laden der Kategorien oder Fertigkeitsstufen',
//             ],
//             severity: 'warning',
//           });
//         }

//         console.log('✅ Initial metadata loaded');
//       } catch (error) {
//         console.error('❌ Error loading initial data:', error);
//         setNotification({
//           open: true,
//           message: ['Fehler beim Laden der Daten'],
//           severity: 'error',
//         });
//       }
//     };

//     loadInitialData();
//   }, [fetchCategories, fetchProficiencyLevels]);

//   // Load page-specific data
//   useEffect(() => {
//     if (categories.length === 0 || proficiencyLevels.length === 0) {
//       console.log('⏳ Waiting for categories and proficiency levels...');
//       return;
//     }

//     const loadPageData = async () => {
//       try {
//         let success = false;
//         if (showOnly === 'all') {
//           // Alle Skills
//           if (isSearchActive && searchQuery) {
//             success = await searchSkillsByQuery(
//               searchQuery,
//               pagination.pageNumber,
//               pagination.pageSize
//             );
//           } else {
//             success = await fetchAllSkills({
//               page: pagination.pageNumber,
//               pageSize: pagination.pageSize,
//             });
//           }
//         } else if (showOnly === 'mine') {
//           // Meine Skills
//           if (isSearchActive && searchQuery) {
//             success = await searchUserSkills(
//               searchQuery,
//               pagination.pageNumber,
//               pagination.pageSize
//             );
//           } else {
//             success = await fetchUserSkills(
//               pagination.pageNumber,
//               pagination.pageSize
//             );
//           }
//         } else if (showOnly === 'favorite' && user) {
//           success = await fetchFavoriteSkills(user.id);
//         }
//         if (!success) {
//           console.warn('⚠️ Loading page data returned false');
//         }
//       } catch (error) {
//         console.error('❌ Error loading page data:', error);
//       }
//     };
//     loadPageData();
//   }, [
//     showOnly,
//     isSearchActive,
//     searchQuery,
//     pagination.pageNumber,
//     pagination.pageSize,
//     categories.length,
//     proficiencyLevels.length,
//     searchSkillsByQuery,
//     fetchAllSkills,
//     searchUserSkills,
//     fetchUserSkills,
//     fetchFavoriteSkills
//   ]);

//   // Handle errors
//   useEffect(() => {
//     if (errors && errors.length > 0) {
//       setNotification({
//         open: true,
//         message: errors,
//         severity: 'error',
//       });
//     }
//   }, [errors]);

//   // Search handlers
//   const handleSearch = async () => {
//     if (!localSearchQuery.trim()) {
//       setNotification({
//         open: true,
//         message: ['Bitte gib einen Suchbegriff ein'],
//         severity: 'warning',
//       });
//       return;
//     }

//     try {
//       console.log('🔍 Starting search:', localSearchQuery);
//       setQuery(localSearchQuery);
//       updatePagination({ pageNumber: 1 });

//       const success =
//         showOnly === "all"
//           ? await searchSkillsByQuery(localSearchQuery, 1, pagination.pageSize)
//           : showOnly === "mine" 
//           ? await searchUserSkills(localSearchQuery, 1, pagination.pageSize)
//           : await fetchFavoriteSkills(user.id); 

//       if (!success) {
//         setNotification({
//           open: true,
//           message: ['Suche fehlgeschlagen. Bitte versuche es erneut.'],
//           severity: 'error',
//         });
//       }
//     } catch (error) {
//       console.error('❌ Search error:', error);
//       setNotification({
//         open: true,
//         message: ['Fehler bei der Suche'],
//         severity: 'error',
//       });
//     }
//   };

//   const handleClearSearch = async () => {
//     try {
//       console.log('🧹 Clearing search');
//       setLocalSearchQuery('');
//       clearSearch();
//       updatePagination({ pageNumber: 1 });

//       const success =
//         tab === 0
//           ? await fetchAllSkills({ page: 1, pageSize: pagination.pageSize })
//           : await fetchUserSkills(1, pagination.pageSize);

//       if (!success) {
//         setNotification({
//           open: true,
//           message: ['Laden der Skills fehlgeschlagen.'],
//           severity: 'error',
//         });
//       }
//     } catch (error) {
//       console.error('❌ Clear search error:', error);
//     }
//   };

//   // Pagination handlers
//   const handlePageChange = (page: number) => {
//     console.log('📄 Page changed to:', page);
//     updatePagination({ pageNumber: page });
//   };

//   const handlePageSizeChange = (pageSize: number) => {
//     console.log('📊 Page size changed to:', pageSize);
//     updatePagination({ pageNumber: 1, pageSize });
//   };

//   // Form handlers
//   const handleOpenCreateForm = () => {
//     if (tab === 0) {
//       setNotification({
//         open: true,
//         message: [
//           'Du kannst nur in der "Meine Skills" Sektion neue Skills erstellen',
//         ],
//         severity: 'info',
//       });
//       return;
//     }

//     console.log('➕ Opening create form');
//     setSelectedSkillForEdit(undefined);
//     clearSkill();
//     setIsFormOpen(true);
//     dismissError();
//   };

//   const handleEditSkill = (skill: Skill) => {
//     if (tab === 0) {
//       // Für fremde Skills -> zur Detail-Page navigieren
//       console.log('👁️ Viewing foreign skill details:', skill.name);
//       navigate(`/skills/${skill.skillId}`);
//       return;
//     }

//     // Für eigene Skills -> zur Edit-Page navigieren
//     console.log('✏️ Navigating to edit page for own skill:', skill.name);
//     navigate(`/skills/${skill.skillId}/edit`);
//   };

//   const handleCloseForm = () => {
//     console.log('❌ Closing form');
//     setIsFormOpen(false);
//     setSelectedSkillForEdit(undefined);
//     clearSkill();
//     dismissError();
//   };

//   const handleViewSkillDetails = (skill: Skill) => {
//     console.log('👁️ Viewing skill details:', skill.name);
//     selectSkill(skill);
//     navigate(`/skills/${skill.skillId}`);
//   };

//   // ✅ HINZUGEFÜGT: Match functionality für andere Users Skills
//   const handleMatchSkill = (skill: Skill) => {
//     if (tab === 1) {
//       setNotification({
//         open: true,
//         message: ['Du kannst kein Match mit deinen eigenen Skills erstellen'],
//         severity: 'info',
//       });
//       return;
//     }

//     console.log('🤝 Opening match form for skill:', skill.name);
//     // setSelectedSkillForMatch(skill);
//     // setIsMatchFormOpen(true);
//   };

//   // ✅ HINZUGEFÜGT: Close match form
//   // const handleCloseMatchForm = () => {
//   //   console.log('❌ Closing match form');
//   //   // setIsMatchFormOpen(false);
//   //   setSelectedSkillForMatch(undefined);
//   // };

//   // // ✅ HINZUGEFÜGT: Submit match request
//   // const handleSubmitMatch = async (matchData: MatchRequest) => {
//   //   if (!selectedSkillForMatch) {
//   //     setNotification({
//   //       open: true,
//   //       message: ['Fehler: Kein Skill ausgewählt'],
//   //       severity: 'error',
//   //     });
//   //     return;
//   //   }

//   //   try {
//   //     console.log('🤝 Submitting match request:', matchData);
//   //     console.log('📋 Selected skill for match:', selectedSkillForMatch);

//   //     // ✅ Konvertiere MatchRequest zu CreateMatchRequestCommand
//   //     const command: CreateMatchRequest = {
//   //       targetUserId: selectedSkillForMatch.userId, // ✅ User-ID vom Skill-Besitzer!
//   //       skillId: selectedSkillForMatch.skillId,
//   //       message: matchData.message || 'Ich bin interessiert an diesem Skill!',
//   //       isLearningMode: selectedSkillForMatch.isOffering, // ✅ Wenn Skill angeboten wird, will ich lernen
//   //     };

//   //     console.log('📤 Sending CreateMatchRequestCommand:', command);

//   //     const success = await sendMatchRequest(command);

//   //     if (success) {
//   //       setNotification({
//   //         open: true,
//   //         message: ['Match-Anfrage erfolgreich erstellt'],
//   //         severity: 'success',
//   //       });

//   //       handleCloseMatchForm();
//   //     } else {
//   //       setNotification({
//   //         open: true,
//   //         message: ['Fehler beim Erstellen der Match-Anfrage'],
//   //         severity: 'error',
//   //       });
//   //     }
//   //   } catch (error) {
//   //     console.error('❌ Match submission error:', error);
//   //     setNotification({
//   //       open: true,
//   //       message: ['Fehler beim Erstellen der Match-Anfrage'],
//   //       severity: 'error',
//   //     });
//   //   }
//   // };

//   // Delete handler (nur für eigene Skills)
//   const handleDeleteSkill = (skillId: string) => {
//     if (tab === 0) {
//       setNotification({
//         open: true,
//         message: ['Du kannst nur deine eigenen Skills löschen'],
//         severity: 'warning',
//       });
//       return;
//     }

//     const skill = userSkills.find((s) => s.skillId === skillId);
//     const skillName = skill?.name || 'diesen Skill';

//     console.log('🗑️ Initiating delete for skill:', skillName);

//     setConfirmDialog({
//       open: true,
//       title: 'Skill löschen',
//       message: `Bist du sicher, dass du "${skillName}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`,
//       onConfirm: () => confirmDeleteSkill(skillId),
//     });
//   };

//   const confirmDeleteSkill = async (skillId: string) => {
//     setConfirmDialog({ ...confirmDialog, open: false });

//     try {
//       console.log('🗑️ Confirming delete for skill:', skillId);
//       const success = await deleteSkill(skillId);

//       if (success) {
//         setNotification({
//           open: true,
//           message: ['Skill erfolgreich gelöscht'],
//           severity: 'success',
//         });
//       } else {
//         setNotification({
//           open: true,
//           message: ['Fehler beim Löschen des Skills'],
//           severity: 'error',
//         });
//       }
//     } catch (error) {
//       console.error('❌ Delete error:', error);
//       setNotification({
//         open: true,
//         message: ['Fehler beim Löschen des Skills'],
//         severity: 'error',
//       });
//     }
//   };

//   // Form submission handler
//   const handleSubmitSkill = async (
//     skillData: SkillFormData | UpdateSkillFormData,
//     skillId?: string
//   ) => {
//     try {
//       let success = false;

//       if (skillId) {
//         // Update existing skill
//         console.log('📝 Updating skill:', skillId);
//         success = await updateSkill(skillId, skillData as UpdateSkillFormData);

//         if (success) {
//           setNotification({
//             open: true,
//             message: ['Skill erfolgreich aktualisiert'],
//             severity: 'success',
//           });
//           setIsFormOpen(false);
//         }
//       } else {
//         // Create new skill
//         console.log('✨ Creating new skill');
//         success = await createSkill(skillData as SkillFormData);

//         if (success) {
//           setNotification({
//             open: true,
//             message: ['Skill erfolgreich erstellt'],
//             severity: 'success',
//           });
//           setIsFormOpen(false);

//           // Reload user skills
//           setTimeout(async () => {
//             await fetchUserSkills(1, pagination.pageSize);
//           }, 500);
//         }
//       }

//       if (!success) {
//         setNotification({
//           open: true,
//           message: [
//             skillId
//               ? 'Fehler beim Aktualisieren des Skills'
//               : 'Fehler beim Erstellen des Skills',
//           ],
//           severity: 'error',
//         });
//       }
//     } catch (error) {
//       console.error('❌ Submit skill error:', error);
//       setNotification({
//         open: true,
//         message: ['Ein unerwarteter Fehler ist aufgetreten'],
//         severity: 'error',
//       });
//     }
//   };

//   // Notification handler
//   const handleCloseNotification = () => {
//     setNotification((prev) => ({ ...prev, open: false }));
//     dismissError();
//   };

//   // Filter handlers
//   const handleFilterChange = (
//     filterType: keyof FilterState,
//     value: unknown
//   ) => {
//     setFilters((prev) => ({
//       ...prev,
//       [filterType]: value,
//     }));
//   };

//   const handleCategoryFilterChange = (event: SelectChangeEvent) => {
//     handleFilterChange('categoryId', event.target.value);
//   };

//   const handleProficiencyFilterChange = (event: SelectChangeEvent) => {
//     handleFilterChange('proficiencyLevelId', event.target.value);
//   };

//   const handleClearFilters = () => {
//     setFilters({
//       categoryId: '',
//       proficiencyLevelId: '',
//       isOffering: undefined,
//       tags: [],
//     });
//   };

//   const handleRefresh = async () => {
//     try {
//       console.log('🔄 Refreshing data');
//       dismissError();
//       clearSearch();
//       setLocalSearchQuery('');
//       updatePagination({ pageNumber: 1 });

//       const success =
//         tab === 0
//           ? await fetchAllSkills({ page: 1, pageSize: pagination.pageSize })
//           : await fetchUserSkills(1, pagination.pageSize);

//       if (success) {
//         setNotification({
//           open: true,
//           message: ['Skills erfolgreich aktualisiert'],
//           severity: 'success',
//         });
//       }
//     } catch (error) {
//       console.error('❌ Refresh error:', error);
//       setNotification({
//         open: true,
//         message: ['Fehler beim Aktualisieren'],
//         severity: 'error',
//       });
//     }
//   };

//   // Get current skills array based on page type
//   // let filteredSkills: Skill[] = [];
//   // if (tab === 2) {
//   //   // Favoriten-Tab: Nur Skills, die in den Favoriten sind
//   //   const all = getCurrentSkills('others').concat(getCurrentSkills('mine'));
//   //   filteredSkills = all.filter((s, i, arr) =>
//   //     isFavorite(s.skillId) && arr.findIndex(x => x.skillId === s.skillId) === i
//   //   );
//   // } else {
//   //   filteredSkills = getCurrentSkills(isOwnerView ? 'mine' : 'others');
//   //   if (isOwnerView && mySkillType !== 'all') {
//   //     filteredSkills = filteredSkills.filter((s) =>
//   //       mySkillType === 'offer' ? s.isOffering : !s.isOffering
//   //     );
//   //   }
//   // // }
//   // const currentSkills = filteredSkills;
//   // const currentSkillsCount = currentSkills.length;

//   // Loading states
//   const isPageLoading = isLoading && currentSkillsCount === 0;
//   const hasError = !!errors;
//   const hasData = currentSkillsCount > 0;

//   // Page titles
//   const pageTitle =
//     showOnly === "all"
//       ? 'Alle Skills'
//       : showOnly === "mine"
//       ? 'Meine Skills'
//       : 'Favoriten';
//   const pageDescription =
//     showOnly === "all"
//       ? 'Entdecke Skills von anderen Nutzern und finde Lernpartner'
//       : showOnly === "mine"
//       ? 'Verwalte und bearbeite deine Skills'
//       : 'Deine favorisierten Skills';

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* Tab-Navigation */}
      {/* <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Alle Skills" />
          <Tab label="Meine Skills" />
          <Tab label="Favoriten" />
        </Tabs>
      </Box> */}

      {/* Toggle für Angebote/Gesuche in "Meine Skills" */}
      {/* {tab === 1 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1">Typ:</Typography>
          <ToggleButtonGroup
            value={mySkillType}
            exclusive
            onChange={(_, v) => setMySkillType(v || 'all')}
            size="small"
            color="primary"
          >
            <ToggleButton value="all">Alle</ToggleButton>
            <ToggleButton value="offer">Angebote</ToggleButton>
            <ToggleButton value="search">Gesuche</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )} */}
      {/* Page header */}
      {/* <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {pageTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {pageDescription}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {isOwnerView && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateForm}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              disabled={isLoading}
            >
              Neuen Skill erstellen
            </Button>
          )}
        </Box>
      </Box>

      {/* Error display */}
      {/* {hasError && (
        <Box sx={{ mb: 3 }}>
          <AlertMessage
            message={errors!}
            severity="error"
            onClose={dismissError}
          />
        </Box>
      )} */}

      {/* Search and filter panel */}
      {/* <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          {/* Search bar */}
          {/* <TextField
            fullWidth
            placeholder={`${pageTitle} durchsuchen...`}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {localSearchQuery && (
                    <IconButton
                      onClick={handleClearSearch}
                      edge="end"
                      disabled={isLoading}
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          /> */}

          {/* Search controls */}
          {/* <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          > */}
            {/* <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={isLoading || !localSearchQuery.trim()}
              >
                Suchen
              </Button>

              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                disabled={isLoading}
              >
                Filter {showFilters ? 'ausblenden' : 'anzeigen'}
              </Button>
            </Box> */}

            {/* <Typography variant="body2" color="text.secondary">
              {isSearchActive && searchQuery
                ? `Suchergebnisse für "${searchQuery}"`
                : `${currentSkillsCount} Skills gefunden`}
            </Typography>
          </Box> */}

          {/* Filters */}
          {/* {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 2 }}
              >
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Kategorie</InputLabel>
                  <Select
                    value={filters.categoryId}
                    onChange={handleCategoryFilterChange}
                    label="Kategorie"
                    disabled={isLoading}
                  >
                    <MenuItem value="">Alle Kategorien</MenuItem>
                    {categories.map((category) => (
                      <MenuItem
                        key={category.categoryId}
                        value={category.categoryId}
                      >
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Fertigkeitsstufe</InputLabel>
                  <Select
                    value={filters.proficiencyLevelId}
                    onChange={handleProficiencyFilterChange}
                    label="Fertigkeitsstufe"
                    disabled={isLoading}
                  >
                    <MenuItem value="">Alle Stufen</MenuItem>
                    {proficiencyLevels.map((level) => (
                      <MenuItem key={level.levelId} value={level.levelId}>
                        {level.level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                  size="small"
                >
                  Filter zurücksetzen
                </Button>
              </Stack>

              {/* Active filters display */}
              {/* {(filters.categoryId || filters.proficiencyLevelId) && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {filters.categoryId && (
                    <Chip
                      label={`Kategorie: ${categories.find((c) => c.categoryId === filters.categoryId)?.name}`}
                      onDelete={() => handleFilterChange('categoryId', '')}
                      size="small"
                    />
                  )}
                  {filters.proficiencyLevelId && (
                    <Chip
                      label={`Level: ${proficiencyLevels.find((l) => l.levelId === filters.proficiencyLevelId)?.level}`}
                      onDelete={() =>
                        handleFilterChange('proficiencyLevelId', '')
                      }
                      size="small"
                    />
                  )}
                </Stack> */}
              {/* )}
            </Box>
          )} */}
        {/* </Box> */}
      {/* </Paper> */}

      {/* Content area */}
      {/* // {isPageLoading ? ( */}
      {/* //   <LoadingSpinner */}
      {/* //     message="Skills werden geladen..."
      //     size={60}
      //     sx={{ py: 8 }}
      //   />
      // ) : (
      //   <SkillList */}
      {/* //     skills={currentSkills}
      //     loading={isLoading}
      //     errors={errors || undefined}
      //     isOwnerView={isOwnerView}
      //     showMatchButtons={!isOwnerView}
      //     onEditSkill={handleEditSkill}
      //     onDeleteSkill={handleDeleteSkill}
      //     onViewSkillDetails={handleViewSkillDetails}
      //     onMatchSkill={handleMatchSkill}
      //     // FAVORITES
      //     favoriteSkillIds={favoriteSkillIds}
      //     isFavorite={isFavorite}
      //     onToggleFavorite={handleToggleFavorite}
      //   />
      // )} */}

      {/* Pagination */}
      {/* // {hasData && !isPageLoading && ( */}
      {/* //   <Box sx={{ mt: 3 }}>
      //     <PaginationControls */}
      {/* //       totalItems={pagination.totalRecords || currentSkillsCount}
      //       currentPage={pagination.pageNumber}
      //       pageSize={pagination.pageSize}
      //       pageSizeOptions={pageSizeOptions}
      //       onPageChange={handlePageChange}
      //       onPageSizeChange={handlePageSizeChange}
      //     />
      //   </Box> */}
      {/* // )}

      // {/* Mobile floating action button - nur für eigene Skills */}
      {/* // isOwnerView && ( */}
      {/* //   <Tooltip title="Neuen Skill erstellen">
      //     <Fab */} 
      {/* //       color="primary"
      //       aria-label="Neuen Skill erstellen"
      //       sx={{ */}
      {/* //         position: 'fixed',
      //         bottom: 16,
      //         right: 16,
      //         display: { xs: 'inline-flex', sm: 'none' },
      //       }}
      //       onClick={handleOpenCreateForm}
      //       disabled={isLoading}
      //     >
      //       <AddIcon />
      //     </Fab> */}
      {/* //   </Tooltip> */}
      {/* // )} */}

      {/* Skill form modal - nur für eigene Skills */}
  


       {/* {isOwnerView && ( 
        <SkillForm
          open={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmitSkill}
          categories={categories}
          proficiencyLevels={proficiencyLevels}
          loading={isCreating || isUpdating}
          skill={selectedSkillForEdit}
          title={
            selectedSkillForEdit ? 'Skill bearbeiten' : 'Neuen Skill erstellen'
          }
        />
      )} */}

      {/* ✅ HINZUGEFÜGT: Match form modal - nur für fremde Skills */}
      {/* {selectedSkillForMatch && showOnly === 'others' && (
        <MatchForm
          open={isMatchFormOpen}
          onClose={handleCloseMatchForm}
          onSubmit={handleSubmitMatch} // ✅ Wird verwendet
          skill={selectedSkillForMatch}
          isLoading={isMatchmakingLoading}
        />
      )} */}

       {/* Confirmation dialog  */}
       {/* <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        confirmColor="error"
      /> */}

       {/* Notification snackbar  */}
       {/* <Snackbar
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
          action={
            notification.severity === 'error' ? (
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Erneut versuchen
              </Button>
            ) : undefined
          }
        >
          {notification.message.join(', ')}
        </Alert>
       </Snackbar>  */}


      <h1>{showOnly}</h1>

    </Container>
  );
}

export default SkillsPage;
