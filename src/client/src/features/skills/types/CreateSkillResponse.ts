export interface CreateSkillResponse {
  skillId: string;
  name: string;
  description: string;
  categoryId: string;
  tags: string[];
  isOffered: boolean;
  status: string;
  createdAt: string;
}

export interface SkillCategoryResponse {
  categoryId: string;
  name: string;
  iconName?: string;
  color?: string;
  skillCount?: number;
}
