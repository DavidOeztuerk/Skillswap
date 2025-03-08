import { Skill } from './Skill';

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skill: Skill;
  proficiencyLevel: ProficiencyLevel;
  isTeachable: boolean;
  isLearnable: boolean;
  description?: string;
  createdAt: string;
}

export enum ProficiencyLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
  Expert = 'Expert',
}
