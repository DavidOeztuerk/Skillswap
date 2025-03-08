export interface MatchRequest {
  skillId: string;
  isLearningMode: boolean;
  preferredDays: string[];
  preferredTimes: string[];
  additionalNotes?: string;
}
