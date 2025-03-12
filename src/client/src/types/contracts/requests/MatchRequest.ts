export interface MatchRequest {
  skillId: string;
  isOffering: boolean;
  preferredDays: string[];
  preferredTimes: string[];
  additionalNotes?: string;
}
