import { ProficiencyLevel } from "../../models/UserSkill";

export interface AddUserSkillRequest {
  skillId: string;
  proficiencyLevel: ProficiencyLevel;
  isTeachable: boolean;
  isLearnable: boolean;
  description?: string;
}
