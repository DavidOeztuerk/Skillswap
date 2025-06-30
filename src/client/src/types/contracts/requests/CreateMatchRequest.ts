export interface CreateMatchRequest {
  targetUserId: string;
  skillId: string;
  message: string;
  isLearningMode: boolean;
}
