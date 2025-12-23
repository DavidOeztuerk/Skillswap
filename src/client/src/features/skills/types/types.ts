/**
 * Skill Detail Page Types
 *
 * Centralized type definitions for the skill detail page components.
 */

import type { Skill } from './Skill';
import type { CreateMatchRequest } from '../../matchmaking/types/CreateMatchRequest';

// ============================================================================
// Status Message Types
// ============================================================================

export type StatusMessageType = 'success' | 'error' | 'info' | 'warning';

export interface StatusMessage {
  text: string;
  type: StatusMessageType;
}

// ============================================================================
// Skill Owner Types
// ============================================================================

export interface SkillOwnerInfo {
  name: string;
  memberSince: string;
  rating: number;
  avatar: string;
}

// ============================================================================
// Component Props
// ============================================================================

export interface SkillDetailHeaderProps {
  skill: Skill;
  isOwner: boolean;
  isFavorite: boolean;
  canUpdateOwnSkill: boolean;
  canDeleteOwnSkill: boolean;
  onBookmark: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface SkillDetailContentProps {
  skill: Skill;
  isOwner: boolean;
  isAuthenticated: boolean;
  canUpdateOwnSkill: boolean;
  isMatchmakingLoading: boolean;
  onCreateMatch: () => void;
  onRate: () => void;
  onEndorse: () => void;
  onEdit: () => void;
}

export interface SkillDetailSidebarProps {
  skill: Skill;
  skillOwner: SkillOwnerInfo;
  isOwner: boolean;
  isAuthenticated: boolean;
  canUpdateOwnSkill: boolean;
  canDeleteOwnSkill: boolean;
  isMatchmakingLoading: boolean;
  onCreateMatch: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface SkillReviewsSectionProps {
  reviewCount: number;
  isOwner: boolean;
}

export interface SkillRatingDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
}

export interface SkillEndorseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

export interface SkillMatchFormWrapperProps {
  open: boolean;
  skill: Skill;
  targetUserName: string;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: CreateMatchRequest) => Promise<boolean>;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseSkillDetailReturn {
  // State
  skill: Skill | null;
  isOwner: boolean;
  isFavorite: boolean;
  skillOwner: SkillOwnerInfo;
  statusMessage: StatusMessage | undefined;
  isPageLoading: boolean;
  errorMessage: string | undefined;
  cameFromMySkills: boolean;

  // Dialog states
  ratingDialogOpen: boolean;
  endorseDialogOpen: boolean;
  matchFormOpen: boolean;
  deleteDialogOpen: boolean;

  // Permissions
  canUpdateOwnSkill: boolean;
  canDeleteOwnSkill: boolean;

  // Loading states
  isMatchmakingLoading: boolean;
  matchmakingError: string | undefined;

  // Handlers
  handleBookmark: () => void;
  handleShare: () => Promise<void>;
  handleRateSkill: (rating: number, review: string) => void;
  handleEndorseSkill: (message: string) => void;
  handleDeleteSkill: () => void;
  handleCreateMatch: () => Promise<void>;
  handleMatchSubmit: (data: CreateMatchRequest) => Promise<boolean>;
  handleEdit: () => void;
  handleBack: () => void;
  getOwnerName: () => string;

  // Dialog controls
  setRatingDialogOpen: (open: boolean) => void;
  setEndorseDialogOpen: (open: boolean) => void;
  setMatchFormOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setStatusMessage: (message: StatusMessage | undefined) => void;
  dismissError: () => void;
}
