import { Skill } from './Skill';
import { User } from './User';

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
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Expired = 'expired',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Active = 'active',
  Dissolved = 'dissolved'
}
