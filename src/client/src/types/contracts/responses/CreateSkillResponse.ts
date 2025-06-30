export interface CreateSkillResponse {
  id: string;
  userId: string;
  name: string;
  description: string;
  isOffering: boolean;
  skillCategoryId: string;
  proficiencyLevelId: string;
}
