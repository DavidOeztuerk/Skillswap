export interface CreateMatchRequest {
  skillId: string;
  description: string;
  message: string;
  targetUserId: string;
  skillName?: string;
}
