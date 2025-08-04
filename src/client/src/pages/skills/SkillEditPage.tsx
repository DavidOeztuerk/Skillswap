// src/pages/skills/SkillEditPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import SkillForm from '../../components/skills/SkillForm';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useSkills } from '../../hooks/useSkills';
import { useAuth } from '../../hooks/useAuth';
import { UpdateSkillRequest } from '../../types/contracts/requests/UpdateSkillRequest';

interface UpdateSkillFormData extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
}

const SkillEditPage: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    selectedSkill,
    categories,
    proficiencyLevels,
    fetchSkillById,
    updateSkill,
    fetchCategories,
    fetchProficiencyLevels,
    isLoading,
    isUpdating,
    error,
    dismissError,
  } = useSkills();

  // Local state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Load skill data and metadata
  useEffect(() => {
    const loadData = async () => {
      if (!skillId) {
        navigate('/skills/my-skills');
        return;
      }

      try {
        // Load skill, categories, and proficiency levels in parallel
        const [skillSuccess, categoriesSuccess, proficiencySuccess] =
          await Promise.all([
            fetchSkillById(skillId),
            fetchCategories(),
            fetchProficiencyLevels(),
          ]);

        if (!skillSuccess) {
          setNotification({
            message: 'Skill konnte nicht geladen werden',
            type: 'error',
          });
        }

        if (!categoriesSuccess || !proficiencySuccess) {
          setNotification({
            message:
              'Kategorien oder Fertigkeitsstufen konnten nicht geladen werden',
            type: 'error',
          });
        }
      } catch (error) {
        console.error('❌ Error loading edit page data:', error);
        setNotification({
          message: 'Fehler beim Laden der Daten',
          type: 'error',
        });
      }
    };

    loadData();
  }, [
    skillId,
    fetchSkillById,
    fetchCategories,
    fetchProficiencyLevels,
    navigate,
  ]);

  // Check ownership after skill is loaded
  useEffect(() => {
    if (selectedSkill && user) {
      // TODO: Replace with actual ownership check from API
      // For now, we assume ownership if the skill exists in the context
      // In a real app, you'd check: selectedSkill.userId === user.id
      const isOwner = true; // This should be: selectedSkill.userId === user.id

      if (!isOwner) {
        setNotification({
          message: 'Du kannst nur deine eigenen Skills bearbeiten',
          type: 'error',
        });
        // Redirect to detail page instead
        setTimeout(() => {
          navigate(`/skills/${skillId}`);
        }, 2000);
      }
    }
  }, [selectedSkill, user, skillId, navigate]);

  // Handle form submission
  const handleSubmit = async (skillData: UpdateSkillFormData) => {
    if (!skillId) {
      setNotification({
        message: 'Skill-ID fehlt',
        type: 'error',
      });
      return;
    }

    try {
      console.log('📝 Updating skill:', skillId, skillData);
      const success = await updateSkill(skillId, skillData);

      if (success) {
        setNotification({
          message: 'Skill erfolgreich aktualisiert',
          type: 'success',
        });

        // Navigate back to skill details after a short delay
        setTimeout(() => {
          navigate(`/skills/${skillId}`);
        }, 1500);
      } else {
        setNotification({
          message: 'Fehler beim Aktualisieren des Skills',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('❌ Update skill error:', error);
      setNotification({
        message: 'Ein unerwarteter Fehler ist aufgetreten',
        type: 'error',
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (skillId) {
      navigate(`/skills/${skillId}`);
    } else {
      navigate('/skills/my-skills');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Loading state
  if (isLoading && !selectedSkill) {
    return <PageLoader variant="form" message="Skill wird geladen..." />;
  }

  // Error state
  if (error && !selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description={"Der Skill konnte nicht geladen werden oder existiert nicht."}
          actionLabel="Zurück zu meinen Skills"
          actionHandler={() => navigate('/skills/my-skills')}
        />
      </Container>
    );
  }

  // No skill found
  if (!selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description={"Der Skill, den du bearbeiten möchtest, existiert nicht."}
          actionLabel="Zurück zu meinen Skills"
          actionHandler={() => navigate('/skills/my-skills')}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
      {/* Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Zurück
        </Button>

        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/skills/my-skills"
            onClick={(e) => {
              e.preventDefault();
              navigate('/skills/my-skills');
            }}
            sx={{ cursor: 'pointer' }}
          >
            Meine Skills
          </Link>
          <Link
            color="inherit"
            href={`/skills/${skillId}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/skills/${skillId}`);
            }}
            sx={{ cursor: 'pointer' }}
          >
            {selectedSkill.name}
          </Link>
          <Typography color="text.primary">Bearbeiten</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Skill bearbeiten
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Aktualisiere die Details deines Skills "{selectedSkill.name}"
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Abbrechen
            </Button>
          </Box>
        </Box>

        {/* Notification */}
        {notification && (
          <Alert
            severity={notification.type}
            onClose={() => setNotification(null)}
            sx={{ mb: 2 }}
          >
            {notification.message}
          </Alert>
        )}

        {/* Error display */}
        {error && (
          <Alert severity="error" onClose={dismissError} sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
      </Paper>

      {/* Edit Form */}
      <Paper sx={{ p: 3 }}>
        {categories?.length > 0 && proficiencyLevels?.length > 0 ? (
          <SkillForm
            open={true} // Always open since it's embedded in the page
            onClose={handleCancel}
            onSubmit={(skillData) =>
              handleSubmit(skillData as UpdateSkillFormData)
            }
            categories={categories}
            proficiencyLevels={proficiencyLevels}
            loading={isUpdating}
            skill={selectedSkill}
            title="" // No title needed since we have the page header
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Kategorien und Fertigkeitsstufen werden geladen...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Form Actions - Additional actions outside the form */}
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          * Alle Änderungen werden sofort gespeichert
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/skills/${skillId}`)}
            disabled={isUpdating}
          >
            Vorschau anzeigen
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SkillEditPage;
