import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Alert,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSkills } from '../../hooks/useSkills';
import { useLoading, LoadingKeys } from '../../contexts/LoadingContext';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { LoadingButton } from '../../components/common/LoadingButton';
import { Skill } from '../../types/models/Skill';
import SkillForm from '../../components/skills/SkillForm';
import SkillList from '../../components/skills/SkillList';
import SkillErrorBoundary from '../../components/error/SkillErrorBoundary';
import errorService from '../../services/errorService';
import { CreateSkillRequest } from '../../types/contracts/requests/CreateSkillRequest';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';

interface SkillsPageProps {
  showOnly: 'all' | 'mine' | 'favorite';
}

/**
 * 🚀 NEUE ROBUSTE SKILLSPAGE 
 * 
 * ✅ Nutzt neue useSkills Hook ohne useEffect
 * ✅ Stabile dependencies - no infinite loops possible
 * ✅ Memoized functions - optimal performance
 * ✅ Granular loading states - better UX
 * ✅ Error boundaries - robust error handling
 */
const SkillsPage: React.FC<SkillsPageProps> = ({ showOnly }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { withLoading } = useLoading();
  
  // 🚀 NEW: Use the robust useSkills hook
  const {
    allSkills,
    userSkills,
    favoriteSkills,
    categories,
    proficiencyLevels,
    isLoadingAll,
    isLoadingUser,
    isLoadingCategories,
    isLoadingProficiencyLevels,
    isLoadingFavorites,
    error,
    // Actions (all memoized)
    fetchAllSkills,
    fetchUserSkills,
    fetchCategories,
    fetchProficiencyLevels,
    fetchFavoriteSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    addFavoriteSkill,
    removeFavoriteSkill,
    isFavoriteSkill,
  } = useSkills();
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>(undefined);

  // Determine view properties
  const isOwnerView = showOnly === 'mine';
  const pageTitle = showOnly === 'all' ? 'Alle Skills' : showOnly === 'mine' ? 'Meine Skills' : 'Favoriten';
  const pageDescription = showOnly === 'all' ? 'Entdecke Skills von anderen Nutzern' : showOnly === 'mine' ? 'Verwalte deine Skills' : 'Deine favorisierten Skills';

  // Track fetch parameters to prevent unnecessary re-fetches
  const lastFetchParams = useRef<{ showOnly: string; userId?: string }>({ showOnly: '', userId: undefined });
  
  // ===== MEMOIZED DATA LOADING FUNCTIONS =====
  const loadMetadata = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchProficiencyLevels()
    ]);
  }, [fetchCategories, fetchProficiencyLevels]);

  const loadSkillsData = useCallback(async () => {
    if (showOnly === 'mine') {
      await fetchUserSkills();
    } else if (showOnly === 'favorite' && user?.id) {
      await Promise.all([
        fetchFavoriteSkills(),
        fetchAllSkills() // Needed for favorite filtering
      ]);
    } else {
      await fetchAllSkills();
    }
  }, [showOnly, user?.id, fetchUserSkills, fetchAllSkills, fetchFavoriteSkills]);

  // ===== STABLE DATA LOADING useEffect =====  
  // 🔥 This is THE NEW PATTERN: absolutely stable dependencies
  useEffect(() => {
    const loadData = async () => {
      // Prevent unnecessary re-fetches using ref comparison
      const currentParams = { showOnly, userId: user?.id };
      if (
        lastFetchParams.current.showOnly === currentParams.showOnly && 
        lastFetchParams.current.userId === currentParams.userId
      ) {
        return;
      }
      
      lastFetchParams.current = currentParams;
      
      await withLoading(LoadingKeys.FETCH_SKILLS, async () => {
        try {
          errorService.addBreadcrumb(`Loading skills page: ${showOnly}`, 'navigation', { 
            showOnly, 
            userId: user?.id 
          });
          
          // Load metadata first
          errorService.addBreadcrumb('Fetching categories and proficiency levels', 'data');
          await loadMetadata();

          // Load skills data based on view type
          errorService.addBreadcrumb('Fetching skills data', 'data', { showOnly });
          await loadSkillsData();
          
          errorService.addBreadcrumb(`Successfully loaded ${showOnly} skills`, 'data');
        } catch (error) {
          errorService.handleError(error, 'Error loading skills data', 'SkillsPage');
          console.error('Error loading skills data:', error);
        }
      });
    };
    
    loadData();
    
    // 🔥 CRITICAL: Only showOnly and user?.id as dependencies
    // loadMetadata and loadSkillsData are stable due to useCallback
  }, [showOnly, user?.id, withLoading, loadMetadata, loadSkillsData]);

  // ===== MEMOIZED EVENT HANDLERS =====
  const handleCreateSkill = useCallback(() => {
    if (!isOwnerView) return;
    
    errorService.addBreadcrumb('Opening skill creation form', 'ui');
    setSelectedSkill(undefined);
    setIsFormOpen(true);
  }, [isOwnerView]);

  const handleEditSkill = useCallback((skill: Skill) => {
    if (isOwnerView) {
      errorService.addBreadcrumb('Opening skill edit form', 'ui', { skillId: skill.id });
      setSelectedSkill(skill);
      setIsFormOpen(true);
    } else {
      errorService.addBreadcrumb('Navigating to skill detail', 'navigation', { skillId: skill.id });
      navigate(`/skills/${skill.id}`);
    }
  }, [isOwnerView, navigate]);

  const handleCreate = useCallback(async (skillData: CreateSkillRequest) => {
    const result = await createSkill(skillData);
    if (result.meta.requestStatus === 'fulfilled') {
      setIsFormOpen(false);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill created successfully', 'success');
    }
  }, [createSkill]);

  const handleUpdate = useCallback(async (skillId: string, updateData: UpdateSkillRequest) => {
    const result = await updateSkill(skillId, updateData);
    if (result.meta.requestStatus === 'fulfilled') {
      setIsFormOpen(false);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill updated successfully', 'success');
    }
  }, [updateSkill]);

  const handleDelete = useCallback(async (skillId: string, reason?: string) => {
    const result = await deleteSkill(skillId, reason);
    if (result.meta.requestStatus === 'fulfilled') {
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill deleted successfully', 'success');
    }
  }, [deleteSkill]);

  const handleToggleFavorite = useCallback(async (skillId: string, currentlyFavorite: boolean) => {
    if (!currentlyFavorite) {
      await addFavoriteSkill(skillId);
    } else {
      await removeFavoriteSkill(skillId);
    }
  }, [addFavoriteSkill, removeFavoriteSkill]);

  const handleRefresh = useCallback(async () => {
    // Force refresh by resetting fetch params
    lastFetchParams.current = { showOnly: '', userId: undefined };
    
    await withLoading(LoadingKeys.FETCH_SKILLS, async () => {
      try {
        await loadMetadata();
        await loadSkillsData();
        errorService.addBreadcrumb('Data refreshed successfully', 'success');
      } catch (error) {
        errorService.handleError(error, 'Error refreshing skills data', 'SkillsPage');
      }
    });
  }, [withLoading, loadMetadata, loadSkillsData, showOnly, user?.id]);

  // ===== MEMOIZED DATA SELECTORS =====
  const displayedSkills = useMemo(() => {
    switch (showOnly) {
      case 'mine':
        return userSkills || [];
      case 'favorite':
        return favoriteSkills || [];
      default:
        return allSkills || [];
    }
  }, [showOnly, userSkills, favoriteSkills, allSkills]);

  const isLoading = useMemo(() => {
    switch (showOnly) {
      case 'mine':
        return isLoadingUser || isLoadingCategories || isLoadingProficiencyLevels;
      case 'favorite':
        return isLoadingFavorites || isLoadingAll || isLoadingCategories || isLoadingProficiencyLevels;
      default:
        return isLoadingAll || isLoadingCategories || isLoadingProficiencyLevels;
    }
  }, [showOnly, isLoadingAll, isLoadingUser, isLoadingFavorites, isLoadingCategories, isLoadingProficiencyLevels]);

  // ===== RENDER =====
  return (
    <SkillErrorBoundary>
      <Container maxWidth="lg">
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {pageTitle}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {pageDescription}
              </Typography>
            </Box>
            
            <Box display="flex" gap={1}>
              <LoadingButton
                loading={isLoading}
                onClick={handleRefresh}
                variant="outlined"
                startIcon={<RefreshIcon />}
                size="medium"
              >
                Aktualisieren
              </LoadingButton>
              
              {isOwnerView && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateSkill}
                  size="medium"
                >
                  Neue Skill
                </Button>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <SkeletonLoader count={6} height={120} />
          ) : (
            <SkillList
              skills={displayedSkills}
              loading={isLoading}
              onEditSkill={handleEditSkill}
              onDeleteSkill={(skillId: string) => handleDelete(skillId)}
              onToggleFavorite={(skill: any) => handleToggleFavorite(skill.id, skill.isFavorite)}
              isFavorite={isFavoriteSkill}
              isOwnerView={isOwnerView}
            />
          )}
        </Paper>

        {/* Skill Form Dialog */}
        <SkillForm
          open={isFormOpen}
          skill={selectedSkill}
          categories={categories}
          proficiencyLevels={proficiencyLevels}
          loading={isLoading}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedSkill(undefined);
          }}
          onSubmit={(skillData, skillId) => {
            if (skillId) {
              return handleUpdate(skillId, skillData as any);
            } else {
              return handleCreate(skillData);
            }
          }}
        />

        {/* Floating Action Button for mobile */}
        {isOwnerView && (
          <Tooltip title="Neue Skill erstellen">
            <Fab
              color="primary"
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                display: { xs: 'flex', sm: 'none' }
              }}
              onClick={handleCreateSkill}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        )}
      </Container>
    </SkillErrorBoundary>
  );
};

export default SkillsPage;