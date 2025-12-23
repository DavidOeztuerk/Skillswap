export interface MatchRequest {
  id: string;
  threadId: string;
  requesterId: string;
  targetUserId: string;
  skillId: string;
  message: string;
  isOffered: boolean;
  isSkillExchange: boolean;
  exchangeSkillId?: string;
  status: string;
  requestedAt?: string;
  expiresAt?: string;
}
