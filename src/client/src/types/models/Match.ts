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
  createdAt: string;
  updatedAt: string;
}

export enum MatchStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Expired = 'Expired',
}
