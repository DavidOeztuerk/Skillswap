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

export interface SkillCategoryResponse {
  categoryId: string,
  name: string,
  iconName?: string,
  color?: string,
  skillCount?: number
}

export interface ProficiencyLevelResponse{
  levelId: string,
  Level: string,
  rank: number,
  color?: string,
  skillCount?: number
}