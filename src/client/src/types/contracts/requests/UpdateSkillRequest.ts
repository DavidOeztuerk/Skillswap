export interface UpdateSkillRequest {
  skillId: string;
  name?: string;
  description?: string;
  isOffered?: boolean; // true = offering, false = seeking to learn
  categoryId?: string;
  proficiencyLevelId?: string;
  tags?: string[];
  availableHours?: number;
  preferredSessionDuration?: number;
}
