import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Typography, Button, Container, Paper, Alert, Fab, Tooltip } from '@mui/material';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import errorService from '../../../core/services/errorService';
import SkillErrorBoundary from '../../../shared/components/error/SkillErrorBoundary';
import SkeletonLoader from '../../../shared/components/ui/SkeletonLoader';
import { Permissions } from '../../auth/components/permissions.constants';
import { useAuth } from '../../auth/hooks/useAuth';
import SkillForm from '../components/SkillForm';
import SkillList from '../components/SkillList';
import useSkills from '../hooks/useSkills';
import type { CreateSkillRequest } from '../types/CreateSkillRequest';
import type { Skill } from '../types/Skill';
import type { UpdateSkillRequest } from '../types/UpdateSkillRequest';

interface SkillsPageProps {
  showOnly?: 'all' | 'mine' | 'favorite';
}

type ViewType = 'all' | 'mine' | 'favorite';

const PAGE_CONFIG: Record<ViewType, { title: string; description: string }> = {
  all: { title: 'Alle Skills', description: 'Entdecke Skills von anderen Nutzern' },
  mine: { title: 'Meine Skills', description: 'Verwalte deine Skills' },
  favorite: { title: 'Favoriten', description: 'Deine favorisierten Skills' },
};

const SkillsPage: React.FC<SkillsPageProps> = ({ showOnly = 'all' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Memoize permission checks for user skills
  const canCreateOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.CREATE_OWN),
    [hasPermission]
  );
  const canUpdateOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.UPDATE_OWN),
    [hasPermission]
  );
  const canDeleteOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.DELETE_OWN),
    [hasPermission]
  );

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
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>();

  // Determine view properties
  const isOwnerView = showOnly === 'mine';
  const { title: pageTitle, description: pageDescription } = PAGE_CONFIG[showOnly];

  // Track fetch parameters to prevent unnecessary re-fetches
  const lastFetchParams = useRef<{ showOnly: string; userId?: string }>({
    showOnly: '',
    userId: undefined,
  });

  // ===== MEMOIZED DATA LOADING FUNCTIONS =====
  // Note: These functions return void (fire-and-forget dispatch)
  const loadMetadata = useCallback((): void => {
    fetchCategories();
    fetchProficiencyLevels();
  }, [fetchCategories, fetchProficiencyLevels]);

  const loadSkillsData = useCallback((): void => {
    if (showOnly === 'mine') {
      fetchUserSkills();
    } else if (showOnly === 'favorite' && user?.id) {
      fetchFavoriteSkills();
      fetchAllSkills(); // Needed for favorite filtering
    } else {
      fetchAllSkills();
    }
  }, [showOnly, user?.id, fetchUserSkills, fetchAllSkills, fetchFavoriteSkills]);

  // ===== STABLE DATA LOADING useEffect =====
  useEffect(() => {
    // Prevent unnecessary re-fetches using ref comparison
    const currentParams = { showOnly, userId: user?.id };
    if (
      lastFetchParams.current.showOnly === currentParams.showOnly &&
      lastFetchParams.current.userId === currentParams.userId
    ) {
      return;
    }

    lastFetchParams.current = currentParams;

    // Note: Loading state is managed by Redux (isLoadingAll, isLoadingUser, etc.)
    errorService.addBreadcrumb(`Loading skills page: ${showOnly}`, 'navigation', {
      showOnly,
      userId: user?.id,
    });

    // Load metadata (fire-and-forget - Redux tracks loading)
    errorService.addBreadcrumb('Fetching categories and proficiency levels', 'data');
    loadMetadata();

    // Load skills data based on view type
    errorService.addBreadcrumb('Fetching skills data', 'data', { showOnly });
    loadSkillsData();

    errorService.addBreadcrumb(`Successfully loaded ${showOnly} skills`, 'data');

    // loadMetadata and loadSkillsData are stable due to useCallback
  }, [showOnly, user?.id, loadMetadata, loadSkillsData]);

  // ===== MEMOIZED EVENT HANDLERS =====
  const handleCreateSkill = useCallback(() => {
    if (!isOwnerView) return;

    errorService.addBreadcrumb('Opening skill creation form', 'ui');
    setSelectedSkill(undefined);
    setIsFormOpen(true);
  }, [isOwnerView]);

  const handleEditSkill = useCallback(
    (skill: Skill): void => {
      if (isOwnerView) {
        errorService.addBreadcrumb('Opening skill edit form', 'ui', { skillId: skill.id });
        setSelectedSkill(skill);
        setIsFormOpen(true);
      } else {
        errorService.addBreadcrumb('Navigating to skill detail', 'navigation', {
          skillId: skill.id,
        });
        void navigate(`/skills/${skill.id}`);
      }
    },
    [isOwnerView, navigate]
  );

  // Note: Hook functions return void (fire-and-forget dispatch), so we close the form immediately
  // Success/error feedback is handled via Redux state changes
  const handleCreate = useCallback(
    (skillData: CreateSkillRequest): void => {
      createSkill(skillData);
      setIsFormOpen(false);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill creation dispatched', 'action');
    },
    [createSkill]
  );

  const handleUpdate = useCallback(
    (skillId: string, updateData: UpdateSkillRequest): void => {
      updateSkill(skillId, updateData);
      setIsFormOpen(false);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill update dispatched', 'action');
    },
    [updateSkill]
  );

  const handleDelete = useCallback(
    (skillId: string, reason?: string): void => {
      deleteSkill(skillId, reason);
      setSelectedSkill(undefined);
      errorService.addBreadcrumb('Skill deletion dispatched', 'action');
    },
    [deleteSkill]
  );

  const handleToggleFavorite = useCallback(
    (skillId: string, currentlyFavorite: boolean): void => {
      if (currentlyFavorite) {
        removeFavoriteSkill(skillId);
      } else {
        addFavoriteSkill(skillId);
      }
    },
    [addFavoriteSkill, removeFavoriteSkill]
  );

  // ⚡ PERFORMANCE: Stable callback for SkillList - avoids re-creating function on every render
  const handleToggleFavoriteForList = useCallback(
    (skill: Skill): void => {
      handleToggleFavorite(skill.id, skill.isFavorite ?? false);
    },
    [handleToggleFavorite]
  );

  // ⚡ PERFORMANCE: Stable callback for delete - avoids inline arrow function
  const handleDeleteForList = useCallback(
    (skillId: string): void => {
      handleDelete(skillId);
    },
    [handleDelete]
  );

  const handleRefresh = useCallback((): void => {
    // Force refresh by resetting fetch params
    lastFetchParams.current = { showOnly: '', userId: undefined };

    // Trigger data refresh (fire-and-forget - Redux tracks loading)
    loadMetadata();
    loadSkillsData();
    errorService.addBreadcrumb('Data refresh dispatched', 'action');
  }, [loadMetadata, loadSkillsData]);

  // ===== MEMOIZED DATA SELECTORS =====
  const displayedSkills = useMemo(() => {
    switch (showOnly) {
      case 'mine':
        return userSkills;
      case 'favorite':
        return favoriteSkills;
      case 'all':
        return allSkills;
      default: {
        const _exhaustiveCheck: never = showOnly;
        return _exhaustiveCheck;
      }
    }
  }, [showOnly, userSkills, favoriteSkills, allSkills]);

  const isLoading = useMemo(() => {
    switch (showOnly) {
      case 'mine':
        return isLoadingUser || isLoadingCategories || isLoadingProficiencyLevels;
      case 'favorite':
        return (
          isLoadingFavorites || isLoadingAll || isLoadingCategories || isLoadingProficiencyLevels
        );
      case 'all':
        return isLoadingAll || isLoadingCategories || isLoadingProficiencyLevels;
      default: {
        const _exhaustiveCheck: never = showOnly;
        return _exhaustiveCheck;
      }
    }
  }, [
    showOnly,
    isLoadingAll,
    isLoadingUser,
    isLoadingFavorites,
    isLoadingCategories,
    isLoadingProficiencyLevels,
  ]);

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

              {isOwnerView && canCreateOwnSkill ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateSkill}
                  size="medium"
                >
                  Neue Skill
                </Button>
              ) : null}
            </Box>
          </Box>

          {error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : null}

          {isLoading ? (
            <SkeletonLoader count={6} height={120} />
          ) : (
            <SkillList
              skills={displayedSkills}
              loading={isLoading}
              onEditSkill={canUpdateOwnSkill ? handleEditSkill : undefined}
              onDeleteSkill={canDeleteOwnSkill ? handleDeleteForList : undefined}
              onToggleFavorite={handleToggleFavoriteForList}
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
              handleUpdate(skillId, skillData as UpdateSkillRequest);
            } else {
              handleCreate(skillData);
            }
          }}
        />

        {/* Floating Action Button for mobile */}
        {isOwnerView && canCreateOwnSkill ? (
          <Tooltip title="Neue Skill erstellen">
            <Fab
              color="primary"
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                display: { xs: 'flex', sm: 'none' },
              }}
              onClick={handleCreateSkill}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        ) : null}
      </Container>
    </SkillErrorBoundary>
  );
};

export default SkillsPage;
