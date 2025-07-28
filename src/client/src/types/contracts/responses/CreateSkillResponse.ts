
export interface CreateSkillResponse {
  skillId: string;
  name: string;
  description: string;
  categoryName: string;
  proficiencyLevelName: string;
  tags: string[];
  isOffered: boolean;
  isWanted: boolean;
  status: string;
  createdAt: string;
}
