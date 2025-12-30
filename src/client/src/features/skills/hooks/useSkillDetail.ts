/**
 * useSkillDetail Hook
 *
 * Custom hook that manages all state and logic for the SkillDetailPage.
 * Extracts business logic from the UI component for better separation of concerns.
 */

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEmailVerificationContext } from '../../../core/contexts/emailVerificationContextHook';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import errorService from '../../../core/services/errorService';
import useToast from '../../../shared/hooks/useToast';
import { trackMatchRequestClick } from '../../../shared/utils/analytics';
import { Permissions } from '../../auth/components/permissions.constants';
import useAuth from '../../auth/hooks/useAuth';
import useMatchmaking from '../../matchmaking/hooks/useMatchmaking';
import useSkills from './useSkills';
import type { CreateMatchRequest } from '../../matchmaking/types/CreateMatchRequest';
import type { MatchRequestDisplay } from '../../matchmaking/types/MatchmakingDisplay';
import type { UseSkillDetailReturn, StatusMessage, SkillOwnerInfo } from '../types/types';

export const useSkillDetail = (): UseSkillDetailReturn => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const { hasPermission } = usePermissions();

  // Memoize permission checks
  const canUpdateOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.UPDATE_OWN),
    [hasPermission]
  );
  const canDeleteOwnSkill = useMemo(
    () => hasPermission(Permissions.Skills.DELETE_OWN),
    [hasPermission]
  );

  const {
    selectedSkill,
    userSkills,
    fetchSkillById,
    deleteSkill,
    rateSkill,
    endorseSkill,
    isLoading: skillsLoading,
    errorMessage,
    dismissError,
    isFavoriteSkill,
    addFavoriteSkill,
    removeFavoriteSkill,
  } = useSkills();

  const {
    sendMatchRequest,
    outgoingRequests,
    loadOutgoingRequests,
    isLoading: isMatchmakingLoading,
    error: matchmakingError,
  } = useMatchmaking();

  const { needsVerification, openVerificationModal } = useEmailVerificationContext();

  // Local state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [endorseDialogOpen, setEndorseDialogOpen] = useState(false);
  const [matchFormOpen, setMatchFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | undefined>();
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [cameFromMySkills, setCameFromMySkills] = useState(false);

  // Refs to prevent double execution
  const hasOpenedMatchForm = useRef(false);
  const hasRedirectedOwnSkill = useRef(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [skillId]);

  // Load skill data - simple fetch when skillId changes
  useEffect(() => {
    if (!skillId) return;
    void fetchSkillById(skillId);
  }, [skillId, fetchSkillById]);

  // Robust isOwner check
  const isOwner = useMemo(() => {
    if (!selectedSkill) return false;
    if (user?.id && selectedSkill.userId) {
      return user.id === selectedSkill.userId;
    }
    return userSkills.some((userSkill) => userSkill.id === selectedSkill.id);
  }, [selectedSkill, user, userSkills]);

  // Check for automatic match form opening
  useEffect(() => {
    const shouldShowMatchForm = searchParams.get('showMatchForm') === 'true';
    if (!shouldShowMatchForm || !selectedSkill) return;
    if (isAuthenticated && !user) return;

    if (isOwner) {
      if (hasRedirectedOwnSkill.current) return;
      hasRedirectedOwnSkill.current = true;

      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showMatchForm');
      setSearchParams(newSearchParams, { replace: true });
      toast.info('Das ist dein eigener Skill - du wurdest zum Dashboard weitergeleitet.');
      void navigate('/dashboard', { replace: true });
      return;
    }

    if (!hasOpenedMatchForm.current) {
      hasOpenedMatchForm.current = true;
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showMatchForm');
      setSearchParams(newSearchParams, { replace: true });
      queueMicrotask(() => {
        setMatchFormOpen(true);
      });
    }
  }, [
    selectedSkill,
    isOwner,
    isAuthenticated,
    user,
    searchParams,
    setSearchParams,
    toast,
    navigate,
  ]);

  // Check referrer
  useEffect(() => {
    const { referrer } = document;
    const cameFromMy = referrer.includes('/skills/my-skills') || isOwner;
    queueMicrotask(() => {
      setCameFromMySkills(cameFromMy);
    });
  }, [isOwner]);

  // Computed values
  const isFavorite = useMemo(
    () => (selectedSkill?.id ? isFavoriteSkill(selectedSkill.id) : false),
    [selectedSkill, isFavoriteSkill]
  );

  const getOwnerName = useCallback((): string => {
    if (!selectedSkill) return 'Skill-Besitzer';
    if (isOwner) return 'Du';
    if (selectedSkill.ownerUserName) return selectedSkill.ownerUserName;
    if (selectedSkill.ownerFirstName && selectedSkill.ownerLastName) {
      return `${selectedSkill.ownerFirstName} ${selectedSkill.ownerLastName}`;
    }
    return 'Skill-Besitzer';
  }, [selectedSkill, isOwner]);

  const skillOwner = useMemo<SkillOwnerInfo>(
    () => ({
      name: getOwnerName(),
      memberSince: selectedSkill?.ownerMemberSince
        ? new Date(selectedSkill.ownerMemberSince).getFullYear().toString()
        : '2024',
      rating: selectedSkill?.ownerRating ?? 0,
      avatar: '',
    }),
    [selectedSkill, getOwnerName]
  );

  // Handlers
  const handleBookmark = useCallback((): void => {
    if (!selectedSkill?.id) return;

    const isFav = isFavoriteSkill(selectedSkill.id);
    if (isFav) {
      errorService.addBreadcrumb('Removing skill from favorites', 'action', {
        skillId: selectedSkill.id,
      });
      removeFavoriteSkill(selectedSkill.id);
      setStatusMessage({ text: 'Aus Favoriten entfernt', type: 'success' });
    } else {
      errorService.addBreadcrumb('Adding skill to favorites', 'action', {
        skillId: selectedSkill.id,
      });
      addFavoriteSkill(selectedSkill.id);
      setStatusMessage({ text: 'Zu Favoriten hinzugefügt', type: 'success' });
    }
  }, [selectedSkill, isFavoriteSkill, removeFavoriteSkill, addFavoriteSkill]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (selectedSkill) {
      try {
        errorService.addBreadcrumb('Sharing skill via native share', 'action', {
          skillId: selectedSkill.id,
        });
        await navigator.share({
          title: selectedSkill.name,
          text: selectedSkill.description,
          url: window.location.href,
        });
      } catch {
        errorService.addBreadcrumb('Share cancelled by user', 'ui', { skillId: selectedSkill.id });
      }
    } else {
      void navigator.clipboard.writeText(window.location.href);
      setStatusMessage({ text: 'Link in Zwischenablage kopiert', type: 'success' });
    }
  }, [selectedSkill]);

  const handleRateSkill = useCallback(
    (rating: number, review: string): void => {
      if (!skillId || isOwner) return;
      errorService.addBreadcrumb('Rating skill', 'form', { skillId, rating });
      rateSkill(skillId, rating, review);
      setStatusMessage({ text: 'Bewertung erfolgreich abgegeben', type: 'success' });
      setRatingDialogOpen(false);
    },
    [skillId, isOwner, rateSkill]
  );

  const handleEndorseSkill = useCallback(
    (message: string): void => {
      if (!skillId || isOwner) return;
      errorService.addBreadcrumb('Endorsing skill', 'form', { skillId });
      endorseSkill(skillId, message);
      setStatusMessage({ text: 'Empfehlung erfolgreich abgegeben', type: 'success' });
      setEndorseDialogOpen(false);
    },
    [skillId, isOwner, endorseSkill]
  );

  const handleDeleteSkill = useCallback((): void => {
    if (!skillId || !isOwner) return;
    errorService.addBreadcrumb('Deleting skill', 'action', { skillId });
    deleteSkill(skillId);
    void navigate('/skills/my-skills');
  }, [skillId, isOwner, deleteSkill, navigate]);

  const handleCreateMatch = useCallback(async (): Promise<void> => {
    if (!selectedSkill) return;

    if (!isAuthenticated) {
      errorService.addBreadcrumb(
        'Guest tried to create match - redirecting to login',
        'navigation',
        {
          skillId: selectedSkill.id,
        }
      );
      trackMatchRequestClick(selectedSkill.id, false);
      await navigate('/auth/login', {
        state: { from: location, action: 'createMatch', skillId: selectedSkill.id },
      });
      return;
    }

    if (isOwner) {
      errorService.addBreadcrumb('User tried to match own skill', 'ui', {
        skillId: selectedSkill.id,
      });
      setStatusMessage({
        text: 'Du kannst kein Match mit deinem eigenen Skill erstellen',
        type: 'info',
      });
      return;
    }

    errorService.addBreadcrumb('Opening match form', 'ui', { skillId: selectedSkill.id });
    setMatchFormOpen(true);
  }, [selectedSkill, isAuthenticated, isOwner, navigate, location]);

  const handleMatchSubmit = useCallback(
    async (data: CreateMatchRequest): Promise<boolean> => {
      if (!selectedSkill) {
        setStatusMessage({ text: 'Fehler: Kein Skill ausgewählt', type: 'error' });
        return false;
      }

      if (isSubmittingMatch) return false;

      const existingRequest = outgoingRequests.find(
        (req: MatchRequestDisplay) =>
          req.skillId === selectedSkill.id &&
          (req.status === 'pending' || req.status === 'accepted')
      );

      if (existingRequest) {
        setStatusMessage({
          text: 'Sie haben bereits eine laufende Anfrage für diesen Skill',
          type: 'warning',
        });
        return false;
      }

      if (needsVerification) {
        setStatusMessage({
          text: 'Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse, um Match-Anfragen senden zu können.',
          type: 'warning',
        });
        openVerificationModal();
        return false;
      }

      setIsSubmittingMatch(true);

      const command: CreateMatchRequest = {
        skillId: selectedSkill.id,
        targetUserId: selectedSkill.userId,
        message: data.message || 'Ich möchte diesen Skill lernen',
        isSkillExchange: data.isSkillExchange,
        exchangeSkillId: data.exchangeSkillId,
        isMonetary: data.isMonetary,
        offeredAmount: data.offeredAmount,
        currency: data.currency,
        sessionDurationMinutes: data.sessionDurationMinutes,
        totalSessions: data.totalSessions,
        preferredDays: data.preferredDays,
        preferredTimes: data.preferredTimes,
        description: data.description ?? 'Match-Anfrage von Skill-Detail-Seite',
        skillName: selectedSkill.name,
        exchangeSkillName: data.exchangeSkillName,
      };

      try {
        sendMatchRequest(command);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });

        if (matchmakingError) {
          setStatusMessage({ text: `Fehler: ${matchmakingError}`, type: 'error' });
          setIsSubmittingMatch(false);
          return false;
        }

        setMatchFormOpen(false);
        setStatusMessage({
          text: 'Match-Anfrage erfolgreich erstellt! Sie werden zu Ihren Anfragen weitergeleitet...',
          type: 'success',
        });

        loadOutgoingRequests();

        setTimeout(() => {
          void navigate('/matchmaking?tab=1');
        }, 1500);

        setIsSubmittingMatch(false);
        return true;
      } catch {
        setStatusMessage({ text: 'Fehler beim Erstellen der Match-Anfrage', type: 'error' });
        setIsSubmittingMatch(false);
        return false;
      }
    },
    [
      selectedSkill,
      isSubmittingMatch,
      outgoingRequests,
      needsVerification,
      openVerificationModal,
      sendMatchRequest,
      matchmakingError,
      loadOutgoingRequests,
      navigate,
    ]
  );

  const handleEdit = useCallback((): void => {
    if (!skillId || !isOwner) {
      setStatusMessage({ text: 'Du kannst nur deine eigenen Skills bearbeiten', type: 'error' });
      return;
    }
    void navigate(`/skills/${skillId}/edit`);
  }, [skillId, isOwner, navigate]);

  const handleBack = useCallback((): void => {
    let targetRoute: string;
    if (!isAuthenticated) {
      targetRoute = '/';
    } else if (isOwner || cameFromMySkills) {
      targetRoute = '/skills/my-skills';
    } else {
      targetRoute = '/skills';
    }
    void navigate(targetRoute);
  }, [isAuthenticated, isOwner, cameFromMySkills, navigate]);

  // Loading state
  const isPageLoading = skillsLoading && !selectedSkill;

  return {
    skill: selectedSkill,
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
  };
};

export default useSkillDetail;
