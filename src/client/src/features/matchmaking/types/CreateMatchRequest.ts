import type { ExchangeType } from '../constants/scheduling';

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

  // NEW: Total duration for intelligent session calculation
  totalDurationMinutes?: number;

  // NEW: Exchange type (skill_exchange, payment, free)
  exchangeType?: ExchangeType;

  // NEW: Hourly rate for payment type
  hourlyRate?: number;

  // NEW: Whether user is offering (teaching) or seeking (learning)
  isOffering?: boolean;

  // Frontend-only fields for display
  description?: string;
  skillName?: string;
  exchangeSkillName?: string;
}
