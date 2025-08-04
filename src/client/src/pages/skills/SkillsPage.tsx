import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Fab,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSkills } from '../../hooks/useSkills';
import { Skill } from '../../types/models/Skill';
import SkillForm from '../../components/skills/SkillForm';
import SkillList from '../../components/skills/SkillList';

interface SkillsPageProps {
  showOnly: 'all' | 'mine' | 'favorite';
}

const SkillsPage: React.FC<SkillsPageProps> = ({ showOnly }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    allSkills,
    userSkills,
    isLoading,
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
      // Load categories and proficiency levels first
      await Promise.all([
        fetchCategories(),
        fetchProficiencyLevels()
      ]);

      // Load skills based on view type
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
    };

    loadData();
  }, [showOnly, user?.id, fetchAllSkills, fetchUserSkills, fetchCategories, fetchProficiencyLevels, fetchFavoriteSkills]);

  const handleCreateSkill = () => {
    if (!isOwnerView) {
      return;
    }
    setSelectedSkill(undefined);
    setIsFormOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    if (isOwnerView) {
      setSelectedSkill(skill);
      setIsFormOpen(true);
    } else {
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
        const success = await updateSkill(skillId, {
          skillId: skillId,
          name: skillData.name,
          description: skillData.description,
          isOffered: skillData.isOffered,
          categoryId: skillData.categoryId,
          proficiencyLevelId: skillData.proficiencyLevelId
        });
        
        if (success) {
          setIsFormOpen(false);
          setSelectedSkill(undefined);
        }
      } else {
        // Create new skill
        const success = await createSkill({
          name: skillData.name,
          description: skillData.description,
          isOffered: skillData.isOffered,
          categoryId: skillData.categoryId,
          proficiencyLevelId: skillData.proficiencyLevelId
        });
        
        if (success) {
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
      console.error('Error submitting skill:', err);
    }
  };

  const handleMatchSkill = (skill: Skill) => {
    if (isOwnerView) return;
    // Navigate to skill details with match request flag
    navigate(`/skills/${skill.id}?showMatchForm=true`);
  };

  const handleDeleteSkill = async (skillId: string) => {
    const success = await deleteSkill(skillId);
    if (success && showOnly === 'mine') {
      await fetchUserSkills();
    }
  };

  const handleToggleFavorite = async (skill: Skill) => {
    if (!user?.id) return;
    
    const isFav = isFavoriteSkill(skill.id);
    if (isFav) {
      await removeFavoriteSkill(skill.id);
    } else {
      await addFavoriteSkill(skill.id);
    }
  };

  const handleRefresh = async () => {
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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
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
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
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
          loading={isLoading}
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

export default SkillsPage;