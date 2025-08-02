// export interface MatchRequest {
//   skillId: string;
//   isOffered: boolean;
//   preferredDays: string[];
//   preferredTimes: string[];
//   additionalNotes?: string;
// }

export interface MatchRequest {
  id: string; // Add missing id property
  // matchId: string;
  requesterId: string;
  // requesterName: string;
  targetUserId: string;
  skillId: string;
  // skillName: string;
  message: string;
  isOffered: boolean;
  isSkillExchange: boolean;
  exchangeSkillId?: string;
  threadId?: string;
  status: string; // "Pending", "Accepted", "Rejected", "Expired"
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
}
