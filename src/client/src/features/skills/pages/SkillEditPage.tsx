import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon, Cancel as CancelIcon } from '@mui/icons-material';
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
import { useLoading } from '../../../core/contexts/loadingContextHooks';
import { LoadingKeys } from '../../../core/contexts/loadingContextValue';
import errorService from '../../../core/services/errorService';
import SkillErrorBoundary from '../../../shared/components/error/SkillErrorBoundary';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { LoadingButton } from '../../../shared/components/ui/LoadingButton';
import SkeletonLoader from '../../../shared/components/ui/SkeletonLoader';
import { useNavigation } from '../../../shared/hooks/useNavigation';
import { useAuth } from '../../auth/hooks/useAuth';
import SkillForm from '../components/SkillForm';
import useSkills from '../hooks/useSkills';
import type { UpdateSkillRequest } from '../types/UpdateSkillRequest';

// Route constants
const MY_SKILLS_ROUTE = '/skills/my-skills';

interface UpdateSkillFormData extends UpdateSkillRequest {
  tags?: string[];
  remoteAvailable?: boolean;
}

const SkillEditPage: React.FC = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading } = useLoading();
  const { contextualBreadcrumbs, navigateWithContext, navigationContext } = useNavigation();

  const {
    selectedSkill,
    userSkills,
    categories,
    proficiencyLevels,
    fetchSkillById,
    fetchUserSkills,
    updateSkill,
    fetchCategories,
    fetchProficiencyLevels,
    isLoading: skillsLoading,
    isUpdating,
    errorMessage,
    dismissError,
  } = useSkills();

  // Local state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Load skill data and metadata
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!skillId) {
        errorService.addBreadcrumb('No skill ID provided, redirecting to my skills', 'navigation');
        void navigate(MY_SKILLS_ROUTE);
        return;
      }

      errorService.addBreadcrumb('Loading skill edit page data', 'data', { skillId });

      // Load skill, categories, proficiency levels, and user skills (fire-and-forget - Redux tracks loading)
      await fetchSkillById(skillId);
      fetchCategories();
      fetchProficiencyLevels();
      fetchUserSkills(); // Load user skills for exchange selection
    };

    loadData().catch(() => {});
  }, [skillId, fetchSkillById, fetchCategories, fetchProficiencyLevels, fetchUserSkills, navigate]);

  // Check ownership after skill is loaded
  useEffect(() => {
    if (selectedSkill && user) {
      const isOwner = selectedSkill.userId === user.id;

      if (!isOwner) {
        queueMicrotask(() => {
          setNotification({
            message: 'Du kannst nur deine eigenen Skills bearbeiten',
            type: 'error',
          });
        });
        // Redirect to detail page instead
        setTimeout(() => {
          void navigate(`/skills/${skillId ?? ''}`);
        }, 2000);
      }
    }
  }, [selectedSkill, user, skillId, navigate]);

  // Handle form submission (fire-and-forget - Redux tracks loading via isUpdating)
  const handleSubmit = (skillData: UpdateSkillFormData): void => {
    if (!skillId) {
      errorService.addBreadcrumb('Skill update failed - missing ID', 'error');
      setNotification({
        message: 'Skill-ID fehlt',
        type: 'error',
      });
      return;
    }

    errorService.addBreadcrumb('Updating skill', 'form', { skillId, skillName: skillData.name });
    console.debug('📝 Updating skill:', skillId, skillData);

    // Fire-and-forget - Redux handles loading state and error via isUpdating/errorMessage
    updateSkill(skillId, skillData);

    setNotification({
      message: 'Skill wird aktualisiert...',
      type: 'info',
    });

    // Navigate back to skill details after a short delay
    setTimeout(() => {
      void navigate(`/skills/${skillId}`);
    }, 1500);
  };

  // Handle cancel
  const handleCancel = (): void => {
    errorService.addBreadcrumb('Skill edit cancelled', 'navigation', { skillId });
    if (skillId) {
      void navigate(`/skills/${skillId}`);
    } else {
      void navigate(MY_SKILLS_ROUTE);
    }
  };

  // Handle back navigation
  const handleBack = (): void => {
    errorService.addBreadcrumb('Navigating back from skill edit', 'navigation', { skillId });
    void navigate(-1);
  };

  // Handle breadcrumb navigation with context preservation
  const handleBreadcrumbClick = useCallback(
    (href: string, label: string) => {
      if (href === '/') {
        void navigateWithContext(href);
      } else if (href.startsWith('/skills/') && href !== '/skills') {
        // Navigating to a skill - use 'home' for simple breadcrumbs
        void navigateWithContext(href, {
          from: 'home',
          skillName: label,
        });
      } else if (href === '/skills/my-skills') {
        void navigateWithContext(href, { from: 'home' });
      } else if (href === '/skills') {
        void navigateWithContext(href, { from: 'home' });
      } else {
        void navigateWithContext(href, navigationContext);
      }
    },
    [navigateWithContext, navigationContext]
  );

  // Loading state
  const isPageLoading = isLoading(LoadingKeys.FETCH_DATA) || (skillsLoading && !selectedSkill);

  if (isPageLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
        {/* Navigation skeleton */}
        <Box sx={{ mb: 3 }}>
          <SkeletonLoader variant="text" width={80} height={32} sx={{ mb: 2 }} />
          <SkeletonLoader variant="text" width={400} height={20} />
        </Box>

        {/* Header skeleton */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Box>
              <SkeletonLoader variant="text" width={180} height={40} sx={{ mb: 1 }} />
              <SkeletonLoader variant="text" width={300} height={20} />
            </Box>
            <SkeletonLoader variant="text" width={100} height={36} />
          </Box>
        </Paper>

        {/* Form skeleton */}
        <Paper sx={{ p: 3 }}>
          <SkeletonLoader variant="text" width="100%" height={56} sx={{ mb: 3 }} />
          <SkeletonLoader variant="text" width="100%" height={120} sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <SkeletonLoader variant="text" width="50%" height={56} />
            <SkeletonLoader variant="text" width="50%" height={56} />
          </Box>
          <SkeletonLoader variant="text" width="100%" height={56} sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <SkeletonLoader variant="text" width={100} height={36} />
            <SkeletonLoader variant="text" width={120} height={36} />
          </Box>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (errorMessage && !selectedSkill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description="Der Skill konnte nicht geladen werden oder existiert nicht."
          actionLabel="Zurück zu meinen Skills"
          actionHandler={() => {
            void navigate(MY_SKILLS_ROUTE);
          }}
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
          description="Der Skill, den du bearbeiten möchtest, existiert nicht."
          actionLabel="Zurück zu meinen Skills"
          actionHandler={() => {
            void navigate(MY_SKILLS_ROUTE);
          }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
      {/* Navigation */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Zurück
        </Button>

        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          {contextualBreadcrumbs.map((item, index) => {
            const isLast = index === contextualBreadcrumbs.length - 1;

            if (isLast || item.isActive === true) {
              return (
                <Typography key={item.label} color="text.primary">
                  {item.label}
                </Typography>
              );
            }

            return (
              <Link
                key={item.label}
                color="inherit"
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.href) {
                    handleBreadcrumbClick(item.href, item.label);
                  }
                }}
                sx={{ cursor: 'pointer' }}
              >
                {item.label}
              </Link>
            );
          })}
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
              Aktualisiere die Details deines Skills &quot;{selectedSkill.name}&quot;
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <LoadingButton
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={isUpdating || isLoading(LoadingKeys.UPDATE_SKILL)}
            >
              Abbrechen
            </LoadingButton>
          </Box>
        </Box>

        {/* Notification */}
        {notification ? (
          <Alert
            severity={notification.type}
            onClose={() => {
              setNotification(null);
            }}
            sx={{ mb: 2 }}
          >
            {notification.message}
          </Alert>
        ) : null}

        {/* Error display */}
        {errorMessage ? (
          <Alert severity="error" onClose={dismissError} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}
      </Paper>

      {/* Edit Form */}
      <Paper sx={{ p: 3 }}>
        {categories.length > 0 && proficiencyLevels.length > 0 ? (
          <SkillForm
            open // Always open since it's embedded in the page
            onClose={handleCancel}
            onSubmit={(skillData) => {
              handleSubmit(skillData as UpdateSkillFormData);
            }}
            categories={categories}
            proficiencyLevels={proficiencyLevels}
            loading={isUpdating || isLoading(LoadingKeys.UPDATE_SKILL)}
            skill={selectedSkill}
            title="" // No title needed since we have the page header
            userOfferedSkills={userSkills.filter((s) => s.isOffered && s.id !== selectedSkill.id)}
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
          <LoadingButton
            variant="outlined"
            onClick={() => {
              void navigate(`/skills/${skillId ?? ''}`);
            }}
            disabled={isUpdating || isLoading(LoadingKeys.UPDATE_SKILL)}
          >
            Vorschau anzeigen
          </LoadingButton>
        </Box>
      </Box>
    </Container>
  );
};

const WrappedSkillEditPage: React.FC = () => (
  <SkillErrorBoundary>
    <SkillEditPage />
  </SkillErrorBoundary>
);

export default WrappedSkillEditPage;
