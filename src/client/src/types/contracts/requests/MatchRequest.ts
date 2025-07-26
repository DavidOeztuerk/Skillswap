// export interface MatchRequest {
//   skillId: string;
//   isOffering: boolean;
//   preferredDays: string[];
//   preferredTimes: string[];
//   additionalNotes?: string;
// }

export interface MatchRequest {
  matchId: string;
  requesterId: string;
  requesterName: string;
  targetUserId: string;
  skillId: string;
  skillName: string;
  message: string;
  isOffering: boolean;
  status: string; // "Pending", "Accepted", "Rejected", "Expired"
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
}
