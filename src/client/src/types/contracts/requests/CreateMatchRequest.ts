export interface CreateMatchRequest {
  skillId: string;
  targetUserId: string;
  message: string;
  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  isMonetary?: boolean;
  offeredAmount?: number;
  currency?: string;
  sessionDurationMinutes?: number;
  totalSessions?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  // Frontend-only fields for display
  description?: string;
  skillName?: string;
  exchangeSkillName?: string;
}
