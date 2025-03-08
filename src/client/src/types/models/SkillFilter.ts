import { SkillCategory } from "./Skill";

export interface SkillFilter {
  category?: SkillCategory;
  searchTerm?: string;
}
