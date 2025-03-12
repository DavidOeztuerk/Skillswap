import { RequestState } from '../common/RequestState';
import { ProficiencyLevel, Skill, SkillCategory } from '../models/Skill';

export interface SkillState extends RequestState {
  skills: Skill[] | undefined;
  userSkills: Skill[] | undefined;
  filteredSkills: Skill[] | undefined;
  searchTerm: string;
  selectedSkill: Skill | undefined;
  selectedCategory: SkillCategory | undefined;
  selectedProfiencyLevel: ProficiencyLevel | undefined;
}
