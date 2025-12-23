import type { Skill } from '../../skills/types/Skill';
import type { User } from '../../user/types/User';

export interface Match {
  id: string;
  requesterId: string;
  requesterDetails: User;
  responderId: string;
  responderDetails: User;
  skillId: string;
  skill: Skill;
  isLearningMode: boolean;
  status: MatchStatus;
  preferredDays: string[];
  preferredTimes: string[];
  additionalNotes?: string;
  compatibilityScore: number;
  createdAt: string;
  updatedAt?: string;
  acceptedAt?: string;
}

export enum MatchStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Expired = 'Expired',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Active = 'Active',
  Dissolved = 'Dissolved',
}
