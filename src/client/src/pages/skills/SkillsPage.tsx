import React, { useState, useEffect } from 'react';
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

interface SkillsPageProps {
  showOnly: 'all' | 'mine' | 'favorite';
}

const SkillsPage: React.FC<SkillsPageProps> = ({ showOnly }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { withLoading, isLoading } = useLoading();
  const {
    allSkills,
    userSkills,
    isLoading: skillsLoading,
    isCreating,
    error,
    fetchAllSkills,
    fetchUserSkills,
    fetchCategories,
    fetchProficiencyLevels,
    createSkill,
    updateSkill,
    deleteSkill,
    getFavoriteSkills,
    isFavoriteSkill,
    addFavoriteSkill,
    removeFavoriteSkill,
    fetchFavoriteSkills
  } = useSkills();

  const { categories, proficiencyLevels} = useSkills();
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>(undefined);

  // Determine view properties
  const isOwnerView = showOnly === 'mine';
  const pageTitle = showOnly === 'all' ? 'Alle Skills' : showOnly === 'mine' ? 'Meine Skills' : 'Favoriten';
  const pageDescription = showOnly === 'all' ? 'Entdecke Skills von anderen Nutzern' : showOnly === 'mine' ? 'Verwalte deine Skills' : 'Deine favorisierten Skills';

  // Load data on component mount and when dependencies change
  useEffect(() => {
    const loadData = async () => {
      await withLoading(LoadingKeys.FETCH_SKILLS, async () => {
        try {
          errorService.addBreadcrumb(`Loading skills page: ${showOnly}`, 'navigation', { showOnly, userId: user?.id });
          
          // Load categories and proficiency levels first
          errorService.addBreadcrumb('Fetching categories and proficiency levels', 'data', { action: 'fetch_metadata' });
          await Promise.all([
            fetchCategories(),
            fetchProficiencyLevels()
          ]);

          // Load skills based on view type
          if (showOnly === 'mine') {
            errorService.addBreadcrumb('Fetching user skills', 'data', { action: 'fetch_user_skills' });
            await fetchUserSkills();
          } else if (showOnly === 'favorite' && user?.id) {
            errorService.addBreadcrumb('Fetching favorite skills', 'data', { action: 'fetch_favorite_skills' });
            await Promise.all([
              fetchFavoriteSkills(),
              fetchAllSkills() // Needed for getFavoriteSkills() filtering
            ]);
          } else {
            errorService.addBreadcrumb('Fetching all skills', 'data', { action: 'fetch_all_skills' });
            await fetchAllSkills();
          }
        } catch (error) {
          errorService.addBreadcrumb('Error loading skills page data', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
          throw error;
        }
      });
    };

    loadData();
  }, [showOnly, user?.id, fetchAllSkills, fetchUserSkills, fetchCategories, fetchProficiencyLevels, fetchFavoriteSkills, withLoading]);

  const handleCreateSkill = () => {
    if (!isOwnerView) {
      return;
    }
    errorService.addBreadcrumb('Opening skill creation form', 'ui', { action: 'create_skill' });
    setSelectedSkill(undefined);
    setIsFormOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    if (isOwnerView) {
      errorService.addBreadcrumb('Opening skill edit form', 'ui', { action: 'edit_skill', skillId: skill.id });
      setSelectedSkill(skill);
      setIsFormOpen(true);
    } else {
      errorService.addBreadcrumb('Navigating to skill detail', 'navigation', { skillId: skill.id });
      navigate(`/skills/${skill.id}`);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSkill(undefined);
  };

  const handleSubmitSkill = async (skillData: { name: string; description: string; isOffered: boolean; categoryId: string; proficiencyLevelId: string }, skillId?: string) => {
    try {
      if (skillId) {
        // Update existing skill
        errorService.addBreadcrumb('Updating skill', 'form', { action: 'update_skill', skillId, skillName: skillData.name });
        const success = await updateSkill(skillId, {
          skillId: skillId,
          name: skillData.name,
          description: skillData.description,
          isOffered: skillData.isOffered,
          categoryId: skillData.categoryId,
          proficiencyLevelId: skillData.proficiencyLevelId
        });
        
        if (success) {
          errorService.addBreadcrumb('Skill updated successfully', 'form', { skillId });
          setIsFormOpen(false);
          setSelectedSkill(undefined);
        }
      } else {
        // Create new skill
        errorService.addBreadcrumb('Creating new skill', 'form', { action: 'create_skill', skillName: skillData.name });
        const success = await createSkill({
          name: skillData.name,
          description: skillData.description,
          isOffered: skillData.isOffered,
          categoryId: skillData.categoryId,
          proficiencyLevelId: skillData.proficiencyLevelId
        });
        
        if (success) {
          errorService.addBreadcrumb('Skill created successfully', 'form', { skillName: skillData.name });
          setIsFormOpen(false);
          setSelectedSkill(undefined);
          // Refresh the appropriate skills list
          if (showOnly === 'mine') {
            await fetchUserSkills();
          } else {
            await fetchAllSkills();
          }
        }
      }
    } catch (err) {
      errorService.addBreadcrumb('Error submitting skill', 'error', { error: err instanceof Error ? err.message : 'Unknown error', skillName: skillData.name });
      console.error('Error submitting skill:', err);
    }
  };

  const handleMatchSkill = (skill: Skill) => {
    if (isOwnerView) return;
    errorService.addBreadcrumb('Initiating skill match', 'navigation', { skillId: skill.id, skillName: skill.name });
    // Navigate to skill details with match request flag
    navigate(`/skills/${skill.id}?showMatchForm=true`);
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      errorService.addBreadcrumb('Deleting skill', 'action', { skillId });
      const success = await deleteSkill(skillId);
      if (success && showOnly === 'mine') {
        errorService.addBreadcrumb('Skill deleted successfully', 'action', { skillId });
        await fetchUserSkills();
      }
    } catch (error) {
      errorService.addBreadcrumb('Error deleting skill', 'error', { skillId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleToggleFavorite = async (skill: Skill) => {
    if (!user?.id) return;
    
    try {
      const isFav = isFavoriteSkill(skill.id);
      if (isFav) {
        errorService.addBreadcrumb('Removing skill from favorites', 'action', { skillId: skill.id, skillName: skill.name });
        await removeFavoriteSkill(skill.id);
      } else {
        errorService.addBreadcrumb('Adding skill to favorites', 'action', { skillId: skill.id, skillName: skill.name });
        await addFavoriteSkill(skill.id);
      }
    } catch (error) {
      errorService.addBreadcrumb('Error toggling favorite', 'error', { skillId: skill.id, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleRefresh = async () => {
    await withLoading('refreshSkills', async () => {
      try {
        errorService.addBreadcrumb('Refreshing skills list', 'action', { showOnly });
        if (showOnly === 'mine') {
          await fetchUserSkills();
        } else if (showOnly === 'favorite' && user?.id) {
          await Promise.all([
            fetchFavoriteSkills(),
            fetchAllSkills() // Needed for getFavoriteSkills() filtering
          ]);
        } else {
          await fetchAllSkills();
        }
      } catch (error) {
        errorService.addBreadcrumb('Error refreshing skills', 'error', { showOnly, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });
  };

  // Get current skills based on view type
  const getCurrentSkills = (): Skill[] | undefined => {
    if (showOnly === 'mine') {
      return userSkills;
    } else if (showOnly === 'favorite') {
      return getFavoriteSkills();
    } else {
      return allSkills?.filter(skill => skill.userId !== user?.id);
    }
  };

  const currentSkills = getCurrentSkills();

  // Helper function to safely extract error message
  const getErrorMessage = (err: typeof error): string => {
    if (!err) return '';
    return err.message || 'Ein unbekannter Fehler ist aufgetreten';
  };

  const isPageLoading = isLoading(LoadingKeys.FETCH_SKILLS) || skillsLoading;

  if (isPageLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        {/* Page Header Skeleton */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <SkeletonLoader variant="text" width={200} height={32} />
            <SkeletonLoader variant="text" width={300} height={20} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SkeletonLoader variant="text" width={48} height={48} />
            <SkeletonLoader variant="text" width={150} height={48} />
          </Box>
        </Box>
        
        {/* Skills List Skeleton */}
        <SkeletonLoader variant="card" count={6} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <Alert severity="error">
          {getErrorMessage(error)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <LoadingButton
              onClick={handleRefresh}
              loading={isLoading('refreshSkills')}
              variant="outlined"
              sx={{ minWidth: 48 }}
            >
              <RefreshIcon />
            </LoadingButton>
          </Tooltip>
          
          {isOwnerView && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateSkill}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Skill erstellen
            </Button>
          )}
        </Box>
      </Box>

      {/* Skills List */}
      {currentSkills?.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {isOwnerView ? 'Du hast noch keine Skills erstellt' : 'Keine Skills gefunden'}
          </Typography>
          {isOwnerView && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleCreateSkill}
              sx={{ mt: 2 }}
            >
              Ersten Skill erstellen
            </Button>
          )}
        </Paper>
      ) : (
        <SkillList
          skills={currentSkills}
          loading={isLoading(LoadingKeys.FETCH_DATA)}
          errors={error ? [getErrorMessage(error)] : []}
          isOwnerView={isOwnerView}
          showMatchButtons={!isOwnerView}
          onEditSkill={handleEditSkill}
          onDeleteSkill={handleDeleteSkill}
          onMatchSkill={handleMatchSkill}
          isFavorite={isFavoriteSkill}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Mobile FAB for creating skills */}
      {isOwnerView && (
        <Tooltip title="Skill erstellen">
          <Fab
            color="primary"
            aria-label="skill erstellen"
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

      {/* Skill Form Dialog */}
      <SkillForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitSkill}
        categories={categories}
        proficiencyLevels={proficiencyLevels}
        loading={isCreating}
        skill={selectedSkill}
        title={selectedSkill ? 'Skill bearbeiten' : 'Neuen Skill erstellen'}
      />
    </Container>
  );
};

const WrappedSkillsPage: React.FC<SkillsPageProps> = (props) => (
  <SkillErrorBoundary>
    <SkillsPage {...props} />
  </SkillErrorBoundary>
);

export default WrappedSkillsPage;