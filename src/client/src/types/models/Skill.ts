export interface Skill {
  skillId: string;
  userId: string;
  name: string;
  description: string;
  isOffering: boolean;
  category?: SkillCategory;
  proficiencyLevel?: ProficiencyLevel;
}

export interface SkillCategory {
  categoryId: string;
  name: string;
  iconName?: string;
  color?: string;
}

export interface ProficiencyLevel {
  levelId: string;
  level: string;
  rank: number;
  color?: string;
}
