export interface CreateSkillRequest {
  name: string;
  description: string;
  isOffering: boolean;
  skillCategoryId: string;
  proficiencyLevelId: string;
  tags?: string[];
  estimatedDurationMinutes?: number;
  location?: string;
  isRemoteAvailable?: boolean;
}
