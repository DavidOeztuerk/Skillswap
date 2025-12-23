/**
 * SkillDetailPage Component
 *
 * Main page for displaying skill details.
 * Uses modular sub-components for better maintainability.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  Message as MessageIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
// Local components
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Divider,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
} from '@mui/material';
import SkillErrorBoundary from '../../../shared/components/error/SkillErrorBoundary';
import SEO from '../../../shared/components/seo/Seo';
import AlertMessage from '../../../shared/components/ui/AlertMessage';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { useAuth } from '../../auth/hooks/useAuth';
import MatchForm from '../../matchmaking/components/MatchForm';
import { useSkillDetail } from '../hooks/useSkillDetail';
import { SkillDetailHeader } from './detail/SkillDetailHeader';
import { SkillDetailLoadingSkeleton } from './detail/SkillDetailLoadingSkeleton';
import { SkillDetailSidebar } from './detail/SkillDetailSidebar';
import { SkillEndorseDialog } from './detail/SkillEndorseDialog';
import { SkillRatingDialog } from './detail/SkillRatingDialog';
import { SkillReviewsSection } from './detail/SkillReviewsSection';
import type { Skill } from '../types/Skill';

// ============================================================================
// Sub-components to reduce cognitive complexity
// ============================================================================

interface BreadcrumbNavProps {
  isAuthenticated: boolean;
  isOwner: boolean;
  cameFromMySkills: boolean;
  skillName: string;
  onBack: () => void;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  isAuthenticated,
  isOwner,
  cameFromMySkills,
  skillName,
  onBack,
}) => {
  const getBreadcrumbHref = (): string => {
    if (!isAuthenticated) return '/';
    return isOwner || cameFromMySkills ? '/skills/my-skills' : '/skills';
  };

  const getBreadcrumbLabel = (): string => {
    if (!isAuthenticated) return 'Startseite';
    return isOwner || cameFromMySkills ? 'Meine Skills' : 'Alle Skills';
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        Zurück
      </Button>

      <Breadcrumbs aria-label="breadcrumb">
        <Link
          color="inherit"
          href={getBreadcrumbHref()}
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          sx={{ cursor: 'pointer' }}
        >
          {getBreadcrumbLabel()}
        </Link>
        <Typography color="text.primary">{skillName}</Typography>
      </Breadcrumbs>
    </Box>
  );
};

interface ActionButtonsProps {
  skill: Skill;
  isOwner: boolean;
  isAuthenticated: boolean;
  canUpdateOwnSkill: boolean;
  isMatchmakingLoading: boolean;
  onCreateMatch: () => void;
  onRatingOpen: () => void;
  onEndorseOpen: () => void;
  onEdit: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  skill,
  isOwner,
  isAuthenticated,
  canUpdateOwnSkill,
  isMatchmakingLoading,
  onCreateMatch,
  onRatingOpen,
  onEndorseOpen,
  onEdit,
}) => {
  if (!isOwner && isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <LoadingButton
          variant="contained"
          color="primary"
          startIcon={<MessageIcon />}
          onClick={onCreateMatch}
          loading={isMatchmakingLoading}
        >
          {skill.isOffered ? 'Lernen anfragen' : 'Hilfe anbieten'}
        </LoadingButton>
        <Button variant="outlined" startIcon={<StarIcon />} onClick={onRatingOpen}>
          Bewerten
        </Button>
        <Button variant="outlined" startIcon={<ThumbUpIcon />} onClick={onEndorseOpen}>
          Empfehlen
        </Button>
      </Box>
    );
  }

  if (isOwner && canUpdateOwnSkill) {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
          Skill bearbeiten
        </Button>
      </Box>
    );
  }

  return null;
};

interface DialogsSectionProps {
  skill: Skill;
  isOwner: boolean;
  canDeleteOwnSkill: boolean;
  ratingDialogOpen: boolean;
  endorseDialogOpen: boolean;
  matchFormOpen: boolean;
  deleteDialogOpen: boolean;
  isMatchmakingLoading: boolean;
  matchmakingError: string | undefined;
  onRatingClose: () => void;
  onEndorseClose: () => void;
  onMatchClose: () => void;
  onDeleteClose: () => void;
  onRateSkill: (rating: number, comment: string) => void;
  onEndorseSkill: (comment: string) => void;
  onMatchSubmit: ReturnType<typeof useSkillDetail>['handleMatchSubmit'];
  onDeleteSkill: () => void;
  getOwnerName: () => string;
}

const DialogsSection: React.FC<DialogsSectionProps> = ({
  skill,
  isOwner,
  canDeleteOwnSkill,
  ratingDialogOpen,
  endorseDialogOpen,
  matchFormOpen,
  deleteDialogOpen,
  isMatchmakingLoading,
  matchmakingError,
  onRatingClose,
  onEndorseClose,
  onMatchClose,
  onDeleteClose,
  onRateSkill,
  onEndorseSkill,
  onMatchSubmit,
  onDeleteSkill,
  getOwnerName,
}) => (
  <>
    {isOwner ? null : (
      <>
        <SkillRatingDialog open={ratingDialogOpen} onClose={onRatingClose} onSubmit={onRateSkill} />
        <SkillEndorseDialog
          open={endorseDialogOpen}
          onClose={onEndorseClose}
          onSubmit={onEndorseSkill}
        />
      </>
    )}

    {skill.id && !isOwner ? (
      <MatchForm
        open={matchFormOpen}
        onClose={onMatchClose}
        onSubmit={onMatchSubmit}
        skill={skill}
        targetUserId={skill.userId}
        targetUserName={getOwnerName()}
        isLoading={isMatchmakingLoading}
        error={matchmakingError}
      />
    ) : null}

    {isOwner && canDeleteOwnSkill ? (
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Skill löschen"
        message={`Bist du sicher, dass du "${skill.name}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        confirmColor="error"
        onConfirm={onDeleteSkill}
        onCancel={onDeleteClose}
      />
    ) : null}
  </>
);

const SkillDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const {
    skill,
    isOwner,
    isFavorite,
    skillOwner,
    statusMessage,
    isPageLoading,
    errorMessage,
    cameFromMySkills,
    ratingDialogOpen,
    endorseDialogOpen,
    matchFormOpen,
    deleteDialogOpen,
    canUpdateOwnSkill,
    canDeleteOwnSkill,
    isMatchmakingLoading,
    matchmakingError,
    handleBookmark,
    handleShare,
    handleRateSkill,
    handleEndorseSkill,
    handleDeleteSkill,
    handleCreateMatch,
    handleMatchSubmit,
    handleEdit,
    handleBack,
    getOwnerName,
    setRatingDialogOpen,
    setEndorseDialogOpen,
    setMatchFormOpen,
    setDeleteDialogOpen,
    setStatusMessage,
    dismissError,
  } = useSkillDetail();

  // Loading state
  if (isPageLoading) {
    return <SkillDetailLoadingSkeleton />;
  }

  // Error state
  if (errorMessage && !skill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description="Der angeforderte Skill existiert nicht oder ist nicht verfügbar."
          actionLabel="Zurück zu Skills"
          actionHandler={() => navigate('/skills')}
        />
      </Container>
    );
  }

  if (!skill) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <EmptyState
          title="Skill nicht gefunden"
          description="Der angeforderte Skill existiert nicht oder ist nicht verfügbar."
          actionLabel="Zurück zu Skills"
          actionHandler={() => navigate('/skills')}
        />
      </Container>
    );
  }

  const reviewCount = skill.reviewCount ?? 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      {/* SEO */}
      {skill.id ? (
        <SEO
          title={`${skill.name} - ${skill.category.name || 'Skill'}`}
          description={
            skill.description ||
            `Lerne ${skill.name}. ${skill.proficiencyLevel.level || ''} Niveau.`
          }
          keywords={[
            skill.name,
            skill.category.name || '',
            skill.proficiencyLevel.level || '',
            'Skill lernen',
          ]}
          type="article"
        />
      ) : null}

      {/* Status messages */}
      {statusMessage ? (
        <Alert
          severity={statusMessage.type}
          onClose={() => {
            setStatusMessage(undefined);
          }}
          sx={{ mb: 2 }}
        >
          {statusMessage.text}
        </Alert>
      ) : null}

      {/* Error messages */}
      {errorMessage ? (
        <AlertMessage
          message={errorMessage ? [errorMessage] : ['Ein unerwarteter Fehler ist aufgetreten']}
          severity="error"
          onClose={dismissError}
        />
      ) : null}

      {/* Navigation */}
      <BreadcrumbNav
        isAuthenticated={isAuthenticated}
        isOwner={isOwner}
        cameFromMySkills={cameFromMySkills}
        skillName={skill.name}
        onBack={handleBack}
      />

      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Header */}
            <SkillDetailHeader
              skill={skill}
              isOwner={isOwner}
              isFavorite={isFavorite}
              canUpdateOwnSkill={canUpdateOwnSkill}
              canDeleteOwnSkill={canDeleteOwnSkill}
              onBookmark={handleBookmark}
              onShare={handleShare}
              onEdit={handleEdit}
              onDelete={() => {
                setDeleteDialogOpen(true);
              }}
            />

            {/* Description */}
            <Typography variant="body1" sx={{ mb: 2 }}>
              {skill.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Action buttons */}
            <ActionButtons
              skill={skill}
              isOwner={isOwner}
              isAuthenticated={isAuthenticated}
              canUpdateOwnSkill={canUpdateOwnSkill}
              isMatchmakingLoading={isMatchmakingLoading}
              onCreateMatch={handleCreateMatch}
              onRatingOpen={() => {
                setRatingDialogOpen(true);
              }}
              onEndorseOpen={() => {
                setEndorseDialogOpen(true);
              }}
              onEdit={handleEdit}
            />
          </Paper>

          {/* Reviews section */}
          <SkillReviewsSection reviewCount={reviewCount} isOwner={isOwner} />
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <SkillDetailSidebar
            skill={skill}
            skillOwner={skillOwner}
            isOwner={isOwner}
            isAuthenticated={isAuthenticated}
            canUpdateOwnSkill={canUpdateOwnSkill}
            canDeleteOwnSkill={canDeleteOwnSkill}
            isMatchmakingLoading={isMatchmakingLoading}
            onCreateMatch={handleCreateMatch}
            onEdit={handleEdit}
            onDelete={() => {
              setDeleteDialogOpen(true);
            }}
          />
        </Grid>
      </Grid>

      {/* Dialogs */}
      <DialogsSection
        skill={skill}
        isOwner={isOwner}
        canDeleteOwnSkill={canDeleteOwnSkill}
        ratingDialogOpen={ratingDialogOpen}
        endorseDialogOpen={endorseDialogOpen}
        matchFormOpen={matchFormOpen}
        deleteDialogOpen={deleteDialogOpen}
        isMatchmakingLoading={isMatchmakingLoading}
        matchmakingError={matchmakingError}
        onRatingClose={() => {
          setRatingDialogOpen(false);
        }}
        onEndorseClose={() => {
          setEndorseDialogOpen(false);
        }}
        onMatchClose={() => {
          setMatchFormOpen(false);
        }}
        onDeleteClose={() => {
          setDeleteDialogOpen(false);
        }}
        onRateSkill={handleRateSkill}
        onEndorseSkill={handleEndorseSkill}
        onMatchSubmit={handleMatchSubmit}
        onDeleteSkill={handleDeleteSkill}
        getOwnerName={getOwnerName}
      />
    </Container>
  );
};

const WrappedSkillDetailPage: React.FC = () => (
  <SkillErrorBoundary>
    <SkillDetailPage />
  </SkillErrorBoundary>
);

export default WrappedSkillDetailPage;
