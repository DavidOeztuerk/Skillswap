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
  id: string;
  name: string;
}

export interface ProficiencyLevel {
  id: string;
  level: string;
  rank: number;
}
