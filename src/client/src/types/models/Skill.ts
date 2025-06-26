export interface Skill {
  id: string;
  name: string;
  description: string;
  isOffering: boolean;
  skillCategoryId: string;
  proficiencyLevelId: string;
  skillCategory?: SkillCategory;
  proficiencyLevel?: ProficiencyLevel;
}

export interface SkillCategory {
  categoryId: string;
  name: string;
}

export interface ProficiencyLevel {
  levelId: string;
  level: string;
  rank: number;
}
