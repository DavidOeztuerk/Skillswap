import { RequestState } from '../common/RequestState';
import { Skill, SkillCategory } from '../models/Skill';
import { UserSkill } from '../models/UserSkill';

export interface SkillState extends RequestState {
  skills: Skill[];
  userSkills: UserSkill[];
  filteredSkills: Skill[];
  searchTerm: string;
  selectedCategory: SkillCategory | null;
}
